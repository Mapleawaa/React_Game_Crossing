/**
 * sceneManifest.ts — 场景索引
 *
 * 本文件是「剧本/场景清单.md」在代码侧的对应物。
 * 包含游戏中所有场景的 SceneId、路由元数据和加载指令。
 * 新增场景时：在 sceneIds 常量中追加，并在场景清单.md 中同步。
 */

import type { EndingTone, SceneId } from '../engine/types'

// ─── 前传 ────────────────────────────────────────

export const PROLOGUE_SCENES = {
  /** act-0 */
  act0_01_birthday: 'act0-01-birthday' as SceneId,
  act0_02_morgue: 'act0-02-morgue' as SceneId,
  /** act-1 */
  act1_01_firstMeet: 'act1-01-first-meet' as SceneId,
  act1_02_range: 'act1-02-range' as SceneId,
  act1_03_blackout: 'act1-03-blackout' as SceneId,
  act1_04_graduation: 'act1-04-graduation' as SceneId,
  /** act-2 */
  act2_01_firstCase: 'act2-01-first-case' as SceneId,
  act2_02_wedding: 'act2-02-wedding' as SceneId,
  act2_03_crack: 'act2-03-crack' as SceneId,
  act2_04_fatherCase: 'act2-04-father-case' as SceneId,
  act2_05_zhaokaiFather: 'act2-05-zhaokai-father' as SceneId,
  act2_06_fall: 'act2-06-fall' as SceneId,
  /** act-3 */
  act3_01_mission: 'act3-01-mission' as SceneId,
  act3_02_lastDinner: 'act3-02-last-dinner' as SceneId,
  act3_03_undercover: 'act3-03-undercover' as SceneId,
  act3_03b_crossroads: 'act3-03b-crossroads' as SceneId,
  act3_04_arrest: 'act3-04-arrest' as SceneId,
} as const

// ─── 主线密室 ──────────────────────────────────────

export const MAINLINE_CHAPTERS = {
  ch00_container: 'ch00-container' as SceneId,
  ch01_chamber: 'ch01-chamber' as SceneId,
  ch02_pistol: 'ch02-pistol' as SceneId,
  ch03_shotgun: 'ch03-shotgun' as SceneId,
  ch04_twist: 'ch04-twist' as SceneId,
  ch05_sniper: 'ch05-sniper' as SceneId,
  ch06_finale: 'ch06-finale' as SceneId,
} as const

export const MAINLINE_ENDINGS = {
  end01_sakura: 'end01-sakura' as SceneId,
  end02_trashHero: 'end02-trash-hero' as SceneId,
  end03_moon: 'end03-moon' as SceneId,
  end04_ember: 'end04-ember' as SceneId,
  end05_twentyYears: 'end05-twenty-years' as SceneId,
  end06_abyss: 'end06-abyss' as SceneId,
  end_true_ferryman: 'end-true-ferryman' as SceneId,
  /** bad */
  end_bad01_useless: 'end-bad01-useless' as SceneId,
  end_bad02_blunt: 'end-bad02-blunt' as SceneId,
  end_bad03_dismember: 'end-bad03-dismember' as SceneId,
  end_bad04_dawnDoor: 'end-bad04-dawn-door' as SceneId,
  end_bad05_fatalPoint: 'end-bad05-fatal-point' as SceneId,
  end_bad06_abyssEnd: 'end-bad06-abyss-end' as SceneId,
  end_bad07_escape: 'end-bad07-escape' as SceneId,
} as const

// ─── 背叛线 ──────────────────────────────────────

export const BETRAYAL_CHAPTERS = {
  ch_a01_initiation: 'ch-a01-initiation' as SceneId,
  ch_a02_dock: 'ch-a02-dock' as SceneId,
  ch_a03_diary: 'ch-a03-diary' as SceneId,
  ch_a04_finale: 'ch-a04-finale' as SceneId,
} as const

export const BETRAYAL_ENDINGS = {
  end_a01_ferry: 'end-a01-ferry' as SceneId,
  end_a02_sinking: 'end-a02-sinking' as SceneId,
  end_a03_brokenAnchor: 'end-a03-broken-anchor' as SceneId,
  end_a04_echo: 'end-a04-echo' as SceneId,
} as const

// ─── 二周目 ──────────────────────────────────────

export const NGP_SCENES = {
  ngp_newContent: 'ngp-new-content' as SceneId,
} as const

// ─── 入口 ────────────────────────────────────────

export const INITIAL_SCENE: SceneId = PROLOGUE_SCENES.act0_01_birthday

// ─── 结局色调映射 ─────────────────────────────────

export const ENDING_TONES: Record<SceneId, EndingTone> = {
  [MAINLINE_ENDINGS.end_true_ferryman]: 'true',
  [MAINLINE_ENDINGS.end01_sakura]: 'pseudo',
  [MAINLINE_ENDINGS.end02_trashHero]: 'pseudo',
  [MAINLINE_ENDINGS.end03_moon]: 'pseudo',
  [MAINLINE_ENDINGS.end04_ember]: 'pseudo',
  [MAINLINE_ENDINGS.end05_twentyYears]: 'pseudo',
  [MAINLINE_ENDINGS.end06_abyss]: 'pseudo',
  [MAINLINE_ENDINGS.end_bad01_useless]: 'bad',
  [MAINLINE_ENDINGS.end_bad02_blunt]: 'bad',
  [MAINLINE_ENDINGS.end_bad03_dismember]: 'bad',
  [MAINLINE_ENDINGS.end_bad04_dawnDoor]: 'bad',
  [MAINLINE_ENDINGS.end_bad05_fatalPoint]: 'bad',
  [MAINLINE_ENDINGS.end_bad06_abyssEnd]: 'bad',
  [MAINLINE_ENDINGS.end_bad07_escape]: 'bad',
  [BETRAYAL_ENDINGS.end_a01_ferry]: 'betrayal',
  [BETRAYAL_ENDINGS.end_a02_sinking]: 'betrayal',
  [BETRAYAL_ENDINGS.end_a03_brokenAnchor]: 'betrayal',
  [BETRAYAL_ENDINGS.end_a04_echo]: 'betrayal',
}

// ─── 全量场景 ID 集合 ──────────────────────────────

export const ALL_SCENE_IDS: SceneId[] = [
  ...Object.values(PROLOGUE_SCENES),
  ...Object.values(MAINLINE_CHAPTERS),
  ...Object.values(MAINLINE_ENDINGS),
  ...Object.values(BETRAYAL_CHAPTERS),
  ...Object.values(BETRAYAL_ENDINGS),
  ...Object.values(NGP_SCENES),
]
