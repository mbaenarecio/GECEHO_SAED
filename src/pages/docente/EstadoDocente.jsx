import { useState, useEffect } from 'react'
import { Layout } from '../../components/layout/Layout'
import { Button } from '../../components/common/Button'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
export default function EstadoDocente() {
  const { profile } = useAuth()
  const [alumnos,setAlumnos]=useState([]);const [resumen,setResumen]=useState({});const [loading,setLoading]=useState(true)
  useEffect(()=>{if(profile)fetchEstado()},[profile])
  const fetchEstado=async()=>{setLoading(true);const{data:da}=await supabase.from('docente_alumno').select('alumnos(id,nombre,apellido1)').eq('docente_id',profile.id);const lista=(da||[]).map(d=>d.alumnos).filter(Boolean);setAlumnos(lista);if(lista.length>0){const ids=lista.map(a=>a.id);const{data:regs}=await supabase.from('registro_diario').select('alumno_id,asistencia').in('alumno_id',ids).eq('docente_id',profile.id);const res={};lista.forEach(a=>{res[a.id]={presente:0,ausente:0,justificado:0}});(regs||[]).forEach(r=>{if(res[r.alumno_id])res[r.alumno_id][r.asistencia]=(res[r.alumno_id][r.asistencia]||0)+1});setResumen(res)};setLoading(false)}
  const exportPDF=()=>{import('jspdf').then(({default:jsPDF})=>{import('jspdf-autotable').then(()=>{const doc=new jsPDF();doc.text(`Estado - ${profile?.nombre_completo}`,14,16);doc.autoTable({startY:24,head:[['Alumno','Presentes','Ausentes','Justificados']],body:alumnos.map(a=>[`${a.apellido1}, ${a.nombre}`,resumen[a.id]?.presente||0,resumen[a.id]?.ausente||0,resumen[a.id]?.justificado||0])});doc.save(`estado_${profile?.nombre_completo?.replace(/ /g,'_')}.pdf`)})})}
  return(<Layout><div className="max-w-4xl mx-auto">
    <div className="flex items-center justify-between mb-6"><h2 className="text-2xl font-bold text-gray-800">Mi Estado</h2><Button onClick={exportPDF}>Exportar PDF</Button></div>
    {loading?<p>Cargando...</p>:(<div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full text-sm"><thead className="bg-gray-50 text-gray-600"><tr><th className="px-4 py-3 text-left">Alumno</th><th className="px-4 py-3 text-center">Presentes</th><th className="px-4 py-3 text-center">Ausentes</th><th className="px-4 py-3 text-center">Justificados</th></tr></thead>
      <tbody className="divide-y divide-gray-100">{alumnos.map(a=>(<tr key={a.id}><td className="px-4 py-3 font-medium">{a.apellido1}, {a.nombre}</td><td className="px-4 py-3 text-center text-green-600">{resumen[a.id]?.presente||0}</td><td className="px-4 py-3 text-center text-red-600">{resumen[a.id]?.ausente||0}</td><td className="px-4 py-3 text-center text-yellow-600">{resumen[a.id]?.justificado||0}</td></tr>))}{alumnos.length===0&&<tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Sin alumnos asignados</td></tr>}</tbody></table>
    </div>)}
  </div></Layout>)
}