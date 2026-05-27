import { useState } from 'react'
import Screen1 from './screens/Screen1'
import Screen2 from './screens/Screen2'
import Screen3 from './screens/Screen3'
import Screen4 from './screens/Screen4'

export default function App() {
  const [screen, setScreen] = useState(1)
  const [brandName, setBrandName] = useState('')
  const [results, setResults] = useState(null)

  function handleSearch(name) {
    setBrandName(name)
    setResults(null)
    setScreen(2)
  }

  function handleAnalysisDone(data) {
    setResults(data)
    setScreen(3)
  }

  function handleNavigate(step) {
    if (step === 1) { setScreen(1); setBrandName(''); setResults(null) }
    else if (step === 2) setScreen(2)
    else if (step === 3) setScreen(3)
    else if (step === 4) setScreen(4)
  }

  return (
    <div>
      {screen === 1 && <Screen1 onSubmit={handleSearch} />}
      {screen === 2 && (
        <Screen2 brandName={brandName} onDone={handleAnalysisDone} />
      )}
      {screen === 3 && (
        <Screen3
          brandName={brandName}
          results={results}
          onNext={() => setScreen(4)}
        />
      )}
      {screen === 4 && (
        <Screen4
          brandName={brandName}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  )
}
