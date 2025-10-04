/**
 * 格式化工具函数测试
 */
import { describe, expect, it } from 'vitest'
import { formatFileSize, formatSmartTime, simplifyModelName, truncateText } from './format'

describe('formatSmartTime', () => {
  it('应该格式化今天的时间为 "今天 HH:mm"', () => {
    const now = new Date()
    const result = formatSmartTime(now)
    expect(result).toMatch(/^今天 \d{2}:\d{2}$/)
  })

  it('应该格式化昨天的时间为 "昨天 HH:mm"', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const result = formatSmartTime(yesterday)
    expect(result).toMatch(/^昨天 \d{2}:\d{2}$/)
  })

  it('应该格式化本周的时间为 "周X HH:mm"', () => {
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    const result = formatSmartTime(threeDaysAgo)
    expect(result).toMatch(/^周[一二三四五六日] \d{2}:\d{2}$/)
  })

  it('应该格式化更早的时间为 "MM-DD"', () => {
    const longAgo = new Date()
    longAgo.setDate(longAgo.getDate() - 30)
    const result = formatSmartTime(longAgo)
    expect(result).toMatch(/^\d{2}-\d{2}$/)
  })

  it('应该正确填充时间前导零', () => {
    const date = new Date(2024, 0, 1, 9, 5) // 09:05
    const result = formatSmartTime(date)
    expect(result).toBe('01-01')
  })
})

describe('simplifyModelName', () => {
  it('应该移除 moonshot 前缀', () => {
    expect(simplifyModelName('moonshot-v1-8k')).toBe('v1-8k')
  })

  it('应该移除 kimi 前缀', () => {
    expect(simplifyModelName('kimi-k2-0905-preview')).toBe('k2-0905')
  })

  it('应该移除 preview 后缀', () => {
    expect(simplifyModelName('moonshot-v1-32k-vision-preview')).toBe('v1-32k-vision')
  })

  it('应该截断过长的名称', () => {
    const longName = 'moonshot-v1-32k-vision-special-extra-long'
    const result = simplifyModelName(longName)
    expect(result.length).toBeLessThanOrEqual(15)
  })

  it('应该处理空字符串', () => {
    expect(simplifyModelName('')).toBe('')
  })

  it('应该处理已简化的名称', () => {
    expect(simplifyModelName('v1-8k')).toBe('v1-8k')
  })
})

describe('formatFileSize', () => {
  it('应该格式化 0 字节', () => {
    expect(formatFileSize(0)).toBe('0 B')
  })

  it('应该格式化字节', () => {
    expect(formatFileSize(512)).toBe('512 B')
  })

  it('应该格式化 KB', () => {
    expect(formatFileSize(1024)).toBe('1 KB')
    expect(formatFileSize(2048)).toBe('2 KB')
  })

  it('应该格式化 MB', () => {
    expect(formatFileSize(1048576)).toBe('1 MB')
    expect(formatFileSize(5242880)).toBe('5 MB')
  })

  it('应该格式化 GB', () => {
    expect(formatFileSize(1073741824)).toBe('1 GB')
  })

  it('应该四舍五入到最接近的整数', () => {
    expect(formatFileSize(1536)).toBe('2 KB') // 1.5 KB -> 2 KB
  })
})

describe('truncateText', () => {
  it('应该截断超过最大长度的文本', () => {
    const text = '这是一段很长的文本内容'
    expect(truncateText(text, 5)).toBe('这是一段很...')
  })

  it('应该保留短于最大长度的文本', () => {
    const text = '短文本'
    expect(truncateText(text, 10)).toBe('短文本')
  })

  it('应该处理空字符串', () => {
    expect(truncateText('', 10)).toBe('')
  })

  it('应该处理 null/undefined', () => {
    expect(truncateText(null as unknown as string, 10)).toBe(null)
    expect(truncateText(undefined as unknown as string, 10)).toBe(undefined)
  })

  it('应该在截断后添加省略号', () => {
    const text = 'Hello World'
    const result = truncateText(text, 5)
    expect(result).toBe('Hello...')
    expect(result.length).toBe(8) // 5 + '...'
  })
})
