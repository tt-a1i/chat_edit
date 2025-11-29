import { useLocalStorage } from '@vueuse/core'
/**
 * 应用配置状态管理 Store
 * 注意：API 配置（baseUrl, apiKey, model）已移至 env.ts 环境变量
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

  // UI state
  const isDarkMode = useLocalStorage('darkMode', true)
  const isSettingsOpen = useLocalStorage('settingsPanelOpen', false)
  const isSystemPromptOpen = useLocalStorage('systemPromptOpen', false)
  const isAIEditingOpen = ref(false)
  const isSidebarCollapsed = useLocalStorage('sidebarCollapsed', false)

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
