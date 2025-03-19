import { createI18n } from 'vue-i18n'
import { nextTick } from 'vue'
import { isDevelopment, staticHost } from '@/config'

const i18n = createI18n({
    locale: 'zh-CN',
    fallbackLocale: 'zh-CN',
    allowComposition: true,
    messages: {},
    numberFormats: {
        'en-US': {
            currency: {
                style: 'currency',
                currency: 'USD',
                currencyDisplay: 'symbol',
                minimumFractionDigits: 0,
            },
        },
        'zh-CN': {
            currency: {
                style: 'currency',
                currency: 'CNY',
                currencyDisplay: 'symbol',
                minimumFractionDigits: 0,
            },
        },
    },
})

const storageKey = 'westlakechat_locale'
let currentLocale: App.Language = (() => {
    const locale = localStorage.getItem(storageKey)
    if (locale && ['zh-CN', 'en-US'].includes(locale)) {
        return locale as App.Language
    }
    // 浏览器语言中只要包含中文，就默认为中文，不论是否第一语言
    return navigator.languages.some(language => language.startsWith('zh')) ? 'zh-CN' : 'en-US'
})()

export function getLocale() {
    return currentLocale
}

export const t = i18n.global.t
// check if key exists in current locale
export const te = i18n.global.te

const loaded = new Set<string>()
const host = isDevelopment ? '' : staticHost
export async function setLocale(locale: App.Language) {
    try {
        if (!loaded.has(locale)) {
            const message = await fetch(`${host}/locales/${locale}.json`, { cache: 'no-store' }).then(res => res.json())
            i18n.global.setLocaleMessage(locale, message)
            await nextTick()
            loaded.add(locale)
        }
        if (locale !== currentLocale) {
            localStorage.setItem(storageKey, locale)
            currentLocale = locale
        }
        i18n.global.locale = locale
    }
    catch (e) {
        console.error(e)
    }
}
export default i18n
