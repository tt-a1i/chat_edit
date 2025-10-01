<script setup lang="ts">
const emit = defineEmits<{
  (e: 'insertAfter'): void
  (e: 'confirmReplace'): void
  (e: 'cancel'): void
}>()
</script>

<template>
  <div id="diffContainer" style="display: none">
    <div id="diffWrapper">
      <div id="diffEditor" />
      <div class="diff-actions">
        <button
          id="insertAfterDiff"
          class="diff-btn insert"
          @click="emit('insertAfter')"
        >
          插入到后面
        </button>
        <button
          id="confirmReplace"
          class="diff-btn confirm"
          @click="emit('confirmReplace')"
        >
          确认替换
        </button>
        <button
          id="cancelReplace"
          class="diff-btn cancel"
          @click="emit('cancel')"
        >
          取消
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
#diffContainer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

#diffWrapper {
  width: 90%;
  max-width: 1200px;
  height: 80%;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

#diffEditor {
  flex: 1;
  overflow: hidden;
}

.diff-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  background: #fafafa;
  border-top: 1px solid #e8e8e8;
}

.diff-btn {
  padding: 8px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.diff-btn.insert {
  background: #1890ff;
  color: white;
}

.diff-btn.insert:hover {
  background: #40a9ff;
}

.diff-btn.confirm {
  background: #52c41a;
  color: white;
}

.diff-btn.confirm:hover {
  background: #73d13d;
}

.diff-btn.cancel {
  background: #ff4d4f;
  color: white;
}

.diff-btn.cancel:hover {
  background: #ff7875;
}
</style>
