import { useMemo, useEffect, useCallback, useRef } from 'react'
import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    BackgroundVariant,
    MarkerType,
    Panel,
    useNodesState,
    useEdgesState,
    type Node,
    type Edge,
    type EdgeTypes,
    type NodeTypes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { Transaction }  from '../../../investigation/types/transaction.types'
import type { GraphData }    from '../../types/graph.types'
import { buildGraphData }    from '../../services/graphBuilder'
import { useGraphStore }     from '../../store/useGraphStore'
import { MemoAddressNode }   from '../AddressNode/AddressNode'
import { SmartEdge }         from './SmartEdge'
import { NodeFetcher }       from './NodeFetcher'
import './TransactionGraph.css'

// ── Static type registries (defined outside component for stability) ─────────

const edgeTypes: EdgeTypes = { smart: SmartEdge }
const nodeTypes: NodeTypes = { address: MemoAddressNode }

// ── Layout constants ─────────────────────────────────────────────────────────

const COL_X_LEFT  = -440
const COL_X_RIGHT =  440
const ROW_SPACING =   90
const EXP_RADIUS  =  280   // radial distance for expansion peers

function colY(idx: number, total: number): number {
    return ((total - 1) / -2 + idx) * ROW_SPACING
}

function radialPosition(
    center: { x: number; y: number },
    idx:    number,
    total:  number,
): { x: number; y: number } {
    if (total === 0) return center
    const angle = (idx / total) * 2 * Math.PI
    return {
        x: center.x + EXP_RADIUS * Math.cos(angle),
        y: center.y + EXP_RADIUS * Math.sin(angle),
    }
}

function truncate(addr: string) {
    return `${addr.slice(0, 8)}…${addr.slice(-6)}`
}

// ── Node builder ─────────────────────────────────────────────────────────────

function buildNodes(data: GraphData, originId: string): Node[] {
    const senderSet   = new Set(data.edges.filter(e => e.target === originId).map(e => e.source))
    const receiverSet = new Set(data.edges.filter(e => e.source === originId).map(e => e.target))

    const senders:   typeof data.nodes = []
    const receivers: typeof data.nodes = []

    for (const node of data.nodes) {
        if (node.isOrigin) continue
        const isSender   = senderSet.has(node.id)
        const isReceiver = receiverSet.has(node.id)

        if (isSender && isReceiver) {
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
            type:     'address',
            position: { x: 0, y: 0 },
            data:     { label: truncate(originId), role: 'origin' },
        },
        ...senders.map((n, i) => ({
            id:       n.id,
            type:     'address' as const,
            position: { x: COL_X_LEFT, y: colY(i, senders.length) },
            data:     { label: truncate(n.id), role: 'sender' },
        })),
        ...receivers.map((n, i) => ({
            id:       n.id,
            type:     'address' as const,
            position: { x: COL_X_RIGHT, y: colY(i, receivers.length) },
            data:     { label: truncate(n.id), role: 'receiver' },
        })),
    ]
}

// ── Edge builder ─────────────────────────────────────────────────────────────

function makeEdge(
    id:            string,
    source:        string,
    target:        string,
    valueSatoshis: number,
    confirmed:     boolean,
    pivotId:       string,
): Edge {
    // Edges arriving AT the pivot are green (incoming); leaving are amber (outgoing)
    const stroke = target === pivotId ? 'var(--th-green)' : 'var(--th-amber)'
    return {
        id,
        type:      'smart',
        source,
        target,
        label:     `${(valueSatoshis / 1e8).toFixed(4)} BTC`,
        animated:  !confirmed,
        markerEnd: { type: MarkerType.ArrowClosed },
        style:     { stroke },
    }
}

function buildEdges(data: GraphData, originId: string): Edge[] {
    return data.edges.map((e) =>
        makeEdge(e.id, e.source, e.target, e.valueSatoshis, e.confirmed, originId),
    )
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
    data: GraphData
}

export function TransactionGraph({ data }: Props) {
    const originId = useMemo(
        () => data.nodes.find((n) => n.isOrigin)?.id ?? '',
        [data],
    )

    const initialNodes = useMemo(() => buildNodes(data, originId), [data, originId])
    const initialEdges = useMemo(() => buildEdges(data, originId), [data, originId])

    const [rfNodes, setNodes, onNodesChange] = useNodesState(initialNodes)
    const [rfEdges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

    // Keep refs fresh so callbacks don't go stale on drag
    const rfNodesRef = useRef<Node[]>(rfNodes)
    const rfEdgesRef = useRef<Edge[]>(rfEdges)
    rfNodesRef.current = rfNodes
    rfEdgesRef.current = rfEdges

    // Graph store for expansion state
    const loadingAddresses = useGraphStore((s) => s.loadingAddresses)
    const stopLoading      = useGraphStore((s) => s.stopLoading)
    const expandAddress    = useGraphStore((s) => s.expandAddress)
    const resetStore       = useGraphStore((s) => s.reset)

    // Re-sync layout when the origin address changes (cross-address navigation)
    useEffect(() => {
        setNodes(buildNodes(data, originId))
        setEdges(buildEdges(data, originId))
        resetStore()
    }, [originId, data, setNodes, setEdges, resetStore])

    // ── Expansion callback ────────────────────────────────────────────────────

    const handleFetched = useCallback((pivotAddress: string, txs: Transaction[]) => {
        const currentNodes = rfNodesRef.current
        const currentEdges = rfEdgesRef.current

        const newGraphData = buildGraphData(txs, pivotAddress)

        const existingNodeIds = new Set(currentNodes.map((n) => n.id))
        const existingEdgeIds = new Set(currentEdges.map((e) => e.id))

        const pivotNode = currentNodes.find((n) => n.id === pivotAddress)
        const pivotPos  = pivotNode?.position ?? { x: 0, y: 0 }

        // Classify new peers relative to the pivot address
        const pivotSenderIds = new Set(
            newGraphData.edges
                .filter((e) => e.target === pivotAddress)
                .map((e) => e.source),
        )

        const brandNewNodes = newGraphData.nodes
            .filter((n) => !existingNodeIds.has(n.id))
            .map((n, i, arr) => ({
                id:       n.id,
                type:     'address' as const,
                position: radialPosition(pivotPos, i, arr.length),
                data: {
                    label: truncate(n.id),
                    role:  pivotSenderIds.has(n.id) ? 'sender' : 'receiver',
                },
            }))

        const brandNewEdges = newGraphData.edges
            .filter((e) => !existingEdgeIds.has(e.id))
            .map((e) =>
                makeEdge(e.id, e.source, e.target, e.valueSatoshis, e.confirmed, pivotAddress),
            )

        if (brandNewNodes.length > 0) setNodes((prev) => [...prev, ...brandNewNodes])
        if (brandNewEdges.length > 0) setEdges((prev) => [...prev, ...brandNewEdges])

        stopLoading(pivotAddress)
        expandAddress(pivotAddress)
    }, [setNodes, setEdges, stopLoading, expandAddress])

    const handleError = useCallback((address: string) => {
        stopLoading(address)
    }, [stopLoading])

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <>
            {/* Invisible fetchers — one per address currently being expanded */}
            {Array.from(loadingAddresses).map((addr) => (
                <NodeFetcher
                    key={addr}
                    address={addr}
                    onFetched={handleFetched}
                    onError={handleError}
                />
            ))}

            <ReactFlow
                nodes={rfNodes}
                edges={rfEdges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
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
                    <span className="graph-legend__sep">·</span>
                    <span className="graph-legend__item" style={{ color: 'var(--th-text-faint)' }}>
                        <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
                            <circle cx="4" cy="4" r="3" fill="none"
                                stroke="var(--th-text-faint)" strokeWidth="1" strokeDasharray="2 1.5" />
                        </svg>
                        Click&nbsp;
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true"
                            style={{ display: 'inline', verticalAlign: 'middle', marginBottom: '1px' }}>
                            <path d="M4 1.5V6.5M1.5 4H6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                        </svg>
                        &nbsp;to expand
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
        </>
    )
}
