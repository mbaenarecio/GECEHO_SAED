import { useState, useEffect } from 'react'
import { Layout } from '../../components/layout/Layout'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { Select } from '../../components/common/Select'
import { Modal } from '../../components/common/Modal'
import { Alert } from '../../components/common/Alert'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { Plus, Pencil, UserPlus, Search, X, Download, RefreshCw } from 'lucide-react'

const SERVICIOS = ['Primaria', 'Secundaria']
const CATEGORIAS = ['Primaria Aula', 'Primaria SAED', 'Secundaria Aula', 'Secundaria SAED', 'UHBA']

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

export default function Docentes() {
  const { profile, activeRole } = useAuth()

  const [docentes, setDocentes] = useState([])
  const [docentesFiltrados, setDocentesFiltrados] = useState([])
  const [centros, setCentros] = useState([])
  const [alumnos, setAlumnos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [modalAsignar, setModalAsignar] = useState(false)
  const [modalCredenciales, setModalCredenciales] = useState(false)
  const [editing, setEditing] = useState(null)
  const [selectedDocente, setSelectedDocente] = useState(null)
  const [selectedAlumno, setSelectedAlumno] = useState('')
  const [form, setForm] = useState({})
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState([])
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState([])
  const [alert, setAlert] = useState(null)
  const [passwordGenerada, setPasswordGenerada] = useState('')
  const [credencialesCreadas, setCredencialesCreadas] = useState(null)

  const [filtroBusqueda, setFiltroBusqueda] = useState('')
  const [filtroCentro, setFiltroCentro] = useState('')
  const [filtroServicio, setFiltroServicio] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroActivo, setFiltroActivo] = useState('')

  const puedeCrear = ['admin', 'gestor', 'asesor', 'coordinador'].includes(activeRole)
  const puedeEditar = ['admin', 'gestor', 'asesor', 'coordinador'].includes(activeRole)

  useEffect(() => { fetchAll() }, [])
  useEffect(() => { aplicarFiltros() }, [docentes, filtroBusqueda, filtroCentro, filtroServicio, filtroCategoria, filtroActivo])

  const aplicarFiltros = () => {
    let r = [...docentes]
    if (filtroBusqueda) {
      const b = filtroBusqueda.toLowerCase()
      r = r.filter(d => d.nombre_completo?.toLowerCase().includes(b) || d.email?.toLowerCase().includes(b))
    }
    if (filtroCentro) r = r.filter(d => d.centro_id === filtroCentro)
    if (filtroServicio) r = r.filter(d => d.servicios?.includes(filtroServicio))
    if (filtroCategoria) r = r.filter(d => d.categorias?.includes(filtroCategoria))
    if (filtroActivo !== '') r = r.filter(d => d.activo === (filtroActivo === 'true'))
    setDocentesFiltrados(r)
  }

  const limpiarFiltros = () => {
    setFiltroBusqueda(''); setFiltroCentro(''); setFiltroServicio(''); setFiltroCategoria(''); setFiltroActivo('')
  }

  const fetchAll = async () => {
    setLoading(true)
    const [{ data: u }, { data: c }, { data: a }, { data: ur }] = await Promise.all([
      supabase.from('usuarios').select('*').order('apellido1'),
      supabase.from('centros').select('id,nombre').order('nombre'),
      supabase.from('alumnos').select('id,nombre,apellido1').eq('activo', true).order('apellido1'),
      supabase.from('usuario_roles').select('usuario_id,rol').eq('rol', 'docente')
    ])
    const centrosData = c || []
    const docenteIds = (ur || []).map(r => r.usuario_id)
    const docentesData = (u || [])
      .filter(x => docenteIds.includes(x.id))
      .map(x => ({
        ...x,
        nombre_completo: x.nombre_completo || `${x.nombre || ''} ${x.apellido1 || ''}`.trim(),
        centro_nombre: centrosData.find(cc => cc.id === x.centro_id)?.nombre || '-',
        servicios: x.servicios || [],
        categorias: x.categorias || []
      }))
    setDocentes(docentesData)
    setCentros(centrosData.map(x => ({ value: x.id, label: x.nombre })))
    setAlumnos((a || []).map(x => ({ value: x.id, label: `${x.apellido1}, ${x.nombre}` })))
    setLoading(false)
  }

  const openNew = () => {
    const pwd = generarPassword()
    setPasswordGenerada(pwd)
    setEditing(null)
    const centroFijo = activeRole === 'coordinador' ? profile?.centro_id : null
    setForm({ activo: true, centro_id: centroFijo })
    setServiciosSeleccionados([])
    setCategoriasSeleccionadas([])
    setModal(true)
  }

  const openEdit = (d) => {
    setEditing(d)
    setForm(d)
    setServiciosSeleccionados(d.servicios || [])
    setCategoriasSeleccionadas(d.categorias || [])
    setPasswordGenerada('')
    setModal(true)
  }

  const toggleItem = (arr, setArr, item) => {
    setArr(arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item])
  }

  const handleEmailChange = (e) => {
    const email = e.target.value
    setForm(prev => ({
      ...prev,
      email,
      nombre_usuario: prev.nombre_usuario || usernameDesdeMail(email)
    }))
  }

  const regenerarPassword = () => {
    setPasswordGenerada(generarPassword())
  }

  const handleSave = async () => {
    if (!form.email && !editing) {
      setAlert({ type: 'error', message: 'El email es obligatorio' })
      return
    }
    setLoading(true)

    if (editing) {
      const payload = {
        nombre: form.nombre,
        apellido1: form.apellido1,
        apellido2: form.apellido2,
        alias: form.alias,
        nombre_completo: `${form.nombre || ''} ${form.apellido1 || ''}`.trim(),
        nombre_usuario: form.nombre_usuario,
        centro_id: form.centro_id || null,
        activo: form.activo,
        servicios: serviciosSeleccionados,
        categorias: categoriasSeleccionadas
      }
      const { error } = await supabase.from('usuarios').update(payload).eq('id', editing.id)
      if (error) {
        setAlert({ type: 'error', message: error.message })
        setLoading(false); return
      }
      if (passwordGenerada) {
        setCredencialesCreadas({
          nombre: `${form.nombre || ''} ${form.apellido1 || ''}`.trim(),
          email: editing.email,
          nombreUsuario: form.nombre_usuario || editing.nombre_usuario,
          password: passwordGenerada
        })
        setModal(false)
        setModalCredenciales(true)
      } else {
        setAlert({ type: 'success', message: 'Docente actualizado' })
        setModal(false)
      }
      fetchAll(); return
    }

    const nombreUsuario = form.nombre_usuario || usernameDesdeMail(form.email)
    const { data: fnData, error: fnError } = await supabase.rpc('crear_usuario_con_roles', {
      p_email:          form.email,
      p_password:       passwordGenerada,
      p_nombre:         form.nombre || '',
      p_apellido1:      form.apellido1 || '',
      p_apellido2:      form.apellido2 || null,
      p_nombre_usuario: nombreUsuario,
      p_roles:          ['docente'],
      p_centro_id:      form.centro_id || null
    })

    if (fnError || fnData?.error) {
      setAlert({ type: 'error', message: fnData?.error || fnError?.message })
      setLoading(false); return
    }

    if (fnData?.user_id) {
      await supabase.from('usuarios').update({
        alias: form.alias || null,
        servicios: serviciosSeleccionados,
        categorias: categoriasSeleccionadas
      }).eq('id', fnData.user_id)
    }

    setCredencialesCreadas({
      nombre: `${form.nombre || ''} ${form.apellido1 || ''}`.trim() || form.email,
      email: form.email,
      nombreUsuario,
      password: passwordGenerada
    })
    setModal(false)
    setModalCredenciales(true)
    fetchAll()
  }

  const openAsignar = (d) => { setSelectedDocente(d); setSelectedAlumno(''); setModalAsignar(true) }
  const handleAsignar = async () => {
    if (!selectedAlumno) return
    const { error } = await supabase.from('docente_alumno').insert({ docente_id: selectedDocente.id, alumno_id: selectedAlumno })
    if (error) setAlert({ type: 'error', message: error.message })
    else { setAlert({ type: 'success', message: 'Alumno asignado' }); setModalAsignar(false) }
  }

  const hayFiltros = filtroBusqueda || filtroCentro || filtroServicio || filtroCategoria || filtroActivo !== ''

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Docentes</h2>
          {puedeCrear && <Button onClick={openNew}><Plus size={16} /> Nuevo docente</Button>}
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
            <div className="min-w-44">
              <label className="block text-xs text-gray-500 mb-1">Centro</label>
              <select value={filtroCentro} onChange={e => setFiltroCentro(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Todos los centros</option>
                {centros.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="min-w-36">
              <label className="block text-xs text-gray-500 mb-1">Servicio</label>
              <select value={filtroServicio} onChange={e => setFiltroServicio(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Todos</option>
                {SERVICIOS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="min-w-40">
              <label className="block text-xs text-gray-500 mb-1">Categoría</label>
              <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Todas</option>
                {CATEGORIAS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
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
            {hayFiltros && (
              <button onClick={limpiarFiltros}
                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-red-500 border border-gray-300 rounded-lg hover:border-red-300 transition-colors">
                <X size={14} /> Limpiar
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {docentesFiltrados.length} docente{docentesFiltrados.length !== 1 ? 's' : ''} encontrado{docentesFiltrados.length !== 1 ? 's' : ''}
            {hayFiltros ? ` (de ${docentes.length} total)` : ''}
          </p>
        </div>

        {loading ? <p className="text-gray-500">Cargando...</p> : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left">Nombre</th>
                  <th className="px-4 py-3 text-left">Alias</th>
                  <th className="px-4 py-3 text-left">Usuario</th>
                  <th className="px-4 py-3 text-left">Centro</th>
                  <th className="px-4 py-3 text-left">Servicios</th>
                  <th className="px-4 py-3 text-left">Categorías</th>
                  <th className="px-4 py-3 text-left">Activo</th>
                  <th className="px-4 py-3 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {docentesFiltrados.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{d.nombre_completo}</td>
                    <td className="px-4 py-3 text-gray-500">{d.alias || '-'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{d.nombre_usuario || d.email}</td>
                    <td className="px-4 py-3">{d.centro_nombre}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(d.servicios || []).map(s => (
                          <span key={s} className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs">{s}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(d.categorias || []).map(cat => (
                          <span key={cat} className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs">{cat}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">{d.activo ? '✅' : '❌'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {puedeEditar && (
                          <Button variant="secondary" onClick={() => openEdit(d)}><Pencil size={14} /></Button>
                        )}
                        <Button onClick={() => openAsignar(d)}><UserPlus size={14} /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {docentesFiltrados.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    {hayFiltros ? 'No hay docentes con esos filtros' : 'Sin docentes'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar docente' : 'Nuevo docente'}>
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
            <Input label="Email *" type="email" value={form.email || ''} onChange={handleEmailChange} />
          )}
          <Input label="Nombre de usuario"
            value={form.nombre_usuario || ''}
            onChange={e => setForm({ ...form, nombre_usuario: e.target.value })} />

          {activeRole === 'coordinador' ? (
            <p className="text-sm text-gray-500 mb-4">Centro: <strong>{centros.find(c => c.value === profile?.centro_id)?.label || '-'}</strong></p>
          ) : (
            <Select label="Centro" options={[{ value: '', label: '-- Sin centro --' }, ...centros]}
              value={form.centro_id || ''} onChange={e => setForm({ ...form, centro_id: e.target.value })} />
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Servicios</label>
            <div className="flex gap-2 flex-wrap">
              {SERVICIOS.map(s => (
                <button key={s} type="button" onClick={() => toggleItem(serviciosSeleccionados, setServiciosSeleccionados, s)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    serviciosSeleccionados.includes(s) ? 'bg-indigo-100 text-indigo-700 border-indigo-300' : 'bg-white text-gray-500 border-gray-300 hover:border-gray-400'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Categorías</label>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIAS.map(cat => (
                <button key={cat} type="button" onClick={() => toggleItem(categoriasSeleccionadas, setCategoriasSeleccionadas, cat)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    categoriasSeleccionadas.includes(cat) ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-white text-gray-500 border-gray-300 hover:border-gray-400'
                  }`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <input type="checkbox" id="activo" checked={!!form.activo} onChange={e => setForm({ ...form, activo: e.target.checked })} />
            <label htmlFor="activo" className="text-sm">Activo</label>
          </div>

          {!editing ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-sm text-green-800">
              🔑 Contraseña generada: <strong className="font-mono">{passwordGenerada}</strong>
              <p className="text-xs text-green-600 mt-1">Podrás descargar las credenciales al crear el docente.</p>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-sm text-yellow-800">
              <div className="flex items-center justify-between mb-1">
                <span>🔑 Regenerar contraseña</span>
                <button onClick={regenerarPassword}
                  className="flex items-center gap-1 px-2 py-1 bg-yellow-200 hover:bg-yellow-300 rounded text-xs font-medium transition-colors">
                  <RefreshCw size={12} /> Generar nueva
                </button>
              </div>
              {passwordGenerada
                ? <p className="font-mono font-bold mt-1">{passwordGenerada}</p>
                : <p className="text-xs text-yellow-600">Pulsa "Generar nueva" para crear una contraseña nueva y descargarla.</p>
              }
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</Button>
          </div>
        </Modal>

        <Modal open={modalCredenciales} onClose={() => setModalCredenciales(false)} title="Credenciales de acceso">
          {credencialesCreadas && (
            <div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 text-sm font-mono space-y-1">
                <p><span className="text-gray-500">Nombre:</span> <strong>{credencialesCreadas.nombre}</strong></p>
                <p><span className="text-gray-500">Usuario:</span> <strong>{credencialesCreadas.nombreUsuario}</strong></p>
                <p><span className="text-gray-500">Email:</span> <strong>{credencialesCreadas.email}</strong></p>
                <p><span className="text-gray-500">Contraseña:</span> <strong>{credencialesCreadas.password}</strong></p>
                <p><span className="text-gray-500">URL:</span> <strong>{window.location.origin}</strong></p>
              </div>
              <p className="text-xs text-gray-500 mb-4">Una vez cerrada esta ventana no podrás recuperar la contraseña.</p>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setModalCredenciales(false)}>Cerrar</Button>
                <Button onClick={() => { descargarCredenciales(credencialesCreadas); setModalCredenciales(false) }}>
                  <Download size={14} /> Descargar credenciales
                </Button>
              </div>
            </div>
          )}
        </Modal>

        <Modal open={modalAsignar} onClose={() => setModalAsignar(false)} title={`Asignar alumno a ${selectedDocente?.nombre_completo}`}>
          <Select label="Alumno" value={selectedAlumno} onChange={e => setSelectedAlumno(e.target.value)} options={alumnos} />
          <div className="flex gap-2 pt-2">
            <Button onClick={handleAsignar}>Asignar</Button>
            <Button variant="secondary" onClick={() => setModalAsignar(false)}>Cancelar</Button>
          </div>
        </Modal>
      </div>
    </Layout>
  )
}