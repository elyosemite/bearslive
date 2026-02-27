import { memo } from 'react'
import { type NodeProps } from '@xyflow/react'
import { useGraphStore } from '../../store/useGraphStore'
import './AddressNode.css'

export type NodeRole = 'origin' | 'sender' | 'receiver' | 'peer'

export function AddressNode({ id, data }: NodeProps) {
    const label    = data.label as string
    const role     = (data.role as NodeRole | undefined) ?? 'peer'
    const isOrigin = role === 'origin'

    const expandedAddresses = useGraphStore((s) => s.expandedAddresses)
    const loadingAddresses  = useGraphStore((s) => s.loadingAddresses)
    const startLoading      = useGraphStore((s) => s.startLoading)

    const isExpanded = expandedAddresses.has(id)
    const isLoading  = loadingAddresses.has(id)
    const canExpand  = !isOrigin && !isExpanded && !isLoading

    function handleExpand(e: React.MouseEvent) {
        e.stopPropagation()
        if (!canExpand) return
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
            <span className="addr-node__label">{label}</span>

            {!isOrigin && (
                <button
                    className={[
                        'addr-node__expand',
                        'nodrag',
                        isLoading  && 'addr-node__expand--loading',
                        isExpanded && 'addr-node__expand--done',
                    ].filter(Boolean).join(' ')}
                    onClick={handleExpand}
                    disabled={!canExpand}
                    title={
                        isExpanded ? 'Already expanded'
                        : isLoading ? 'Loading…'
                        : 'Expand — follow the money'
                    }
                    aria-label={
                        isExpanded ? 'Node expanded'
                        : isLoading ? 'Loading'
                        : 'Expand node'
                    }
                >
                    {isLoading ? (
                        <span className="addr-node__spinner" aria-hidden="true" />
                    ) : isExpanded ? (
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
                            <path d="M1.5 4L3.5 6L6.5 2"
                                stroke="currentColor" strokeWidth="1.3"
                                strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    ) : (
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
                            <path d="M4 1.5V6.5M1.5 4H6.5"
                                stroke="currentColor" strokeWidth="1.3"
                                strokeLinecap="round" />
                        </svg>
                    )}
                </button>
            )}
        </div>
    )
}

export const MemoAddressNode = memo(AddressNode)
