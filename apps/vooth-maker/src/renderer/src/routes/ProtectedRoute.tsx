import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function ProtectedRoute(): React.JSX.Element {
  const { user } = useAuth()
  return user ? <Outlet /> : <Navigate to="/login" replace />
}
