import { useAuth } from "../context/AuthContext"
import { Navigate } from "react-router"

export function ProtectedRoute({ children }) {
    const { isLoggedIn } = useAuth()
    if (!isLoggedIn) {
        return <Navigate to="/login"  />
    }

    return children
}