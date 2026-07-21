import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  STORY_HASH,
  type StoryProfileContext,
  type StorySession,
  storyController,
} from '../engine/StoryController'
import type { SceneId, StoryChoice, StoryFrame } from '../engine/types'
import {
  EMPTY_ROUTE_PROGRESS,
  ROUTE_TOPOLOGY_VERSION,
  type RunRouteProgress,
  findRouteEdge,
  getPrimaryRouteNodeId,
} from '../story/routeTopology'
import { INITIAL_SCENE } from '../story/sceneManifest'
import { isNewGamePlusUnlocked, useMetaStore } from './meta'

export type GamePhase = 'title' | 'playing' | 'paused' | 'ending'

export interface RouteEntry {
  visitId: string
  sceneId: SceneId
  routeNodeId: string
  title: string
  marker: string
}

export interface StoryTranscriptEntry {
  id: string
  sceneId: SceneId
  revision: number
  paragraphs: string[]
}

export interface CheckpointSnapshot {
  checkpointId: string
  routeTopologyVersion: number
  storyHash: string
  storyStateJson: string
  frame: StoryFrame
  week: 1 | 2
  history: RouteEntry[]
  transcript: StoryTranscriptEntry[]
  savedAt: string
  playtimeMs: number
  visitedSceneIds: SceneId[]
  routeProgress: RunRouteProgress
  pendingChoiceId: string | null
}

export interface SaveSnapshot {
  schemaVersion: 4
  routeTopologyVersion: number
  storyHash: string
  storyStateJson: string
  frame: StoryFrame
  week: 1 | 2
  history: RouteEntry[]
  transcript: StoryTranscriptEntry[]
  savedAt: string
  playtimeMs: number
  visitedSceneIds: SceneId[]
  routeProgress: RunRouteProgress
  checkpointSnapshots: Record<string, CheckpointSnapshot>
  pendingChoiceId: string | null
  title: string
  marker: string
}

interface GameState {
  phase: GamePhase
  currentSceneId: SceneId
  frame: StoryFrame | null
  storyStateJson: string | null
  storyHash: string
  week: 1 | 2
  history: RouteEntry[]
  transcript: StoryTranscriptEntry[]
  hasSave: boolean
  lastSavedAt: string | null
  debugVisible: boolean
  playtimeMs: number
  sessionStartedAt: number | null
  visitedSceneIds: SceneId[]
  routeProgress: RunRouteProgress
  checkpointSnapshots: Record<string, CheckpointSnapshot>
  pendingChoiceId: string | null
  runtimeError: string | null
  newGame: () => void
  newGamePlus: () => void
  continueGame: () => void
  advanceStory: () => void
  chooseOption: (choice: StoryChoice) => void
  openPauseMenu: () => void
  closePauseMenu: () => void
  returnToTitle: () => void
  restartGame: () => void
  loadSnapshot: (snapshot: SaveSnapshot) => void
  loadCheckpoint: (checkpointId: string) => void
  createSnapshot: () => SaveSnapshot
  clearRuntimeError: () => void
  toggleDebug: () => void
}

const initialProgress = {
  currentSceneId: INITIAL_SCENE,
  frame: null as StoryFrame | null,
  storyStateJson: null as string | null,
  storyHash: STORY_HASH,
  week: 1 as 1 | 2,
  history: [] as RouteEntry[],
  transcript: [] as StoryTranscriptEntry[],
  hasSave: false,
  lastSavedAt: null as string | null,
  playtimeMs: 0,
  sessionStartedAt: null as number | null,
  visitedSceneIds: [] as SceneId[],
  routeProgress: cloneRouteProgress(EMPTY_ROUTE_PROGRESS),
  checkpointSnapshots: {} as Record<string, CheckpointSnapshot>,
  pendingChoiceId: null as string | null,
  runtimeError: null as string | null,
}

function nowStamp(): string {
  return new Date().toISOString()
}

function startSession(): number {
  return Date.now()
}

function commitPlaytime(playtimeMs: number, sessionStartedAt: number | null): number {
  return sessionStartedAt ? playtimeMs + Date.now() - sessionStartedAt : playtimeMs
}

function appendUnique(values: string[], value: string | undefined): string[] {
  return value && !values.includes(value) ? [...values, value] : values
}

function cloneRouteProgress(progress: RunRouteProgress): RunRouteProgress {
  return {
    discoveredNodeIds: [...progress.discoveredNodeIds],
    discoveredEdgeIds: [...progress.discoveredEdgeIds],
    unlockedCheckpointIds: [...progress.unlockedCheckpointIds],
  }
}

function profileContext(week: 1 | 2): StoryProfileContext {
  const meta = useMetaStore.getState()
  return {
    week,
    firstClear: meta.firstClear,
    hookCount: meta.hookIds.length,
  }
}

function normalizeFrame(frame: StoryFrame, storyStateJson?: string): StoryFrame {
  const normalized = {
    ...frame,
    routeNodeId: frame.routeNodeId ?? getPrimaryRouteNodeId(frame.id),
  }
  if (frame.continueMode !== undefined) return normalized

  try {
    return {
      ...normalized,
      continueMode: storyStateJson
        ? storyController.getContinueMode({ frame: normalized, stateJson: storyStateJson })
        : frame.canContinue
          ? 'append'
          : null,
    }
  } catch {
    return { ...normalized, continueMode: frame.canContinue ? 'append' : null }
  }
}

function createRouteEntry(frame: StoryFrame, index: number): RouteEntry {
  return {
    visitId: `${index + 1}-${frame.routeNodeId}-${frame.revision}`,
    sceneId: frame.id,
    routeNodeId: frame.routeNodeId,
    title: frame.title,
    marker: frame.marker,
  }
}

function normalizeHistory(history: RouteEntry[] | undefined): RouteEntry[] {
  return (history ?? []).map((entry, index) => ({
    ...entry,
    visitId: entry.visitId ?? `${index + 1}-${entry.sceneId}`,
    routeNodeId: entry.routeNodeId ?? getPrimaryRouteNodeId(entry.sceneId),
  }))
}

function transcriptEntry(frame: StoryFrame): StoryTranscriptEntry | null {
  if (frame.body.length === 0) return null
  return {
    id: `${frame.id}-${frame.revision}`,
    sceneId: frame.id,
    revision: frame.revision,
    paragraphs: [...frame.body],
  }
}

function transcriptForFrame(frame: StoryFrame): StoryTranscriptEntry[] {
  const entry = transcriptEntry(frame)
  return entry ? [entry] : []
}

export function advanceTranscript(
  transcript: StoryTranscriptEntry[],
  previousFrame: StoryFrame | null,
  frame: StoryFrame,
): StoryTranscriptEntry[] {
  const entry = transcriptEntry(frame)
  if (previousFrame?.id !== frame.id) return entry ? [entry] : []
  if (!entry || transcript.some((item) => item.id === entry.id)) return transcript
  return [...transcript, entry]
}

function normalizeTranscript(
  transcript: StoryTranscriptEntry[] | undefined,
  frame: StoryFrame,
): StoryTranscriptEntry[] {
  const entries = (transcript ?? [])
    .filter((entry) => entry.sceneId === frame.id)
    .map((entry) => ({ ...entry, paragraphs: [...entry.paragraphs] }))
  return entries.length > 0 ? entries : transcriptForFrame(frame)
}

function normalizeCheckpointSnapshots(
  snapshots: Record<string, CheckpointSnapshot> | undefined,
): Record<string, CheckpointSnapshot> {
  return Object.fromEntries(
    Object.entries(snapshots ?? {}).map(([checkpointId, snapshot]) => [
      checkpointId,
      {
        ...snapshot,
        frame: normalizeFrame(snapshot.frame, snapshot.storyStateJson),
        history: normalizeHistory(snapshot.history),
        transcript: normalizeTranscript(snapshot.transcript, snapshot.frame),
      },
    ]),
  )
}

function addVisited(visitedSceneIds: SceneId[], sceneId: SceneId): SceneId[] {
  return Array.from(new Set([...visitedSceneIds, sceneId]))
}

function applyMeta(frame: StoryFrame): void {
  const meta = useMetaStore.getState()
  if (frame.ending?.id) meta.recordEnding(frame.ending.id)
  if (frame.ending?.hookId) meta.recordHook(frame.ending.hookId)
}

function phaseForFrame(frame: StoryFrame): GamePhase {
  return frame.isComplete ? 'ending' : 'playing'
}

function legacyRouteProgress(visitedSceneIds: SceneId[] = []): RunRouteProgress {
  return {
    discoveredNodeIds: Array.from(
      new Set(visitedSceneIds.map((sceneId) => getPrimaryRouteNodeId(sceneId))),
    ),
    discoveredEdgeIds: [],
    unlockedCheckpointIds: [],
  }
}

function normalizeRouteProgress(
  progress: RunRouteProgress | undefined,
  visitedSceneIds: SceneId[] = [],
): RunRouteProgress {
  if (!progress) return legacyRouteProgress(visitedSceneIds)
  return {
    discoveredNodeIds: Array.from(new Set(progress.discoveredNodeIds ?? [])),
    discoveredEdgeIds: Array.from(new Set(progress.discoveredEdgeIds ?? [])),
    unlockedCheckpointIds: Array.from(new Set(progress.unlockedCheckpointIds ?? [])),
  }
}

function discoverFrame(
  progress: RunRouteProgress,
  previousRouteNodeId: string | undefined,
  frame: StoryFrame,
  pendingChoiceId: string | null,
): RunRouteProgress {
  const routeEdge = findRouteEdge(previousRouteNodeId, frame.routeNodeId, pendingChoiceId)
  return {
    discoveredNodeIds: appendUnique(progress.discoveredNodeIds, frame.routeNodeId),
    discoveredEdgeIds: appendUnique(progress.discoveredEdgeIds, routeEdge?.id),
    unlockedCheckpointIds: appendUnique(progress.unlockedCheckpointIds, frame.checkpointId),
  }
}

interface CheckpointSource {
  frame: StoryFrame
  storyStateJson: string
  week: 1 | 2
  history: RouteEntry[]
  transcript: StoryTranscriptEntry[]
  playtimeMs: number
  visitedSceneIds: SceneId[]
  routeProgress: RunRouteProgress
  pendingChoiceId: string | null
}

export function upsertCheckpointSnapshot(
  checkpointSnapshots: Record<string, CheckpointSnapshot>,
  snapshot: CheckpointSnapshot,
): Record<string, CheckpointSnapshot> {
  return {
    ...checkpointSnapshots,
    [snapshot.checkpointId]: snapshot,
  }
}

function captureCheckpoint(
  checkpointSnapshots: Record<string, CheckpointSnapshot>,
  source: CheckpointSource,
): Record<string, CheckpointSnapshot> {
  const checkpointId = source.frame.checkpointId
  if (!checkpointId) return checkpointSnapshots

  return upsertCheckpointSnapshot(checkpointSnapshots, {
    checkpointId,
    routeTopologyVersion: ROUTE_TOPOLOGY_VERSION,
    storyHash: STORY_HASH,
    storyStateJson: source.storyStateJson,
    frame: source.frame,
    week: source.week,
    history: source.history,
    transcript: source.transcript,
    savedAt: nowStamp(),
    playtimeMs: source.playtimeMs,
    visitedSceneIds: source.visitedSceneIds,
    routeProgress: cloneRouteProgress(source.routeProgress),
    pendingChoiceId: source.pendingChoiceId,
  })
}

function runState(session: StorySession, week: 1 | 2) {
  applyMeta(session.frame)
  const routeProgress = discoverFrame(
    cloneRouteProgress(EMPTY_ROUTE_PROGRESS),
    undefined,
    session.frame,
    null,
  )
  const history = [createRouteEntry(session.frame, 0)]
  const transcript = transcriptForFrame(session.frame)
  const playtimeMs = 0
  const visitedSceneIds = [session.frame.id]
  const pendingChoiceId = null
  const checkpointSnapshots = captureCheckpoint(
    {},
    {
      frame: session.frame,
      storyStateJson: session.stateJson,
      week,
      history,
      transcript,
      playtimeMs,
      visitedSceneIds,
      routeProgress,
      pendingChoiceId,
    },
  )

  return {
    phase: phaseForFrame(session.frame),
    currentSceneId: session.frame.id,
    frame: session.frame,
    storyStateJson: session.stateJson,
    storyHash: STORY_HASH,
    week,
    history,
    transcript,
    hasSave: true,
    lastSavedAt: nowStamp(),
    playtimeMs,
    sessionStartedAt: startSession(),
    visitedSceneIds,
    routeProgress,
    checkpointSnapshots,
    pendingChoiceId,
    runtimeError: null,
  }
}

function transitionState(
  state: GameState,
  session: StorySession,
  selectedChoiceId: string | null = null,
) {
  applyMeta(session.frame)
  const previousRouteNodeId = state.frame?.routeNodeId
  const changedRouteNode = previousRouteNodeId !== session.frame.routeNodeId
  const choiceForTransition = selectedChoiceId ?? state.pendingChoiceId
  const pendingChoiceId = changedRouteNode ? null : choiceForTransition
  const routeProgress = discoverFrame(
    state.routeProgress,
    previousRouteNodeId,
    session.frame,
    choiceForTransition,
  )
  const history = changedRouteNode
    ? [...state.history, createRouteEntry(session.frame, state.history.length)]
    : state.history
  const transcript = advanceTranscript(state.transcript, state.frame, session.frame)
  const playtimeMs = commitPlaytime(state.playtimeMs, state.sessionStartedAt)
  const visitedSceneIds = addVisited(state.visitedSceneIds, session.frame.id)
  const checkpointSnapshots = captureCheckpoint(state.checkpointSnapshots, {
    frame: session.frame,
    storyStateJson: session.stateJson,
    week: state.week,
    history,
    transcript,
    playtimeMs,
    visitedSceneIds,
    routeProgress,
    pendingChoiceId,
  })

  return {
    phase: phaseForFrame(session.frame),
    currentSceneId: session.frame.id,
    frame: session.frame,
    storyStateJson: session.stateJson,
    history,
    transcript,
    hasSave: true,
    lastSavedAt: nowStamp(),
    playtimeMs,
    sessionStartedAt: startSession(),
    visitedSceneIds,
    routeProgress,
    checkpointSnapshots,
    pendingChoiceId,
    runtimeError: null,
  }
}

function errorState(error: unknown) {
  return {
    phase: 'title' as const,
    sessionStartedAt: null,
    runtimeError: error instanceof Error ? error.message : String(error),
  }
}

export function normalizeSaveSnapshot(snapshot: SaveSnapshot): SaveSnapshot {
  const legacy = snapshot as SaveSnapshot & { schemaVersion?: number }
  const frame = normalizeFrame(legacy.frame, legacy.storyStateJson)
  const visitedSceneIds = legacy.visitedSceneIds ?? [frame.id]
  return {
    ...legacy,
    schemaVersion: 4,
    routeTopologyVersion: legacy.routeTopologyVersion ?? ROUTE_TOPOLOGY_VERSION,
    frame,
    history: normalizeHistory(legacy.history),
    transcript: normalizeTranscript(legacy.transcript, frame),
    visitedSceneIds,
    routeProgress: normalizeRouteProgress(legacy.routeProgress, visitedSceneIds),
    checkpointSnapshots: normalizeCheckpointSnapshots(legacy.checkpointSnapshots),
    pendingChoiceId: legacy.pendingChoiceId ?? null,
  }
}

export function getSnapshotRouteProgress(snapshot: SaveSnapshot): RunRouteProgress {
  return normalizeSaveSnapshot(snapshot).routeProgress
}

export function isSnapshotCompatible(snapshot: SaveSnapshot): boolean {
  return (
    snapshot.storyHash === STORY_HASH && snapshot.routeTopologyVersion === ROUTE_TOPOLOGY_VERSION
  )
}

export function isCheckpointCompatible(snapshot: CheckpointSnapshot): boolean {
  return (
    snapshot.storyHash === STORY_HASH && snapshot.routeTopologyVersion === ROUTE_TOPOLOGY_VERSION
  )
}

type PersistedGameState = Pick<
  GameState,
  | 'currentSceneId'
  | 'frame'
  | 'storyStateJson'
  | 'storyHash'
  | 'week'
  | 'history'
  | 'transcript'
  | 'hasSave'
  | 'lastSavedAt'
  | 'debugVisible'
  | 'playtimeMs'
  | 'sessionStartedAt'
  | 'visitedSceneIds'
  | 'routeProgress'
  | 'checkpointSnapshots'
  | 'pendingChoiceId'
>

function migratePersistedGame(persistedState: unknown): PersistedGameState {
  const state = (persistedState ?? {}) as Partial<GameState>
  const frame = state.frame ? normalizeFrame(state.frame, state.storyStateJson ?? undefined) : null
  const visitedSceneIds = state.visitedSceneIds ?? (frame ? [frame.id] : [])
  return {
    currentSceneId: state.currentSceneId ?? frame?.id ?? INITIAL_SCENE,
    frame,
    storyStateJson: state.storyStateJson ?? null,
    storyHash: state.storyHash ?? STORY_HASH,
    week: state.week ?? 1,
    history: normalizeHistory(state.history),
    transcript: frame ? normalizeTranscript(state.transcript, frame) : [],
    hasSave: state.hasSave ?? Boolean(frame && state.storyStateJson),
    lastSavedAt: state.lastSavedAt ?? null,
    debugVisible: state.debugVisible ?? false,
    playtimeMs: state.playtimeMs ?? 0,
    sessionStartedAt: null,
    visitedSceneIds,
    routeProgress: normalizeRouteProgress(state.routeProgress, visitedSceneIds),
    checkpointSnapshots: normalizeCheckpointSnapshots(state.checkpointSnapshots),
    pendingChoiceId: state.pendingChoiceId ?? null,
  }
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      phase: 'title',
      ...initialProgress,
      debugVisible: false,
      newGame: () => {
        try {
          set(runState(storyController.start(profileContext(1)), 1))
        } catch (error) {
          set(errorState(error))
        }
      },
      newGamePlus: () => {
        const meta = useMetaStore.getState()
        if (!isNewGamePlusUnlocked(meta)) {
          set(errorState(new Error('收集至少 3 个终幕钩子后才能进入二周目。')))
          return
        }

        try {
          set(runState(storyController.start(profileContext(2)), 2))
        } catch (error) {
          set(errorState(error))
        }
      },
      continueGame: () => {
        const state = get()
        if (!state.hasSave || !state.frame || !state.storyStateJson) return
        if (state.storyHash !== STORY_HASH) {
          set(errorState(new Error('剧情文件无法读取，当前自动存档与新版本不兼容。')))
          return
        }

        try {
          storyController.validateState(state.storyStateJson)
          set({ phase: phaseForFrame(state.frame), sessionStartedAt: startSession() })
        } catch (error) {
          set(errorState(error))
        }
      },
      advanceStory: () => {
        const state = get()
        if (!state.frame || !state.storyStateJson) return

        try {
          const session = storyController.advance({
            frame: state.frame,
            stateJson: state.storyStateJson,
          })
          set(transitionState(state, session))
        } catch (error) {
          set(errorState(error))
        }
      },
      chooseOption: (choice) => {
        const state = get()
        if (!state.frame || !state.storyStateJson) return

        try {
          const session = storyController.choose(
            { frame: state.frame, stateJson: state.storyStateJson },
            choice.index,
          )
          set(transitionState(state, session, choice.id))
        } catch (error) {
          set(errorState(error))
        }
      },
      openPauseMenu: () =>
        set((state) => ({
          phase: 'paused',
          playtimeMs: commitPlaytime(state.playtimeMs, state.sessionStartedAt),
          sessionStartedAt: null,
        })),
      closePauseMenu: () =>
        set((state) => ({
          phase: state.frame ? phaseForFrame(state.frame) : 'playing',
          sessionStartedAt: startSession(),
        })),
      returnToTitle: () =>
        set((state) => ({
          phase: 'title',
          playtimeMs: commitPlaytime(state.playtimeMs, state.sessionStartedAt),
          sessionStartedAt: null,
        })),
      restartGame: () => {
        const week = get().week
        try {
          set(runState(storyController.start(profileContext(week)), week))
        } catch (error) {
          set(errorState(error))
        }
      },
      loadSnapshot: (rawSnapshot) => {
        const snapshot = normalizeSaveSnapshot(rawSnapshot)
        if (!isSnapshotCompatible(snapshot)) {
          set(errorState(new Error('该存档来自不同的剧情版本，无法安全读取。')))
          return
        }

        try {
          storyController.validateState(snapshot.storyStateJson)
          set({
            phase: phaseForFrame(snapshot.frame),
            currentSceneId: snapshot.frame.id,
            frame: snapshot.frame,
            storyStateJson: snapshot.storyStateJson,
            storyHash: snapshot.storyHash,
            week: snapshot.week,
            history: snapshot.history,
            transcript: snapshot.transcript,
            hasSave: true,
            lastSavedAt: snapshot.savedAt,
            playtimeMs: snapshot.playtimeMs,
            sessionStartedAt: startSession(),
            visitedSceneIds: snapshot.visitedSceneIds,
            routeProgress: snapshot.routeProgress,
            checkpointSnapshots: snapshot.checkpointSnapshots,
            pendingChoiceId: snapshot.pendingChoiceId,
            runtimeError: null,
          })
        } catch (error) {
          set(errorState(error))
        }
      },
      loadCheckpoint: (checkpointId) => {
        const state = get()
        const snapshot = state.checkpointSnapshots[checkpointId]
        if (!snapshot) return
        if (!isCheckpointCompatible(snapshot)) {
          set(errorState(new Error('该 Checkpoint 来自不同的剧情或路线版本，无法安全回溯。')))
          return
        }

        try {
          storyController.validateState(snapshot.storyStateJson)
          set({
            phase: phaseForFrame(snapshot.frame),
            currentSceneId: snapshot.frame.id,
            frame: snapshot.frame,
            storyStateJson: snapshot.storyStateJson,
            storyHash: snapshot.storyHash,
            week: snapshot.week,
            history: snapshot.history,
            transcript: snapshot.transcript,
            hasSave: true,
            lastSavedAt: nowStamp(),
            playtimeMs: snapshot.playtimeMs,
            sessionStartedAt: startSession(),
            visitedSceneIds: snapshot.visitedSceneIds,
            routeProgress: cloneRouteProgress(snapshot.routeProgress),
            checkpointSnapshots: state.checkpointSnapshots,
            pendingChoiceId: snapshot.pendingChoiceId,
            runtimeError: null,
          })
        } catch (error) {
          set(errorState(error))
        }
      },
      createSnapshot: () => {
        const state = get()
        if (!state.frame || !state.storyStateJson) {
          throw new Error('当前没有可保存的剧情运行状态。')
        }

        return {
          schemaVersion: 4,
          routeTopologyVersion: ROUTE_TOPOLOGY_VERSION,
          storyHash: STORY_HASH,
          storyStateJson: state.storyStateJson,
          frame: state.frame,
          week: state.week,
          history: state.history,
          transcript: state.transcript,
          savedAt: nowStamp(),
          playtimeMs: commitPlaytime(state.playtimeMs, state.sessionStartedAt),
          visitedSceneIds: state.visitedSceneIds,
          routeProgress: cloneRouteProgress(state.routeProgress),
          checkpointSnapshots: state.checkpointSnapshots,
          pendingChoiceId: state.pendingChoiceId,
          title: state.frame.title,
          marker: state.frame.marker,
        }
      },
      clearRuntimeError: () => set({ runtimeError: null }),
      toggleDebug: () => set((state) => ({ debugVisible: !state.debugVisible })),
    }),
    {
      name: 'narrative-engine-v2',
      version: 2,
      migrate: (persistedState) => migratePersistedGame(persistedState),
      partialize: (state) => ({
        currentSceneId: state.currentSceneId,
        frame: state.frame,
        storyStateJson: state.storyStateJson,
        storyHash: state.storyHash,
        week: state.week,
        history: state.history,
        transcript: state.transcript,
        hasSave: state.hasSave,
        lastSavedAt: state.lastSavedAt,
        debugVisible: state.debugVisible,
        playtimeMs: commitPlaytime(state.playtimeMs, state.sessionStartedAt),
        sessionStartedAt: null,
        visitedSceneIds: state.visitedSceneIds,
        routeProgress: state.routeProgress,
        checkpointSnapshots: state.checkpointSnapshots,
        pendingChoiceId: state.pendingChoiceId,
      }),
    },
  ),
)
