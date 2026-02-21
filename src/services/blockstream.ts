export interface Vout {
    value: number,
    scriptpubkey_address?: string
}

export interface Transaction {
    txid: string,
    fee: number,
    vout: Vout[],
    status: {
        confirmed: boolean,
        block_time?: number
    }
}

export async function fetchTransactions(address: string): Promise<Transaction[]> {
    const response = await fetch(
        `https://blockstream.info/api/address/${address}/txs`
    );
    if (!response.ok) {
        throw new Error(`Failed to fetch transactions for address ${address}`);
    }
    return await response.json();
}
