import { describe, expect, it, vi } from 'vitest'
import { useAI } from './ai'

// Mock dependencies
const mockGenerateChat = vi.fn()

vi.mock('@/api/api', () => ({
  useApi: () => ({
    generateChat: mockGenerateChat,
  }),
}))

describe('useAI', () => {
  const { generate } = useAI()

  it('should call generateChat with correct parameters', async () => {
    const messages = [
      { id: 1, chatId: 1, role: 'user', content: 'Hello', createdAt: new Date() },
    ]
    const onMessage = vi.fn()
    const onDone = vi.fn()

    mockGenerateChat.mockImplementation(async (req, callback) => {
      // Simulate streaming response
      callback({
        done: false,
        message: { role: 'assistant', content: 'Hi' },
      })
      callback({
        done: true,
        message: { role: 'assistant', content: '' },
      })
      return []
    })

    await generate(
      'test-model',
      messages,
      undefined,
      10,
      onMessage,
      onDone
    )

    expect(mockGenerateChat).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'test-model',
        messages: [{ role: 'user', content: 'Hello' }],
      }),
      expect.any(Function)
    )

    expect(onMessage).toHaveBeenCalled()
    expect(onDone).toHaveBeenCalled()
  })

  it('should handle multi-modal content correctly', async () => {
    const messages = [
      {
        id: 1,
        chatId: 1,
        role: 'user',
        content: 'Describe image',
        imageUrl: 'http://example.com/image.jpg',
        createdAt: new Date()
      },
    ]

    await generate(
      'test-model',
      messages,
      undefined,
      10
    )

    expect(mockGenerateChat).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: 'http://example.com/image.jpg' } },
              { type: 'text', text: 'Describe image' },
            ],
          },
        ],
      }),
      expect.any(Function)
    )
  })

  it('should include system prompt if provided', async () => {
    const messages = [
      { id: 1, chatId: 1, role: 'user', content: 'Hello', createdAt: new Date() },
    ]
    const systemMessage = {
      id: 0,
      chatId: 1,
      role: 'system',
      content: 'You are a helper',
      createdAt: new Date(),
    }

    await generate(
      'test-model',
      messages,
      systemMessage,
      10
    )

    expect(mockGenerateChat).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [
          { role: 'system', content: 'You are a helper' },
          { role: 'user', content: 'Hello' },
        ],
      }),
      expect.any(Function)
    )
  })
})
