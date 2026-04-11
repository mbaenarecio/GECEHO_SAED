import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './routes/ProtectedRoute'
import Login from './pages/Login'
import CambiarContrasena from './pages/CambiarContrasena'
import Dashboard from './pages/Dashboard'
import RegistroDiario from './pages/docente/RegistroDiario'
import MisRegistros from './pages/docente/MisRegistros'
import EstadoDocente from './pages/docente/EstadoDocente'
import AdminPanel from './pages/admin/AdminPanel'
import Centros from './pages/admin/Centros'
import Usuarios from './pages/admin/Usuarios'
import Cursos from './pages/shared/Cursos'
import Docentes from './pages/shared/Docentes'
import Alumnos from './pages/shared/Alumnos'
import Registros from './pages/shared/Registros'
import Asesores from './pages/shared/Asesores'
export default function App() {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen">Cargando...</div>
  return (
    <Routes>
      <Route path="/login" element={!user?<Login/>:<Navigate to="/dashboard"/>} />
      <Route path="/cambiar-contrasena" element={<CambiarContrasena/>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard/></ProtectedRoute>} />
      <Route path="/registro-diario" element={<ProtectedRoute roles={['docente']}><RegistroDiario/></ProtectedRoute>} />
      <Route path="/mis-registros" element={<ProtectedRoute roles={['docente']}><MisRegistros/></ProtectedRoute>} />
      <Route path="/estado" element={<ProtectedRoute roles={['docente']}><EstadoDocente/></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminPanel/></ProtectedRoute>} />
      <Route path="/centros" element={<ProtectedRoute roles={['admin','gestor']}><Centros/></ProtectedRoute>} />
      <Route path="/usuarios" element={<ProtectedRoute roles={['admin']}><Usuarios/></ProtectedRoute>} />
      <Route path="/cursos" element={<ProtectedRoute roles={['admin','gestor','coordinador']}><Cursos/></ProtectedRoute>} />
      <Route path="/docentes" element={<ProtectedRoute roles={['admin','gestor','coordinador']}><Docentes/></ProtectedRoute>} />
      <Route path="/alumnos" element={<ProtectedRoute roles={['admin','gestor','coordinador','asesor']}><Alumnos/></ProtectedRoute>} />
      <Route path="/registros" element={<ProtectedRoute roles={['admin','gestor','coordinador','asesor']}><Registros/></ProtectedRoute>} />
      <Route path="/asesores" element={<ProtectedRoute roles={['admin','gestor']}><Asesores/></ProtectedRoute>} />
      <Route path="*" element={<Navigate to={user?'/dashboard':'/login'}/>} />
    </Routes>
  )
}