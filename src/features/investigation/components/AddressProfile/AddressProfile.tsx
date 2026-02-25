import { useQuery } from '@tanstack/react-query'
import { fetchAddressInfo } from '../../services/blockstream'
import { AddressFormatBadge } from '../AddressFormatBadge'
import './AddressProfile.css'

const SATOSHI = 100_000_000

function formatBTC(satoshis: number): string {
    return (satoshis / SATOSHI).toFixed(8) + ' BTC'
}

interface Props {
    address: string
}

export function AddressProfile({ address }: Props) {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['address-info', address],
        queryFn: () => fetchAddressInfo(address),
    })

    if (isLoading) {
        return <div className="address-profile address-profile--loading">Loading profile...</div>
    }

    if (isError || !data) {
        return (
            <div className="address-profile address-profile--error">
                Address not found on-chain. Verify the address and try again.
            </div>
        )
    }

    const balance = data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum
    const received = data.chain_stats.funded_txo_sum
    const sent = data.chain_stats.spent_txo_sum
    const txCount = data.chain_stats.tx_count + data.mempool_stats.tx_count

    return (
        <div className="address-profile">
            <div className="address-profile__header">
                <span className="address-profile__address">{address}</span>
                <AddressFormatBadge address={address} />
            </div>

            <div className="address-profile__stats">
                <div className="address-profile__stat">
                    <span className="address-profile__stat-label">Balance</span>
                    <span className="address-profile__stat-value">{formatBTC(balance)}</span>
                </div>
                <div className="address-profile__stat">
                    <span className="address-profile__stat-label">Received</span>
                    <span className="address-profile__stat-value">{formatBTC(received)}</span>
                </div>
                <div className="address-profile__stat">
                    <span className="address-profile__stat-label">Sent</span>
                    <span className="address-profile__stat-value">{formatBTC(sent)}</span>
                </div>
                <div className="address-profile__stat">
                    <span className="address-profile__stat-label">Transactions</span>
                    <span className="address-profile__stat-value">{txCount}</span>
                </div>
            </div>
        </div>
    )
}
