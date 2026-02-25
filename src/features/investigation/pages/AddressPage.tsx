import { Link, useParams } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { fetchTransactions } from '../services/blockstream'
import { AddressProfile } from '../components/AddressProfile/AddressProfile'
import type { Transaction } from '../types/transaction.types'
import './AddressPage.css'

const SATOSHI = 100_000_000

function formatBTC(satoshis: number): string {
    return (satoshis / SATOSHI).toFixed(8)
}

function formatDate(blockTime?: number): string {
    if (!blockTime) return '—'
    const d = new Date(blockTime * 1000)
    return (
        d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
        '  ' +
        d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    )
}

function getTotalOutput(tx: Transaction): number {
    return tx.vout.reduce((sum, out) => sum + out.value, 0)
}

function SkeletonRows() {
    return (
        <>
            {Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} className="tx-row tx-row--skeleton">
                    <td className="tx-td"><span className="skel skel--status" /></td>
                    <td className="tx-td"><span className="skel skel--txid" /></td>
                    <td className="tx-td tx-td--output"><span className="skel skel--num" /></td>
                    <td className="tx-td tx-td--fee"><span className="skel skel--num" /></td>
                    <td className="tx-td tx-td--date"><span className="skel skel--date" /></td>
                </tr>
            ))}
        </>
    )
}

export function AddressPage() {
    const { address } = useParams({ from: '/addresses/$address' })
    const { data, isLoading, error } = useQuery({
        queryKey: ['transactions', address],
        queryFn: () => fetchTransactions(address),
    })

    return (
        <div className="inv-page">
            <div className="inv-page__grid" aria-hidden="true" />

            <div className="inv-page__inner">

                {/* Breadcrumb */}
                <nav className="inv-nav" aria-label="Breadcrumb">
                    <Link to="/" className="inv-nav__back">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="1.8"
                                strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        New Investigation
                    </Link>
                    <span className="inv-nav__sep">/</span>
                    <span className="inv-nav__crumb" title={address}>
                        {address.slice(0, 14)}…
                    </span>
                </nav>

                {/* Address profile card */}
                <AddressProfile address={address} />

                {/* Transaction ledger */}
                <section className="tx-ledger">
                    <div className="tx-ledger__meta">
                        <span className="tx-ledger__label">Transaction Ledger</span>
                        {data && (
                            <span className="tx-ledger__count">{data.length} records</span>
                        )}
                    </div>
                    <div className="tx-ledger__divider" />

                    {error && (
                        <div className="tx-error">
                            <span className="tx-error__icon">⚠</span>
                            <span>Failed to retrieve transaction data. {(error as Error).message}</span>
                        </div>
                    )}

                    <div className="tx-table-wrap">
                        <table className="tx-table">
                            <thead>
                                <tr>
                                    <th className="tx-th">Status</th>
                                    <th className="tx-th">Transaction ID</th>
                                    <th className="tx-th tx-th--output">Output</th>
                                    <th className="tx-th tx-th--fee">Fee</th>
                                    <th className="tx-th tx-th--date">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading && <SkeletonRows />}

                                {data?.map((tx: Transaction, i: number) => (
                                    <tr
                                        key={tx.txid}
                                        className={`tx-row ${tx.status.confirmed ? 'tx-row--confirmed' : 'tx-row--pending'}`}
                                        style={{ '--delay': `${i * 28}ms` } as React.CSSProperties}
                                    >
                                        {/* Status */}
                                        <td className="tx-td">
                                            <span className="tx-status">
                                                <span className="tx-status__dot" />
                                                <span className="tx-status__label">
                                                    {tx.status.confirmed ? 'Confirmed' : 'Pending'}
                                                </span>
                                            </span>
                                        </td>

                                        {/* TXID */}
                                        <td className="tx-td">
                                            <a
                                                href={`https://blockstream.info/tx/${tx.txid}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="tx-link"
                                                title={tx.txid}
                                            >
                                                <span className="tx-link__anchor">{tx.txid.slice(0, 8)}</span>
                                                <span className="tx-link__body">{tx.txid.slice(8, 24)}</span>
                                                <span className="tx-link__tail">…</span>
                                                <svg className="tx-link__arrow" width="11" height="11"
                                                    viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                                    <path d="M7 17L17 7M17 7H7M17 7v10"
                                                        stroke="currentColor" strokeWidth="2"
                                                        strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </a>
                                        </td>

                                        {/* Output value */}
                                        <td className="tx-td tx-td--output">
                                            <span className="tx-num tx-num--output">
                                                {formatBTC(getTotalOutput(tx))}
                                            </span>
                                            <span className="tx-unit">BTC</span>
                                        </td>

                                        {/* Fee */}
                                        <td className="tx-td tx-td--fee">
                                            <span className="tx-num tx-num--fee">
                                                {formatBTC(tx.fee)}
                                            </span>
                                            <span className="tx-unit">BTC</span>
                                        </td>

                                        {/* Date */}
                                        <td className="tx-td tx-td--date">
                                            <span className="tx-date">
                                                {formatDate(tx.status.block_time)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {data?.length === 0 && (
                            <div className="tx-empty">No transactions found for this address</div>
                        )}
                    </div>
                </section>

            </div>
        </div>
    )
}
