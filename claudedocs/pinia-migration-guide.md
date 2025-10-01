# Pinia 迁移指南

**目标**: 将所有组件从旧的 `services/appConfig.ts` 迁移到 Pinia stores

---

## 📊 迁移进度

### ✅ 已完成（2/10）
- [x] `src/App.vue`
- [x] `src/components/Settings.vue`

### ⏳ 待迁移（8/10）
- [ ] `src/components/Sidebar.vue`
- [ ] `src/components/ChatInput.vue`
- [ ] `src/components/ChatMessages.vue`
- [ ] `src/components/SystemPrompt.vue`
- [ ] `src/components/ModelSelector.vue`
- [ ] `src/components/NavHeader.vue`
- [ ] `src/components/Messages/AiMessage.vue`
- [ ] `src/components/Messages/UserMessage.vue`

---

## 🎯 迁移模式

### 模式 1: 简单替换（适用于大多数组件）

**旧代码**:
```typescript
// ❌ 旧的导入方式
import {
  currentModel,
  isDarkMode,
  toggleSettingsPanel,
} from '../services/appConfig.ts'
```

**新代码**:
```typescript
// ✅ 新的导入方式
import { useAppStore } from '../stores'

// 在 setup 中使用
const appStore = useAppStore()
const { currentModel, isDarkMode, toggleSettingsPanel } = appStore
```

### 模式 2: 保持响应性

**重要**: 使用解构时，响应性会丢失！

**错误示例** ❌:
```typescript
const { currentModel } = appStore
// currentModel 不再是响应式的！
```

**正确示例** ✅:
```typescript
// 方式 1: 直接使用 store
<template>
  <div>{{ appStore.currentModel }}</div>
</template>

// 方式 2: 使用 storeToRefs
import { storeToRefs } from 'pinia'
const appStore = useAppStore()
const { currentModel } = storeToRefs(appStore)
```

---

## 📝 逐个组件迁移步骤

### 1. Sidebar.vue

**当前使用**:
```typescript
import { currentScene, SCENES, switchScene } from '../services/appConfig.ts'
```

**迁移后**:
```typescript
import { SCENES, useAppStore } from '../stores'

const appStore = useAppStore()
const { currentScene, switchScene } = appStore
```

---

### 2. ChatInput.vue

**当前使用**:
```typescript
import { currentModel } from '../services/appConfig.ts'
```

**迁移后**:
```typescript
import { useAppStore } from '../stores'

const appStore = useAppStore()
const { currentModel } = appStore
```

---

### 3. ChatMessages.vue

**当前使用**:
```typescript
import { enableMarkdown, showSystem } from '../services/appConfig.ts'
```

**迁移后**:
```typescript
import { useAppStore } from '../stores'

const appStore = useAppStore()
const { enableMarkdown, showSystem } = appStore
```

---

### 4. SystemPrompt.vue

**当前使用**:
```typescript
import { toggleSystemPromptPanel } from '../services/appConfig.ts'
```

**迁移后**:
```typescript
import { useAppStore } from '../stores'

const appStore = useAppStore()
const { toggleSystemPromptPanel } = appStore
```

---

### 5. ModelSelector.vue

**当前使用**:
```typescript
import { currentModel } from '../services/appConfig.ts'
```

**迁移后**:
```typescript
import { useAppStore } from '../stores'

const appStore = useAppStore()
const { currentModel } = appStore
```

---

### 6. NavHeader.vue

**当前使用**:
```typescript
import { isDarkMode } from '../services/appConfig.ts'
```

**迁移后**:
```typescript
import { useAppStore } from '../stores'

const appStore = useAppStore()
const { isDarkMode } = appStore
```

---

### 7. Messages/AiMessage.vue

**当前使用**:
```typescript
import { avatarUrl } from '../services/appConfig.ts'
```

**迁移后**:
```typescript
import { useAppStore } from '../stores'

const appStore = useAppStore()
const { avatarUrl } = appStore
```

---

### 8. Messages/UserMessage.vue

**当前使用**:
```typescript
import { avatarUrl } from '../services/appConfig.ts'
```

**迁移后**:
```typescript
import { useAppStore } from '../stores'

const appStore = useAppStore()
const { avatarUrl } = appStore
```

---

## ⚠️ 常见陷阱

### 1. 导入顺序

ESLint 要求按字母顺序导入：

```typescript
// ✅ 正确
import { useChats } from './services/chat.ts'
import { useChats } from './services/chat.ts'

import { SCENES, useAppStore } from './stores'
// ❌ 错误
import { SCENES, useAppStore } from './stores'
```

### 2. 响应性丢失

```typescript
// ❌ 错误: 解构后失去响应性
// 不会更新 UI!

// ✅ 正确: 使用 storeToRefs
import { storeToRefs } from 'pinia' const { currentModel } = appStore
currentModel.value = 'new-model'
const { currentModel } = storeToRefs(appStore)
currentModel.value = 'new-model' // 会更新 UI ✅
```

### 3. Actions 不需要 storeToRefs

```typescript
// ❌ 错误: actions 不应该用 storeToRefs
const { toggleSettingsPanel } = storeToRefs(appStore)

// ✅ 正确: actions 直接解构即可
const { toggleSettingsPanel } = appStore
```

---

## 🔍 验证迁移

### 1. 检查控制台

迁移后刷新页面，确保没有错误：
```bash
# 使用 Chrome MCP 查看控制台
[vite] hot updated: /src/components/YourComponent.vue
```

### 2. 测试功能

- [ ] 切换暗黑模式
- [ ] 打开/关闭设置面板
- [ ] 切换 AI Editing 场景
- [ ] 修改配置项（API Key、Base URL 等）
- [ ] 确认 localStorage 持久化正常

### 3. ESLint 检查

```bash
pnpm lint
# 应该没有 "services/appConfig" 相关的导入
```

---

## 🧹 清理工作

### 迁移完成后

1. **删除旧文件** (可选，建议保留一段时间)
```bash
# 确认所有组件都迁移完成后
# rm src/services/appConfig.ts
```

2. **更新 README**
```markdown
# 状态管理已迁移到 Pinia
- App 配置: `useAppStore()`
- 聊天管理: `useChatStore()`
- 系统配置: `useConfigStore()`
```

3. **运行完整测试**
```bash
pnpm build
pnpm typecheck
pnpm lint
```

---

## 📚 参考资源

### Pinia 官方文档
- [Getting Started](https://pinia.vuejs.org/getting-started.html)
- [Composables Stores](https://pinia.vuejs.org/core-concepts/#setup-stores)
- [storeToRefs](https://pinia.vuejs.org/api/modules/pinia.html#storetorefs)

### 项目内部文档
- [重构总结报告](./refactoring-summary.md)
- [CLAUDE.md](../CLAUDE.md)

---

## 💡 最佳实践

### 1. 组织 Store 导入

```typescript
// 推荐的导入顺序
import { computed, ref } from 'vue'
import { useChats } from './services/chat.ts'
import { SCENES, useAppStore } from './stores'
import { applyDarkMode } from './utils/darkMode.ts'

// Stores
const appStore = useAppStore()
const chatStore = useChatStore()

// Services
const { refreshModels } = useAI()
```

### 2. 命名约定

```typescript
// ✅ 推荐: 明确命名
const appStore = useAppStore()
const chatStore = useChatStore()

// ❌ 不推荐: 简写
const app = useAppStore()
const chat = useChatStore()
```

### 3. 按需解构

```typescript
// ✅ 只解构需要的属性
const { currentModel, isDarkMode } = appStore

// ❌ 解构所有属性（可读性差）
const {
  currentModel,
  isDarkMode,
  currentScene,
  isSettingsOpen,
  // ... 太多了
} = appStore
```

---

**更新时间**: 2025-10-01
**状态**: 🟡 进行中 (2/10 完成)
**预计完成时间**: 1-2 小时
