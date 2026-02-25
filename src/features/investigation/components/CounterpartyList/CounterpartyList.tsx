import { Link } from '@tanstack/react-router'
import { useMemo } from 'react'
import { extractCounterparties } from '../../services/counterparties'
import type { Transaction } from '../../types/transaction.types'
import './CounterpartyList.css'

const SAT = 100_000_000

function satToBtc(sat: number) {
    return (sat / SAT).toFixed(8)
}

function truncateAddress(addr: string) {
    return `${addr.slice(0, 8)}…${addr.slice(-6)}`
}

interface Props {
    transactions: Transaction[]
    ownAddress:   string
}

export function CounterpartyList({ transactions, ownAddress }: Props) {
    const counterparties = useMemo(
        () => extractCounterparties(transactions, ownAddress),
        [transactions, ownAddress],
    )

    if (counterparties.length === 0) return null

    return (
        <section className="cp-section">
            <div className="cp-header">
                <span className="cp-header__label">Counterparty Network</span>
                <span className="cp-header__badge">{counterparties.length} nodes</span>
            </div>
            <div className="cp-header__divider" />

            <div className="cp-table-wrap">
                <table className="cp-table">
                    <thead>
                        <tr>
                            <th className="cp-th cp-th--rank">#</th>
                            <th className="cp-th">Address</th>
                            <th className="cp-th cp-th--right">Interactions</th>
                            <th className="cp-th cp-th--right">Volume</th>
                            <th className="cp-th cp-th--action" />
                        </tr>
                    </thead>
                    <tbody>
                        {counterparties.map((cp, i) => (
                            <tr key={cp.address} className="cp-row" style={{ '--delay': `${i * 25}ms` } as React.CSSProperties}>
                                <td className="cp-td cp-td--rank">
                                    <span className="cp-rank">{i + 1}</span>
                                </td>

                                <td className="cp-td">
                                    <span className="cp-address" title={cp.address}>
                                        <span className="cp-address__anchor">{cp.address.slice(0, 6)}</span>
                                        <span className="cp-address__body">{cp.address.slice(6, -6)}</span>
                                        <span className="cp-address__tail">{cp.address.slice(-6)}</span>
                                    </span>
                                </td>

                                <td className="cp-td cp-td--right">
                                    <span className="cp-count">{cp.interactionCount}</span>
                                </td>

                                <td className="cp-td cp-td--right">
                                    <span className="cp-volume">{satToBtc(cp.totalVolumeSatoshis)}</span>
                                    <span className="cp-unit">BTC</span>
                                </td>

                                <td className="cp-td cp-td--action">
                                    <Link
                                        to="/addresses/$address"
                                        params={{ address: cp.address }}
                                        className="cp-investigate"
                                        title={`Investigate ${truncateAddress(cp.address)}`}
                                    >
                                        Investigate
                                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                            <path d="M2 8L8 2M8 2H4M8 2V6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                                        </svg>
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    )
}
