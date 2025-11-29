<script setup lang="ts">
import { IconDeviceFloppy, IconSparkles, IconWand } from '@tabler/icons-vue'
import { useTextareaAutosize } from '@vueuse/core'
import { createDiscreteApi } from 'naive-ui'
import { onMounted, ref } from 'vue'
import { env } from '@/config/env'
import { useConfigStore } from '@/stores'

const configStore = useConfigStore()
const currentModel = env.model
const { textarea } = useTextareaAutosize()
const configInput = ref('')
const defaultConfigInput = ref('')
const isSaving = ref(false)

const { message } = createDiscreteApi(['message'])

onMounted(() => {
  initialize()
})

async function initialize() {
  const configs = await configStore.initializeConfig(currentModel)
  configInput.value = configs?.modelConfig?.systemPrompt ?? ''
  defaultConfigInput.value = configs?.defaultConfig?.systemPrompt ?? ''
}

async function onSubmit() {
  isSaving.value = true
  try {
    await configStore.setConfig({
      model: 'default',
      systemPrompt: defaultConfigInput.value.trim(),
      createdAt: new Date(),
    })
    await configStore.setConfig({
      model: currentModel,
      systemPrompt: configInput.value.trim(),
      createdAt: new Date(),
    })
    message.success('保存成功！')
  } finally {
    isSaving.value = false
  }
}

function shouldSubmit({ key, shiftKey }: KeyboardEvent): boolean {
  return key === 'Enter' && !shiftKey
}

function onKeydown(event: KeyboardEvent) {
  if (shouldSubmit(event)) {
    event.preventDefault()
    onSubmit()
  }
}
</script>

<template>
  <aside class="system-prompt-container">
    <!-- 页面标题区 -->
    <header class="system-prompt-header">
      <div class="header-content">
        <div class="title-group">
          <div class="title-icon">
            <IconSparkles class="h-5 w-5" />
          </div>
          <h1 class="title">
            系统提示词
          </h1>
        </div>
        <div class="model-badge">
          <IconWand class="h-3.5 w-3.5" />
          <span>{{ currentModel }}</span>
        </div>
      </div>
    </header>

    <!-- 内容区域 -->
    <div class="content-area">
      <!-- 自定义指令卡片 -->
      <section class="prompt-card">
        <div class="card-header">
          <h2 class="card-title">
            自定义指令
          </h2>
          <p class="card-description">
            为当前模型配置专属的系统提示词，让 AI 更好地理解您的需求
          </p>
        </div>
        <div class="card-body">
          <form @submit.prevent="onSubmit">
            <textarea
              ref="textarea"
              v-model="configInput"
              class="prompt-textarea"
              placeholder="例如：你是一位专业的技术文档撰写专家..."
              @keydown="onKeydown"
            />
          </form>
        </div>
      </section>

      <!-- 默认指令卡片 -->
      <section class="prompt-card">
        <div class="card-header">
          <h2 class="card-title">
            默认指令
            <span class="badge-global">全局</span>
          </h2>
          <p class="card-description">
            此提示词将应用于所有模型，与自定义指令叠加使用
          </p>
        </div>
        <div class="card-body">
          <form @submit.prevent="onSubmit">
            <textarea
              v-model="defaultConfigInput"
              class="prompt-textarea"
              placeholder="例如：请用简洁清晰的语言回答问题..."
            />
          </form>
        </div>
      </section>

      <!-- 保存按钮 -->
      <div class="action-bar">
        <button
          type="button"
          class="save-button"
          :class="{ 'is-saving': isSaving }"
          :disabled="isSaving"
          @click="onSubmit"
        >
          <IconDeviceFloppy class="h-4 w-4" />
          <span>{{ isSaving ? '保存中...' : '保存修改' }}</span>
        </button>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.system-prompt-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-secondary);
}

/* 头部样式 */
.system-prompt-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: linear-gradient(to bottom,
    var(--bg-primary) 0%,
    var(--bg-primary) 85%,
    transparent 100%
  );
  padding: var(--space-lg) var(--space-lg) var(--space-xl);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
}

.title-group {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.title-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%);
  color: white;
  box-shadow: 0 2px 8px -2px rgba(20, 184, 166, 0.4);
}

.title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

.model-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: var(--radius-full);
  background: var(--primary-50);
  color: var(--primary-700);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  border: 1px solid var(--primary-200);
  transition: all var(--transition-fast);
}

.dark .model-badge {
  background: rgba(20, 184, 166, 0.1);
  color: var(--primary-300);
  border-color: rgba(20, 184, 166, 0.2);
}

/* 内容区域 */
.content-area {
  flex: 1;
  overflow-y: auto;
  padding: 0 var(--space-lg) var(--space-xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

/* 卡片样式 */
.prompt-card {
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-light);
  overflow: hidden;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-sm);
}

.prompt-card:hover {
  border-color: var(--primary-200);
  box-shadow: var(--shadow-md);
}

.dark .prompt-card {
  background: var(--dark-bg-secondary);
  border-color: var(--dark-border-light);
}

.dark .prompt-card:hover {
  border-color: rgba(20, 184, 166, 0.3);
}

.card-header {
  padding: var(--space-lg) var(--space-lg) var(--space-md);
  border-bottom: 1px solid var(--border-light);
  background: linear-gradient(to bottom, var(--bg-secondary), transparent);
}

.dark .card-header {
  border-bottom-color: var(--dark-border-light);
  background: linear-gradient(to bottom, var(--dark-bg-tertiary), transparent);
}

.card-title {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: 0.375rem;
}

.badge-global {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.5rem;
  border-radius: var(--radius-full);
  background: var(--accent-100);
  color: var(--accent-700);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
}

.dark .badge-global {
  background: rgba(245, 158, 11, 0.15);
  color: var(--accent-400);
}

.card-description {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: 1.5;
}

.card-body {
  padding: var(--space-md) var(--space-lg) var(--space-lg);
}

/* 文本框样式 */
.prompt-textarea {
  width: 100%;
  min-height: 140px;
  padding: var(--space-md);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  line-height: 1.6;
  resize: vertical;
  transition: all var(--transition-fast);
}

.prompt-textarea:focus {
  outline: none;
  border-color: var(--primary-400);
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
  background: var(--bg-primary);
}

.prompt-textarea::placeholder {
  color: var(--text-tertiary);
}

.dark .prompt-textarea {
  background: var(--dark-bg-tertiary);
  border-color: var(--dark-border-light);
}

.dark .prompt-textarea:focus {
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.15);
  background: var(--dark-bg-primary);
}

/* 操作栏 */
.action-bar {
  display: flex;
  justify-content: flex-end;
  padding-top: var(--space-sm);
}

/* 保存按钮 */
.save-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%);
  color: white;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
  box-shadow: 0 2px 8px -2px rgba(20, 184, 166, 0.4);
}

.save-button:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--primary-600) 0%, var(--primary-700) 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px -2px rgba(20, 184, 166, 0.5);
}

.save-button:active:not(:disabled) {
  transform: translateY(0);
}

.save-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.save-button.is-saving {
  background: var(--primary-400);
}
</style>
