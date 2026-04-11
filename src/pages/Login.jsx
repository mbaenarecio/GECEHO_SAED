import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
export default function Login() {
  const { signIn } = useAuth(); const navigate = useNavigate()
  const [email,setEmail]=useState(''); const [password,setPassword]=useState('')
  const [error,setError]=useState(''); const [loading,setLoading]=useState(false)
  const handleSubmit=async(e)=>{e.preventDefault();setLoading(true);setError('');const{error}=await signIn(email,password);if(error)setError(error.message);else navigate('/dashboard');setLoading(false)}
  return(
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center text-blue-600 mb-2">GECEHO</h1>
        <p className="text-center text-gray-500 text-sm mb-6">Gestión de Centros y Horarios</p>
        {error&&<div className="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Email o usuario</label><input type="text" value={email} onChange={e=>setEmail(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">{loading?'Entrando...':'Iniciar sesión'}</button>
        </form>
      </div>
    </div>
  )
}