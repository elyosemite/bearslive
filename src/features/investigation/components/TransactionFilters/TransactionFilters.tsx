import { useNavigate, useSearch } from '@tanstack/react-router'
import './TransactionFilters.css'

type Direction = 'all' | 'in' | 'out'
type Status    = 'all' | 'confirmed' | 'unconfirmed'

const DIRECTION_OPTIONS: { value: Direction; label: string }[] = [
    { value: 'all', label: 'All'      },
    { value: 'in',  label: 'Incoming' },
    { value: 'out', label: 'Outgoing' },
]

const STATUS_OPTIONS: { value: Status; label: string }[] = [
    { value: 'all',           label: 'All'           },
    { value: 'confirmed',     label: 'Confirmed'     },
    { value: 'unconfirmed',   label: 'Unconfirmed'   },
]

export function TransactionFilters() {
    const { direction, status } = useSearch({ from: '/addresses/$address' })
    const navigate = useNavigate({ from: '/addresses/$address' })

    function setDirection(value: Direction) {
        navigate({ search: (prev) => ({ ...prev, direction: value, page: 1 }) })
    }

    function setStatus(value: Status) {
        navigate({ search: (prev) => ({ ...prev, status: value, page: 1 }) })
    }

    return (
        <div className="tx-filters">
            <div className="tx-filters__group">
                <span className="tx-filters__label">Direction</span>
                <div className="tx-filters__seg">
                    {DIRECTION_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            className={`tx-filters__btn${direction === opt.value ? ' tx-filters__btn--active' : ''}`}
                            onClick={() => setDirection(opt.value)}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="tx-filters__group">
                <span className="tx-filters__label">Status</span>
                <div className="tx-filters__seg">
                    {STATUS_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            className={`tx-filters__btn${status === opt.value ? ' tx-filters__btn--active' : ''}`}
                            onClick={() => setStatus(opt.value)}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
