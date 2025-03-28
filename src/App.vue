<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import AIEditingMain from './components/AIEditing/AIEditingMain.vue'
import ChatInput from './components/ChatInput.vue'
import ChatMessages from './components/ChatMessages.vue'
import TextInput from './components/Inputs/TextInput.vue'
import ModelSelector from './components/ModelSelector.vue'
import NavHeader from './components/NavHeader.vue'
import Settings from './components/Settings.vue'
import Sidebar from './components/Sidebar.vue'
import SystemPrompt from './components/SystemPrompt.vue'
import {
  currentModel,
  currentScene,
  isDarkMode,
  isSettingsOpen,
  isSystemPromptOpen,
  SCENES,
} from './services/appConfig.ts'
import { useChats } from './services/chat.ts'
import { useAI } from './services/useAI.ts'

const { refreshModels, availableModels } = useAI()
const { activeChat, renameChat, switchModel, initialize } = useChats()
const isEditingChatName = ref(false)
const editedChatName = ref('')
const chatNameInput = ref()

function startEditing() {
  isEditingChatName.value = true
  editedChatName.value = activeChat.value?.name || ''
  nextTick(() => {
    if (!chatNameInput.value)
      return
    const input = chatNameInput.value.$el.querySelector('input')
    input.focus()
    input.select()
  })
}

function cancelEditing() {
  isEditingChatName.value = false
  editedChatName.value = ''
}

function confirmRename() {
  if (activeChat.value && editedChatName.value) {
    renameChat(editedChatName.value)
    isEditingChatName.value = false
  }
}

onMounted(() => {
  refreshModels().then(async () => {
    await initialize()
    await switchModel(currentModel.value ?? availableModels.value[0].name)
  })
})
</script>

<template>
  <div :class="{ dark: isDarkMode }">
    <main class="flex h-full w-full flex-1 flex-row items-stretch bg-white dark:bg-gray-900">
      <Sidebar />

      <!-- Chat Scene -->
      <div v-if="currentScene === SCENES.CHAT" class="mx-auto flex h-screen w-full flex-col">
        <div v-if="isSystemPromptOpen" class="mx-auto flex h-screen w-full max-w-7xl flex-col gap-4 px-4 pb-4">
          <SystemPrompt />
        </div>

        <div v-else class="mx-auto flex h-screen w-full max-w-7xl flex-col gap-4 px-4 pb-4">
          <div class="flex w-full flex-row items-center justify-center gap-4 rounded-b-xl bg-gray-100 px-4 py-2 dark:bg-gray-800">
            <div v-if="activeChat" class="mr-auto flex h-full items-center">
              <div>
                <div v-if="isEditingChatName">
                  <TextInput
                    id="chat-name"
                    ref="chatNameInput"
                    v-model="editedChatName"
                    @keyup.enter="confirmRename"
                    @keyup.esc="cancelEditing"
                    @blur="cancelEditing"
                  />
                </div>

                <button
                  v-else
                  type="button"
                  class="block h-full rounded border-none p-2 text-gray-900 decoration-gray-400 decoration-dashed outline-none hover:underline focus:ring-2 focus:ring-blue-600 dark:text-gray-100 dark:focus:ring-blue-600"
                  @click.prevent="startEditing"
                >
                  {{ activeChat.name }}
                </button>
              </div>
            </div>

            <ModelSelector />
          </div>

          <ChatMessages />
          <ChatInput />
        </div>
      </div>

      <!-- AI Editing Scene -->
      <div v-else-if="currentScene === SCENES.AI_EDITING" class="mx-auto flex h-screen w-full flex-col">
        <AIEditingMain />
      </div>

      <transition name="slide">
        <Settings v-if="isSettingsOpen" />
      </transition>
    </main>
  </div>
</template>
