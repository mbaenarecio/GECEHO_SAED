import { useState, useEffect } from 'react'
import { Layout } from '../../components/layout/Layout'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { Select } from '../../components/common/Select'
import { Modal } from '../../components/common/Modal'
import { Alert } from '../../components/common/Alert'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react'

const OPCIONES_CURSO = ['1º', '2º', '3º', '4º', '5º', '6º']
const OPCIONES_ETAPA = ['Infantil', 'Primaria', 'Secundaria', 'Bachillerato', 'FP Grado Básico', 'FP Grado Medio', 'Otros']
const DIAS = ['L', 'M', 'X', 'J', 'V']
const DIAS_LABEL = { L: 'Lunes', M: 'Martes', X: 'Miércoles', J: 'Jueves', V: 'Viernes' }

function parseFecha(fechaISO) {
  if (!fechaISO) return { dia: '', mes: '', anio: '' }
  const parte = fechaISO.split('T')[0].split('-')
  return { anio: parte[0], mes: parte[1], dia: parte[2] }
}
function buildFecha(dia, mes, anio) {
  if (!dia || !mes || !anio || anio.length < 4) return null
  return `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`
}

function horarioVacio() {
  const h = {}
  DIAS.forEach(d => { h[d] = { activo: false, inicio: '', fin: '' } })
  return h
}

export default function Alumnos() {
  const { profile, activeRole } = useAuth()

  const [alumnos, setAlumnos] = useState([])
  const [alumnosFiltrados, setAlumnosFiltrados] = useState([])
  const [centros, setCentros] = useState([])
  const [todosDocentes, setTodosDocentes] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const [fecha, setFecha] = useState({ dia: '', mes: '', anio: '' })
  const [etapaOtrosDesc, setEtapaOtrosDesc] = useState('')
  const [alert, setAlert] = useState(null)

  const [docente1, setDocente1] = useState('')
  const [horario1, setHorario1] = useState(horarioVacio())
  const [docente2, setDocente2] = useState('')
  const [horario2, setHorario2] = useState(horarioVacio())

  const [filtroBusqueda, setFiltroBusqueda] = useState('')
  const [filtroCentro, setFiltroCentro] = useState('')
  const [filtroEtapa, setFiltroEtapa] = useState('')
  const [filtroActivo, setFiltroActivo] = useState('')

  const puedeCrear = ['admin', 'gestor', 'coordinador', 'asesor', 'docente'].includes(activeRole)
  const puedeEditar = ['admin', 'gestor', 'coordinador', 'asesor'].includes(activeRole)
  const puedeEliminar = ['admin', 'gestor'].includes(activeRole)

  useEffect(() => { fetchAll() }, [])
  useEffect(() => { aplicarFiltros() }, [alumnos, filtroBusqueda, filtroCentro, filtroEtapa, filtroActivo])

  const aplicarFiltros = () => {
    let r = [...alumnos]
    if (filtroBusqueda) {
      const b = filtroBusqueda.toLowerCase()
      r = r.filter(a =>
        a.nombre?.toLowerCase().includes(b) ||
        a.apellido1?.toLowerCase().includes(b) ||
        a.apellido2?.toLowerCase().includes(b) ||
        a.alias?.toLowerCase().includes(b)
      )
    }
    if (filtroCentro) r = r.filter(a => a.centro_alumno_id === filtroCentro)
    if (filtroEtapa) r = r.filter(a => a.etapa === filtroEtapa)
    if (filtroActivo !== '') r = r.filter(a => a.activo === (filtroActivo === 'true'))
    setAlumnosFiltrados(r)
  }

  const limpiarFiltros = () => {
    setFiltroBusqueda(''); setFiltroCentro(''); setFiltroEtapa(''); setFiltroActivo('')
  }

  const fetchAll = async () => {
    setLoading(true)
    const [{ data: a }, { data: c }, { data: u }, { data: ur }, { data: da }, { data: ah }] = await Promise.all([
      supabase.from('alumnos').select('*').order('apellido1'),
      supabase.from('centros').select('id,nombre').order('nombre'),
      supabase.from('usuarios').select('id,nombre_completo,nombre,apellido1,centro_id').eq('activo', true).order('apellido1'),
      supabase.from('usuario_roles').select('usuario_id,rol').eq('rol', 'docente'),
      supabase.from('docente_alumno').select('alumno_id,docente_id'),
      supabase.from('alumno_horario').select('*')
    ])
    const centrosData = c || []
    const daData = da || []
    const ahData = ah || []
    const docenteIds = (ur || []).map(r => r.usuario_id)
    const docentesData = (u || []).filter(x => docenteIds.includes(x.id))

    const alumnosEnriquecidos = (a || []).map(alumno => {
      const rels = daData.filter(x => x.alumno_id === alumno.id)
      const docentes = rels.map(r => {
        const doc = docentesData.find(d => d.id === r.docente_id)
        return doc ? { id: doc.id, nombre: doc.nombre_completo || `${doc.nombre} ${doc.apellido1}` } : null
      }).filter(Boolean)
      return {
        ...alumno,
        centro_alumno_nombre: centrosData.find(x => x.id === alumno.centro_alumno_id)?.nombre || '-',
        docentes,
        horarios: ahData.filter(h => h.alumno_id === alumno.id)
      }
    })
    setAlumnos(alumnosEnriquecidos)
    setCentros(centrosData.map(x => ({ value: x.id, label: x.nombre })))
    setTodosDocentes(docentesData)
    setLoading(false)
  }

  const docentesDelCentro = (centroId) => {
    if (!centroId) return todosDocentes
    return todosDocentes.filter(d => d.centro_id === centroId)
  }

  const docentesDisponibles1 = docentesDelCentro(form.centro_alumno_id)
    .filter(d => d.id !== docente2)
    .map(d => ({ value: d.id, label: d.nombre_completo || `${d.nombre} ${d.apellido1}` }))

  const docentesDisponibles2 = docentesDelCentro(form.centro_alumno_id)
    .filter(d => d.id !== docente1)
    .map(d => ({ value: d.id, label: d.nombre_completo || `${d.nombre} ${d.apellido1}` }))

  const horarioDesdeDB = (ahData, docenteId, alumnoId) => {
    const h = horarioVacio()
    ahData.filter(x => x.alumno_id === alumnoId && x.docente_id === docenteId).forEach(x => {
      h[x.dia_semana] = { activo: true, inicio: x.hora_inicio?.slice(0, 5) || '', fin: x.hora_fin?.slice(0, 5) || '' }
    })
    return h
  }

  const openNew = () => {
    setEditing(null)
    const centroFijo = (activeRole === 'docente' || activeRole === 'coordinador') ? profile?.centro_id : null
    setForm({ activo: true, centro_alumno_id: centroFijo })
    setFecha({ dia: '', mes: '', anio: '' })
    setEtapaOtrosDesc('')
    const docenteFijo = activeRole === 'docente' ? profile?.id : ''
    setDocente1(docenteFijo)
    setHorario1(horarioVacio())
    setDocente2('')
    setHorario2(horarioVacio())
    setModal(true)
  }

  const openEdit = async (a) => {
    setEditing(a)
    setForm(a)
    setFecha(parseFecha(a.fecha_nacimiento))
    setEtapaOtrosDesc(a.etapa_otros_desc || '')
    const { data: ahData } = await supabase.from('alumno_horario').select('*').eq('alumno_id', a.id)
    const { data: daData } = await supabase.from('docente_alumno').select('*').eq('alumno_id', a.id)
    const d1 = daData?.[0]?.docente_id || ''
    const d2 = daData?.[1]?.docente_id || ''
    setDocente1(d1)
    setDocente2(d2)
    setHorario1(d1 ? horarioDesdeDB(ahData || [], d1, a.id) : horarioVacio())
    setHorario2(d2 ? horarioDesdeDB(ahData || [], d2, a.id) : horarioVacio())
    setModal(true)
  }

  const toggleDia = (setHorario, dia) => {
    setHorario(prev => ({
      ...prev,
      [dia]: { ...prev[dia], activo: !prev[dia].activo, inicio: '', fin: '' }
    }))
  }

  const setHoraField = (setHorario, dia, field, val) => {
    setHorario(prev => ({ ...prev, [dia]: { ...prev[dia], [field]: val } }))
  }

  const handleCentroChange = (centroId) => {
    setForm(prev => ({ ...prev, centro_alumno_id: centroId }))
    setDocente1(''); setDocente2('')
    setHorario1(horarioVacio()); setHorario2(horarioVacio())
  }

  const guardarHorarios = async (alumnoId, docenteId, horario) => {
    if (!docenteId) return
    await supabase.from('alumno_horario').delete()
      .eq('alumno_id', alumnoId).eq('docente_id', docenteId)
    const inserts = DIAS
      .filter(d => horario[d].activo && horario[d].inicio && horario[d].fin)
      .map(d => ({
        alumno_id: alumnoId,
        docente_id: docenteId,
        dia_semana: d,
        hora_inicio: horario[d].inicio,
        hora_fin: horario[d].fin
      }))
    if (inserts.length > 0) await supabase.from('alumno_horario').insert(inserts)
  }

  const handleSave = async () => {
    setLoading(true)
    const fecha_nacimiento = buildFecha(fecha.dia, fecha.mes, fecha.anio)
    const p = {
      nombre: form.nombre,
      apellido1: form.apellido1,
      apellido2: form.apellido2,
      alias: form.alias || null,
      fecha_nacimiento,
      centro_alumno_id: form.centro_alumno_id || null,
      curso: form.curso || null,
      etapa: form.etapa || null,
      etapa_otros_desc: form.etapa === 'Otros' ? etapaOtrosDesc : null,
      centro_escolar: form.centro_escolar || null,
      activo: form.activo
    }
    let alumnoId = editing?.id
    let error
    if (editing) {
      const res = await supabase.from('alumnos').update(p).eq('id', editing.id)
      error = res.error
    } else {
      const res = await supabase.from('alumnos').insert(p).select().single()
      error = res.error; alumnoId = res.data?.id
    }
    if (error) { setAlert({ type: 'error', message: error.message }); setLoading(false); return }

    await supabase.from('docente_alumno').delete().eq('alumno_id', alumnoId)
    if (docente1) await supabase.from('docente_alumno').insert({ docente_id: docente1, alumno_id: alumnoId })
    if (docente2) await supabase.from('docente_alumno').insert({ docente_id: docente2, alumno_id: alumnoId })

    await guardarHorarios(alumnoId, docente1, horario1)
    await guardarHorarios(alumnoId, docente2, horario2)

    setAlert({ type: 'success', message: editing ? 'Alumno actualizado' : 'Alumno creado' })
    setModal(false); fetchAll()
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este alumno?')) return
    const { error } = await supabase.from('alumnos').delete().eq('id', id)
    if (error) setAlert({ type: 'error', message: error.message })
    else { setAlert({ type: 'success', message: 'Alumno eliminado' }); fetchAll() }
  }

  const hayFiltros = filtroBusqueda || filtroCentro || filtroEtapa || filtroActivo !== ''
  const centrosDisponibles = activeRole === 'docente' || activeRole === 'coordinador'
    ? centros.filter(c => c.value === profile?.centro_id)
    : centros

  const HorarioDocente = ({ horario, setHorario, docenteId }) => {
    if (!docenteId) return null
    return (
      <div className="mt-2 border border-gray-200 rounded-lg p-3 bg-gray-50">
        <p className="text-xs font-medium text-gray-600 mb-2">Días de atención:</p>
        <div className="space-y-2">
          {DIAS.map(dia => (
            <div key={dia} className="flex items-center gap-3">
              <button type="button"
                onClick={() => toggleDia(setHorario, dia)}
                className={`w-8 h-8 rounded-full text-xs font-bold border transition-colors ${
                  horario[dia].activo
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-400 border-gray-300 hover:border-gray-400'
                }`}>
                {dia}
              </button>
              {horario[dia].activo && (
                <div className="flex items-center gap-2">
                  <input type="time" value={horario[dia].inicio}
                    onChange={e => setHoraField(setHorario, dia, 'inicio', e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <span className="text-gray-400 text-sm">→</span>
                  <input type="time" value={horario[dia].fin}
                    onChange={e => setHoraField(setHorario, dia, 'fin', e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <span className="text-xs text-gray-400">{DIAS_LABEL[dia]}</span>
                </div>
              )}
              {!horario[dia].activo && (
                <span className="text-xs text-gray-300">{DIAS_LABEL[dia]}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Alumnos</h2>
          {puedeCrear && <Button onClick={openNew}><Plus size={16} /> Nuevo alumno</Button>}
        </div>

        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} className="mb-4" />}

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-48">
              <label className="block text-xs text-gray-500 mb-1">Buscar por nombre o alias</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                <input type="text" placeholder="Nombre, apellidos o alias..."
                  value={filtroBusqueda} onChange={e => setFiltroBusqueda(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="min-w-44">
              <label className="block text-xs text-gray-500 mb-1">Centro hospitalario</label>
              <select value={filtroCentro} onChange={e => setFiltroCentro(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Todos los centros</option>
                {centros.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="min-w-40">
              <label className="block text-xs text-gray-500 mb-1">Etapa</label>
              <select value={filtroEtapa} onChange={e => setFiltroEtapa(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Todas las etapas</option>
                {OPCIONES_ETAPA.map(e => <option key={e} value={e}>{e}</option>)}
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
            {alumnosFiltrados.length} alumno{alumnosFiltrados.length !== 1 ? 's' : ''} encontrado{alumnosFiltrados.length !== 1 ? 's' : ''}
            {hayFiltros ? ` (de ${alumnos.length} total)` : ''}
          </p>
        </div>

        {loading ? <p className="text-gray-500">Cargando...</p> : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left">Nombre</th>
                  <th className="px-4 py-3 text-left">Apellidos</th>
                  <th className="px-4 py-3 text-left">Alias</th>
                  <th className="px-4 py-3 text-left">F. Nacimiento</th>
                  <th className="px-4 py-3 text-left">Centro hospitalario</th>
                  <th className="px-4 py-3 text-left">Centro escolar</th>
                  <th className="px-4 py-3 text-left">Curso</th>
                  <th className="px-4 py-3 text-left">Etapa</th>
                  <th className="px-4 py-3 text-left">Docentes</th>
                  <th className="px-4 py-3 text-left">Activo</th>
                  <th className="px-4 py-3 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {alumnosFiltrados.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{a.nombre}</td>
                    <td className="px-4 py-3">{a.apellido1} {a.apellido2}</td>
                    <td className="px-4 py-3 text-gray-500">{a.alias || '-'}</td>
                    <td className="px-4 py-3">{a.fecha_nacimiento ? new Date(a.fecha_nacimiento).toLocaleDateString('es-ES') : '-'}</td>
                    <td className="px-4 py-3">{a.centro_alumno_nombre}</td>
                    <td className="px-4 py-3">{a.centro_escolar || '-'}</td>
                    <td className="px-4 py-3">{a.curso || '-'}</td>
                    <td className="px-4 py-3">
                      {a.etapa === 'Otros' && a.etapa_otros_desc ? `Otros: ${a.etapa_otros_desc}` : (a.etapa || '-')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        {(a.docentes || []).map(d => (
                          <span key={d.id} className="text-xs text-gray-600">{d.nombre}</span>
                        ))}
                        {(!a.docentes || a.docentes.length === 0) && <span className="text-gray-400 text-xs">-</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">{a.activo ? '✅' : '❌'}</td>
                    <td className="px-4 py-3 flex gap-2">
                      {puedeEditar && <Button variant="secondary" onClick={() => openEdit(a)}><Pencil size={14} /></Button>}
                      {puedeEliminar && <Button variant="danger" onClick={() => handleDelete(a.id)}><Trash2 size={14} /></Button>}
                    </td>
                  </tr>
                ))}
                {alumnosFiltrados.length === 0 && (
                  <tr><td colSpan={11} className="px-4 py-8 text-center text-gray-400">
                    {hayFiltros ? 'No hay alumnos con esos filtros' : 'Sin alumnos'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar alumno' : 'Nuevo alumno'}>
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

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de nacimiento</label>
            <div className="flex gap-2">
              {[['dia', 'DD', 1, 31], ['mes', 'MM', 1, 12], ['anio', 'AAAA', 1900, 2099]].map(([key, ph, min, max]) => (
                <div key={key} className="flex flex-col items-center">
                  <input type="number" min={min} max={max} placeholder={ph} value={fecha[key]}
                    onChange={e => setFecha({ ...fecha, [key]: e.target.value })}
                    className={`border border-gray-300 rounded-lg px-2 py-2 text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${key === 'anio' ? 'w-24' : 'w-16'}`} />
                  <span className="text-xs text-gray-400 mt-1">{key === 'anio' ? 'Año' : key.charAt(0).toUpperCase() + key.slice(1)}</span>
                </div>
              ))}
            </div>
          </div>

          {activeRole === 'docente' || activeRole === 'coordinador' ? (
            <p className="text-sm text-gray-500 mb-4">Centro hospitalario: <strong>{centros.find(c => c.value === form.centro_alumno_id)?.label || '-'}</strong></p>
          ) : (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Centro hospitalario</label>
              <select value={form.centro_alumno_id || ''} onChange={e => handleCentroChange(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">-- Selecciona --</option>
                {centrosDisponibles.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          )}

          <Input label="Centro escolar de procedencia" value={form.centro_escolar || ''}
            onChange={e => setForm({ ...form, centro_escolar: e.target.value })} />

          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Curso</label>
              <select value={form.curso || ''} onChange={e => setForm({ ...form, curso: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">-- Selecciona --</option>
                {OPCIONES_CURSO.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Etapa</label>
              <select value={form.etapa || ''} onChange={e => setForm({ ...form, etapa: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">-- Selecciona --</option>
                {OPCIONES_ETAPA.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>

          {form.etapa === 'Otros' && (
            <div className="mb-4">
              <Input label="Descripción de la etapa" value={etapaOtrosDesc}
                onChange={e => setEtapaOtrosDesc(e.target.value)} />
            </div>
          )}

          <div className="mb-4 border border-gray-200 rounded-lg p-3">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Docente 1</label>
            <select value={docente1} onChange={e => { setDocente1(e.target.value); setHorario1(horarioVacio()) }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2">
              <option value="">-- Sin asignar --</option>
              {docentesDisponibles1.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
            <HorarioDocente horario={horario1} setHorario={setHorario1} docenteId={docente1} />
          </div>

          <div className="mb-4 border border-gray-200 rounded-lg p-3">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Docente 2 (opcional)</label>
            <select value={docente2} onChange={e => { setDocente2(e.target.value); setHorario2(horarioVacio()) }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2">
              <option value="">-- Sin asignar --</option>
              {docentesDisponibles2.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
            <HorarioDocente horario={horario2} setHorario={setHorario2} docenteId={docente2} />
          </div>

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
