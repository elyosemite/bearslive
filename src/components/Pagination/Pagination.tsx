import './Pagination.css'

interface Props {
    currentPage:  number
    totalPages:   number
    onPageChange: (page: number) => void
}

export function Pagination({ currentPage, totalPages, onPageChange }: Props) {
    if (totalPages <= 1) return null

    return (
        <div className="pagination">
            <button
                className="pagination__btn"
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
                aria-label="Previous page"
            >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M7.5 2L3.5 6L7.5 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Prev
            </button>

            <span className="pagination__info">
                <span className="pagination__current">{currentPage}</span>
                <span className="pagination__sep">/</span>
                <span className="pagination__total">{totalPages}</span>
            </span>

            <button
                className="pagination__btn"
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange(currentPage + 1)}
                aria-label="Next page"
            >
                Next
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M4.5 2L8.5 6L4.5 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>
        </div>
    )
}
