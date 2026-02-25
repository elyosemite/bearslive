import './BearCounterPage.css'
import { BearCounter } from '../components/BearCounter'
import { Controls } from '../components/Controls'

export function BearCounterPage() {
    return (
        <>
            <p className="read-the-docs">Welcome to the game</p>
            <BearCounter />
            <Controls />
        </>
    )
}
