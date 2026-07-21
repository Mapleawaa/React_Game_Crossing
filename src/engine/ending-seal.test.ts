import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Story } from 'inkjs'
import { beforeAll, describe, expect, it } from 'vitest'
import type { StoryFrame, StorySession } from './StoryController'
import { StoryController } from './StoryController'

const gameRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const storyJsonPath = join(gameRoot, 'src', 'story', 'generated', 'story.json')

/** Pure terminal ending knots: must seal with -> END and finish isComplete. */
const PURE_TERMINAL_KNOTS = [
  'end01_sakura',
  'end03_moon',
  'end04_ember',
  'end05_twenty_years',
  'end_true_ferryman',
  'end_bad01_useless',
  'end_bad02_blunt',
  'end_bad03_dismember',
  'end_bad04_dawnDoor',
  'end_bad05_fatalPoint',
  'end_bad06_abyss_end',
  'end_bad07_escape',
  'end_a01_ferry',
  'end_a02_sinking',
  'end_a03_broken_anchor',
  'end_a04_echo',
] as const

const REPRESENTATIVE = [
  'end01_sakura',
  'end03_moon',
  'end04_ember',
  'end05_twenty_years',
  'end_true_ferryman',
  'end_bad01_useless',
  'end_bad07_escape',
  'end_a01_ferry',
  'end06_abyss',
  'end02_trash_hero',
] as const

function loadStoryJson(): unknown {
  return JSON.parse(readFileSync(storyJsonPath, 'utf8').replace(/^\uFEFF/, ''))
}

function drainInk(storyJson: unknown, knot: string) {
  const story = new Story(JSON.stringify(storyJson))
  const errors: string[] = []
  story.onError = (message) => {
    errors.push(message)
  }
  story.ChoosePathString(knot)

  const lines: string[] = []
  const choiceSnapshots: string[][] = []
  let steps = 0
  while (steps++ < 2000) {
    while (story.canContinue) {
      const line = story.Continue()
      if (line?.trim()) lines.push(line.trim())
    }
    if (errors.some((e) => /ran out of content/i.test(e))) break
    const texts = story.currentChoices.map((c) => c.text.trim())
    if (texts.length) choiceSnapshots.push(texts)
    if (!story.currentChoices.length) break
    story.ChooseChoiceIndex(0)
  }

  return {
    lines,
    choiceSnapshots,
    finalChoices: story.currentChoices.map((c) => c.text.trim()),
    canContinue: story.canContinue,
    errors,
  }
}

function seedSession(storyJson: unknown, knot: string): StorySession {
  const story = new Story(JSON.stringify(storyJson))
  story.ChoosePathString(knot)
  const bare: StoryFrame = {
    id: 'seed',
    routeNodeId: 'seed',
    title: 'seed',
    marker: 'seed',
    body: [],
    tags: [],
    choices: [],
    commands: [],
    canContinue: true,
    isComplete: false,
  }
  return { frame: bare, stateJson: story.state.ToJson() }
}

function advanceUntilStop(controller: StoryController, session: StorySession, max = 500): StorySession {
  let current = session
  let steps = 0
  while (steps++ < max) {
    if (current.frame.choices.length > 0) {
      current = controller.choose(current, 0)
      continue
    }
    if (!current.frame.canContinue) break
    current = controller.advance(current)
  }
  return current
}

function advanceUntilChoicesOrStop(
  controller: StoryController,
  session: StorySession,
  max = 500,
): StorySession {
  let current = session
  let steps = 0
  while (steps++ < max && current.frame.canContinue && current.frame.choices.length === 0) {
    current = controller.advance(current)
  }
  return current
}

describe('ending seal (P0-2)', () => {
  let storyJson: unknown
  let controller: StoryController

  beforeAll(() => {
    storyJson = loadStoryJson()
    controller = new StoryController(storyJson, 'ending-seal-test')
  })

  it('lists pure terminals and seals them without ran-out-of-content', () => {
    for (const knot of PURE_TERMINAL_KNOTS) {
      const result = drainInk(storyJson, knot)
      expect(result.errors.filter((e) => /ran out of content/i.test(e)), knot).toEqual([])
      expect(result.finalChoices, knot).toEqual([])
      expect(result.canContinue, knot).toBe(false)
      expect(result.lines.length, knot).toBeGreaterThan(0)
    }
  })

  it('representative paths reach isComplete without runtime content errors', () => {
    for (const knot of REPRESENTATIVE) {
      if (knot === 'end02_trash_hero' || knot === 'end06_abyss') continue
      const seeded = seedSession(storyJson, knot)
      const first = controller.advance(seeded)
      expect(first.frame.body.length, knot).toBeGreaterThan(0)
      const done = advanceUntilStop(controller, first)
      expect(done.frame.isComplete, knot).toBe(true)
      expect(done.frame.canContinue, knot).toBe(false)
      expect(done.frame.choices, knot).toEqual([])
      expect(done.frame.ending?.tone, knot).toBeTruthy()
    }
  })

  it('END-06 quick stop seals; continue still diverts to CH-A01', () => {
    const seeded = seedSession(storyJson, 'end06_abyss')
    const choiceFrame = advanceUntilChoicesOrStop(controller, controller.advance(seeded))
    expect(choiceFrame.frame.choices.map((c) => c.id).sort()).toEqual([
      'continue-to-betrayal',
      'stop-at-abyss',
    ])

    const stopIndex = choiceFrame.frame.choices.findIndex((c) => c.id === 'stop-at-abyss')
    const stopped = advanceUntilStop(controller, controller.choose(choiceFrame, stopIndex))
    expect(stopped.frame.isComplete).toBe(true)
    expect(stopped.frame.ending).toMatchObject({
      id: 'end06-abyss',
      hookId: 'end06-abyss',
      tone: 'pseudo',
    })

    const continueIndex = choiceFrame.frame.choices.findIndex((c) => c.id === 'continue-to-betrayal')
    const continued = advanceUntilChoicesOrStop(
      controller,
      controller.choose(choiceFrame, continueIndex),
    )
    expect(continued.frame.isComplete).toBe(false)
    expect(continued.frame.id).toBe('ch-a01-initiation')
    expect(continued.frame.ending).toBeFalsy()
  })

  it('END-02 keeps three branches; only stop-here seals END-02', () => {
    const seeded = seedSession(storyJson, 'end02_trash_hero')
    const choiceFrame = advanceUntilChoicesOrStop(controller, controller.advance(seeded))
    expect(choiceFrame.frame.isComplete).toBe(false)
    expect(choiceFrame.frame.ending).toBeFalsy()
    expect(choiceFrame.frame.choices.map((c) => c.id).sort()).toEqual([
      'end02-continue-ember',
      'end02-stop-here',
      'end02-stop-twenty-years',
    ])

    const emberIndex = choiceFrame.frame.choices.findIndex((c) => c.id === 'end02-continue-ember')
    const emberDone = advanceUntilStop(controller, controller.choose(choiceFrame, emberIndex))
    expect(emberDone.frame.isComplete).toBe(true)
    expect(emberDone.frame.id).toBe('end04-ember')
    expect(emberDone.frame.ending).toMatchObject({ id: 'end04-ember', tone: 'pseudo' })

    const yearsIndex = choiceFrame.frame.choices.findIndex(
      (c) => c.id === 'end02-stop-twenty-years',
    )
    const yearsDone = advanceUntilStop(controller, controller.choose(choiceFrame, yearsIndex))
    expect(yearsDone.frame.isComplete).toBe(true)
    expect(yearsDone.frame.id).toBe('end05-twenty-years')
    expect(yearsDone.frame.ending).toMatchObject({ id: 'end05-twenty-years', tone: 'pseudo' })

    const stopIndex = choiceFrame.frame.choices.findIndex((c) => c.id === 'end02-stop-here')
    const stopDone = advanceUntilStop(controller, controller.choose(choiceFrame, stopIndex))
    expect(stopDone.frame.isComplete).toBe(true)
    expect(stopDone.frame.id).toBe('end02-trash-hero')
    expect(stopDone.frame.ending).toMatchObject({
      id: 'end02-trash-hero',
      hookId: 'end02-trash-hero',
      tone: 'pseudo',
    })
  })
})
