import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError, ErrorCode, ErrorHandler } from './error-handler'
import { logger } from './logger'

// Mock logger
vi.mock('./logger', () => ({
  logger: {
    error: vi.fn(),
  },
}))

describe('ErrorHandler', () => {
  const originalMessage = window.$message

  beforeEach(() => {
    // Mock window.$message
    window.$message = {
      info: vi.fn(),
      success: vi.fn(),
      warning: vi.fn(),
      error: vi.fn(),
      loading: vi.fn(),
    }
  })

  afterEach(() => {
    window.$message = originalMessage
    vi.clearAllMocks()
  })

  describe('handle', () => {
    it('should handle Error object correctly', async () => {
      const error = new Error('Test error')
      const result = ErrorHandler.handle(error)

      expect(result).toBeInstanceOf(AppError)
      expect(result.code).toBe(ErrorCode.UNKNOWN_ERROR)
      expect(result.userMessage).toBe('操作失败，请重试')
      expect(result.originalError).toBe(error)

      // 等待 logger 异步调用
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(logger.error).toHaveBeenCalled()
      expect(window.$message.error).toHaveBeenCalledWith('操作失败，请重试')
    })

    it('should handle AppError object correctly', async () => {
      const appError = new AppError(ErrorCode.NETWORK_ERROR, 'Network failed')
      const result = ErrorHandler.handle(appError)

      expect(result).toBe(appError)

      // 等待 logger 异步调用
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(logger.error).toHaveBeenCalled()
      expect(window.$message.error).toHaveBeenCalledWith('Network failed')
    })

    it('should respect silent option', async () => {
      const error = new Error('Silent error')
      ErrorHandler.handle(error, { silent: true })

      // 等待 logger 异步调用
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(logger.error).toHaveBeenCalled()
      expect(window.$message.error).not.toHaveBeenCalled()
    })
  })

  describe('asyncHandler', () => {
    it('should return result on success', async () => {
      const fn = vi.fn().mockResolvedValue('success')
      const result = await ErrorHandler.asyncHandler(
        fn,
        ErrorCode.API_ERROR,
      )

      expect(result).toBe('success')
      expect(window.$message.error).not.toHaveBeenCalled()
    })

    it('should handle error on failure', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Async failure'))
      const result = await ErrorHandler.asyncHandler(
        fn,
        ErrorCode.API_ERROR,
        'Custom error message'
      )

      expect(result).toBeNull()

      // 等待 logger 异步调用
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(window.$message.error).toHaveBeenCalledWith('Custom error message')
    })
  })

  describe('syncHandler', () => {
    it('should return result on success', () => {
      const fn = vi.fn().mockReturnValue('success')
      const result = ErrorHandler.syncHandler(
        fn,
        ErrorCode.VALIDATION_ERROR,
      )

      expect(result).toBe('success')
      expect(window.$message.error).not.toHaveBeenCalled()
    })

    it('should handle error on failure', async () => {
      const fn = vi.fn().mockImplementation(() => {
        throw new Error('Sync failure')
      })
      const result = ErrorHandler.syncHandler(
        fn,
        ErrorCode.VALIDATION_ERROR,
      )

      expect(result).toBeNull()

      // 等待 logger 异步调用
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(window.$message.error).toHaveBeenCalled()
    })
  })
})
