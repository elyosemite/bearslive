import type { Transaction, AddressInfo } from '../../types/transaction.types'

const BASE_URL = 'https://blockstream.info/api'

export async function fetchTransactions(address: string): Promise<Transaction[]> {
    const response = await fetch(`${BASE_URL}/address/${address}/txs`)
    if (!response.ok) {
        throw new Error(`Failed to fetch transactions for address ${address}`)
    }
    return response.json()
}

export async function fetchAddressInfo(address: string): Promise<AddressInfo> {
    const response = await fetch(`${BASE_URL}/address/${address}`)
    if (!response.ok) {
        throw new Error(`Address not found: ${address}`)
    }
    return response.json()
}
