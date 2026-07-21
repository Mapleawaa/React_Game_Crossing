import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Story } from 'inkjs'
import { beforeAll, describe, expect, it } from 'vitest'
import type { StoryFrame, StorySession } from './StoryController'
import { StoryController } from './StoryController'

const gameRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const storyJsonPath = join(gameRoot, 'src', 'story', 'generated', 'story.json')

const CRITICAL_CHOICE_IDS = [
  'observe-room',
  'accept-challenge',
  'join-them',
  'silent-stare',
] as const

function loadStoryJson(): unknown {
  return JSON.parse(readFileSync(storyJsonPath, 'utf8').replace(/^\uFEFF/, ''))
}

function seedAtKnot(storyJson: unknown, knot: string, week: 1 | 2 = 1): StorySession {
  const story = new Story(JSON.stringify(storyJson))
  if (story.variablesState) {
    try {
      ;(story.variablesState as { week?: number }).week = week
    } catch {
      // ignore if week global missing in partial fixtures
    }
  }
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

function advanceToChoices(controller: StoryController, session: StorySession, max = 500): StorySession {
  let current = session
  let steps = 0
  while (steps++ < max && current.frame.canContinue && current.frame.choices.length === 0) {
    current = controller.advance(current)
  }
  return current
}

function choiceIds(session: StorySession): string[] {
  return session.frame.choices.map((c) => c.id).sort()
}

function pick(controller: StoryController, session: StorySession, id: string): StorySession {
  const index = session.frame.choices.findIndex((c) => c.id === id)
  expect(index, `missing choice ${id}`).toBeGreaterThanOrEqual(0)
  return controller.choose(session, index)
}

describe('CH-01 chamber control flow (P0-3)', () => {
  let storyJson: unknown
  let controller: StoryController

  beforeAll(() => {
    storyJson = loadStoryJson()
    controller = new StoryController(storyJson, 'ch01-chamber-test')
  })

  it('week 1: observe-room returns to decision with critical choices still available', () => {
    const seeded = seedAtKnot(storyJson, 'ch01_chamber', 1)
    const decision = advanceToChoices(controller, controller.advance(seeded))

    expect(decision.frame.id).toBe('ch01-chamber')
    expect(decision.frame.checkpointId).toBe('cp-ch01-chamber')
    expect(choiceIds(decision)).toEqual([...CRITICAL_CHOICE_IDS].sort())

    const afterObserve = advanceToChoices(controller, pick(controller, decision, 'observe-room'))
    expect(afterObserve.frame.id).toBe('ch01-chamber')
    expect(afterObserve.frame.isComplete).toBe(false)
    expect(afterObserve.frame.checkpointId).toBe('cp-ch01-chamber')
    expect(choiceIds(afterObserve)).toEqual([...CRITICAL_CHOICE_IDS].sort())

    const accept = pick(controller, afterObserve, 'accept-challenge')
    expect(accept.frame.id).toBe('ch02-pistol')
  })

  it('week 2: observe includes newspaper then returns; D remains available once', () => {
    const seeded = seedAtKnot(storyJson, 'ch01_chamber', 2)
    const decision = advanceToChoices(controller, controller.advance(seeded))
    const week2Ids = [...CRITICAL_CHOICE_IDS, 'ch01-ask-about-father'].sort()
    expect(choiceIds(decision)).toEqual(week2Ids)

    let sawNewspaperTitle = false
    let current = pick(controller, decision, 'observe-room')
    let steps = 0
    while (steps++ < 200 && (current.frame.canContinue || current.frame.choices.length === 0)) {
      for (const line of current.frame.body) {
        if (line.includes('港务局调度员意外身亡')) sawNewspaperTitle = true
      }
      if (current.frame.choices.length > 0) break
      if (!current.frame.canContinue) break
      current = controller.advance(current)
    }

    expect(sawNewspaperTitle).toBe(true)
    expect(current.frame.id).toBe('ch01-chamber')
    expect(current.frame.isComplete).toBe(false)
    expect(choiceIds(current)).toEqual(week2Ids)

    const afterD = advanceToChoices(controller, pick(controller, current, 'ch01-ask-about-father'))
    expect(afterD.frame.id).toBe('ch02-pistol')
  })

  it('does not throw ran-out-of-content on observe or newspaper return', () => {
    for (const week of [1, 2] as const) {
      const story = new Story(JSON.stringify(storyJson))
      const errors: string[] = []
      story.onError = (message) => errors.push(message)
      try {
        ;(story.variablesState as { week?: number }).week = week
      } catch {
        // ignore
      }
      story.ChoosePathString('ch01_chamber')

      let steps = 0
      let observed = false
      while (steps++ < 500) {
        while (story.canContinue) {
          story.Continue()
        }
        if (errors.some((e) => /ran out of content/i.test(e))) break
        const choices = story.currentChoices
        if (!choices.length) break
        const observe = choices.findIndex((c) => (c.tags ?? []).some((t) => t.includes('observe-room')))
        if (!observed && observe >= 0) {
          story.ChooseChoiceIndex(observe)
          observed = true
          continue
        }
        const accept = choices.findIndex((c) =>
          (c.tags ?? []).some((t) => t.includes('accept-challenge')),
        )
        if (accept >= 0) {
          story.ChooseChoiceIndex(accept)
          break
        }
        story.ChooseChoiceIndex(0)
      }

      expect(
        errors.filter((e) => /ran out of content/i.test(e)),
        `week ${week}`,
      ).toEqual([])
      expect(observed, `week ${week}`).toBe(true)
    }
  })
})
