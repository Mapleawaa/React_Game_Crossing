import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { type SaveSnapshot, normalizeSaveSnapshot } from './game'

export type SaveSlotId = 1 | 2 | 3 | 4 | 5 | 6

export interface SaveSlot {
  slotId: SaveSlotId
  snapshot: SaveSnapshot | null
}

interface SaveState {
  slots: SaveSlot[]
  saveToSlot: (slotId: SaveSlotId, snapshot: SaveSnapshot) => void
  deleteSlot: (slotId: SaveSlotId) => void
}

const slotIds: SaveSlotId[] = [1, 2, 3, 4, 5, 6]

const emptySlots = slotIds.map((slotId) => ({ slotId, snapshot: null }))

export const useSaveStore = create<SaveState>()(
  persist(
    (set) => ({
      slots: emptySlots,
      saveToSlot: (slotId, snapshot) =>
        set((state) => ({
          slots: state.slots.map((slot) => (slot.slotId === slotId ? { ...slot, snapshot } : slot)),
        })),
      deleteSlot: (slotId) =>
        set((state) => ({
          slots: state.slots.map((slot) =>
            slot.slotId === slotId ? { ...slot, snapshot: null } : slot,
          ),
        })),
    }),
    {
      name: 'narrative-engine-save-slots-v2',
      version: 2,
      migrate: (persistedState) => {
        const state = persistedState as Partial<SaveState> | undefined
        return {
          ...state,
          slots: (state?.slots ?? emptySlots).map((slot) => ({
            ...slot,
            snapshot: slot.snapshot ? normalizeSaveSnapshot(slot.snapshot) : null,
          })),
        }
      },
    },
  ),
)
