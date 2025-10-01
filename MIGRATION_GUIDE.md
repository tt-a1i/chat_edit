# AI 编辑器组件迁移指南

**目标**: 将 `AIEditing/index.vue` (1,164行) 迁移到新的组件化架构
**策略**: 渐进式重构，保持功能稳定
**预期**: 最终 index.vue ≤250 行

---

## 🎯 迁移概览

### 已完成的基础设施 ✅

#### Composables (4个)
```typescript
// 2. AI 交互逻辑
import { useAIInteraction } from './composables/useAIInteraction'

// 4. 事件监听管理
import { useEditorEventListeners } from './composables/useEditorEventListeners'

// 3. 文件操作
import { useFileOperations } from './composables/useFileOperations'

// 1. Quill 编辑器管理
import { useQuillEditor } from './composables/useQuillEditor'
```

#### UI 子组件 (5个)
```vue
<!-- 1. 浮动输入框 -->
<FloatingInput @send="handleSend" @abort="handleAbort" />

<!-- 2. AI 响应面板 -->
<AIResponsePanel
  @insertAfter="..."
  @replace="..."
  @compare="..."
/>

<!-- 3. 提示词菜单 -->
<VerticalMenu :prompts="prompts" @select="handleSelect" />

<!-- 4. 导出菜单 -->
<ExportMenu @export="handleExport" />

<!-- 5. Diff 编辑器面板 -->
<DiffEditorPanel @insertAfter="..." @confirmReplace="..." />
```

---

## 📋 迁移步骤

### Step 1: 引入 Composables (预计 0.5h)

**当前代码 (index.vue, 第 40-60 行)**:
```javascript
// 组件状态
const quill = null
const toolbar = null
const diffEditor = null
const currentRange = null
const replacementRange = null
const creationTimeDisplay = null
const wordCountDisplay = null

const monacoLoaded = false

const floatingInputRef = null
const verticalMenuRef = null
const promptInputRef = null
const sendBtnRef = null
const aiResponseRef = null
const actionButtonsRef = null

const isGenerating = ref(false)
const abortController = ref(null)
const hiddenPrompt = ref('')
const isTranslationPrompt = ref(false)
```

**迁移后**:
```typescript
<script setup lang="ts">
// Composables 初始化
const {
  quillInstance,
  wordCount,
  isEditorReady,
  initQuillEditor,
  getToolbar
} = useQuillEditor()

const {
  isGenerating,
  abortController,
  isTranslationPrompt,
  hiddenPrompt,
  sendPrompt,
  abortGeneration,
} = useAIInteraction(quillInstance)

const {
  showUploadModal,
  isUploading,
  importWordDocument,
  exportDocument,
  handleFileUpload,
} = useFileOperations(quillInstance)

const { onElementClick, onDocumentEvent } = useEditorEventListeners()

// 仅保留必要的本地状态
const currentRange = ref(null)
const replacementRange = ref(null)
const diffEditor = shallowRef(null)
</script>
```

**收益**:
- 代码行数: ~40 行 → ~30 行
- 逻辑清晰: Composables 按职责分组
- 类型安全: 完整的 TypeScript 支持

---

### Step 2: 替换 template 为子组件 (预计 1h)

**当前代码 (index.vue, 第 1030-1072 行)**:
```vue
<div id="floatingInput" class="floating-input" tabindex="0">
  <div class="input-container">
    <textarea
      id="promptInput"
      placeholder="请输入内容"
      rows="1"
      @input="autoResize"
      @keydown="handlePromptKeydown"
    />
    <button id="sendBtn" class="send-btn">
      <i class="fas fa-paper-plane send-icon" />
    </button>
  </div>

</div>
<div id="aiResponse" class="ai-response">
  <div class="response-content" />
  <div id="actionButtons" class="action-buttons">
    <!-- 大量按钮代码... -->
  </div>

</div>
<div id="verticalMenu" class="vertical-menu" tabindex="0">
  <!-- 提示词列表... -->
</div>
```

**迁移后**:
```vue
<template>
  <div class="writing-editor flex-1 overflow-hidden flex flex-col notranslate">
    <div class="editor-container flex-1 overflow-auto">
      <!-- Quill 编辑器 -->
      <div id="editor" />

      <!-- 浮动输入框 -->
      <FloatingInput
        :is-generating="isGenerating"
        @send="handleSendPrompt"
        @abort="abortGeneration"
      />

      <!-- AI 响应面板 -->
      <AIResponsePanel
        :is-translation-prompt="isTranslationPrompt"
        @insert-after="handleInsertAfter"
        @replace="handleReplace"
        @compare="handleCompare"
        @regenerate="handleRegenerate"
        @copy="handleCopy"
      />

      <!-- 提示词菜单 -->
      <VerticalMenu
        :prompts="promptsData?.system || []"
        :current-language="currentLanguage"
        @select="handleMenuItemClick"
      />

      <!-- 导出菜单 -->
      <ExportMenu @export="handleExport" />

      <!-- Diff 编辑器 -->
      <DiffEditorPanel
        @insert-after="handleDiffInsertAfter"
        @confirm-replace="handleConfirmReplace"
        @cancel="handleCancelReplace"
      />
    </div>
  </div>
</template>
```

**收益**:
- Template 行数: ~200 行 → ~40 行 (-80%)
- 结构清晰: 组件层次分明
- 易于理解: 每个组件职责明确

---

### Step 3: 简化事件处理 (预计 1h)

**当前代码 (分散在 index.vue 多处)**:
```javascript
// 第 243-269 行
onElementClick('insertAfterDiff', () => {
  if (!diffEditor || !replacementRange) {
    logger.error('No diff editor or replacement range available')
    return
  }
  const modifiedText = diffEditor.getModifiedEditor().getValue()
  const insertPosition = replacementRange.index + replacementRange.length
  renderMarkdownToQuill({
    markdownText: modifiedText,
    quill,
    cursorPosition: insertPosition,
  })
  clearHighlight(quill, currentRange)
  closeDiffEditor(diffEditor, true)
  replacementRange = null
  currentRange = null
})

// 类似的代码重复 10+ 次...
```

**迁移后**:
```typescript
// 集中的事件处理函数
function handleDiffInsertAfter() {
  if (!diffEditor.value || !replacementRange.value) return

  const modifiedText = diffEditor.value.getModifiedEditor().getValue()
  const insertPosition = replacementRange.value.index + replacementRange.value.length

  renderMarkdownToQuill({
    markdownText: modifiedText,
    quill: quillInstance.value,
    cursorPosition: insertPosition,
  })

  clearHighlight(quillInstance.value, currentRange.value)
  closeDiffEditor(diffEditor.value, true)

  replacementRange.value = null
  currentRange.value = null
}

// 其他事件处理函数类似简化...
```

**收益**:
- 代码行数: ~400 行 → ~150 行 (-62%)
- 可读性提升: 函数命名清晰
- 易于调试: 独立的处理函数

---

### Step 4: 删除冗余代码 (预计 0.5h)

**需要删除的内容**:

1. **重复的 onBeforeUnmount** (2处)
```javascript
// 第 880-886 行
onBeforeUnmount(() => {
  if (abortController.value) {
    abortController.value.abort()
  }
})

// 第 1027-1031 行 (重复)
onBeforeUnmount(() => {
  if (abortController.value) {
    abortController.value.abort()
  }
})
```

**合并为**:
```typescript
onBeforeUnmount(() => {
  abortGeneration() // 使用 Composable 的方法
})
```

2. **已移至子组件的 template 代码**
```vue
<!-- 删除 floatingInput, aiResponse, verticalMenu, exportMenu, diffContainer -->
<!-- 这些已经是独立组件了 -->
```

3. **已移至 Composables 的函数**
```javascript
// 删除: autoResize, handlePromptKeydown 等
// 这些已在 FloatingInput.vue 中实现
```

**收益**:
- 代码行数: -400 行左右
- 消除重复: DRY 原则
- 清晰架构: 单一数据源

---

## 🎯 最终目标结构

### 重构后的 index.vue (~250 行)

```vue
<script setup lang="ts">
// ========== 导入 (~30 行) ==========
import { useQuillEditor } from './composables/useQuillEditor'
import { useAIInteraction } from './composables/useAIInteraction'
import { useFileOperations } from './composables/useFileOperations'
import FloatingInput from './components/FloatingInput.vue'
import AIResponsePanel from './components/AIResponsePanel.vue'
// ... 其他导入

// ========== Composables 初始化 (~20 行) ==========
const { quillInstance, initQuillEditor, getToolbar } = useQuillEditor()
const { isGenerating, sendPrompt, abortGeneration } = useAIInteraction(quillInstance)
const { showUploadModal, exportDocument, handleFileUpload } = useFileOperations(quillInstance)

// ========== 本地状态 (~10 行) ==========
const currentRange = ref(null)
const diffEditor = shallowRef(null)
const promptsData = ref({ system: [...] })

// ========== 生命周期 (~20 行) ==========
onMounted(async () => {
  await initQuillEditor(exportMenuRef)
  setupEditorListeners()
  initMonaco()
})

onBeforeUnmount(() => {
  abortGeneration()
})

// ========== 事件处理函数 (~100 行) ==========
function handleSendPrompt(prompt: string) { ... }
function handleInsertAfter() { ... }
function handleReplace() { ... }
function handleCompare() { ... }
// ... 其他处理函数

// ========== 工具函数 (~30 行) ==========
function setupEditorListeners() { ... }
function handleMenuItemClick(prompt) { ... }
function handleExport(format) { ... }
</script>

<template>
  <!-- ========== UI 结构 (~40 行) ========== -->
  <div class="writing-editor">
    <div class="editor-container">
      <div id="editor" />

      <FloatingInput @send="handleSendPrompt" />
      <AIResponsePanel @insert-after="handleInsertAfter" />
      <VerticalMenu :prompts="prompts" @select="handleMenuItemClick" />
      <ExportMenu @export="handleExport" />
      <DiffEditorPanel @confirm-replace="handleConfirmReplace" />

      <!-- 移动端警告对话框 -->
      <NModal v-model:show="showMobileWarning">...</NModal>

      <!-- 文件上传对话框 -->
      <NModal v-model:show="showUploadModal">...</NModal>
    </div>
  </div>
</template>

<!-- ========== 样式 (~20 行) ========== -->
<style scoped>
.writing-editor { ... }
.editor-container { ... }
</style>
```

**总计**: ~250 行 (比当前减少 **78%**)

---

## ⚠️ 迁移注意事项

### 1. 兼容性
- ✅ 保持所有 DOM 元素 ID (floatingInput, editor 等)
- ✅ 保持 CSS 类名不变
- ✅ 事件接口向后兼容

### 2. 测试检查清单
- [ ] Quill 编辑器初始化正常
- [ ] 输入 `/` 唤起提示词菜单
- [ ] 发送提示词获得 AI 响应
- [ ] 插入/替换/对比功能正常
- [ ] 文件导入/导出功能正常
- [ ] 撤销/重做功能正常
- [ ] 移动端检测警告正常
- [ ] 内存不泄漏 (Chrome DevTools 验证)

### 3. 回滚方案
如果迁移出现问题：
```bash
# 恢复备份
cp src/components/AIEditing/index.vue.backup src/components/AIEditing/index.vue
```

---

## 🚀 快速开始迁移

### 最小改动方案 (推荐)

**目标**: 不破坏现有功能的前提下，逐步引入新架构

#### 阶段 1: 仅引入 Composables (保持 template 不变)
```vue
<script setup>
// 引入但暂不使用，逐步迁移
const { quillInstance, initQuillEditor } = useQuillEditor()

// 保留原有的 let quill = null
const quill = null

onMounted(() => {
  // 方案A: 使用新的 initQuillEditor
  // quill = await initQuillEditor(exportMenuRef)

  // 方案B: 保持原有代码，逐步迁移
  // initQuillEditor() // 原有代码
})
</script>
```

#### 阶段 2: 逐个替换子组件
```vue
<!-- 先替换最简单的 ExportMenu -->
<ExportMenu @export="handleExport" />

<!-- 然后替换 FloatingInput -->
<FloatingInput @send="handleSend" />

<!-- 依次替换其他组件... -->
```

#### 阶段 3: 删除旧代码
```vue
<!-- 删除已替换的 template 部分 -->
<!-- <div id="exportMenu">...</div> --> 删除

<!-- 删除已移至 Composables 的逻辑 -->
// let quill = null // 删除，使用 quillInstance.value
```

---

## 📊 预期收益

### 代码行数减少
| 部分 | 当前 | 目标 | 减少 |
|------|------|------|------|
| script | ~900 行 | ~200 行 | -78% |
| template | ~200 行 | ~40 行 | -80% |
| style | ~60 行 | ~20 行 | -67% |
| **总计** | **~1,164 行** | **~260 行** | **-78%** |

### 可维护性提升
- ✅ 逻辑复用: Composables 可在其他地方使用
- ✅ 单元测试: 独立模块易于测试
- ✅ 团队协作: 不同成员可并行开发不同组件
- ✅ 代码审查: 小文件更容易 review

### 性能提升
- ✅ 懒加载: 子组件按需渲染
- ✅ 内存优化: 事件监听器自动清理
- ✅ 树摇优化: 未使用的 Composables 可被移除

---

## 🔧 实用代码片段

### Quill 编辑器操作
```typescript
// 旧代码
if (quill) {
  quill.setSelection(0, 0)
}

// 新代码
if (quillInstance.value) {
  quillInstance.value.setSelection(0, 0)
}
```

### AI 请求
```typescript
// 旧代码
isGenerating.value = true
await AIEditingAPI.streamChat(...)
isGenerating.value = false

// 新代码
await sendPrompt(promptValue, currentRange.value, ...)
// isGenerating 自动管理
```

### 文件导出
```typescript
// 旧代码
const exporter = createExporter(content, quill)
await exporter.exportAs('markdown')

// 新代码
await exportDocument('markdown')
```

---

## 📚 参考资源

### 相关文档
- [Vue 3 Composition API 指南](https://vuejs.org/guide/reusability/composables.html)
- [VueUse 文档](https://vueuse.org/)
- [组件设计原则](https://vuejs.org/guide/components/registration.html)

### 项目文档
- `REFACTORING_PROGRESS.md` - 重构进度
- `CLAUDE.md` - 项目说明
- `claudedocs/重构优化报告-更新版.md` - 详细分析

---

## ✅ 迁移检查清单

### 代码迁移
- [ ] 引入所有 Composables
- [ ] 替换 FloatingInput 为组件
- [ ] 替换 AIResponsePanel 为组件
- [ ] 替换 VerticalMenu 为组件
- [ ] 替换 ExportMenu 为组件
- [ ] 替换 DiffEditorPanel 为组件
- [ ] 删除冗余的 template 代码
- [ ] 删除冗余的 script 代码
- [ ] 删除重复的 onBeforeUnmount

### 功能测试
- [ ] Quill 编辑器正常工作
- [ ] AI 对话功能正常
- [ ] 文件导入功能正常
- [ ] 文件导出功能 (Markdown/DOCX)
- [ ] Diff 对比功能正常
- [ ] 移动端警告正常

### 质量验证
- [ ] `pnpm typecheck` 通过
- [ ] `pnpm lint` 无新增警告
- [ ] Chrome DevTools 无内存泄漏
- [ ] 所有功能手动测试通过

---

**最后更新**: 2025-10-01
**维护者**: Claude Code
