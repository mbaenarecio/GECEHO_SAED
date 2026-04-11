import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LayoutDashboard, Building2, Users, BookOpen, UserCheck, GraduationCap, ClipboardList, UserCog, LogOut } from 'lucide-react'
const nav=[
  {to:'/dashboard',label:'Dashboard',icon:LayoutDashboard,roles:['admin','gestor','coordinador','asesor','docente']},
  {to:'/admin',label:'Panel Admin',icon:UserCog,roles:['admin']},
  {to:'/centros',label:'Centros',icon:Building2,roles:['admin','gestor']},
  {to:'/usuarios',label:'Usuarios',icon:Users,roles:['admin']},
  {to:'/cursos',label:'Cursos',icon:BookOpen,roles:['admin','gestor','coordinador']},
  {to:'/docentes',label:'Docentes',icon:UserCheck,roles:['admin','gestor','coordinador']},
  {to:'/alumnos',label:'Alumnos',icon:GraduationCap,roles:['admin','gestor','coordinador','asesor']},
  {to:'/registros',label:'Registros',icon:ClipboardList,roles:['admin','gestor','coordinador','asesor']},
  {to:'/asesores',label:'Asesores',icon:UserCheck,roles:['admin','gestor']},
  {to:'/registro-diario',label:'Registro Diario',icon:ClipboardList,roles:['docente']},
  {to:'/mis-registros',label:'Mis Registros',icon:ClipboardList,roles:['docente']},
  {to:'/estado',label:'Mi Estado',icon:LayoutDashboard,roles:['docente']},
]
export function Sidebar() {
  const { profile, signOut } = useAuth()
  const location = useLocation()
  const rol = profile?.rol
  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col min-h-screen">
      <div className="px-6 py-5 border-b border-gray-700">
        <h1 className="text-xl font-bold text-blue-400">GECEHO</h1>
        <p className="text-xs text-gray-400 mt-1 capitalize">{rol}</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.filter(i=>i.roles.includes(rol)).map(item=>{
          const Icon=item.icon; const active=location.pathname===item.to
          return <Link key={item.to} to={item.to} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${active?'bg-blue-600 text-white':'text-gray-300 hover:bg-gray-800'}`}><Icon size={16}/>{item.label}</Link>
        })}
      </nav>
      <div className="px-3 py-4 border-t border-gray-700">
        <button onClick={signOut} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 w-full"><LogOut size={16}/>Cerrar sesión</button>
      </div>
    </aside>
  )
}