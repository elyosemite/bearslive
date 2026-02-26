import type { AddressInfo } from "../../types/transaction.types"

const BASE_URL = 'https://blockstream.info/api'

export async function fetchAddressInfo(address: string): Promise<AddressInfo> {
    const response = await fetch(`${BASE_URL}/address/${address}`)
    if (!response.ok) {
        throw new Error(`Address not found: ${address}`)
    }
    return response.json()
}
