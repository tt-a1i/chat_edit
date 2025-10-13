# Chat & Edit

一个功能强大的 AI 聊天与编辑工具

## 功能特性

### 聊天场景
- 支持多种 AI 模型
- 流式响应体验
- 多模态支持（文本+图片）
- 会话历史管理
- 系统提示词配置
- 对话导入/导出

### AI 编辑场景
- 基于 Quill 2.0 的富文本编辑器
- AI 智能文本处理：
  - 润色文本
  - 改写内容
  - 翻译文档
  - 代码生成与解释
  - 命令生成
  - 摘要提取
- Monaco 编辑器对比视图
- 多格式导出：PDF、DOCX、Markdown、HTML
- 数学公式支持（KaTeX）
- 代码高亮（highlight.js）
- 表格编辑

### 技术亮点
- 实时流式响应
- 离线优先
- 本地数据存储（IndexedDB）

## 技术栈

- **前端框架**: Vue 3 (Composition API)
- **构建工具**: Vite 5
- **语言**: TypeScript
- **UI 组件**: Naive UI + Tailwind CSS
- **编辑器**: Quill 2.0 + Monaco Editor
- **Markdown 渲染**: markdown-it + 插件
- **数据持久化**: Dexie.js (IndexedDB)
- **AI 服务**: Moonshot AI API
- **代码规范**: @antfu/eslint-config

## 快速开始

### 环境要求

- Node.js >= 18
- Bun >= 1.3.0

### 安装依赖

\`\`\`bash
bun install
\`\`\`

### 配置环境变量

复制 `.env.example` 到 `.env.local` 并配置：

\`\`\`bash
cp .env.example .env.local
\`\`\`

编辑 `.env.local`：

\`\`\`env
VITE_API_BASE_URL=https://api.moonshot.cn
VITE_API_KEY=your_api_key_here
\`\`\`

### 开发

\`\`\`bash
bun dev
\`\`\`

访问 http://localhost:5173/

### 构建

\`\`\`bash
bun build
\`\`\`

### 预览生产构建

\`\`\`bash
bun preview
\`\`\`

## 代码规范

### Linting

\`\`\`bash
# 检查代码
bun lint

# 自动修复
bun lint:fix
\`\`\`

### 类型检查

\`\`\`bash
bun typecheck
\`\`\`

## 项目结构

\`\`\`
src/
├── api/              # API 接口层
├── assets/           # 静态资源
├── components/       # Vue 组件
│   ├── AIEditing/   # AI 编辑相关组件
│   ├── History/     # 历史记录组件
│   ├── Inputs/      # 输入组件
│   └── Messages/    # 消息组件
├── config/          # 配置文件
├── services/        # 业务逻辑层
├── utils/           # 工具函数
├── App.vue          # 根组件
└── main.ts          # 入口文件
\`\`\`

## 开发指南

详细的开发指南请参考 [CLAUDE.md](./CLAUDE.md)

## 调试

本项目支持使用 Chrome DevTools MCP 进行调试：

\`\`\`bash
# 启动开发服务器
bun dev

# 启动带扩展的 Chrome 调试实例
/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome \\
  --remote-debugging-port=9222 \\
  --user-data-dir="$HOME/.chrome-debug-profile" \\
  http://localhost:5173/ &
\`\`\`

## License

MIT
