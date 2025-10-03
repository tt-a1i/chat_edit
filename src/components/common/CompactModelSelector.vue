<script setup lang="ts">
import { useAI } from '@/services/ai.ts'
import { useAppStore, useChatStore } from '@/stores'
import { simplifyModelName } from '@/utils/format'
import { IconCheck, IconChevronDown, IconRefresh, IconSearch, IconSparkles, IconStar } from '@tabler/icons-vue'
import { storeToRefs } from 'pinia'
import { computed, onMounted, onUnmounted, ref } from 'vue'

const appStore = useAppStore()
const chatStore = useChatStore()
const { currentModel } = storeToRefs(appStore)
const { currentChat } = storeToRefs(chatStore)

const { refreshModels, availableModels } = useAI()

const isOpen = ref(false)
const searchQuery = ref('')
const refreshingModel = ref(false)
const buttonRef = ref<HTMLButtonElement | null>(null)
const dropdownPosition = ref({ top: 0, left: 0, width: 0 })

// 常用模型列表（可以根据用户使用频率动态调整）
const favoriteModels = [
  'moonshot-v1-8k',
  'kimi-latest',
  'kimi-thinking-preview',
  'moonshot-v1-32k',
]

// 过滤后的模型列表
const filteredModels = computed(() => {
  if (!searchQuery.value) {
    return availableModels.value
  }
  const query = searchQuery.value.toLowerCase()
  return availableModels.value.filter(model =>
    model.name.toLowerCase().includes(query),
  )
})

// 常用模型（在过滤结果中）
const filteredFavorites = computed(() =>
  filteredModels.value.filter(model => favoriteModels.includes(model.name)),
)

// 其他模型（在过滤结果中）
const filteredOthers = computed(() =>
  filteredModels.value.filter(model => !favoriteModels.includes(model.name)),
)

// 当前选中的模型
const selectedModel = computed(() => currentChat.value?.model ?? currentModel.value)

// 简化的模型名称显示
const displayModelName = computed(() => {
  if (!selectedModel.value) return '选择模型'
  return simplifyModelName(selectedModel.value)
})

async function selectModel(modelName: string) {
  appStore.currentModel = modelName

  // 更新当前聊天的模型
  if (currentChat.value && currentChat.value.id) {
    await chatStore.updateChat(currentChat.value.id, { model: modelName })
  }

  isOpen.value = false
  searchQuery.value = ''
}

async function handleRefresh() {
  refreshingModel.value = true
  await refreshModels()
  refreshingModel.value = false
}

// 点击外部关闭下拉菜单
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.model-selector-container')) {
    isOpen.value = false
    searchQuery.value = ''
  }
}

// 计算下拉菜单位置
function updateDropdownPosition() {
  if (buttonRef.value) {
    const rect = buttonRef.value.getBoundingClientRect()
    dropdownPosition.value = {
      top: rect.bottom + 8,
      left: rect.right - 288, // 288px = w-72
      width: rect.width,
    }
  }
}

// 添加和移除全局点击监听
function toggleDropdown() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    updateDropdownPosition()
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
    }, 0)
  } else {
    document.removeEventListener('click', handleClickOutside)
    searchQuery.value = ''
  }
}

// 监听窗口大小变化
function handleResize() {
  if (isOpen.value) {
    updateDropdownPosition()
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  window.addEventListener('scroll', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('scroll', handleResize)
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="model-selector-container relative">
    <!-- 触发按钮 -->
    <button
      ref="buttonRef"
      class="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
      :class="isOpen ? 'bg-gray-100 dark:bg-gray-700' : ''"
      @click="toggleDropdown"
    >
      <IconSparkles :size="16" class="text-blue-500" />
      <span class="text-gray-700 dark:text-gray-200">{{ displayModelName }}</span>
      <IconChevronDown
        :size="14"
        class="text-gray-500 transition-transform duration-200"
        :class="isOpen ? 'rotate-180' : ''"
      />
    </button>

    <!-- 下拉菜单 - 使用 Teleport 渲染到 body -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition ease-out duration-100"
        enter-from-class="transform opacity-0 scale-95"
        enter-to-class="transform opacity-100 scale-100"
        leave-active-class="transition ease-in duration-75"
        leave-from-class="transform opacity-100 scale-100"
        leave-to-class="transform opacity-0 scale-95"
      >
        <div
          v-if="isOpen"
          class="fixed z-[100] w-72 overflow-hidden rounded-xl border bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800"
          :style="{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            maxHeight: '70vh',
          }"
        >
          <!-- 搜索框 -->
          <div class="sticky top-0 z-10 border-b bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
            <div class="relative">
              <IconSearch
                :size="16"
                class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="搜索模型..."
                class="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-blue-500 focus:bg-white dark:border-gray-600 dark:bg-gray-700 dark:focus:border-blue-500 dark:focus:bg-gray-600"
              >
            </div>
          </div>

          <!-- 模型列表 -->
          <div class="max-h-[calc(70vh-120px)] overflow-y-auto">
            <!-- 常用模型 -->
            <div v-if="filteredFavorites.length > 0" class="p-2">
              <div class="mb-1 flex items-center gap-1.5 px-2 py-1">
                <IconStar :size="14" class="text-yellow-500" />
                <span class="text-xs font-medium text-gray-500 dark:text-gray-400">常用模型</span>
              </div>
              <button
                v-for="model in filteredFavorites"
                :key="model.name"
                class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                :class="selectedModel === model.name ? 'bg-blue-50 dark:bg-blue-900/20' : ''"
                @click="selectModel(model.name)"
              >
                <div class="flex items-center gap-2">
                  <span
                    class="text-gray-700 dark:text-gray-200"
                    :class="selectedModel === model.name ? 'font-medium text-blue-600 dark:text-blue-400' : ''"
                  >
                    {{ simplifyModelName(model.name) }}
                  </span>
                </div>
                <IconCheck
                  v-if="selectedModel === model.name"
                  :size="16"
                  class="text-blue-600 dark:text-blue-400"
                />
              </button>
            </div>

            <!-- 分隔线 -->
            <div v-if="filteredFavorites.length > 0 && filteredOthers.length > 0" class="my-1 border-t border-gray-200 dark:border-gray-700" />

            <!-- 所有模型 -->
            <div v-if="filteredOthers.length > 0" class="p-2">
              <div class="mb-1 px-2 py-1">
                <span class="text-xs font-medium text-gray-500 dark:text-gray-400">所有模型</span>
              </div>
              <button
                v-for="model in filteredOthers"
                :key="model.name"
                class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                :class="selectedModel === model.name ? 'bg-blue-50 dark:bg-blue-900/20' : ''"
                @click="selectModel(model.name)"
              >
                <span
                  class="text-gray-700 dark:text-gray-200"
                  :class="selectedModel === model.name ? 'font-medium text-blue-600 dark:text-blue-400' : ''"
                >
                  {{ simplifyModelName(model.name) }}
                </span>
                <IconCheck
                  v-if="selectedModel === model.name"
                  :size="16"
                  class="text-blue-600 dark:text-blue-400"
                />
              </button>
            </div>

            <!-- 无搜索结果 -->
            <div v-if="filteredModels.length === 0" class="p-6 text-center">
              <p class="text-sm text-gray-500 dark:text-gray-400">
                未找到匹配的模型
              </p>
            </div>
          </div>

          <!-- 底部操作 -->
          <div class="sticky bottom-0 border-t bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-800/95">
            <button
              class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
              @click="handleRefresh"
            >
              <IconRefresh
                :size="16"
                class="text-gray-500"
                :class="{ 'animate-spin': refreshingModel }"
              />
              <span>刷新模型列表</span>
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* 自定义滚动条 */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.7);
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: rgba(75, 85, 99, 0.5);
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background-color: rgba(75, 85, 99, 0.7);
}
</style>
