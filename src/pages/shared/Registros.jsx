import { useState, useEffect } from 'react'
import { Layout } from '../../components/layout/Layout'
import { supabase } from '../../lib/supabaseClient'
export default function Registros() {
  const [registros,setRegistros]=useState([]);const [loading,setLoading]=useState(true)
  useEffect(()=>{fetchRegistros()},[])
  const fetchRegistros=async()=>{setLoading(true);const{data}=await supabase.from('registro_diario').select('*,usuarios(nombre_completo),alumnos(nombre,apellido1)').order('fecha',{ascending:false}).limit(100);setRegistros(data||[]);setLoading(false)}
  return(<Layout><div className="max-w-6xl mx-auto">
    <h2 className="text-2xl font-bold text-gray-800 mb-6">Registros Diarios</h2>
    {loading?<p>Cargando...</p>:(<div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50 text-gray-600"><tr><th className="px-4 py-3 text-left">Fecha</th><th className="px-4 py-3 text-left">Docente</th><th className="px-4 py-3 text-left">Alumno</th><th className="px-4 py-3 text-left">Asistencia</th><th className="px-4 py-3 text-left">Observaciones</th></tr></thead><tbody className="divide-y divide-gray-100">{registros.map(r=>(<tr key={r.id}><td className="px-4 py-3">{r.fecha}</td><td className="px-4 py-3">{r.usuarios?.nombre_completo||'-'}</td><td className="px-4 py-3">{r.alumnos?`${r.alumnos.nombre} ${r.alumnos.apellido1}`:'-'}</td><td className="px-4 py-3 capitalize">{r.asistencia}</td><td className="px-4 py-3 text-gray-500">{r.observaciones||'-'}</td></tr>))}{registros.length===0&&<tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Sin registros</td></tr>}</tbody></table></div>)}
  </div></Layout>)
}