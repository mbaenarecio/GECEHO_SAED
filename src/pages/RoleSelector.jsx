import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const etiquetaRol = {
  admin: 'Administrador',
  gestor: 'Gestor',
  coordinador: 'Coordinador',
  asesor: 'Asesor',
  docente: 'Docente'
}

const colorRol = {
  admin: 'bg-red-500 hover:bg-red-600',
  gestor: 'bg-purple-500 hover:bg-purple-600',
  coordinador: 'bg-green-500 hover:bg-green-600',
  asesor: 'bg-blue-500 hover:bg-blue-600',
  docente: 'bg-gray-500 hover:bg-gray-600'
}

const iconoRol = {
  admin: '🛡️',
  gestor: '⚙️',
  coordinador: '🏫',
  asesor: '📋',
  docente: '👩‍🏫'
}

export default function RoleSelector() {
  const { profile, roles, setActiveRole } = useAuth()
  const navigate = useNavigate()

  const elegirRol = (rol) => {
    setActiveRole(rol)
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-1">Bienvenido/a</h1>
        <p className="text-gray-500 text-center mb-6">{profile?.nombre_completo || profile?.email}</p>
        <p className="text-sm text-gray-600 text-center mb-6">Tienes varios roles asignados. ¿Con cuál quieres trabajar hoy?</p>
        <div className="space-y-3">
          {roles.map(rol => (
            <button
              key={rol}
              onClick={() => elegirRol(rol)}
              className={`w-full ${colorRol[rol] || 'bg-gray-500 hover:bg-gray-600'} text-white rounded-xl px-6 py-4 flex items-center gap-4 transition-colors font-medium text-left`}
            >
              <span className="text-2xl">{iconoRol[rol] || '👤'}</span>
              <span>{etiquetaRol[rol] || rol}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
