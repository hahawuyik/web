<template>
  <div class="markdown-viewer" v-html="renderedHtml"></div>
</template>

<script setup>
import { computed } from 'vue'
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'

marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value
    }
    return hljs.highlightAuto(code).value
  }
})

const props = defineProps(['content'])
const renderedHtml = computed(() => marked(props.content || ''))
</script>

<style scoped>
.markdown-viewer :deep(pre) {
  background-color: #f6f8fa;
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
}

/* 新增：限制图片最大宽度，防止撑破容器 */
.markdown-viewer :deep(img) {
  max-width: 60%;
  height: auto;
  cursor: pointer;
  transition: transform 0.2s;
}

/* 可选：鼠标悬浮时轻微放大提示可点击 */
.markdown-viewer :deep(img:hover) {
  transform: scale(1.01);
}
</style>