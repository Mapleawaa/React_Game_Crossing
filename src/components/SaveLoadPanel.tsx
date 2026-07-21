import { type SaveSnapshot, getSnapshotRouteProgress, isSnapshotCompatible } from '../store/game'
import { type SaveSlotId, useSaveStore } from '../store/saves'
import { getRouteDiscoveryPercent } from '../story/routeTopology'

interface SaveLoadPanelProps {
  mode: 'save' | 'load'
  createSnapshot: () => SaveSnapshot
  onLoad: (snapshot: SaveSnapshot) => void
  onBack?: () => void
}

export function SaveLoadPanel({ mode, createSnapshot, onLoad, onBack }: SaveLoadPanelProps) {
  const slots = useSaveStore((state) => state.slots)
  const saveToSlot = useSaveStore((state) => state.saveToSlot)
  const deleteSlot = useSaveStore((state) => state.deleteSlot)

  return (
    <section className='space-y-4'>
      <PanelHeader mode={mode} onBack={onBack} />
      <div className='grid gap-3 sm:grid-cols-2'>
        {slots.map((slot) => {
          const compatible = !slot.snapshot || isSnapshotCompatible(slot.snapshot)
          const routeProgress = slot.snapshot ? getSnapshotRouteProgress(slot.snapshot) : null

          return (
            <article className='border border-neutral-800 bg-neutral-950/70 p-4' key={slot.slotId}>
              <div className='flex items-start justify-between gap-3'>
                <div>
                  <p className='font-mono text-cyan-300 text-xs tracking-[0.18em]'>
                    SLOT {slot.slotId}
                  </p>
                  <h3 className='mt-2 font-medium text-neutral-100'>
                    {slot.snapshot ? slot.snapshot.title : '空档案'}
                  </h3>
                </div>
                <span className='text-neutral-500 text-xs'>
                  {slot.snapshot ? formatSaveTime(slot.snapshot.savedAt) : '--'}
                </span>
              </div>

              <p className='mt-3 min-h-10 text-neutral-500 text-sm leading-6'>
                {slot.snapshot
                  ? compatible
                    ? `${slot.snapshot.marker} / ${formatPlaytime(slot.snapshot.playtimeMs)}`
                    : '剧情版本已变更，该存档不可读取。'
                  : '没有保存记录。'}
              </p>
              {slot.snapshot && routeProgress && compatible ? (
                <p className='mt-2 font-mono text-neutral-600 text-xs'>
                  路线 {getRouteDiscoveryPercent(routeProgress, slot.snapshot.week)}% / CHECKPOINT{' '}
                  {routeProgress.unlockedCheckpointIds.length}
                </p>
              ) : null}

              <div className='mt-4 flex flex-wrap gap-2'>
                {mode === 'save' ? (
                  <button
                    className='menu-action'
                    onClick={() => saveToSlot(slot.slotId, createSnapshot())}
                    type='button'
                  >
                    {slot.snapshot ? '覆盖' : '保存'}
                  </button>
                ) : (
                  <button
                    className='menu-action disabled:cursor-not-allowed disabled:opacity-40'
                    disabled={!slot.snapshot || !compatible}
                    onClick={() => slot.snapshot && onLoad(slot.snapshot)}
                    type='button'
                  >
                    读取
                  </button>
                )}
                <button
                  className='menu-action disabled:cursor-not-allowed disabled:opacity-40'
                  disabled={!slot.snapshot}
                  onClick={() => deleteSlot(slot.slotId as SaveSlotId)}
                  type='button'
                >
                  删除
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function PanelHeader({ mode, onBack }: { mode: 'save' | 'load'; onBack?: () => void }) {
  return (
    <div className='flex items-center justify-between gap-4'>
      <div>
        <p className='text-cyan-300 text-xs tracking-[0.24em]'>
          {mode === 'save' ? 'SAVE' : 'LOAD'}
        </p>
        <h2 className='mt-2 font-semibold text-2xl'>{mode === 'save' ? '保存档案' : '读取档案'}</h2>
      </div>
      {onBack ? (
        <button className='menu-action' onClick={onBack} type='button'>
          返回
        </button>
      ) : null}
    </div>
  )
}

function formatSaveTime(value: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function formatPlaytime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
