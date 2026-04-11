import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
const AuthContext = createContext({})
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])
  const fetchProfile = async (uid) => {
    const { data } = await supabase.from('usuarios').select('*').eq('auth_id', uid).single()
    setProfile(data); setLoading(false)
  }
  const signIn = async (emailOrUser, password) => {
    let email = emailOrUser
    if (!emailOrUser.includes('@')) {
      const { data } = await supabase.from('usuarios').select('email').ilike('nombre_usuario', emailOrUser).single()
      if (data) email = data.email
    }
    return supabase.auth.signInWithPassword({ email, password })
  }
  const signOut = () => supabase.auth.signOut()
  const changePassword = (pw) => supabase.auth.updateUser({ password: pw })
  return <AuthContext.Provider value={{ user, profile, loading, signIn, signOut, changePassword }}>{children}</AuthContext.Provider>
}
export const useAuth = () => useContext(AuthContext)