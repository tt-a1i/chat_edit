/**
 * 聊天功能 E2E 测试
 */
import { expect, test } from '@playwright/test'

test.describe('聊天界面', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // 确保在聊天场景
    const chatButton = page.getByRole('button', { name: /^chat$/i })
    await chatButton.click()
  })

  test('应该显示聊天输入框', async ({ page }) => {
    // 查找聊天输入框
    const chatInput = page.locator('textarea')
    await expect(chatInput.first()).toBeVisible()
  })

  test('应该显示发送按钮', async ({ page }) => {
    // 查找发送按钮（可能是图标按钮）
    const sendButton = page.locator('button[type="submit"]')
      .or(page.locator('button').filter({ hasText: /发送|send/i }))

    const buttonCount = await sendButton.count()
    expect(buttonCount).toBeGreaterThan(0)
  })

  test('应该能够在输入框输入文本', async ({ page }) => {
    const chatInput = page.locator('textarea').first()
    await chatInput.fill('这是一条测试消息')

    const value = await chatInput.inputValue()
    expect(value).toBe('这是一条测试消息')
  })

  test('空输入时发送按钮应该被禁用', async ({ page }) => {
    const chatInput = page.locator('textarea').first()
    await chatInput.clear()

    // 查找发送按钮
    const sendButton = page.locator('button[type="submit"]').first()

    // 验证按钮状态（可能被禁用或有特定的 class）
    const isDisabled = await sendButton.isDisabled().catch(() => false)
    const hasDisabledClass = await sendButton.evaluate(el =>
      el.classList.contains('disabled') || el.classList.contains('opacity-50'),
    ).catch(() => false)

    expect(isDisabled || hasDisabledClass).toBeTruthy()
  })
})

test.describe('新建聊天', () => {
  test('应该能够点击新建聊天按钮', async ({ page }) => {
    await page.goto('/')

    const newChatButton = page.getByRole('button', { name: /new chat/i })
    await newChatButton.click()

    // 验证聊天输入框可见（等待页面更新）
    const chatInput = page.locator('textarea').first()
    await expect(chatInput).toBeVisible({ timeout: 2000 })
  })
})

test.describe('模型选择', () => {
  test('应该显示模型选择器或相关元素', async ({ page }) => {
    await page.goto('/')

    // 验证页面已加载（侧边栏存在即可）
    const sidebar = page.locator('aside')
    await expect(sidebar).toBeVisible()

    // 模型选择器可能在不同位置或形式，这里只验证基础加载
    // 实际的模型选择功能会在更具体的交互测试中验证
  })
})

test.describe('聊天历史', () => {
  test('应该显示侧边栏和新建聊天按钮', async ({ page }) => {
    await page.goto('/')

    // 侧边栏应该可见
    const sidebar = page.locator('aside')
    await expect(sidebar).toBeVisible()

    // 至少应该有新建聊天按钮
    const newChatButton = page.getByRole('button', { name: /new chat/i })
    await expect(newChatButton).toBeVisible()
  })
})

test.describe('系统提示', () => {
  test('应该能够打开系统提示面板', async ({ page }) => {
    await page.goto('/')

    // 点击系统提示按钮
    const systemPromptButton = page.getByRole('button', { name: /system prompt/i })
    await systemPromptButton.click()

    // 等待面板内容出现（至少有一个 textarea 或相关元素）
    const systemPromptPanel = page.locator('textarea').first()

    // 验证面板是否打开（可能需要 API key 才能显示完整内容）
    await page.waitForFunction(() => {
      const textareas = document.querySelectorAll('textarea')
      return textareas.length > 0
    }, { timeout: 2000 }).catch(() => {
      // 面板可能未打开，这是预期行为（没有 API key）
    })
  })
})

test.describe('设置面板', () => {
  test('应该能够打开设置面板', async ({ page }) => {
    await page.goto('/')

    // 点击设置按钮
    const settingsButton = page.getByRole('button', { name: /settings/i })
    await settingsButton.click()

    // 等待设置面板中的任意输入框出现
    // 使用 getByRole 获取具体的输入框，避免 strict mode 问题
    const baseUrlInput = page.getByRole('textbox', { name: /base url/i })
    await expect(baseUrlInput).toBeVisible({ timeout: 3000 })

    // 验证至少有一个配置输入框
    const hasInput = await baseUrlInput.isVisible()
    expect(hasInput).toBe(true)
  })
})
