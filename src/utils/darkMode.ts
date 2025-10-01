import { watchEffect } from 'vue'
import { isDarkMode } from '../services/appConfig'

// 监听系统暗色模式变化并同步应用设置
export function syncSystemDarkMode() {
  // 检查系统是否支持暗色模式
  const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

  // 初始化时根据系统设置
  if (darkModeMediaQuery.matches) {
    isDarkMode.value = true
  }

  // 监听系统暗色模式变化
  darkModeMediaQuery.addEventListener('change', (e) => {
    isDarkMode.value = e.matches
  })
}

// 应用暗色模式到HTML元素
export function applyDarkModeToDocument() {
  watchEffect(() => {
    if (isDarkMode.value) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  })
}

// 获取当前是否是暗色模式
export function getCurrentDarkMode() {
  return isDarkMode.value
}

// 切换暗色模式
export function toggleDarkMode() {
  isDarkMode.value = !isDarkMode.value
}

// 暗色模式变量
export const DARK_MODE_VARIABLES = {
  messageBgUser: 'var(--message-bg-user, #ffffff)',
  messageBgUserDark: 'var(--message-bg-user-dark, #111827)',
  messageBgAi: 'var(--message-bg-ai, #f9fafb)',
  messageBgAiDark: 'var(--message-bg-ai-dark, #1e2736)',
  textColorPrimary: 'var(--text-color-primary, #111827)',
  textColorPrimaryDark: 'var(--text-color-primary-dark, #f3f4f6)',
  borderColor: 'var(--border-color, #e5e7eb)',
  borderColorDark: 'var(--border-color-dark, #374151)',
  codeBgLight: 'var(--code-bg-light, #f8f8f8)',
  codeBgDark: 'var(--code-bg-dark, #1e293b)',
  codeTextLight: 'var(--code-text-light, #24292e)',
  codeTextDark: 'var(--code-text-dark, #e2e8f0)',
  inlineCodeBgLight: 'var(--inline-code-bg-light, #f1f1f1)',
  inlineCodeBgDark: 'var(--inline-code-bg-dark, #1e293b)',
  inlineCodeTextLight: 'var(--inline-code-text-light, #24292e)',
  inlineCodeTextDark: 'var(--inline-code-text-dark, #e2e8f0)',
}

// 添加主题颜色对象以便在应用中使用
export const themeColors = {
  dark: {
    background: '#111827',
    foreground: '#f3f4f6',
    primary: '#3b82f6',
    secondary: '#1e293b',
    accent: '#60a5fa',
    muted: '#4b5563',
    border: '#374151',
    aiMessageBg: 'rgba(30, 41, 59, 0.95)',
    userMessageBg: 'rgba(17, 24, 39, 0.95)',
    systemMessageBg: 'rgba(30, 58, 138, 0.7)',
    codeBg: '#1e293b',
    codeText: '#e2e8f0',
    inlineCodeBg: '#1e293b',
    inlineCodeText: '#e2e8f0',
  },
  light: {
    background: '#ffffff',
    foreground: '#111827',
    primary: '#2563eb',
    secondary: '#f9fafb',
    accent: '#3b82f6',
    muted: '#9ca3af',
    border: '#e5e7eb',
    aiMessageBg: '#f9fafb',
    userMessageBg: '#ffffff',
    systemMessageBg: '#ebf5ff',
    codeBg: '#f8f8f8',
    codeText: '#24292e',
    inlineCodeBg: '#f1f1f1',
    inlineCodeText: '#24292e',
  },
}
