import { Layout } from '../../components/layout/Layout'
import { Link } from 'react-router-dom'
import { Building2, Users, BookOpen, ClipboardList } from 'lucide-react'
const cards=[{to:'/centros',label:'Centros',icon:Building2,color:'bg-blue-500'},{to:'/usuarios',label:'Usuarios',icon:Users,color:'bg-green-500'},{to:'/cursos',label:'Cursos',icon:BookOpen,color:'bg-purple-500'},{to:'/registros',label:'Registros',icon:ClipboardList,color:'bg-orange-500'}]
export default function AdminPanel() {
  return(<Layout><div className="max-w-4xl mx-auto"><h2 className="text-2xl font-bold text-gray-800 mb-6">Panel de Administración</h2><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{cards.map(c=>{const Icon=c.icon;return(<Link key={c.to} to={c.to} className={`${c.color} text-white rounded-xl p-6 flex flex-col items-center gap-3 hover:opacity-90 transition`}><Icon size={32}/><span className="font-medium">{c.label}</span></Link>)})}</div></div></Layout>)
}