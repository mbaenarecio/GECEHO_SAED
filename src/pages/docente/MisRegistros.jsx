import { useState, useEffect } from 'react'
import { Layout } from '../../components/layout/Layout'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
export default function MisRegistros() {
  const { profile } = useAuth()
  const [registros,setRegistros]=useState([]);const [loading,setLoading]=useState(true)
  useEffect(()=>{if(profile)fetchRegistros()},[profile])
  const fetchRegistros=async()=>{setLoading(true);const{data}=await supabase.from('registro_diario').select('*,alumnos(nombre,apellido1)').eq('docente_id',profile.id).order('fecha',{ascending:false});setRegistros(data||[]);setLoading(false)}
  return(<Layout><div className="max-w-4xl mx-auto">
    <h2 className="text-2xl font-bold text-gray-800 mb-6">Mis Registros</h2>
    {loading?<p>Cargando...</p>:(<div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full text-sm"><thead className="bg-gray-50 text-gray-600"><tr><th className="px-4 py-3 text-left">Fecha</th><th className="px-4 py-3 text-left">Alumno</th><th className="px-4 py-3 text-left">Asistencia</th><th className="px-4 py-3 text-left">Observaciones</th></tr></thead>
      <tbody className="divide-y divide-gray-100">{registros.map(r=>(<tr key={r.id}><td className="px-4 py-3">{r.fecha}</td><td className="px-4 py-3">{r.alumnos?`${r.alumnos.apellido1}, ${r.alumnos.nombre}`:'-'}</td><td className="px-4 py-3 capitalize">{r.asistencia}</td><td className="px-4 py-3 text-gray-500">{r.observaciones||'-'}</td></tr>))}{registros.length===0&&<tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Sin registros</td></tr>}</tbody></table>
    </div>)}
  </div></Layout>)
}