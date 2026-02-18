import { create } from 'zustand'

interface BearState {
    bears: number,
    increasePopulation: () => void,
    decreasePopulation: () => void,
    removeAllbears: () => void,
    updateBears: (newBears: number) => void
}

const countPopulationDown = function (state: BearState) {
    if (state.bears === 0) return state
    return {
        bears: state.bears - 1
    }
}

export const useBear = create<BearState>((set) => ({
    bears: 0,
    increasePopulation: () => set((state: BearState) => ({ bears: state.bears + 1 })),
    decreasePopulation: () => set(countPopulationDown),
    removeAllbears: () => set({ bears: 0 }),
    updateBears: (newBears: number) => set({ bears: newBears })
}))
