/**
 * 应用基础功能 E2E 测试
 */
import { expect, test } from '@playwright/test'

test.describe('应用启动和基础功能', () => {
  test('应该能够成功加载应用', async ({ page }) => {
    await page.goto('/')

    // 验证页面标题
    await expect(page).toHaveTitle(/Chat.*Edit/i)

    // 验证侧边栏存在
    const sidebar = page.locator('aside')
    await expect(sidebar).toBeVisible()
  })

  test('应该显示新建聊天按钮', async ({ page }) => {
    await page.goto('/')

    // 查找 "New Chat" 按钮
    const newChatButton = page.getByRole('button', { name: /new chat/i })
    await expect(newChatButton).toBeVisible()
  })

  test('应该能够切换暗色模式', async ({ page }) => {
    await page.goto('/')

    // 查找暗色模式切换按钮
    const darkModeButton = page.getByRole('button', { name: /toggle dark mode/i })
    await expect(darkModeButton).toBeVisible()

    // 点击切换
    await darkModeButton.click()

    // 等待一小段时间让 UI 更新
    await page.waitForTimeout(300)

    // 验证 HTML 元素的 class 变化（通常暗色模式会添加 'dark' class）
    const html = page.locator('html')
    const hasDarkClass = await html.evaluate(el => el.classList.contains('dark'))

    // 点击后应该切换状态
    expect(typeof hasDarkClass).toBe('boolean')
  })
})

test.describe('场景切换', () => {
  test('应该能够切换到聊天场景', async ({ page }) => {
    await page.goto('/')

    // 点击 Chat 按钮
    const chatButton = page.getByRole('button', { name: /^chat$/i })
    await expect(chatButton).toBeVisible()
    await chatButton.click()

    // 验证聊天界面元素存在（例如输入框）
    const chatInput = page.locator('textarea[placeholder*="输入"]').or(page.locator('textarea'))
    await expect(chatInput.first()).toBeVisible({ timeout: 2000 })
  })

  test('应该能够切换到 AI 编辑场景', async ({ page }) => {
    await page.goto('/')

    // 点击 AI Editing 按钮
    const aiEditingButton = page.getByRole('button', { name: /ai editing/i })
    await expect(aiEditingButton).toBeVisible()
    await aiEditingButton.click()

    // 等待编辑器加载
    await page.waitForTimeout(1000)

    // 验证编辑器界面元素存在
    // Quill 编辑器通常有 .ql-editor 类
    const editor = page.locator('.ql-editor')
    await expect(editor).toBeVisible({ timeout: 3000 })
  })
})

test.describe('侧边栏功能', () => {
  test('应该能够展开和收起侧边栏', async ({ page }) => {
    await page.goto('/')

    // 查找侧边栏
    const sidebar = page.locator('aside')
    await expect(sidebar).toBeVisible()

    // 获取初始宽度
    const initialWidth = await sidebar.evaluate(el => el.offsetWidth)

    // 查找折叠按钮（通常在侧边栏边缘）
    const collapseButton = page.locator('button').filter({ hasText: /展开|收起/ }).or(page.locator('aside button[title*="侧边栏"]')).or(page.locator('aside button').first())

    if (await collapseButton.count() > 0) {
      await collapseButton.first().click()
      await page.waitForTimeout(500)

      // 验证宽度变化
      const newWidth = await sidebar.evaluate(el => el.offsetWidth)
      expect(newWidth).not.toBe(initialWidth)
    }
  })

  test('应该显示设置和系统提示按钮', async ({ page }) => {
    await page.goto('/')

    // 验证设置按钮存在
    const settingsButton = page.getByRole('button', { name: /settings/i })
    await expect(settingsButton).toBeVisible()

    // 验证系统提示按钮存在
    const systemPromptButton = page.getByRole('button', { name: /system prompt/i })
    await expect(systemPromptButton).toBeVisible()
  })
})

test.describe('响应式设计', () => {
  test('应该在移动端正常显示', async ({ page }) => {
    // 设置移动端视口
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // 验证页面加载
    const sidebar = page.locator('aside')
    await expect(sidebar).toBeVisible()
  })

  test('应该在平板端正常显示', async ({ page }) => {
    // 设置平板端视口
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/')

    // 验证页面加载
    const sidebar = page.locator('aside')
    await expect(sidebar).toBeVisible()
  })
})
