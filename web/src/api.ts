import type { Session, Message, PermissionRequest, FileItem, Project, Provider, Agent, DiffFile } from './types'

export const getApiBase = (): string => {
  const urlParams = new URLSearchParams(window.location.search)
  const apiParam = urlParams.get('api')
  if (apiParam) return apiParam
  return window.location.port === '3000' ? 'http://127.0.0.1:52987' : window.location.origin
}

const API_BASE = getApiBase()

export const api = {
  // 1. Projects
  async getProjects(): Promise<Project[]> {
    const res = await fetch(`${API_BASE}/project`)
    if (!res.ok) throw new Error('Failed to fetch projects')
    return res.json()
  },

  async getCurrentProject(): Promise<Project> {
    const res = await fetch(`${API_BASE}/project/current`)
    if (!res.ok) throw new Error('Failed to fetch current project')
    return res.json()
  },

  // 2. Providers & Models
  async getConfigProviders(): Promise<{ providers: Provider[]; default?: Record<string, string> }> {
    const res = await fetch(`${API_BASE}/config/providers`)
    if (!res.ok) throw new Error('Failed to fetch config providers')
    return res.json()
  },

  // 3. Agents
  async getAgents(): Promise<Agent[]> {
    const res = await fetch(`${API_BASE}/agent`)
    if (!res.ok) throw new Error('Failed to fetch agents')
    return res.json()
  },

  // 4. Sessions
  async getSessions(directory?: string): Promise<Session[]> {
    const url = directory ? `${API_BASE}/session?directory=${encodeURIComponent(directory)}` : `${API_BASE}/session`
    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed to fetch sessions')
    return res.json()
  },

  async createSession(options?: { title?: string; directory?: string }): Promise<Session> {
    const res = await fetch(`${API_BASE}/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: options?.title || 'New Session'
      })
    })
    if (!res.ok) throw new Error('Failed to create session')
    return res.json()
  },

  async deleteSession(sessionId: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/session/${sessionId}`, {
      method: 'DELETE'
    })
    return res.ok
  },

  // 5. Messages
  async getMessages(sessionId: string): Promise<Message[]> {
    const res = await fetch(`${API_BASE}/session/${sessionId}/message`)
    if (!res.ok) throw new Error('Failed to fetch messages')
    return res.json()
  },

  async sendPrompt(sessionId: string, text: string, options?: { providerID?: string; modelID?: string; agent?: string }): Promise<any> {
    const payload: any = {
      parts: [
        {
          type: 'text',
          text
        }
      ]
    }
    if (options?.providerID && options?.modelID) {
      payload.model = {
        providerID: options.providerID,
        modelID: options.modelID
      }
    }
    if (options?.agent) {
      payload.agent = options.agent
    }

    const res = await fetch(`${API_BASE}/session/${sessionId}/prompt_async`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error('Failed to send prompt')
    return res.json()
  },

  async abortSession(sessionId: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/session/${sessionId}/abort`, {
      method: 'POST'
    })
    return res.ok
  },

  // 6. Diff
  async getSessionDiff(sessionId: string): Promise<DiffFile[]> {
    try {
      const res = await fetch(`${API_BASE}/session/${sessionId}/diff`)
      if (!res.ok) return []
      return res.json()
    } catch {
      return []
    }
  },

  // 7. Permissions / Approvals
  async getPermissions(): Promise<PermissionRequest[]> {
    try {
      const res = await fetch(`${API_BASE}/permission`)
      if (!res.ok) return []
      return res.json()
    } catch {
      return []
    }
  },

  async replyPermission(requestId: string, reply: 'once' | 'always' | 'reject'): Promise<boolean> {
    const res = await fetch(`${API_BASE}/permission/${requestId}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply })
    })
    return res.ok
  },

  // 8. File Explorer
  async listFiles(dirPath: string = '.'): Promise<FileItem[]> {
    try {
      const res = await fetch(`${API_BASE}/file?path=${encodeURIComponent(dirPath)}`)
      if (!res.ok) return []
      return res.json()
    } catch {
      return []
    }
  },

  async readFileContent(filePath: string): Promise<string> {
    const res = await fetch(`${API_BASE}/file/content?path=${encodeURIComponent(filePath)}`)
    if (!res.ok) throw new Error('Failed to read file')
    return res.text()
  },

  // 9. Global SSE Event Stream
  subscribeEvents(onEvent: (data: any) => void): () => void {
    const eventSource = new EventSource(`${API_BASE}/global/event`)
    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        onEvent(data)
      } catch (err) {
        console.error('SSE JSON error', err)
      }
    }
    eventSource.onerror = (err) => {
      console.warn('SSE EventSource disconnected, retrying...', err)
    }
    return () => {
      eventSource.close()
    }
  }
}
