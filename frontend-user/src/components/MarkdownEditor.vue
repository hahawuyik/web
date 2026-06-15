<template>
  <MdEditor
    v-model="text"
    :toolbars="toolbars"
    :onUploadImg="handleUploadImage"
  />
</template>

<script setup>
import { ref, watch } from 'vue'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import { uploadPostImage } from '@/api/upload'
import { ElMessage } from 'element-plus'

const props = defineProps(['modelValue'])
const emit = defineEmits(['update:modelValue'])

const text = ref(props.modelValue || '')

watch(text, (val) => {
  emit('update:modelValue', val)
})

const toolbars = [
  'bold', 'underline', 'italic', 'strikeThrough', 'title', 'sub', 'sup',
  'quote', 'unorderedList', 'orderedList', 'task', 'codeRow', 'code',
  'link', 'image', 'table', 'mermaid', 'katex', 'revoke', 'next',
  'save', '=',
  'pageFullscreen', 'fullscreen', 'preview', 'htmlPreview', 'catalog'
]

// 图片上传回调
const handleUploadImage = async (files, callback) => {
  const uploadedUrls = []
  for (const file of files) {
    try {
      const res = await uploadPostImage(file)
      uploadedUrls.push(res.url)
    } catch (error) {
      ElMessage.error(`上传失败: ${file.name}`)
      console.error(error)
    }
  }
  // 回调插入图片
  callback(uploadedUrls)
}
</script>