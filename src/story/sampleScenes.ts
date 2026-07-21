import type { GameFlags, Scene, SceneId } from '../engine/types'

export const initialSceneId: SceneId = 'act0-01-birthday'

export const sampleScenes: Record<SceneId, Scene> = {
  'act0-01-birthday': {
    id: 'act0-01-birthday',
    marker: 'PROLOGUE / ACT 0',
    title: '生日早晨',
    progressIndex: 1,
    body: [
      '1999 年的夏天，楼道里有潮湿水泥和煤气灶的味道。',
      '父亲把警服外套搭在臂弯里，回头看了你一眼，说草莓蛋糕要趁新鲜吃。',
      '门锁合上的声音很轻。那天之后，你记住了很多很轻的声音。',
    ],
    choices: [
      {
        id: 'continue',
        text: '继续等他回来。',
        targetId: 'act0-02-morgue',
      },
    ],
  },
  'act0-02-morgue': {
    id: 'act0-02-morgue',
    marker: 'PROLOGUE / ACT 0',
    title: '太平间与遗物',
    progressIndex: 2,
    body: [
      '白炽灯把所有人的脸照得没有血色。铁盘上放着钱包、皱掉的纸条，还有一张被压扁的蛋糕票。',
      '大人们在你头顶说话，声音像隔着一层水。只有那些遗物离你很近。',
    ],
    choices: [
      {
        id: 'wallet',
        text: '拿起父亲的钱包。',
        targetId: 'act1-03-blackout',
        setFlags: { act0_choice: 'wallet' },
      },
      {
        id: 'cargo-note',
        text: '记住那张提货单编号。',
        targetId: 'act1-03-blackout',
        setFlags: { act0_choice: 'cargo_note' },
      },
      {
        id: 'stand-still',
        text: '站着，不碰任何东西。',
        targetId: 'act1-03-blackout',
        setFlags: { act0_choice: 'silence' },
      },
    ],
  },
  'act1-03-blackout': {
    id: 'act1-03-blackout',
    marker: 'PROLOGUE / ACT 1',
    title: '断电夜谈',
    progressIndex: 3,
    body: [
      '警校宿舍停电，窗外的操场只剩一条冷白色的边。',
      (flags) => {
        if (flags.act0_choice === 'cargo_note') {
          return '你忽然想起很多年前那串提货单编号。它没有答案，只像一根没拔出来的刺。'
        }

        if (flags.act0_choice === 'wallet') {
          return '你想起父亲钱包里旧照片的折痕，照片边缘被汗水磨得发亮。'
        }

        return '你想起自己站在太平间里的样子，一动不动，像被钉在地上。'
      },
      '赵凯躺在上铺问你：你为什么非要当警察？',
    ],
    choices: [
      {
        id: 'tell',
        text: '告诉他父亲的事。',
        targetId: 'ch00-container',
        setFlags: { trust_zhakai: true },
      },
      {
        id: 'hide',
        text: '说只是想有一份稳定工作。',
        targetId: 'ch00-container',
        setFlags: { trust_zhakai: false },
      },
    ],
  },
  'ch00-container': {
    id: 'ch00-container',
    marker: 'MAINLINE / CH-00',
    title: '囚室：背叛的回响',
    progressIndex: 4,
    body: [
      '你在铁锈味里醒来，手腕被扎带磨得发麻。门外有人在笑，有人把茶杯放在桌上。',
      (flags) =>
        flags.trust_zhakai
          ? '隔着门，你听见赵凯咳了一声。那节奏很短，像很多年前训练场上的暗号。'
          : '隔着门，你听见赵凯的脚步停了一下，又很快离开。',
      '陈爷说，游戏很简单：你选一条活路，或者选一个像样的死法。',
    ],
    choices: [
      {
        id: 'fight',
        text: '抬头。让他把规则说完。',
        targetId: 'sample-ending',
        setFlags: { stood_up: true },
      },
      {
        id: 'silent',
        text: '沉默。盯着赵凯的位置。',
        targetId: 'sample-ending',
        setFlags: { stood_up: false },
      },
    ],
  },
  'sample-ending': {
    id: 'sample-ending',
    marker: 'ENDING / PROTOTYPE',
    title: '闭环样例结局',
    progressIndex: 5,
    body: [
      '这不是正式结局，只是引擎第一次完成呼吸。',
      (flags) =>
        flags.stood_up
          ? '你选择把规则听完。下一版里，这里会接入密室第一关的防具与子弹判定。'
          : '你选择沉默。下一版里，这里会把沉默作为后续对话变量继续传递。',
      (flags) =>
        flags.trust_zhakai
          ? '赵凯留下的暗号已经被记录。'
          : '赵凯没有给出暗号，这同样会成为状态的一部分。',
    ],
    ending: {
      label: 'PROTOTYPE END',
      tone: 'normal',
    },
  },
}

export function getScene(sceneId: SceneId): Scene {
  return sampleScenes[sceneId] ?? sampleScenes[initialSceneId]
}

export function resolveSceneBody(scene: Scene, flags: GameFlags): string[] {
  return scene.body.flatMap((paragraph) => {
    const value = typeof paragraph === 'function' ? paragraph(flags) : paragraph
    return value ? [value] : []
  })
}
