import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type FontSize = 'small' | 'normal' | 'large'
export type TextSpeed = 'instant' | 'normal' | 'slow'
export type ThemeMode = 'dark' | 'light' | 'system'

interface SettingsState {
  fontSize: FontSize
  textSpeed: TextSpeed
  reducedMotion: boolean
  theme: ThemeMode
  setFontSize: (fontSize: FontSize) => void
  setTextSpeed: (textSpeed: TextSpeed) => void
  setReducedMotion: (reducedMotion: boolean) => void
  setTheme: (theme: ThemeMode) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      fontSize: 'normal',
      textSpeed: 'normal',
      reducedMotion: false,
      theme: 'dark',
      setFontSize: (fontSize) => set({ fontSize }),
      setTextSpeed: (textSpeed) => set({ textSpeed }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'narrative-engine-settings-v1',
    },
  ),
)
