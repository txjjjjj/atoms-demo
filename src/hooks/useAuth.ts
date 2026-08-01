import { useEffect, useState, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { getProfile, upsertProfile } from '../services/profilesRepository'
import type { Profile } from '../types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user) {
        setUser(data.session.user)
        setProfile(await getProfile(data.session.user.id))
      }
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, session) => {
      setUser(session?.user ?? null)
      if (session?.user) setProfile(await getProfile(session.user.id))
      else setProfile(null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const signInAnon = useCallback(async () => {
    const { error } = await supabase.auth.signInAnonymously()
    if (error) throw error
  }, [])

  const setDisplayName = useCallback(async (name: string) => {
    if (!user) return
    await upsertProfile(user.id, name)
    setProfile({ id: user.id, display_name: name })
  }, [user])

  return { user, profile, loading, signInAnon, setDisplayName }
}
