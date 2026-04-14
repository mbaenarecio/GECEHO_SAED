import { useState, useEffect } from 'react'
import { Layout } from '../../components/layout/Layout'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { Select } from '../../components/common/Select'
import { Modal } from '../../components/common/Modal'
import { Alert } from '../../components/common/Alert'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { Plus, Pencil, Trash2, Search, X, Download } from 'lucide-react'

const TODOS_LOS_ROLES = ['admin','gestor','coordinador','asesor','docente']

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

const colorRol = {
  admin: 'bg-red-100 text-red-700',
  gestor: 'bg-purple-100 text-purple-700',
  asesor: 'bg-blue-100 text-blue-700',
  coordinador: 'bg-green-100 text-green-700',
  docente: 'bg-gray-100 text-gray-700'
}

function generarPassword() {
  const chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const especiales = '!@#$%'
  let pwd = ''
  for (let i = 0; i < 8; i++) pwd += chars[Math.floor(Math.random() * chars.length)]
  pwd += especiales[Math.floor(Math.random() * especiales.length)]
  pwd += Math.floor(Math.random() * 9) + 1
  return pwd.split('').sort(() => Math.random() - 0.5).join('')
}

function descargarCredenciales({ nombre, email, nombreUsuario, password }) {
  const appUrl = window.location.origin
  const contenido = `CREDENCIALES DE ACCESO - GECEHO
================================
Nombre: ${nombre}
Usuario: ${nombreUsuario || email}
Email: ${email}
Contraseña: ${password}
URL de acceso: ${appUrl}

IMPORTANTE: Cambia tu contraseña en el primer acceso.
`
  const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `credenciales_${(nombreUsuario || email).replace(/[^a-z0-9]/gi, '_')}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

function usernameDesdeMail(email) {
  if (!email || !email.includes('@')) return ''
  return email.split('@')[0]
}

export default function Usuarios() {
  const { profile, activeRole } = useAuth()

  const [usuarios, setUsuarios] = useState([])
  const [usuariosFiltrados, setUsuariosFiltrados] = useState([])
  const [centros, setCentros] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const [rolesSeleccionados, setRolesSeleccionados] = useState([])
  const [alert, setAlert] = useState(null)
  const [passwordGenerada, setPasswordGenerada] = useState('')
  const [modalCredenciales, setModalCredenciales] = useState(false)
  const [credencialesCreadas, setCredencialesCreadas] = useState(null)

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
        u.email?.toLowerCase().includes(busq)
      )
    }
    if (filtroRol) resultado = resultado.filter(u => u.roles?.includes(filtroRol))
    if (filtroCentro) resultado = resultado.filter(u => u.centro_id === filtroCentro)
    if (filtroActivo !== '') resultado = resultado.filter(u => u.activo === (filtroActivo === 'true'))
    setUsuariosFiltrados(resultado)
  }

  const limpiarFiltros = () => {
    setFiltroBusqueda(''); setFiltroRol(''); setFiltroCentro(''); setFiltroActivo('')
  }

  const fetchAll = async () => {
    setLoading(true)
    const [{ data: u }, { data: c }, { data: ur }] = await Promise.all([
      supabase.from('usuarios').select('*').order('apellido1'),
      supabase.from('centros').select('id,nombre').order('nombre'),
      supabase.from('usuario_roles').select('usuario_id,rol')
    ])
    const centrosData = c || []
    const rolesData = ur || []
    const usuariosEnriquecidos = (u || []).map(usr => ({
      ...usr,
      nombre_completo: usr.nombre_completo || `${usr.nombre || ''} ${usr.apellido1 || ''}`.trim(),
      centro_nombre: centrosData.find(x => x.id === usr.centro_id)?.nombre || '-',
      roles: rolesData.filter(r => r.usuario_id === usr.id).map(r => r.rol)
    }))
    setUsuarios(usuariosEnriquecidos)
    setCentros(centrosData.map(x => ({ value: x.id, label: x.nombre })))
    setLoading(false)
  }

  const rolesDisponibles = rolesPorRol[activeRole] || TODOS_LOS_ROLES
  const rolesParaMostrar = editing ? TODOS_LOS_ROLES : rolesDisponibles

  const openNew = () => {
    const pwd = generarPassword()
    setPasswordGenerada(pwd)
    setEditing(null)
    setForm({ activo: true })
    setRolesSeleccionados([])
    setModal(true)
  }

  const openEdit = (u) => {
    setEditing(u)
    setForm(u)
    setRolesSeleccionados(u.roles || [])
    setPasswordGenerada('')
    setModal(true)
  }

  const toggleRol = (rol) => {
    setRolesSeleccionados(prev =>
      prev.includes(rol) ? prev.filter(r => r !== rol) : [...prev, rol]
    )
  }

  const handleEmailChange = (e) => {
    const email = e.target.value
    const nuevoUsuario = usernameDesdeMail(email)
    setForm(prev => ({
      ...prev,
      email,
      nombre_usuario: prev.nombre_usuario || nuevoUsuario
    }))
  }

  const handleSave = async () => {
    if (rolesSeleccionados.length === 0) {
      setAlert({ type: 'error', message: 'Selecciona al menos un rol' }); return
    }
    setLoading(true)

    if (editing) {
      const { error } = await supabase.from('usuarios').update({
        nombre: form.nombre,
        apellido1: form.apellido1,
        apellido2: form.apellido2,
        alias: form.alias,
        nombre_completo: `${form.nombre || ''} ${form.apellido1 || ''}`.trim(),
        nombre_usuario: form.nombre_usuario,
        centro_id: form.centro_id || null,
        activo: form.activo
      }).eq('id', editing.id)

      if (!error) {
        await supabase.from('usuario_roles').delete().eq('usuario_id', editing.id)
        const inserts = rolesSeleccionados.map(r => ({ usuario_id: editing.id, rol: r }))
        const { error: rolesError } = await supabase.from('usuario_roles').insert(inserts)
        if (rolesError) {
          setAlert({ type: 'error', message: 'Error al guardar roles: ' + rolesError.message })
          setLoading(false); return
        }
        setAlert({ type: 'success', message: 'Usuario actualizado correctamente' })
      } else {
        setAlert({ type: 'error', message: error.message })
      }
      setModal(false); fetchAll(); return
    }

    if (!form.email || !form.nombre || !form.apellido1) {
      setAlert({ type: 'error', message: 'Nombre, apellido y email son obligatorios' })
      setLoading(false); return
    }

    const nombreUsuario = form.nombre_usuario || usernameDesdeMail(form.email)

    const { data: fnData, error: fnError } = await supabase.rpc('crear_usuario_con_roles', {
      p_email:          form.email,
      p_password:       passwordGenerada,
      p_nombre:         form.nombre,
      p_apellido1:      form.apellido1,
      p_apellido2:      form.apellido2 || null,
      p_nombre_usuario: nombreUsuario,
      p_roles:          rolesSeleccionados,
      p_centro_id:      form.centro_id || null
    })

    if (fnError || fnData?.error) {
      setAlert({ type: 'error', message: fnData?.error || fnError?.message })
      setLoading(false); return
    }

    if (fnData?.user_id && form.alias) {
      await supabase.from('usuarios').update({ alias: form.alias }).eq('id', fnData.user_id)
    }

    setCredencialesCreadas({
      nombre: `${form.nombre} ${form.apellido1}`,
      email: form.email,
      nombreUsuario,
      password: passwordGenerada
    })
    setModal(false)
    setModalCredenciales(true)
    fetchAll()
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este usuario?')) return
    const { error } = await supabase.from('usuarios').delete().eq('id', id)
    if (error) setAlert({ type: 'error', message: error.message })
    else { setAlert({ type: 'success', message: 'Usuario eliminado' }); fetchAll() }
  }

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

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-48">
              <label className="block text-xs text-gray-500 mb-1">Buscar</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                <input type="text" placeholder="Nombre o email..."
                  value={filtroBusqueda} onChange={e => setFiltroBusqueda(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="min-w-36">
              <label className="block text-xs text-gray-500 mb-1">Rol</label>
              <select value={filtroRol} onChange={e => setFiltroRol(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Todos los roles</option>
                {TODOS_LOS_ROLES.map(r => <option key={r} value={r}>{etiquetaRol[r]}</option>)}
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

        {loading ? <p className="text-gray-500">Cargando...</p> : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left">Nombre</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Roles</th>
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
                      <div className="flex flex-wrap gap-1">
                        {(u.roles && u.roles.length > 0) ? u.roles.map(r => (
                          <span key={r} className={`px-2 py-0.5 rounded-full text-xs font-medium ${colorRol[r] || 'bg-gray-100 text-gray-700'}`}>
                            {etiquetaRol[r] || r}
                          </span>
                        )) : <span className="text-gray-400 text-xs">Sin rol</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">{u.centro_nombre}</td>
                    <td className="px-4 py-3">{u.activo ? '✅' : '❌'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => openEdit(u)}><Pencil size={14} /></Button>
                        {activeRole === 'admin' && (
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

        <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar usuario' : 'Nuevo usuario'}>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input label="Nombre" value={form.nombre || ''} onChange={e => setForm({ ...form, nombre: e.target.value })} />
            </div>
            <div className="flex-1">
              <Input label="Primer apellido" value={form.apellido1 || ''} onChange={e => setForm({ ...form, apellido1: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input label="Segundo apellido" value={form.apellido2 || ''} onChange={e => setForm({ ...form, apellido2: e.target.value })} />
            </div>
            <div className="flex-1">
              <Input label="Alias" value={form.alias || ''} onChange={e => setForm({ ...form, alias: e.target.value })} />
            </div>
          </div>
          {!editing && (
            <Input label="Email" type="email" value={form.email || ''} onChange={handleEmailChange} />
          )}
          <Input label="Nombre de usuario (se rellena automáticamente desde el email)"
            value={form.nombre_usuario || ''}
            onChange={e => setForm({ ...form, nombre_usuario: e.target.value })} />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Roles</label>
            <div className="flex flex-wrap gap-2">
              {rolesParaMostrar.map(r => (
                <button key={r} type="button"
                  onClick={() => toggleRol(r)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    rolesSeleccionados.includes(r)
                      ? `${colorRol[r]} border-current`
                      : 'bg-white text-gray-500 border-gray-300 hover:border-gray-400'
                  }`}>
                  {etiquetaRol[r]}
                </button>
              ))}
            </div>
            {rolesSeleccionados.length === 0 && (
              <p className="text-xs text-red-500 mt-1">Selecciona al menos un rol</p>
            )}
          </div>

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
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-sm text-green-800">
              🔑 Contraseña generada automáticamente: <strong className="font-mono">{passwordGenerada}</strong>
              <p className="text-xs text-green-600 mt-1">Podrás descargar un documento con las credenciales al crear el usuario.</p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </Modal>

        <Modal open={modalCredenciales} onClose={() => setModalCredenciales(false)} title="Usuario creado correctamente">
          {credencialesCreadas && (
            <div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 text-sm font-mono space-y-1">
                <p><span className="text-gray-500">Nombre:</span> <strong>{credencialesCreadas.nombre}</strong></p>
                <p><span className="text-gray-500">Usuario:</span> <strong>{credencialesCreadas.nombreUsuario}</strong></p>
                <p><span className="text-gray-500">Email:</span> <strong>{credencialesCreadas.email}</strong></p>
                <p><span className="text-gray-500">Contraseña:</span> <strong>{credencialesCreadas.password}</strong></p>
                <p><span className="text-gray-500">URL:</span> <strong>{window.location.origin}</strong></p>
              </div>
              <p className="text-xs text-gray-500 mb-4">Descarga el documento para enviarlo al usuario. Una vez cerrada esta ventana, no podrás recuperar la contraseña.</p>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setModalCredenciales(false)}>Cerrar</Button>
                <Button onClick={() => { descargarCredenciales(credencialesCreadas); setModalCredenciales(false) }}>
                  <Download size={14} /> Descargar credenciales
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  )
}