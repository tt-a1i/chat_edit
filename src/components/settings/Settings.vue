<script setup lang="ts">
/**
 * Settings 面板 - 简化版
 * API 配置已移至环境变量 (env.ts)
 * 只保留数据管理功能
 */
import { IconAlertTriangle, IconDatabase, IconFileExport, IconSettings, IconTrashX, IconUpload, IconX } from '@tabler/icons-vue'
import { ref } from 'vue'
import ExportButton from '@/components/history/ExportButton.vue'
import ImportButton from '@/components/history/ImportButton.vue'
import { useAppStore, useChatStore } from '@/stores'

// Stores
const appStore = useAppStore()
const chatStore = useChatStore()
const { toggleSettingsPanel } = appStore
const { wipeDatabase } = chatStore

const showConfirmDialog = ref(false)

function confirmWipe() {
  showConfirmDialog.value = true
}

function handleConfirmWipe() {
  wipeDatabase()
  showConfirmDialog.value = false
}
</script>

<template>
  <!-- 设置模态窗口 -->
  <div class="settings-modal" @click.stop>
    <!-- 确认删除对话框 -->
    <Transition name="fade">
      <div
        v-if="showConfirmDialog"
        class="confirm-overlay"
        @click.self="showConfirmDialog = false"
      >
        <div class="confirm-dialog">
          <div class="confirm-icon">
            <IconAlertTriangle class="h-6 w-6" />
          </div>
          <h3 class="confirm-title">
            确认删除所有数据？
          </h3>
          <p class="confirm-description">
            此操作将永久删除所有聊天记录，且无法恢复。请确认您已备份重要数据。
          </p>
          <div class="confirm-actions">
            <button class="btn-cancel" @click="showConfirmDialog = false">
              取消
            </button>
            <button class="btn-danger" @click="handleConfirmWipe">
              确认删除
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 主内容区 -->
    <div class="settings-content">
      <!-- 头部 -->
      <header class="settings-header">
        <div class="header-title">
          <div class="title-icon">
            <IconSettings class="h-5 w-5" />
          </div>
          <h2>设置</h2>
        </div>
        <button class="close-button" @click="toggleSettingsPanel()">
          <IconX class="h-5 w-5" />
        </button>
      </header>

      <!-- 数据管理区块 -->
      <section class="settings-section">
        <div class="section-header">
          <IconDatabase class="h-4 w-4" />
          <h3>数据管理</h3>
        </div>

        <div class="action-list">
          <ImportButton class="action-item">
            <div class="action-icon import">
              <IconUpload class="h-4 w-4" />
            </div>
            <div class="action-content">
              <span class="action-title">导入对话</span>
              <span class="action-description">从 JSON 文件恢复对话记录</span>
            </div>
          </ImportButton>

          <ExportButton class="action-item">
            <div class="action-icon export">
              <IconFileExport class="h-4 w-4" />
            </div>
            <div class="action-content">
              <span class="action-title">导出对话</span>
              <span class="action-description">将所有对话保存为 JSON 文件</span>
            </div>
          </ExportButton>

          <button class="action-item danger" @click="confirmWipe">
            <div class="action-icon delete">
              <IconTrashX class="h-4 w-4" />
            </div>
            <div class="action-content">
              <span class="action-title">清除所有数据</span>
              <span class="action-description">永久删除所有对话记录</span>
            </div>
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.settings-modal {
  position: relative;
  width: 100%;
  max-width: 28rem;
  margin: 0 1rem;
  background: var(--bg-primary);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-2xl);
  overflow: hidden;
}

.dark .settings-modal {
  background: var(--dark-bg-secondary);
  border: 1px solid var(--dark-border-light);
}

/* 主内容区 */
.settings-content {
  display: flex;
  flex-direction: column;
  max-height: 85vh;
  overflow-y: auto;
}

/* 头部样式 */
.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-lg) var(--space-xl);
  border-bottom: 1px solid var(--border-light);
  background: linear-gradient(to bottom, var(--bg-secondary), var(--bg-primary));
}

.dark .settings-header {
  border-bottom-color: var(--dark-border-light);
  background: linear-gradient(to bottom, var(--dark-bg-tertiary), var(--dark-bg-secondary));
}

.header-title {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.title-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%);
  color: white;
}

.header-title h2 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.close-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: var(--radius-md);
  color: var(--text-tertiary);
  transition: all var(--transition-fast);
}

.close-button:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.dark .close-button:hover {
  background: var(--dark-bg-tertiary);
}

/* 区块样式 */
.settings-section {
  padding: var(--space-lg) var(--space-xl) var(--space-xl);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: var(--space-md);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

/* 操作列表 */
.action-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.action-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  width: 100%;
  padding: var(--space-md);
  border-radius: var(--radius-lg);
  background: var(--bg-secondary);
  border: 1px solid transparent;
  text-align: left;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.action-item:hover {
  background: var(--bg-tertiary);
  border-color: var(--border-light);
}

.dark .action-item {
  background: var(--dark-bg-tertiary);
}

.dark .action-item:hover {
  background: var(--dark-bg-elevated);
  border-color: var(--dark-border-medium);
}

.action-item.danger:hover {
  background: var(--danger-50);
  border-color: rgba(239, 68, 68, 0.2);
}

.dark .action-item.danger:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.2);
}

/* 操作图标 */
.action-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--radius-lg);
  flex-shrink: 0;
  transition: all var(--transition-fast);
}

.action-icon.import {
  background: var(--primary-50);
  color: var(--primary-600);
}

.action-icon.export {
  background: var(--accent-50);
  color: var(--accent-600);
}

.action-icon.delete {
  background: var(--danger-50);
  color: var(--danger-500);
}

.dark .action-icon.import {
  background: rgba(20, 184, 166, 0.1);
  color: var(--primary-400);
}

.dark .action-icon.export {
  background: rgba(245, 158, 11, 0.1);
  color: var(--accent-400);
}

.dark .action-icon.delete {
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
}

/* 操作内容 */
.action-content {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}

.action-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.action-description {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

/* 确认对话框遮罩 */
.confirm-overlay {
  position: absolute;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  border-radius: var(--radius-2xl);
}

/* 确认对话框 */
.confirm-dialog {
  width: calc(100% - 2rem);
  max-width: 20rem;
  padding: var(--space-xl);
  background: var(--bg-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  text-align: center;
}

.dark .confirm-dialog {
  background: var(--dark-bg-secondary);
  border: 1px solid var(--dark-border-light);
}

.confirm-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  margin-bottom: var(--space-md);
  border-radius: var(--radius-full);
  background: var(--danger-50);
  color: var(--danger-500);
}

.dark .confirm-icon {
  background: rgba(239, 68, 68, 0.1);
}

.confirm-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--space-sm);
}

.confirm-description {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: var(--space-lg);
}

.confirm-actions {
  display: flex;
  gap: var(--space-sm);
}

.btn-cancel,
.btn-danger {
  flex: 1;
  padding: 0.625rem 1rem;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-cancel {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-light);
}

.btn-cancel:hover {
  background: var(--bg-secondary);
  border-color: var(--border-medium);
}

.dark .btn-cancel {
  background: var(--dark-bg-tertiary);
  border-color: var(--dark-border-light);
}

.dark .btn-cancel:hover {
  background: var(--dark-bg-elevated);
}

.btn-danger {
  background: linear-gradient(135deg, var(--danger-500) 0%, var(--danger-600) 100%);
  color: white;
  border: none;
}

.btn-danger:hover {
  background: linear-gradient(135deg, var(--danger-600) 0%, #b91c1c 100%);
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
