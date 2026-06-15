<template>
  <div ref="container" class="three-container"></div>
</template>

<script setup>
import * as THREE from 'three'
import { onMounted, onUnmounted, ref } from 'vue'

const container = ref(null)

let animationId = null
let renderer = null
let scene = null
let camera = null
let geometry = null
let material = null
let petalTexture = null

const handleResize = () => {
  if (camera && renderer) {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  }
}

onMounted(() => {
  // 场景（背景透明，不设置任何纹理）
  scene = new THREE.Scene()
  // 重要：不设置 scene.background，保持透明

  const textureLoader = new THREE.TextureLoader()
  petalTexture = textureLoader.load(
    new URL('@/assets/flower_picture.png', import.meta.url).href
  )

  // 相机
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  )
  camera.position.z = 5

  // 渲染器（透明背景）
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setClearColor(0x000000, 0) // 完全透明
  container.value.appendChild(renderer.domElement)

  // 花瓣粒子系统
  const particleCount = 200
  const positions = new Float32Array(particleCount * 3)
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 20
    positions[i * 3 + 1] = Math.random() * 10
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10
  }

  geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

  material = new THREE.PointsMaterial({
    map: petalTexture,
    size: 0.15,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    alphaTest: 0.1,
    blending: THREE.NormalBlending
  })

  const particles = new THREE.Points(geometry, material)
  scene.add(particles)

  // 动画循环
  const animate = () => {
    animationId = requestAnimationFrame(animate)

    const pos = geometry.attributes.position.array
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] += Math.sin(Date.now() * 0.001 + i) * 0.002
      pos[i * 3 + 1] -= 0.01
      if (pos[i * 3 + 1] < -5) {
        pos[i * 3 + 1] = 5
        pos[i * 3] = (Math.random() - 0.5) * 20
      }
    }
    geometry.attributes.position.needsUpdate = true

    camera.position.x = Math.sin(Date.now() * 0.0002) * 0.2
    renderer.render(scene, camera)
  }
  animate()

  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
  window.removeEventListener('resize', handleResize)

  // 先移除 canvas，再 dispose
  if (renderer && renderer.domElement) {
    const canvas = renderer.domElement
    if (canvas.parentNode) {
      canvas.parentNode.removeChild(canvas)
    }
  }

  if (renderer) {
    renderer.dispose()
    renderer = null
  }
  if (geometry) {
    geometry.dispose()
    geometry = null
  }
  if (material) {
    material.dispose()
    material = null
  }
  if (petalTexture) {
    petalTexture.dispose()
    petalTexture = null
  }
})
</script>

<style scoped>
.three-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
  background: transparent;
  /* 如果需要点击穿透，可取消下面注释，根据具体需求决定 */
  /* pointer-events: none; */
}
</style>