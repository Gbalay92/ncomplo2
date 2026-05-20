import { lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import Header from './components/Header.jsx'
import { useRouter } from './hooks/useRouter.jsx'
import { ProtectedRoute } from './components/ProtectedRoute.jsx'
import { ProtectedAdminRoute } from './components/ProtectedAdminRoute.jsx'

const HomePage = lazy(() => import('./pages/Home.jsx'))
const LeaderboardPage = lazy(() => import('./pages/Leaderboard.jsx'))
const NotFound = lazy(() => import('./pages/NotFoundPage.jsx'))
const PredictionPage = lazy(() => import('./pages/Prediction.jsx'))
const LoginPage = lazy(() => import('./pages/Login.jsx'))
const RegisterPage = lazy(() => import('./pages/Register.jsx'))
const AdminPage = lazy(() => import('./pages/Admin.jsx'))
const ProfilePage = lazy(() => import('./pages/Profile.jsx'))
const UserPredictionsPage = lazy(() => import('./pages/UserPredictions.jsx'))

function App() {
  const { navigateTo } = useRouter()

  return (
      <>
        <Header  />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
          <Route path="/login" element={<LoginPage onNavigateToRegister={() => navigateTo('/register')} />} />
          <Route path="/prediction" element={<ProtectedRoute><PredictionPage /></ProtectedRoute>} />
          <Route path="/register" element={<RegisterPage onNavigateToLogin={() => navigateTo('/login')} />} />
          <Route path="/admin" element={<ProtectedAdminRoute><AdminPage /></ProtectedAdminRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/user/:userId" element={<ProtectedRoute><UserPredictionsPage /></ProtectedRoute>} />
        </Routes>
      </>
  )
}

export default App
