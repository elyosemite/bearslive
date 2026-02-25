import { useBear } from '../store/useBearStore'

export function Controls() {
    const increasePopulation = useBear((state) => state.increasePopulation)
    const decreasePopulation = useBear((state) => state.decreasePopulation)
    return (
        <div>
            <button onClick={increasePopulation}>one up</button>
            <button onClick={decreasePopulation}>one down</button>
        </div>
    )
}
