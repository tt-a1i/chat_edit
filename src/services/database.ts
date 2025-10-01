// database.ts
import Dexie from 'dexie'

export type ChatRole = 'user' | 'assistant' | 'system'

export interface Config {
  id?: number
  model: string
  systemPrompt: string
  createdAt: Date
}

export interface Chat {
  id?: number
  name: string
  model: string
  createdAt: Date
}

export interface Message {
  id?: number
  chatId: number
  role: ChatRole
  content: string
  imageUrl?: string // 新增：存储图片URL或Base64数据
  meta?: any
  context?: number[]
  isStreaming?: boolean // 新增：表示是否正在流式加载响应
  createdAt: Date
}

class ChatDatabase extends Dexie {
  chats: Dexie.Table<Chat, number>
  messages: Dexie.Table<Message, number>
  config: Dexie.Table<Config, number>

  constructor() {
    super('ChatDatabase')
    this.version(10).stores({
      chats: '++id,name,model,createdAt',
      messages: '++id,chatId,role,content,imageUrl,meta,context,createdAt', // 新增 imageUrl 到索引（可选，但有助于查询）
      config: '++id,model,systemPrompt,createdAt',
    })

    this.chats = this.table('chats')
    this.messages = this.table('messages')
    this.config = this.table('config')
  }
}

export const db = new ChatDatabase()
