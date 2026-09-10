import React, { useState, useEffect, useRef } from 'react'
import {
  MessageSquare,
  Plus,
  Trash2,
  Send,
  Terminal,
  FolderTree,
  FileCode,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  RefreshCw,
  StopCircle
} from 'lucide-react'
import { api, getApiBase } from './api'
import type { Session, Message, PermissionRequest, FileItem } from './types'

export default function App() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputPrompt, setInputPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [permissions, setPermissions] = useState<PermissionRequest[]>([])
  const [files, setFiles] = useState<FileItem[]>([])
  const [selectedFileContent, setSelectedFileContent] = useState<string | null>(null)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'chat' | 'files' | 'tools'>('chat')
  const [serverUrl] = useState(getApiBase())

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 1. Load Sessions
  const refreshSessions = async () => {
    try {
      const data = await api.getSessions()
      setSessions(data)
      if (!currentSessionId && data.length > 0) {
        setCurrentSessionId(data[0].id)
      }
    } catch (e) {
      console.error(e)
    }
  }

  // 2. Load Messages for current session
  const refreshMessages = async (sessionId: string) => {
    try {
      const data = await api.getMessages(sessionId)
      setMessages(data)
    } catch (e) {
      console.error(e)
    }
  }

  // 3. Load Permissions / Approvals
  const refreshPermissions = async () => {
    try {
      const perms = await api.getPermissions()
      setPermissions(perms)
    } catch (e) {
      console.error(e)
    }
  }

  // 4. Load Files
  const refreshFiles = async () => {
    try {
      const list = await api.listFiles('.')
      setFiles(list)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    refreshSessions()
    refreshPermissions()
    refreshFiles()

    // Subscribe SSE Events
    const unsubscribe = api.subscribeEvents((_event) => {
      if (currentSessionId) {
        refreshMessages(currentSessionId)
      }
      refreshPermissions()
    })

    const interval = setInterval(() => {
      if (currentSessionId) {
        refreshMessages(currentSessionId)
      }
      refreshPermissions()
    }, 2500)

    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [currentSessionId])

  useEffect(() => {
    if (currentSessionId) {
      refreshMessages(currentSessionId)
    }
  }, [currentSessionId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handlers
  const handleCreateSession = async () => {
    try {
      const newSession = await api.createSession('Session ' + (sessions.length + 1))
      await refreshSessions()
      setCurrentSessionId(newSession.id)
    } catch (e) {
      alert('Không thể tạo session mới')
    }
  }

  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (confirm('Xóa session này?')) {
      await api.deleteSession(id)
      await refreshSessions()
      if (currentSessionId === id) {
        setCurrentSessionId(null)
        setMessages([])
      }
    }
  }

  const handleSendPrompt = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputPrompt.trim() || !currentSessionId || isLoading) return

    const promptText = inputPrompt
    setInputPrompt('')
    setIsLoading(true)

    try {
      await api.sendPrompt(currentSessionId, promptText)
      await refreshMessages(currentSessionId)
    } catch (err) {
      alert('Gửi prompt thất bại!')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAbort = async () => {
    if (!currentSessionId) return
    await api.abortSession(currentSessionId)
    setIsLoading(false)
  }

  const handlePermissionReply = async (requestId: string, reply: 'once' | 'always' | 'reject') => {
    await api.replyPermission(requestId, reply)
    await refreshPermissions()
  }

  const handleReadFile = async (file: FileItem) => {
    if (file.type === 'directory') return
    try {
      const content = await api.readFileContent(file.path)
      setSelectedFileContent(content)
      setSelectedFileName(file.name)
    } catch {
      setSelectedFileContent('// Không thể đọc nội dung file này')
      setSelectedFileName(file.name)
    }
  }

  const currentSession = sessions.find((s) => s.id === currentSessionId)

  return (
    <div className="flex h-screen w-screen bg-[#0d1117] text-[#c9d1d9] font-sans antialiased overflow-hidden select-none">
      {/* SIDEBAR */}
      <div className="w-72 bg-[#161b22] border-r border-[#30363d] flex flex-col justify-between">
        {/* Header Branding */}
        <div>
          <div className="p-4 border-b border-[#30363d] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold text-sm text-white tracking-wide">OpenCode WebUI</h1>
                <span className="text-[11px] text-gray-400">Custom Pro Dashboard</span>
              </div>
            </div>
            <button
              onClick={refreshSessions}
              className="p-1.5 hover:bg-[#21262d] rounded-md text-gray-400 hover:text-white transition-colors"
              title="Làm mới"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* New Chat Button */}
          <div className="p-3">
            <button
              onClick={handleCreateSession}
              className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Cuộc trò chuyện mới</span>
            </button>
          </div>

          {/* Session List */}
          <div className="px-2 py-1 overflow-y-auto max-h-[calc(100vh-230px)] space-y-1">
            <div className="px-2 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Lịch sử phiên ({sessions.length})
            </div>
            {sessions.map((s) => {
              const active = s.id === currentSessionId
              return (
                <div
                  key={s.id}
                  onClick={() => setCurrentSessionId(s.id)}
                  className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm transition-all ${
                    active
                      ? 'bg-[#21262d] text-white font-medium border border-blue-500/30'
                      : 'hover:bg-[#21262d]/60 text-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <MessageSquare className={`w-4 h-4 ${active ? 'text-blue-400' : 'text-gray-400'}`} />
                    <span className="truncate">{s.title || s.slug || 'Session'}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSession(e, s.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 rounded transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer Info */}
        <div className="p-3 border-t border-[#30363d] bg-[#0d1117]/50 text-xs text-gray-400 flex flex-col space-y-1">
          <div className="flex items-center justify-between">
            <span>Core Server:</span>
            <span className="font-mono text-[11px] text-green-400 truncate max-w-[130px]">{serverUrl}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Workspace:</span>
            <span className="font-mono text-[11px] text-blue-400 truncate max-w-[130px]">
              {currentSession?.directory || 'E:\\crack'}
            </span>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full bg-[#0d1117] overflow-hidden">
        {/* Top Navigation Bar */}
        <div className="h-14 border-b border-[#30363d] bg-[#161b22] px-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="font-semibold text-white">
              {currentSession?.title || currentSession?.slug || 'Chưa chọn phiên'}
            </span>
            {currentSession && (
              <span className="px-2 py-0.5 text-[11px] bg-blue-900/40 text-blue-300 border border-blue-700/50 rounded-full font-mono">
                {currentSession.id}
              </span>
            )}
          </div>

          {/* Tab buttons */}
          <div className="flex items-center space-x-1 bg-[#0d1117] p-1 rounded-lg border border-[#30363d]">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                activeTab === 'chat' ? 'bg-[#21262d] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Hội thoại</span>
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                activeTab === 'files' ? 'bg-[#21262d] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span>Tệp & Mã nguồn</span>
            </button>
            <button
              onClick={() => setActiveTab('tools')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition relative ${
                activeTab === 'tools' ? 'bg-[#21262d] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Phê duyệt lệnh</span>
              {permissions.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 bg-red-500 text-white rounded-full text-[10px] font-bold animate-pulse">
                  {permissions.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Pending Approvals Warning Banner */}
        {permissions.length > 0 && (
          <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-amber-300 text-xs">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>
                Có <b>{permissions.length}</b> yêu cầu thực thi lệnh/sửa file đang chờ bạn phê duyệt!
              </span>
            </div>
            <button
              onClick={() => setActiveTab('tools')}
              className="text-xs font-semibold underline text-amber-400 hover:text-amber-300"
            >
              Xem và duyệt ngay
            </button>
          </div>
        )}

        {/* TAB 1: CHAT */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col justify-between h-[calc(100vh-56px)] overflow-hidden">
            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500 space-y-3">
                  <div className="p-4 rounded-full bg-[#161b22] border border-[#30363d] text-blue-400">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-300">Bắt đầu phiên làm việc mới</h3>
                  <p className="max-w-md text-sm text-gray-400">
                    Nhập yêu cầu để OpenCode tự động phân tích code, chạy command, chỉnh sửa file hoặc phát triển tính năng.
                  </p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isUser = msg.info.role === 'user'
                  return (
                    <div
                      key={msg.info.id || i}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-4xl mx-auto w-full`}
                    >
                      <div className="flex items-center space-x-2 mb-1 px-1 text-xs text-gray-400">
                        <span className="font-semibold">{isUser ? 'Bạn' : 'OpenCode AI'}</span>
                        {msg.info.modelID && <span className="text-[10px] text-gray-500 font-mono">({msg.info.modelID})</span>}
                      </div>

                      <div
                        className={`rounded-xl p-4 max-w-3xl w-full select-text shadow-sm ${
                          isUser
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-[#161b22] border border-[#30363d] rounded-bl-none'
                        }`}
                      >
                        {msg.parts.map((part, pIdx) => {
                          if (part.type === 'text' && part.text) {
                            return (
                              <div key={pIdx} className="whitespace-pre-wrap leading-relaxed text-sm">
                                {part.text}
                              </div>
                            )
                          }
                          if (part.type === 'tool') {
                            return (
                              <div
                                key={pIdx}
                                className="my-2 p-3 bg-[#0d1117] rounded-lg border border-[#30363d] font-mono text-xs"
                              >
                                <div className="flex items-center space-x-2 text-cyan-400 mb-1">
                                  <Terminal className="w-3.5 h-3.5" />
                                  <span className="font-bold uppercase">Tool Call: {part.tool}</span>
                                </div>
                                {part.input && (
                                  <div className="text-gray-300 bg-[#161b22] p-2 rounded mb-1 overflow-x-auto">
                                    {typeof part.input === 'string' ? part.input : JSON.stringify(part.input, null, 2)}
                                  </div>
                                )}
                                {part.output && (
                                  <div className="text-emerald-400 bg-[#161b22] p-2 rounded overflow-x-auto">
                                    {typeof part.output === 'string' ? part.output : JSON.stringify(part.output, null, 2)}
                                  </div>
                                )}
                              </div>
                            )
                          }
                          return null
                        })}
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Box */}
            <div className="p-4 border-t border-[#30363d] bg-[#161b22]">
              <form onSubmit={handleSendPrompt} className="max-w-4xl mx-auto flex items-end space-x-2">
                <div className="flex-1 relative">
                  <textarea
                    value={inputPrompt}
                    onChange={(e) => setInputPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendPrompt(e)
                      }
                    }}
                    placeholder="Gõ tin nhắn cho OpenCode... (Nhấn Enter để gửi, Shift+Enter xuống dòng)"
                    className="w-full bg-[#0d1117] border border-[#30363d] focus:border-blue-500 rounded-xl py-3 px-4 text-sm text-white placeholder-gray-500 focus:outline-none resize-none min-h-[50px] max-h-[140px]"
                    rows={2}
                  />
                </div>

                {isLoading ? (
                  <button
                    type="button"
                    onClick={handleAbort}
                    className="p-3 bg-red-600 hover:bg-red-500 text-white rounded-xl transition shadow"
                    title="Dừng xử lý"
                  >
                    <StopCircle className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!inputPrompt.trim()}
                    className="p-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl transition shadow"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                )}
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: FILES EXPLORER */}
        {activeTab === 'files' && (
          <div className="flex-1 flex h-[calc(100vh-56px)]">
            <div className="w-80 border-r border-[#30363d] bg-[#161b22] p-3 overflow-y-auto">
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Thư mục dự án</span>
                <button onClick={refreshFiles} className="p-1 hover:text-white text-gray-400">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-1">
                {files.map((file, i) => (
                  <div
                    key={i}
                    onClick={() => handleReadFile(file)}
                    className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md text-xs cursor-pointer transition ${
                      selectedFileName === file.name ? 'bg-blue-600/30 text-blue-300' : 'hover:bg-[#21262d] text-gray-300'
                    }`}
                  >
                    {file.type === 'directory' ? (
                      <FolderTree className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    ) : (
                      <FileCode className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    )}
                    <span className="truncate">{file.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 flex flex-col bg-[#0d1117] overflow-hidden">
              <div className="h-10 border-b border-[#30363d] bg-[#161b22] px-4 flex items-center justify-between text-xs text-gray-400">
                <span>{selectedFileName || 'Chưa chọn file'}</span>
                {selectedFileName && <span className="text-[11px] text-gray-500 font-mono">Read-only mode</span>}
              </div>
              <div className="flex-1 overflow-auto p-4 font-mono text-xs select-text">
                {selectedFileContent ? (
                  <pre className="text-gray-200">{selectedFileContent}</pre>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    Chọn một file từ danh sách bên trái để xem nội dung
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TOOL APPROVALS */}
        {activeTab === 'tools' && (
          <div className="flex-1 p-6 overflow-y-auto max-w-4xl mx-auto w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <Terminal className="w-5 h-5 text-blue-400" />
                <span>Yêu cầu phê duyệt quyền (Permissions)</span>
              </h2>
              <button
                onClick={refreshPermissions}
                className="px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] rounded-lg text-xs flex items-center space-x-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Làm mới</span>
              </button>
            </div>

            {permissions.length === 0 ? (
              <div className="p-8 border border-[#30363d] rounded-xl text-center text-gray-400 bg-[#161b22]">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-medium">Hiện không có yêu cầu nào đang chờ phê duyệt!</p>
                <p className="text-xs text-gray-500 mt-1">
                  Khi AI muốn chạy bash command hoặc chỉnh sửa file, yêu cầu sẽ hiện tại đây.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {permissions.map((perm) => (
                  <div
                    key={perm.id}
                    className="p-4 bg-[#161b22] border border-amber-500/40 rounded-xl space-y-3 shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                        {perm.type || 'Permission Request'}
                      </span>
                      <span className="font-mono text-[11px] text-gray-500">{perm.id}</span>
                    </div>

                    <div className="bg-[#0d1117] p-3 rounded-lg border border-[#30363d] font-mono text-xs text-gray-200">
                      {perm.command || perm.description || perm.pattern || JSON.stringify(perm)}
                    </div>

                    <div className="flex items-center justify-end space-x-2 pt-2">
                      <button
                        onClick={() => handlePermissionReply(perm.id, 'reject')}
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/40 rounded-lg text-xs font-semibold transition"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Từ chối</span>
                      </button>
                      <button
                        onClick={() => handlePermissionReply(perm.id, 'once')}
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-500 rounded-lg text-xs font-semibold transition shadow"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Chấp thuận một lần</span>
                      </button>
                      <button
                        onClick={() => handlePermissionReply(perm.id, 'always')}
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-500 rounded-lg text-xs font-semibold transition shadow"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Luôn cho phép</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
