import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchTransactions } from '../../../investigation/services/blockstream/transaction'
import type { Transaction } from '../../../investigation/types/transaction.types'

interface Props {
    address: string
    onFetched: (address: string, txs: Transaction[]) => void
    onError: (address: string) => void
}

/**
 * Invisible component — mounts when a node expansion is requested,
 * fetches the address's transactions via TanStack Query (cache-aware),
 * then fires the appropriate callback and unmounts.
 */
export function NodeFetcher({ address, onFetched, onError }: Props) {
    const { data, isError } = useQuery({
        queryKey: ['transactions', address],
        queryFn: () => fetchTransactions(address),
        retry: 1,
    })

    useEffect(() => {
        if (data) onFetched(address, data)
    }, [address, data, onFetched])

    useEffect(() => {
        if (isError) onError(address)
    }, [address, isError, onError])

    return null
}
