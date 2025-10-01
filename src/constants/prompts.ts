/**
 * 系统提示词配置
 */

export interface PromptTemplate {
  id: string
  name: string
  name_en: string
  template: string
  en_name: string
}

/**
 * 系统预设提示词
 */
export const SYSTEM_PROMPTS: PromptTemplate[] = [
  {
    id: '1',
    name: '继续写',
    name_en: 'Continue Writing',
    template: '请继续写下面的内容，保持风格和语气一致：',
    en_name: '✍️',
  },
  {
    id: '2',
    name: '翻译',
    name_en: 'Translate',
    template: '请将以下文本翻译成中文/英文（根据原文语言自动判断）：',
    en_name: '🌐',
  },
  {
    id: '3',
    name: '润色文本',
    name_en: 'Polish Text',
    template: '请对以下文本进行润色，提升语言表达质量，但保持原意不变：',
    en_name: '✨',
  },
  {
    id: '4',
    name: '扩写内容',
    name_en: 'Expand Content',
    template: '请扩展以下文本，添加更多细节、例子或解释，使其更加全面：',
    en_name: '📈',
  },
  {
    id: '5',
    name: '缩写内容',
    name_en: 'Condense Content',
    template: '请将以下文本精简，保留关键信息但使其更加简洁：',
    en_name: '📉',
  },
  {
    id: '6',
    name: '总结要点',
    name_en: 'Summarize',
    template: '请总结以下文本的主要观点和要点：',
    en_name: '📋',
  },
]
