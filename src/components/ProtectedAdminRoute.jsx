import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router'

export function ProtectedAdminRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user?.is_admin) return <Navigate to="/" />
  return children
}
