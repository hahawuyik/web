<template>
  <div class="intro">
    <div ref="container" class="canvas"></div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { createParticleEngine } from '@/utils/particleEngine'

const container = ref(null)
const router = useRouter()

let engine = null

onMounted(() => {
  engine = createParticleEngine(container.value, () => {
    // 点击开始按钮后跳转到登录页
    router.push('/login')
  })
})

onBeforeUnmount(() => {
  engine?.destroy()
})
</script>

<style scoped>
.intro {
  width: 100vw;
  height: 100vh;
  background: black;
  overflow: hidden;
  position: relative;
}

.canvas {
  position: absolute;
  width: 100%;
  height: 100%;
}
</style>