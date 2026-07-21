import { motion } from 'motion/react'
import { Suspense, lazy, useState } from 'react'
import { GAME_METADATA } from '../config/gameMetadata'
import type { CheckpointSnapshot, SaveSnapshot } from '../store/game'
import type { RunRouteProgress } from '../story/routeTopology'
import { ContentRating } from './BootSequence'
import { SaveLoadPanel } from './SaveLoadPanel'
import { SettingsPanel } from './SettingsPanel'

const RouteArchive = lazy(() =>
  import('./RouteArchive').then((module) => ({ default: module.RouteArchive })),
)

interface TitleMenuProps {
  hasSave: boolean
  lastSavedAt: string | null
  currentRouteNodeId?: string
  routeProgress: RunRouteProgress
  checkpointSnapshots: Record<string, CheckpointSnapshot>
  week: 1 | 2
  createSnapshot: () => SaveSnapshot
  onContinue: () => void
  onNewGame: () => void
  newGamePlusUnlocked: boolean
  onNewGamePlus: () => void
  onLoadSnapshot: (snapshot: SaveSnapshot) => void
  onLoadCheckpoint: (checkpointId: string) => void
}

type TitlePanel = 'settings' | 'archive' | 'load' | 'notice' | 'about' | 'quit' | null

export function TitleMenu({
  hasSave,
  lastSavedAt,
  currentRouteNodeId,
  routeProgress,
  checkpointSnapshots,
  week,
  createSnapshot,
  onContinue,
  onNewGame,
  newGamePlusUnlocked,
  onNewGamePlus,
  onLoadSnapshot,
  onLoadCheckpoint,
}: TitleMenuProps) {
  const [panel, setPanel] = useState<TitlePanel>(null)

  if (panel === 'archive') {
    return (
      <Suspense fallback={<RouteArchiveLoading />}>
        <RouteArchive
          checkpointSnapshots={checkpointSnapshots}
          currentRouteNodeId={currentRouteNodeId}
          onBack={() => setPanel(null)}
          onLoadCheckpoint={onLoadCheckpoint}
          routeProgress={routeProgress}
          week={week}
        />
      </Suspense>
    )
  }

  return (
    <main className='relative min-h-screen overflow-hidden bg-neutral-950 text-neutral-100'>
      <div className='pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.028)_1px,transparent_1px),radial-gradient(circle_at_72%_22%,rgba(8,145,178,0.16),transparent_30%)] bg-[length:100%_4px,auto]' />
      <div className='relative mx-auto grid min-h-screen w-full max-w-7xl px-5 py-6 sm:px-8 lg:grid-cols-[1fr_24rem] lg:px-10'>
        <section className='flex min-h-[58vh] flex-col justify-between border-neutral-800 border-l pl-5 sm:pl-8 lg:min-h-full'>
          <header className='flex items-center gap-3 text-neutral-500 text-xs tracking-[0.26em]'>
            <span>Preview 1.0</span>
            <span className='h-px flex-1 bg-neutral-800' />
            <span>不代表最终品质</span>
          </header>

          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className='py-16 sm:py-24'
            initial={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          >
            <p className='mb-5 text-cyan-300 text-sm tracking-[0.28em]'>Crossing</p>
            <h1 className='max-w-4xl text-balance font-semibold text-5xl leading-tight sm:text-7xl'>
              摆渡人
            </h1>
            <p className='mt-7 max-w-2xl text-neutral-400 text-lg leading-9'>
              有些人渡人，有些人渡己。
            </p>
          </motion.div>

          <footer className='border-neutral-800 border-t pt-4 text-neutral-600 text-xs tracking-[0.18em]'>
            © ArcLeaf Game Studio
          </footer>
        </section>

        <aside className='flex flex-col justify-center border-neutral-800 border-t py-8 lg:border-t-0 lg:border-l lg:pl-8'>
          <motion.div
            animate={{ opacity: 1, x: 0 }}
            initial={{ opacity: 0, x: 10 }}
            key={panel ?? 'main'}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {panel ? (
              <SubMenuPanel
                createSnapshot={createSnapshot}
                onBack={() => setPanel(null)}
                onLoadSnapshot={onLoadSnapshot}
                panel={panel}
              />
            ) : (
              <nav className='space-y-3' aria-label='主菜单'>
                <MenuButton
                  label='继续'
                  disabled={!hasSave}
                  hint={formatSaveTime(lastSavedAt)}
                  onClick={onContinue}
                />
                <MenuButton label='新游戏' onClick={onNewGame} />
                {newGamePlusUnlocked ? (
                  <MenuButton label='重来。我好像漏了什么。' onClick={onNewGamePlus} />
                ) : null}
                <MenuButton label='读档' onClick={() => setPanel('load')} />
                <MenuButton label='设置' onClick={() => setPanel('settings')} />
                <MenuButton label='档案' onClick={() => setPanel('archive')} />
                <MenuButton label='内容声明' onClick={() => setPanel('notice')} />
                <MenuButton label='关于游戏' onClick={() => setPanel('about')} />
                <MenuButton label='退出' onClick={() => setPanel('quit')} />
              </nav>
            )}
          </motion.div>
        </aside>
      </div>
    </main>
  )
}

function RouteArchiveLoading() {
  return (
    <main className='flex min-h-screen items-center justify-center bg-[#080a0b] font-mono text-neutral-600 text-xs'>
      ROUTE ARCHIVE / LOADING
    </main>
  )
}

function SubMenuPanel({
  panel,
  createSnapshot,
  onLoadSnapshot,
  onBack,
}: {
  panel: NonNullable<TitlePanel>
  createSnapshot: () => SaveSnapshot
  onLoadSnapshot: (snapshot: SaveSnapshot) => void
  onBack: () => void
}) {
  return (
    <section className='border border-neutral-800 bg-neutral-950/80 p-5'>
      <button className='mb-6 menu-action' onClick={onBack} type='button'>
        返回主菜单
      </button>
      {panel === 'settings' ? <SettingsPanel /> : null}
      {panel === 'load' ? (
        <SaveLoadPanel createSnapshot={createSnapshot} mode='load' onLoad={onLoadSnapshot} />
      ) : null}
      {panel === 'notice' ? <NoticePanel /> : null}
      {panel === 'about' ? <AboutPanel /> : null}
      {panel === 'quit' ? <EmptyPanel title='退出' body='Web 版本无法直接关闭窗口。' /> : null}
    </section>
  )
}

function NoticePanel() {
  return (
    <div>
      <p className='font-mono text-cyan-300 text-xs tracking-[0.2em]'>
        {GAME_METADATA.notice.eyebrow}
      </p>
      <h2 className='mt-3 font-medium text-xl'>{GAME_METADATA.notice.title}</h2>
      <div className='mt-5 space-y-4 text-neutral-500 text-sm leading-7'>
        <p>{GAME_METADATA.notice.fiction}</p>
        <p>{GAME_METADATA.notice.content}</p>
      </div>
      <ContentRating className='mt-6' />
    </div>
  )
}

function AboutPanel() {
  return (
    <div className='space-y-5'>
      <div>
        <p className='font-mono text-cyan-300 text-xs tracking-[0.2em]'>
          {GAME_METADATA.about.eyebrow}
        </p>
        <h2 className='mt-3 font-medium text-xl'>{GAME_METADATA.about.title}</h2>
      </div>

      <div className='space-y-4 text-neutral-400 text-sm leading-7'>
        <p>{GAME_METADATA.about.intro}</p>
        <p>{GAME_METADATA.about.story}</p>
        <p>{GAME_METADATA.about.tech}</p>
        <p>{GAME_METADATA.about.workflow}</p>
      </div>

      <div className='border-neutral-800 border-t pt-4'>
        <p className='font-mono text-neutral-500 text-xs tracking-[0.18em]'>CREDITS / 制作人员</p>
        <ul className='mt-3 space-y-1.5 text-neutral-400 text-sm'>
          <li>{GAME_METADATA.about.credits.creator}</li>
          <li>{GAME_METADATA.about.credits.script}</li>
          <li>{GAME_METADATA.about.credits.program}</li>
          <li>{GAME_METADATA.about.credits.qa}</li>
          <li>{GAME_METADATA.about.credits.deploy}</li>
        </ul>
      </div>

      <div className='border-neutral-800 border-t pt-4 space-y-1 font-mono text-neutral-600 text-xs'>
        <p>{GAME_METADATA.about.stats.cost}</p>
        <p>{GAME_METADATA.about.stats.duration}</p>
      </div>
    </div>
  )
}

function MenuButton({
  label,
  hint,
  disabled = false,
  onClick,
}: {
  label: string
  hint?: string
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      className='group grid min-h-14 w-full grid-cols-[1fr_auto] items-center border border-neutral-800 bg-neutral-900/35 px-5 text-left transition enabled:hover:border-cyan-300/60 enabled:hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-cyan-300/70'
      disabled={disabled}
      onClick={onClick}
      type='button'
    >
      <span className='font-medium text-neutral-100'>{label}</span>
      <span className='text-neutral-500 text-xs'>{disabled ? '无记录' : hint}</span>
    </button>
  )
}

function EmptyPanel({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h2 className='font-medium text-lg'>{title}</h2>
      <p className='mt-3 text-neutral-500 text-sm leading-7'>{body}</p>
    </div>
  )
}

function formatSaveTime(value: string | null): string {
  if (!value) {
    return ''
  }

  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
