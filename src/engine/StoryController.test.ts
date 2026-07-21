import { Compiler } from 'inkjs/full'
import { describe, expect, it } from 'vitest'
import { StoryController } from './StoryController'

const fixtureSource = `
VAR week = 1
VAR week1_clear = false
VAR hooks_collected = 0

-> start

=== start ===
# scene:act0-01-birthday
# title:生日早晨
# marker:PROLOGUE / ACT 0
当前是第 {week} 周目。
钩子数量：{hooks_collected}。
+ [进入结局。 # choice-id:finish]
    -> finish

=== finish ===
# scene:end01-sakura
# title:日落樱花
# marker:ENDING / PSEUDO
# ending-id:end01-sakura
# ending:pseudo
# hook:end01-sakura
故事在这里暂时结束。
这是结局的第二段文字。
-> END
`

function compileFixture() {
  const story = new Compiler(fixtureSource).Compile()
  return JSON.parse(story.ToJson() as string)
}

describe('StoryController', () => {
  it('injects profile state and advances one Ink output at a time', () => {
    const controller = new StoryController(compileFixture(), 'fixture-hash')
    const first = controller.start({ week: 2, firstClear: true, hookCount: 3 })

    expect(first.frame.id).toBe('act0-01-birthday')
    expect(first.frame.routeNodeId).toBe('act0-01-birthday')
    expect(first.frame.title).toBe('生日早晨')
    expect(first.frame.body).toEqual(['当前是第 2 周目。'])
    expect(first.frame.canContinue).toBe(true)

    const second = controller.advance(first)
    expect(second.frame.body).toEqual(['钩子数量：3。'])
    expect(second.frame.choices[0]).toMatchObject({ id: 'finish', index: 0 })
  })

  it('restores serialized state and exposes ending metadata', () => {
    const controller = new StoryController(compileFixture(), 'fixture-hash')
    const first = controller.start({ week: 1, firstClear: false, hookCount: 0 })
    const choiceFrame = controller.advance(first)

    controller.validateState(choiceFrame.stateJson)
    const endingStart = controller.choose(choiceFrame, 0)

    expect(endingStart.frame.id).toBe('end01-sakura')
    expect(endingStart.frame.isComplete).toBe(false)
    expect(endingStart.frame.ending).toEqual({
      id: 'end01-sakura',
      hookId: 'end01-sakura',
      label: '日落樱花',
      tone: 'pseudo',
    })

    const endingComplete = controller.advance(endingStart)
    expect(endingComplete.frame.body).toEqual(['这是结局的第二段文字。'])
    expect(endingComplete.frame.isComplete).toBe(true)
    expect(endingComplete.frame.ending).toEqual(endingStart.frame.ending)
  })

  it('rejects choices without stable ids', () => {
    const source = `
      -> start
      === start ===
      # scene:test-scene
      # title:测试
      # marker:TEST
      文本。
      + [缺少标识]
          -> END
    `
    const story = new Compiler(source).Compile()
    const controller = new StoryController(JSON.parse(story.ToJson() as string), 'fixture-hash')

    expect(() => controller.start({ week: 1, firstClear: false, hookCount: 0 })).toThrow(
      /choice-id/,
    )
  })

  it('rejects a timed choice whose timeout target is unavailable', () => {
    const source = `
      -> start
      === start ===
      # scene:test-scene
      # title:测试
      # marker:TEST
      # command:timed-choice
      # timeout-ms:10000
      # timeout-choice:missing-choice
      必须作出选择。
      + [保持清醒 # choice-id:stay-awake]
          -> END
    `
    const story = new Compiler(source).Compile()
    const controller = new StoryController(JSON.parse(story.ToJson() as string), 'fixture-hash')

    expect(() => controller.start({ week: 1, firstClear: false, hookCount: 0 })).toThrow(
      /timeout choice missing-choice is unavailable/,
    )
  })
})
