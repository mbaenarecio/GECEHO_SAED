import { useState, useEffect } from 'react'
import { Layout } from '../../components/layout/Layout'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { Select } from '../../components/common/Select'
import { Modal } from '../../components/common/Modal'
import { Alert } from '../../components/common/Alert'
import { supabase } from '../../lib/supabaseClient'
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react'

function parseFecha(fechaISO) {
  if (!fechaISO) return { dia: '', mes: '', anio: '' }
  const parte = fechaISO.split('T')[0].split('-')
  return { anio: parte[0], mes: parte[1], dia: parte[2] }
}

function buildFecha(dia, mes, anio) {
  if (!dia || !mes || !anio || anio.length < 4) return null
  return `${anio}-${mes.padStart(2,'0')}-${dia.padStart(2,'0')}`
}

export default function Alumnos() {
  const [alumnos, setAlumnos] = useState([])
  const [alumnosFiltrados, setAlumnosFiltrados] = useState([])
  const [centros, setCentros] = useState([])
  const [cursos, setCursos] = useState([])
  const [docentes, setDocentes] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const [fecha, setFecha] = useState({ dia: '', mes: '', anio: '' })
  const [docenteSeleccionado, setDocenteSeleccionado] = useState('')
  const [alert, setAlert] = useState(null)

  const [filtroBusqueda, setFiltroBusqueda] = useState('')
  const [filtroCentro, setFiltroCentro] = useState('')
  const [filtroCurso, setFiltroCurso] = useState('')
  const [filtroActivo, setFiltroActivo] = useState('')
  const [filtroDocente, setFiltroDocente] = useState('')

  useEffect(() => { fetchAll() }, [])
  useEffect(() => { aplicarFiltros() }, [alumnos, filtroBusqueda, filtroCentro, filtroCurso, filtroActivo, filtroDocente])

  const aplicarFiltros = () => {
    let resultado = [...alumnos]
    if (filtroBusqueda) {
      const busq = filtroBusqueda.toLowerCase()
      resultado = resultado.filter(a =>
        a.nombre?.toLowerCase().includes(busq) ||
        a.apellido1?.toLowerCase().includes(busq) ||
        a.apellido2?.toLowerCase().includes(busq)
      )
    }
    if (filtroCentro) resultado = resultado.filter(a => a.centro_id === filtroCentro)
    if (filtroCurso) resultado = resultado.filter(a => a.curso_id === filtroCurso)
    if (filtroActivo !== '') resultado = resultado.filter(a => a.activo === (filtroActivo === 'true'))
    if (filtroDocente === 'sin_docente') resultado = resultado.filter(a => !a.docente_id)
    else if (filtroDocente) resultado = resultado.filter(a => a.docente_id === filtroDocente)
    setAlumnosFiltrados(resultado)
  }

  const limpiarFiltros = () => {
    setFiltroBusqueda('')
    setFiltroCentro('')
    setFiltroCurso('')
    setFiltroActivo('')
    setFiltroDocente('')
  }

  const fetchAll = async () => {
    setLoading(true)
    const [{ data: a, error: ea }, { data: c }, { data: cu }, { data: d }, { data: da }] = await Promise.all([
      supabase.from('alumnos').select('*').order('apellido1'),
      supabase.from('centros').select('id,nombre').order('nombre'),
      supabase.from('cursos_escolares').select('id,nombre').eq('activo', true),
      supabase.from('usuarios').select('id,nombre_completo,nombre,apellido1').eq('rol','docente').eq('activo',true).order('apellido1'),
      supabase.from('docente_alumno').select('alumno_id,docente_id')
    ])

    if (ea) setAlert({ type: 'error', message: 'Error al cargar alumnos: ' + ea.message })

    const centrosData = c || []
    const cursosData = cu || []
    const docenteAlumnoData = da || []

    const alumnosEnriquecidos = (a || []).map(alumno => {
      const relacion = docenteAlumnoData.find(x => x.alumno_id === alumno.id)
      return {
        ...alumno,
        centro_nombre: centrosData.find(x => x.id === alumno.centro_id)?.nombre || '-',
        curso_nombre: cursosData.find(x => x.id === alumno.curso_id)?.nombre || '-',
        docente_id: relacion?.docente_id || null
      }
    })

    const docentesData = (d || []).map(x => ({
      value: x.id,
      label: x.nombre_completo || `${x.nombre} ${x.apellido1}`
    }))

    setAlumnos(alumnosEnriquecidos)
    setCentros(centrosData.map(x => ({ value: x.id, label: x.nombre })))
    setCursos(cursosData.map(x => ({ value: x.id, label: x.nombre })))
    setDocentes(docentesData)
    setLoading(false)
  }

  const openNew = () => {
    setEditing(null)
    setForm({ activo: true })
    setFecha({ dia: '', mes: '', anio: '' })
    setDocenteSeleccionado('')
    setModal(true)
  }

  const openEdit = async (a) => {
    setEditing(a)
    setForm(a)
    setFecha(parseFecha(a.fecha_nacimiento))
    setDocenteSeleccionado(a.docente_id || '')
    setModal(true)
  }

  const handleSave = async () => {
    setLoading(true)
    const fecha_nacimiento = buildFecha(fecha.dia, fecha.mes, fecha.anio)
    const p = {
      nombre: form.nombre,
      apellido1: form.apellido1,
      apellido2: form.apellido2,
      fecha_nacimiento,
      centro_id: form.centro_id || null,
      curso_id: form.curso_id || null,
      activo: form.activo
    }

    let alumnoId = editing?.id
    let error

    if (editing) {
      const res = await supabase.from('alumnos').update(p).eq('id', editing.id)
      error = res.error
    } else {
      const res = await supabase.from('alumnos').insert(p).select().single()
      error = res.error
      alumnoId = res.data?.id
    }

    if (error) {
      setAlert({ type: 'error', message: error.message })
      setLoading(false)
      return
    }

    if (alumnoId) {
      await supabase.from('docente_alumno').delete().eq('alumno_id', alumnoId)
      if (docenteSeleccionado) {
        await supabase.from('docente_alumno').insert({ docente_id: docenteSeleccionado, alumno_id: alumnoId })
      }
    }

    setAlert({ type: 'success', message: editing ? 'Alumno actualizado' : 'Alumno creado' })
    setModal(false)
    fetchAll()
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este alumno?')) return
    const { error } = await supabase.from('alumnos').delete().eq('id', id)
    if (error) setAlert({ type: 'error', message: error.message })
    else { setAlert({ type: 'success', message: 'Alumno eliminado' }); fetchAll() }
  }

  const hayFiltrosActivos = filtroBusqueda || filtroCentro || filtroCurso || filtroActivo !== '' || filtroDocente

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Alumnos</h2>
          <Button onClick={openNew}><Plus size={16} /> Nuevo alumno</Button>
        </div>

        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} className="mb-4" />}

        {/* Filtros */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-48">
              <label className="block text-xs text-gray-500 mb-1">Buscar por nombre</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text" placeholder="Nombre o apellidos..."
                  value={filtroBusqueda}
                  onChange={e => setFiltroBusqueda(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
            <div className="min-w-44">
              <label className="block text-xs text-gray-500 mb-1">Curso</label>
              <select value={filtroCurso} onChange={e => setFiltroCurso(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Todos los cursos</option>
                {cursos.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="min-w-44">
              <label className="block text-xs text-gray-500 mb-1">Docente</label>
              <select value={filtroDocente} onChange={e => setFiltroDocente(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Todos los docentes</option>
                <option value="sin_docente">Sin docente asignado</option>
                {docentes.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
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
            {alumnosFiltrados.length} alumno{alumnosFiltrados.length !== 1 ? 's' : ''} encontrado{alumnosFiltrados.length !== 1 ? 's' : ''}
            {hayFiltrosActivos ? ` (de ${alumnos.length} total)` : ''}
          </p>
        </div>

        {/* Tabla */}
        {loading ? <p className="text-gray-500">Cargando...</p> : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left">Nombre</th>
                  <th className="px-4 py-3 text-left">Apellidos</th>
                  <th className="px-4 py-3 text-left">F. Nacimiento</th>
                  <th className="px-4 py-3 text-left">Centro</th>
                  <th className="px-4 py-3 text-left">Curso</th>
                  <th className="px-4 py-3 text-left">Docente</th>
                  <th className="px-4 py-3 text-left">Activo</th>
                  <th className="px-4 py-3 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {alumnosFiltrados.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{a.nombre}</td>
                    <td className="px-4 py-3">{a.apellido1} {a.apellido2}</td>
                    <td className="px-4 py-3">{a.fecha_nacimiento ? new Date(a.fecha_nacimiento).toLocaleDateString('es-ES') : '-'}</td>
                    <td className="px-4 py-3">{a.centro_nombre}</td>
                    <td className="px-4 py-3">{a.curso_nombre}</td>
                    <td className="px-4 py-3">{docentes.find(d => d.value === a.docente_id)?.label || '-'}</td>
                    <td className="px-4 py-3">{a.activo ? '✅' : '❌'}</td>
                    <td className="px-4 py-3 flex gap-2">
                      <Button variant="secondary" onClick={() => openEdit(a)}><Pencil size={14} /></Button>
                      <Button variant="danger" onClick={() => handleDelete(a.id)}><Trash2 size={14} /></Button>
                    </td>
                  </tr>
                ))}
                {alumnosFiltrados.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    {hayFiltrosActivos ? 'No hay alumnos con esos filtros' : 'Sin alumnos'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal */}
        <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar alumno' : 'Nuevo alumno'}>
          <Input label="Nombre" value={form.nombre || ''} onChange={e => setForm({ ...form, nombre: e.target.value })} />
          <Input label="Primer apellido" value={form.apellido1 || ''} onChange={e => setForm({ ...form, apellido1: e.target.value })} />
          <Input label="Segundo apellido" value={form.apellido2 || ''} onChange={e => setForm({ ...form, apellido2: e.target.value })} />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de nacimiento</label>
            <div className="flex gap-2">
              <div className="flex flex-col items-center">
                <input type="number" min="1" max="31" placeholder="DD" value={fecha.dia}
                  onChange={e => setFecha({ ...fecha, dia: e.target.value })}
                  className="w-16 border border-gray-300 rounded-lg px-2 py-2 text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <span className="text-xs text-gray-400 mt-1">Día</span>
              </div>
              <div className="flex flex-col items-center">
                <input type="number" min="1" max="12" placeholder="MM" value={fecha.mes}
                  onChange={e => setFecha({ ...fecha, mes: e.target.value })}
                  className="w-16 border border-gray-300 rounded-lg px-2 py-2 text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <span className="text-xs text-gray-400 mt-1">Mes</span>
              </div>
              <div className="flex flex-col items-center">
                <input type="number" min="1900" max="2099" placeholder="AAAA" value={fecha.anio}
                  onChange={e => setFecha({ ...fecha, anio: e.target.value })}
                  className="w-24 border border-gray-300 rounded-lg px-2 py-2 text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <span className="text-xs text-gray-400 mt-1">Año</span>
              </div>
            </div>
          </div>

          <Select label="Centro" options={[{ value: '', label: '-- Selecciona --' }, ...centros]} value={form.centro_id || ''} onChange={e => setForm({ ...form, centro_id: e.target.value })} />
          <Select label="Curso escolar" options={[{ value: '', label: '-- Selecciona --' }, ...cursos]} value={form.curso_id || ''} onChange={e => setForm({ ...form, curso_id: e.target.value })} />
          <Select label="Docente asignado" options={[{ value: '', label: '-- Sin asignar --' }, ...docentes]} value={docenteSeleccionado} onChange={e => setDocenteSeleccionado(e.target.value)} />

          <div className="flex items-center gap-2 mb-4">
            <input type="checkbox" id="activo" checked={!!form.activo} onChange={e => setForm({ ...form, activo: e.target.checked })} />
            <label htmlFor="activo" className="text-sm">Activo</label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={loading}>Guardar</Button>
          </div>
        </Modal>
      </div>
    </Layout>
  )
}
