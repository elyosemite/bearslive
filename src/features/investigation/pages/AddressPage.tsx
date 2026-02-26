import { useState } from 'react'
import { Link, useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { fetchTransactions } from '../services/blockstream/blockstream'
import { AddressProfile } from '../components/AddressProfile/AddressProfile'
import { TransactionFilters } from '../components/TransactionFilters/TransactionFilters'
import { TransactionList } from '../components/TransactionList/TransactionList'
import { Pagination } from '../../../components/Pagination/Pagination'
import { CounterpartyList } from '../components/CounterpartyList/CounterpartyList'
import './AddressPage.css'

export function AddressPage() {
    const { address } = useParams({ from: '/addresses/$address' })
    const { page } = useSearch({ from: '/addresses/$address' })
    const navigate = useNavigate({ from: '/addresses/$address' })

    const [totalPages, setTotalPages] = useState(1)

    const { data, isLoading, error } = useQuery({
        queryKey: ['transactions', address],
        queryFn: () => fetchTransactions(address),
    })

    function handlePageChange(newPage: number) {
        navigate({ search: (prev) => ({ ...prev, page: newPage }) })
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

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
                    <span className="inv-nav__sep">/</span>
                    <Link to="/graph/$address" params={{ address }} className="inv-nav__graph-link">
                        View Graph
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                            <path d="M2 8L8 2M8 2H4M8 2V6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                        </svg>
                    </Link>
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

                    <TransactionFilters />

                    <TransactionList
                        transactions={data ?? []}
                        ownAddress={address}
                        isLoading={isLoading}
                        onTotalPages={setTotalPages}
                    />

                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                </section>

                {/* Counterparty network */}
                {!isLoading && data && (
                    <CounterpartyList
                        transactions={data}
                        ownAddress={address}
                    />
                )}

            </div>
        </div>
    )
}
