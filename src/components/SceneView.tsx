import { AnimatePresence, motion } from 'motion/react'
import type { GameFlags, Scene, SceneChoice } from '../engine/types'
import type { RouteEntry } from '../store/game'
import { getScene, resolveSceneBody } from '../story/sampleScenes'

interface SceneViewProps {
  scene: Scene
  flags: GameFlags
  history: RouteEntry[]
  onChoose: (choice: SceneChoice) => void
  onRestart: () => void
}

export function SceneView({ scene, flags, history, onChoose, onRestart }: SceneViewProps) {
  const paragraphs = resolveSceneBody(scene, flags)
  const recentHistory = history.slice(-5)

  return (
    <main className='min-h-screen overflow-hidden bg-neutral-950 text-neutral-100'>
      <div className='pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,0.08),transparent_28%),linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[length:auto,100%_3px]' />
      <div className='relative mx-auto grid min-h-screen w-full max-w-7xl gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[1fr_18rem] lg:px-8'>
        <section className='flex min-h-[calc(100vh-2.5rem)] flex-col justify-between border-neutral-800 border-l pl-4 sm:pl-7'>
          <AnimatePresence mode='wait'>
            <motion.article
              animate={{ opacity: 1, y: 0 }}
              className='w-full max-w-3xl py-8 sm:py-14'
              exit={{ opacity: 0, y: -10 }}
              initial={{ opacity: 0, y: 12 }}
              key={scene.id}
              transition={{ duration: 0.28, ease: 'easeOut' }}
            >
              <p className='text-cyan-300 text-xs tracking-[0.26em]'>{scene.marker}</p>
              <h1 className='mt-4 font-semibold text-3xl leading-tight sm:text-5xl'>
                {scene.title}
              </h1>

              <div className='mt-10 space-y-6 text-neutral-200 text-lg leading-9'>
                {paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>

              {scene.ending ? (
                <EndingPanel label={scene.ending.label} onRestart={onRestart} />
              ) : (
                <ChoiceList choices={scene.choices ?? []} onChoose={onChoose} />
              )}
            </motion.article>
          </AnimatePresence>
        </section>

        <aside className='border-neutral-800 border-t py-4 text-sm lg:border-t-0 lg:border-l lg:pl-6'>
          <div className='sticky top-5 space-y-8'>
            <StatusBlock flags={flags} />
            <HistoryBlock history={recentHistory} />
          </div>
        </aside>
      </div>
    </main>
  )
}

function ChoiceList({
  choices,
  onChoose,
}: {
  choices: SceneChoice[]
  onChoose: (choice: SceneChoice) => void
}) {
  return (
    <div className='mt-12 space-y-3'>
      {choices.map((choice) => (
        <button
          className='group grid w-full grid-cols-[2.5rem_1fr] items-center border border-neutral-800 bg-neutral-900/45 text-left transition hover:border-cyan-300/60 hover:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-cyan-300/70 active:translate-y-px'
          key={choice.id}
          onClick={() => onChoose(choice)}
          type='button'
        >
          <span className='flex h-full min-h-14 items-center justify-center border-neutral-800 border-r font-mono text-cyan-300 text-xs uppercase group-hover:border-cyan-300/50'>
            {choice.id}
          </span>
          <span className='px-4 py-4 text-neutral-100 leading-7'>{choice.text}</span>
        </button>
      ))}
    </div>
  )
}

function EndingPanel({ label, onRestart }: { label: string; onRestart: () => void }) {
  return (
    <div className='mt-12 border border-emerald-300/35 bg-emerald-300/5 p-5'>
      <p className='font-mono text-emerald-300 text-xs tracking-[0.24em]'>{label}</p>
      <button
        className='mt-5 min-h-11 border border-neutral-700 px-5 text-neutral-100 text-sm transition hover:border-neutral-400 hover:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-400 active:translate-y-px'
        onClick={onRestart}
        type='button'
      >
        重新开始
      </button>
    </div>
  )
}

function StatusBlock({ flags }: { flags: GameFlags }) {
  const entries = Object.entries(flags)

  return (
    <section>
      <h2 className='text-neutral-500 text-xs tracking-[0.22em]'>FLAGS</h2>
      <div className='mt-3 space-y-2'>
        {entries.length === 0 ? (
          <p className='text-neutral-600'>尚未写入变量</p>
        ) : (
          entries.map(([key, value]) => (
            <div
              className='flex items-center justify-between gap-3 border-neutral-800 border-b py-2'
              key={key}
            >
              <span className='font-mono text-neutral-500 text-xs'>{key}</span>
              <span className='text-neutral-300'>{String(value)}</span>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

function HistoryBlock({ history }: { history: RouteEntry[] }) {
  return (
    <section>
      <h2 className='text-neutral-500 text-xs tracking-[0.22em]'>ROUTE</h2>
      <ol className='mt-3 space-y-2 text-neutral-400'>
        {history.map((entry) => (
          <li className='truncate border-neutral-800 border-b py-2' key={entry.visitId}>
            {getScene(entry.sceneId).title}
          </li>
        ))}
      </ol>
    </section>
  )
}
