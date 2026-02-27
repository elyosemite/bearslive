import { create } from 'zustand'

interface GraphStore {
    expandedAddresses: Set<string>
    loadingAddresses:  Set<string>
    isExpanding:       boolean

    // Pagination state per node
    lastSeenTxids: Map<string, string | null>
    hasMoreTxs:    Map<string, boolean>

    startLoading:    (address: string) => void
    stopLoading:     (address: string) => void
    expandAddress:   (address: string) => void
    setPageState:    (address: string, lastTxid: string | null, hasMore: boolean) => void
    removeAddresses: (ids: string[]) => void
    reset:           () => void
}

export const useGraphStore = create<GraphStore>((set) => ({
    expandedAddresses: new Set(),
    loadingAddresses:  new Set(),
    isExpanding:       false,
    lastSeenTxids:     new Map(),
    hasMoreTxs:        new Map(),

    startLoading: (address) =>
        set((s) => ({
            loadingAddresses: new Set([...s.loadingAddresses, address]),
            isExpanding:      true,
        })),

    stopLoading: (address) =>
        set((s) => {
            const next = new Set(s.loadingAddresses)
            next.delete(address)
            return {
                loadingAddresses: next,
                isExpanding:      next.size > 0,
            }
        }),

    expandAddress: (address) =>
        set((s) => ({
            expandedAddresses: new Set([...s.expandedAddresses, address]),
        })),

    setPageState: (address, lastTxid, hasMore) =>
        set((s) => {
            const nextTxids   = new Map(s.lastSeenTxids)
            const nextHasMore = new Map(s.hasMoreTxs)
            nextTxids.set(address, lastTxid)
            nextHasMore.set(address, hasMore)
            return { lastSeenTxids: nextTxids, hasMoreTxs: nextHasMore }
        }),

    removeAddresses: (ids) =>
        set((s) => {
            const newExpanded = new Set(s.expandedAddresses)
            const newLoading  = new Set(s.loadingAddresses)
            const newHasMore  = new Map(s.hasMoreTxs)
            const newLastSeen = new Map(s.lastSeenTxids)
            for (const id of ids) {
                newExpanded.delete(id)
                newLoading.delete(id)
                newHasMore.delete(id)
                newLastSeen.delete(id)
            }
            return {
                expandedAddresses: newExpanded,
                loadingAddresses:  newLoading,
                isExpanding:       newLoading.size > 0,
                hasMoreTxs:        newHasMore,
                lastSeenTxids:     newLastSeen,
            }
        }),

    reset: () =>
        set({
            expandedAddresses: new Set(),
            loadingAddresses:  new Set(),
            isExpanding:       false,
            lastSeenTxids:     new Map(),
            hasMoreTxs:        new Map(),
        }),
}))
