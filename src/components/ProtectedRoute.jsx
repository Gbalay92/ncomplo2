import { useAuth } from "../context/AuthContext"
import { Navigate } from "react-router"

export function ProtectedRoute({ children }) {
    const { isLoggedIn, loading } = useAuth()
    if (loading) return null
    if (!isLoggedIn) return <Navigate to="/login" />
    return children
}