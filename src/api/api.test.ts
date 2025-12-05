import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { useApi } from './api'
import { ErrorCode, ErrorHandler } from '@/utils/error-handler'

// Mock globals
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock ErrorHandler
vi.mock('@/utils/error-handler', async () => {
  const actual = await vi.importActual('@/utils/error-handler')
  return {
    ...actual,
    ErrorHandler: {
      handle: vi.fn((err) => err),
    },
    toError: actual.toError,
  }
})

describe('useApi', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('generateChat', () => {
    it('should handle AbortError silently', async () => {
      const { generateChat } = useApi()
      const abortError = new Error('Aborted')
      abortError.name = 'AbortError'

      mockFetch.mockRejectedValue(abortError)

      const result = await generateChat(
        { model: 'test', messages: [] },
        vi.fn()
      )

      expect(result).toEqual([])
      expect(ErrorHandler.handle).not.toHaveBeenCalled()
    })

    it('should handle other errors via ErrorHandler', async () => {
      const { generateChat } = useApi()
      const error = new Error('Network Error')

      mockFetch.mockRejectedValue(error)

      const result = await generateChat(
        { model: 'test', messages: [] },
        vi.fn()
      )

      expect(result).toEqual([])
      expect(ErrorHandler.handle).toHaveBeenCalledWith(error)
    })
  })

  // We can add more tests for model management if needed, but the focus was on error handling
})
