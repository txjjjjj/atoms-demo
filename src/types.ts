export interface AppRecord {
  id: string
  owner_id: string
  title: string
  prompt: string
  html: string
  is_public: boolean
  forked_from: string | null
  created_at: string
}

export interface Profile {
  id: string
  display_name: string
}

export type AgentStep = 'plan' | 'code' | 'review'

export interface AgentEvent {
  step: AgentStep
  delta: string          // streamed text chunk
}
export interface AgentResult {
  plan: string
  code: string
  review: string
  html: string           // final extracted HTML
}

export interface AgentCallbacks {
  onEvent: (e: AgentEvent) => void
}