import { useAuth } from '../context/AuthContext'
import { Layout } from '../components/layout/Layout'
export default function Dashboard() {
  const { profile } = useAuth()
  return(<Layout><div className="max-w-3xl mx-auto"><h2 className="text-2xl font-bold text-gray-800 mb-2">Bienvenido, {profile?.nombre_completo||profile?.email}</h2><p className="text-gray-500 capitalize">Rol: {profile?.rol}</p></div></Layout>)
}