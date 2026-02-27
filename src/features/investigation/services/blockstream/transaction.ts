import type { Transaction } from '../../types/transaction.types'

const BASE_URL = 'https://blockstream.info/api'

export interface TransactionPage {
    txs:           Transaction[]
    lastSeenTxid:  string | null
    hasMore:       boolean
}

export async function fetchTransactions(
    address:       string,
    afterTxid?:    string,
): Promise<TransactionPage> {
    const url = afterTxid
        ? `${BASE_URL}/address/${address}/txs/chain/${afterTxid}`
        : `${BASE_URL}/address/${address}/txs`

    const response = await fetch(url)
    if (!response.ok) {
        throw new Error(`Failed to fetch transactions for address ${address}`)
    }

    const txs: Transaction[] = await response.json()

    // Blockstream returns up to 25 confirmed + unconfirmed on the first call,
    // and up to 25 confirmed on subsequent paginated calls.
    // hasMore is true when a full page was returned (indicating more may exist).
    const hasMore        = txs.length >= 25
    const lastSeenTxid   = txs.length > 0 ? txs[txs.length - 1].txid : null

    return { txs, lastSeenTxid, hasMore }
}
