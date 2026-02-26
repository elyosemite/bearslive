import { useMemo, useEffect } from 'react'
import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    BackgroundVariant,
    MarkerType,
    Panel,
    useNodesState,
    type Node,
    type Edge,
    type EdgeTypes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { GraphData } from '../../types/graph.types'
import { SmartEdge } from './SmartEdge'
import './TransactionGraph.css'

const edgeTypes: EdgeTypes = { smart: SmartEdge }

const COL_X_LEFT  = -440   // senders column x
const COL_X_RIGHT =  440   // receivers column x
const ROW_SPACING =   90   // vertical gap between nodes in a column
const NODE_WIDTH  =  170

// Centre a list of nodes vertically around y=0
function colY(idx: number, total: number): number {
    return ((total - 1) / -2 + idx) * ROW_SPACING
}

const BASE_NODE: React.CSSProperties = {
    borderRadius: '4px',
    fontFamily:   "'JetBrains Mono', monospace",
    maxWidth:     `${NODE_WIDTH}px`,
    wordBreak:    'break-all',
    whiteSpace:   'normal',
    lineHeight:   1.4,
}

const ORIGIN_STYLE: React.CSSProperties = {
    ...BASE_NODE,
    background: 'var(--th-blue-dim)',
    border:     '2px solid var(--th-blue)',
    color:      'var(--th-blue-br)',
    padding:    '8px 12px',
    fontSize:   '11px',
    fontWeight: 500,
}

const SENDER_STYLE: React.CSSProperties = {
    ...BASE_NODE,
    background: 'var(--th-green-dim)',
    border:     '1px solid var(--th-green)',
    color:      'var(--th-green)',
    padding:    '6px 10px',
    fontSize:   '10px',
}

const RECEIVER_STYLE: React.CSSProperties = {
    ...BASE_NODE,
    background: 'var(--th-amber-dim)',
    border:     '1px solid var(--th-amber)',
    color:      'var(--th-amber)',
    padding:    '6px 10px',
    fontSize:   '10px',
}

function truncate(addr: string) {
    return `${addr.slice(0, 8)}…${addr.slice(-6)}`
}

function buildNodes(data: GraphData, originId: string): Node[] {
    // Classify peers by edge direction relative to origin
    const senderSet   = new Set(data.edges.filter(e => e.target === originId).map(e => e.source))
    const receiverSet = new Set(data.edges.filter(e => e.source === originId).map(e => e.target))

    const senders:   typeof data.nodes = []
    const receivers: typeof data.nodes = []

    for (const node of data.nodes) {
        if (node.isOrigin) continue
        const isSender   = senderSet.has(node.id)
        const isReceiver = receiverSet.has(node.id)

        if (isSender && isReceiver) {
            // Bidirectional — assign to the side with higher total volume
            const sentVol = data.edges
                .filter(e => e.source === node.id && e.target === originId)
                .reduce((s, e) => s + e.valueSatoshis, 0)
            const recvVol = data.edges
                .filter(e => e.source === originId && e.target === node.id)
                .reduce((s, e) => s + e.valueSatoshis, 0)
            if (sentVol >= recvVol) senders.push(node)
            else                    receivers.push(node)
        } else if (isSender) {
            senders.push(node)
        } else if (isReceiver) {
            receivers.push(node)
        }
    }

    return [
        {
            id:       originId,
            position: { x: 0, y: 0 },
            data:     { label: originId ? truncate(originId) : '?' },
            style:    ORIGIN_STYLE,
        },
        ...senders.map((n, i) => ({
            id:       n.id,
            position: { x: COL_X_LEFT, y: colY(i, senders.length) },
            data:     { label: truncate(n.id) },
            style:    SENDER_STYLE,
        })),
        ...receivers.map((n, i) => ({
            id:       n.id,
            position: { x: COL_X_RIGHT, y: colY(i, receivers.length) },
            data:     { label: truncate(n.id) },
            style:    RECEIVER_STYLE,
        })),
    ]
}

function buildEdges(data: GraphData, originId: string): Edge[] {
    return data.edges.map((e) => {
        // Incoming edge (sender → origin) → green; outgoing (origin → receiver) → amber
        const stroke = e.target === originId ? 'var(--th-green)' : 'var(--th-amber)'
        return {
            id:        e.id,
            type:      'smart',
            source:    e.source,
            target:    e.target,
            label:     `${(e.valueSatoshis / 1e8).toFixed(4)} BTC`,
            animated:  !e.confirmed,
            markerEnd: { type: MarkerType.ArrowClosed },
            style:     { stroke },
        }
    })
}

interface Props {
    data: GraphData
}

export function TransactionGraph({ data }: Props) {
    const originId = data.nodes.find((n) => n.isOrigin)?.id ?? ''

    const initialNodes = useMemo(() => buildNodes(data, originId), [data, originId])
    const edges        = useMemo(() => buildEdges(data, originId), [data, originId])

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)

    // Re-sync layout when the address (data) changes
    useEffect(() => {
        setNodes(buildNodes(data, originId))
    }, [originId, data, setNodes])

    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            fitView
            fitViewOptions={{ padding: 0.25 }}
            minZoom={0.1}
            maxZoom={3}
            nodesConnectable={false}
            elementsSelectable={false}
        >
            <Panel position="top-left" className="graph-legend">
                <span className="graph-legend__item graph-legend__item--sender">
                    <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
                        <circle cx="4" cy="4" r="3" fill="var(--th-green)" />
                    </svg>
                    Senders
                </span>
                <span className="graph-legend__sep">·</span>
                <span className="graph-legend__item graph-legend__item--origin">
                    <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
                        <circle cx="4" cy="4" r="3" fill="var(--th-blue)" />
                    </svg>
                    Origin
                </span>
                <span className="graph-legend__sep">·</span>
                <span className="graph-legend__item graph-legend__item--receiver">
                    <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
                        <circle cx="4" cy="4" r="3" fill="var(--th-amber)" />
                    </svg>
                    Receivers
                </span>
            </Panel>

            <MiniMap />
            <Controls showInteractive={false} />
            <Background
                variant={BackgroundVariant.Dots}
                gap={24}
                size={1}
                color="var(--th-grid)"
            />
        </ReactFlow>
    )
}
