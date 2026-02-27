import { create } from 'zustand'

interface GraphStore {
    expandedAddresses: Set<string>
    loadingAddresses:  Set<string>

    startLoading:  (address: string) => void
    stopLoading:   (address: string) => void
    expandAddress: (address: string) => void
    reset:         () => void
}

export const useGraphStore = create<GraphStore>((set) => ({
    expandedAddresses: new Set(),
    loadingAddresses:  new Set(),

    startLoading: (address) =>
        set((s) => ({
            loadingAddresses: new Set([...s.loadingAddresses, address]),
        })),

    stopLoading: (address) =>
        set((s) => {
            const next = new Set(s.loadingAddresses)
            next.delete(address)
            return { loadingAddresses: next }
        }),

    expandAddress: (address) =>
        set((s) => ({
            expandedAddresses: new Set([...s.expandedAddresses, address]),
        })),

    reset: () =>
        set({ expandedAddresses: new Set(), loadingAddresses: new Set() }),
}))
