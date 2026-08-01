import { supabase } from '../lib/supabase'
import type { AppRecord } from '../types'

export async function listMine(uid: string): Promise<AppRecord[]> {
  const { data, error } = await supabase.from('apps').select('*').eq('owner_id', uid).order('created_at', { ascending: false })
  if (error) throw error
  return data as AppRecord[]
}

export async function listPublic(): Promise<AppRecord[]> {
  const { data, error } = await supabase.from('apps').select('*').eq('is_public', true).order('created_at', { ascending: false })
  if (error) throw error
  return data as AppRecord[]
}

export async function getApp(id: string): Promise<AppRecord | null> {
  const { data, error } = await supabase.from('apps').select('*').eq('id', id).single()
  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data as AppRecord
}

export async function insertApp(app: Omit<AppRecord, 'id' | 'created_at'>): Promise<AppRecord> {
  const { data, error } = await supabase.from('apps').insert(app).select().single()
  if (error) throw error
  return data as AppRecord
}

export async function updateApp(id: string, patch: Partial<AppRecord>): Promise<void> {
  const { error } = await supabase.from('apps').update(patch).eq('id', id)
  if (error) throw error
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function forkApp(source: AppRecord, uid: string): Promise<AppRecord> {
  // Only real DB records have a uuid id we can reference via forked_from.
  // Demo apps (e.g. id "demo-timer") are not in the table, so FK would fail;
  // set forked_from to null for them.
  return insertApp({
    owner_id: uid,
    title: `${source.title} (Remix)`,
    prompt: source.prompt,
    html: source.html,
    is_public: false,
    forked_from: UUID_RE.test(source.id) ? source.id : null,
  })
}
