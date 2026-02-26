import type { Transaction } from "../../types/transaction.types"

const BASE_URL = 'https://blockstream.info/api'

export async function fetchTransactions(address: string): Promise<Transaction[]> {
    const response = await fetch(`${BASE_URL}/address/${address}/txs`)
    if (!response.ok) {
        throw new Error(`Failed to fetch transactions for address ${address}`)
    }
    return response.json()
}