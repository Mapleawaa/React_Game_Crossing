import { describe, expect, it } from 'vitest'
import {
  CHECKPOINT_IDS,
  EMPTY_ROUTE_PROGRESS,
  findRouteEdge,
  getDiscoveredRouteNodes,
  getPrimaryRouteNodeId,
  getRouteDiscoveryPercent,
  routeEdges,
  routeNodes,
} from './routeTopology'
import { ALL_SCENE_IDS } from './sceneManifest'

describe('route topology', () => {
  it('has unique nodes, unique edge ids, and ten registered checkpoints', () => {
    expect(new Set(routeNodes.map((node) => node.id)).size).toBe(routeNodes.length)
    expect(new Set(routeEdges.map((edge) => edge.id)).size).toBe(routeEdges.length)
    expect(new Set(Object.values(CHECKPOINT_IDS)).size).toBe(10)
    expect(
      routeNodes
        .filter((node) => node.checkpointId)
        .map((node) => node.checkpointId)
        .sort(),
    ).toEqual(Object.values(CHECKPOINT_IDS).sort())
  })

  it('covers every SceneId and has no dangling edges', () => {
    const nodeIds = new Set(routeNodes.map((node) => node.id))
    for (const sceneId of ALL_SCENE_IDS) {
      expect(nodeIds.has(getPrimaryRouteNodeId(sceneId)), sceneId).toBe(true)
    }
    for (const edge of routeEdges) {
      expect(nodeIds.has(edge.from), `edge.from ${edge.from} in ${edge.id}`).toBe(true)
      expect(nodeIds.has(edge.to), `edge.to ${edge.to} in ${edge.id}`).toBe(true)
    }
  })

  it('every choice-id edge must be unique per from+to+choiceId', () => {
    const seen = new Set<string>()
    for (const edge of routeEdges) {
      if (!edge.choiceId) continue
      const key = `${edge.from}|${edge.to}|${edge.choiceId}`
      expect(seen.has(key), `duplicate ${key} in ${edge.id}`).toBe(false)
      seen.add(key)
    }
  })

  it('no ghost edge from ch06-finale to end06-abyss', () => {
    const ghost = routeEdges.find(
      (e) => e.from === 'ch06-finale' && e.to === 'end06-abyss',
    )
    expect(ghost).toBeUndefined()
  })

  it('resolves known transitions with choice-id', () => {
    const crossroad = findRouteEdge('act3-03b-crossroads', 'act3-04-arrest', 'stay-for-zhaokai')
    expect(crossroad?.resultLabel).toBe('留下完成任务')

    const chamber = findRouteEdge('ch01-chamber', 'ch02-pistol', 'accept-challenge')
    expect(chamber?.resultLabel).toBe('接受密室挑战')

    const ember = findRouteEdge('end02-trash-hero', 'end04-ember', 'end02-continue-ember')
    expect(ember?.resultLabel).toBe('留下火种')
  })

  it('resolves week-specific completion percentages', () => {
    const transition = findRouteEdge('ch01-chamber', 'ch02-pistol', 'accept-challenge')
    expect(transition?.resultLabel).toBe('接受密室挑战')
    expect(getRouteDiscoveryPercent(EMPTY_ROUTE_PROGRESS, 1)).toBe(0)
    expect(
      getRouteDiscoveryPercent(
        {
          ...EMPTY_ROUTE_PROGRESS,
          discoveredNodeIds: routeNodes
            .filter((node) => !node.week || node.week === 1)
            .map((node) => node.id),
        },
        1,
      ),
    ).toBe(100)
  })

  it('returns only nodes discovered in the current run', () => {
    const visible = getDiscoveredRouteNodes(
      {
        ...EMPTY_ROUTE_PROGRESS,
        discoveredNodeIds: ['act0-01-birthday', 'end-true-ferryman'],
      },
      1,
    )

    expect(visible.map((node) => node.id)).toEqual(['act0-01-birthday'])
  })
})
