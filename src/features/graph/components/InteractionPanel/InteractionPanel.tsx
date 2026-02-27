import './InteractionPanel.css'

export type InteractionMode = 'drag' | 'select'

interface Props {
    mode:          InteractionMode
    onModeChange:  (mode: InteractionMode) => void
    selectedCount: number
    onDelete:      () => void
}

export function InteractionPanel({ mode, onModeChange, selectedCount, onDelete }: Props) {
    return (
        <div className="itools" role="toolbar" aria-label="Graph tools">
            <button
                className={`itools__btn${mode === 'drag' ? ' itools__btn--active' : ''}`}
                onClick={() => onModeChange('drag')}
                title="Drag — pan the canvas"
                aria-label="Drag mode"
                aria-pressed={mode === 'drag'}
            >
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path
                        d="M7 1v12M7 1L5 3.5M7 1L9 3.5M7 13L5 10.5M7 13L9 10.5M1 7h12M1 7L3.5 5M1 7L3.5 9M13 7L10.5 5M13 7L10.5 9"
                        stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
                    />
                </svg>
                <span>Drag</span>
            </button>

            <button
                className={`itools__btn${mode === 'select' ? ' itools__btn--active' : ''}`}
                onClick={() => onModeChange('select')}
                title="Select — draw a box to select nodes, then delete"
                aria-label="Select mode"
                aria-pressed={mode === 'select'}
            >
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <rect
                        x="1.5" y="1.5" width="11" height="11" rx="1.5"
                        stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 2"
                    />
                    <path
                        d="M5 9L7 11L11 5"
                        stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
                        opacity="0"
                    />
                </svg>
                <span>Select</span>
            </button>

            {mode === 'select' && selectedCount > 0 && (
                <>
                    <div className="itools__sep" aria-hidden="true" />
                    <button
                        className="itools__btn itools__btn--danger"
                        onClick={onDelete}
                        title={`Delete ${selectedCount} selected node${selectedCount !== 1 ? 's' : ''}`}
                        aria-label={`Delete ${selectedCount} selected node${selectedCount !== 1 ? 's' : ''}`}
                    >
                        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                            <path
                                d="M2 4h10M5 4V2.5h4V4M4.5 4l.75 7h4.5L10.5 4"
                                stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
                            />
                        </svg>
                        <span>Delete&nbsp;({selectedCount})</span>
                    </button>
                </>
            )}
        </div>
    )
}
