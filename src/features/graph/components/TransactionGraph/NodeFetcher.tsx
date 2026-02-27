import { useEffect } from 'react'
import { useQuery }  from '@tanstack/react-query'
import { fetchTransactions } from '../../../investigation/services/blockstream/transaction'
import type { Transaction }  from '../../../investigation/types/transaction.types'

interface Props {
    address:    string
    afterTxid?: string
    onFetched:  (address: string, txs: Transaction[], hasMore: boolean, lastSeenTxid: string | null) => void
    onError:    (address: string) => void
}

/**
 * Invisible component — mounts when a node expansion is requested,
 * fetches the address's transactions via TanStack Query (cache-aware),
 * then fires the appropriate callback and unmounts.
 */
export function NodeFetcher({ address, afterTxid, onFetched, onError }: Props) {
    const queryKey = afterTxid
        ? ['transactions', address, 'after', afterTxid]
        : ['transactions', address]

    const { data, isError } = useQuery({
        queryKey,
        queryFn: () => fetchTransactions(address, afterTxid),
        retry:   1,
    })

    useEffect(() => {
        if (data) onFetched(address, data.txs, data.hasMore, data.lastSeenTxid)
    }, [address, data, onFetched])

    useEffect(() => {
        if (isError) onError(address)
    }, [address, isError, onError])

    return null
}
