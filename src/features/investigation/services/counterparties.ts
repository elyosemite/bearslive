import type { Transaction, Counterparty } from '../types/transaction.types'

const TOP_N = 10

export function extractCounterparties(
    txs: Transaction[],
    ownAddress: string,
): Counterparty[] {
    const map = new Map<string, { interactionCount: number; totalVolumeSatoshis: number }>()

    for (const tx of txs) {
        const spentFromOwn = tx.vin.some(
            (v) => v.prevout?.scriptpubkey_address === ownAddress,
        )

        if (spentFromOwn) {
            // Outgoing: counterparties are vout addresses that are NOT ownAddress
            for (const out of tx.vout) {
                const addr = out.scriptpubkey_address
                if (!addr || addr === ownAddress) continue
                const entry = map.get(addr) ?? { interactionCount: 0, totalVolumeSatoshis: 0 }
                entry.interactionCount     += 1
                entry.totalVolumeSatoshis  += out.value
                map.set(addr, entry)
            }
        } else {
            // Incoming: counterparties are vin sender addresses
            for (const inp of tx.vin) {
                const addr = inp.prevout?.scriptpubkey_address
                if (!addr || addr === ownAddress) continue
                const entry = map.get(addr) ?? { interactionCount: 0, totalVolumeSatoshis: 0 }
                entry.interactionCount     += 1
                entry.totalVolumeSatoshis  += inp.prevout?.value ?? 0
                map.set(addr, entry)
            }
        }
    }

    return Array.from(map.entries())
        .map(([address, stats]) => ({ address, ...stats }))
        .sort((a, b) => b.totalVolumeSatoshis - a.totalVolumeSatoshis)
        .slice(0, TOP_N)
}
