import type { Config } from '@/services/database'
import { db } from '@/services/database'
/**
 * 配置管理 Store（系统提示词等）
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useConfigStore = defineStore('config', () => {
  // State
  const configs = ref<Config[]>([])
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  // Actions
  async function getConfig(model: string): Promise<Config | undefined> {
    try {
      const config = await db.config
        .where('model')
        .equals(model)
        .first()
      return config
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      console.error('获取配置失败:', err)
      return undefined
    }
  }

  async function getCurrentConfig(model: string): Promise<Config | undefined> {
    let config = await getConfig(model)
    if (!config?.systemPrompt) {
      config = await getConfig('default')
    }
    return config
  }

  async function setConfig(config: Config) {
    try {
      isLoading.value = true

      // 生成 ID（基于模型名称的哈希）
      if (!config.id) {
        let hash = 0
        for (let i = 0; i < config.model.length; i++) {
          hash += config.model.charCodeAt(i)
        }
        config.id = hash
      }

      await db.config.put(config)
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      console.error('保存配置失败:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function clearConfig() {
    try {
      await db.config.clear()
      configs.value = []
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      console.error('清除配置失败:', err)
    }
  }

  async function getCurrentSystemMessage(model: string): Promise<string | null> {
    const config = await getCurrentConfig(model)
    return config?.systemPrompt ?? null
  }

  async function initializeConfig(model: string) {
    try {
      const modelConfig = await getConfig(model)
      const defaultConfig = await getConfig('default')
      return { modelConfig, defaultConfig }
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
      console.error('初始化配置失败:', err)
      return null
    }
  }

  return {
    // State
    configs,
    isLoading,
    error,

    // Actions
    getConfig,
    getCurrentConfig,
    setConfig,
    clearConfig,
    getCurrentSystemMessage,
    initializeConfig,
  }
})
