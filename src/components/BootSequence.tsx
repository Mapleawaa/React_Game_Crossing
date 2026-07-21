import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { GAME_METADATA } from '../config/gameMetadata'
import cadpa16Icon from '../public/icons/CADPA_16+.svg'

type BootStage = 'studio' | 'notice'

interface BootSequenceProps {
  reducedMotion: boolean
  onComplete: () => void
}

export function BootSequence({ reducedMotion, onComplete }: BootSequenceProps) {
  const [stage, setStage] = useState<BootStage>('studio')

  useEffect(() => {
    if (stage !== 'studio') {
      return
    }

    const advance = () => setStage('notice')
    const timer = window.setTimeout(advance, reducedMotion ? 300 : 1800)
    window.addEventListener('keydown', advance, { once: true })

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('keydown', advance)
    }
  }, [reducedMotion, stage])

  return (
    <main className='boot-sequence relative min-h-screen overflow-hidden bg-[#050607] text-neutral-100'>
      <AnimatePresence mode='wait'>
        {stage === 'studio' ? (
          <StudioSlate
            key='studio'
            onAdvance={() => setStage('notice')}
            reducedMotion={reducedMotion}
          />
        ) : (
          <NoticeScreen key='notice' onComplete={onComplete} reducedMotion={reducedMotion} />
        )}
      </AnimatePresence>
    </main>
  )
}

function StudioSlate({
  reducedMotion,
  onAdvance,
}: {
  reducedMotion: boolean
  onAdvance: () => void
}) {
  return (
    <motion.section
      animate={{ opacity: 1 }}
      aria-label={`${GAME_METADATA.studio} 制作厂牌`}
      className='absolute inset-0 flex cursor-pointer items-center justify-center px-6'
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
      onClick={onAdvance}
      transition={{ duration: reducedMotion ? 0 : 0.28 }}
    >
      <div className='w-full max-w-3xl text-center'>
        <div className='mx-auto mb-7 h-px w-12 bg-cyan-300/65' />
        <p className='font-medium text-neutral-100 text-xl tracking-[0.14em] sm:text-3xl sm:tracking-[0.22em]'>
          {GAME_METADATA.studio}
        </p>
        <p className='mt-4 font-mono text-[0.65rem] text-neutral-600 tracking-[0.24em]'>
          {GAME_METADATA.studioSubtitle}
        </p>
      </div>

      <ContentRating className='absolute bottom-6 left-5 sm:bottom-8 sm:left-8' />
      <p className='absolute right-5 bottom-7 font-mono text-[0.62rem] text-neutral-700 tracking-[0.2em] sm:right-8 sm:bottom-9'>
        PRESENTS
      </p>
    </motion.section>
  )
}

function NoticeScreen({
  reducedMotion,
  onComplete,
}: {
  reducedMotion: boolean
  onComplete: () => void
}) {
  return (
    <motion.section
      animate={{ opacity: 1, y: 0 }}
      className='absolute inset-0 flex items-center px-5 py-10 sm:px-8'
      initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }}
      transition={{ duration: reducedMotion ? 0 : 0.24, ease: 'easeOut' }}
    >
      <div className='mx-auto w-full max-w-3xl border-neutral-800 border-l pl-5 sm:pl-9'>
        <p className='font-mono text-[0.68rem] text-cyan-300 tracking-[0.2em]'>
          {GAME_METADATA.notice.eyebrow}
        </p>
        <h1 className='mt-5 font-semibold text-3xl text-neutral-100 sm:text-4xl'>
          {GAME_METADATA.notice.title}
        </h1>
        <div className='mt-8 max-w-2xl space-y-5 text-neutral-400 leading-8'>
          <p>{GAME_METADATA.notice.fiction}</p>
          <p>{GAME_METADATA.notice.content}</p>
        </div>
        <div className='mt-10 flex flex-wrap items-end justify-between gap-6 border-neutral-800 border-t pt-6'>
          <ContentRating />
          <button className='menu-action' onClick={onComplete} type='button'>
            我已了解
          </button>
        </div>
      </div>
    </motion.section>
  )
}

export function ContentRating({ className = '' }: { className?: string }) {
  return (
    <div className={`text-left ${className}`}>
      <img
        alt='CADPA 16+ 内容分级'
        className='h-14 w-auto'
        src={cadpa16Icon}
      />
    </div>
  )
}
