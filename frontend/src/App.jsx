import { useState } from 'react'
import Screen1 from './screens/Screen1'
import Screen2 from './screens/Screen2'
import Screen3 from './screens/Screen3'
import Screen4 from './screens/Screen4'

export default function App() {
  const [screen, setScreen] = useState(1)
  const [brandName, setBrandName] = useState('')

  function handleSearch(name) {
    setBrandName(name)
    setScreen(2)
  }

  return (
    <div>
      {screen === 1 && <Screen1 onSubmit={handleSearch} />}
      {screen === 2 && <Screen2 brandName={brandName} onDone={() => setScreen(3)} />}
      {screen === 3 && <Screen3 brandName={brandName} onNext={() => setScreen(4)} />}
      {screen === 4 && <Screen4 brandName={brandName} onBack={() => setScreen(3)} />}
    </div>
  )
}
