import { useParams } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { fetchTransactions } from "../../services/blockstream"

const SATOSHI = 100_000_000

function formatBTC(satoshis: number): string {
    return (satoshis / SATOSHI).toFixed(8) + ' BTC'
}

function formatDate(blockTime?: number): string {
    if (!blockTime) return "Unconfirmed"
    const date = new Date(blockTime * 1000)
    return date.toLocaleString()
}

export function AddressPage() {
    const { address } = useParams({ from: '/addresses/$address' })
    const { data, isLoading, error } = useQuery({
        queryKey: ['transactions', address],
        queryFn: () => fetchTransactions(address)
    })

    if (isLoading) return <p>Loading transactions...</p>
    if (error) return <p>Error loading transactions: {(error as Error).message}</p>

    return (
        <div>
            <h2>Address: {address}</h2>
            <p>{data?.length ?? 0} transactions found</p>
            <table>
                <thead>
                    <tr>
                        <th>TXID</th>
                        <th>Fee</th>
                        <th>Status</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    {data?.map((tx) => (
                        <tr key={tx.txid}>
                            <td>
                                <a
                                    href={`https://blockstream.info/tx/${tx.txid}`}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    {tx.txid.slice(0, 16)}...
                                </a>
                            </td>
                            <td>{formatBTC(tx.fee)}</td>
                            <td>{tx.status.confirmed ? 'Confirmed' : 'Pending'}</td>
                            <td>{formatDate(tx.status.block_time)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}