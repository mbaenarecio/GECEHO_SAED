import { useState, useEffect } from 'react'
import { Layout } from '../../components/layout/Layout'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { Modal } from '../../components/common/Modal'
import { Alert } from '../../components/common/Alert'
import { supabase } from '../../lib/supabaseClient'
import { Plus, Pencil, Trash2 } from 'lucide-react'
export default function Centros() {
  const [centros,setCentros]=useState([]);const [loading,setLoading]=useState(true);const [modal,setModal]=useState(false);const [editing,setEditing]=useState(null);const [form,setForm]=useState({nombre:'',codigo:'',direccion:'',localidad:''});const [alert,setAlert]=useState(null)
  useEffect(()=>{fetchCentros()},[])
  const fetchCentros=async()=>{setLoading(true);const{data}=await supabase.from('centros').select('*').order('nombre');setCentros(data||[]);setLoading(false)}
  const openNew=()=>{setEditing(null);setForm({nombre:'',codigo:'',direccion:'',localidad:''});setModal(true)}
  const openEdit=(c)=>{setEditing(c);setForm(c);setModal(true)}
  const handleSave=async()=>{setLoading(true);const{error}=editing?await supabase.from('centros').update(form).eq('id',editing.id):await supabase.from('centros').insert(form);if(error)setAlert({type:'error',message:error.message});else setAlert({type:'success',message:editing?'Actualizado':'Creado'});setModal(false);fetchCentros()}
  const handleDelete=async(id)=>{if(!confirm('¿Eliminar?'))return;const{error}=await supabase.from('centros').delete().eq('id',id);if(error)setAlert({type:'error',message:error.message});else{setAlert({type:'success',message:'Eliminado'});fetchCentros()}}
  return(<Layout><div className="max-w-5xl mx-auto">
    <div className="flex items-center justify-between mb-6"><h2 className="text-2xl font-bold text-gray-800">Centros</h2><Button onClick={openNew}><Plus size={16}/>Nuevo centro</Button></div>
    {alert&&<Alert type={alert.type} message={alert.message} onClose={()=>setAlert(null)} className="mb-4"/>}
    {loading?<p>Cargando...</p>:(<div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"><table className="w-full text-sm"><thead className="bg-gray-50 text-gray-600"><tr><th className="px-4 py-3 text-left">Nombre</th><th className="px-4 py-3 text-left">Código</th><th className="px-4 py-3 text-left">Localidad</th><th className="px-4 py-3 text-left">Acciones</th></tr></thead><tbody className="divide-y divide-gray-100">{centros.map(c=>(<tr key={c.id}><td className="px-4 py-3 font-medium">{c.nombre}</td><td className="px-4 py-3">{c.codigo}</td><td className="px-4 py-3">{c.localidad}</td><td className="px-4 py-3 flex gap-2"><Button variant="secondary" onClick={()=>openEdit(c)}><Pencil size={14}/></Button><Button variant="danger" onClick={()=>handleDelete(c.id)}><Trash2 size={14}/></Button></td></tr>))}{centros.length===0&&<tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Sin centros</td></tr>}</tbody></table></div>)}
    <Modal open={modal} onClose={()=>setModal(false)} title={editing?'Editar centro':'Nuevo centro'}>
      <Input label="Nombre" value={form.nombre||''} onChange={e=>setForm({...form,nombre:e.target.value})}/><Input label="Código" value={form.codigo||''} onChange={e=>setForm({...form,codigo:e.target.value})}/><Input label="Dirección" value={form.direccion||''} onChange={e=>setForm({...form,direccion:e.target.value})}/><Input label="Localidad" value={form.localidad||''} onChange={e=>setForm({...form,localidad:e.target.value})}/>
      <div className="flex justify-end gap-2"><Button variant="secondary" onClick={()=>setModal(false)}>Cancelar</Button><Button onClick={handleSave} disabled={loading}>Guardar</Button></div>
    </Modal>
  </div></Layout>)
}