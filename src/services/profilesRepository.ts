import { supabase } from '../lib/supabase'
import type { Profile } from '../types'

export async function getProfile(uid: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).single()
  if (error) return null
  return data as Profile
}

export async function upsertProfile(uid: string, displayName: string): Promise<void> {
  const { error } = await supabase.from('profiles').upsert({ id: uid, display_name: displayName })
  if (error) throw error
}
