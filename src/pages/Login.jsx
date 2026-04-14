import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [modo, setModo] = useState('login')
  const [recuperarEmail, setRecuperarEmail] = useState('')
  const [recuperarMsg, setRecuperarMsg] = useState('')
  const [recuperarError, setRecuperarError] = useState('')
  const [recuperarLoading, setRecuperarLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await signIn(email, password)
    if (error) setError(error.message)
    else navigate('/dashboard')
    setLoading(false)
  }

  const handleRecuperar = async (e) => {
    e.preventDefault()
    setRecuperarLoading(true)
    setRecuperarError('')
    setRecuperarMsg('')
    const { error } = await supabase.auth.resetPasswordForEmail(recuperarEmail, {
      redirectTo: window.location.origin + '/cambiar-contrasena'
    })
    if (error) setRecuperarError(error.message)
    else setRecuperarMsg('Si el email existe en el sistema, recibirás un enlace para restablecer tu contraseña.')
    setRecuperarLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center text-blue-600 mb-2">GECEHO</h1>
        <p className="text-center text-gray-500 text-sm mb-6">Gestión de Centros y Horarios</p>

        {modo === 'login' ? (
          <>
            {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg mb-4">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email o usuario</label>
                <input type="text" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
                {loading ? 'Entrando...' : 'Iniciar sesión'}
              </button>
            </form>
            <div className="mt-4 text-center">
              <button onClick={() => { setModo('recuperar'); setError('') }}
                className="text-sm text-blue-600 hover:underline">
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Recuperar contraseña</h2>
            {recuperarMsg && <div className="bg-green-50 text-green-700 text-sm px-4 py-2 rounded-lg mb-4">{recuperarMsg}</div>}
            {recuperarError && <div className="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg mb-4">{recuperarError}</div>}
            <form onSubmit={handleRecuperar} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email de tu cuenta</label>
                <input type="email" value={recuperarEmail} onChange={e => setRecuperarEmail(e.target.value)} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button type="submit" disabled={recuperarLoading}
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
                {recuperarLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
              </button>
            </form>
            <div className="mt-4 text-center">
              <button onClick={() => { setModo('login'); setRecuperarMsg(''); setRecuperarError('') }}
                className="text-sm text-blue-600 hover:underline">
                ← Volver al inicio de sesión
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}