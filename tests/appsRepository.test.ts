import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../src/lib/supabase', () => {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
  }
  return { supabase: { from: vi.fn(() => chain) } }
})

import { listMine } from '../src/services/appsRepository'

describe('appsRepository', () => {
  beforeEach(() => vi.clearAllMocks())

  it('listMine queries by owner_id', async () => {
    const { supabase } = await import('../src/lib/supabase')
    const chain = (supabase.from as any)('apps')
    chain.single = vi.fn()
    ;(supabase.from as any).mockReturnValue(chain)
    // simulate select returning data
    chain.order.mockImplementation(() => ({ data: [{ id: '1', owner_id: 'u', title: 't', prompt: '', html: '<html/>', is_public: false, forked_from: null, created_at: '' }], error: null }))
    const rows = await listMine('u')
    expect(rows).toHaveLength(1)
    expect(chain.eq).toHaveBeenCalledWith('owner_id', 'u')
  })
})
