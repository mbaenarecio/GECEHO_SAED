import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
export default function CambiarContrasena() {
  const { changePassword } = useAuth(); const navigate = useNavigate()
  const [password,setPassword]=useState(''); const [confirm,setConfirm]=useState('')
  const [msg,setMsg]=useState(''); const [error,setError]=useState('')
  const handleSubmit=async(e)=>{e.preventDefault();if(password!==confirm)return setError('Las contraseñas no coinciden');const{error}=await changePassword(password);if(error)setError(error.message);else{setMsg('Contraseña actualizada');setTimeout(()=>navigate('/dashboard'),1500)}}
  return(
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <h2 className="text-xl font-bold mb-6">Cambiar contraseña</h2>
        {error&&<div className="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg mb-4">{error}</div>}
        {msg&&<div className="bg-green-50 text-green-700 text-sm px-4 py-2 rounded-lg mb-4">{msg}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="password" placeholder="Nueva contraseña" value={password} onChange={e=>setPassword(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"/>
          <input type="password" placeholder="Confirmar contraseña" value={confirm} onChange={e=>setConfirm(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"/>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700">Guardar</button>
        </form>
      </div>
    </div>
  )
}