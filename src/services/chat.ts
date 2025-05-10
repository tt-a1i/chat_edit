import type { ChatCompletedResponse, ChatPartResponse } from '../api/api.ts'
import type { Chat, Message } from './database'
import { computed, ref } from 'vue'
import { useApi } from '../api/api.ts'
import { currentModel, historyMessageLength } from './appConfig'
import { db } from './database'
import { useAI } from './useAI.ts'

interface ChatExport extends Chat {
  messages: Message[]
}

// State
const chats = ref<Chat[]>([])
const activeChat = ref<Chat | null>(null)
const messages = ref<Message[]>([])
const systemPrompt = ref<Message>()
const ongoingAiMessages = ref<Map<number, Message>>(new Map())

// Database Layer
const dbLayer = {
  async getAllChats() {
    return db.chats.toArray()
  },

  async getChat(chatId: number) {
    return db.chats.get(chatId)
  },

  async getMessages(chatId: number) {
    return db.messages.where('chatId').equals(chatId).toArray()
  },

  async addChat(chat: Chat) {
    return db.chats.add(chat)
  },

  async updateChat(chatId: number, updates: Partial<Chat>) {
    return db.chats.update(chatId, updates)
  },

  async addMessage(message: Message) {
    return db.messages.add(message)
  },

  async updateMessage(messageId: number, updates: Partial<Message>) {
    return db.messages.update(messageId, updates)
  },

  async deleteChat(chatId: number) {
    return db.chats.delete(chatId)
  },

  async deleteMessagesOfChat(chatId: number) {
    return db.messages.where('chatId').equals(chatId).delete()
  },

  async deleteMessage(messageId: number) {
    return db.messages.delete(messageId)
  },

  async clearChats() {
    return db.chats.clear()
  },

  async clearMessages() {
    return db.messages.clear()
  },
}

export function useChats() {
  const { generate } = useAI()
  const { abort } = useApi()

  // Computed
  const sortedChats = computed<Chat[]>(() =>
    [...chats.value].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
  )
  const hasActiveChat = computed(() => activeChat.value !== null)
  const hasMessages = computed(() => messages.value.length > 0)

  // Methods for state mutations
  const setActiveChat = (chat: Chat) => (activeChat.value = chat)
  const setMessages = (newMessages: Message[]) => (messages.value = newMessages)

  const switchModel = async (model: string) => {
    currentModel.value = model
    if (!activeChat.value)
      return

    try {
      await dbLayer.updateChat(activeChat.value.id!, { model })
      activeChat.value.model = model
    }
    catch (error) {
      console.error(`Failed to switch model to ${model}:`, error)
    }
  }

  const startAiMessage = async (initialContent: string, chatId: number) => {
    const message: Message = {
      chatId,
      role: 'assistant',
      content: initialContent,
      createdAt: new Date(),
    }

    try {
      message.id = await dbLayer.addMessage(message)
      ongoingAiMessages.value.set(chatId, message)
      messages.value.push(message)
    }
    catch (error) {
      console.error('Failed to start AI message:', error)
    }
  }

  const appendToAiMessage = async (content: string, chatId: number) => {
    const aiMessage = ongoingAiMessages.value.get(chatId)
    if (aiMessage) {
      aiMessage.content += content
      try {
        await dbLayer.updateMessage(aiMessage.id!, { content: aiMessage.content })
      }
      catch (error) {
        console.error('Failed to append to AI message:', error)
      }
    }
  }

  const firstMessage = ref(false)

  const handleAiPartialResponse = (data: ChatPartResponse, chatId: number) => {
    if (firstMessage.value) {
      appendToAiMessage(data.message.content, chatId)
    }
    else {
      startAiMessage(data.message.content, chatId)
      firstMessage.value = true
    }
  }

  const handleAiCompletion = async (data: ChatCompletedResponse, chatId: number) => {
    firstMessage.value = false
    const aiMessage = ongoingAiMessages.value.get(chatId)
    if (aiMessage) {
      try {
        ongoingAiMessages.value.delete(chatId)
      }
      catch (error) {
        console.error('Failed to finalize AI message:', error)
      }
    }
  }

  const startNewChat = async (name: string) => {
    const newChat: Chat = {
      name,
      model: currentModel.value || 'moonshot-v1-8k',
      createdAt: new Date(),
    }

    try {
      newChat.id = await dbLayer.addChat(newChat)
      chats.value.push(newChat)
      setActiveChat(newChat)
      setMessages([])
    }
    catch (error) {
      console.error('Failed to start a new chat:', error)
    }
  }

  const switchChat = async (chatId: number) => {
    try {
      const chat = await dbLayer.getChat(chatId)
      if (chat) {
        setActiveChat(chat)
        const chatMessages = await dbLayer.getMessages(chatId)
        setMessages(chatMessages)
        if (activeChat.value) {
          await switchModel(activeChat.value.model)
        }
      }
    }
    catch (error) {
      console.error(`Failed to switch to chat with ID ${chatId}:`, error)
    }
  }

  const initialize = async () => {
    try {
      chats.value = await dbLayer.getAllChats()

      if (chats.value.length === 0) {
        await startNewChat('New Chat')
      }
      else {
        await switchChat(sortedChats.value[0].id!)
      }

      if (!currentModel.value || currentModel.value === 'none') {
        currentModel.value = 'moonshot-v1-8k'
      }
    }
    catch (error) {
      console.error('Failed to initialize chats:', error)
      await startNewChat('New Chat')
    }
  }

  const renameChat = async (newName: string) => {
    if (!activeChat.value)
      return

    activeChat.value.name = newName
    await dbLayer.updateChat(activeChat.value.id!, { name: newName })
    chats.value = await dbLayer.getAllChats()
  }

  const addSystemMessage = async (content: string | null, meta?: any) => {
    if (!activeChat.value)
      return
    if (!content)
      return

    const systemPromptMessage: Message = {
      chatId: activeChat.value.id!,
      role: 'system',
      content,
      meta,
      createdAt: new Date(),
    }

    systemPromptMessage.id = await dbLayer.addMessage(systemPromptMessage)
    messages.value.push(systemPromptMessage)

    systemPrompt.value = systemPromptMessage
  }

  const addUserMessage = async (content: string, imageUrl?: string | null) => {
    if (!activeChat.value) {
      console.warn('There was no active chat.')
      return
    }

    const currentChatId = activeChat.value.id!
    const message: Message = {
      chatId: activeChat.value.id!,
      role: 'user',
      content,
      createdAt: new Date(),
    }
    if (imageUrl) {
      message.imageUrl = imageUrl
    }

    try {
      message.id = await dbLayer.addMessage(message)
      messages.value.push(message)

      await generate(
        currentModel.value,
        messages.value,
        systemPrompt.value,
        historyMessageLength.value,
        data => handleAiPartialResponse(data, currentChatId),
        data => handleAiCompletion(data, currentChatId),
      )
    }
    catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          ongoingAiMessages.value.delete(currentChatId)
          return
        }
      }

      console.error('Failed to add user message:', error)
    }
  }

  const regenerateResponse = async () => {
    if (!activeChat.value)
      return
    const currentChatId = activeChat.value.id!
    const message = messages.value[messages.value.length - 1]
    if (message && message.role === 'assistant') {
      if (message.id)
        db.messages.delete(message.id)
      messages.value.pop()
    }
    try {
      await generate(
        currentModel.value,
        messages.value,
        systemPrompt.value,
        historyMessageLength.value,
        data => handleAiPartialResponse(data, currentChatId),
        data => handleAiCompletion(data, currentChatId),
      )
    }
    catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          ongoingAiMessages.value.delete(currentChatId)
          return
        }
      }
      console.error('Failed to regenerate response:', error)
    }
  }

  const wipeDatabase = async () => {
    try {
      await dbLayer.clearChats()
      await dbLayer.clearMessages()

      // Reset local state
      chats.value = []
      activeChat.value = null
      messages.value = []
      ongoingAiMessages.value.clear()

      await startNewChat('New chat')
    }
    catch (error) {
      console.error('Failed to wipe the database:', error)
    }
  }

  const deleteChat = async (chatId: number) => {
    try {
      await dbLayer.deleteChat(chatId)
      await dbLayer.deleteMessagesOfChat(chatId)

      chats.value = chats.value.filter(chat => chat.id !== chatId)

      if (activeChat.value?.id === chatId) {
        if (sortedChats.value.length) {
          await switchChat(sortedChats.value[0].id!)
        }
        else {
          await startNewChat('New chat')
        }
      }
    }
    catch (error) {
      console.error(`Failed to delete chat with ID ${chatId}:`, error)
    }
  }

  const exportChats = async () => {
    const chats = await dbLayer.getAllChats()
    const exportData: ChatExport[] = []
    await Promise.all(chats.map(async (chat) => {
      if (!chat?.id)
        return
      const messages = await dbLayer.getMessages(chat.id)
      exportData.push(Object.assign({ messages }, chat))
    }))
    return exportData
  }

  const importChats = async (jsonData: ChatExport[]) => {
    jsonData.forEach(async (chatData) => {
      const chat: Chat = {
        name: chatData?.name,
        model: chatData?.model,
        createdAt: new Date(chatData?.createdAt || (chatData.messages && chatData.messages.length > 0 ? chatData.messages[0].createdAt : Date.now())),
      }
      chat.id = await dbLayer.addChat(chat)
      chats.value.push(chat)
      if (chatData.messages) {
        chatData.messages.forEach(async (messageData) => {
          const message: Message = {
            chatId: chat.id!,
            role: messageData.role,
            content: messageData.content,
            imageUrl: messageData.imageUrl,
            createdAt: new Date(messageData.createdAt),
          }
          await dbLayer.addMessage(message)
        })
      }
    })
  }

  return {
    chats,
    sortedChats,
    activeChat,
    messages,
    hasMessages,
    hasActiveChat,
    renameChat,
    switchModel,
    startNewChat,
    switchChat,
    deleteChat,
    addUserMessage,
    regenerateResponse,
    addSystemMessage,
    initialize,
    wipeDatabase,
    abort,
    exportChats,
    importChats,
  }
}
