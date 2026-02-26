import { useParams } from '@tanstack/react-router'
import { useQuery }   from '@tanstack/react-query'
import { fetchTransactions } from '../../investigation/services/blockstream'
import { buildGraphData }    from '../services/graphBuilder'
import { TransactionGraph }  from '../components/TransactionGraph/TransactionGraph'
import './GraphPage.css'

export function GraphPage() {
    const { address } = useParams({ from: '/graph/$address' })

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

    const graphData = buildGraphData(data, address)

    return (
        <div className="graph-page">
            <TransactionGraph data={graphData} />
        </div>
    )
}
