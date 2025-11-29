import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
/**
 * App Store 测试
 * 注意：API 配置（baseUrl、apiKey、model、enableMarkdown、showSystem、historyMessageLength）
 * 已移至环境变量，不再由 appStore 管理
 */
import { setupLocalStorageMock } from '@/../tests/helpers/setup'
import { SCENES, useAppStore } from './app'

describe('useAppStore', () => {
  beforeEach(() => {
    // 为每个测试创建新的 pinia 实例
    setActivePinia(createPinia())

    // Mock localStorage
    setupLocalStorageMock()
  })

  describe('初始化', () => {
    it('应该使用默认值初始化', () => {
      const store = useAppStore()

      expect(store.currentScene).toBe(SCENES.CHAT)
      expect(store.isDarkMode).toBe(true)
      expect(store.isSettingsOpen).toBe(false)
      expect(store.isSystemPromptOpen).toBe(false)
      expect(store.isSidebarCollapsed).toBe(false)
    })

    it('应该有正确的 SCENES 常量', () => {
      const store = useAppStore()

      expect(store.SCENES.CHAT).toBe('chat')
      expect(store.SCENES.AI_EDITING).toBe('ai_editing')
    })
  })

  describe('switchScene', () => {
    it('应该能够切换到 Chat 场景', () => {
      const store = useAppStore()

      store.switchScene(SCENES.CHAT)
      expect(store.currentScene).toBe(SCENES.CHAT)
    })

    it('应该能够切换到 AI Editing 场景', () => {
      const store = useAppStore()

      store.switchScene(SCENES.AI_EDITING)
      expect(store.currentScene).toBe(SCENES.AI_EDITING)
    })

    it('切换到 AI Editing 时应该关闭系统提示面板', () => {
      const store = useAppStore()
      store.isSystemPromptOpen = true

      store.switchScene(SCENES.AI_EDITING)

      expect(store.isSystemPromptOpen).toBe(false)
    })

    it('切换到 Chat 时不应该自动关闭系统提示面板', () => {
      const store = useAppStore()
      store.isSystemPromptOpen = true

      store.switchScene(SCENES.CHAT)

      expect(store.isSystemPromptOpen).toBe(true)
    })
  })

  describe('toggleSettingsPanel', () => {
    it('应该能够切换设置面板状态', () => {
      const store = useAppStore()
      const initialState = store.isSettingsOpen

      store.toggleSettingsPanel()
      expect(store.isSettingsOpen).toBe(!initialState)

      store.toggleSettingsPanel()
      expect(store.isSettingsOpen).toBe(initialState)
    })
  })

  describe('toggleSystemPromptPanel', () => {
    it('应该能够切换系统提示面板状态', () => {
      const store = useAppStore()
      const initialState = store.isSystemPromptOpen

      store.toggleSystemPromptPanel()
      expect(store.isSystemPromptOpen).toBe(!initialState)

      store.toggleSystemPromptPanel()
      expect(store.isSystemPromptOpen).toBe(initialState)
    })
  })

  describe('toggleDarkMode', () => {
    it('应该能够切换暗色模式', () => {
      const store = useAppStore()
      const initialState = store.isDarkMode

      store.toggleDarkMode()
      expect(store.isDarkMode).toBe(!initialState)

      store.toggleDarkMode()
      expect(store.isDarkMode).toBe(initialState)
    })
  })

  describe('toggleSidebar', () => {
    it('应该能够切换侧边栏折叠状态', () => {
      const store = useAppStore()
      const initialState = store.isSidebarCollapsed

      store.toggleSidebar()
      expect(store.isSidebarCollapsed).toBe(!initialState)

      store.toggleSidebar()
      expect(store.isSidebarCollapsed).toBe(initialState)
    })
  })

  describe('localStorage 持久化', () => {
    it('应该能够持久化暗色模式设置', () => {
      const store = useAppStore()
      store.isDarkMode = false

      const newStore = useAppStore()
      expect(newStore.isDarkMode).toBe(false)
    })

    it('应该能够持久化侧边栏折叠状态', () => {
      const store = useAppStore()
      store.isSidebarCollapsed = true

      const newStore = useAppStore()
      expect(newStore.isSidebarCollapsed).toBe(true)
    })
  })
})
