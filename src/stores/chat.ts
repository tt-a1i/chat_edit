import type { ChatCompletedResponse, ChatPartResponse } from '@/api/api'
/**
 * 聊天状态管理 Store
 */
import type { Chat, Message } from '@/services/database'
import { useApi } from '@/api/api'
import { db } from '@/services/database'
import { useAI } from '@/services/useAI'
import { logger } from '@/utils/logger'
import { showError } from '@/utils/toast'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useAppStore } from './app'

interface ChatExport extends Chat {
  messages: Message[]
}

export const useChatStore = defineStore('chat', () => {
  // State
  const currentChatId = ref<number | null>(null)
  const chats = ref<Chat[]>([])
  const messages = ref<Message[]>([])
  const isLoading = ref(false)
  const error = ref<Error | null>(null)
  const systemPrompt = ref<Message>()
  const ongoingAiMessages = ref<Map<number, Message>>(new Map())

  // Getters
  const currentChat = computed(() => {
    return chats.value.find(chat => chat.id === currentChatId.value)
  })

  const currentMessages = computed(() => {
    if (!currentChatId.value) {
      return []
    }
    return messages.value.filter(msg => msg.chatId === currentChatId.value)
  })

  const sortedChats = computed(() => {
    return [...chats.value].sort((a, b) => {
      const aTime = a.createdAt?.getTime() || 0
      const bTime = b.createdAt?.getTime() || 0
      return bTime - aTime
    })
  })

  // Actions
  async function loadChats() {
    try {
      isLoading.value = true
      chats.value = await db.chats.toArray()
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      logger.error('加载聊天列表失败', err)
      showError('加载聊天列表失败')
    } finally {
      isLoading.value = false
    }
  }

  async function loadMessages(chatId: number) {
    try {
      isLoading.value = true
      messages.value = await db.messages
        .where('chatId')
        .equals(chatId)
        .sortBy('createdAt')
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      logger.error('加载消息失败', err)
      showError('加载消息失败')
    } finally {
      isLoading.value = false
    }
  }

  async function createChat(model: string): Promise<number> {
    try {
      const chat: Omit<Chat, 'id'> = {
        name: `New Chat`,
        model,
        createdAt: new Date(),
      }
      const id = await db.chats.add(chat as Chat)
      await loadChats()
      return id
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      logger.error('创建聊天失败', err)
      showError('创建聊天失败')
      throw err
    }
  }

  async function setCurrentChat(chatId: number | null) {
    currentChatId.value = chatId
    if (chatId) {
      await loadMessages(chatId)
    } else {
      messages.value = []
    }
  }

  async function addMessage(message: Omit<Message, 'id'>) {
    try {
      const id = await db.messages.add(message as Message)
      if (message.chatId === currentChatId.value) {
        await loadMessages(message.chatId)
      }
      return id
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      logger.error('添加消息失败', err)
      showError('添加消息失败')
      throw err
    }
  }

  async function updateMessage(id: number, updates: Partial<Message>) {
    try {
      await db.messages.update(id, updates)
      if (currentChatId.value) {
        await loadMessages(currentChatId.value)
      }
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      logger.error('更新消息失败', err)
      showError('更新消息失败')
    }
  }

  async function deleteChat(chatId: number) {
    try {
      await db.messages.where('chatId').equals(chatId).delete()
      await db.chats.delete(chatId)
      await loadChats()
      if (currentChatId.value === chatId) {
        currentChatId.value = null
        messages.value = []
      }
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      logger.error('删除聊天失败', err)
      showError('删除聊天失败')
    }
  }

  async function deleteAllChats() {
    try {
      await db.messages.clear()
      await db.chats.clear()
      chats.value = []
      messages.value = []
      currentChatId.value = null
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      logger.error('删除所有聊天失败', err)
      showError('删除所有聊天失败')
    }
  }

  async function updateChat(chatId: number, updates: Partial<Chat>) {
    try {
      await db.chats.update(chatId, updates)
      await loadChats()
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      logger.error('更新聊天失败', err)
      showError('更新聊天失败')
    }
  }

  async function renameChat(newName: string) {
    if (!currentChat.value) return

    try {
      await db.chats.update(currentChat.value.id!, { name: newName })
      await loadChats()
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      logger.error('重命名聊天失败', err)
      showError('重命名聊天失败')
    }
  }

  async function startNewChat(name: string) {
    const appStore = useAppStore()
    const newChat: Omit<Chat, 'id'> = {
      name,
      model: appStore.currentModel || 'moonshot-v1-8k',
      createdAt: new Date(),
    }

    try {
      const id = await db.chats.add(newChat as Chat)
      await loadChats()
      await setCurrentChat(id)
      return id
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      logger.error('创建新聊天失败', err)
      showError('创建新聊天失败')
      throw err
    }
  }

  async function switchChat(chatId: number) {
    try {
      const chat = await db.chats.get(chatId)
      if (chat) {
        await setCurrentChat(chatId)
        const appStore = useAppStore()
        appStore.currentModel = chat.model
      }
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      logger.error('切换聊天失败', err)
      showError('切换聊天失败')
    }
  }

  async function initialize() {
    try {
      await loadChats()

      if (chats.value.length === 0) {
        await startNewChat('New Chat')
      } else {
        await switchChat(sortedChats.value[0].id!)
      }

      const appStore = useAppStore()
      if (!appStore.currentModel || appStore.currentModel === 'none') {
        appStore.currentModel = 'moonshot-v1-8k'
      }
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      logger.error('初始化聊天失败', err)
      showError('初始化聊天失败')
      await startNewChat('New Chat')
    }
  }

  async function addSystemMessage(content: string | null, meta?: any) {
    if (!currentChatId.value || !content) return

    const message: Omit<Message, 'id'> = {
      chatId: currentChatId.value,
      role: 'system',
      content,
      meta,
      createdAt: new Date(),
    }

    try {
      const id = await db.messages.add(message as Message)
      systemPrompt.value = { ...message, id } as Message
      await loadMessages(currentChatId.value)
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      logger.error('添加系统消息失败', err)
      showError('添加系统消息失败')
    }
  }

  async function addUserMessage(content: string, imageUrl?: string | null) {
    if (!currentChatId.value) {
      logger.warn('没有活动的聊天')
      return
    }

    const chatId = currentChatId.value
    const { generate } = useAI()
    const appStore = useAppStore()

    const message: Omit<Message, 'id'> = {
      chatId,
      role: 'user',
      content,
      createdAt: new Date(),
    }
    if (imageUrl) {
      message.imageUrl = imageUrl
    }

    try {
      await db.messages.add(message as Message)
      await loadMessages(chatId)

      // 创建 AI 响应消息
      const aiMessage: Omit<Message, 'id'> = {
        chatId,
        role: 'assistant',
        content: '',
        createdAt: new Date(),
        isStreaming: true,
      }
      const aiId = await db.messages.add(aiMessage as Message)
      const aiMsg = { ...aiMessage, id: aiId } as Message
      ongoingAiMessages.value.set(chatId, aiMsg)
      await loadMessages(chatId)

      // 调用 AI 生成
      await generate(
        appStore.currentModel,
        messages.value.slice(0, -1),
        systemPrompt.value,
        appStore.historyMessageLength,
        data => handleAiPartialResponse(data, chatId),
        data => handleAiCompletion(data, chatId),
      )
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        ongoingAiMessages.value.delete(chatId)
        return
      }
      error.value = err instanceof Error ? err : new Error(String(err))
      logger.error('添加用户消息失败', err)
      showError('添加用户消息失败')
    }
  }

  function handleAiPartialResponse(data: ChatPartResponse, chatId: number) {
    const aiMessage = ongoingAiMessages.value.get(chatId)
    if (aiMessage) {
      aiMessage.content += data.message.content
      db.messages.update(aiMessage.id!, { content: aiMessage.content }).catch((err) => {
        logger.error('更新AI消息失败', err)
        showError('更新AI消息失败')
      })
    }
  }

  async function handleAiCompletion(data: ChatCompletedResponse, chatId: number) {
    const aiMessage = ongoingAiMessages.value.get(chatId)
    if (aiMessage) {
      try {
        aiMessage.isStreaming = false
        await db.messages.update(aiMessage.id!, {
          content: aiMessage.content,
          isStreaming: false,
        })
        ongoingAiMessages.value.delete(chatId)
        await loadMessages(chatId)
      } catch (err) {
        error.value = err instanceof Error ? err : new Error(String(err))
        logger.error('完成AI消息失败', err)
        showError('完成AI消息失败')
      }
    }
  }

  async function regenerateResponse() {
    if (!currentChatId.value) return

    const chatId = currentChatId.value
    const { generate } = useAI()
    const appStore = useAppStore()
    const lastMessage = messages.value[messages.value.length - 1]

    if (lastMessage && lastMessage.role === 'assistant') {
      if (lastMessage.id) {
        await db.messages.delete(lastMessage.id)
      }
      await loadMessages(chatId)
    }

    try {
      await generate(
        appStore.currentModel,
        messages.value,
        systemPrompt.value,
        appStore.historyMessageLength,
        data => handleAiPartialResponse(data, chatId),
        data => handleAiCompletion(data, chatId),
      )
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        ongoingAiMessages.value.delete(chatId)
        return
      }
      error.value = err instanceof Error ? err : new Error(String(err))
      logger.error('重新生成响应失败', err)
      showError('重新生成响应失败')
    }
  }

  async function wipeDatabase() {
    try {
      await db.messages.clear()
      await db.chats.clear()
      chats.value = []
      messages.value = []
      currentChatId.value = null
      ongoingAiMessages.value.clear()
      await startNewChat('New Chat')
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      logger.error('清空数据库失败', err)
      showError('清空数据库失败')
    }
  }

  async function exportChats() {
    const allChats = await db.chats.toArray()
    const exportData: ChatExport[] = []

    await Promise.all(allChats.map(async (chat) => {
      if (!chat?.id) return
      const chatMessages = await db.messages.where('chatId').equals(chat.id).toArray()
      exportData.push(Object.assign({ messages: chatMessages }, chat))
    }))

    return exportData
  }

  async function importChats(jsonData: ChatExport[]) {
    for (const chatData of jsonData) {
      const chat: Omit<Chat, 'id'> = {
        name: chatData?.name,
        model: chatData?.model,
        createdAt: new Date(chatData?.createdAt || (chatData.messages?.[0]?.createdAt || Date.now())),
      }

      const chatId = await db.chats.add(chat as Chat)
      await loadChats()

      if (chatData.messages) {
        for (const messageData of chatData.messages) {
          const message: Omit<Message, 'id'> = {
            chatId,
            role: messageData.role,
            content: messageData.content,
            imageUrl: messageData.imageUrl,
            createdAt: new Date(messageData.createdAt),
          }
          await db.messages.add(message as Message)
        }
      }
    }
  }

  function abort() {
    const { abort: apiAbort } = useApi()
    apiAbort()
  }

  return {
    // State
    currentChatId,
    chats,
    messages,
    isLoading,
    error,
    systemPrompt,

    // Getters
    currentChat,
    currentMessages,
    sortedChats,

    // Actions
    loadChats,
    loadMessages,
    createChat,
    setCurrentChat,
    addMessage,
    updateMessage,
    updateChat,
    deleteChat,
    deleteAllChats,
    renameChat,
    startNewChat,
    switchChat,
    initialize,
    addSystemMessage,
    addUserMessage,
    regenerateResponse,
    wipeDatabase,
    exportChats,
    importChats,
    abort,
  }
})
