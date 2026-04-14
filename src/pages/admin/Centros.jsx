import { useState, useEffect } from 'react'
import { Layout } from '../../components/layout/Layout'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { Modal } from '../../components/common/Modal'
import { Alert } from '../../components/common/Alert'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react'

const campoVacio = { nombre: '', codigo: '', dat: '', municipio: '', telefono: '', email_centro: '' }

export default function Centros() {
  const { activeRole } = useAuth()
  const [centros, setCentros] = useState([])
  const [centrosFiltrados, setCentrosFiltrados] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(campoVacio)
  const [alert, setAlert] = useState(null)
  const [filtroBusqueda, setFiltroBusqueda] = useState('')
  const [filtroDAT, setFiltroDAT] = useState('')

  const puedeEliminar = activeRole === 'admin'

  useEffect(() => { fetchCentros() }, [])
  useEffect(() => {
    let r = [...centros]
    if (filtroBusqueda) {
      const b = filtroBusqueda.toLowerCase()
      r = r.filter(c =>
        c.nombre?.toLowerCase().includes(b) ||
        c.codigo?.toLowerCase().includes(b) ||
        c.municipio?.toLowerCase().includes(b)
      )
    }
    if (filtroDAT) r = r.filter(c => c.dat === filtroDAT)
    setCentrosFiltrados(r)
  }, [centros, filtroBusqueda, filtroDAT])

  const dats = [...new Set(centros.map(c => c.dat).filter(Boolean))].sort()

  const fetchCentros = async () => {
    setLoading(true)
    const { data } = await supabase.from('centros').select('*').order('nombre')
    setCentros(data || [])
    setLoading(false)
  }

  const openNew = () => { setEditing(null); setForm(campoVacio); setModal(true) }
  const openEdit = (c) => { setEditing(c); setForm(c); setModal(true) }

  const handleSave = async () => {
    if (!form.nombre || !form.codigo) {
      setAlert({ type: 'error', message: 'El nombre y el código son obligatorios' }); return
    }
    setLoading(true)
    const payload = {
      nombre: form.nombre,
      codigo: form.codigo,
      dat: form.dat,
      municipio: form.municipio,
      telefono: form.telefono,
      email_centro: form.email_centro,
    }
    const { error } = editing
      ? await supabase.from('centros').update(payload).eq('id', editing.id)
      : await supabase.from('centros').insert(payload)
    if (error) setAlert({ type: 'error', message: error.message })
    else setAlert({ type: 'success', message: editing ? 'Centro actualizado' : 'Centro creado' })
    setModal(false); fetchCentros()
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este centro?')) return
    const { error } = await supabase.from('centros').delete().eq('id', id)
    if (error) setAlert({ type: 'error', message: error.message })
    else { setAlert({ type: 'success', message: 'Centro eliminado' }); fetchCentros() }
  }

  const hayFiltros = filtroBusqueda || filtroDAT

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Centros</h2>
          <Button onClick={openNew}><Plus size={16} /> Nuevo centro</Button>
        </div>

        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} className="mb-4" />}

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-48">
              <label className="block text-xs text-gray-500 mb-1">Buscar</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                <input type="text" placeholder="Nombre, código o municipio..."
                  value={filtroBusqueda} onChange={e => setFiltroBusqueda(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="min-w-44">
              <label className="block text-xs text-gray-500 mb-1">DAT</label>
              <select value={filtroDAT} onChange={e => setFiltroDAT(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Todas las DAT</option>
                {dats.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            {hayFiltros && (
              <button onClick={() => { setFiltroBusqueda(''); setFiltroDAT('') }}
                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-red-500 border border-gray-300 rounded-lg hover:border-red-300 transition-colors">
                <X size={14} /> Limpiar
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {centrosFiltrados.length} centro{centrosFiltrados.length !== 1 ? 's' : ''} encontrado{centrosFiltrados.length !== 1 ? 's' : ''}
            {hayFiltros ? ` (de ${centros.length} total)` : ''}
          </p>
        </div>

        {loading ? <p className="text-gray-500">Cargando...</p> : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left">Código</th>
                  <th className="px-4 py-3 text-left">Centro</th>
                  <th className="px-4 py-3 text-left">DAT</th>
                  <th className="px-4 py-3 text-left">Municipio</th>
                  <th className="px-4 py-3 text-left">Teléfono</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {centrosFiltrados.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-gray-600">{c.codigo}</td>
                    <td className="px-4 py-3 font-medium">{c.nombre}</td>
                    <td className="px-4 py-3">{c.dat}</td>
                    <td className="px-4 py-3">{c.municipio}</td>
                    <td className="px-4 py-3">{c.telefono}</td>
                    <td className="px-4 py-3 text-blue-600">{c.email_centro}</td>
                    <td className="px-4 py-3 flex gap-2">
                      <Button variant="secondary" onClick={() => openEdit(c)}><Pencil size={14} /></Button>
                      {puedeEliminar && <Button variant="danger" onClick={() => handleDelete(c.id)}><Trash2 size={14} /></Button>}
                    </td>
                  </tr>
                ))}
                {centrosFiltrados.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Sin centros</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar centro' : 'Nuevo centro'}>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input label="Código *" value={form.codigo || ''} onChange={e => setForm({ ...form, codigo: e.target.value })} />
            </div>
            <div className="flex-2 w-full">
              <Input label="Centro *" value={form.nombre || ''} onChange={e => setForm({ ...form, nombre: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input label="DAT" value={form.dat || ''} onChange={e => setForm({ ...form, dat: e.target.value })} />
            </div>
            <div className="flex-1">
              <Input label="Municipio" value={form.municipio || ''} onChange={e => setForm({ ...form, municipio: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input label="Teléfono" value={form.telefono || ''} onChange={e => setForm({ ...form, telefono: e.target.value })} />
            </div>
            <div className="flex-1">
              <Input label="Email del centro" type="email" value={form.email_centro || ''} onChange={e => setForm({ ...form, email_centro: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={loading}>Guardar</Button>
          </div>
        </Modal>
      </div>
    </Layout>
  )
}