import './App.css'
import { BearCounter } from './components/BearCounter'
import { Controls } from './components/Controls'

function App() {
  return (
    <>
      <p className="read-the-docs">
        Welcome to the game
      </p>
      <BearCounter />
      <Controls />
    </>
  )
}

export default App
