import { useBear } from '../store/useBearStore'

export function BearCounter() {
    const bears = useBear((state) => state.bears)
    return <h1>{bears} Bears around here ...</h1>
}
