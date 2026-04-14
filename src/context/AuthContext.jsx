import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [roles, setRoles] = useState([])
  const [activeRole, setActiveRoleState] = useState(null)
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
      else { setProfile(null); setRoles([]); setActiveRoleState(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (uid) => {
    const { data: profileData } = await supabase
      .from('usuarios')
      .select('*')
      .eq('auth_id', uid)
      .single()

    if (!profileData) { setLoading(false); return }

    const { data: rolesData } = await supabase
      .from('usuario_roles')
      .select('rol')
      .eq('usuario_id', profileData.id)

    const userRoles = rolesData ? rolesData.map(r => r.rol) : []

    setProfile(profileData)
    setRoles(userRoles)

    const savedRole = sessionStorage.getItem('activeRole')
    if (savedRole && userRoles.includes(savedRole)) {
      setActiveRoleState(savedRole)
    } else if (userRoles.length === 1) {
      setActiveRoleState(userRoles[0])
      sessionStorage.setItem('activeRole', userRoles[0])
    }

    setLoading(false)
  }

  const setActiveRole = (rol) => {
    setActiveRoleState(rol)
    sessionStorage.setItem('activeRole', rol)
  }

  const signIn = async (emailOrUser, password) => {
    let email = emailOrUser
    if (!emailOrUser.includes('@')) {
      const { data } = await supabase.from('usuarios').select('email').ilike('nombre_usuario', emailOrUser).single()
      if (data) email = data.email
    }
    return supabase.auth.signInWithPassword({ email, password })
  }

  const signOut = () => {
    sessionStorage.removeItem('activeRole')
    setActiveRoleState(null)
    setRoles([])
    return supabase.auth.signOut()
  }

  const changePassword = (pw) => supabase.auth.updateUser({ password: pw })

  return (
    <AuthContext.Provider value={{ user, profile, roles, activeRole, loading, signIn, signOut, changePassword, setActiveRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
