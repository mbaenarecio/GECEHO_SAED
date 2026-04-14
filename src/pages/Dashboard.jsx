import { useAuth } from '../context/AuthContext'
import { Layout } from '../components/layout/Layout'

const etiquetaRol = {
  admin: 'Administrador', gestor: 'Gestor', coordinador: 'Coordinador',
  asesor: 'Asesor', docente: 'Docente'
}

const colorRol = {
  admin: 'bg-red-100 text-red-700 border-red-300',
  gestor: 'bg-purple-100 text-purple-700 border-purple-300',
  coordinador: 'bg-green-100 text-green-700 border-green-300',
  asesor: 'bg-blue-100 text-blue-700 border-blue-300',
  docente: 'bg-gray-100 text-gray-700 border-gray-300',
}

export default function Dashboard() {
  const { profile, roles, activeRole, setActiveRole } = useAuth()

  const nombre = profile?.nombre
    ? `${profile.nombre}${profile.apellido1 ? ' ' + profile.apellido1 : ''}${profile.apellido2 ? ' ' + profile.apellido2 : ''}`
    : profile?.nombre_completo || profile?.email || ''

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">
          Bienvenido/a, {nombre}
        </h2>
        <p className="text-gray-500 mb-6">
          Rol activo: <span className="font-medium capitalize">{etiquetaRol[activeRole] || activeRole}</span>
        </p>

        {roles.length > 1 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">Cambiar rol activo</h3>
            <div className="flex flex-wrap gap-2">
              {roles.map(r => (
                <button
                  key={r}
                  onClick={() => setActiveRole(r)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                    activeRole === r
                      ? colorRol[r] || 'bg-blue-100 text-blue-700 border-blue-300'
                      : 'bg-white text-gray-500 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {etiquetaRol[r] || r}
                  {activeRole === r && <span className="ml-1">✓</span>}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Al cambiar de rol, el menú lateral se actualizará con las opciones correspondientes.
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}