import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, Building2, Users, UserCheck,
  GraduationCap, ClipboardList, UserCog, LogOut
} from 'lucide-react'

const nav = [
  { to: '/dashboard',       label: 'Dashboard',       icon: LayoutDashboard, roles: ['admin','gestor','coordinador','asesor','docente'] },
  { to: '/admin',           label: 'Panel Admin',     icon: UserCog,         roles: ['admin'] },
  { to: '/centros',         label: 'Centros',         icon: Building2,       roles: ['admin','gestor','asesor'] },
  { to: '/usuarios',        label: 'Usuarios',        icon: Users,           roles: ['admin'] },
  { to: '/docentes',        label: 'Docentes',        icon: UserCheck,       roles: ['admin','gestor','coordinador','asesor'] },
  { to: '/alumnos',         label: 'Alumnos',         icon: GraduationCap,   roles: ['admin','gestor','coordinador','asesor','docente'] },
  { to: '/registros',       label: 'Registros',       icon: ClipboardList,   roles: ['admin','gestor','coordinador','asesor'] },
  { to: '/asesores',        label: 'Asesores',        icon: UserCheck,       roles: ['admin','gestor'] },
  { to: '/registro-diario', label: 'Registro Diario', icon: ClipboardList,   roles: ['docente'] },
  { to: '/mis-registros',   label: 'Mis Registros',   icon: ClipboardList,   roles: ['docente'] },
  { to: '/estado',          label: 'Mi Estado',       icon: LayoutDashboard, roles: ['docente'] },
]

const etiquetaRol = {
  admin: 'Administrador', gestor: 'Gestor', coordinador: 'Coordinador',
  asesor: 'Asesor', docente: 'Docente'
}

const colorRolActivo = {
  admin: 'bg-red-500',
  gestor: 'bg-purple-500',
  coordinador: 'bg-green-500',
  asesor: 'bg-blue-500',
  docente: 'bg-gray-500',
}

export function Sidebar() {
  const { profile, roles, activeRole, setActiveRole, signOut } = useAuth()
  const location = useLocation()

  const nombre = profile?.nombre
    ? `${profile.nombre}${profile.apellido1 ? ' ' + profile.apellido1 : ''}`
    : profile?.nombre_completo || profile?.email || ''

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col min-h-screen">
      <div className="px-6 py-5 border-b border-gray-700">
        <h1 className="text-xl font-bold text-blue-400">GECEHO</h1>
        <p className="text-xs text-gray-400 mt-1">{etiquetaRol[activeRole] || activeRole}</p>
        <p className="text-xs text-gray-500 truncate">{nombre}</p>
      </div>

      {roles.length > 1 && (
        <div className="px-3 pt-3 pb-2 border-b border-gray-700">
          <p className="text-xs text-gray-500 mb-2 px-1">Rol activo:</p>
          <div className="flex flex-wrap gap-1">
            {roles.map(r => (
              <button
                key={r}
                onClick={() => setActiveRole(r)}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  activeRole === r
                    ? `${colorRolActivo[r] || 'bg-blue-500'} text-white`
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {etiquetaRol[r] || r}
              </button>
            ))}
          </div>
        </div>
      )}

      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.filter(i => i.roles.includes(activeRole)).map(item => {
          const Icon = item.icon
          const active = location.pathname === item.to
          return (
            <Link key={item.to} to={item.to}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${active ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'}`}>
              <Icon size={16} />{item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-700">
        <button onClick={signOut}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 w-full">
          <LogOut size={16} />Cerrar sesión
        </button>
      </div>
    </aside>
  )
}