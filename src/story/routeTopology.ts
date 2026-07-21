import type { EndingTone, SceneId } from '../engine/types'
import {
  BETRAYAL_CHAPTERS,
  BETRAYAL_ENDINGS,
  MAINLINE_CHAPTERS,
  MAINLINE_ENDINGS,
  NGP_SCENES,
  PROLOGUE_SCENES,
} from './sceneManifest'

export type RouteNodeKind = 'entry' | 'decision' | 'merge' | 'ending'
export type RouteSectionId =
  | 'prologue'
  | 'mainline'
  | 'main-endings'
  | 'bad-endings'
  | 'betrayal'
  | 'betrayal-endings'
  | 'newgame-plus'

export interface RouteNodeDefinition {
  id: string
  sceneId: SceneId
  kind: RouteNodeKind
  label: string
  section: RouteSectionId
  checkpointId?: string
  tone?: EndingTone
  week?: 1 | 2
}

export interface RouteEdgeDefinition {
  id: string
  from: string
  to: string
  choiceId?: string
  resultLabel: string
}

export interface RunRouteProgress {
  discoveredNodeIds: string[]
  discoveredEdgeIds: string[]
  unlockedCheckpointIds: string[]
}

export const ROUTE_TOPOLOGY_VERSION = 2

export const CHECKPOINT_IDS = {
  morgueChoice: 'cp-act0-morgue',
  crossroads: 'cp-act3-crossroads',
  chamber: 'cp-ch01-chamber',
  pistol: 'cp-ch02-pistol',
  shotgun: 'cp-ch03-shotgun',
  sniper: 'cp-ch05-sniper',
  finale: 'cp-ch06-finale',
  betrayalEntry: 'cp-betrayal-entry',
  betrayalFinale: 'cp-betrayal-finale',
  newGamePlus: 'cp-ngp-entry',
} as const

const node = (
  id: SceneId,
  label: string,
  section: RouteSectionId,
  options: Partial<Omit<RouteNodeDefinition, 'id' | 'sceneId' | 'label' | 'section'>> = {},
): RouteNodeDefinition => ({ id, sceneId: id, kind: 'entry', label, section, ...options })

export const routeNodes: RouteNodeDefinition[] = [
  node(PROLOGUE_SCENES.act0_01_birthday, '生日早晨', 'prologue'),
  node(PROLOGUE_SCENES.act0_02_morgue, '太平间与补偿金', 'prologue', {
    kind: 'decision',
    checkpointId: CHECKPOINT_IDS.morgueChoice,
  }),
  node(PROLOGUE_SCENES.act1_01_firstMeet, '警校·初见', 'prologue'),
  node(PROLOGUE_SCENES.act1_02_range, '训练场上', 'prologue'),
  node(PROLOGUE_SCENES.act1_03_blackout, '断电夜谈', 'prologue'),
  node(PROLOGUE_SCENES.act1_04_graduation, '毕业', 'prologue'),
  node(PROLOGUE_SCENES.act2_01_firstCase, '入职·第一案', 'prologue'),
  node(PROLOGUE_SCENES.act2_02_wedding, '婚礼', 'prologue'),
  node(PROLOGUE_SCENES.act2_03_crack, '裂痕', 'prologue'),
  node(PROLOGUE_SCENES.act2_04_fatherCase, '父亲的旧案', 'prologue'),
  node(PROLOGUE_SCENES.act2_05_zhaokaiFather, '赵凯的父亲', 'prologue'),
  node(PROLOGUE_SCENES.act2_06_fall, '赵凯的堕落', 'prologue'),
  node(PROLOGUE_SCENES.act3_01_mission, '卧底任务', 'prologue'),
  node(PROLOGUE_SCENES.act3_02_lastDinner, '最后的晚餐', 'prologue'),
  node(PROLOGUE_SCENES.act3_03_undercover, '卧底期间', 'prologue'),
  node(PROLOGUE_SCENES.act3_03b_crossroads, '抉择之夜', 'prologue', {
    kind: 'decision',
    checkpointId: CHECKPOINT_IDS.crossroads,
  }),
  node(PROLOGUE_SCENES.act3_04_arrest, '被捕', 'prologue', { kind: 'merge' }),

  node(MAINLINE_CHAPTERS.ch00_container, '囚室：背叛的回响', 'mainline'),
  node(MAINLINE_CHAPTERS.ch01_chamber, '密室醒来', 'mainline', {
    kind: 'decision',
    checkpointId: CHECKPOINT_IDS.chamber,
  }),
  node(MAINLINE_CHAPTERS.ch02_pistol, '第一关·手枪轮', 'mainline', {
    kind: 'decision',
    checkpointId: CHECKPOINT_IDS.pistol,
  }),
  node(MAINLINE_CHAPTERS.ch03_shotgun, '第二关·霰弹枪轮', 'mainline', {
    kind: 'decision',
    checkpointId: CHECKPOINT_IDS.shotgun,
  }),
  node(MAINLINE_CHAPTERS.ch04_twist, '转折·肾上腺素', 'mainline', { kind: 'merge' }),
  node(MAINLINE_CHAPTERS.ch05_sniper, '第三关·狙击轮', 'mainline', {
    kind: 'decision',
    checkpointId: CHECKPOINT_IDS.sniper,
  }),
  node(MAINLINE_CHAPTERS.ch06_finale, '终局抉择', 'mainline', {
    kind: 'decision',
    checkpointId: CHECKPOINT_IDS.finale,
  }),

  node(MAINLINE_ENDINGS.end01_sakura, '日落樱花', 'main-endings', {
    kind: 'ending',
    tone: 'pseudo',
  }),
  node(MAINLINE_ENDINGS.end02_trashHero, '垃圾桶里的英雄', 'main-endings', {
    kind: 'ending',
    tone: 'pseudo',
  }),
  node(MAINLINE_ENDINGS.end03_moon, '月亮背面', 'main-endings', {
    kind: 'ending',
    tone: 'pseudo',
  }),
  node(MAINLINE_ENDINGS.end04_ember, '火种', 'main-endings', {
    kind: 'ending',
    tone: 'pseudo',
  }),
  node(MAINLINE_ENDINGS.end05_twentyYears, '二十年因公殉职', 'main-endings', {
    kind: 'ending',
    tone: 'pseudo',
  }),
  node(MAINLINE_ENDINGS.end06_abyss, '凝视深渊', 'main-endings', { kind: 'decision' }),
  {
    id: 'end06-abyss-ending',
    sceneId: MAINLINE_ENDINGS.end06_abyss,
    kind: 'ending',
    label: '凝视深渊·终止',
    section: 'main-endings',
    tone: 'pseudo',
  },
  node(MAINLINE_ENDINGS.end_true_ferryman, '摆渡人', 'main-endings', {
    kind: 'ending',
    tone: 'true',
    week: 2,
  }),

  node(MAINLINE_ENDINGS.end_bad01_useless, '无谓的防线', 'bad-endings', {
    kind: 'ending',
    tone: 'bad',
  }),
  node(MAINLINE_ENDINGS.end_bad02_blunt, '钝击致死', 'bad-endings', {
    kind: 'ending',
    tone: 'bad',
  }),
  node(MAINLINE_ENDINGS.end_bad03_dismember, '死无全尸', 'bad-endings', {
    kind: 'ending',
    tone: 'bad',
  }),
  node(MAINLINE_ENDINGS.end_bad04_dawnDoor, '倒在黎明门前', 'bad-endings', {
    kind: 'ending',
    tone: 'bad',
  }),
  node(MAINLINE_ENDINGS.end_bad05_fatalPoint, '命门', 'bad-endings', {
    kind: 'ending',
    tone: 'bad',
  }),
  node(MAINLINE_ENDINGS.end_bad06_abyssEnd, '深渊尽头', 'bad-endings', {
    kind: 'ending',
    tone: 'bad',
  }),
  node(MAINLINE_ENDINGS.end_bad07_escape, '火海逃逸', 'bad-endings', {
    kind: 'ending',
    tone: 'bad',
  }),

  node(BETRAYAL_CHAPTERS.ch_a01_initiation, '入门考验', 'betrayal', {
    checkpointId: CHECKPOINT_IDS.betrayalEntry,
  }),
  node(BETRAYAL_CHAPTERS.ch_a02_dock, '码头日常', 'betrayal'),
  node(BETRAYAL_CHAPTERS.ch_a03_diary, '日记危机', 'betrayal'),
  node(BETRAYAL_CHAPTERS.ch_a04_finale, '背叛线终局', 'betrayal', {
    kind: 'decision',
    checkpointId: CHECKPOINT_IDS.betrayalFinale,
  }),
  node(BETRAYAL_ENDINGS.end_a01_ferry, '渡口', 'betrayal-endings', {
    kind: 'ending',
    tone: 'betrayal',
  }),
  node(BETRAYAL_ENDINGS.end_a02_sinking, '沉船', 'betrayal-endings', {
    kind: 'ending',
    tone: 'betrayal',
  }),
  node(BETRAYAL_ENDINGS.end_a03_brokenAnchor, '断锚', 'betrayal-endings', {
    kind: 'ending',
    tone: 'betrayal',
  }),
  node(BETRAYAL_ENDINGS.end_a04_echo, '回声', 'betrayal-endings', {
    kind: 'ending',
    tone: 'betrayal',
  }),

  node(NGP_SCENES.ngp_newContent, '二周目新增内容', 'newgame-plus', {
    checkpointId: CHECKPOINT_IDS.newGamePlus,
    week: 2,
  }),
]

const edge = (
  from: string,
  to: string,
  resultLabel: string,
  choiceId?: string,
): RouteEdgeDefinition => ({
  id: `${from}__${choiceId ? `${choiceId}__` : ''}${to}`,
  from,
  to,
  resultLabel,
  choiceId,
})

const linear = (ids: string[], labels: string[] = []): RouteEdgeDefinition[] =>
  ids.slice(0, -1).map((from, index) => edge(from, ids[index + 1], labels[index] ?? '继续前行'))

export const routeEdges: RouteEdgeDefinition[] = [
  ...linear([
    PROLOGUE_SCENES.act0_01_birthday,
    PROLOGUE_SCENES.act0_02_morgue,
    PROLOGUE_SCENES.act1_01_firstMeet,
    PROLOGUE_SCENES.act1_02_range,
    PROLOGUE_SCENES.act1_03_blackout,
    PROLOGUE_SCENES.act1_04_graduation,
    PROLOGUE_SCENES.act2_01_firstCase,
    PROLOGUE_SCENES.act2_02_wedding,
    PROLOGUE_SCENES.act2_03_crack,
    PROLOGUE_SCENES.act2_04_fatherCase,
    PROLOGUE_SCENES.act2_05_zhaokaiFather,
    PROLOGUE_SCENES.act2_06_fall,
    PROLOGUE_SCENES.act3_01_mission,
    PROLOGUE_SCENES.act3_02_lastDinner,
    PROLOGUE_SCENES.act3_03_undercover,
    PROLOGUE_SCENES.act3_03b_crossroads,
  ]),
  edge(PROLOGUE_SCENES.act3_03b_crossroads, PROLOGUE_SCENES.act3_04_arrest, '留下完成任务', 'stay-for-zhaokai'),
  edge(PROLOGUE_SCENES.act3_03b_crossroads, MAINLINE_ENDINGS.end_bad07_escape, '逃离卧底线', 'flee-via-breakwater'),
  ...linear([
    PROLOGUE_SCENES.act3_04_arrest,
    MAINLINE_CHAPTERS.ch00_container,
    MAINLINE_CHAPTERS.ch01_chamber,
  ]),
  edge(MAINLINE_CHAPTERS.ch01_chamber, MAINLINE_CHAPTERS.ch02_pistol, '接受密室挑战', 'accept-challenge'),
  edge(MAINLINE_CHAPTERS.ch01_chamber, MAINLINE_ENDINGS.end06_abyss, '选择加入他们', 'join-them'),
  edge(MAINLINE_ENDINGS.end06_abyss, 'end06-abyss-ending', '在摘要处停下'),
  edge(MAINLINE_ENDINGS.end06_abyss, BETRAYAL_CHAPTERS.ch_a01_initiation, '继续深入背叛线'),
  edge(MAINLINE_CHAPTERS.ch02_pistol, MAINLINE_CHAPTERS.ch03_shotgun, '通过手枪轮'),
  edge(MAINLINE_CHAPTERS.ch02_pistol, MAINLINE_ENDINGS.end_bad01_useless, '防护选择失效', 'ammo-1a'),
  edge(MAINLINE_CHAPTERS.ch02_pistol, MAINLINE_ENDINGS.end_bad01_useless, '防护选择失效', 'ammo-1b'),
  edge(MAINLINE_CHAPTERS.ch02_pistol, MAINLINE_ENDINGS.end_bad01_useless, '防护选择失效', 'ammo-1c'),
  edge(MAINLINE_CHAPTERS.ch02_pistol, MAINLINE_ENDINGS.end_bad02_blunt, '钝击致死', 'ammo-2c'),
  edge(MAINLINE_CHAPTERS.ch03_shotgun, MAINLINE_CHAPTERS.ch04_twist, '通过霰弹枪轮'),
  edge(MAINLINE_CHAPTERS.ch03_shotgun, MAINLINE_ENDINGS.end_bad03_dismember, '挑战失败', 'posture-y'),
  edge(MAINLINE_CHAPTERS.ch03_shotgun, MAINLINE_ENDINGS.end_bad03_dismember, '挑战失败', 'posture-z'),
  edge(MAINLINE_CHAPTERS.ch04_twist, MAINLINE_CHAPTERS.ch05_sniper, '接受第三关'),
  edge(MAINLINE_CHAPTERS.ch05_sniper, MAINLINE_CHAPTERS.ch06_finale, '通过狙击轮', 'shift-right'),
  edge(MAINLINE_CHAPTERS.ch05_sniper, MAINLINE_ENDINGS.end_bad04_dawnDoor, '拒绝后倒在门前'),
  edge(MAINLINE_CHAPTERS.ch05_sniper, MAINLINE_ENDINGS.end_bad05_fatalPoint, 'QTE 失败', 'shift-left'),
  edge(MAINLINE_CHAPTERS.ch05_sniper, MAINLINE_ENDINGS.end_bad05_fatalPoint, 'QTE 失败', 'ch05-qte-fail'),
  edge(MAINLINE_CHAPTERS.ch06_finale, MAINLINE_ENDINGS.end01_sakura, '选择逃离', 'ch06-call-doctor'),
  edge(MAINLINE_CHAPTERS.ch06_finale, MAINLINE_ENDINGS.end02_trashHero, '失去意识', 'ch06-pass-out'),
  edge(MAINLINE_CHAPTERS.ch06_finale, MAINLINE_ENDINGS.end03_moon, '选择相信法律', 'ch06-hand-over-money'),
  edge(MAINLINE_CHAPTERS.ch06_finale, MAINLINE_ENDINGS.end_bad06_abyssEnd, '选择复仇', 'ch06-revenge'),
  edge(MAINLINE_CHAPTERS.ch06_finale, MAINLINE_ENDINGS.end_true_ferryman, '二周目·追问真相', 'ch06-pursue-truth'),
  edge(
    MAINLINE_ENDINGS.end02_trashHero,
    MAINLINE_ENDINGS.end04_ember,
    '留下火种',
    'end02-continue-ember',
  ),
  edge(
    MAINLINE_ENDINGS.end02_trashHero,
    MAINLINE_ENDINGS.end05_twentyYears,
    '沉默二十年',
    'end02-stop-twenty-years',
  ),
  ...linear([
    BETRAYAL_CHAPTERS.ch_a01_initiation,
    BETRAYAL_CHAPTERS.ch_a02_dock,
    BETRAYAL_CHAPTERS.ch_a03_diary,
    BETRAYAL_CHAPTERS.ch_a04_finale,
  ]),
  edge(BETRAYAL_CHAPTERS.ch_a04_finale, BETRAYAL_ENDINGS.end_a01_ferry, '立刻逃离', 'betrayal-finale-flee'),
  edge(BETRAYAL_CHAPTERS.ch_a04_finale, BETRAYAL_ENDINGS.end_a01_ferry, '按计划离开', 'betrayal-finale-leave'),
  edge(BETRAYAL_CHAPTERS.ch_a04_finale, BETRAYAL_ENDINGS.end_a01_ferry, '一起去纪委', 'betrayal-finale-together'),
  edge(BETRAYAL_CHAPTERS.ch_a04_finale, BETRAYAL_ENDINGS.end_a02_sinking, '再干一年', 'betrayal-finale-stay'),
  edge(BETRAYAL_CHAPTERS.ch_a04_finale, BETRAYAL_ENDINGS.end_a02_sinking, '再等时机', 'betrayal-finale-wait'),
  edge(BETRAYAL_CHAPTERS.ch_a04_finale, BETRAYAL_ENDINGS.end_a02_sinking, '翻出日记', 'betrayal-finale-read-diary'),
  edge(BETRAYAL_CHAPTERS.ch_a04_finale, BETRAYAL_ENDINGS.end_a02_sinking, '去找陈爷退', 'betrayal-finale-quit'),
  edge(BETRAYAL_CHAPTERS.ch_a04_finale, BETRAYAL_ENDINGS.end_a03_brokenAnchor, '不逃去告密', 'betrayal-finale-frame'),
  edge(BETRAYAL_CHAPTERS.ch_a04_finale, BETRAYAL_ENDINGS.end_a03_brokenAnchor, '继续做到退休', 'betrayal-finale-continue'),
  edge(BETRAYAL_CHAPTERS.ch_a04_finale, BETRAYAL_ENDINGS.end_a04_echo, '去公墓看妻儿', 'betrayal-finale-cemetery'),
  edge(BETRAYAL_CHAPTERS.ch_a04_finale, BETRAYAL_ENDINGS.end_a04_echo, '让赵凯去纪委', 'betrayal-finale-send-zhakai'),
  edge(NGP_SCENES.ngp_newContent, PROLOGUE_SCENES.act0_01_birthday, '进入一周目开头'),
]

const nodesById = new Map(routeNodes.map((routeNode) => [routeNode.id, routeNode]))

export const EMPTY_ROUTE_PROGRESS: RunRouteProgress = {
  discoveredNodeIds: [],
  discoveredEdgeIds: [],
  unlockedCheckpointIds: [],
}

export function getRouteNode(nodeId: string | undefined): RouteNodeDefinition | undefined {
  return nodeId ? nodesById.get(nodeId) : undefined
}

export function getPrimaryRouteNodeId(sceneId: SceneId): string {
  return routeNodes.find((routeNode) => routeNode.sceneId === sceneId)?.id ?? sceneId
}

export function findRouteEdge(
  from: string | undefined,
  to: string | undefined,
  choiceId?: string | null,
): RouteEdgeDefinition | undefined {
  if (!from || !to || from === to) return undefined
  return (
    routeEdges.find(
      (candidate) =>
        candidate.from === from && candidate.to === to && candidate.choiceId === choiceId,
    ) ?? routeEdges.find((candidate) => candidate.from === from && candidate.to === to)
  )
}

export function getEligibleRouteNodes(week: 1 | 2): RouteNodeDefinition[] {
  return routeNodes.filter((routeNode) => !routeNode.week || routeNode.week === week)
}

export function getDiscoveredRouteNodes(
  progress: RunRouteProgress,
  week: 1 | 2,
): RouteNodeDefinition[] {
  const discoveredIds = new Set(progress.discoveredNodeIds)
  return getEligibleRouteNodes(week).filter((routeNode) => discoveredIds.has(routeNode.id))
}

export function getRouteDiscoveryPercent(progress: RunRouteProgress, week: 1 | 2): number {
  const eligibleIds = new Set(getEligibleRouteNodes(week).map((routeNode) => routeNode.id))
  const discoveredCount = progress.discoveredNodeIds.filter((id) => eligibleIds.has(id)).length
  return eligibleIds.size === 0 ? 0 : Math.round((discoveredCount / eligibleIds.size) * 100)
}
