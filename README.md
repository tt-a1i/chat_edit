# Chat & Edit

一个双模式 AI 应用，结合了传统聊天界面和富文本 AI 编辑功能。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## 预览

[在线演示](#) <!-- 如有部署链接可填入 -->

## 功能特性

### 聊天场景

- **流式响应** - 实时流式 Markdown 渲染，支持 Mermaid 图表和代码高亮
- **多模态支持** - 文本 + 图片输入
- **会话管理** - 多会话历史、导入/导出、系统提示词配置
- **模型切换** - 支持多种 Moonshot AI 模型

### AI 编辑场景

- **富文本编辑** - 基于 Quill 2.0 的编辑器，支持表格
- **AI 智能处理** - 润色、改写、翻译、代码生成、摘要提取
- **对比视图** - Monaco Editor 差异对比
- **多格式导出** - PDF、DOCX、Markdown、HTML
- **数学公式** - KaTeX 渲染支持
- **代码高亮** - Shiki + highlight.js

### 技术亮点

- **离线优先** - IndexedDB 本地数据存储
- **暗色模式** - 系统主题同步
- **响应式设计** - 适配桌面和移动端
- **完整测试** - 单元测试 + E2E 测试覆盖

## 技术栈

| 分类 | 技术 |
|------|------|
| **框架** | Vue 3.5 (Composition API) + TypeScript |
| **构建** | Vite 5 |
| **状态管理** | Pinia |
| **UI** | Naive UI + Tailwind CSS |
| **编辑器** | Quill 2.0 + Monaco Editor |
| **Markdown** | markdown-it + markstream-vue + Mermaid |
| **数据库** | Dexie.js (IndexedDB) |
| **AI 服务** | Moonshot AI API |
| **测试** | Vitest + Playwright |
| **代码规范** | ESLint (@antfu/eslint-config) + Husky + lint-staged |

## 快速开始

### 环境要求

- Node.js >= 18
- pnpm >= 10 (或 bun >= 1.0)

### 安装

```bash
# 克隆项目
git clone https://github.com/tt-a1i/chat_edit.git
cd chat_edit

# 安装依赖
pnpm install
```

### 配置环境变量

```bash
cp .env.example .env.local
```

编辑 `.env.local`：

```env
VITE_API_BASE_URL=https://api.moonshot.cn
VITE_API_KEY=your_api_key_here
```

### 开发

```bash
pnpm dev
```

访问 http://localhost:5173/

### 构建

```bash
pnpm build
```

### 预览生产构建

```bash
pnpm preview
```

## 命令一览

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发服务器 |
| `pnpm build` | 构建生产版本 |
| `pnpm preview` | 预览生产构建 |
| `pnpm lint` | 代码检查 |
| `pnpm lint:fix` | 自动修复代码问题 |
| `pnpm typecheck` | TypeScript 类型检查 |
| `pnpm test` | 运行单元测试 (watch 模式) |
| `pnpm test:run` | 运行单元测试 (单次) |
| `pnpm test:coverage` | 运行测试并生成覆盖率报告 |
| `pnpm test:e2e` | 运行 E2E 测试 |
| `pnpm test:all` | 运行所有测试 |

## 项目结构

```
src/
├── api/                  # API 接口层
├── assets/               # 静态资源和全局样式
├── components/           # Vue 组件
│   ├── AIEditing/        # AI 编辑器模块
│   │   ├── components/   # 子组件
│   │   ├── composables/  # 组合式函数
│   │   └── utils/        # 工具函数
│   ├── chat/             # 聊天功能模块
│   │   └── messages/     # 消息类型组件
│   ├── common/           # 通用组件
│   ├── history/          # 历史记录组件
│   ├── inputs/           # 输入组件
│   └── settings/         # 设置模块
├── config/               # 配置文件
├── services/             # 业务逻辑层
├── stores/               # Pinia 状态管理
├── utils/                # 工具函数
├── App.vue               # 根组件
└── main.ts               # 入口文件
```

## 测试

项目包含完整的测试框架：

- **单元测试**: Vitest + @vue/test-utils (53 个测试)
- **E2E 测试**: Playwright
- **代码覆盖率**: Vitest Coverage (v8)

详细测试指南请参考 [TESTING.md](./TESTING.md)

## 开发指南

详细的开发文档请参考 [CLAUDE.md](./CLAUDE.md)

### 调试

支持使用 Chrome DevTools MCP 进行调试：

```bash
# 启动开发服务器
pnpm dev

# 启动带扩展的 Chrome 调试实例
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir="$HOME/.chrome-debug-profile" \
  http://localhost:5173/ &
```

### Git Hooks

项目配置了 Husky + lint-staged，提交前自动执行：
- ESLint 代码检查和修复
- TypeScript 类型检查

## 贡献

欢迎提交 Issue 和 Pull Request！

## License

[MIT](LICENSE)
