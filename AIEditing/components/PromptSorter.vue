<script setup>
import { ref, watch } from 'vue'
import { NButton, NCard, NModal, NSpace } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import draggable from 'vuedraggable'

const props = defineProps({
  show: Boolean,
  prompts: {
    type: Array,
    default: () => [],
  },
  isDark: Boolean,
})

const emit = defineEmits(['update:show', 'save', 'cancel'])

const { t } = useI18n()

const sortableItems = ref([])

// 监听prompts变化，更新本地数据
watch(() => props.prompts, (newPrompts) => {
  if (newPrompts) {
    sortableItems.value = [...newPrompts].map(prompt => ({
      ...prompt,
      id: String(prompt.id), // 确保ID是字符串类型
    }))
  }
}, { immediate: true })

// 处理拖拽结束事件
function handleDragEnd() {
}

// 保存排序结果
function handleSave(event) {
  if (event) {
    event.stopPropagation()
  }
  // 只传递排序后的ID数组给父组件
  const sortedIds = sortableItems.value.map(item => String(item.id))
  emit('save', sortedIds)
}

// 关闭模态框
function handleClose(event) {
  if (event) {
    event.stopPropagation()
  }
  emit('update:show', false)
  emit('cancel')
}
</script>

<template>
  <NModal :show="show" @update:show="value => emit('update:show', value)" @click.stop>
    <NCard
      style="width: 500px"
      :title="sort"
      :bordered="false"
      size="huge"
      role="dialog"
      aria-modal="true"
    >
      <div class="sort-panel">
        <p class="sort-instructions">
          {{ t('ai_editing.prompt_sort.instructions') }}
        </p>
        <div v-if="!sortableItems.length" class="empty-prompts">
          {{ t('ai_editing.vertical_menu.no_custom_prompts') }}
        </div>
        <draggable
          v-else
          v-model="sortableItems"
          item-key="id"
          handle=".drag-handle"
          ghost-class="ghost-item"
          animation="300"
          @end="handleDragEnd"
        >
          <template #item="{ element }">
            <div class="sortable-item" :class="{ dark: isDark }">
              <i class="fas fa-grip-lines drag-handle" />
              <span class="sortable-content">{{ element.name }}</span>
            </div>
          </template>
        </draggable>
      </div>

      <template #footer>
        <NSpace justify="end">
          <NButton @click="handleClose($event)">
            {{ t('ai_editing.prompt_sort.cancel') }}
          </NButton>
          <NButton type="primary" @click="handleSave($event)">
            {{ t('ai_editing.prompt_sort.save') }}
          </NButton>
        </NSpace>
      </template>
    </NCard>
  </NModal>
</template>

<style scoped>
.sort-panel {
  max-height: 300px;
  overflow-y: auto;
}

.sort-instructions {
  margin-bottom: 12px;
  color: #666;
  font-size: 0.875rem;
}

.sortable-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  margin-bottom: 8px;
  border-radius: 4px;
  background-color: white;
  cursor: move;
}

.drag-handle {
  color: #999;
  margin-right: 12px;
  cursor: grab;
}

.sortable-content {
  flex: 1;
}

.ghost-item {
  opacity: 0.5;
  background: #f0f7ff;
}

/* 暗黑模式样式 */
.sortable-item.dark {
  background-color: #2d2d2d;
  border-color: #444;
  color: #d4d4d4;
}

.sortable-item.dark .drag-handle {
  color: #777;
}

.empty-prompts {
  padding: 20px;
  text-align: center;
  color: #999;
}
</style>
