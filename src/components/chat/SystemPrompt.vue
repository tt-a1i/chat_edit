<script setup lang="ts">
import { IconWritingSign } from '@tabler/icons-vue'
import { useTextareaAutosize } from '@vueuse/core'
import { createDiscreteApi } from 'naive-ui'
import { onMounted, ref } from 'vue'
import { env } from '@/config/env'
import { useConfigStore } from '@/stores'

const configStore = useConfigStore()
const currentModel = env.model
const { textarea } = useTextareaAutosize()
const configInput = ref('')
const defaultConfigInput = ref('')

const { message } = createDiscreteApi(['message'])

onMounted(() => {
  initialize()
})

async function initialize() {
  const configs = await configStore.initializeConfig(currentModel)
  configInput.value = configs?.modelConfig?.systemPrompt ?? ''
  defaultConfigInput.value = configs?.defaultConfig?.systemPrompt ?? ''
}

async function onSubmit() {
  await configStore.setConfig({
    model: 'default',
    systemPrompt: defaultConfigInput.value.trim(),
    createdAt: new Date(),
  })
  await configStore.setConfig({
    model: currentModel,
    systemPrompt: configInput.value.trim(),
    createdAt: new Date(),
  })
  message.success('保存成功！')
}

function shouldSubmit({ key, shiftKey }: KeyboardEvent): boolean {
  return key === 'Enter' && !shiftKey
}

function onKeydown(event: KeyboardEvent) {
  if (shouldSubmit(event)) {
    event.preventDefault()
    onSubmit()
  }
}
</script>

<template>
  <aside class="flex flex-col gap-6">
    <div
      class="flex w-full flex-row items-center justify-center gap-4 rounded-b-xl bg-gray-100 px-4 py-2 dark:bg-gray-800"
    >
      <div class="mr-auto flex h-full items-center">
        <div>
          <span
            class="block h-full rounded border-none p-2 text-lg font-medium text-gray-900 dark:text-gray-100"
          >
            系统提示词
          </span>
        </div>
      </div>
      <!-- 显示当前模型名称 -->
      <div class="rounded-lg bg-teal-50 px-3 py-1.5 text-sm font-medium text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
        {{ currentModel }}
      </div>
    </div>

    <div class="flex flex-col overflow-y-auto space-y-6 px-4">
      <!-- Custom Instructions Section -->
      <div class="rounded-xl bg-gray-100 p-6 shadow-sm dark:bg-gray-800">
        <h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
          自定义指令
        </h2>
        <p class="mb-4 text-sm text-gray-700 dark:text-gray-300">
          您希望当前模型了解您的哪些信息，以提供更好的回答？
        </p>
        <form @submit.prevent="onSubmit">
          <textarea
            ref="textarea"
            v-model="configInput"
            class="block min-h-[150px] w-full resize-none rounded-lg border-none bg-white p-4 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:ring-blue-500 sm:text-base"
            @keydown="onKeydown"
          />
        </form>
      </div>

      <!-- Default Instructions Section -->
      <div class="rounded-xl bg-gray-100 p-6 shadow-sm dark:bg-gray-800">
        <h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
          默认指令
        </h2>
        <p class="mb-4 text-sm text-gray-700 dark:text-gray-300">
          您希望所有模型了解您的哪些信息，以提供更好的回答？
          此提示词将默认应用于所有模型，即使您为某个模型配置了自定义提示词。
        </p>
        <form @submit.prevent="onSubmit">
          <textarea
            ref="textarea"
            v-model="defaultConfigInput"
            class="block min-h-[150px] w-full resize-none rounded-lg border-none bg-white p-4 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:ring-blue-500 sm:text-base"
          />
        </form>
      </div>

      <div>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-offset-gray-900"
          @click="onSubmit"
        >
          <IconWritingSign class="h-5 w-5" />
          保存修改
        </button>
      </div>
    </div>
  </aside>
</template>
