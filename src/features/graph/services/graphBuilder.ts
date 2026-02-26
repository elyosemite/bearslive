import type { Transaction } from '../../investigation/types/transaction.types'
import type { GraphData, GraphEdge, GraphNode } from '../types/graph.types'

export function buildGraphData(txs: Transaction[], originAddress: string): GraphData {
    const nodeMap = new Map<string, GraphNode>()
    const edgeMap = new Map<string, GraphEdge>()

    nodeMap.set(originAddress, { id: originAddress, isOrigin: true })

    for (const tx of txs) {
        const spentFromOwn = tx.vin.some(
            (v) => v.prevout?.scriptpubkey_address === originAddress,
        )

        if (spentFromOwn) {
            // Outgoing: originAddress → vout addresses
            for (const out of tx.vout) {
                const target = out.scriptpubkey_address
                if (!target || target === originAddress) continue

                if (!nodeMap.has(target)) {
                    nodeMap.set(target, { id: target, isOrigin: false })
                }

                const edgeId = `${tx.txid}-${originAddress}-${target}`
                if (!edgeMap.has(edgeId)) {
                    edgeMap.set(edgeId, {
                        id:            edgeId,
                        source:        originAddress,
                        target,
                        valueSatoshis: out.value,
                        confirmed:     tx.status.confirmed,
                    })
                }
            }
        } else {
            // Incoming: vin addresses → originAddress
            for (const inp of tx.vin) {
                const source = inp.prevout?.scriptpubkey_address
                if (!source || source === originAddress) continue

                if (!nodeMap.has(source)) {
                    nodeMap.set(source, { id: source, isOrigin: false })
                }

                const edgeId = `${tx.txid}-${source}-${originAddress}`
                if (!edgeMap.has(edgeId)) {
                    edgeMap.set(edgeId, {
                        id:            edgeId,
                        source,
                        target:        originAddress,
                        valueSatoshis: inp.prevout?.value ?? 0,
                        confirmed:     tx.status.confirmed,
                    })
                }
            }
        }
    }

    return {
        nodes: Array.from(nodeMap.values()),
        edges: Array.from(edgeMap.values()),
    }
}
