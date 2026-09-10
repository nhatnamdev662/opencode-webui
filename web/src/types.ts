export interface Project {
  id: string
  worktree: string
  vcs?: string
  name?: string
  icon?: {
    override?: string
    color?: string
  }
  time?: {
    created: number
    updated: number
  }
}

export interface ProviderModel {
  id: string
  name: string
  providerID: string
}

export interface Provider {
  id: string
  name: string
  models?: Record<string, { name: string }>
}

export interface Agent {
  name: string
  mode: 'primary' | 'subagent'
  description?: string
}

export interface Session {
  id: string
  slug: string
  projectID: string
  directory: string
  path: string
  title?: string
  time?: {
    created: number
    updated: number
  }
  summary?: {
    additions: number
    deletions: number
    files: number
  }
  tokens?: {
    input: number
    output: number
    reasoning?: number
  }
  cost?: number
}

export interface MessagePart {
  id?: string
  type: 'text' | 'tool' | 'step-start' | 'step-finish' | 'file' | 'subtask' | 'reasoning'
  text?: string
  tool?: string
  callID?: string
  input?: any
  output?: any
  status?: string
  time?: {
    start?: number
    end?: number
  }
}

export interface Message {
  info: {
    id: string
    sessionID: string
    role: 'user' | 'assistant' | 'system'
    time?: {
      created: number
    }
    modelID?: string
    providerID?: string
    agent?: string
    cost?: number
    tokens?: {
      input: number
      output: number
      reasoning?: number
    }
  }
  parts: MessagePart[]
}

export interface PermissionRequest {
  id: string
  sessionID: string
  type: string
  title?: string
  description?: string
  command?: string
  pattern?: string
  permission?: string
}

export interface FileItem {
  name: string
  path: string
  absolute: string
  type: 'file' | 'directory'
  ignored?: boolean
}

export interface DiffFile {
  path: string
  additions: number
  deletions: number
  patch?: string
}
