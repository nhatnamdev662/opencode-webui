import type { Session, Message, PermissionRequest, FileItem } from './types'

// Lấy API base URL từ query param hoặc fallback về window.location origin nếu cùng port
export const getApiBase = (): string => {
  const urlParams = new URLSearchParams(window.location.search)
  const apiParam = urlParams.get('api')
  if (apiParam) return apiParam
  // Default to localhost:52987 (hoặc qua proxy port 4096 / dynamic port)
  return window.location.port === '3000' ? 'http://127.0.0.1:52987' : window.location.origin
}

const API_BASE = getApiBase()

export const api = {
  // 1. Sessions
  async getSessions(): Promise<Session[]> {
    const res = await fetch(`${API_BASE}/session`)
    if (!res.ok) throw new Error('Failed to fetch sessions')
    return res.json()
  },

  async createSession(title?: string): Promise<Session> {
    const res = await fetch(`${API_BASE}/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title || 'New Chat' })
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

  // 2. Messages
  async getMessages(sessionId: string): Promise<Message[]> {
    const res = await fetch(`${API_BASE}/session/${sessionId}/message`)
    if (!res.ok) throw new Error('Failed to fetch messages')
    return res.json()
  },

  async sendPrompt(sessionId: string, text: string): Promise<any> {
    const res = await fetch(`${API_BASE}/session/${sessionId}/prompt_async`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parts: [
          {
            type: 'text',
            text
          }
        ]
      })
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

  // 3. Permissions / Approvals
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

  // 4. File Explorer
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

  // 5. Global SSE Event Stream
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
