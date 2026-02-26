import {
    useInternalNode,
    getBezierPath,
    EdgeLabelRenderer,
    Position,
    type EdgeProps,
    type InternalNode,
} from '@xyflow/react'

/**
 * Calculates which side of each node the edge should connect to,
 * based on the relative position of source vs target at render time.
 *
 *   source LEFT of target  → source.Right  ——→  target.Left
 *   source RIGHT of target → source.Left   ——→  target.Right
 *   source ABOVE target    → source.Bottom ——→  target.Top
 *   source BELOW target    → source.Top    ——→  target.Bottom
 */
function getEdgeParams(source: InternalNode, target: InternalNode) {
    const sPos = source.internals.positionAbsolute
    const tPos = target.internals.positionAbsolute
    const sW   = source.measured?.width  ?? 150
    const sH   = source.measured?.height ?? 40
    const tW   = target.measured?.width  ?? 150
    const tH   = target.measured?.height ?? 40

    const sCX = sPos.x + sW / 2
    const sCY = sPos.y + sH / 2
    const tCX = tPos.x + tW / 2
    const tCY = tPos.y + tH / 2

    const dx = tCX - sCX
    const dy = tCY - sCY

    let sx: number, sy: number
    let tx: number, ty: number
    let sourcePos: Position, targetPos: Position

    if (Math.abs(dx) >= Math.abs(dy)) {
        // Primarily horizontal
        if (dx >= 0) {
            sx = sPos.x + sW;  sy = sCY;  sourcePos = Position.Right
            tx = tPos.x;       ty = tCY;  targetPos  = Position.Left
        } else {
            sx = sPos.x;       sy = sCY;  sourcePos = Position.Left
            tx = tPos.x + tW;  ty = tCY;  targetPos  = Position.Right
        }
    } else {
        // Primarily vertical
        if (dy >= 0) {
            sx = sCX;  sy = sPos.y + sH;  sourcePos = Position.Bottom
            tx = tCX;  ty = tPos.y;       targetPos  = Position.Top
        } else {
            sx = sCX;  sy = sPos.y;       sourcePos = Position.Top
            tx = tCX;  ty = tPos.y + tH;  targetPos  = Position.Bottom
        }
    }

    return { sx, sy, tx, ty, sourcePos, targetPos }
}

export function SmartEdge({
    id,
    source,
    target,
    label,
    animated,
    style,
    markerEnd,
}: EdgeProps) {
    const sourceNode = useInternalNode(source)
    const targetNode = useInternalNode(target)

    if (!sourceNode || !targetNode) return null

    const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(sourceNode, targetNode)

    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX:        sx,
        sourceY:        sy,
        sourcePosition: sourcePos,
        targetX:        tx,
        targetY:        ty,
        targetPosition: targetPos,
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
