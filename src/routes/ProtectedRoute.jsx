import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
export default function ProtectedRoute({ children, roles }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen">Cargando...</div>
  if (!user) return <Navigate to="/login" />
  if (roles && profile && !roles.includes(profile.rol)) return <Navigate to="/dashboard" />
  return children
}