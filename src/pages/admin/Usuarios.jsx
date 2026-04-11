import { useState, useEffect } from 'react'
import { Layout } from '../../components/layout/Layout'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { Select } from '../../components/common/Select'
import { Modal } from '../../components/common/Modal'
import { Alert } from '../../components/common/Alert'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { Plus, Pencil, Trash2, Search, X, Mail } from 'lucide-react'

const rolesPorRol = {
  admin:       ['admin','gestor','coordinador','asesor','docente'],
  gestor:      ['asesor'],
  asesor:      ['coordinador','docente'],
  coordinador: ['docente'],
}

const etiquetaRol = {
  admin: 'Admin', gestor: 'Gestor', coordinador: 'Coordinador',
  asesor: 'Asesor', docente: 'Docente'
}

export default function Usuarios() {
  const { profile } = useAuth()
  const miRol = profile?.rol

  const [usuarios, setUsuarios] = useState([])
  const [usuariosFiltrados, setUsuariosFiltrados] = useState([])
  const [centros, setCentros] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const [alert, setAlert] = useState(null)
  const [enviandoInvitacion, setEnviandoInvitacion] = useState(false)

  const [filtroBusqueda, setFiltroBusqueda] = useState('')
  const [filtroRol, setFiltroRol] = useState('')
  const [filtroCentro, setFiltroCentro] = useState('')
  const [filtroActivo, setFiltroActivo] = useState('')

  useEffect(() => { fetchAll() }, [])
  useEffect(() => { aplicarFiltros() }, [usuarios, filtroBusqueda, filtroRol, filtroCentro, filtroActivo])

  const aplicarFiltros = () => {
    let resultado = [...usuarios]
    if (filtroBusqueda) {
      const busq = filtroBusqueda.toLowerCase()
      resultado = resultado.filter(u =>
        u.nombre_completo?.toLowerCase().includes(busq) ||
        u.nombre?.toLowerCase().includes(busq) ||
        u.apellido1?.toLowerCase().includes(busq) ||
        u.email?.toLowerCase().includes(busq)
      )
    }
    if (filtroRol) resultado = resultado.filter(u => u.rol === filtroRol)
    if (filtroCentro) resultado = resultado.filter(u => u.centro_id === filtroCentro)
    if (filtroActivo !== '') resultado = resultado.filter(u => u.activo === (filtroActivo === 'true'))
    setUsuariosFiltrados(resultado)
  }

  const limpiarFiltros = () => {
    setFiltroBusqueda('')
    setFiltroRol('')
    setFiltroCentro('')
    setFiltroActivo('')
  }

  const fetchAll = async () => {
    setLoading(true)
    const [{ data: u }, { data: c }] = await Promise.all([
      supabase.from('usuarios').select('*').order('apellido1'),
      supabase.from('centros').select('id,nombre').order('nombre')
    ])
    const centrosData = c || []
    const usuariosEnriquecidos = (u || []).map(usr => ({
      ...usr,
      centro_nombre: centrosData.find(x => x.id === usr.centro_id)?.nombre || '-',
      nombre_completo: usr.nombre_completo || `${usr.nombre || ''} ${usr.apellido1 || ''}`.trim()
    }))
    setUsuarios(usuariosEnriquecidos)
    setCentros(centrosData.map(x => ({ value: x.id, label: x.nombre })))
    setLoading(false)
  }

  const openNew = () => {
    const rolesDisponibles = rolesPorRol[miRol] || []
    setEditing(null)
    setForm({ rol: rolesDisponibles[0] || 'docente', activo: true })
    setModal(true)
  }

  const openEdit = (u) => {
    setEditing(u)
    setForm(u)
    setModal(true)
  }

  const handleSave = async () => {
    setLoading(true)

    if (editing) {
      // Solo editar datos, no cambiar auth
      const { error } = await supabase.from('usuarios').update({
        nombre: form.nombre,
        apellido1: form.apellido1,
        apellido2: form.apellido2,
        nombre_completo: `${form.nombre || ''} ${form.apellido1 || ''}`.trim(),
        nombre_usuario: form.nombre_usuario,
        rol: form.rol,
        centro_id: form.centro_id || null,
        activo: form.activo
      }).eq('id', editing.id)

      if (error) setAlert({ type: 'error', message: error.message })
      else setAlert({ type: 'success', message: 'Usuario actualizado correctamente' })
      setModal(false)
      fetchAll()
      return
    }

    // Crear nuevo usuario
    if (!form.email || !form.nombre || !form.apellido1) {
      setAlert({ type: 'error', message: 'Nombre, apellido y email son obligatorios' })
      setLoading(false)
      return
    }

    // Paso 1: Crear en tabla usuarios via función segura
    const { data: fnData, error: fnError } = await supabase.rpc('crear_usuario', {
      p_email: form.email,
      p_password: Math.random().toString(36).slice(-10) + 'Aa1!', // temporal
      p_nombre: form.nombre,
      p_apellido1: form.apellido1,
      p_apellido2: form.apellido2 || null,
      p_nombre_usuario: form.nombre_usuario || null,
      p_rol: form.rol,
      p_centro_id: form.centro_id || null
    })

    if (fnError || fnData?.error) {
      setAlert({ type: 'error', message: fnData?.error || fnError?.message })
      setLoading(false)
      return
    }

    // Paso 2: Enviar invitación por email para que el usuario establezca su contraseña
    setEnviandoInvitacion(true)
    const { error: invError } = await supabase.auth.signInWithOtp({
      email: form.email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: window.location.origin
      }
    })
    setEnviandoInvitacion(false)

    if (invError) {
      setAlert({ type: 'error', message: 'Usuario creado pero no se pudo enviar el email: ' + invError.message })
    } else {
      setAlert({ type: 'success', message: `Usuario creado. Se ha enviado un email a ${form.email} para que establezca su contraseña.` })
    }

    setModal(false)
    fetchAll()
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este usuario?')) return
    const { error } = await supabase.from('usuarios').delete().eq('id', id)
    if (error) setAlert({ type: 'error', message: error.message })
    else { setAlert({ type: 'success', message: 'Usuario eliminado' }); fetchAll() }
  }

  const reenviarInvitacion = async (email) => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, emailRedirectTo: window.location.origin }
    })
    if (error) setAlert({ type: 'error', message: 'Error al reenviar: ' + error.message })
    else setAlert({ type: 'success', message: `Email reenviado a ${email}` })
    setLoading(false)
  }

  const rolesDisponibles = (rolesPorRol[miRol] || []).map(r => ({ value: r, label: etiquetaRol[r] }))
  const todosRoles = Object.entries(etiquetaRol).map(([v, l]) => ({ value: v, label: l }))
  const hayFiltrosActivos = filtroBusqueda || filtroRol || filtroCentro || filtroActivo !== ''

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Usuarios</h2>
          {rolesDisponibles.length > 0 && (
            <Button onClick={openNew}><Plus size={16} /> Nuevo usuario</Button>
          )}
        </div>

        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} className="mb-4" />}

        {/* Filtros */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-48">
              <label className="block text-xs text-gray-500 mb-1">Buscar</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                <input type="text" placeholder="Nombre, apellido o email..."
                  value={filtroBusqueda} onChange={e => setFiltroBusqueda(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="min-w-36">
              <label className="block text-xs text-gray-500 mb-1">Rol</label>
              <select value={filtroRol} onChange={e => setFiltroRol(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Todos los roles</option>
                {todosRoles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div className="min-w-44">
              <label className="block text-xs text-gray-500 mb-1">Centro</label>
              <select value={filtroCentro} onChange={e => setFiltroCentro(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Todos los centros</option>
                {centros.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="min-w-36">
              <label className="block text-xs text-gray-500 mb-1">Estado</label>
              <select value={filtroActivo} onChange={e => setFiltroActivo(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Todos</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </select>
            </div>
            {hayFiltrosActivos && (
              <button onClick={limpiarFiltros}
                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-red-500 border border-gray-300 rounded-lg hover:border-red-300 transition-colors">
                <X size={14} /> Limpiar
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {usuariosFiltrados.length} usuario{usuariosFiltrados.length !== 1 ? 's' : ''} encontrado{usuariosFiltrados.length !== 1 ? 's' : ''}
            {hayFiltrosActivos ? ` (de ${usuarios.length} total)` : ''}
          </p>
        </div>

        {/* Tabla */}
        {loading ? <p className="text-gray-500">Cargando...</p> : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left">Nombre</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Rol</th>
                  <th className="px-4 py-3 text-left">Centro</th>
                  <th className="px-4 py-3 text-left">Activo</th>
                  <th className="px-4 py-3 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usuariosFiltrados.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{u.nombre_completo}</td>
                    <td className="px-4 py-3 text-gray-500">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.rol === 'admin' ? 'bg-red-100 text-red-700' :
                        u.rol === 'gestor' ? 'bg-purple-100 text-purple-700' :
                        u.rol === 'asesor' ? 'bg-blue-100 text-blue-700' :
                        u.rol === 'coordinador' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>{etiquetaRol[u.rol] || u.rol}</span>
                    </td>
                    <td className="px-4 py-3">{u.centro_nombre}</td>
                    <td className="px-4 py-3">{u.activo ? '✅' : '❌'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => openEdit(u)}><Pencil size={14} /></Button>
                        <button onClick={() => reenviarInvitacion(u.email)}
                          title="Reenviar email de acceso"
                          className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-300 transition-colors">
                          <Mail size={14} />
                        </button>
                        {miRol === 'admin' && (
                          <Button variant="danger" onClick={() => handleDelete(u.id)}><Trash2 size={14} /></Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {usuariosFiltrados.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    {hayFiltrosActivos ? 'No hay usuarios con esos filtros' : 'Sin usuarios'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal */}
        <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar usuario' : 'Nuevo usuario'}>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input label="Nombre" value={form.nombre || ''} onChange={e => setForm({ ...form, nombre: e.target.value })} />
            </div>
            <div className="flex-1">
              <Input label="Primer apellido" value={form.apellido1 || ''} onChange={e => setForm({ ...form, apellido1: e.target.value })} />
            </div>
          </div>
          <Input label="Segundo apellido" value={form.apellido2 || ''} onChange={e => setForm({ ...form, apellido2: e.target.value })} />

          {!editing && (
            <Input label="Email" type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} />
          )}

          <Input label="Nombre de usuario" value={form.nombre_usuario || ''} onChange={e => setForm({ ...form, nombre_usuario: e.target.value })} />

          <Select
            label="Rol"
            options={editing ? todosRoles.filter(r => rolesPorRol[miRol]?.includes(r.value) || miRol === 'admin') : rolesDisponibles}
            value={form.rol || ''}
            onChange={e => setForm({ ...form, rol: e.target.value })}
          />

          <Select
            label="Centro"
            options={[{ value: '', label: '-- Sin centro --' }, ...centros]}
            value={form.centro_id || ''}
            onChange={e => setForm({ ...form, centro_id: e.target.value })}
          />

          <div className="flex items-center gap-2 mb-4">
            <input type="checkbox" id="activo" checked={!!form.activo} onChange={e => setForm({ ...form, activo: e.target.checked })} />
            <label htmlFor="activo" className="text-sm">Activo</label>
          </div>

          {!editing && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-700">
              📧 Se enviará un email al usuario para que establezca su contraseña.
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={loading || enviandoInvitacion}>
              {enviandoInvitacion ? 'Enviando email...' : loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </Modal>
      </div>
    </Layout>
  )
}
