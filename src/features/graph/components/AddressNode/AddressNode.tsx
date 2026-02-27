import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { useGraphStore } from '../../store/useGraphStore'
import './AddressNode.css'

export type NodeRole = 'origin' | 'sender' | 'receiver' | 'peer'

export function AddressNode({ id, data }: NodeProps) {
    const label    = data.label as string
    const role     = (data.role as NodeRole | undefined) ?? 'peer'
    const isOrigin = role === 'origin'

    const expandedAddresses = useGraphStore((s) => s.expandedAddresses)
    const loadingAddresses  = useGraphStore((s) => s.loadingAddresses)
    const hasMoreTxs        = useGraphStore((s) => s.hasMoreTxs)
    const isExpanding       = useGraphStore((s) => s.isExpanding)
    const startLoading      = useGraphStore((s) => s.startLoading)

    const isExpanded  = expandedAddresses.has(id)
    const isLoading   = loadingAddresses.has(id)
    const hasMore     = hasMoreTxs.get(id) === true
    const canExpand   = !isOrigin && !isExpanded && !isLoading && !isExpanding
    const canLoadMore = !isOrigin && isExpanded && hasMore && !isLoading && !isExpanding

    function handleExpand(e: React.MouseEvent) {
        e.stopPropagation()
        if (!canExpand) return
        startLoading(id)
    }

    function handleLoadMore(e: React.MouseEvent) {
        e.stopPropagation()
        if (!canLoadMore) return
        startLoading(id)
    }

    const nodeClass = [
        'addr-node',
        `addr-node--${role}`,
        isExpanded && 'addr-node--expanded',
        isLoading  && 'addr-node--loading',
    ].filter(Boolean).join(' ')

    return (
        <div className={nodeClass}>
            <Handle type="source" position={Position.Top}    id="top"    className="addr-handle" />
            <Handle type="source" position={Position.Right}  id="right"  className="addr-handle" />
            <Handle type="source" position={Position.Bottom} id="bottom" className="addr-handle" />
            <Handle type="source" position={Position.Left}   id="left"   className="addr-handle" />
            <span className="addr-node__label">{label}</span>

            {!isOrigin && !isExpanded && (
                <button
                    className={[
                        'addr-node__expand',
                        'nodrag',
                        isLoading  && 'addr-node__expand--loading',
                    ].filter(Boolean).join(' ')}
                    onClick={handleExpand}
                    disabled={!canExpand}
                    title={
                        isLoading   ? 'Loading…'
                        : isExpanding ? 'Another node is loading'
                        : 'Expand — follow the money'
                    }
                    aria-label={
                        isLoading   ? 'Loading'
                        : isExpanding ? 'Locked — another node loading'
                        : 'Expand node'
                    }
                >
                    {isLoading ? (
                        <span className="addr-node__spinner" aria-hidden="true" />
                    ) : (
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
                            <path d="M4 1.5V6.5M1.5 4H6.5"
                                stroke="currentColor" strokeWidth="1.3"
                                strokeLinecap="round" />
                        </svg>
                    )}
                </button>
            )}

            {isExpanded && !isLoading && (
                <button
                    className={[
                        'addr-node__expand',
                        'nodrag',
                        'addr-node__expand--done',
                        canLoadMore && 'addr-node__expand--more',
                    ].filter(Boolean).join(' ')}
                    onClick={canLoadMore ? handleLoadMore : undefined}
                    disabled={!canLoadMore}
                    title={
                        isLoading   ? 'Loading…'
                        : canLoadMore ? 'Load more transactions'
                        : 'Fully loaded'
                    }
                    aria-label={canLoadMore ? 'Load more transactions' : 'Node fully loaded'}
                >
                    {canLoadMore ? (
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
                            <path d="M4 1.5V6.5M1.5 4H6.5"
                                stroke="currentColor" strokeWidth="1.3"
                                strokeLinecap="round" />
                        </svg>
                    ) : (
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
                            <path d="M1.5 4L3.5 6L6.5 2"
                                stroke="currentColor" strokeWidth="1.3"
                                strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    )}
                </button>
            )}

            {isExpanded && isLoading && (
                <button className="addr-node__expand nodrag addr-node__expand--loading" disabled>
                    <span className="addr-node__spinner" aria-hidden="true" />
                </button>
            )}
        </div>
    )
}

export const MemoAddressNode = memo(AddressNode)
