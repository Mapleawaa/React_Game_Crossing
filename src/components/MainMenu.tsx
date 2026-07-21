import { motion } from 'motion/react'

interface MainMenuProps {
  onStart: () => void
}

export function MainMenu({ onStart }: MainMenuProps) {
  return (
    <main className='min-h-screen bg-neutral-950 text-neutral-100'>
      <div className='mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-between px-5 py-6 sm:px-8 lg:px-10'>
        <header className='flex items-center justify-between border-neutral-800 border-b pb-4 text-neutral-500 text-xs tracking-[0.24em]'>
          <span>ArcLeaf Game</span>
          <span>Preview / V1</span>
        </header>

        <motion.section
          animate={{ opacity: 1, y: 0 }}
          className='max-w-3xl py-16 sm:py-24'
          initial={{ opacity: 0, y: 14 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          <p className='mb-5 text-cyan-300 text-sm tracking-[0.28em]'>TEXT INTERACTIVE NOVEL</p>
          <h1 className='text-balance font-semibold text-4xl leading-tight sm:text-6xl'>
            背叛发生前，系统先学会记住选择。
          </h1>
          <p className='mt-6 max-w-2xl text-base text-neutral-400 leading-8 sm:text-lg'>
            当前版本使用内置样例场景验证叙事地基：场景路由、选项跳转、变量写入、结局状态和重新开始。
          </p>
          <button
            className='mt-10 inline-flex min-h-12 items-center border border-cyan-300/60 bg-cyan-300 px-6 font-medium text-neutral-950 text-sm transition hover:bg-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:ring-offset-2 focus:ring-offset-neutral-950 active:translate-y-px'
            onClick={onStart}
            type='button'
          >
            开始闭环测试
          </button>
        </motion.section>

        <footer className='grid gap-3 border-neutral-800 border-t pt-4 text-neutral-500 text-xs sm:grid-cols-3'>
          <span>React 19 / Vite / TypeScript</span>
          <span>Zustand state pipeline</span>
          <span>Static scene data first</span>
        </footer>
      </div>
    </main>
  )
}
