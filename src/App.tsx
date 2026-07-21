import { useEffect, useState } from 'react'
import { BootSequence } from './components/BootSequence'
import { GameShell } from './components/GameShell'
import { TitleMenu } from './components/TitleMenu'
import { useGameStore } from './store/game'
import { isNewGamePlusUnlocked, useMetaStore } from './store/meta'
import { useSettingsStore } from './store/settings'

function App() {
  const [bootComplete, setBootComplete] = useState(false)
  const phase = useGameStore((state) => state.phase)
  const frame = useGameStore((state) => state.frame)
  const history = useGameStore((state) => state.history)
  const transcript = useGameStore((state) => state.transcript)
  const hasSave = useGameStore((state) => state.hasSave)
  const lastSavedAt = useGameStore((state) => state.lastSavedAt)
  const debugVisible = useGameStore((state) => state.debugVisible)
  const playtimeMs = useGameStore((state) => state.playtimeMs)
  const sessionStartedAt = useGameStore((state) => state.sessionStartedAt)
  const routeProgress = useGameStore((state) => state.routeProgress)
  const checkpointSnapshots = useGameStore((state) => state.checkpointSnapshots)
  const week = useGameStore((state) => state.week)
  const runtimeError = useGameStore((state) => state.runtimeError)
  const newGame = useGameStore((state) => state.newGame)
  const newGamePlus = useGameStore((state) => state.newGamePlus)
  const continueGame = useGameStore((state) => state.continueGame)
  const advanceStory = useGameStore((state) => state.advanceStory)
  const chooseOption = useGameStore((state) => state.chooseOption)
  const openPauseMenu = useGameStore((state) => state.openPauseMenu)
  const closePauseMenu = useGameStore((state) => state.closePauseMenu)
  const restartGame = useGameStore((state) => state.restartGame)
  const returnToTitle = useGameStore((state) => state.returnToTitle)
  const toggleDebug = useGameStore((state) => state.toggleDebug)
  const loadSnapshot = useGameStore((state) => state.loadSnapshot)
  const loadCheckpoint = useGameStore((state) => state.loadCheckpoint)
  const createSnapshot = useGameStore((state) => state.createSnapshot)
  const clearRuntimeError = useGameStore((state) => state.clearRuntimeError)

  const firstClear = useMetaStore((state) => state.firstClear)
  const hookIds = useMetaStore((state) => state.hookIds)

  const fontSize = useSettingsStore((state) => state.fontSize)
  const textSpeed = useSettingsStore((state) => state.textSpeed)
  const reducedMotion = useSettingsStore((state) => state.reducedMotion)
  const theme = useSettingsStore((state) => state.theme)

  useEffect(() => {
    const root = document.documentElement
    const media = window.matchMedia('(prefers-color-scheme: light)')

    function applyTheme() {
      const resolvedTheme = theme === 'system' ? (media.matches ? 'light' : 'dark') : theme
      root.dataset.theme = resolvedTheme
    }

    applyTheme()
    media.addEventListener('change', applyTheme)

    return () => media.removeEventListener('change', applyTheme)
  }, [theme])

  useEffect(() => {
    if (phase === 'title') {
      document.title = '摆渡人'
    }
  }, [phase])

  if (!bootComplete) {
    return <BootSequence onComplete={() => setBootComplete(true)} reducedMotion={reducedMotion} />
  }

  if (runtimeError) {
    return <RuntimeErrorScreen message={runtimeError} onBack={clearRuntimeError} />
  }

  if (phase === 'title') {
    return (
      <TitleMenu
        checkpointSnapshots={checkpointSnapshots}
        createSnapshot={createSnapshot}
        currentRouteNodeId={frame?.routeNodeId}
        hasSave={hasSave}
        lastSavedAt={lastSavedAt}
        onContinue={continueGame}
        onLoadSnapshot={loadSnapshot}
        onLoadCheckpoint={loadCheckpoint}
        onNewGame={newGame}
        onNewGamePlus={newGamePlus}
        newGamePlusUnlocked={isNewGamePlusUnlocked({ firstClear, hookIds })}
        routeProgress={routeProgress}
        week={week}
      />
    )
  }

  if (!frame) {
    return <RuntimeErrorScreen message='剧情运行状态不完整。' onBack={returnToTitle} />
  }

  return (
    <GameShell
      checkpointSnapshots={checkpointSnapshots}
      createSnapshot={createSnapshot}
      debugVisible={debugVisible}
      fontSize={fontSize}
      history={history}
      lastSavedAt={lastSavedAt}
      onChoose={chooseOption}
      onAdvance={advanceStory}
      onCloseMenu={closePauseMenu}
      onLoadSnapshot={loadSnapshot}
      onLoadCheckpoint={loadCheckpoint}
      onOpenMenu={openPauseMenu}
      onRestart={restartGame}
      onReturnToTitle={returnToTitle}
      onToggleDebug={toggleDebug}
      phase={phase}
      playtimeMs={playtimeMs}
      reducedMotion={reducedMotion}
      routeProgress={routeProgress}
      scene={frame}
      sessionStartedAt={sessionStartedAt}
      textSpeed={textSpeed}
      transcript={transcript}
      week={week}
    />
  )
}

function RuntimeErrorScreen({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <main className='flex min-h-screen items-center justify-center bg-neutral-950 px-5 text-neutral-100'>
      <section className='w-full max-w-2xl border-neutral-800 border-l pl-6'>
        <p className='font-mono text-red-300 text-xs tracking-[0.2em]'>STORY RUNTIME ERROR</p>
        <h1 className='mt-4 font-semibold text-3xl'>剧情无法继续</h1>
        <p className='mt-5 whitespace-pre-wrap text-neutral-400 leading-8'>{message}</p>
        <button className='menu-action mt-8' onClick={onBack} type='button'>
          返回标题
        </button>
      </section>
    </main>
  )
}

export default App
