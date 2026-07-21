export type SceneId = string

export type GameFlagValue = boolean | number | string

export type GameFlags = Record<string, GameFlagValue>

export type SceneParagraph = string | ((flags: GameFlags) => string | null)

export type EndingTone = 'normal' | 'bad' | 'true' | 'pseudo' | 'betrayal'

export interface SceneEnding {
  label: string
  tone: EndingTone
}

export interface SceneChoice {
  id: string
  text: string
  targetId: SceneId
  setFlags?: GameFlags
}

export interface Scene {
  id: SceneId
  title: string
  marker: string
  progressIndex: number
  body: SceneParagraph[]
  choices?: SceneChoice[]
  ending?: SceneEnding
}

export interface StoryChoice {
  id: string
  index: number
  text: string
  tags: string[]
}

export interface StoryCommand {
  name: string
  value: string | null
}

export type StoryContinueMode = 'append' | 'scene'

export interface StoryFrame {
  id: SceneId
  routeNodeId: string
  checkpointId?: string
  title: string
  marker: string
  body: string[]
  choices: StoryChoice[]
  ending?: SceneEnding & { id?: string; hookId?: string }
  tags: string[]
  commands: StoryCommand[]
  warnings: string[]
  canContinue: boolean
  continueMode: StoryContinueMode | null
  isComplete: boolean
  revision: number
}
