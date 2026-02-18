import { useBear } from "../stores/useBearStore";

export function BearCounter() {
    const bears = useBear((state) => state.bears);
    return <h1> {bears} Bears around here ...</h1>;
}
