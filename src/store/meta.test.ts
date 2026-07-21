import { describe, expect, it } from 'vitest'
import { isNewGamePlusUnlocked } from './meta'

describe('isNewGamePlusUnlocked', () => {
  it('requires a first clear and three distinct hooks', () => {
    expect(isNewGamePlusUnlocked({ firstClear: false, hookIds: ['a', 'b', 'c'] })).toBe(false)
    expect(isNewGamePlusUnlocked({ firstClear: true, hookIds: ['a', 'b'] })).toBe(false)
    expect(isNewGamePlusUnlocked({ firstClear: true, hookIds: ['a', 'b', 'c'] })).toBe(true)
  })
})
