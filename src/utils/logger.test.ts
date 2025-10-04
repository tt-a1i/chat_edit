/**
 * Logger 工具测试
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { logger } from './logger'

describe('logger', () => {
  // Mock console methods
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    logger.clearLogs()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('debug', () => {
    it('应该在开发环境记录调试日志', () => {
      logger.debug('测试调试信息', { test: true })

      const logs = logger.getLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].level).toBe('debug')
      expect(logs[0].message).toBe('测试调试信息')
      expect(logs[0].data).toEqual({ test: true })
    })
  })

  describe('info', () => {
    it('应该记录信息日志', () => {
      logger.info('测试信息', { info: 'data' })

      expect(console.info).toHaveBeenCalledWith(
        '[INFO] 测试信息',
        { info: 'data' },
      )

      const logs = logger.getLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].level).toBe('info')
    })
  })

  describe('warn', () => {
    it('应该记录警告日志', () => {
      logger.warn('测试警告', { warning: true })

      expect(console.warn).toHaveBeenCalledWith(
        '[WARN] 测试警告',
        { warning: true },
      )

      const logs = logger.getLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].level).toBe('warn')
    })
  })

  describe('error', () => {
    it('应该记录错误日志', () => {
      const error = new Error('测试错误')
      logger.error('错误发生', error, { context: 'test' })

      expect(console.error).toHaveBeenCalled()

      const logs = logger.getLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].level).toBe('error')
      expect(logs[0].message).toBe('错误发生')
    })

    it('应该包含错误堆栈信息', () => {
      const error = new Error('测试错误')
      logger.error('错误发生', error)

      const logs = logger.getLogs()
      const errorInfo = logs[0].data as Record<string, unknown>
      expect(errorInfo.error).toContain('Error: 测试错误')
    })
  })

  describe('日志管理', () => {
    it('应该限制日志数量不超过 maxLogs', () => {
      // 添加超过 100 条日志
      for (let i = 0; i < 150; i++) {
        logger.info(`日志 ${i}`)
      }

      const logs = logger.getLogs()
      expect(logs.length).toBeLessThanOrEqual(100)
    })

    it('应该能够清空日志', () => {
      logger.info('测试日志 1')
      logger.warn('测试日志 2')
      expect(logger.getLogs()).toHaveLength(2)

      logger.clearLogs()
      expect(logger.getLogs()).toHaveLength(0)
    })

    it('应该能够导出日志为 JSON', () => {
      logger.info('测试日志')
      const exported = logger.exportLogs()
      expect(exported).toBeTruthy()
      expect(() => JSON.parse(exported)).not.toThrow()
    })
  })

  describe('性能追踪', () => {
    it('应该能够追踪同步函数性能', () => {
      const fn = () => {
        let sum = 0
        for (let i = 0; i < 1000; i++) {
          sum += i
        }
        return sum
      }

      const result = logger.performance('测试计算', fn)
      expect(result).toBe(499500)
    })

    it('应该能够追踪异步函数性能', async () => {
      const asyncFn = async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        return 'completed'
      }

      const result = await logger.performance('异步测试', asyncFn)
      expect(result).toBe('completed')
    })
  })

  describe('日志条目', () => {
    it('应该包含时间戳', () => {
      logger.info('测试')
      const logs = logger.getLogs()
      expect(logs[0].timestamp).toBeInstanceOf(Date)
    })

    it('应该保持日志顺序', () => {
      logger.info('第一条')
      logger.warn('第二条')
      logger.error('第三条')

      const logs = logger.getLogs()
      expect(logs[0].message).toBe('第一条')
      expect(logs[1].message).toBe('第二条')
      expect(logs[2].message).toBe('第三条')
    })
  })
})
