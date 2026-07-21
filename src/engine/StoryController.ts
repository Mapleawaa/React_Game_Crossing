import { Story } from 'inkjs'
import storyBuild from '../story/generated/story-build.json'
import storyContent from '../story/generated/story.json'
import { getPrimaryRouteNodeId, getRouteNode } from '../story/routeTopology'
import type {
  EndingTone,
  StoryChoice,
  StoryCommand,
  StoryContinueMode,
  StoryFrame,
} from './types'

export interface StoryProfileContext {
  week: 1 | 2
  firstClear: boolean
  hookCount: number
}

export interface StorySession {
  frame: StoryFrame
  stateJson: string
}

export const STORY_HASH = storyBuild.storyHash

const endingTones = new Set<EndingTone>(['normal', 'pseudo', 'bad', 'true', 'betrayal'])

export class StoryControllerError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'StoryControllerError'
  }
}

export class StoryController {
  constructor(
    private readonly content: unknown = storyContent,
    readonly storyHash: string = STORY_HASH,
  ) {}

  start(context: StoryProfileContext): StorySession {
    const story = this.createStory()
    this.setGlobalIfPresent(story, 'week', context.week)
    this.setGlobalIfPresent(story, 'week1_clear', context.firstClear)
    this.setGlobalIfPresent(story, 'hooks_collected', context.hookCount)
    return this.readNext(story, null)
  }

  advance(session: StorySession): StorySession {
    if (!session.frame.canContinue) {
      return session
    }

    const story = this.loadStory(session.stateJson)
    return this.readNext(story, session.frame)
  }

  choose(session: StorySession, choiceIndex: number): StorySession {
    const story = this.loadStory(session.stateJson)
    if (!story.currentChoices[choiceIndex]) {
      throw new StoryControllerError(`Choice index ${choiceIndex} is unavailable.`)
    }

    story.ChooseChoiceIndex(choiceIndex)
    this.throwForStoryErrors(story)
    return this.readNext(story, session.frame)
  }

  validateState(stateJson: string): void {
    this.loadStory(stateJson)
  }

  getContinueMode(session: StorySession): StoryContinueMode | null {
    const story = this.loadStory(session.stateJson)
    return this.detectContinueMode(story, session.frame.id)
  }

  private createStory(): Story {
    const content = typeof this.content === 'string' ? this.content : JSON.stringify(this.content)
    try {
      return new Story(content)
    } catch (error) {
      throw new StoryControllerError(
        `Unable to create Ink runtime: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  private loadStory(stateJson: string): Story {
    const story = this.createStory()
    try {
      story.state.LoadJson(stateJson)
      this.throwForStoryErrors(story)
      return story
    } catch (error) {
      if (error instanceof StoryControllerError) {
        throw error
      }
      throw new StoryControllerError(
        `Unable to restore Ink state: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  private readNext(story: Story, previous: StoryFrame | null): StorySession {
    const tags: string[] = []
    let text = ''
    let steps = 0

    while (story.canContinue && text.length === 0) {
      const output = story.Continue() ?? ''
      tags.push(...(story.currentTags ?? []))
      text = output.trimEnd()
      steps += 1

      if (steps > 1000) {
        throw new StoryControllerError('Ink emitted more than 1000 empty steps without stopping.')
      }
    }

    this.throwForStoryErrors(story)

    const sceneId = tagValue(tags, 'scene') ?? previous?.id
    if (!sceneId) {
      throw new StoryControllerError('The first Ink output must include a # scene:<SceneId> tag.')
    }

    const sceneChanged = previous?.id !== sceneId
    const routeNodeId =
      tagValue(tags, 'route-node') ??
      (sceneChanged ? getPrimaryRouteNodeId(sceneId) : previous?.routeNodeId) ??
      getPrimaryRouteNodeId(sceneId)
    const checkpointId = tagValue(tags, 'checkpoint') ?? undefined
    if (this.content === storyContent) {
      const routeNode = getRouteNode(routeNodeId)
      if (!routeNode) {
        throw new StoryControllerError(`Unknown route node ${routeNodeId} in scene ${sceneId}.`)
      }
      if (routeNode.sceneId !== sceneId) {
        throw new StoryControllerError(
          `Route node ${routeNodeId} belongs to scene ${routeNode.sceneId}, not ${sceneId}.`,
        )
      }
      if (checkpointId && routeNode.checkpointId !== checkpointId) {
        throw new StoryControllerError(
          `Checkpoint ${checkpointId} is not registered for route node ${routeNodeId}.`,
        )
      }
    }
    const title = tagValue(tags, 'title') ?? (sceneChanged ? null : previous?.title)
    const marker = tagValue(tags, 'marker') ?? (sceneChanged ? null : previous?.marker)
    if (!title || !marker) {
      throw new StoryControllerError(
        `Scene ${sceneId} must introduce both # title: and # marker: tags.`,
      )
    }

    const choiceIds = new Set<string>()
    const choices: StoryChoice[] = story.currentChoices.map((choice, index) => {
      const choiceTags = choice.tags ?? []
      const choiceId = tagValue(choiceTags, 'choice-id')
      if (!choiceId) {
        throw new StoryControllerError(
          `Choice ${index + 1} in scene ${sceneId} must include a # choice-id:<id> tag inside its brackets.`,
        )
      }
      if (choiceIds.has(choiceId)) {
        throw new StoryControllerError(`Duplicate choice id ${choiceId} in scene ${sceneId}.`)
      }
      choiceIds.add(choiceId)

      return {
        id: choiceId,
        index,
        text: choice.text.trim(),
        tags: choiceTags,
      }
    })

    const endingValue = tagValue(tags, 'ending')
    const endingTone =
      endingValue && endingTones.has(endingValue as EndingTone) ? (endingValue as EndingTone) : null
    if (endingValue && !endingTone) {
      throw new StoryControllerError(`Unsupported ending tone: ${endingValue}`)
    }

    const endingId = tagValue(tags, 'ending-id') ?? undefined
    const hookId = tagValue(tags, 'hook') ?? undefined
    if ((endingId || hookId) && !endingTone) {
      throw new StoryControllerError(
        `Scene ${sceneId} emitted ending metadata without a valid # ending:<tone> tag.`,
      )
    }
    if (endingTone && !endingId) {
      throw new StoryControllerError(
        `Scene ${sceneId} emitted # ending:${endingTone} without # ending-id:<id>.`,
      )
    }

    const ending = endingTone
      ? {
          id: endingId,
          hookId,
          label: tagValue(tags, 'ending-label') ?? title,
          tone: endingTone,
        }
      : sceneChanged
        ? undefined
        : previous?.ending
    const commands = commandsFromTags(tags)
    validateTimedChoice(tags, commands, choices, sceneId)
    const isComplete = !story.canContinue && choices.length === 0
    const continueMode = this.detectContinueMode(story, sceneId)
    const frame: StoryFrame = {
      id: sceneId,
      routeNodeId,
      checkpointId,
      title,
      marker,
      body: text ? [text] : [],
      choices,
      ending,
      tags,
      commands,
      warnings: story.currentWarnings ?? [],
      canContinue: story.canContinue,
      continueMode,
      isComplete,
      revision: (previous?.revision ?? 0) + 1,
    }

    return {
      frame,
      stateJson: story.state.ToJson(),
    }
  }

  private detectContinueMode(story: Story, currentSceneId: string): StoryContinueMode | null {
    if (!story.canContinue) return null

    const preview = this.loadStory(story.state.ToJson())
    const tags: string[] = []
    let text = ''
    let steps = 0

    while (preview.canContinue && text.length === 0) {
      const output = preview.Continue() ?? ''
      tags.push(...(preview.currentTags ?? []))
      text = output.trimEnd()
      steps += 1

      if (steps > 1000) {
        throw new StoryControllerError(
          'Ink emitted more than 1000 empty steps while previewing continuation.',
        )
      }
    }

    this.throwForStoryErrors(preview)
    const nextSceneId = tagValue(tags, 'scene') ?? currentSceneId
    return nextSceneId === currentSceneId ? 'append' : 'scene'
  }

  private setGlobalIfPresent(story: Story, name: string, value: boolean | number | string): void {
    if (story.variablesState.GlobalVariableExistsWithName(name)) {
      story.variablesState.$(name, value)
    }
  }

  private throwForStoryErrors(story: Story): void {
    if (story.hasError) {
      throw new StoryControllerError((story.currentErrors ?? ['Unknown Ink error.']).join('\n'))
    }
  }
}

export function tagValue(tags: string[], name: string): string | null {
  const prefix = `${name}:`
  const tag = tags.find((candidate) => candidate.startsWith(prefix))
  return tag ? tag.slice(prefix.length).trim() : null
}

function commandsFromTags(tags: string[]): StoryCommand[] {
  return tags.flatMap((tag) => {
    if (!tag.startsWith('command:')) {
      return []
    }

    const command = tag.slice('command:'.length)
    const separator = command.indexOf(':')
    return [
      separator < 0
        ? { name: command, value: null }
        : { name: command.slice(0, separator), value: command.slice(separator + 1) },
    ]
  })
}

function validateTimedChoice(
  tags: string[],
  commands: StoryCommand[],
  choices: StoryChoice[],
  sceneId: string,
): void {
  const timingCommands = commands.filter(
    (command) => command.name === 'timed-choice' || command.name === 'qte',
  )
  if (timingCommands.length === 0) {
    return
  }
  if (timingCommands.length > 1) {
    throw new StoryControllerError(`Scene ${sceneId} emitted multiple timed-choice/QTE commands.`)
  }

  const timeoutMsValue = tagValue(tags, 'timeout-ms')
  const timeoutMs = Number(timeoutMsValue)
  if (!timeoutMsValue || !Number.isInteger(timeoutMs) || timeoutMs <= 0) {
    throw new StoryControllerError(
      `Scene ${sceneId} must provide a positive integer # timeout-ms:<milliseconds> tag.`,
    )
  }

  const timeoutChoiceId = tagValue(tags, 'timeout-choice')
  if (!timeoutChoiceId || !choices.some((choice) => choice.id === timeoutChoiceId)) {
    throw new StoryControllerError(
      `Scene ${sceneId} timeout choice ${timeoutChoiceId ?? '(missing)'} is unavailable.`,
    )
  }
}

export const storyController = new StoryController()
