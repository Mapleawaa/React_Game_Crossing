import type { SceneId } from '../engine/types'
import {
  ALL_SCENE_IDS,
  BETRAYAL_CHAPTERS,
  BETRAYAL_ENDINGS,
  MAINLINE_CHAPTERS,
  MAINLINE_ENDINGS,
  NGP_SCENES,
  PROLOGUE_SCENES,
} from './sceneManifest'

export interface RouteSection {
  id: string
  label: string
  sceneIds: SceneId[]
}

const badEndingIds = Object.values(MAINLINE_ENDINGS).filter((id) => id.startsWith('end-bad'))
const mainEndingIds = Object.values(MAINLINE_ENDINGS).filter((id) => !id.startsWith('end-bad'))

export const routeSections: RouteSection[] = [
  { id: 'prologue', label: '前传', sceneIds: Object.values(PROLOGUE_SCENES) },
  { id: 'mainline', label: '密室主线', sceneIds: Object.values(MAINLINE_CHAPTERS) },
  { id: 'main-endings', label: '主线结局', sceneIds: mainEndingIds },
  { id: 'bad-endings', label: 'BAD END', sceneIds: badEndingIds },
  { id: 'betrayal', label: '背叛线', sceneIds: Object.values(BETRAYAL_CHAPTERS) },
  { id: 'betrayal-endings', label: '背叛线结局', sceneIds: Object.values(BETRAYAL_ENDINGS) },
  { id: 'newgame-plus', label: '二周目', sceneIds: Object.values(NGP_SCENES) },
]

const knownSceneIds = new Set(ALL_SCENE_IDS)

export function getRouteProgress(visitedSceneIds: SceneId[], currentSceneId: SceneId): number {
  const visited = new Set(
    [...visitedSceneIds, currentSceneId].filter((id) => knownSceneIds.has(id)),
  )
  return Math.round((visited.size / ALL_SCENE_IDS.length) * 100)
}
