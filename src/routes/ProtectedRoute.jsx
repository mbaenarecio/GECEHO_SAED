import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, roles }) {
  const { user, profile, roles: userRoles, activeRole, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen">Cargando...</div>
  if (!user) return <Navigate to="/login" />
  // If user has multiple roles and hasn't chosen one yet
  if (userRoles.length > 1 && !activeRole) return <Navigate to="/seleccionar-rol" />
  // Check role permission
  if (roles && activeRole && !roles.includes(activeRole)) return <Navigate to="/dashboard" />
  return children
}
