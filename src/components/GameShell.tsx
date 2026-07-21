import { AnimatePresence, motion } from 'motion/react'
import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import { tagValue } from '../engine/StoryController'
import type { EndingTone, StoryChoice, StoryFrame } from '../engine/types'
import type {
  CheckpointSnapshot,
  RouteEntry,
  SaveSnapshot,
  StoryTranscriptEntry,
} from '../store/game'
import type { FontSize, TextSpeed } from '../store/settings'
import { type RunRouteProgress, getRouteDiscoveryPercent } from '../story/routeTopology'
import { SaveLoadPanel, formatPlaytime } from './SaveLoadPanel'
import { SettingsPanel } from './SettingsPanel'

const RouteArchive = lazy(() =>
  import('./RouteArchive').then((module) => ({ default: module.RouteArchive })),
)

interface GameShellProps {
  scene: StoryFrame
  history: RouteEntry[]
  transcript: StoryTranscriptEntry[]
  phase: 'playing' | 'paused' | 'ending'
  debugVisible: boolean
  lastSavedAt: string | null
  playtimeMs: number
  sessionStartedAt: number | null
  routeProgress: RunRouteProgress
  checkpointSnapshots: Record<string, CheckpointSnapshot>
  week: 1 | 2
  fontSize: FontSize
  textSpeed: TextSpeed
  reducedMotion: boolean
  createSnapshot: () => SaveSnapshot
  onChoose: (choice: StoryChoice) => void
  onAdvance: () => void
  onOpenMenu: () => void
  onCloseMenu: () => void
  onRestart: () => void
  onReturnToTitle: () => void
  onLoadSnapshot: (snapshot: SaveSnapshot) => void
  onLoadCheckpoint: (checkpointId: string) => void
  onToggleDebug: () => void
}

export function GameShell({
  scene,
  history,
  transcript,
  phase,
  debugVisible,
  lastSavedAt,
  playtimeMs,
  sessionStartedAt,
  routeProgress,
  checkpointSnapshots,
  week,
  fontSize,
  textSpeed,
  reducedMotion,
  createSnapshot,
  onChoose,
  onAdvance,
  onOpenMenu,
  onCloseMenu,
  onRestart,
  onReturnToTitle,
  onLoadSnapshot,
  onLoadCheckpoint,
  onToggleDebug,
}: GameShellProps) {
  const isPaused = phase === 'paused'
  const elapsedMs = useElapsedPlaytime(playtimeMs, sessionStartedAt, !isPaused)
  const progress = getRouteDiscoveryPercent(routeProgress, week)

  return (
    <main className='relative h-dvh min-h-screen overflow-hidden bg-neutral-950 text-neutral-100'>
      <div className='pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.026)_1px,transparent_1px),radial-gradient(circle_at_18%_14%,rgba(34,211,238,0.09),transparent_28%)] bg-[length:100%_4px,auto]' />
      <div className='relative mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col px-4 py-4 sm:px-6 lg:px-8'>
        <GameHeader
          elapsedMs={elapsedMs}
          interactionHint={readerInteractionHint(scene)}
          lastSavedAt={lastSavedAt}
          onOpenMenu={onOpenMenu}
          progress={progress}
        />
        <AnimatePresence mode='wait'>
          <ReaderPanel
            fontSize={fontSize}
            isPaused={isPaused}
            key={scene.id}
            onAdvance={onAdvance}
            onChoose={onChoose}
            onRestart={onRestart}
            onReturnToTitle={onReturnToTitle}
            reducedMotion={reducedMotion}
            scene={scene}
            textSpeed={textSpeed}
            transcript={transcript}
          />
        </AnimatePresence>
        <GameFooter debugVisible={debugVisible} onToggleDebug={onToggleDebug} />
      </div>

      {debugVisible ? <DebugPanel history={history} scene={scene} /> : null}
      <AnimatePresence>
        {isPaused ? (
          <PauseMenu
            createSnapshot={createSnapshot}
            checkpointSnapshots={checkpointSnapshots}
            currentRouteNodeId={scene.routeNodeId}
            onClose={onCloseMenu}
            onLoadSnapshot={onLoadSnapshot}
            onLoadCheckpoint={onLoadCheckpoint}
            onRestart={onRestart}
            onReturnToTitle={onReturnToTitle}
            routeProgress={routeProgress}
            week={week}
          />
        ) : null}
      </AnimatePresence>
    </main>
  )
}

function GameHeader({
  progress,
  interactionHint,
  elapsedMs,
  lastSavedAt,
  onOpenMenu,
}: {
  progress: number
  interactionHint: string
  elapsedMs: number
  lastSavedAt: string | null
  onOpenMenu: () => void
}) {
  return (
    <header className='grid min-h-12 shrink-0 gap-3 border-neutral-800 border-b py-3 text-neutral-500 text-xs sm:grid-cols-[1fr_auto] sm:items-center'>
      <div className='flex flex-wrap items-center gap-x-4 gap-y-2'>
        <span className='text-neutral-300'>{interactionHint}</span>
        <span>路线发现 {progress}%</span>
      </div>
      <div className='flex flex-wrap items-center gap-4 sm:justify-end'>
        <span>TIME {formatPlaytime(elapsedMs)}</span>
        <span>{lastSavedAt ? `AUTO ${formatSaveTime(lastSavedAt)}` : 'NO SAVE'}</span>
        <button
          className='min-h-9 border border-neutral-800 px-3 text-neutral-300 transition hover:border-cyan-300/60 hover:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-cyan-300/70'
          onClick={onOpenMenu}
          type='button'
        >
          菜单
        </button>
      </div>
    </header>
  )
}

function ReaderPanel({
  scene,
  transcript,
  fontSize,
  isPaused,
  textSpeed,
  reducedMotion,
  onChoose,
  onAdvance,
  onRestart,
  onReturnToTitle,
}: {
  scene: StoryFrame
  transcript: StoryTranscriptEntry[]
  fontSize: FontSize
  isPaused: boolean
  textSpeed: TextSpeed
  reducedMotion: boolean
  onChoose: (choice: StoryChoice) => void
  onAdvance: () => void
  onRestart: () => void
  onReturnToTitle: () => void
}) {
  const paragraphs = useMemo(() => scene.body, [scene.body])
  const typewriter = useTypewriter(paragraphs, textSpeed, reducedMotion)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const followLatestRef = useRef(true)
  const currentEntryId = `${scene.id}-${scene.revision}`
  const previousEntries = useMemo(
    () => transcript.filter((entry) => entry.sceneId === scene.id && entry.id !== currentEntryId),
    [currentEntryId, scene.id, transcript],
  )
  const visibleCharacterCount = typewriter.visibleParagraphs.reduce(
    (total, paragraph) => total + paragraph.length,
    0,
  )
  const latestTextKey = `${scene.revision}:${visibleCharacterCount}`
  const activeSceneId = scene.id

  useEffect(() => {
    const nextTitle = tagValue(scene.tags, 'document-title')
    if (nextTitle) {
      document.title = nextTitle
    }
  }, [scene.tags])

  useEffect(() => {
    if (!latestTextKey) return
    const container = scrollContainerRef.current
    if (container && followLatestRef.current) {
      container.scrollTop = container.scrollHeight
    }
  }, [latestTextKey])

  useEffect(() => {
    if (!activeSceneId) return
    const container = scrollContainerRef.current
    followLatestRef.current = true
    if (container) container.scrollTop = 0
  }, [activeSceneId])

  const handleReaderInteraction = () => {
    if (!typewriter.done) {
      typewriter.completeAll()
    } else if (scene.continueMode === 'append') {
      onAdvance()
    }
  }

  const hasVisibleText = previousEntries.length > 0 || paragraphs.length > 0

  return (
    <motion.section
      animate={{ opacity: 1 }}
      className='flex min-h-0 flex-1 flex-col py-6 sm:py-8'
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
      onClick={(event) => {
        if ((event.target as HTMLElement).closest('button')) return
        handleReaderInteraction()
      }}
      transition={{ duration: reducedMotion ? 0 : 0.2, ease: 'easeOut' }}
    >
      <header className='shrink-0 border-neutral-800 border-l pl-5 sm:pl-8'>
        <p className='font-mono text-cyan-300 text-xs'>{scene.marker}</p>
        <h1 className='mt-3 max-w-4xl font-semibold text-4xl leading-tight sm:text-6xl'>
          {scene.title}
        </h1>
      </header>

      <div
        className='mt-7 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-2 sm:mt-9'
        onScroll={(event) => {
          const container = event.currentTarget
          const distanceFromBottom =
            container.scrollHeight - container.scrollTop - container.clientHeight
          followLatestRef.current = distanceFromBottom < 72
        }}
        ref={scrollContainerRef}
      >
        <article className='max-w-3xl border-neutral-800 border-l pb-10 pl-5 sm:pl-8'>
          {hasVisibleText ? (
            <div className={`w-full text-left leading-9 ${fontSizeClass(fontSize)}`}>
              <div className='space-y-5 text-neutral-400'>
                {previousEntries.flatMap((entry) =>
                  entry.paragraphs.map((paragraph) => (
                    <p key={`${entry.id}-${paragraph}`}>{paragraph}</p>
                  )),
                )}
              </div>
              <div aria-live='polite' className='mt-5 space-y-5 text-neutral-200'>
                {typewriter.visibleParagraphs.map((paragraph) => (
                  <p key={`${currentEntryId}-${paragraph}`}>{paragraph}</p>
                ))}
              </div>
            </div>
          ) : null}

          {typewriter.done ? (
            scene.isComplete ? (
              <EndingActions
                label={scene.ending?.label ?? 'STORY COMPLETE'}
                tone={scene.ending?.tone ?? 'normal'}
                onRestart={onRestart}
                onReturnToTitle={onReturnToTitle}
              />
            ) : scene.choices.length > 0 ? (
              <TimedChoiceList
                choices={scene.choices}
                isPaused={isPaused}
                key={`${scene.id}-${scene.revision}`}
                onChoose={onChoose}
                reducedMotion={reducedMotion}
                scene={scene}
              />
            ) : scene.continueMode === 'scene' ? (
              <ContinueAction onAdvance={onAdvance} />
            ) : null
          ) : null}
        </article>
      </div>
    </motion.section>
  )
}

function readerInteractionHint(scene: StoryFrame): string {
  if (scene.isComplete) return '本章结束'
  if (scene.choices.length > 0) return '请选择下一步'
  if (scene.continueMode === 'scene') return '本章结束，请点击继续'
  return '单击空白显示下一句'
}

function TimedChoiceList({
  choices,
  scene,
  isPaused,
  reducedMotion,
  onChoose,
}: {
  choices: StoryChoice[]
  scene: StoryFrame
  isPaused: boolean
  reducedMotion: boolean
  onChoose: (choice: StoryChoice) => void
}) {
  const timingCommand = scene.commands.find(
    (command) => command.name === 'timed-choice' || command.name === 'qte',
  )
  const timeoutMs = Number(tagValue(scene.tags, 'timeout-ms'))
  const timeoutChoiceId = tagValue(scene.tags, 'timeout-choice')
  const timeoutChoice = choices.find((choice) => choice.id === timeoutChoiceId)
  const remainingMs = useRef(timeoutMs)
  const [timerRun, setTimerRun] = useState(0)

  useEffect(() => {
    if (!timingCommand || !timeoutChoice || isPaused) {
      return
    }

    const startedAt = Date.now()
    const timer = window.setTimeout(() => onChoose(timeoutChoice), remainingMs.current)
    setTimerRun((value) => value + 1)

    return () => {
      window.clearTimeout(timer)
      remainingMs.current = Math.max(0, remainingMs.current - (Date.now() - startedAt))
    }
  }, [isPaused, onChoose, timeoutChoice, timingCommand])

  return (
    <div className='mt-12 max-w-3xl'>
      {timingCommand && timeoutChoice ? (
        <div
          aria-label={timingCommand.name === 'qte' ? '快速反应剩余时间' : '选择剩余时间'}
          className='mb-4 h-px overflow-hidden bg-neutral-800'
        >
          <motion.div
            animate={{ scaleX: isPaused ? undefined : 0 }}
            className='h-full origin-left bg-cyan-300'
            initial={{ scaleX: remainingMs.current / timeoutMs }}
            key={timerRun}
            transition={{
              duration: reducedMotion ? 0 : remainingMs.current / 1000,
              ease: 'linear',
            }}
          />
        </div>
      ) : null}
      <ChoiceList choices={choices} onChoose={onChoose} />
    </div>
  )
}

function ChoiceList({
  choices,
  onChoose,
}: { choices: StoryChoice[]; onChoose: (choice: StoryChoice) => void }) {
  return (
    <div className='space-y-3'>
      {choices.map((choice, index) => (
        <button
          className='group grid w-full grid-cols-[3rem_1fr] items-center border border-neutral-800 bg-neutral-900/45 text-left transition hover:border-cyan-300/60 hover:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-cyan-300/70 active:translate-y-px'
          key={choice.id}
          onClick={() => onChoose(choice)}
          type='button'
        >
          <span className='flex h-full min-h-14 items-center justify-center border-neutral-800 border-r font-mono text-cyan-300 text-xs uppercase group-hover:border-cyan-300/50'>
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className='px-4 py-4 text-neutral-100 leading-7'>{choice.text}</span>
        </button>
      ))}
    </div>
  )
}

function ContinueAction({ onAdvance }: { onAdvance: () => void }) {
  return (
    <button className='menu-action mt-10' onClick={onAdvance} type='button'>
      继续
    </button>
  )
}

function EndingActions({
  label,
  tone,
  onRestart,
  onReturnToTitle,
}: {
  label: string
  tone: EndingTone
  onRestart: () => void
  onReturnToTitle: () => void
}) {
  return (
    <div className={`mt-12 max-w-3xl border p-5 ${endingToneClass(tone)}`}>
      <p className='font-mono text-xs tracking-[0.24em]'>{label}</p>
      <div className='mt-5 flex flex-wrap gap-3'>
        <button className='menu-action' onClick={onRestart} type='button'>
          重新开始
        </button>
        <button className='menu-action' onClick={onReturnToTitle} type='button'>
          回到标题
        </button>
      </div>
    </div>
  )
}

function endingToneClass(tone: EndingTone): string {
  if (tone === 'true') return 'border-amber-300/40 bg-amber-300/5 text-amber-200'
  if (tone === 'bad') return 'border-red-400/35 bg-red-400/5 text-red-300'
  if (tone === 'betrayal') return 'border-violet-400/35 bg-violet-400/5 text-violet-300'
  if (tone === 'pseudo') return 'border-sky-300/35 bg-sky-300/5 text-sky-200'
  return 'border-emerald-300/35 bg-emerald-300/5 text-emerald-300'
}

function GameFooter({
  debugVisible,
  onToggleDebug,
}: { debugVisible: boolean; onToggleDebug: () => void }) {
  return (
    <footer className='flex min-h-11 shrink-0 items-center justify-between border-neutral-800 border-t text-neutral-600 text-xs'>
      <span>You are not the ferryman. You are the fare.</span>
      <button
        className='text-neutral-600 transition hover:text-neutral-300'
        onClick={onToggleDebug}
        type='button'
      >
        {debugVisible ? '关闭调试' : '调试'}
      </button>
    </footer>
  )
}

type PausePanel = 'main' | 'save' | 'load' | 'settings' | 'route'

function PauseMenu({
  currentRouteNodeId,
  routeProgress,
  checkpointSnapshots,
  week,
  createSnapshot,
  onLoadSnapshot,
  onLoadCheckpoint,
  onClose,
  onRestart,
  onReturnToTitle,
}: {
  currentRouteNodeId?: string
  routeProgress: RunRouteProgress
  checkpointSnapshots: Record<string, CheckpointSnapshot>
  week: 1 | 2
  createSnapshot: () => SaveSnapshot
  onLoadSnapshot: (snapshot: SaveSnapshot) => void
  onLoadCheckpoint: (checkpointId: string) => void
  onClose: () => void
  onRestart: () => void
  onReturnToTitle: () => void
}) {
  const [panel, setPanel] = useState<PausePanel>('main')

  if (panel === 'route') {
    return (
      <Suspense fallback={<RouteArchiveLoading />}>
        <RouteArchive
          checkpointSnapshots={checkpointSnapshots}
          currentRouteNodeId={currentRouteNodeId}
          onBack={() => setPanel('main')}
          onLoadCheckpoint={onLoadCheckpoint}
          routeProgress={routeProgress}
          week={week}
        />
      </Suspense>
    )
  }

  return (
    <motion.div
      animate={{ opacity: 1 }}
      className='fixed inset-0 z-20 flex items-center justify-center overflow-y-auto bg-neutral-950/82 px-4 py-6 backdrop-blur-sm'
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <section className='w-full max-w-4xl border border-neutral-800 bg-neutral-950 p-5 shadow-2xl shadow-black/50'>
        {panel === 'main' ? (
          <div>
            <h2 className='font-semibold text-2xl'>菜单</h2>
            <div className='mt-6 grid gap-3 sm:grid-cols-2'>
              <button className='pause-button' onClick={onClose} type='button'>
                继续
              </button>
              <button className='pause-button' onClick={() => setPanel('save')} type='button'>
                保存
              </button>
              <button className='pause-button' onClick={() => setPanel('load')} type='button'>
                读取
              </button>
              <button className='pause-button' onClick={() => setPanel('route')} type='button'>
                进度视轴
              </button>
              <button className='pause-button' onClick={() => setPanel('settings')} type='button'>
                设置
              </button>
              <button className='pause-button' onClick={onReturnToTitle} type='button'>
                回到标题
              </button>
              <button className='pause-button sm:col-span-2' onClick={onRestart} type='button'>
                重新开始
              </button>
            </div>
          </div>
        ) : null}
        {panel === 'save' ? (
          <SaveLoadPanel
            createSnapshot={createSnapshot}
            mode='save'
            onBack={() => setPanel('main')}
            onLoad={onLoadSnapshot}
          />
        ) : null}
        {panel === 'load' ? (
          <SaveLoadPanel
            createSnapshot={createSnapshot}
            mode='load'
            onBack={() => setPanel('main')}
            onLoad={(snapshot) => {
              onLoadSnapshot(snapshot)
              setPanel('main')
            }}
          />
        ) : null}
        {panel === 'settings' ? (
          <div>
            <button className='mb-6 menu-action' onClick={() => setPanel('main')} type='button'>
              返回
            </button>
            <SettingsPanel />
          </div>
        ) : null}
      </section>
    </motion.div>
  )
}

function RouteArchiveLoading() {
  return (
    <main className='fixed inset-0 z-50 flex items-center justify-center bg-[#080a0b] font-mono text-neutral-600 text-xs'>
      ROUTE ARCHIVE / LOADING
    </main>
  )
}

function DebugPanel({ scene, history }: { scene: StoryFrame; history: RouteEntry[] }) {
  return (
    <aside className='fixed right-4 bottom-14 z-10 w-[min(22rem,calc(100vw-2rem))] border border-neutral-800 bg-neutral-950/95 p-4 text-sm shadow-xl shadow-black/40'>
      <h2 className='text-neutral-500 text-xs tracking-[0.22em]'>DEBUG</h2>
      <div className='mt-3 space-y-1 font-mono text-neutral-500 text-xs'>
        <p>{scene.id}</p>
        <p>revision {scene.revision}</p>
        <p>{scene.canContinue ? 'can continue' : 'waiting / complete'}</p>
        {scene.tags.map((tag) => (
          <p className='truncate' key={tag}>
            #{tag}
          </p>
        ))}
      </div>
      <ol className='mt-4 space-y-1 text-neutral-500'>
        {history.slice(-6).map((entry) => (
          <li className='truncate' key={entry.visitId}>
            {entry.title}
          </li>
        ))}
      </ol>
    </aside>
  )
}

function useTypewriter(paragraphs: string[], textSpeed: TextSpeed, reducedMotion: boolean) {
  const [paragraphIndex, setParagraphIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const instant = reducedMotion || textSpeed === 'instant'
  const intervalMs = textSpeed === 'slow' ? 48 : 22

  useEffect(() => {
    setParagraphIndex(0)
    setCharIndex(instant ? (paragraphs[0]?.length ?? 0) : 0)
  }, [instant, paragraphs])

  useEffect(() => {
    if (instant || paragraphIndex >= paragraphs.length) {
      return
    }

    const currentParagraph = paragraphs[paragraphIndex] ?? ''

    if (charIndex < currentParagraph.length) {
      const timer = window.setTimeout(() => setCharIndex((value) => value + 1), intervalMs)
      return () => window.clearTimeout(timer)
    }

    if (paragraphIndex < paragraphs.length - 1) {
      const timer = window.setTimeout(() => {
        setParagraphIndex((value) => value + 1)
        setCharIndex(0)
      }, 180)
      return () => window.clearTimeout(timer)
    }
  }, [charIndex, instant, intervalMs, paragraphIndex, paragraphs])

  if (instant) {
    return {
      done: true,
      visibleParagraphs: paragraphs,
      completeAll: () => undefined,
    }
  }

  const visibleParagraphs = paragraphs.slice(0, paragraphIndex)
  const currentParagraph = paragraphs[paragraphIndex]

  if (currentParagraph !== undefined) {
    visibleParagraphs.push(currentParagraph.slice(0, charIndex))
  }

  return {
    done:
      paragraphIndex >= paragraphs.length - 1 &&
      charIndex >= (paragraphs[paragraphs.length - 1]?.length ?? 0),
    visibleParagraphs,
    completeAll: () => {
      const lastParagraphIndex = Math.max(paragraphs.length - 1, 0)
      const lastParagraph = paragraphs[lastParagraphIndex]

      setParagraphIndex(lastParagraphIndex)
      setCharIndex(lastParagraph?.length ?? 0)
    },
  }
}

function useElapsedPlaytime(
  playtimeMs: number,
  sessionStartedAt: number | null,
  active: boolean,
): number {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!active || !sessionStartedAt) {
      return
    }

    const timer = window.setInterval(() => setTick((value) => value + 1), 1000)
    return () => window.clearInterval(timer)
  }, [active, sessionStartedAt])

  if (!active || !sessionStartedAt) {
    return playtimeMs
  }

  return playtimeMs + Date.now() - sessionStartedAt + tick * 0
}

function fontSizeClass(fontSize: FontSize): string {
  if (fontSize === 'small') {
    return 'text-base'
  }

  if (fontSize === 'large') {
    return 'text-xl sm:text-2xl'
  }

  return 'text-lg sm:text-xl'
}

function formatSaveTime(value: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
