import { Routes, Route } from 'react-router-dom'
import Header from './components/Header.jsx'
import Home from './pages/Home.jsx'
import { Leaderboard } from './pages/Leaderboard.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'

function App() {

  return (
      <>
        <Header  />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/leaderBoard" element={<Leaderboard />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </>
  )
}

export default App
