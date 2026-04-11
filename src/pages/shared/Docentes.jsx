import { useState, useEffect } from 'react'
import { Layout } from '../../components/layout/Layout'
import { Button } from '../../components/common/Button'
import { Select } from '../../components/common/Select'
import { Modal } from '../../components/common/Modal'
import { Alert } from '../../components/common/Alert'
import { supabase } from '../../lib/supabaseClient'
import { UserPlus } from 'lucide-react'
export default function Docentes() {
  const [docentes,setDocentes]=useState([]);const [alumnos,setAlumnos]=useState([]);const [loading,setLoading]=useState(true);const [modal,setModal]=useState(false);const [selectedDocente,setSelectedDocente]=useState(null);const [selectedAlumno,setSelectedAlumno]=useState('');const [alert,setAlert]=useState(null)
  useEffect(()=>{fetchAll()},[])
  const fetchAll=async()=>{setLoading(true);const[{data:d},{data:a}]=await Promise.all([supabase.from('usuarios').select('*,centros(nombre)').eq('rol','docente').order('nombre_completo'),supabase.from('alumnos').select('id,nombre,apellido1').eq('activo',true).order('apellido1')]);setDocentes(d||[]);setAlumnos((a||[]).map(x=>({value:x.id,label:`${x.apellido1}, ${x.nombre}`})));setLoading(false)}
  const openAsignar=(d)=>{setSelectedDocente(d);setSelectedAlumno('');setModal(true)}
  const handleAsignar=async()=>{if(!selectedAlumno)return;const{error}=await supabase.from('docente_alumno').insert({docente_id:selectedDocente.id,alumno_id:selectedAlumno});if(error)setAlert({type:'error',message:error.message});else{setAlert({type:'success',message:'Alumno asignado'});setModal(false)}}
  return(<Layout><div className="max-w-5xl mx-auto">
    <h2 className="text-2xl font-bold text-gray-800 mb-6">Docentes</h2>
    {alert&&<Alert type={alert.type} message={alert.message} onClose={()=>setAlert(null)} className="mb-4"/>}
    {loading?<p>Cargando...</p>:(<div className="space-y-3">{docentes.map(d=>(<div key={d.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between"><div><p className="font-medium text-gray-800">{d.nombre_completo}</p><p className="text-sm text-gray-500">{d.centros?.nombre||'Sin centro'}</p></div><Button onClick={()=>openAsignar(d)}><UserPlus size={14}/>Asignar alumno</Button></div>))}{docentes.length===0&&<p className="text-center text-gray-400 py-8">No hay docentes</p>}</div>)}
    <Modal open={modal} onClose={()=>setModal(false)} title={`Asignar alumno a ${selectedDocente?.nombre_completo}`}>
      <Select label="Alumno" value={selectedAlumno} onChange={e=>setSelectedAlumno(e.target.value)} options={alumnos}/>
      <div className="flex gap-2 pt-2"><Button onClick={handleAsignar}>Asignar</Button><Button variant="secondary" onClick={()=>setModal(false)}>Cancelar</Button></div>
    </Modal>
  </div></Layout>)
}