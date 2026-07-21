import type { SceneId } from '../engine/types'
import { routeSections } from '../story/routeGraph'

interface ProgressGraphProps {
  currentSceneId: SceneId
  visitedSceneIds: SceneId[]
}

export function ProgressGraph({ currentSceneId, visitedSceneIds }: ProgressGraphProps) {
  const visited = new Set([...visitedSceneIds, currentSceneId])

  return (
    <section className='space-y-5'>
      <div>
        <p className='text-cyan-300 text-xs tracking-[0.24em]'>ROUTE ARCHIVE</p>
        <h2 className='mt-2 font-semibold text-2xl'>路线档案</h2>
      </div>
      <div className='max-h-[60vh] space-y-5 overflow-y-auto border-neutral-800 border-l pl-4'>
        {routeSections.map((section) => {
          const visitedCount = section.sceneIds.filter((id) => visited.has(id)).length

          return (
            <section key={section.id}>
              <div className='flex items-center justify-between gap-4'>
                <h3 className='text-neutral-300 text-sm'>{section.label}</h3>
                <span className='font-mono text-neutral-600 text-xs'>
                  {visitedCount}/{section.sceneIds.length}
                </span>
              </div>
              <div className='mt-3 grid grid-cols-7 gap-2 sm:grid-cols-10'>
                {section.sceneIds.map((sceneId, index) => {
                  const isCurrent = sceneId === currentSceneId
                  const isVisited = visited.has(sceneId)
                  return (
                    <span
                      className={`flex aspect-square items-center justify-center border font-mono text-[0.65rem] ${
                        isCurrent
                          ? 'border-cyan-300 bg-cyan-300 text-neutral-950'
                          : isVisited
                            ? 'border-cyan-700 bg-cyan-950/60 text-cyan-200'
                            : 'border-neutral-800 text-neutral-700'
                      }`}
                      key={sceneId}
                      title={sceneId}
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </section>
  )
}
