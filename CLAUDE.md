# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Language Preference

**请使用中文回复所有对话和代码注释。** All responses, explanations, and code comments should be in Chinese (Simplified).

## Project Background

**当前状态**: 这是一个处于持续开发阶段的项目，代码库正在进行重构和优化。

**未来规划**:
- 代码重构: 改进代码组织结构、提升可维护性
- 性能优化: 优化渲染性能、减少不必要的重渲染
- 新功能开发: 持续添加新的AI辅助编辑功能
- 架构改进: 完善状态管理、错误处理机制

**开发指导原则**:
- 在进行重构时，保持向后兼容性
- 新功能开发需要考虑与现有架构的整合
- 优先处理已知的技术债务（见下文"Known Issues"）
- 代码审查时关注可维护性和扩展性

## Project Overview

A dual-mode AI application combining:
- **Chat Scene**: Traditional conversational AI interface with streaming responses
- **AI Editing Scene**: Rich text editor (Quill) with AI-powered text manipulation features

Built with Vue 3 + TypeScript + Vite, using Moonshot AI API for LLM capabilities.

## Development Commands

```bash
# Development server
pnpm dev

# Build (includes TypeScript type checking)
pnpm build

# Preview production build
pnpm preview

# Linting
pnpm lint
pnpm lint:fix

# Code formatting
pnpm format
```

**Package Manager**: This project uses `pnpm` (version 10.6.4 specified in package.json).

## Architecture

### Scene Management

The app operates in two distinct scenes controlled by `services/appConfig.ts`:

```typescript
SCENES.CHAT // Traditional chat interface
SCENES.AI_EDITING // Rich text editor with AI features
```

Scene switching happens through `switchScene()` which updates `currentScene.value` and manages panel visibility.

### Data Flow Architecture

**Chat Scene Flow**:
1. User input → `addUserMessage()` in `services/chat.ts`
2. Empty AI message created with `isStreaming: true`
3. `useAI.generate()` → `useApi.generateChat()` → SSE stream processing
4. Incremental updates via `handleAiPartialResponse()`
5. Completion via `handleAiCompletion()` sets `isStreaming: false`

**AI Editing Flow**:
1. User selects text → `highlightSelection()` in `components/AIEditing/util.ts`
2. Prompt applied → `handleSend()` calls `AIEditingAPI.streamChat()`
3. SSE responses processed → `renderMarkdownToQuill()`
4. Optional Monaco diff editor for before/after comparison

### Database Layer (Dexie/IndexedDB)

Three tables defined in `services/database.ts`:
- `chats`: Chat sessions (id, name, model, createdAt)
- `messages`: Chat messages (id, chatId, role, content, imageUrl, isStreaming, createdAt)
- `config`: System prompts per model (id, model, systemPrompt, createdAt)

All database operations go through `dbLayer` abstraction in `services/chat.ts`.

### API Integration

**Provider**: Moonshot AI (https://api.moonshot.cn)

**Key Endpoints**:
- `POST /v1/chat/completions` - Streaming chat (SSE format)
- `GET /v1/models` - Available models list

**SSE Processing** (`api/api.ts:processStreamResponse`):
- Reads `data: [JSON]` lines from stream
- Extracts `choices[0].delta.content` for incremental text
- `finish_reason === 'stop'` triggers completion callback
- `data: [DONE]` signals stream end

### State Management

No Vuex/Pinia - uses composables pattern:
- `services/appConfig.ts`: Global config (uses @vueuse/core's `useLocalStorage`)
- `services/chat.ts`: Chat state and operations (exported refs)
- `services/useAI.ts`: AI generation logic

All state is reactive Vue refs/computed values.

### AI Editing Component Structure

Main entry: `components/AIEditing/index.vue` (large component ~1000+ lines)

**Key modules**:
- `api.ts`: AI editing API (uses `@microsoft/fetch-event-source`)
- `util.ts`: Core editing functions (highlight, diff, render, send)
- `export.ts`: Multi-format export (PDF via html2pdf.js, DOCX via docx, MD via turndown)
- `import.ts`: DOCX import (via mammoth)
- `markdown.ts`: Markdown rendering with KaTeX math support
- `monacoConfig.ts`: Monaco editor setup for diff view
- `storage.ts`: LocalStorage persistence for editor content

**Editor Stack**:
- Quill 2.0 for rich text (with quill-table-ui plugin)
- Monaco Editor for diff comparison
- markdown-it pipeline with plugins (katex, highlightjs, anchor, link-attributes)

### Image Support

Messages can include images via `imageUrl` field (Base64 or URL). API messages construct multi-modal content:

```typescript
content: [
  { type: 'image_url', image_url: { url } },
  { type: 'text', text }
]
```

### Dark Mode

Implemented via:
- `utils/darkMode.ts`: System theme sync + localStorage persistence
- Tailwind `dark:` variants throughout components
- CSS custom properties in `App.vue` (--message-bg-*, --text-color-*, etc.)

## Important Patterns

### Path Aliasing

`@/*` maps to `src/*` (configured in vite.config.ts and tsconfig.json).

### TypeScript Configuration

- Strict mode enabled
- `noUnusedLocals` and `noUnusedParameters` disabled
- Bundler module resolution
- `allowImportingTsExtensions` for .ts imports in Vue SFCs

### Vue SFC Structure

Mix of `<script setup>` (most components) and Options API (legacy). New code should use Composition API with `<script setup lang="ts">`.

### Error Handling

Most try-catch blocks log to console. No centralized error handling system. Network errors are caught but not always surfaced to users.

### Streaming Response Pattern

All AI responses use Server-Sent Events (SSE). The pattern is:
1. Create `AbortController` for cancellation
2. Use `fetchEventSource` or custom stream reader
3. Parse `data: ` prefixed lines
4. Call `onMessage` callback for each chunk
5. Call `onDone` when `done: true` or `[DONE]` received

## File Organization

- `/src/components/`: Vue components (Messages/, History/, Inputs/, AIEditing/)
- `/src/services/`: Business logic and state management
- `/src/api/`: API integration layer
- `/src/utils/`: Utility functions (darkMode, etc.)
- `/src/assets/`: Static assets and CSS

## Known Patterns

### Quill Content Manipulation

When inserting AI-generated content into Quill:
1. Convert Markdown to HTML via `markdown-it`
2. Use `renderMarkdownToQuill()` to insert into editor
3. Maintain `currentRange` for insertion point
4. Use `ensureElementsVisible()` to scroll to new content

### Monaco Diff Editor

Diff comparison uses aggressive CSS overrides in `util.ts` to remove Monaco's default line/selection backgrounds. The diff editor is dynamically created/disposed on demand.

### Abort Controllers

Both chat and AI editing maintain abort controllers for canceling ongoing requests. Always check if request was aborted before processing completion.

## Configuration Notes

- API credentials stored in localStorage (see `services/appConfig.ts`)
- Default model: `moonshot-v1-8k`
- History message length configurable via Settings (default: 10)
- Chunk size warning limit: 1500KB (vite.config.ts)

## Known Issues & Technical Debt

以下是需要优先处理的已知问题:

**安全性问题**:
- API密钥硬编码在 `services/appConfig.ts:24` - 需要移至环境变量或安全存储

**错误处理**:
- 大部分错误仅 console.error，缺少用户友好的错误提示
- 缺少统一的错误处理机制

**代码质量**:
- `components/AIEditing/index.vue` 超过1000行，需要拆分
- 部分组件混用 Composition API 和 Options API
- 缺少 TypeScript 类型定义的地方（特别是事件处理函数）

**性能优化点**:
- Quill 编辑器重渲染优化
- 大文档导入/导出性能
- IndexedDB 查询优化

**功能完善**:
- 国际化 (i18n) 未完全实现
- 移动端适配不完整
- 缺少单元测试和E2E测试

## Chrome DevTools MCP 调试工具

**MCP 服务器配置**: Chrome DevTools MCP 已安装并配置

### 启动和调试流程

**1. 启动开发服务器**:
```bash
pnpm dev  # 默认运行在 http://localhost:5173/
```

**2. 使用 Chrome MCP 工具**:

Chrome DevTools MCP 提供 26 个浏览器自动化和调试工具，分为以下类别：

**输入自动化** (7个):
- `click` - 点击页面元素
- `fill` - 填充表单字段
- `hover` - 悬停在元素上
- `drag` - 拖拽元素
- `fill_form` - 批量填充表单
- `upload_file` - 上传文件
- `handle_dialog` - 处理浏览器对话框

**导航控制** (7个):
- `navigate_page` - 打开指定 URL
- `list_pages` - 列出所有打开的页面
- `new_page` - 创建新页面标签
- `close_page` - 关闭页面
- `select_page` - 切换到指定页面
- `navigate_page_history` - 浏览器前进/后退
- `wait_for` - 等待元素/内容出现

**调试工具** (4个):
- `list_console_messages` - 获取浏览器控制台消息（检查错误）
- `take_screenshot` - 截取页面截图
- `take_snapshot` - 获取 DOM 快照
- `evaluate_script` - 执行 JavaScript 代码

**性能分析** (3个):
- `performance_start_trace` - 开始性能追踪
- `performance_stop_trace` - 停止追踪并获取数据
- `performance_analyze_insight` - 分析性能洞察

**网络监控** (2个):
- `list_network_requests` - 列出所有网络请求
- `get_network_request` - 获取特定请求详情

**模拟测试** (3个):
- `resize_page` - 调整页面尺寸（测试响应式）
- `emulate_network` - 模拟网络条件（3G/4G/慢速）
- `emulate_cpu` - 模拟 CPU 限制

### 常见调试场景

**检查运行时错误**:
```
请使用 Chrome MCP 打开 http://localhost:5173/ 并检查控制台错误
```

**性能分析**:
```
分析 http://localhost:5173/ 的页面性能指标
```

**网络请求监控**:
```
列出页面加载时的所有网络请求
```

**响应式测试**:
```
将页面调整为移动端尺寸并截图
```

### 启动带远程调试的 Chrome（支持浏览器扩展）

**重要**: 默认的 Chrome MCP 启动方式不支持安装扩展。如需使用 Vue DevTools 等浏览器扩展，需要手动启动带远程调试端口的 Chrome。

**MCP 配置**:
```json
{
  "command": "npx",
  "args": ["chrome-devtools-mcp@latest", "--browserUrl", "http://127.0.0.1:9222"]
}
```

**启动命令**:
```bash
# 1. 关闭所有 Chrome 实例
pkill -f "Google Chrome"

# 2. 启动带远程调试端口的 Chrome
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir="$HOME/.chrome-debug-profile" \
  http://localhost:5173/ &
```

**安装浏览器扩展**:
1. 在启动的 Chrome 中访问 Chrome Web Store
2. 安装需要的扩展（如 Vue.js devtools）
3. 扩展会保存在 `~/.chrome-debug-profile` 配置中
4. 下次启动时会自动加载所有已安装的扩展

**为什么需要这样做**:
- Chrome MCP 默认启动的是隔离实例，不支持扩展
- 使用 `--browserUrl` 连接到现有实例可以使用已安装的扩展
- `--user-data-dir` 指定配置文件目录，保留扩展和设置
- `--remote-debugging-port=9222` 开启远程调试协议

### 使用示例

**启动流程**:
```bash
# 1. 启动开发服务器
pnpm dev

# 2. 启动带调试端口的 Chrome（首次需要安装扩展）
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir="$HOME/.chrome-debug-profile" \
  http://localhost:5173/ &

# 3. Chrome MCP 会自动连接到这个实例
```

**使用 MCP 工具**:
项目启动后，可以直接使用自然语言请求 Chrome MCP 工具：

1. **打开页面**: "请打开开发服务器页面"
2. **检查错误**: "检查浏览器控制台是否有错误"
3. **截图**: "截取当前页面的截图"
4. **性能**: "分析页面的 LCP 和性能指标"
5. **列出页面**: "列出当前打开的所有页面"

**注意**: 此时你可以同时使用 Chrome MCP 工具和浏览器扩展（如 Vue DevTools）。

## Testing

No test framework currently configured. No test files exist in the repository.

**测试建议**:
- 考虑引入 Vitest 作为单元测试框架
- 使用 Playwright 或 Cypress 进行 E2E 测试
- 优先为核心业务逻辑（`services/chat.ts`, `services/useAI.ts`）编写测试
- 使用 Chrome DevTools MCP 进行手动集成测试和调试
