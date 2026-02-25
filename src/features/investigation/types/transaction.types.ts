export interface Vout {
    value: number
    scriptpubkey_address?: string
}

export interface Vin {
    prevout?: {
        scriptpubkey_address?: string
        value: number
    }
}

export interface Transaction {
    txid: string
    fee: number
    vin: Vin[]
    vout: Vout[]
    status: {
        confirmed: boolean
        block_time?: number
    }
}

export interface ChainStats {
    funded_txo_sum: number
    spent_txo_sum: number
    tx_count: number
}

export interface AddressInfo {
    address: string
    chain_stats: ChainStats
    mempool_stats: ChainStats
}
