type AddressFormat = 'P2PKH' | 'P2SH' | 'Bech32'

function getAddressFormat(address: string): AddressFormat {
    if (address.startsWith('1')) return 'P2PKH'
    if (address.startsWith('3')) return 'P2SH'
    return 'Bech32'
}

interface Props {
    address: string
}

export function AddressFormatBadge({ address }: Props) {
    const format = getAddressFormat(address)
    return <span className="address-format-badge">{format}</span>
}
