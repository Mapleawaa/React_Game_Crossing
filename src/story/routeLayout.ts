import ELK from 'elkjs/lib/elk.bundled.js'
import { routeEdges, routeNodes } from './routeTopology'

export interface RouteNodePosition {
  x: number
  y: number
}

const NODE_WIDTH = 196
const NODE_HEIGHT = 72
const elk = new ELK()
let layoutPromise: Promise<Map<string, RouteNodePosition>> | null = null

export function getRouteLayout(): Promise<Map<string, RouteNodePosition>> {
  if (!layoutPromise) {
    layoutPromise = elk
      .layout({
        id: 'route-root',
        layoutOptions: {
          'elk.algorithm': 'layered',
          'elk.direction': 'DOWN',
          'elk.edgeRouting': 'ORTHOGONAL',
          'elk.layered.spacing.nodeNodeBetweenLayers': '78',
          'elk.spacing.nodeNode': '42',
          'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
        },
        children: routeNodes.map((routeNode) => ({
          id: routeNode.id,
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
        })),
        edges: routeEdges.map((routeEdge) => ({
          id: routeEdge.id,
          sources: [routeEdge.from],
          targets: [routeEdge.to],
        })),
      })
      .then(
        (graph) =>
          new Map(
            (graph.children ?? []).map((child) => [child.id, { x: child.x ?? 0, y: child.y ?? 0 }]),
          ),
      )
  }

  return layoutPromise
}
