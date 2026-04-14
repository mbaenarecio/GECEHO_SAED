import { useAuth } from '../context/AuthContext'

const etiquetaRol = {
  admin: 'Admin', gestor: 'Gestor', coordinador: 'Coordinador',
  asesor: 'Asesor', docente: 'Docente'
}

const colorRol = {
  admin:       'border-red-400 bg-red-50 text-red-700 hover:bg-red-100',
  gestor:      'border-purple-400 bg-purple-50 text-purple-700 hover:bg-purple-100',
  coordinador: 'border-green-400 bg-green-50 text-green-700 hover:bg-green-100',
  asesor:      'border-blue-400 bg-blue-50 text-blue-700 hover:bg-blue-100',
  docente:     'border-gray-400 bg-gray-50 text-gray-700 hover:bg-gray-100',
}

const descripcionRol = {
  admin:       'Acceso completo a toda la plataforma',
  gestor:      'Gestión de centros, asesores y alumnos',
  coordinador: 'Gestión de cursos, docentes y alumnos',
  asesor:      'Seguimiento de alumnos y registros',
  docente:     'Registro diario y seguimiento de alumnos',
}

export default function SelectorRol() {
  const { profile, roles, elegirRol, signOut } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-600 mb-1">GECEHO</h1>
          <p className="text-gray-500 text-sm">
            Bienvenido/a, <strong>{profile?.nombre_completo || profile?.email}</strong>
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Tienes varios roles asignados. ¿Con cuál quieres trabajar hoy?
          </p>
        </div>

        <div className="space-y-3">
          {roles.map(rol => (
            <button
              key={rol}
              onClick={() => elegirRol(rol)}
              className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-colors ${colorRol[rol] || 'border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
            >
              <p className="font-semibold text-base">{etiquetaRol[rol] || rol}</p>
              <p className="text-sm opacity-75 mt-0.5">{descripcionRol[rol] || ''}</p>
            </button>
          ))}
        </div>

        <button
          onClick={signOut}
          className="w-full mt-6 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
