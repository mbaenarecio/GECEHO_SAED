import { useState, useEffect } from 'react'
import { Layout } from '../../components/layout/Layout'
import { Button } from '../../components/common/Button'
import { Select } from '../../components/common/Select'
import { Modal } from '../../components/common/Modal'
import { Alert } from '../../components/common/Alert'
import { supabase } from '../../lib/supabaseClient'
import { Plus, Trash2 } from 'lucide-react'
export default function Asesores() {
  const [asignaciones,setAsignaciones]=useState([]);const [asesores,setAsesores]=useState([]);const [centros,setCentros]=useState([]);const [loading,setLoading]=useState(true);const [modal,setModal]=useState(false);const [form,setForm]=useState({asesor_id:'',centro_id:''});const [alert,setAlert]=useState(null)
  useEffect(()=>{fetchAll()},[])
  const fetchAll=async()=>{setLoading(true);const[{data:a},{data:as_},{data:c}]=await Promise.all([supabase.from('asesor_centros').select('*,usuarios(nombre_completo),centros(nombre)'),supabase.from('usuarios').select('id,nombre_completo').eq('rol','asesor'),supabase.from('centros').select('id,nombre').order('nombre')]);setAsignaciones(a||[]);setAsesores((as_||[]).map(x=>({value:x.id,label:x.nombre_completo})));setCentros((c||[]).map(x=>({value:x.id,label:x.nombre})));setLoading(false)}
  const handleSave=async()=>{const{error}=await supabase.from('asesor_centros').insert(form);if(error)setAlert({type:'error',message:error.message});else{setAlert({type:'success',message:'Creado'});setModal(false);fetchAll()}}
  const handleDelete=async(id)=>{if(!confirm('¿Eliminar?'))return;const{error}=await supabase.from('asesor_centros').delete().eq('id',id);if(error)setAlert({type:'error',message:error.message});else{setAlert({type:'success',message:'Eliminado'});fetchAll()}}
  return(<Layout><div className="max-w-4xl mx-auto">
    <div className="flex items-center justify-between mb-6"><h2 className="text-2xl font-bold text-gray-800">Asesores por Centro</h2><Button onClick={()=>setModal(true)}><Plus size={16}/>Nueva asignación</Button></div>
    {alert&&<Alert type={alert.type} message={alert.message} onClose={()=>setAlert(null)} className="mb-4"/>}
    {loading?<p>Cargando...</p>:(<div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"><table className="w-full text-sm"><thead className="bg-gray-50 text-gray-600"><tr><th className="px-4 py-3 text-left">Asesor</th><th className="px-4 py-3 text-left">Centro</th><th className="px-4 py-3 text-left">Acciones</th></tr></thead><tbody className="divide-y divide-gray-100">{asignaciones.map(a=>(<tr key={a.id}><td className="px-4 py-3">{a.usuarios?.nombre_completo}</td><td className="px-4 py-3">{a.centros?.nombre}</td><td className="px-4 py-3"><Button variant="danger" onClick={()=>handleDelete(a.id)}><Trash2 size={14}/></Button></td></tr>))}{asignaciones.length===0&&<tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">Sin asignaciones</td></tr>}</tbody></table></div>)}
    <Modal open={modal} onClose={()=>setModal(false)} title="Nueva asignación">
      <Select label="Asesor" options={asesores} value={form.asesor_id} onChange={e=>setForm({...form,asesor_id:e.target.value})}/><Select label="Centro" options={centros} value={form.centro_id} onChange={e=>setForm({...form,centro_id:e.target.value})}/>
      <div className="flex justify-end gap-2"><Button variant="secondary" onClick={()=>setModal(false)}>Cancelar</Button><Button onClick={handleSave}>Guardar</Button></div>
    </Modal>
  </div></Layout>)
}