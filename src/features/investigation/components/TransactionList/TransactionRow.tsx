import type { Transaction } from '../../types/transaction.types'

const SAT = 100_000_000

function satToBtc(sat: number) {
    return (sat / SAT).toFixed(8)
}

function formatDate(unixTs?: number) {
    if (!unixTs) return '—'
    return new Date(unixTs * 1000).toISOString().slice(0, 10)
}

function truncateTxid(txid: string) {
    return {
        anchor: txid.slice(0, 6),
        body: txid.slice(6, -4),
        tail: txid.slice(-4),
    }
}

function deriveDirection(tx: Transaction, ownAddress: string): 'in' | 'out' {
    const spentFromOwn = tx.vin.some(
        (v) => v.prevout?.scriptpubkey_address === ownAddress
    )
    return spentFromOwn ? 'out' : 'in'
}

function deriveValue(tx: Transaction, ownAddress: string, direction: 'in' | 'out'): number {
    if (direction === 'in') {
        return tx.vout
            .filter((v) => v.scriptpubkey_address === ownAddress)
            .reduce((sum, v) => sum + v.value, 0)
    }
    return tx.vout
        .filter((v) => v.scriptpubkey_address !== ownAddress)
        .reduce((sum, v) => sum + v.value, 0)
}

interface Props {
    tx: Transaction
    ownAddress: string
    delayIndex: number
}

export function TransactionRow({ tx, ownAddress, delayIndex }: Props) {
    const confirmed = tx.status.confirmed
    const rowClass = `tx-row ${confirmed ? 'tx-row--confirmed' : 'tx-row--pending'}`
    const direction = deriveDirection(tx, ownAddress)
    const value = deriveValue(tx, ownAddress, direction)
    const { anchor, body, tail } = truncateTxid(tx.txid)

    return (
        <tr
            className={rowClass}
            style={{ '--delay': `${delayIndex * 30}ms` } as React.CSSProperties}
        >
            <td className="tx-td">
                <div className="tx-status">
                    <span className="tx-status__dot" />
                    <span className="tx-status__label">
                        {confirmed ? 'Confirmed' : 'Pending'}
                    </span>
                </div>
            </td>

            <td className="tx-td">
                <a
                    className="tx-link"
                    href={`https://blockstream.info/tx/${tx.txid}`}
                    target="_blank"
                    rel="noreferrer"
                >
                    <span className="tx-link__anchor">{anchor}</span>
                    <span className="tx-link__body">{body}</span>
                    <span className="tx-link__tail">{tail}</span>
                    <svg className="tx-link__arrow" width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 8L8 2M8 2H4M8 2V6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                </a>
            </td>

            <td className="tx-td">
                <span className={`tx-dir tx-dir--${direction}`}>
                    {direction === 'in' ? '↓ IN' : '↑ OUT'}
                </span>
            </td>

            <td className="tx-td tx-td--output">
                <span className="tx-num tx-num--output">{satToBtc(value)}</span>
                <span className="tx-unit">BTC</span>
            </td>

            <td className="tx-td tx-td--fee">
                <span className="tx-num tx-num--fee">{satToBtc(tx.fee)}</span>
                <span className="tx-unit">BTC</span>
            </td>

            <td className="tx-td tx-td--date">
                <span className="tx-date">{formatDate(tx.status.block_time)}</span>
            </td>
        </tr>
    )
}
