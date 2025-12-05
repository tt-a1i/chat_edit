import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useChatStore } from './chat'
import { db } from '@/services/database'

// Define mocks using vi.hoisted
const mockDb = vi.hoisted(() => {
  return {
    chats: {
      toArray: vi.fn(),
      add: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn(),
      get: vi.fn(),
    },
    messages: {
      where: vi.fn(),
      add: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn(),
    },
  }
})

vi.mock('@/services/database', () => ({
  db: mockDb,
}))

vi.mock('@/api/api', () => ({
  useApi: () => ({
    abort: vi.fn(),
  }),
}))

vi.mock('@/services/ai', () => ({
  useAI: () => ({
    generate: vi.fn(),
  }),
}))

vi.mock('@/config/env', () => ({
  getChatConfig: () => ({ model: 'test-model' }),
  env: { historyMessageLength: 10 },
}))

// Mock logger
vi.mock('@/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
  },
}))

// Mock toast
vi.mock('@/composables/useToast', () => ({
  showError: vi.fn(),
}))

describe('useChatStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // Default mocks behavior
    const mockChain = {
      equals: vi.fn().mockReturnValue({
        sortBy: vi.fn().mockResolvedValue([]),
        delete: vi.fn(),
        toArray: vi.fn(),
      }),
    }
    vi.mocked(db.messages.where).mockReturnValue(mockChain as any)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with default state', () => {
    const store = useChatStore()
    expect(store.currentChatId).toBeNull()
    expect(store.chats).toEqual([])
    expect(store.messages).toEqual([])
    expect(store.isLoading).toBe(false)
  })

  it('should load chats correctly', async () => {
    const store = useChatStore()
    const mockChats = [
      { id: 1, name: 'Chat 1', model: 'gpt-4', createdAt: new Date() },
      { id: 2, name: 'Chat 2', model: 'gpt-3.5', createdAt: new Date() },
    ]
    vi.mocked(db.chats.toArray).mockResolvedValue(mockChats)

    await store.loadChats()

    expect(store.chats).toEqual(mockChats)
    expect(store.isLoading).toBe(false)
  })

  it('should create a new chat', async () => {
    const store = useChatStore()
    const newChatId = 123
    vi.mocked(db.chats.add).mockResolvedValue(newChatId)
    vi.mocked(db.chats.toArray).mockResolvedValue([{ id: newChatId, name: 'New Chat', model: 'test-model' }])

    const resultId = await store.createChat('test-model')

    expect(db.chats.add).toHaveBeenCalledWith(expect.objectContaining({
      name: 'New Chat',
      model: 'test-model',
    }))
    expect(resultId).toBe(newChatId)
    expect(store.chats).toHaveLength(1)
  })

  it('should add a message', async () => {
    const store = useChatStore()
    const message = { chatId: 1, role: 'user', content: 'Hello' }
    vi.mocked(db.messages.add).mockResolvedValue(100)
    store.currentChatId = 1

    // Configure mock for this specific test
    const mockChain = {
      equals: vi.fn().mockReturnValue({
        sortBy: vi.fn().mockResolvedValue([
          { id: 100, ...message, createdAt: new Date() }
        ]),
        delete: vi.fn(),
        toArray: vi.fn(),
      }),
    }
    vi.mocked(db.messages.where).mockReturnValue(mockChain as any)

    await store.addMessage(message)

    expect(db.messages.add).toHaveBeenCalledWith(message)
    expect(store.messages).toHaveLength(1)
  })

  it('should handle errors when loading chats', async () => {
    const store = useChatStore()
    const error = new Error('DB Error')
    vi.mocked(db.chats.toArray).mockRejectedValue(error)

    await store.loadChats()

    expect(store.error).toEqual(error)
    expect(store.isLoading).toBe(false)
  })
})
