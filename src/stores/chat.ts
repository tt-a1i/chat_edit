/**
 * 聊天状态管理 Store
 */
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Chat, Message } from '@/services/database'
import { db } from '@/services/database'

export const useChatStore = defineStore('chat', () => {
  // State
  const currentChatId = ref<number | null>(null)
  const chats = ref<Chat[]>([])
  const messages = ref<Message[]>([])
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  // Getters
  const currentChat = computed(() => {
    return chats.value.find(chat => chat.id === currentChatId.value)
  })

  const currentMessages = computed(() => {
    if (!currentChatId.value)
      return []
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
    }
    catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      console.error('加载聊天列表失败:', err)
    }
    finally {
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
    }
    catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      console.error('加载消息失败:', err)
    }
    finally {
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
    }
    catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      console.error('创建聊天失败:', err)
      throw err
    }
  }

  async function setCurrentChat(chatId: number | null) {
    currentChatId.value = chatId
    if (chatId) {
      await loadMessages(chatId)
    }
    else {
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
    }
    catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      console.error('添加消息失败:', err)
      throw err
    }
  }

  async function updateMessage(id: number, updates: Partial<Message>) {
    try {
      await db.messages.update(id, updates)
      if (currentChatId.value) {
        await loadMessages(currentChatId.value)
      }
    }
    catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      console.error('更新消息失败:', err)
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
    }
    catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      console.error('删除聊天失败:', err)
    }
  }

  async function deleteAllChats() {
    try {
      await db.messages.clear()
      await db.chats.clear()
      chats.value = []
      messages.value = []
      currentChatId.value = null
    }
    catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      console.error('删除所有聊天失败:', err)
    }
  }

  return {
    // State
    currentChatId,
    chats,
    messages,
    isLoading,
    error,

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
    deleteChat,
    deleteAllChats,
  }
})
