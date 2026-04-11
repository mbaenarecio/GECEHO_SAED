import { useState, useEffect } from 'react'
import { Layout } from '../../components/layout/Layout'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { Modal } from '../../components/common/Modal'
import { Alert } from '../../components/common/Alert'
import { supabase } from '../../lib/supabaseClient'
import { Plus, Pencil, Trash2 } from 'lucide-react'
export default function Cursos() {
  const [cursos,setCursos]=useState([]);const [loading,setLoading]=useState(true);const [modal,setModal]=useState(false);const [editing,setEditing]=useState(null);const [form,setForm]=useState({nombre:'',anio_inicio:'',anio_fin:'',activo:true});const [alert,setAlert]=useState(null)
  useEffect(()=>{fetchCursos()},[])
  const fetchCursos=async()=>{setLoading(true);const{data}=await supabase.from('cursos_escolares').select('*').order('anio_inicio',{ascending:false});setCursos(data||[]);setLoading(false)}
  const openNew=()=>{setEditing(null);setForm({nombre:'',anio_inicio:'',anio_fin:'',activo:true});setModal(true)}
  const openEdit=(c)=>{setEditing(c);setForm(c);setModal(true)}
  const handleSave=async()=>{setLoading(true);const{error}=editing?await supabase.from('cursos_escolares').update(form).eq('id',editing.id):await supabase.from('cursos_escolares').insert(form);if(error)setAlert({type:'error',message:error.message});else setAlert({type:'success',message:editing?'Actualizado':'Creado'});setModal(false);fetchCursos()}
  const handleDelete=async(id)=>{if(!confirm('¿Eliminar?'))return;const{error}=await supabase.from('cursos_escolares').delete().eq('id',id);if(error)setAlert({type:'error',message:error.message});else{setAlert({type:'success',message:'Eliminado'});fetchCursos()}}
  return(<Layout><div className="max-w-4xl mx-auto">
    <div className="flex items-center justify-between mb-6"><h2 className="text-2xl font-bold text-gray-800">Cursos Escolares</h2><Button onClick={openNew}><Plus size={16}/>Nuevo curso</Button></div>
    {alert&&<Alert type={alert.type} message={alert.message} onClose={()=>setAlert(null)} className="mb-4"/>}
    {loading?<p>Cargando...</p>:(<div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"><table className="w-full text-sm"><thead className="bg-gray-50 text-gray-600"><tr><th className="px-4 py-3 text-left">Nombre</th><th className="px-4 py-3 text-left">Inicio</th><th className="px-4 py-3 text-left">Fin</th><th className="px-4 py-3 text-left">Activo</th><th className="px-4 py-3 text-left">Acciones</th></tr></thead><tbody className="divide-y divide-gray-100">{cursos.map(c=>(<tr key={c.id}><td className="px-4 py-3 font-medium">{c.nombre}</td><td className="px-4 py-3">{c.anio_inicio}</td><td className="px-4 py-3">{c.anio_fin}</td><td className="px-4 py-3">{c.activo?'✅':'❌'}</td><td className="px-4 py-3 flex gap-2"><Button variant="secondary" onClick={()=>openEdit(c)}><Pencil size={14}/></Button><Button variant="danger" onClick={()=>handleDelete(c.id)}><Trash2 size={14}/></Button></td></tr>))}{cursos.length===0&&<tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Sin cursos</td></tr>}</tbody></table></div>)}
    <Modal open={modal} onClose={()=>setModal(false)} title={editing?'Editar curso':'Nuevo curso'}>
      <Input label="Nombre" value={form.nombre||''} onChange={e=>setForm({...form,nombre:e.target.value})}/><Input label="Año inicio" value={form.anio_inicio||''} onChange={e=>setForm({...form,anio_inicio:e.target.value})}/><Input label="Año fin" value={form.anio_fin||''} onChange={e=>setForm({...form,anio_fin:e.target.value})}/>
      <div className="flex items-center gap-2 mb-4"><input type="checkbox" id="activo" checked={!!form.activo} onChange={e=>setForm({...form,activo:e.target.checked})}/><label htmlFor="activo" className="text-sm">Activo</label></div>
      <div className="flex justify-end gap-2"><Button variant="secondary" onClick={()=>setModal(false)}>Cancelar</Button><Button onClick={handleSave} disabled={loading}>Guardar</Button></div>
    </Modal>
  </div></Layout>)
}