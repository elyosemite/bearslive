import { useMemo }               from 'react'
import { useParams, useSearch } from '@tanstack/react-router'
import { useQuery }              from '@tanstack/react-query'
import { fetchTransactions }     from '../../investigation/services/blockstream/transaction'
import { buildGraphData }        from '../services/graphBuilder'
import type { DateFilter }       from '../services/graphBuilder'
import { TransactionGraph }      from '../components/TransactionGraph/TransactionGraph'
import './GraphPage.css'

function isoToTimestamp(iso?: string): number | undefined {
    if (!iso) return undefined
    const ms = new Date(iso).getTime()
    return isNaN(ms) ? undefined : ms / 1000
}

export function GraphPage() {
    const { address }    = useParams({ from: '/graph/$address' })
    const { from, to }   = useSearch({ from: '/graph/$address' })

    const { data, isLoading, isError } = useQuery({
        queryKey: ['transactions', address],
        queryFn:  () => fetchTransactions(address),
    })

    if (isLoading) {
        return (
            <div className="graph-page graph-page--loading">
                <span className="graph-page__message">Building graph…</span>
            </div>
        )
    }

    if (isError || !data) {
        return (
            <div className="graph-page graph-page--error">
                <span className="graph-page__message">Failed to load transaction data</span>
            </div>
        )
    }

    const filter = useMemo<DateFilter>(
        () => ({ from: isoToTimestamp(from), to: isoToTimestamp(to) }),
        [from, to],
    )

    const graphData = useMemo(
        () => buildGraphData(data.txs, address, filter),
        [data.txs, address, filter],
    )

    return (
        <div className="graph-page">
            <TransactionGraph data={graphData} filter={filter} />
        </div>
    )
}
