import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Story } from 'inkjs'
import { beforeAll, describe, expect, it } from 'vitest'
import type { StorySession } from './StoryController'
import { StoryController } from './StoryController'
import type { StoryFrame } from './types'

const gameRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const storyJsonPath = join(gameRoot, 'src', 'story', 'generated', 'story.json')

function loadStoryJson(): unknown {
  return JSON.parse(readFileSync(storyJsonPath, 'utf8').replace(/^\uFEFF/, ''))
}

function simulateApplyMeta(frame: StoryFrame): { endingIds: string[]; hookIds: string[] } {
  const endingIds: string[] = []
  const hookIds: string[] = []
  if (frame.ending?.id) endingIds.push(frame.ending.id)
  if (frame.ending?.hookId) hookIds.push(frame.ending.hookId)
  return { endingIds, hookIds }
}

function seedAtKnot(storyJson: unknown, knot: string): StorySession {
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
    warnings: [],
    canContinue: true,
    continueMode: 'append',
    isComplete: false,
    revision: 0,
  }
  return { frame: bare, stateJson: story.state.ToJson() }
}

function advanceToChoices(
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

describe('END-02 META recording (P1-1)', () => {
  let storyJson: unknown
  let controller: StoryController

  beforeAll(() => {
    storyJson = loadStoryJson()
    controller = new StoryController(storyJson, 'meta-test')
  })

  it('entrance frame has no ending metadata', () => {
    const seeded = seedAtKnot(storyJson, 'end02_trash_hero')
    const entry = advanceToChoices(controller, controller.advance(seeded))
    expect(entry.frame.ending).toBeFalsy()
    expect(entry.frame.choices.map((c) => c.id).sort()).toEqual([
      'end02-continue-ember',
      'end02-stop-here',
      'end02-stop-twenty-years',
    ])
  })

  it('choosing stop-here records end02-trash-hero only', () => {
    const seeded = seedAtKnot(storyJson, 'end02_trash_hero')
    const entry = advanceToChoices(controller, controller.advance(seeded))
    const stop = entry.frame.choices.find((c) => c.id === 'end02-stop-here')!
    const afterStop = advanceUntilStop(controller, controller.choose(entry, stop.index))
    const meta = simulateApplyMeta(afterStop.frame)
    expect(meta).toEqual({ endingIds: ['end02-trash-hero'], hookIds: ['end02-trash-hero'] })
  })

  it('choosing ember path records end04-ember only, not end02', () => {
    const seeded = seedAtKnot(storyJson, 'end02_trash_hero')
    const entry = advanceToChoices(controller, controller.advance(seeded))
    const ember = entry.frame.choices.find((c) => c.id === 'end02-continue-ember')!
    const afterEmber = advanceUntilStop(controller, controller.choose(entry, ember.index))
    const meta = simulateApplyMeta(afterEmber.frame)
    expect(meta).toEqual({ endingIds: ['end04-ember'], hookIds: ['end04-ember'] })
  })

  it('choosing twenty-years path records end05-twenty-years only, not end02', () => {
    const seeded = seedAtKnot(storyJson, 'end02_trash_hero')
    const entry = advanceToChoices(controller, controller.advance(seeded))
    const years = entry.frame.choices.find((c) => c.id === 'end02-stop-twenty-years')!
    const afterYears = advanceUntilStop(controller, controller.choose(entry, years.index))
    const meta = simulateApplyMeta(afterYears.frame)
    expect(meta).toEqual({ endingIds: ['end05-twenty-years'], hookIds: ['end05-twenty-years'] })
  })
})
