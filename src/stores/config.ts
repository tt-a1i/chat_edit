/**
 * 配置管理 Store（系统提示词等）
 */
import type { Config } from '@/services/database'
import { showError } from '@/composables/useToast'
import { db } from '@/services/database'
import { logger } from '@/utils/logger'
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
      logger.error('获取配置失败', err)
      showError('获取配置失败')
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
      logger.error('保存配置失败', err)
      showError('保存配置失败')
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
      logger.error('清除配置失败', err)
      showError('清除配置失败')
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
      logger.error('初始化配置失败', err)
      showError('初始化配置失败')
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
