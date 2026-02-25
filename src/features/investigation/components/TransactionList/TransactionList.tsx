import { useSearch } from '@tanstack/react-router'
import type { Transaction } from '../../types/transaction.types'
import { TransactionRow } from './TransactionRow'
import './TransactionList.css'

const PAGE_SIZE = 25

const SKELETON_ROWS = Array.from({ length: 6 }, (_, i) => i)

interface Props {
    transactions: Transaction[]
    ownAddress:   string
    isLoading:    boolean
    onTotalPages: (total: number) => void
}

export function TransactionList({ transactions, ownAddress, isLoading, onTotalPages }: Props) {
    const { page, direction, status } = useSearch({ from: '/addresses/$address' })

    const filtered = transactions.filter((tx) => {
        if (status === 'confirmed'   && !tx.status.confirmed)  return false
        if (status === 'unconfirmed' &&  tx.status.confirmed)  return false

        if (direction !== 'all') {
            const spentFromOwn = tx.vin.some(
                (v) => v.prevout?.scriptpubkey_address === ownAddress
            )
            const txDirection = spentFromOwn ? 'out' : 'in'
            if (txDirection !== direction) return false
        }

        return true
    })

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
    onTotalPages(totalPages)

    const pageSlice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    if (isLoading) {
        return (
            <table className="tx-table">
                <TxHead />
                <tbody>
                    {SKELETON_ROWS.map((i) => (
                        <tr key={i} className="tx-row tx-row--skeleton">
                            <td className="tx-td"><span className="skel skel--status" /></td>
                            <td className="tx-td"><span className="skel skel--txid" /></td>
                            <td className="tx-td"><span className="skel skel--status" /></td>
                            <td className="tx-td tx-td--output"><span className="skel skel--num" /></td>
                            <td className="tx-td tx-td--fee"><span className="skel skel--num" /></td>
                            <td className="tx-td tx-td--date"><span className="skel skel--date" /></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        )
    }

    if (pageSlice.length === 0) {
        return (
            <div className="tx-empty">No transactions match the selected filters.</div>
        )
    }

    return (
        <div className="tx-table-wrap">
            <table className="tx-table">
                <TxHead />
                <tbody>
                    {pageSlice.map((tx, i) => (
                        <TransactionRow
                            key={tx.txid}
                            tx={tx}
                            ownAddress={ownAddress}
                            delayIndex={i}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    )
}

function TxHead() {
    return (
        <thead>
            <tr>
                <th className="tx-th">Status</th>
                <th className="tx-th">TXID</th>
                <th className="tx-th">Direction</th>
                <th className="tx-th tx-th--output">Value</th>
                <th className="tx-th tx-th--fee">Fee</th>
                <th className="tx-th tx-th--date">Date</th>
            </tr>
        </thead>
    )
}
