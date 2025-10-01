/**
 * 应用配置状态管理 Store
 */
import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import gravatarUrl from 'gravatar-url'
import { computed, ref } from 'vue'
import { env } from '@/config/env'

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
  const gravatarEmail = useLocalStorage('gravatarEmail', '')
  const historyMessageLength = useLocalStorage('historyMessageLength', 10)
  const enableMarkdown = useLocalStorage('markdown', env.enableMarkdown)
  const showSystem = useLocalStorage('systemMessages', env.showSystemMessages)

  // API settings
  const baseUrl = useLocalStorage('baseUrl', env.apiBaseUrl)
  const apiKey = useLocalStorage('apiKey', env.apiKey)

  // UI state
  const isDarkMode = useLocalStorage('darkMode', true)
  const isSettingsOpen = useLocalStorage('settingsPanelOpen', true)
  const isSystemPromptOpen = useLocalStorage('systemPromptOpen', false)
  const isAIEditingOpen = ref(false)

  // Computed
  const avatarUrl = computed(() => {
    return gravatarEmail.value
      ? gravatarUrl(gravatarEmail.value, { size: 200, default: '/avatar.png' })
      : null
  })

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

  return {
    // Scene
    SCENES,
    currentScene,
    switchScene,

    // User settings
    currentModel,
    gravatarEmail,
    historyMessageLength,
    enableMarkdown,
    showSystem,
    avatarUrl,

    // API settings
    baseUrl,
    apiKey,

    // UI state
    isDarkMode,
    isSettingsOpen,
    isSystemPromptOpen,
    isAIEditingOpen,

    // Actions
    toggleSettingsPanel,
    toggleSystemPromptPanel,
    toggleDarkMode,
  }
})
