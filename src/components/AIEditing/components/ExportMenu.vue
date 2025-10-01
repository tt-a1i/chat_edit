<script setup lang="ts">
const emit = defineEmits<{
  (e: 'export', format: 'markdown' | 'docx' | 'pdf'): void
}>()

function handleExport(format: 'markdown' | 'docx' | 'pdf') {
  emit('export', format)
}
</script>

<template>
  <div id="exportMenu" class="export-menu">
    <div class="export-menu-item" data-format="markdown" @click="handleExport('markdown')">
      导出为 Markdown
    </div>
    <div class="export-menu-item" data-format="docx" @click="handleExport('docx')">
      导出为 DOCX
    </div>
    <!-- PDF 导出暂时禁用 -->
    <!--
    <div class="export-menu-item" data-format="pdf" @click="handleExport('pdf')">
      导出为 PDF
    </div>
    -->
  </div>
</template>

<style scoped>
.export-menu {
  position: absolute;
  z-index: 1000;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  min-width: 150px;
  display: none;
}

.export-menu-item {
  padding: 10px 16px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
  border-bottom: 1px solid #f0f0f0;
}

.export-menu-item:last-child {
  border-bottom: none;
}

.export-menu-item:hover {
  background: #f5f5f5;
}

.export-menu-item:first-child {
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

.export-menu-item:last-child {
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
}
</style>
