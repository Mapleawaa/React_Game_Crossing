import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface MetaState {
  firstClear: boolean
  endingIds: string[]
  hookIds: string[]
  recordEnding: (endingId: string) => void
  recordHook: (hookId: string) => void
}

function appendUnique(values: string[], value: string): string[] {
  return values.includes(value) ? values : [...values, value]
}

export function isNewGamePlusUnlocked(state: Pick<MetaState, 'firstClear' | 'hookIds'>): boolean {
  return state.firstClear && state.hookIds.length >= 3
}

export const useMetaStore = create<MetaState>()(
  persist(
    (set) => ({
      firstClear: false,
      endingIds: [],
      hookIds: [],
      recordEnding: (endingId) =>
        set((state) => ({
          firstClear: true,
          endingIds: appendUnique(state.endingIds, endingId),
        })),
      recordHook: (hookId) =>
        set((state) => ({
          hookIds: appendUnique(state.hookIds, hookId),
        })),
    }),
    {
      name: 'narrative-engine-meta-v1',
    },
  ),
)
