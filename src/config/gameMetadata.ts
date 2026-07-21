export const GAME_METADATA = {
  title: '摆渡人档案',
  studio: 'ArcLeaf Games',
  studioSubtitle: 'Beneath the Wake',
  rating: {
    age: '18+',
    label: '内容建议',
    descriptors: '暴力 / 犯罪 / 毒品议题 / 心理压迫',
  },
  notice: {
    eyebrow: 'FICTIONAL WORK / CONTENT NOTICE',
    title: '内容声明',
    fiction:
      '本作全部角色、事件及组织纯属虚构，以讽刺笔法影射社会结构，与现实无关，无意指涉任何真实实体。如有雷同纯属巧合。',
    content:
      '本作含有枪械暴力、犯罪、毒品议题、死亡描写与心理压迫等内容。本作含心理恐怖、压迫氛围及黑色讽刺，仅适合18岁以上心智成熟者。继续游玩即视为您自愿承担所有心理不适等风险，开发者免责。本游戏可能收集匿名崩溃日志以优化体验，不含个人身份信息。请根据自身情况决定是否继续。',
  },
  about: {
    eyebrow: 'ABOUT / 关于游戏',
    title: '关于这款游戏',
    intro:
      '游戏是一拍脑袋想到的，正巧之前就想自己做一个游戏，于是尝试了一个新的领域，学了一下 Ink 这个章节游戏的 JS 库，明白了生产级别的游戏流水线 Workflow。',
    story:
      '剧情挺烂的，我起的故事不是很好，试水作品，感谢品尝。',
    tech:
      '使用的前端技术栈是以前从来没有想过能在游戏里面用这个技术栈——React。算是一种新体验了，开发还是挺舒服的。',
    workflow:
      '这次也是梳理明白了我的 AI 开发工作流，由多个模型辅助开发，积累了很多经验。',
    credits: {
      creator: '主创 & 故事：Maple_awa',
      script: '剧本：DeepSeek V4 Pro',
      program: '程序：ChatGPT 5.6 Sol & Claude Opus 4.7',
      qa: '纠错：DeepSeek V4 Flash',
      deploy: '部署：Cloudflare',
    },
    stats: {
      cost: '花费：20￥ / 151,971,303 Tokens',
      duration: '用时：6h 20m',
    },
  },
} as const
