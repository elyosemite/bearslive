import { create } from 'zustand'

interface InvestigationState {
    activeAddress: string | null
    setActiveAddress: (address: string) => void
    clearActiveAddress: () => void
}

export const useInvestigation = create<InvestigationState>((set) => ({
    activeAddress: null,
    setActiveAddress: (address: string) => set({ activeAddress: address }),
    clearActiveAddress: () => set({ activeAddress: null }),
}))
