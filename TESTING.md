# 测试指南

本项目包含完整的单元测试和 E2E 测试框架。

## 技术栈

- **单元测试**: Vitest + @vue/test-utils
- **E2E 测试**: Playwright
- **代码覆盖率**: Vitest Coverage (v8)

## 测试命令

### 单元测试

```bash
# 运行所有单元测试（watch 模式）
pnpm test

# 运行单元测试（单次运行）
pnpm test:run

# 运行单元测试并生成覆盖率报告
pnpm test:coverage

# 打开 Vitest UI 界面
pnpm test:ui
```

### E2E 测试

```bash
# 运行 E2E 测试
pnpm test:e2e

# 打开 Playwright UI 模式
pnpm test:e2e:ui

# 调试模式运行 E2E 测试
pnpm test:e2e:debug
```

### 运行所有测试

```bash
# 运行单元测试和 E2E 测试
pnpm test:all
```

## 测试文件结构

```
/Users/tsk/tt-a1i/chat_edit/
├── src/
│   ├── utils/
│   │   ├── format.ts
│   │   ├── format.test.ts        # 工具函数单元测试
│   │   ├── logger.ts
│   │   └── logger.test.ts        # Logger 单元测试
│   └── stores/
│       ├── app.ts
│       └── app.test.ts           # Store 单元测试
├── tests/
│   └── e2e/
│       ├── app.spec.ts           # 应用基础功能 E2E 测试
│       └── chat.spec.ts          # 聊天功能 E2E 测试
├── vitest.config.ts              # Vitest 配置
└── playwright.config.ts          # Playwright 配置
```

## 编写测试

### 单元测试示例

单元测试文件放在源码旁边，命名为 `*.test.ts`：

```typescript
// src/utils/example.test.ts
import { describe, expect, it } from 'vitest'
import { myFunction } from './example'

describe('myFunction', () => {
  it('应该返回正确的结果', () => {
    expect(myFunction(1, 2)).toBe(3)
  })
})
```

### Vue 组件测试示例

```typescript
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import MyComponent from './MyComponent.vue'

describe('MyComponent', () => {
  it('应该正确渲染', () => {
    const wrapper = mount(MyComponent)
    expect(wrapper.text()).toContain('Expected Text')
  })
})
```

### Pinia Store 测试示例

```typescript
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useMyStore } from './myStore'

describe('useMyStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('应该有正确的初始状态', () => {
    const store = useMyStore()
    expect(store.count).toBe(0)
  })
})
```

### E2E 测试示例

E2E 测试文件放在 `tests/e2e/` 目录：

```typescript
// tests/e2e/example.spec.ts
import { expect, test } from '@playwright/test'

test('示例测试', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Chat.*Edit/i)
})
```

## 测试覆盖率

运行 `pnpm test:coverage` 后，覆盖率报告会生成在以下位置：

- **HTML 报告**: `coverage/index.html` （在浏览器中打开查看）
- **文本报告**: 直接在终端显示
- **LCOV 报告**: `coverage/lcov.info`（可用于 CI 集成）

### 覆盖率目标

当前配置的覆盖率阈值：

- **Lines**: 60%
- **Functions**: 60%
- **Branches**: 60%
- **Statements**: 60%

## 持续集成

### GitHub Actions 示例

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test:run
      - run: pnpm test:e2e
```

## 最佳实践

### 单元测试

1. **测试文件位置**: 与源码文件放在同一目录
2. **命名规范**: `*.test.ts` 或 `*.spec.ts`
3. **测试描述**: 使用清晰的中文描述测试意图
4. **测试隔离**: 每个测试应该独立，不依赖其他测试
5. **Mock 外部依赖**: 使用 `vi.mock()` 模拟外部模块

### E2E 测试

1. **等待策略**: 使用 Playwright 的自动等待，避免硬编码延迟
2. **选择器**: 优先使用语义化选择器（`getByRole`, `getByText`）
3. **测试独立性**: 每个测试应该能独立运行
4. **数据清理**: 测试后清理测试数据
5. **截图和录屏**: 失败时自动保存，帮助调试

## 调试测试

### Vitest

```bash
# 使用 UI 模式调试
pnpm test:ui

# 在特定测试文件上运行
pnpm vitest src/utils/format.test.ts

# 只运行匹配的测试
pnpm vitest --grep "格式化"
```

### Playwright

```bash
# 使用调试模式
pnpm test:e2e:debug

# 使用 UI 模式
pnpm test:e2e:ui

# 只运行特定文件
pnpm playwright test tests/e2e/chat.spec.ts

# 只运行特定测试
pnpm playwright test --grep "应该能够切换暗色模式"
```

## 已有测试覆盖

### 单元测试 (53 个测试)

- ✅ `utils/format.ts` - 22 个测试
  - 时间格式化
  - 模型名称简化
  - 文件大小格式化
  - 文本截断

- ✅ `utils/logger.ts` - 12 个测试
  - 日志级别（debug, info, warn, error）
  - 日志管理（清空、导出）
  - 性能追踪

- ✅ `stores/app.ts` - 19 个测试
  - 场景切换
  - UI 状态管理
  - LocalStorage 持久化
  - 用户设置

### E2E 测试

- ✅ 应用基础功能
  - 应用启动
  - 暗色模式切换
  - 场景切换
  - 侧边栏功能
  - 响应式设计

- ✅ 聊天功能
  - 聊天界面
  - 新建聊天
  - 模型选择
  - 聊天历史
  - 系统提示
  - 设置面板

## 下一步

建议为以下模块添加测试：

1. **核心业务逻辑**
   - `stores/chat.ts` - 聊天状态管理
   - `services/ai.ts` - AI 服务交互
   - `services/database.ts` - 数据库操作

2. **关键组件**
   - `components/chat/ChatInput.vue`
   - `components/chat/ChatMessages.vue`
   - `components/AIEditing/index.vue`

3. **API 集成**
   - `api/api.ts` - API 调用和错误处理
   - SSE 流处理

## 资源链接

- [Vitest 文档](https://vitest.dev/)
- [Playwright 文档](https://playwright.dev/)
- [Vue Test Utils 文档](https://test-utils.vuejs.org/)
- [Testing Library](https://testing-library.com/)
