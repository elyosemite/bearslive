import { useMemo, useEffect, useCallback, useRef, useState } from 'react'
import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    BackgroundVariant,
    MarkerType,
    Panel,
    ConnectionMode,
    reconnectEdge,
    useNodesState,
    useEdgesState,
    type Node,
    type Edge,
    type EdgeTypes,
    type NodeTypes,
    type Connection,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { Transaction }      from '../../../investigation/types/transaction.types'
import type { GraphData }        from '../../types/graph.types'
import type { DateFilter }       from '../../services/graphBuilder'
import { buildGraphData }        from '../../services/graphBuilder'
import { getLayoutedNodes, getHandleIds } from '../../services/graphLayout'
import { useGraphStore }         from '../../store/useGraphStore'
import { MemoAddressNode }       from '../AddressNode/AddressNode'
import { SmartEdge }             from './SmartEdge'
import { NodeFetcher }           from './NodeFetcher'
import { DateFilterPanel }       from '../DateFilterPanel/DateFilterPanel'
import { InteractionPanel }      from '../InteractionPanel/InteractionPanel'
import type { InteractionMode }  from '../InteractionPanel/InteractionPanel'
import './TransactionGraph.css'

// ── Static type registries ────────────────────────────────────────────────────

const edgeTypes: EdgeTypes = { smart: SmartEdge }
const nodeTypes: NodeTypes = { address: MemoAddressNode }

// ── Pagination ────────────────────────────────────────────────────────────────

/**
 * How many NEW ADDRESS NODES to add per expansion click.
 * This bounds visual complexity regardless of how many transactions are fetched:
 * a single Bitcoin transaction can produce dozens of outputs, so paginating by
 * transaction count would still cause node explosions.
 */
const NODES_PER_PAGE = 10

// ── Buffer type ───────────────────────────────────────────────────────────────

/**
 * A pending node that has been fetched from the API but not yet shown.
 * Each PendingNode carries the React Flow node to add plus all its edges
 * (edges always have the pivot address as one endpoint, so they can be safely
 * added as soon as the node itself appears in the graph).
 */
interface PendingNode {
    node:  Node
    edges: Edge[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function truncate(addr: string) {
    return `${addr.slice(0, 8)}…${addr.slice(-6)}`
}

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

    const ROW = 90
    const colY = (i: number, total: number) => ((total - 1) / -2 + i) * ROW

    return [
        {
            id:         originId,
            type:       'address',
            position:   { x: 0, y: 0 },
            selectable: false,   // origin can never be selected or deleted
            data:       { label: truncate(originId), role: 'origin' },
        },
        ...senders.map((n, i) => ({
            id:       n.id,
            type:     'address' as const,
            position: { x: -440, y: colY(i, senders.length) },
            data:     { label: truncate(n.id), role: 'sender' },
        })),
        ...receivers.map((n, i) => ({
            id:       n.id,
            type:     'address' as const,
            position: { x: 440, y: colY(i, receivers.length) },
            data:     { label: truncate(n.id), role: 'receiver' },
        })),
    ]
}

function makeEdge(
    id:            string,
    source:        string,
    target:        string,
    valueSatoshis: number,
    confirmed:     boolean,
    pivotId:       string,
    sourceHandle?: string,
    targetHandle?: string,
): Edge {
    const stroke = target === pivotId ? 'var(--th-green)' : 'var(--th-amber)'
    return {
        id,
        type:          'smart',
        source,
        target,
        sourceHandle,
        targetHandle,
        label:         `${(valueSatoshis / 1e8).toFixed(4)} BTC`,
        animated:      !confirmed,
        reconnectable: 'target',
        markerEnd:     { type: MarkerType.ArrowClosed },
        style:         { stroke },
    }
}

function buildEdges(data: GraphData, originId: string): Edge[] {
    return data.edges.map((e) =>
        makeEdge(e.id, e.source, e.target, e.valueSatoshis, e.confirmed, originId),
    )
}

function assignEdgeHandles(nodes: Node[], edges: Edge[]): Edge[] {
    const posMap = new Map(nodes.map((n) => [n.id, n.position]))
    return edges.map((e) => {
        const src = posMap.get(e.source)
        const tgt = posMap.get(e.target)
        if (!src || !tgt) return e
        const { sourceHandle, targetHandle } = getHandleIds(src, tgt)
        return { ...e, sourceHandle, targetHandle }
    })
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
    data:   GraphData
    filter: DateFilter
}

export function TransactionGraph({ data, filter }: Props) {
    const originId = useMemo(
        () => data.nodes.find((n) => n.isOrigin)?.id ?? '',
        [data],
    )

    const initialNodes = useMemo(() => buildNodes(data, originId), [data, originId])
    const initialEdges = useMemo(() => buildEdges(data, originId), [data, originId])

    const [rfNodes, setNodes, onNodesChange] = useNodesState(initialNodes)
    const [rfEdges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

    // ── Refs (stay current without triggering re-renders) ─────────────────────
    const rfNodesRef = useRef<Node[]>(rfNodes)
    const rfEdgesRef = useRef<Edge[]>(rfEdges)
    const filterRef  = useRef<DateFilter>(filter)
    rfNodesRef.current = rfNodes
    rfEdgesRef.current = rfEdges
    filterRef.current  = filter

    /**
     * Per-address buffer of nodes fetched from the API but not yet shown.
     * Key: pivot address. Value: remaining PendingNode entries.
     * Lives in a ref (not Zustand) to avoid serialising large Transaction arrays
     * and to prevent unnecessary re-renders of the whole graph on buffer changes.
     */
    const pendingNodesRef = useRef<Map<string, PendingNode[]>>(new Map())

    /**
     * Tracks whether the last API response for an address had a next page,
     * independently from the local node buffer (both can be true simultaneously).
     */
    const apiHasMoreRef = useRef<Map<string, boolean>>(new Map())

    // ── Graph store ───────────────────────────────────────────────────────────
    const loadingAddresses = useGraphStore((s) => s.loadingAddresses)
    const lastSeenTxids    = useGraphStore((s) => s.lastSeenTxids)
    const stopLoading      = useGraphStore((s) => s.stopLoading)
    const expandAddress    = useGraphStore((s) => s.expandAddress)
    const setPageState     = useGraphStore((s) => s.setPageState)
    const removeAddresses  = useGraphStore((s) => s.removeAddresses)
    const resetStore       = useGraphStore((s) => s.reset)

    const [interactionMode, setInteractionMode] = useState<InteractionMode>('drag')

    // Reset everything when origin address or filtered data changes
    useEffect(() => {
        pendingNodesRef.current.clear()
        apiHasMoreRef.current.clear()
        const nodes = buildNodes(data, originId)
        const edges = buildEdges(data, originId)
        const laid  = getLayoutedNodes(nodes, edges)
        setNodes(laid)
        setEdges(assignEdgeHandles(laid, edges))
        resetStore()
    }, [originId, data, setNodes, setEdges, resetStore])

    // ── Merge a batch of PendingNodes into the live graph ────────────────────

    const flushBatch = useCallback((batch: PendingNode[]) => {
        if (batch.length === 0) return

        const newNodes = batch.map((p) => p.node)
        const newEdges = batch.flatMap((p) => p.edges)

        setNodes((prev) => {
            const mergedNodes = [...prev, ...newNodes]
            // Use the *current* edges ref so we get the latest set (including
            // edges added by previous flushBatch calls in the same render cycle).
            const allEdges = [...rfEdgesRef.current, ...newEdges]
            const laid     = getLayoutedNodes(mergedNodes, allEdges)
            setEdges(assignEdgeHandles(laid, allEdges))
            return laid
        })
    }, [setNodes, setEdges])

    // ── Build PendingNode list from a raw API response ────────────────────────

    /**
     * Converts a full set of fetched transactions into a PendingNode list,
     * filtering out addresses already present in the graph.
     * The returned list may be much shorter than the number of transactions
     * (many txs may share the same counterparty address).
     */
    const buildPendingNodes = useCallback((
        pivotAddress: string,
        allTxs:       Transaction[],
    ): PendingNode[] => {
        const currentNodes    = rfNodesRef.current
        const currentEdges    = rfEdgesRef.current
        const existingNodeIds = new Set(currentNodes.map((n) => n.id))
        const existingEdgeIds = new Set(currentEdges.map((e) => e.id))

        const pivotNode = currentNodes.find((n) => n.id === pivotAddress)
        const pivotPos  = pivotNode?.position ?? { x: 0, y: 0 }
        const EXP_R     = 280

        const fullGraph = buildGraphData(allTxs, pivotAddress, filterRef.current)

        const pivotSenderIds = new Set(
            fullGraph.edges.filter((e) => e.target === pivotAddress).map((e) => e.source),
        )

        // One PendingNode per NEW unique address, carrying all its edges to/from pivot.
        // All edges in buildGraphData have pivot as one endpoint, so they're safe to
        // add as soon as the counterparty node is added to the graph.
        return fullGraph.nodes
            .filter((n) => !existingNodeIds.has(n.id))
            .map((n, i, arr) => {
                const angle    = (i / arr.length) * 2 * Math.PI
                const rfNode: Node = {
                    id:       n.id,
                    type:     'address',
                    position: {
                        x: pivotPos.x + EXP_R * Math.cos(angle),
                        y: pivotPos.y + EXP_R * Math.sin(angle),
                    },
                    data: {
                        label: truncate(n.id),
                        role:  pivotSenderIds.has(n.id) ? 'sender' : 'receiver',
                    },
                }
                const edges = fullGraph.edges
                    .filter(
                        (e) =>
                            !existingEdgeIds.has(e.id) &&
                            (e.source === n.id || e.target === n.id),
                    )
                    .map((e) =>
                        makeEdge(e.id, e.source, e.target, e.valueSatoshis, e.confirmed, pivotAddress),
                    )
                return { node: rfNode, edges }
            })
    }, [])

    // ── API response handler ──────────────────────────────────────────────────

    const handleFetched = useCallback((
        pivotAddress: string,
        allTxs:       Transaction[],
        apiHasMore:   boolean,
        lastSeenTxid: string | null,
    ) => {
        // Build the full list of new nodes from ALL fetched transactions,
        // then paginate at the NODE level (not the transaction level).
        const allPending = buildPendingNodes(pivotAddress, allTxs)
        const batch      = allPending.slice(0, NODES_PER_PAGE)
        const overflow   = allPending.slice(NODES_PER_PAGE)

        pendingNodesRef.current.set(pivotAddress, overflow)
        apiHasMoreRef.current.set(pivotAddress, apiHasMore)

        const hasMoreTotal = overflow.length > 0 || apiHasMore
        setPageState(pivotAddress, lastSeenTxid, hasMoreTotal)

        flushBatch(batch)
        stopLoading(pivotAddress)
        expandAddress(pivotAddress)
    }, [buildPendingNodes, flushBatch, setPageState, stopLoading, expandAddress])

    // ── Buffer drain effect (no API call) ─────────────────────────────────────

    /**
     * When "Load more" is clicked on an already-expanded node, AddressNode calls
     * startLoading(addr) which adds addr to loadingAddresses. This effect detects
     * loading addresses that still have pending nodes in the local buffer and
     * drains NODES_PER_PAGE of them — skipping any network request entirely.
     */
    useEffect(() => {
        const toDrain = Array.from(loadingAddresses).filter(
            (addr) => (pendingNodesRef.current.get(addr)?.length ?? 0) > 0,
        )
        if (toDrain.length === 0) return

        const store = useGraphStore.getState()

        for (const addr of toDrain) {
            const pending = pendingNodesRef.current.get(addr)!
            const batch   = pending.splice(0, NODES_PER_PAGE)   // mutates the array in place

            const hasMoreBuffer = pending.length > 0
            const hasMoreApi    = apiHasMoreRef.current.get(addr) ?? false
            const hasMoreTotal  = hasMoreBuffer || hasMoreApi

            store.setPageState(addr, store.lastSeenTxids.get(addr) ?? null, hasMoreTotal)

            flushBatch(batch)

            store.stopLoading(addr)
            store.expandAddress(addr)
        }
    }, [loadingAddresses, flushBatch])

    const handleError = useCallback((address: string) => {
        useGraphStore.getState().stopLoading(address)
    }, [])

    // ── Interaction mode ──────────────────────────────────────────────────────

    /** Switch modes; deselect everything when returning to drag mode. */
    const handleModeChange = useCallback((mode: InteractionMode) => {
        if (mode === 'drag') {
            setNodes((ns) => ns.map((n) => ({ ...n, selected: false })))
        }
        setInteractionMode(mode)
    }, [setNodes])

    /** Delete all selected non-origin nodes and clean up all internal buffers. */
    const deleteSelected = useCallback(() => {
        const toDelete = rfNodesRef.current.filter(
            (n) => n.selected && n.data.role !== 'origin',
        )
        if (toDelete.length === 0) return

        const deleteIds = new Set(toDelete.map((n) => n.id))
        setNodes((ns) => ns.filter((n) => !deleteIds.has(n.id)))
        setEdges((es) => es.filter(
            (e) => !deleteIds.has(e.source) && !deleteIds.has(e.target),
        ))

        const ids = Array.from(deleteIds)
        for (const id of ids) {
            pendingNodesRef.current.delete(id)
            apiHasMoreRef.current.delete(id)
        }
        removeAddresses(ids)
    }, [setNodes, setEdges, removeAddresses])

    /**
     * Called by ReactFlow when nodes are removed via the Delete/Backspace key.
     * React Flow has already updated its state; we just clean up our side-channels.
     */
    const handleNodesDelete = useCallback((deleted: Node[]) => {
        const ids = deleted.map((n) => n.id)
        for (const id of ids) {
            pendingNodesRef.current.delete(id)
            apiHasMoreRef.current.delete(id)
        }
        removeAddresses(ids)
    }, [removeAddresses])

    /** Number of selected nodes the investigator can delete (origin excluded). */
    const selectedCount = rfNodes.filter(
        (n) => n.selected && n.data.role !== 'origin',
    ).length

    // ── Reconnect (same-node only) ────────────────────────────────────────────

    const handleReconnect = useCallback((oldEdge: Edge, newConn: Connection) => {
        if (newConn.source !== oldEdge.source) return
        if (newConn.target !== oldEdge.target) return
        setEdges((es) => reconnectEdge(oldEdge, newConn, es))
    }, [setEdges])

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <>
            {/*
             * Render a NodeFetcher only when the address needs a NEW API page.
             * If the address still has pending nodes buffered locally, the
             * useEffect above drains them without any network request.
             */}
            {Array.from(loadingAddresses).map((addr) => {
                if ((pendingNodesRef.current.get(addr)?.length ?? 0) > 0) return null
                return (
                    <NodeFetcher
                        key={addr}
                        address={addr}
                        afterTxid={lastSeenTxids.get(addr) ?? undefined}
                        onFetched={handleFetched}
                        onError={handleError}
                    />
                )
            })}

            <ReactFlow
                nodes={rfNodes}
                edges={rfEdges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onReconnect={handleReconnect}
                onNodesDelete={handleNodesDelete}
                reconnectRadius={12}
                connectionMode={ConnectionMode.Loose}
                fitView
                fitViewOptions={{ padding: 0.25 }}
                minZoom={0.1}
                maxZoom={3}
                nodesConnectable={false}
                // ── interaction mode ────────────────────────────────────────
                panOnDrag={interactionMode === 'drag'}
                selectionOnDrag={interactionMode === 'select'}
                elementsSelectable={interactionMode === 'select'}
                nodesDraggable={interactionMode === 'drag'}
                deleteKeyCode={interactionMode === 'select' ? 'Delete' : null}
            >
                <Panel position="top-right">
                    <DateFilterPanel />
                </Panel>

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
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
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

                <MiniMap position="bottom-center" />
                <Controls position="bottom-left" showInteractive={false} />

                <Panel position="bottom-right">
                    <InteractionPanel
                        mode={interactionMode}
                        onModeChange={handleModeChange}
                        selectedCount={selectedCount}
                        onDelete={deleteSelected}
                    />
                </Panel>

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
