import { useNavigate, useSearch } from '@tanstack/react-router'
import './DateFilterPanel.css'

export function DateFilterPanel() {
    const { from, to } = useSearch({ from: '/graph/$address' })
    const navigate     = useNavigate({ from: '/graph/$address' })

    function handleFrom(e: React.ChangeEvent<HTMLInputElement>) {
        navigate({ search: (prev) => ({ ...prev, from: e.target.value || undefined }), replace: true })
    }

    function handleTo(e: React.ChangeEvent<HTMLInputElement>) {
        navigate({ search: (prev) => ({ ...prev, to: e.target.value || undefined }), replace: true })
    }

    function handleClear() {
        navigate({ search: {}, replace: true })
    }

    const isActive = Boolean(from || to)

    return (
        <div className={`date-filter${isActive ? ' date-filter--active' : ''}`}>
            <span className="date-filter__label">Period</span>
            <div className="date-filter__fields">
                <input
                    type="date"
                    className="date-filter__input"
                    value={from ?? ''}
                    onChange={handleFrom}
                    aria-label="Start date"
                />
                <span className="date-filter__sep">→</span>
                <input
                    type="date"
                    className="date-filter__input"
                    value={to ?? ''}
                    onChange={handleTo}
                    aria-label="End date"
                />
            </div>
            {isActive && (
                <button
                    className="date-filter__clear"
                    onClick={handleClear}
                    title="Clear date filter"
                    aria-label="Clear date filter"
                >
                    ✕
                </button>
            )}
        </div>
    )
}
