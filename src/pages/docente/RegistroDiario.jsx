import { useState, useEffect } from 'react'
import { Layout } from '../../components/layout/Layout'
import { Button } from '../../components/common/Button'
import { Select } from '../../components/common/Select'
import { Alert } from '../../components/common/Alert'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
const asistenciaOpts=[{value:'presente',label:'Presente'},{value:'ausente',label:'Ausente'},{value:'justificado',label:'Justificado'}]
export default function RegistroDiario() {
  const { profile } = useAuth()
  const [alumnos,setAlumnos]=useState([]);const [registros,setRegistros]=useState({});const [loading,setLoading]=useState(true);const [saving,setSaving]=useState(false);const [alert,setAlert]=useState(null)
  const today=new Date().toISOString().split('T')[0]
  useEffect(()=>{if(profile)fetchAlumnos()},[profile])
  const fetchAlumnos=async()=>{setLoading(true);const{data}=await supabase.from('docente_alumno').select('alumnos(id,nombre,apellido1)').eq('docente_id',profile.id);const lista=(data||[]).map(d=>d.alumnos).filter(Boolean);setAlumnos(lista);const init={};lista.forEach(a=>{init[a.id]={asistencia:'presente',observaciones:''}});setRegistros(init);setLoading(false)}
  const handleSave=async()=>{setSaving(true);const rows=alumnos.map(a=>({docente_id:profile.id,alumno_id:a.id,fecha:today,asistencia:registros[a.id]?.asistencia||'presente',observaciones:registros[a.id]?.observaciones||''}));const{error}=await supabase.from('registro_diario').upsert(rows,{onConflict:'docente_id,alumno_id,fecha'});if(error)setAlert({type:'error',message:error.message});else setAlert({type:'success',message:'Registro guardado'});setSaving(false)}
  return(<Layout><div className="max-w-3xl mx-auto">
    <div className="flex items-center justify-between mb-6"><h2 className="text-2xl font-bold text-gray-800">Registro Diario</h2><span className="text-sm text-gray-500">{today}</span></div>
    {alert&&<Alert type={alert.type} message={alert.message} onClose={()=>setAlert(null)} className="mb-4"/>}
    {loading?<p>Cargando alumnos...</p>:(<>
      {alumnos.length===0&&<p className="text-gray-400 text-center py-8">No tienes alumnos asignados</p>}
      <div className="space-y-3">{alumnos.map(a=>(<div key={a.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <p className="font-medium text-gray-800 mb-3">{a.apellido1}, {a.nombre}</p>
        <div className="flex gap-4 items-start">
          <div className="w-48"><Select label="Asistencia" options={asistenciaOpts} value={registros[a.id]?.asistencia||'presente'} onChange={e=>setRegistros({...registros,[a.id]:{...registros[a.id],asistencia:e.target.value}})}/></div>
          <div className="flex-1"><label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label><textarea value={registros[a.id]?.observaciones||''} onChange={e=>setRegistros({...registros,[a.id]:{...registros[a.id],observaciones:e.target.value}})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" rows={2}/></div>
        </div>
      </div>))}</div>
      {alumnos.length>0&&<div className="mt-6 flex justify-end"><Button onClick={handleSave} disabled={saving}>{saving?'Guardando...':'Guardar registro'}</Button></div>}
    </>)}
  </div></Layout>)
}