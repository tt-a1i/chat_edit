import { env } from '@/config/env'
import { useLocalStorage } from '@vueuse/core'
/**
 * 应用配置状态管理 Store
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

// Scene 常量
export const SCENES = {
  CHAT: 'chat',
  AI_EDITING: 'ai_editing',
} as const

export type SceneType = typeof SCENES[keyof typeof SCENES]

export const useAppStore = defineStore('app', () => {
  // Scene management
  const currentScene = ref<SceneType>(SCENES.CHAT)

  // User settings
  const currentModel = useLocalStorage('currentModel', 'moonshot-v1-8k')
  const historyMessageLength = useLocalStorage('historyMessageLength', 10)
  const enableMarkdown = useLocalStorage('markdown', env.enableMarkdown)
  const showSystem = useLocalStorage('systemMessages', env.showSystemMessages)

  // API settings
  const baseUrl = useLocalStorage('baseUrl', env.apiBaseUrl)
  const apiKey = useLocalStorage('apiKey', env.apiKey)

  // UI state
  const isDarkMode = useLocalStorage('darkMode', true)
  const isSettingsOpen = useLocalStorage('settingsPanelOpen', false) // 默认关闭设置面板
  const isSystemPromptOpen = useLocalStorage('systemPromptOpen', false)
  const isAIEditingOpen = ref(false)
  const isSidebarCollapsed = useLocalStorage('sidebarCollapsed', false) // 侧边栏折叠状态

  // Actions
  function switchScene(scene: SceneType) {
    currentScene.value = scene
    if (scene === SCENES.AI_EDITING) {
      isSystemPromptOpen.value = false
    }
  }

  function toggleSettingsPanel() {
    isSettingsOpen.value = !isSettingsOpen.value
  }

  function toggleSystemPromptPanel() {
    isSystemPromptOpen.value = !isSystemPromptOpen.value
  }

  function toggleDarkMode() {
    isDarkMode.value = !isDarkMode.value
  }

  function toggleSidebar() {
    isSidebarCollapsed.value = !isSidebarCollapsed.value
  }

  return {
    // Scene
    SCENES,
    currentScene,
    switchScene,

    // User settings
    currentModel,
    historyMessageLength,
    enableMarkdown,
    showSystem,

    // API settings
    baseUrl,
    apiKey,

    // UI state
    isDarkMode,
    isSettingsOpen,
    isSystemPromptOpen,
    isAIEditingOpen,
    isSidebarCollapsed,

    // Actions
    toggleSettingsPanel,
    toggleSystemPromptPanel,
    toggleDarkMode,
    toggleSidebar,
  }
})
