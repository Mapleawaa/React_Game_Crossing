import type { FontSize, TextSpeed, ThemeMode } from '../store/settings'
import { useSettingsStore } from '../store/settings'

const themeOptions: Array<{ label: string; value: ThemeMode }> = [
  { label: '暗色', value: 'dark' },
  { label: '明亮', value: 'light' },
  { label: '系统', value: 'system' },
]

const fontSizeOptions: Array<{ label: string; value: FontSize }> = [
  { label: '小', value: 'small' },
  { label: '标准', value: 'normal' },
  { label: '大', value: 'large' },
]

const textSpeedOptions: Array<{ label: string; value: TextSpeed }> = [
  { label: '即时', value: 'instant' },
  { label: '标准', value: 'normal' },
  { label: '慢速', value: 'slow' },
]

export function SettingsPanel() {
  const theme = useSettingsStore((state) => state.theme)
  const fontSize = useSettingsStore((state) => state.fontSize)
  const textSpeed = useSettingsStore((state) => state.textSpeed)
  const reducedMotion = useSettingsStore((state) => state.reducedMotion)
  const setTheme = useSettingsStore((state) => state.setTheme)
  const setFontSize = useSettingsStore((state) => state.setFontSize)
  const setTextSpeed = useSettingsStore((state) => state.setTextSpeed)
  const setReducedMotion = useSettingsStore((state) => state.setReducedMotion)

  return (
    <div className='space-y-6'>
      <h2 className='font-medium text-lg'>设置</h2>
      <SegmentedControl label='主题' options={themeOptions} value={theme} onChange={setTheme} />
      <SegmentedControl
        label='字号'
        options={fontSizeOptions}
        value={fontSize}
        onChange={setFontSize}
      />
      <SegmentedControl
        label='文本速度'
        options={textSpeedOptions}
        value={textSpeed}
        onChange={setTextSpeed}
      />
      <label className='flex min-h-11 items-center justify-between gap-4 border-neutral-800 border-t pt-4 text-sm'>
        <span className='text-neutral-300'>减少动效</span>
        <input
          checked={reducedMotion}
          className='h-4 w-4 accent-cyan-300'
          onChange={(event) => setReducedMotion(event.target.checked)}
          type='checkbox'
        />
      </label>
    </div>
  )
}

function SegmentedControl<TValue extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: Array<{ label: string; value: TValue }>
  value: TValue
  onChange: (value: TValue) => void
}) {
  return (
    <fieldset>
      <legend className='mb-3 text-neutral-500 text-xs tracking-[0.2em]'>{label}</legend>
      <div className='grid grid-cols-3 border border-neutral-800'>
        {options.map((option) => (
          <button
            className={`min-h-10 border-neutral-800 border-r px-3 text-sm transition last:border-r-0 focus:outline-none focus:ring-2 focus:ring-cyan-300/70 ${
              option.value === value
                ? 'bg-cyan-300 text-neutral-950'
                : 'bg-neutral-950 text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100'
            }`}
            key={option.value}
            onClick={() => onChange(option.value)}
            type='button'
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
