import { Routes, Route } from 'react-router-dom'
import Header from './components/Header.jsx'
import Home from './pages/Home.jsx'
import { Leaderboard } from './components/Leaderboard.jsx'

function App() {

  return (
      <>
        <Header  />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/leaderBoard" element={<Leaderboard />} />
        </Routes>
      </>
  )
}

export default App
