import {
  Background,
  Controls,
  Handle,
  type NodeProps,
  Position,
  ReactFlow,
  ReactFlowProvider,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useEffect, useMemo, useState } from 'react'
import { STORY_HASH } from '../engine/StoryController'
import { type CheckpointSnapshot, isCheckpointCompatible } from '../store/game'
import { type RouteNodePosition, getRouteLayout } from '../story/routeLayout'
import {
  CHECKPOINT_IDS,
  type RouteEdgeDefinition,
  type RouteNodeDefinition,
  type RunRouteProgress,
  getDiscoveredRouteNodes,
  getRouteChoicesForNode,
  getRouteDiscoveryPercent,
  routeEdges,
} from '../story/routeTopology'

interface RouteArchiveProps {
  currentRouteNodeId?: string
  archiveProgress: RunRouteProgress
  checkpointSnapshots: Record<string, CheckpointSnapshot>
  week: 1 | 2
  onBack: () => void
  onLoadCheckpoint: (checkpointId: string) => void
}

interface RouteNodeData extends Record<string, unknown> {
  definition: RouteNodeDefinition
  current: boolean
  selected: boolean
  discoveredChoices: number
  totalChoices: number
}

export function RouteArchive(props: RouteArchiveProps) {
  return (
    <ReactFlowProvider>
      <RouteArchiveContent {...props} />
    </ReactFlowProvider>
  )
}

function RouteArchiveContent({
  currentRouteNodeId,
  archiveProgress,
  checkpointSnapshots,
  week,
  onBack,
  onLoadCheckpoint,
}: RouteArchiveProps) {
  const [positions, setPositions] = useState<Map<string, RouteNodePosition> | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState(currentRouteNodeId ?? null)
  const [confirmCheckpointId, setConfirmCheckpointId] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    getRouteLayout().then((layout) => {
      if (active) setPositions(layout)
    })
    return () => {
      active = false
    }
  }, [])

  const discoveredIds = useMemo(
    () => new Set(archiveProgress.discoveredNodeIds),
    [archiveProgress.discoveredNodeIds],
  )
  const discoveredEdgeIds = useMemo(
    () => new Set(archiveProgress.discoveredEdgeIds),
    [archiveProgress.discoveredEdgeIds],
  )
  const visibleDefinitions = useMemo(
    () => getDiscoveredRouteNodes(archiveProgress, week),
    [archiveProgress, week],
  )
  const selectedDefinition = visibleDefinitions.find((routeNode) => routeNode.id === selectedNodeId)
  const selectedCheckpoint = selectedDefinition?.checkpointId
    ? checkpointSnapshots[selectedDefinition.checkpointId]
    : undefined
  const incomingEdge = routeEdges.find(
    (routeEdge) => routeEdge.to === selectedDefinition?.id && discoveredEdgeIds.has(routeEdge.id),
  )
  const selectedChoices = selectedDefinition
    ? getRouteChoicesForNode(selectedDefinition.id)
    : []
  const percent = getRouteDiscoveryPercent(archiveProgress, week)
  const activeCheckpointCount = Object.values(checkpointSnapshots).filter(isCheckpointCompatible).length

  const nodes = visibleDefinitions.map((definition) => {
    const choices = getRouteChoicesForNode(definition.id)
    return {
      id: definition.id,
      type: 'routeNode',
      position: positions?.get(definition.id) ?? { x: 0, y: 0 },
      data: {
        definition,
        current: definition.id === currentRouteNodeId,
        selected: definition.id === selectedNodeId,
        discoveredChoices: choices.filter((choice) => discoveredEdgeIds.has(choice.id)).length,
        totalChoices: choices.length,
      } satisfies RouteNodeData,
    }
  })
  const edges = routeEdges
    .filter(
      (routeEdge) =>
        discoveredEdgeIds.has(routeEdge.id) &&
        discoveredIds.has(routeEdge.from) &&
        discoveredIds.has(routeEdge.to),
    )
    .map((routeEdge) => ({
      id: routeEdge.id,
      source: routeEdge.from,
      target: routeEdge.to,
      label: routeEdge.resultLabel,
      type: 'smoothstep',
      style: { stroke: '#3f5961', strokeWidth: 1.25 },
      labelStyle: { fill: '#83949b', fontSize: 11 },
      labelBgStyle: { fill: '#090b0c', fillOpacity: 0.92 },
      labelBgPadding: [5, 3] as [number, number],
    }))

  return (
    <main className='fixed inset-0 z-50 flex min-h-screen flex-col bg-[#080a0b] text-neutral-100'>
      <header className='flex min-h-16 flex-wrap items-center justify-between gap-4 border-neutral-800 border-b px-4 py-3 sm:px-6'>
        <div className='flex items-center gap-4'>
          <button className='menu-action' onClick={onBack} type='button'>
            返回
          </button>
          <div>
            <p className='font-mono text-[0.65rem] text-cyan-300 tracking-[0.2em]'>ROUTE ARCHIVE</p>
            <h1 className='mt-1 font-medium text-lg'>路径成就档案 · 第 {week} 周目</h1>
          </div>
        </div>
        <div className='text-right font-mono text-neutral-500 text-xs'>
          <p>发现率 {percent}%</p>
          <p className='mt-1'>
            CHECKPOINT {activeCheckpointCount}/
            {Object.keys(CHECKPOINT_IDS).length}
          </p>
        </div>
      </header>

      <div className='hidden min-h-0 flex-1 grid-cols-[minmax(0,1fr)_19rem] lg:grid'>
        <section className='relative min-h-0 border-neutral-800 border-r' aria-label='路线图'>
          {positions ? (
            <ReactFlow
              colorMode='dark'
              edges={edges}
              fitView
              fitViewOptions={{ padding: 0.18, maxZoom: 1 }}
              maxZoom={1.35}
              minZoom={0.25}
              nodeTypes={{ routeNode: RouteNode }}
              nodes={nodes}
              nodesConnectable={false}
              nodesDraggable={false}
              onNodeClick={(_, node) => setSelectedNodeId(node.id)}
              proOptions={{ hideAttribution: true }}
            >
              <Background color='#1d2629' gap={28} size={1} />
              <Controls showInteractive={false} />
            </ReactFlow>
          ) : (
            <div className='flex h-full items-center justify-center font-mono text-neutral-600 text-xs'>
              ROUTE MAP / LOADING
            </div>
          )}
        </section>
        <RouteDetail
          checkpoint={selectedCheckpoint}
          definition={selectedDefinition}
          incomingLabel={incomingEdge?.resultLabel}
          choices={selectedChoices}
          discoveredEdgeIds={discoveredEdgeIds}
          onRequestCheckpoint={setConfirmCheckpointId}
        />
      </div>

      <div className='min-h-0 flex-1 overflow-y-auto lg:hidden'>
        <MobileTimeline
          currentRouteNodeId={currentRouteNodeId}
          definitions={visibleDefinitions}
          discoveredEdgeIds={discoveredEdgeIds}
          onSelect={setSelectedNodeId}
          positions={positions}
          selectedNodeId={selectedNodeId}
        />
        <RouteDetail
          checkpoint={selectedCheckpoint}
          definition={selectedDefinition}
          incomingLabel={incomingEdge?.resultLabel}
          choices={selectedChoices}
          discoveredEdgeIds={discoveredEdgeIds}
          onRequestCheckpoint={setConfirmCheckpointId}
        />
      </div>

      {confirmCheckpointId ? (
        <CheckpointConfirm
          checkpoint={checkpointSnapshots[confirmCheckpointId]}
          onCancel={() => setConfirmCheckpointId(null)}
          onConfirm={() => {
            onLoadCheckpoint(confirmCheckpointId)
            setConfirmCheckpointId(null)
          }}
        />
      ) : null}
    </main>
  )
}

function RouteNode({ data }: NodeProps) {
  const { definition, current, selected, discoveredChoices, totalChoices } = data as RouteNodeData
  const toneClass = routeToneClass(definition)

  return (
    <div
      className={`relative grid h-[72px] w-[196px] grid-cols-[0.32rem_1fr] overflow-hidden border bg-[#0c0f10] text-left transition-colors ${
        selected ? 'border-neutral-300' : current ? 'border-cyan-300' : 'border-neutral-700'
      }`}
    >
      <Handle className='opacity-0' position={Position.Top} type='target' />
      <span className={toneClass} />
      <div className='min-w-0 px-3 py-2.5'>
        <div className='flex items-center justify-between gap-2'>
          <span className='truncate font-mono text-[0.58rem] text-neutral-600 uppercase'>
            {definition.kind}
          </span>
          <span className='flex items-center gap-2 font-mono text-[0.56rem]'>
            {totalChoices > 0 ? (
              <span className='text-neutral-500'>CHOICE {discoveredChoices}/{totalChoices}</span>
            ) : null}
            {definition.checkpointId ? <span className='text-emerald-300'>CP</span> : null}
          </span>
        </div>
        <p className={`mt-2 truncate text-sm ${current ? 'text-cyan-100' : 'text-neutral-200'}`}>
          {definition.label}
        </p>
      </div>
      <Handle className='opacity-0' position={Position.Bottom} type='source' />
    </div>
  )
}

function MobileTimeline({
  definitions,
  positions,
  currentRouteNodeId,
  selectedNodeId,
  discoveredEdgeIds,
  onSelect,
}: {
  definitions: RouteNodeDefinition[]
  positions: Map<string, RouteNodePosition> | null
  currentRouteNodeId?: string
  selectedNodeId: string | null
  discoveredEdgeIds: Set<string>
  onSelect: (nodeId: string) => void
}) {
  const ordered = [...definitions].sort(
    (left, right) => (positions?.get(left.id)?.y ?? 0) - (positions?.get(right.id)?.y ?? 0),
  )

  return (
    <ol className='border-neutral-800 border-b px-4 py-6'>
      {ordered.map((definition, index) => {
        const incoming = routeEdges.find(
          (routeEdge) => routeEdge.to === definition.id && discoveredEdgeIds.has(routeEdge.id),
        )
        const selected = definition.id === selectedNodeId
        const current = definition.id === currentRouteNodeId
        const choices = getRouteChoicesForNode(definition.id)
        const discoveredChoices = choices.filter((choice) => discoveredEdgeIds.has(choice.id)).length
        return (
          <li className='relative grid grid-cols-[1.5rem_1fr] gap-3 pb-5' key={definition.id}>
            {index < ordered.length - 1 ? (
              <span className='absolute top-5 bottom-0 left-[0.45rem] w-px bg-neutral-800' />
            ) : null}
            <span
              className={`relative mt-2 block h-4 w-4 border ${
                current ? 'border-cyan-300 bg-cyan-300' : 'border-neutral-600 bg-[#080a0b]'
              }`}
            />
            <button
              className={`border px-4 py-3 text-left ${
                selected ? 'border-neutral-400 bg-neutral-900/55' : 'border-neutral-800'
              }`}
              onClick={() => onSelect(definition.id)}
              type='button'
            >
              {incoming ? (
                <span className='font-mono text-[0.6rem] text-neutral-600'>
                  {incoming.resultLabel}
                </span>
              ) : null}
              <span className='mt-1 flex items-center justify-between gap-4'>
                <span className='text-neutral-200 text-sm'>{definition.label}</span>
                {definition.checkpointId ? (
                  <span className='font-mono text-[0.58rem] text-emerald-300'>CHECKPOINT</span>
                ) : null}
                {choices.length > 0 ? (
                  <span className='font-mono text-[0.58rem] text-neutral-500'>
                    CHOICE {discoveredChoices}/{choices.length}
                  </span>
                ) : null}
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}

function RouteDetail({
  definition,
  checkpoint,
  incomingLabel,
  choices,
  discoveredEdgeIds,
  onRequestCheckpoint,
}: {
  definition?: RouteNodeDefinition
  checkpoint?: CheckpointSnapshot
  incomingLabel?: string
  choices: RouteEdgeDefinition[]
  discoveredEdgeIds: Set<string>
  onRequestCheckpoint: (checkpointId: string) => void
}) {
  return (
    <aside className='p-5 sm:p-6'>
      <p className='font-mono text-[0.65rem] text-neutral-600 tracking-[0.18em]'>NODE DETAIL</p>
      {definition ? (
        <div className='mt-5'>
          <p className='font-mono text-cyan-300 text-xs'>{definition.id}</p>
          <h2 className='mt-3 font-medium text-2xl'>{definition.label}</h2>
          <dl className='mt-7 space-y-4 text-sm'>
            <DetailRow label='区域' value={sectionLabel(definition.section)} />
            <DetailRow label='节点' value={kindLabel(definition.kind)} />
            {incomingLabel ? <DetailRow label='到达结果' value={incomingLabel} /> : null}
            {checkpoint ? (
              <DetailRow label='记录时间' value={formatCheckpointTime(checkpoint.savedAt)} />
            ) : null}
          </dl>
          {choices.length > 0 ? (
            <RouteChoiceAchievements choices={choices} discoveredEdgeIds={discoveredEdgeIds} />
          ) : null}
          {definition.checkpointId ? (
            <div className='mt-8 border-emerald-300/25 border-l pl-4'>
              <p className={`text-xs ${checkpoint ? 'text-emerald-300' : 'text-neutral-500'}`}>
                {checkpoint ? 'CHECKPOINT 可回溯' : 'CHECKPOINT 当前无可用快照'}
              </p>
              <p className='mt-2 text-neutral-500 text-sm leading-6'>
                回溯会恢复当时的剧情状态和游玩时间，已经点亮的路径成就不会撤销。
              </p>
              <button
                className='menu-action mt-4 disabled:cursor-not-allowed disabled:opacity-40'
                disabled={!checkpoint}
                onClick={() =>
                  definition.checkpointId && onRequestCheckpoint(definition.checkpointId)
                }
                type='button'
              >
                从此处回溯
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <p className='mt-5 text-neutral-600 text-sm leading-7'>选择一个已点亮节点查看记录。</p>
      )}
    </aside>
  )
}

function RouteChoiceAchievements({
  choices,
  discoveredEdgeIds,
}: {
  choices: RouteEdgeDefinition[]
  discoveredEdgeIds: Set<string>
}) {
  return (
    <section className='mt-8' aria-label='路径选择成就'>
      <div className='flex items-center justify-between gap-4 border-neutral-800 border-b pb-2'>
        <p className='font-mono text-[0.65rem] text-neutral-600 tracking-[0.16em]'>PATH CHOICES</p>
        <span className='font-mono text-[0.6rem] text-neutral-600'>
          {choices.filter((choice) => discoveredEdgeIds.has(choice.id)).length}/{choices.length}
        </span>
      </div>
      <ol>
        {choices.map((choice) => {
          const discovered = discoveredEdgeIds.has(choice.id)
          return (
            <li
              className='grid min-h-11 grid-cols-[0.65rem_1fr_auto] items-center gap-3 border-neutral-900 border-b py-2.5'
              key={choice.id}
            >
              <span
                className={`h-2 w-2 border ${
                  discovered ? 'border-cyan-300 bg-cyan-300' : 'border-neutral-700'
                }`}
              />
              <span className={discovered ? 'text-neutral-300 text-sm' : 'text-neutral-700 text-sm'}>
                {discovered ? choice.resultLabel : '什么都没有'}
              </span>
              <span className='font-mono text-[0.56rem] text-neutral-700'>
                {discovered ? 'DISCOVERED' : 'UNKNOWN'}
              </span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

function CheckpointConfirm({
  checkpoint,
  onCancel,
  onConfirm,
}: {
  checkpoint?: CheckpointSnapshot
  onCancel: () => void
  onConfirm: () => void
}) {
  const compatible = checkpoint ? isCheckpointCompatible(checkpoint) : false
  const incompatibilityMessage =
    checkpoint?.storyHash !== STORY_HASH
      ? '该 Checkpoint 来自不同的剧情版本，无法安全回溯。'
      : '该 Checkpoint 使用旧版路线结构，无法安全回溯。'
  return (
    <div className='fixed inset-0 z-[60] flex items-center justify-center bg-black/78 px-4'>
      <section className='w-full max-w-lg border border-neutral-700 bg-[#0b0e0f] p-6'>
        <p className='font-mono text-emerald-300 text-xs tracking-[0.18em]'>CHECKPOINT REWIND</p>
        <h2 className='mt-3 font-medium text-2xl'>回溯当前周目</h2>
        <p className='mt-5 text-neutral-400 leading-7'>
          当前自动进度将回到该节点，剧情历史和游玩时间同时恢复。已经点亮的路径成就和六个手动存档不会改变。
        </p>
        {!compatible ? (
          <p className='mt-4 border-red-400/35 border-l pl-3 text-red-300 text-sm'>
            {incompatibilityMessage}
          </p>
        ) : null}
        <div className='mt-7 flex justify-end gap-3'>
          <button className='menu-action' onClick={onCancel} type='button'>
            取消
          </button>
          <button
            className='menu-action disabled:cursor-not-allowed disabled:opacity-40'
            disabled={!compatible}
            onClick={onConfirm}
            type='button'
          >
            确认回溯
          </button>
        </div>
      </section>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className='grid grid-cols-[4.5rem_1fr] gap-3 border-neutral-800 border-b pb-3'>
      <dt className='text-neutral-600'>{label}</dt>
      <dd className='text-neutral-300'>{value}</dd>
    </div>
  )
}

function routeToneClass(definition: RouteNodeDefinition): string {
  if (definition.tone === 'true') return 'bg-amber-300'
  if (definition.tone === 'bad') return 'bg-red-400'
  if (definition.tone === 'betrayal') return 'bg-violet-400'
  if (definition.tone === 'pseudo') return 'bg-sky-300'
  if (definition.checkpointId) return 'bg-emerald-300'
  return 'bg-neutral-600'
}

function sectionLabel(section: RouteNodeDefinition['section']): string {
  const labels: Record<RouteNodeDefinition['section'], string> = {
    prologue: '前传',
    mainline: '密室主线',
    'main-endings': '主线结局',
    'bad-endings': 'BAD END',
    betrayal: '背叛线',
    'betrayal-endings': '背叛线结局',
    'newgame-plus': '二周目',
  }
  return labels[section]
}

function kindLabel(kind: RouteNodeDefinition['kind']): string {
  if (kind === 'decision') return '关键选择'
  if (kind === 'merge') return '路线汇合'
  if (kind === 'ending') return '结局'
  return '章节入口'
}

function formatCheckpointTime(value: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
