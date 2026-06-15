<!-- frontend-user/src/components/FlowerBloom.vue -->
<template>
  <div class="flower-bloom-wrapper">
    <div class="flower-window" :style="{ backgroundImage: `url(${bgImageUrl})` }">
      <el-button
        class="close-btn"
        circle
        :icon="Close"
        @click="handleClose"
      />
      <canvas ref="canvasRef" class="flower-canvas"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as THREE from 'three'
import { ElButton } from 'element-plus'
import { Close } from '@element-plus/icons-vue'

import bgImage from '@/assets/beuti.png'
import petalTexture from '@/assets/flower_picture.png'

const emit = defineEmits(['close'])

const canvasRef = ref(null)

// 花瓣数量
const PARTICLE_COUNT = 40

// 逻辑坐标范围
const LOGIC_LEFT = -6
const LOGIC_RIGHT = 6
const LOGIC_TOP = 8
const LOGIC_BOTTOM = -8

// 飘落速度范围
const VY_MIN = -0.008
const VY_MAX = -0.018
// 基础水平飘移范围
const VX_MIN = -0.002
const VX_MAX = 0.002

// 风力参数
let windTime = 0
const WIND_AMPLITUDE = 0.006
const WIND_FREQUENCY = 0.005
let currentWind = 0

let scene, camera, renderer, animationId
let particles = []
let isAnimating = true

const bgImageUrl = bgImage

// 加载纹理
const loadPetalTexture = () => {
  return new Promise((resolve) => {
    const loader = new THREE.TextureLoader()
    loader.load(petalTexture, (texture) => {
      texture.wrapS = THREE.RepeatWrapping
      texture.wrapT = THREE.RepeatWrapping
      texture.center = new THREE.Vector2(0.5, 0.5)
      resolve(texture)
    })
  })
}

// 重置单个粒子
const resetParticle = (particle) => {
  const x = LOGIC_LEFT + Math.random() * (LOGIC_RIGHT - LOGIC_LEFT)
  const y = LOGIC_TOP + 0.5
  particle.sprite.position.set(x, y, 0)

  particle.baseVx = VX_MIN + Math.random() * (VX_MAX - VX_MIN)
  particle.velocity.x = particle.baseVx
  particle.velocity.y = VY_MIN + Math.random() * (VY_MAX - VY_MIN)

  particle.rotSpeed = (Math.random() - 0.5) * 0.02
  particle.sprite.material.rotation = Math.random() * Math.PI * 2

  const scaleVal = 0.18 + Math.random() * 0.28
  particle.sprite.scale.set(scaleVal, scaleVal, 1)
  
  // 颜色修复：不透明度设为1（完全不透明）
  particle.sprite.material.opacity = 1.0
}

// 初始化粒子
const initParticles = (texture) => {
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 1.0,           // 完全不透明
      blending: THREE.NormalBlending,  // 改为正常混合，颜色更鲜艳
      depthTest: false,
      depthWrite: false,
      rotation: 0
    })
    const sprite = new THREE.Sprite(material)
    scene.add(sprite)

    const particle = {
      sprite,
      velocity: new THREE.Vector2(0, 0),
      baseVx: 0,
      rotSpeed: 0
    }
    particles.push(particle)
    
    // 分散初始化
    const x = LOGIC_LEFT + Math.random() * (LOGIC_RIGHT - LOGIC_LEFT)
    const y = LOGIC_BOTTOM + Math.random() * (LOGIC_TOP - LOGIC_BOTTOM)
    particle.sprite.position.set(x, y, 0)
    particle.baseVx = VX_MIN + Math.random() * (VX_MAX - VX_MIN)
    particle.velocity.x = particle.baseVx
    particle.velocity.y = VY_MIN + Math.random() * (VY_MAX - VY_MIN)
    particle.rotSpeed = (Math.random() - 0.5) * 0.02
    particle.sprite.material.rotation = Math.random() * Math.PI * 2
    const scaleVal = 0.18 + Math.random() * 0.28
    particle.sprite.scale.set(scaleVal, scaleVal, 1)
    particle.sprite.material.opacity = 1.0   // 完全不透明
  }
}

// 更新风场
const updateWind = () => {
  windTime += WIND_FREQUENCY
  let wind = Math.sin(windTime) * WIND_AMPLITUDE
  if (Math.random() < 0.02) {
    wind += (Math.random() - 0.5) * 0.004
  }
  currentWind = Math.min(0.01, Math.max(-0.01, wind))
}

// 更新粒子
const updateParticles = () => {
  updateWind()

  for (let p of particles) {
    let targetVx = p.baseVx + currentWind
    p.velocity.x += (targetVx - p.velocity.x) * 0.05
    
    let newX = p.sprite.position.x + p.velocity.x
    let newY = p.sprite.position.y + p.velocity.y

    if (newY < LOGIC_BOTTOM - 0.5) {
      resetParticle(p)
      continue
    }
    
    if (newX < LOGIC_LEFT - 0.5) {
      newX = LOGIC_LEFT - 0.4
      p.velocity.x = Math.abs(p.velocity.x) * 0.8
      p.baseVx = p.velocity.x
    } else if (newX > LOGIC_RIGHT + 0.5) {
      newX = LOGIC_RIGHT + 0.4
      p.velocity.x = -Math.abs(p.velocity.x) * 0.8
      p.baseVx = p.velocity.x
    }

    p.sprite.position.x = newX
    p.sprite.position.y = newY
    p.sprite.material.rotation += p.rotSpeed

    // 透明度随高度轻微变化（但不会太淡）
    const t = (newY - LOGIC_BOTTOM) / (LOGIC_TOP - LOGIC_BOTTOM)
    const opacity = 0.9 - t * 0.3   // 底部最低0.6，顶部0.9
    p.sprite.material.opacity = Math.min(0.95, Math.max(0.6, opacity))
  }
}

// 初始化 Three.js
const initThree = async () => {
  const canvas = canvasRef.value
  if (!canvas) return

  const texture = await loadPetalTexture()

  scene = new THREE.Scene()
  scene.background = null

  camera = new THREE.OrthographicCamera(LOGIC_LEFT, LOGIC_RIGHT, LOGIC_TOP, LOGIC_BOTTOM, 0.1, 100)
  camera.position.z = 5

  const width = canvas.clientWidth
  const height = canvas.clientHeight

  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setClearColor(0x000000, 0)

  initParticles(texture)

  const animate = () => {
    if (!isAnimating) return

    updateParticles()
    renderer.render(scene, camera)
    animationId = requestAnimationFrame(animate)
  }

  animationId = requestAnimationFrame(animate)
}

// 关闭
const handleClose = () => {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
  isAnimating = false
  emit('close')
}

// 窗口适配
const handleResize = () => {
  if (!renderer || !canvasRef.value) return
  const canvas = canvasRef.value
  const width = canvas.clientWidth
  const height = canvas.clientHeight
  renderer.setSize(width, height)
}

// 清理资源
const disposeThree = () => {
  if (animationId) cancelAnimationFrame(animationId)
  if (renderer) renderer.dispose()
  if (scene) {
    particles.forEach(p => {
      if (p.sprite) {
        p.sprite.material.dispose()
        scene.remove(p.sprite)
      }
    })
    particles = []
    scene.clear()
  }
}

onMounted(() => {
  initThree()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  disposeThree()
})
</script>

<style scoped>
.flower-bloom-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  background-color: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(3px);
}

.flower-window {
  position: relative;
  width: 973.2px;
  height: 502px;
  max-width: 85vw;
  max-height: 85vh;
  border-radius: 32px;
  overflow: hidden;
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
  background-color: #2a1e2c;
  box-shadow: 0 25px 40px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.flower-canvas {
  display: block;
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  background-color: rgba(0, 0, 0, 0.5);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background-color: rgba(0, 0, 0, 0.8);
  transform: scale(1.05);
}

@media (max-width: 600px) {
  .flower-window {
    width: 85vw;
    height: auto;
    aspect-ratio: 560 / 720;
  }
  .close-btn {
    top: 10px;
    right: 10px;
    width: 28px;
    height: 28px;
  }
}
</style>