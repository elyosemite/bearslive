import dagre from '@dagrejs/dagre'
import type { Node, Edge } from '@xyflow/react'

const NODE_WIDTH  = 170
const NODE_HEIGHT =  40

/**
 * Runs dagre layout on the given nodes and edges and returns a new array
 * of nodes with updated positions. The direction is left-to-right (LR) by
 * default — money flows from left to right, matching how investigators read
 * transaction chains.
 */
export function getLayoutedNodes(
    nodes:     Node[],
    edges:     Edge[],
    direction: 'LR' | 'TB' = 'LR',
): Node[] {
    const g = new dagre.graphlib.Graph()
    g.setDefaultEdgeLabel(() => ({}))
    g.setGraph({ rankdir: direction, nodesep: 60, ranksep: 110, marginx: 40, marginy: 40 })

    for (const node of nodes) {
        g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
    }

    for (const edge of edges) {
        g.setEdge(edge.source, edge.target)
    }

    dagre.layout(g)

    return nodes.map((node) => {
        const n = g.node(node.id)
        if (!n) return node
        return {
            ...node,
            position: {
                x: n.x - NODE_WIDTH  / 2,
                y: n.y - NODE_HEIGHT / 2,
            },
        }
    })
}

/**
 * Returns the sourceHandle and targetHandle IDs to use for an edge based
 * on the relative positions of source and target nodes after layout.
 */
export function getHandleIds(
    srcPos: { x: number; y: number },
    tgtPos: { x: number; y: number },
): { sourceHandle: string; targetHandle: string } {
    const dx = tgtPos.x - srcPos.x
    const dy = tgtPos.y - srcPos.y

    if (Math.abs(dx) >= Math.abs(dy)) {
        return dx >= 0
            ? { sourceHandle: 'right', targetHandle: 'left'  }
            : { sourceHandle: 'left',  targetHandle: 'right' }
    }
    return dy >= 0
        ? { sourceHandle: 'bottom', targetHandle: 'top'    }
        : { sourceHandle: 'top',    targetHandle: 'bottom' }
}
