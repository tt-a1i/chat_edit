# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Language Preference

**请使用中文回复所有对话和代码注释。** All responses, explanations, and code comments should be in Chinese (Simplified).

## Project Background

**当前状态**: 这是一个处于持续开发阶段的项目，代码库正在进行重构和优化。

## Skill 使用规范

- **页面开发或 UI 修改时**：使用 `frontend-design` skill
- **代码审查时**：使用 `code-review-excellence` skill

## Project Overview

A dual-mode AI application combining:
- **Chat Scene**: Traditional conversational AI interface with streaming responses
- **AI Editing Scene**: Rich text editor (Quill) with AI-powered text manipulation features

Built with Vue 3 + TypeScript + Vite, using Moonshot AI API for LLM capabilities.

## Development Commands

```bash
# Development server
bun dev

# Build (includes TypeScript type checking)
bun build

# Preview production build
bun preview

# Linting
bun lint
bun lint:fix

# Type checking
bun typecheck

# Testing
bun test              # Unit tests (watch mode)
bun test:run          # Unit tests (single run)
bun test:coverage     # Unit tests with coverage
bun test:ui           # Vitest UI
bun test:e2e          # E2E tests
bun test:e2e:ui       # Playwright UI
bun test:all          # Run all tests
```

**Package Manager**: This project uses `bun` (version 1.2.14 specified in package.json).

**Testing**: 详见 [TESTING.md](./TESTING.md) 查看完整测试指南。

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

**优化后的目录结构**（2024-10-03 重构完成）：

```
/src/
  ├── components/              # Vue 组件
  │   ├── AIEditing/           # AI 编辑器模块（独立）
  │   ├── chat/                # 聊天功能模块
  │   │   ├── messages/        # 消息类型组件
  │   │   │   ├── AiMessage.vue
  │   │   │   ├── UserMessage.vue
  │   │   │   └── SystemMessage.vue
  │   │   ├── ChatMessage.vue  # 消息路由组件
  │   │   ├── ChatMessages.vue # 消息列表容器
  │   │   ├── ChatInput.vue
  │   │   ├── ChatEmptyState.vue
  │   │   └── SystemPrompt.vue
  │   ├── common/              # 通用组件
  │   ├── history/             # 历史记录组件
  │   ├── inputs/              # 输入组件
  │   └── settings/            # 设置模块
  ├── services/                # 业务逻辑和状态管理
  ├── api/                     # API 集成层
  ├── utils/                   # 工具函数
  │   ├── markdown.ts          # Markdown 渲染工具
  │   ├── error-handler.ts
  │   ├── format.ts
  │   └── logger.ts
  └── assets/                  # 静态资源和 CSS
```

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
- API密钥已通过环境变量管理 (`config/env.ts`)，确保 `.env.local` 不提交到代码库

## Chrome DevTools MCP 调试工具

**MCP 服务器配置**: Chrome DevTools MCP 已安装并配置

### 启动和调试流程

**1. 启动开发服务器**:
```bash
pnpm dev  # 默认运行在 http://localhost:5173/
```

**2. 如果用户要求了，使用 Chrome MCP 工具**:

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

**默认启动方式**（推荐）:
```bash
# 启动带远程调试端口的 Chrome（不关闭现有实例）
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir="$HOME/.chrome-debug-profile" \
  http://localhost:5173/ &
```

**说明**:
- 这会启动一个新的 Chrome 实例，与现有 Chrome 实例共存
- 使用独立的配置目录 `~/.chrome-debug-profile`，不影响日常使用的 Chrome
- 自动连接到远程调试端口 9222
- 如果需要全新启动，可以先执行 `pkill -f "Google Chrome"` 关闭所有 Chrome 实例

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

```

## Testing

### 测试框架

项目已配置完整的测试框架：

- **单元测试**: Vitest + @vue/test-utils
- **E2E 测试**: Playwright
- **代码覆盖率**: Vitest Coverage (v8)

### 已有测试覆盖

**单元测试 (53 个测试)** ✅
- `src/utils/format.test.ts` - 22 个测试（工具函数）
- `src/utils/logger.test.ts` - 12 个测试（日志系统）
- `src/stores/app.test.ts` - 19 个测试（应用状态管理）

**E2E 测试** ✅
- `tests/e2e/app.spec.ts` - 应用基础功能
- `tests/e2e/chat.spec.ts` - 聊天功能

### 运行测试

```bash
pnpm test              # 单元测试（watch 模式）
pnpm test:run          # 单元测试（单次运行）
pnpm test:coverage     # 代码覆盖率报告
pnpm test:e2e          # E2E 测试
pnpm test:all          # 运行所有测试
```

**❌ 不要包含**:
- `🤖 Generated with [Claude Code](https://claude.com/claude-code)`
- `Co-Authored-By: Claude <noreply@anthropic.com>`

### Pull Request 格式

创建 PR 时，，**不要**包含 Claude Code 信息：

