import {
    getBezierPath,
    EdgeLabelRenderer,
    type EdgeProps,
} from '@xyflow/react'

/**
 * Smooth Bézier edge that renders via the standard ReactFlow EdgeProps.
 * With explicit handles on AddressNode, ReactFlow computes sourceX/Y/targetX/Y
 * and sourcePosition/targetPosition from the actual handle positions — no need
 * for useInternalNode or manual geometry calculations.
 */
export function SmartEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    label,
    animated,
    style,
    markerEnd,
}: EdgeProps) {
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    })

    return (
        <>
            <path
                id={id}
                d={edgePath}
                fill="none"
                className={`react-flow__edge-path${animated ? ' animated' : ''}`}
                style={style}
                markerEnd={markerEnd}
            />

            {label && (
                <EdgeLabelRenderer>
                    <span
                        className="nodrag nopan"
                        style={{
                            position:      'absolute',
                            transform:     `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                            background:    'var(--th-surface)',
                            border:        '1px solid var(--th-border)',
                            padding:       '2px 5px',
                            fontSize:      '9px',
                            fontFamily:    "'JetBrains Mono', monospace",
                            color:         'var(--th-text-muted)',
                            lineHeight:    1.5,
                            pointerEvents: 'none',
                            userSelect:    'none',
                        }}
                    >
                        {label}
                    </span>
                </EdgeLabelRenderer>
            )}
        </>
    )
}
