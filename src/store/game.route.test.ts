import { beforeEach, describe, expect, it } from 'vitest'
import { storyController } from '../engine/StoryController'
import { EMPTY_ROUTE_PROGRESS, ROUTE_TOPOLOGY_VERSION } from '../story/routeTopology'
import {
  type CheckpointSnapshot,
  type SaveSnapshot,
  type StoryTranscriptEntry,
  advanceTranscript,
  normalizeSaveSnapshot,
  upsertCheckpointSnapshot,
  useGameStore,
} from './game'
import { useMetaStore } from './meta'
import { useSaveStore } from './saves'

describe('single-run route progress', () => {
  beforeEach(() => {
    useMetaStore.setState({ firstClear: true, endingIds: ['end01'], hookIds: ['a', 'b', 'c'] })
    useGameStore.setState({
      routeProgress: {
        discoveredNodeIds: ['old-node'],
        discoveredEdgeIds: ['old-edge'],
        unlockedCheckpointIds: ['old-checkpoint'],
      },
      checkpointSnapshots: {},
      transcript: [],
      runtimeError: null,
    })
    useSaveStore.setState({
      slots: [1, 2, 3, 4, 5, 6].map((slotId) => ({
        slotId: slotId as 1 | 2 | 3 | 4 | 5 | 6,
        snapshot: null,
      })),
    })
  })

  it('resets route progress for a new run without resetting META progress', () => {
    useGameStore.getState().newGame()

    expect(useGameStore.getState().routeProgress).toEqual({
      discoveredNodeIds: ['act0-01-birthday'],
      discoveredEdgeIds: [],
      unlockedCheckpointIds: [],
    })
    expect(useMetaStore.getState().hookIds).toEqual(['a', 'b', 'c'])
    expect(useMetaStore.getState().firstClear).toBe(true)
  })

  it('restores the original run state from a compatible checkpoint', () => {
    const session = storyController.start({ week: 2, firstClear: true, hookCount: 3 })
    const routeProgress = {
      discoveredNodeIds: ['act0-01-birthday'],
      discoveredEdgeIds: [],
      unlockedCheckpointIds: ['cp-test'],
    }
    const history = [
      {
        visitId: '1-act0-01-birthday-1',
        sceneId: session.frame.id,
        routeNodeId: session.frame.routeNodeId,
        title: session.frame.title,
        marker: session.frame.marker,
      },
    ]
    const transcript = transcriptFromFrame(session.frame)
    useGameStore.setState({
      frame: session.frame,
      storyStateJson: session.stateJson,
      week: 1,
      history: [],
      transcript: [],
      visitedSceneIds: [],
      routeProgress: { ...EMPTY_ROUTE_PROGRESS, discoveredNodeIds: ['later-node'] },
      checkpointSnapshots: {
        'cp-test': {
          checkpointId: 'cp-test',
          routeTopologyVersion: ROUTE_TOPOLOGY_VERSION,
          storyHash: storyController.storyHash,
          storyStateJson: session.stateJson,
          frame: session.frame,
          week: 2,
          history,
          transcript,
          savedAt: '2026-01-01T00:00:00.000Z',
          playtimeMs: 42000,
          visitedSceneIds: [session.frame.id],
          routeProgress,
          pendingChoiceId: null,
        },
      },
    })
    const manualSnapshot = useGameStore.getState().createSnapshot()
    useSaveStore.getState().saveToSlot(1, manualSnapshot)

    useGameStore.getState().loadCheckpoint('cp-test')

    expect(useGameStore.getState().routeProgress).toEqual(routeProgress)
    expect(useGameStore.getState().playtimeMs).toBe(42000)
    expect(useGameStore.getState().storyStateJson).toBe(session.stateJson)
    expect(useGameStore.getState().week).toBe(2)
    expect(useGameStore.getState().history).toEqual(history)
    expect(useGameStore.getState().transcript).toEqual(transcript)
    expect(useGameStore.getState().visitedSceneIds).toEqual([session.frame.id])
    expect(useSaveStore.getState().slots[0].snapshot).toEqual(manualSnapshot)
  })

  it('migrates a legacy snapshot without route fields', () => {
    const session = storyController.start({ week: 1, firstClear: false, hookCount: 0 })
    const legacy = {
      storyHash: storyController.storyHash,
      storyStateJson: session.stateJson,
      frame: session.frame,
      week: 1,
      history: [],
      savedAt: '2026-01-01T00:00:00.000Z',
      playtimeMs: 0,
      visitedSceneIds: ['act0-01-birthday'],
      title: session.frame.title,
      marker: session.frame.marker,
    } as unknown as SaveSnapshot

    const migrated = normalizeSaveSnapshot(legacy)
    expect(migrated.schemaVersion).toBe(4)
    expect(migrated.transcript).toEqual(transcriptFromFrame(session.frame))
    expect(migrated.routeProgress.discoveredNodeIds).toEqual(['act0-01-birthday'])
    expect(migrated.checkpointSnapshots).toEqual({})
  })

  it('keeps only the most recent snapshot for the same checkpoint', () => {
    const session = storyController.start({ week: 1, firstClear: false, hookCount: 0 })
    const base = {
      checkpointId: 'cp-act0-morgue',
      routeTopologyVersion: ROUTE_TOPOLOGY_VERSION,
      storyHash: storyController.storyHash,
      storyStateJson: session.stateJson,
      frame: session.frame,
      week: 1,
      history: [],
      transcript: transcriptFromFrame(session.frame),
      playtimeMs: 1000,
      visitedSceneIds: [session.frame.id],
      routeProgress: EMPTY_ROUTE_PROGRESS,
      pendingChoiceId: null,
    } satisfies Omit<CheckpointSnapshot, 'savedAt'>
    const first = { ...base, savedAt: '2026-01-01T00:00:00.000Z' }
    const latest = { ...base, savedAt: '2026-01-01T00:05:00.000Z', playtimeMs: 5000 }

    const snapshots = upsertCheckpointSnapshot(upsertCheckpointSnapshot({}, first), latest)

    expect(Object.keys(snapshots)).toEqual(['cp-act0-morgue'])
    expect(snapshots['cp-act0-morgue']).toEqual(latest)
  })

  it('round-trips route progress and checkpoints through a manual save slot', () => {
    const session = storyController.start({ week: 1, firstClear: false, hookCount: 0 })
    const checkpoint: CheckpointSnapshot = {
      checkpointId: 'cp-act0-morgue',
      routeTopologyVersion: ROUTE_TOPOLOGY_VERSION,
      storyHash: storyController.storyHash,
      storyStateJson: session.stateJson,
      frame: session.frame,
      week: 1,
      history: [],
      transcript: transcriptFromFrame(session.frame),
      savedAt: '2026-01-01T00:00:00.000Z',
      playtimeMs: 5000,
      visitedSceneIds: [session.frame.id],
      routeProgress: EMPTY_ROUTE_PROGRESS,
      pendingChoiceId: null,
    }
    useGameStore.setState({
      frame: session.frame,
      storyStateJson: session.stateJson,
      routeProgress: {
        discoveredNodeIds: ['act0-01-birthday', 'act0-02-morgue'],
        discoveredEdgeIds: ['act0-01-birthday__act0-02-morgue'],
        unlockedCheckpointIds: ['cp-act0-morgue'],
      },
      checkpointSnapshots: { [checkpoint.checkpointId]: checkpoint },
      transcript: transcriptFromFrame(session.frame),
      playtimeMs: 7500,
      sessionStartedAt: null,
    })
    const snapshot = useGameStore.getState().createSnapshot()
    useSaveStore.getState().saveToSlot(1, snapshot)

    useGameStore.setState({
      routeProgress: EMPTY_ROUTE_PROGRESS,
      checkpointSnapshots: {},
      playtimeMs: 0,
    })
    const saved = useSaveStore.getState().slots[0].snapshot
    expect(saved).not.toBeNull()
    if (!saved) throw new Error('Expected slot 1 to contain a snapshot.')

    useGameStore.getState().loadSnapshot(saved)

    expect(useGameStore.getState().routeProgress).toEqual(snapshot.routeProgress)
    expect(useGameStore.getState().checkpointSnapshots).toEqual(snapshot.checkpointSnapshots)
    expect(useGameStore.getState().transcript).toEqual(snapshot.transcript)
    expect(useGameStore.getState().playtimeMs).toBe(7500)
  })

  it('rejects a checkpoint from an incompatible story version', () => {
    const session = storyController.start({ week: 1, firstClear: false, hookCount: 0 })
    const checkpoint: CheckpointSnapshot = {
      checkpointId: 'cp-act0-morgue',
      routeTopologyVersion: ROUTE_TOPOLOGY_VERSION,
      storyHash: 'outdated-story-hash',
      storyStateJson: session.stateJson,
      frame: session.frame,
      week: 1,
      history: [],
      transcript: transcriptFromFrame(session.frame),
      savedAt: '2026-01-01T00:00:00.000Z',
      playtimeMs: 0,
      visitedSceneIds: [session.frame.id],
      routeProgress: EMPTY_ROUTE_PROGRESS,
      pendingChoiceId: null,
    }
    useGameStore.setState({ checkpointSnapshots: { [checkpoint.checkpointId]: checkpoint } })

    useGameStore.getState().loadCheckpoint(checkpoint.checkpointId)

    expect(useGameStore.getState().runtimeError).toMatch(/不同的剧情或路线版本/)
    expect(useGameStore.getState().phase).toBe('title')
  })

  it('appends text within a chapter and resets it when the scene changes', () => {
    const session = storyController.start({ week: 1, firstClear: false, hookCount: 0 })
    const firstFrame = session.frame
    const initial = transcriptFromFrame(firstFrame)
    const nextFrame = {
      ...firstFrame,
      body: ['同一章节的下一行。'],
      revision: firstFrame.revision + 1,
    }

    const appended = advanceTranscript(initial, firstFrame, nextFrame)
    expect(appended.flatMap((entry) => entry.paragraphs)).toEqual([
      ...firstFrame.body,
      '同一章节的下一行。',
    ])

    const nextScene = {
      ...nextFrame,
      id: 'act0-02-morgue',
      body: ['新章节的第一行。'],
      revision: nextFrame.revision + 1,
    }
    expect(advanceTranscript(appended, nextFrame, nextScene)).toEqual(
      transcriptFromFrame(nextScene),
    )
  })
})

function transcriptFromFrame(frame: {
  id: string
  revision: number
  body: string[]
}): StoryTranscriptEntry[] {
  return frame.body.length > 0
    ? [
        {
          id: `${frame.id}-${frame.revision}`,
          sceneId: frame.id,
          revision: frame.revision,
          paragraphs: [...frame.body],
        },
      ]
    : []
}
