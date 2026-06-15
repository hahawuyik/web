<template>
  <div class="encounter-page">
    <div ref="threeContainer" class="three-container"></div>
    
    <!-- 抽取按钮 -->
    <button class="draw-btn" @click="drawRandomPost(true)" :disabled="isDrawing">
      <span v-if="!isDrawing">随机帖子</span>
      <span v-else>⏳ 抽取中...</span>
    </button>
    
    <!-- 情绪指示器 -->
    <div class="emotion-indicator" v-if="dominantEmotion" :class="'emotion-' + dominantEmotion">
      <span class="emotion-icon">{{ getEmotionIcon() }}</span>
      <span class="emotion-text">{{ getEmotionText() }}</span>
    </div>
    
    <!-- 自定义弹窗（显示在叶子上方） -->
    <div v-if="showModal" class="leaf-modal-overlay" @click.self="closeModal">
      <div class="leaf-modal-content" :style="modalStyle">
        <button class="close-btn" @click="closeModal">✕</button>
        <div class="post-preview" v-if="randomPost">
          <div class="emotion-tag" :class="getEmotionClass(randomPost.emotion_log?.sentiment)">
            {{ randomPost.emotion_log?.category || '碎碎念' }}
          </div>
          <h2 class="post-title">{{ randomPost.title }}</h2>
          <div class="post-author">
            <img :src="randomPost.author?.avatar || '/default-avatar.png'" alt="头像" class="avatar">
            <span class="username">{{ randomPost.author?.username || '匿名' }}</span>
            <span class="post-time">{{ formatTime(randomPost.created_at) }}</span>
          </div>
          <div class="post-excerpt">{{ truncateContent(randomPost.content, 150) }}</div>
          <div class="post-stats">
            <span>👁️ {{ randomPost.view_count || 0 }} 阅读</span>
            <span>❤️ {{ randomPost.like_count || 0 }} 点赞</span>
            <span>💬 {{ randomPost.reply_count || 0 }} 回复</span>
          </div>
          <div class="post-actions">
            <button class="action-btn again-btn" @click="drawRandomPost(false)">🎲 换一个</button>
            <button class="action-btn detail-btn" @click="goToDetail">查看详情 →</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, reactive } from 'vue'
import { useRouter } from 'vue-router'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { getRandomPost } from '@/api/post'
import { getGlobalEmotionStats } from '@/api/emotion'

const router = useRouter()
const threeContainer = ref(null)

// Three.js 相关变量
let scene, camera, renderer, controls, animationId
let currentModel = null
let mixer = null
let activeAction = null
let animationsList = []
let clock = new THREE.Clock()

// 情绪数据
const dominantEmotion = ref('neutral')
const emotionStats = ref(null)

// UI 状态
const showModal = ref(false)
const randomPost = ref(null)
const isDrawing = ref(false)

// 弹窗位置样式（动态绑定到叶子终点）
const modalStyle = reactive({
  left: '0px',
  top: '0px',
  transform: 'translate(-50%, -50%)'
})

// 树冠世界坐标（用于计算 2D 起点）
let crownWorldPos = new THREE.Vector3(0, 2.5, 0)

// 叶子图片 URL
const LEAF_IMAGE_URL = new URL('@/assets/leaves_paste.png', import.meta.url).href

// 纹理缓存（仅用于 3D 模型）
const textureCache = new Map()

// 模型配置
const MODEL_CONFIG = {
  position: { x: 0, y: -2.80, z: -4.80 },
  scale: 1.13,
  rotation: { x: -9, y: -87, z: -1 }
}

const windSettings = {
  strength: 0.08,
  scale: 0.8,
  speed: 1.5
}

const emotionConfig = {
  positive: { text: '今日氛围：温暖治愈', icon: '☀️', keyLightIntensity: 2.5, ambientIntensity: 1.5 },
  neutral: { text: '今日氛围：平静安宁', icon: '🌸', keyLightIntensity: 2.5, ambientIntensity: 1.5 },
  negative: { text: '今日氛围：些许低落', icon: '🌧️', keyLightIntensity: 2.0, ambientIntensity: 1.2 },
  anxious: { text: '今日氛围：焦虑不安', icon: '⚡', keyLightIntensity: 2.2, ambientIntensity: 1.3 },
  angry: { text: '今日氛围：情绪涌动', icon: '🔥', keyLightIntensity: 2.2, ambientIntensity: 1.3 },
  sad: { text: '今日氛围：淡淡忧伤', icon: '💧', keyLightIntensity: 2.0, ambientIntensity: 1.2 }
}

// ---------- 3D 模型相关函数（保持不变）----------
function loadTexture(fileName) {
  if (textureCache.has(fileName)) return textureCache.get(fileName)
  const textureUrl = new URL(`../assets/map/${fileName}`, import.meta.url).href
  const texture = new THREE.TextureLoader().load(textureUrl)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  textureCache.set(fileName, texture)
  return texture
}

function applyTexturesToModel(model) {
  const trunkTexturePath = 'tree.png'
  const leafColorTexturePath = 'leaves.001.png'
  const leafAlphaTexturePath = 'Leave_alpha_2 copy.png'
  const trunkTexture = loadTexture(trunkTexturePath)
  const leafColorTexture = loadTexture(leafColorTexturePath)
  const leafAlphaTexture = loadTexture(leafAlphaTexturePath)
  let meshCount = 0, leafCount = 0, trunkCount = 0
  model.traverse((child) => {
    if (!child.isMesh) return
    meshCount++
    child.castShadow = true
    child.receiveShadow = true
    const materials = Array.isArray(child.material) ? child.material : [child.material]
    const name = (child.name || '').toLowerCase()
    const isLeaf = name.includes('leaf') || name.includes('foliage') || name.includes('leave')
    materials.forEach((mat, idx) => {
      if (!mat) return
      let newMaterial
      if (isLeaf) {
        newMaterial = mat.clone()
        newMaterial.map = leafColorTexture
        newMaterial.alphaMap = leafAlphaTexture
        newMaterial.transparent = true
        newMaterial.alphaTest = 0.1
        newMaterial.color = new THREE.Color(0xffffff)
        newMaterial.roughness = 0.3
        newMaterial.metalness = 0.1
        leafCount++
      } else {
        newMaterial = mat.clone()
        newMaterial.map = trunkTexture
        newMaterial.color = new THREE.Color(0xffffff)
        newMaterial.roughness = 0.5
        newMaterial.metalness = 0.1
        trunkCount++
      }
      if (Array.isArray(child.material)) child.material[idx] = newMaterial
      else child.material = newMaterial
    })
  })
  console.log(`贴图应用完成: 网格数 ${meshCount} (树叶:${leafCount}, 树干:${trunkCount})`)
}

function createWindMaterial(originalMaterial, minY, maxY) {
  const material = originalMaterial.clone()
  material.transparent = originalMaterial.transparent
  material.alphaTest = originalMaterial.alphaTest !== undefined ? originalMaterial.alphaTest : 0.1
  if (originalMaterial.alphaMap) material.alphaMap = originalMaterial.alphaMap
  if (originalMaterial.map) material.map = originalMaterial.map
  material.depthWrite = true
  material.side = THREE.DoubleSide
  material.userData = {
    uTime: { value: 0 },
    uWindStrength: { value: windSettings.strength },
    uWindScale: { value: windSettings.scale },
    uWindSpeed: { value: windSettings.speed },
    uMinY: { value: minY },
    uMaxY: { value: maxY }
  }
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = material.userData.uTime
    shader.uniforms.uWindStrength = material.userData.uWindStrength
    shader.uniforms.uWindScale = material.userData.uWindScale
    shader.uniforms.uWindSpeed = material.userData.uWindSpeed
    shader.uniforms.uMinY = material.userData.uMinY
    shader.uniforms.uMaxY = material.userData.uMaxY
    const globalInject = `
      uniform float uTime;
      uniform float uWindStrength;
      uniform float uWindScale;
      uniform float uWindSpeed;
      uniform float uMinY;
      uniform float uMaxY;
      vec3 getWindOffset(vec3 pos) {
        float range = uMaxY - uMinY;
        float t = (pos.y - uMinY) / range;
        t = clamp(t, 0.0, 1.0);
        float strength = uWindStrength * pow(t, 1.5);
        float time1 = uTime * uWindSpeed;
        float time2 = uTime * uWindSpeed * 1.3;
        float angleX = (pos.x * uWindScale + time1) * 3.14159;
        float angleZ = (pos.z * uWindScale * 0.8 + time2) * 3.14159;
        float offsetX = sin(angleX) * strength;
        float offsetZ = cos(angleZ) * strength * 0.8;
        float offsetY = sin((pos.x * 0.5 + pos.z * 0.5) * uWindScale * 1.2 + time1) * strength * 0.3;
        return vec3(offsetX, offsetY, offsetZ);
      }
    `
    const mainIndex = shader.vertexShader.indexOf('void main()')
    if (mainIndex !== -1) {
      const beforeMain = shader.vertexShader.slice(0, mainIndex)
      const afterMain = shader.vertexShader.slice(mainIndex)
      shader.vertexShader = beforeMain + globalInject + '\n' + afterMain
    }
    const beginVertexIndex = shader.vertexShader.indexOf('#include <begin_vertex>')
    if (beginVertexIndex !== -1) {
      const before = shader.vertexShader.slice(0, beginVertexIndex + '#include <begin_vertex>'.length)
      const after = shader.vertexShader.slice(beginVertexIndex + '#include <begin_vertex>'.length)
      shader.vertexShader = before + '\n' + `
        vec3 windOffset = getWindOffset(transformed);
        transformed.x += windOffset.x;
        transformed.y += windOffset.y;
        transformed.z += windOffset.z;
      ` + after
    }
    material.userData.shader = shader
  }
  return material
}

function applyWindToLeaves(model) {
  let minY = Infinity, maxY = -Infinity
  model.traverse(child => {
    if (child.isMesh && child.geometry && child.geometry.attributes.position) {
      const posAttr = child.geometry.attributes.position
      for (let i = 0; i < posAttr.count; i++) {
        const y = posAttr.getY(i)
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  })
  minY -= 0.2
  maxY += 0.5
  model.traverse(child => {
    if (child.isMesh) {
      const name = (child.name || '').toLowerCase()
      const isLeaf = name.includes('leaf') || name.includes('foliage') || name.includes('leave')
      if (isLeaf) {
        const originalMaterials = Array.isArray(child.material) ? child.material : [child.material]
        const windMaterials = originalMaterials.map(mat => createWindMaterial(mat, minY, maxY))
        child.material = Array.isArray(child.material) ? windMaterials : windMaterials[0]
        child.castShadow = true
        child.receiveShadow = true
      }
    }
  })
}

function playAllAnimations() {
  if (!mixer || !animationsList.length) return false
  if (activeAction) activeAction.fadeOut(0.2)
  mixer.stopAllAction()
  animationsList.forEach((clip) => {
    const action = mixer.clipAction(clip)
    action.reset()
    action.setLoop(THREE.LoopRepeat, Infinity)
    action.play()
  })
  if (animationsList.length) activeAction = mixer.clipAction(animationsList[0])
  return true
}

// ---------- 计算树冠屏幕坐标 ----------
function getCrownScreenPosition() {
  if (!camera || !renderer) return null
  const worldPos = crownWorldPos.clone()
  // 将世界坐标投影到标准化设备坐标 (NDC)
  const ndc = worldPos.project(camera)
  // 转换为屏幕像素坐标
  const width = renderer.domElement.clientWidth
  const height = renderer.domElement.clientHeight
  const x = (ndc.x * 0.5 + 0.5) * width
  const y = (-ndc.y * 0.5 + 0.5) * height
  return { x, y }
}

// 更新树冠世界坐标（模型加载后调用）
function updateCrownWorldPosition() {
  if (!currentModel) return
  let maxY = -Infinity
  let highestPos = new THREE.Vector3()
  currentModel.traverse((child) => {
    if (child.isMesh && child.geometry && child.geometry.attributes.position) {
      const worldPos = child.getWorldPosition(new THREE.Vector3())
      if (worldPos.y > maxY) {
        maxY = worldPos.y
        highestPos.copy(worldPos)
      }
    }
  })
  if (maxY > -Infinity) {
    // 在最高点向外偏移一点，模拟树叶脱落位置
    const offsetDir = new THREE.Vector3(0.2, 0.1, 0.3).normalize()
    crownWorldPos = highestPos.clone().add(offsetDir.multiplyScalar(0.5))
  } else {
    crownWorldPos.set(0, 2.5, 0)
  }
  console.log('树冠世界坐标更新:', crownWorldPos)
}

// ---------- 2D 落叶动画（优化版）----------
let currentLeafElement = null
let currentLeafRaf = null
let currentLeafResolve = null
let currentLeafCancel = false

// 缓动函数：easeOutCubic + 终点前缓停
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3)
}
// 自定义速度曲线：前40%慢，中间40%快，最后20%慢（弹窗接近时减速）
function speedCurve(t) {
  if (t < 0.4) {
    // 前40% 慢速 (0~0.2)
    return easeOutCubic(t / 0.4) * 0.2
  } else if (t < 0.8) {
    // 中间40% 快速 (0.2~0.85)
    const t2 = (t - 0.4) / 0.4
    return 0.2 + easeOutCubic(t2) * 0.65
  } else {
    // 最后20% 减速 (0.85~1)
    const t3 = (t - 0.8) / 0.2
    return 0.85 + t3 * 0.15
  }
}

/**
 * 开始落叶动画
 * @param {Object} startPos 屏幕起点 {x, y}
 * @param {Object} endPos 屏幕终点 {x, y}（弹窗位置）
 * @returns {Promise}
 */
function startLeafFlight(startPos, endPos) {
  return new Promise((resolve) => {
    // 清理之前的动画
    if (currentLeafElement) {
      currentLeafCancel = true
      if (currentLeafRaf) cancelAnimationFrame(currentLeafRaf)
      if (currentLeafElement.parentNode) currentLeafElement.parentNode.removeChild(currentLeafElement)
      if (currentLeafResolve) currentLeafResolve()
    }
    currentLeafResolve = resolve
    currentLeafCancel = false

    const leaf = document.createElement('img')
    leaf.src = LEAF_IMAGE_URL
    leaf.className = 'floating-leaf'
    leaf.style.position = 'fixed'
    leaf.style.left = `${startPos.x}px`
    leaf.style.top = `${startPos.y}px`
    leaf.style.width = '32px'      // 初始较小
    leaf.style.height = '32px'
    leaf.style.pointerEvents = 'none'
    leaf.style.zIndex = '9998'
    leaf.style.opacity = '0.6'
    leaf.style.filter = 'drop-shadow(0 0 3px rgba(0,0,0,0.4)) blur(0.8px)'
    leaf.style.willChange = 'transform, left, top, width, height, opacity, filter'
    leaf.style.transition = 'filter 0.2s'
    document.body.appendChild(leaf)
    currentLeafElement = leaf

    const duration = 5000  // 5秒
    const startTime = performance.now()

    // 摆动幅度（像素），逐渐增大再减小？这里保持前大后小，模拟自然
    const maxAmplitude = 45
    const waveCount = 3.5   // 完整正弦波数量
    // 随机旋转范围
    const maxRotation = 28
    // 随机种子，使每次飘落角度不同
    const rotSeed = Math.random() * Math.PI * 2

    function animateLeaf(now) {
      if (currentLeafCancel || !currentLeafElement || !currentLeafElement.parentNode) {
        if (currentLeafResolve) currentLeafResolve()
        return
      }
      const elapsed = now - startTime
      let t = Math.min(1, elapsed / duration)
      // 使用自定义速度曲线
      const easedT = speedCurve(t)

      // 1. 位置插值（线性+正弦摆动）
      const baseX = startPos.x + (endPos.x - startPos.x) * easedT
      const baseY = startPos.y + (endPos.y - startPos.y) * easedT
      // 摆动幅度随进程先增后减（飘落中期摆动最大）
      let ampFactor = 1
      if (t < 0.3) ampFactor = t / 0.3
      else if (t > 0.7) ampFactor = 1 - (t - 0.7) / 0.3
      else ampFactor = 1
      const currentAmplitude = maxAmplitude * ampFactor
      const angle = t * Math.PI * 2 * waveCount
      const offsetX = Math.sin(angle) * currentAmplitude
      const finalX = baseX + offsetX
      const finalY = baseY

      // 2. 尺寸变化（近大远小）: 从 32px 逐渐放大到 80px
      const startSize = 32
      const endSize = 80
      const currentSize = startSize + (endSize - startSize) * easedT
      // 3. 旋转角度：随机正弦变化
      const rotAngle = Math.sin(angle * 1.5 + rotSeed) * maxRotation * (1 - t * 0.3)
      // 4. 透明度：0.6 -> 1.0 (终点完全可见)
      const opacity = Math.min(1, 0.6 + t * 0.4)
      // 5. 模糊程度：逐渐清晰，终点无模糊
      const blurAmount = Math.max(0, 1.2 * (1 - t))
      const shadowIntensity = 0.4 + t * 0.3

      leaf.style.left = `${finalX}px`
      leaf.style.top = `${finalY}px`
      leaf.style.width = `${currentSize}px`
      leaf.style.height = `${currentSize}px`
      leaf.style.opacity = opacity
      leaf.style.transform = `translate(-50%, -50%) rotate(${rotAngle}deg)`
      leaf.style.filter = `drop-shadow(0 0 ${shadowIntensity}px rgba(0,0,0,0.5)) blur(${blurAmount}px)`

      if (t < 1) {
        currentLeafRaf = requestAnimationFrame(animateLeaf)
      } else {
        // 动画完成，叶子停留不动
        if (leaf && leaf.parentNode) {
          // 确保最终样式固定
          leaf.style.left = `${endPos.x}px`
          leaf.style.top = `${endPos.y}px`
          leaf.style.width = `${endSize}px`
          leaf.style.height = `${endSize}px`
          leaf.style.opacity = '1'
          leaf.style.transform = `translate(-50%, -50%) rotate(${rotAngle}deg)`
          leaf.style.filter = 'drop-shadow(0 0 8px rgba(0,0,0,0.4)) blur(0px)'
        }
        if (currentLeafRaf) cancelAnimationFrame(currentLeafRaf)
        currentLeafRaf = null
        // 不 remove leaf，保留在终点位置
        if (currentLeafResolve) currentLeafResolve()
        currentLeafResolve = null
      }
    }

    currentLeafRaf = requestAnimationFrame(animateLeaf)
  })
}

// 清理落叶动画（组件卸载时）
function cleanupLeafAnimation() {
  if (currentLeafElement && currentLeafElement.parentNode) {
    currentLeafElement.parentNode.removeChild(currentLeafElement)
  }
  if (currentLeafRaf) cancelAnimationFrame(currentLeafRaf)
  if (currentLeafResolve) currentLeafResolve()
  currentLeafCancel = true
  currentLeafElement = null
  currentLeafRaf = null
  currentLeafResolve = null
}

// ---------- 抽取帖子（主逻辑）----------
async function drawRandomPost(playFlight = true) {
  if (isDrawing.value) return
  isDrawing.value = true

  // 播放模型动画
  playAllAnimations()

  // 并行执行：请求帖子 + 落叶动画
  const requestPromise = getRandomPost()
  let flightPromise = Promise.resolve()

  if (playFlight) {
    // 获取树冠屏幕坐标作为起点
    let startScreen = getCrownScreenPosition()
    if (!startScreen) {
      // 降级：使用默认起点（屏幕顶部中央）
      startScreen = { x: window.innerWidth / 2, y: 80 }
    }
    // 终点：弹窗位置（屏幕中央偏下）
    const endX = window.innerWidth / 2
    const endY = window.innerHeight * 0.65
    const endPos = { x: endX, y: endY }
    // 预先设置弹窗样式位置（用于之后显示）
    modalStyle.left = `${endX}px`
    modalStyle.top = `${endY}px`
    flightPromise = startLeafFlight(startScreen, endPos)
  }

  try {
    const [res] = await Promise.all([requestPromise, flightPromise])
    if (res.success && res.data) {
      randomPost.value = res.data
      // 显示弹窗（位置已固定在叶子终点处）
      showModal.value = true
    } else {
      alert('暂无帖子，快去发布第一个吧~')
      // 如果没有帖子，也要移除叶子
      cleanupLeafAnimation()
    }
  } catch (error) {
    console.error('随机获取失败:', error)
    alert('获取失败，请稍后再试')
    cleanupLeafAnimation()
  } finally {
    isDrawing.value = false
  }
}

function closeModal() {
  showModal.value = false
  // 关闭弹窗时移除停留的叶子
  cleanupLeafAnimation()
  setTimeout(() => {
    if (!showModal.value) randomPost.value = null
  }, 300)
}

function goToDetail() {
  if (randomPost.value) {
    closeModal()
    router.push(`/post/${randomPost.value.id}`)
  }
}

// ---------- 辅助函数 ----------
function getEmotionIcon() {
  return emotionConfig[dominantEmotion.value]?.icon || '🌸'
}
function getEmotionText() {
  return emotionConfig[dominantEmotion.value]?.text || '今日氛围：平静安宁'
}
function truncateContent(content, maxLength) {
  if (!content) return ''
  return content.length <= maxLength ? content : content.slice(0, maxLength) + '...'
}
function formatTime(time) {
  if (!time) return '刚刚'
  const date = new Date(time), now = new Date(), diff = now - date
  const minutes = Math.floor(diff / 60000), hours = Math.floor(diff / 3600000), days = Math.floor(diff / 86400000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString()
}
function getEmotionClass(sentiment) {
  if (sentiment === 'positive') return 'emotion-positive'
  if (sentiment === 'negative') return 'emotion-negative'
  return 'emotion-neutral'
}

async function loadEmotionStats() {
  try {
    const res = await getGlobalEmotionStats()
    if (res) {
      emotionStats.value = res
      dominantEmotion.value = res.dominant || 'neutral'
      updateLightingByEmotion()
    }
  } catch (error) {
    console.error('获取情绪统计失败:', error)
    dominantEmotion.value = 'neutral'
  }
}

function updateLightingByEmotion() {
  if (!scene) return
  const config = emotionConfig[dominantEmotion.value] || emotionConfig.neutral
  const keyLight = scene.children.find(c => c.name === 'keyLight')
  if (keyLight) keyLight.intensity = config.keyLightIntensity
  const ambientLight = scene.children.find(c => c instanceof THREE.AmbientLight && !c.name)
  if (ambientLight) ambientLight.intensity = config.ambientIntensity
}

function loadBackgroundImage() {
  const bgTextureUrl = new URL('../assets/map/back1.png', import.meta.url).href
  new THREE.TextureLoader().load(bgTextureUrl, (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace
    scene.background = texture
    console.log('背景图片加载成功')
  }, undefined, (err) => {
    console.error('背景图片加载失败:', err)
    scene.background = new THREE.Color(0x1a1a2e)
  })
}

function initThree() {
  const container = threeContainer.value
  if (!container) return false
  const width = container.clientWidth, height = container.clientHeight
  if (width === 0 || height === 0) return false

  scene = new THREE.Scene()
  const rgbeLoader = new RGBELoader()
  rgbeLoader.load('/hdr/v1.hdr', (texture) => {
    texture.mapping = THREE.EquirectangularMapping
    scene.environment = texture
    console.log('HDR环境贴图加载成功')
  }, undefined, (error) => {
    console.error('HDR环境贴图加载失败:', error)
  })
  loadBackgroundImage()

  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
  camera.position.set(0, 2.5, 6)
  camera.lookAt(0, 1.2, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.5
  renderer.shadowMap.enabled = true
  container.appendChild(renderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableZoom = false
  controls.enablePan = false
  controls.enableRotate = false
  controls.target.set(0, 1.2, 0)
  controls.update()

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
  scene.add(ambientLight)
  const hemisphereLight = new THREE.HemisphereLight(0xfff5e6, 0x8ba5a5, 1.0)
  scene.add(hemisphereLight)
  const mainLight = new THREE.DirectionalLight(0xfff5e6, 1.5)
  mainLight.name = 'keyLight'
  mainLight.position.set(3, 5, 2)
  mainLight.castShadow = true
  scene.add(mainLight)
  const backLight = new THREE.DirectionalLight(0xffeebb, 0.8)
  backLight.position.set(-2, 3, -3)
  scene.add(backLight)
  const fillLight = new THREE.PointLight(0xffaa88, 0.5)
  fillLight.position.set(0, -1, 0)
  scene.add(fillLight)
  const rimLight = new THREE.PointLight(0xffccaa, 0.4)
  rimLight.position.set(1, 1.5, -2)
  scene.add(rimLight)
  return true
}

function loadModel() {
  const loader = new GLTFLoader()
  loader.load('/models/tree1.glb', (gltf) => {
    const model = gltf.scene
    currentModel = model
    model.position.set(MODEL_CONFIG.position.x, MODEL_CONFIG.position.y, MODEL_CONFIG.position.z)
    model.scale.set(MODEL_CONFIG.scale, MODEL_CONFIG.scale, MODEL_CONFIG.scale)
    model.rotation.x = MODEL_CONFIG.rotation.x * Math.PI / 180
    model.rotation.y = MODEL_CONFIG.rotation.y * Math.PI / 180
    model.rotation.z = MODEL_CONFIG.rotation.z * Math.PI / 180

    applyTexturesToModel(model)
    applyWindToLeaves(model)
    scene.add(model)

    // 更新树冠位置
    updateCrownWorldPosition()

    if (gltf.animations && gltf.animations.length) {
      animationsList = gltf.animations
      mixer = new THREE.AnimationMixer(model)
      console.log(`加载了 ${animationsList.length} 个动画`)
      const defaultAction = mixer.clipAction(animationsList[0])
      defaultAction.play()
      activeAction = defaultAction
    }
    console.log('模型加载成功')
  }, undefined, (error) => console.error('模型加载失败:', error))
}

function animate() {
  animationId = requestAnimationFrame(animate)
  const delta = Math.min(clock.getDelta(), 0.1)
  if (mixer) mixer.update(delta)
  const elapsedTime = performance.now() / 1000
  if (scene) {
    scene.traverse(child => {
      if (child.isMesh && child.material && child.material.userData?.shader) {
        child.material.userData.uTime.value = elapsedTime
      }
    })
  }
  if (controls) controls.update()
  if (renderer && scene && camera) renderer.render(scene, camera)
}

function onWindowResize() {
  if (!threeContainer.value || !camera || !renderer) return
  const width = threeContainer.value.clientWidth
  const height = threeContainer.value.clientHeight
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

function disposeScene() {
  if (!scene) return
  scene.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose()
    if (obj.material) {
      if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose())
      else obj.material.dispose()
    }
  })
  if (scene.background && scene.background.isTexture) scene.background.dispose()
  if (scene.environment && scene.environment.isTexture) scene.environment.dispose()
}

onMounted(async () => {
  nextTick(() => {
    if (threeContainer.value) {
      const success = initThree()
      if (success) {
        loadEmotionStats()
        loadModel()
        animate()
        window.addEventListener('resize', onWindowResize)
      }
    } else {
      console.error('threeContainer 不存在')
    }
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', onWindowResize)
  if (animationId) cancelAnimationFrame(animationId)
  if (mixer) mixer.stopAllAction()
  disposeScene()
  if (renderer) renderer.dispose()
  cleanupLeafAnimation()
})
</script>

<style scoped>
/* 原有样式保留，增加弹窗位置覆盖样式 */
.encounter-page {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  position: relative;
}
.three-container {
  width: 100%;
  height: 100%;
}
.draw-btn {
  position: absolute;
  bottom: 95px;
  left: 51.5%;
  transform: translateX(-50%);
  padding: 14px 40px;
  font-size: 16px;
  font-weight: 700;
  color: #2d5a4a;
  background: transparent;
  border: 1.5px solid #7dd3c0;
  border-radius: 4px;
  cursor: pointer;
  backdrop-filter: blur(12px);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 100;
  letter-spacing: 3px;
  box-shadow: 0 0 0 1px rgba(125, 211, 192, 0.1), inset 0 0 20px rgba(125, 211, 192, 0.05);
  text-transform: uppercase;
}
.draw-btn:hover:not(:disabled) {
  color: #1a3d30;
  background: rgba(125, 211, 192, 0.08);
  border-color: #5eead4;
  box-shadow: 0 0 0 1px rgba(94, 234, 212, 0.2), 0 4px 20px rgba(94, 234, 212, 0.15), inset 0 0 30px rgba(94, 234, 212, 0.1);
  letter-spacing: 4px;
}
.draw-btn:active:not(:disabled) {
  transform: translateX(-50%) scale(0.98);
}
.draw-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.emotion-indicator {
  position: absolute;
  top: 20px;
  right: 20px;
  padding: 10px 24px;
  border-radius: 4px;
  background: transparent;
  border: 1.5px solid #f9a8d4;
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #be185d;
  box-shadow: 0 0 0 1px rgba(249, 168, 212, 0.1), inset 0 0 20px rgba(249, 168, 212, 0.05);
  z-index: 100;
  animation: slideInRight 0.5s ease;
}
.emotion-icon {
  font-size: 16px;
}
/* 自定义弹窗：完全覆盖叶子所在位置，毛玻璃背景不遮挡叶子 */
/* 自定义弹窗：完全覆盖叶子所在位置，毛玻璃背景不遮挡叶子 */
.leaf-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 30, 10, 0.25); /* 深一点的半透明绿，和叶子背景融合 */
  backdrop-filter: blur(3px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s ease;
}

.leaf-modal-content {
  position: absolute;
  transform: translate(-50%, -50%);
  width: 380px;
  max-width: 85vw;
  /* 改为清新半透明绿色背景，和叶子素材匹配 */
  background: rgba(230, 248, 235, 0.88);
  backdrop-filter: blur(12px);
  border-radius: 32px;
  padding: 24px 20px 28px;
  /* 阴影改成偏绿的柔和效果 */
  box-shadow: 0 20px 35px rgba(20, 80, 40, 0.18), 0 0 0 1px rgba(200, 240, 200, 0.5);
  /* 边框改成清新浅绿 */
  border: 1px solid rgba(180, 230, 190, 0.7);
  transition: all 0.2s;
  pointer-events: auto;
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 16px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  /* 按钮背景改成柔和浅绿 */
  background: rgba(220, 245, 225, 0.9);
  border: none;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  /* 文字改成深绿 */
  color: #3a7a4e;
  transition: all 0.2s;
  z-index: 10;
}

.close-btn:hover {
  /* hover改成清新亮绿 */
  background: #86e098;
  color: white;
  transform: rotate(90deg);
}

.post-preview {
  width: 100%;
}

.emotion-tag {
  display: inline-block;
  padding: 4px 14px;
  border-radius: 40px;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 16px;
}

/* 情绪标签配色适配绿色主题 */
.emotion-tag.emotion-positive {
  background: linear-gradient(135deg, #8ddfa8, #b8e9c9);
  color: #1d7038;
}
.emotion-tag.emotion-negative {
  background: linear-gradient(135deg, #aed6f1, #d4e6f1);
  color: #2c5282;
}
.emotion-tag.emotion-neutral {
  background: #e2e8f0;
  color: #4a5568;
}

.post-title {
  font-size: 24px;
  font-weight: bold;
  /* 标题改成深绿，和主题呼应 */
  color: #1e4d2b;
  margin-bottom: 12px;
}

.post-author {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  border-bottom: 1px solid rgba(50, 120, 70, 0.15);
  padding-bottom: 8px;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

.username {
  font-weight: 600;
  /* 用户名改成柔和的深绿 */
  color: #2d7d46;
}

.post-time {
  font-size: 12px;
  color: #5a7a62;
  margin-left: auto;
}

.post-excerpt {
  font-size: 15px;
  line-height: 1.5;
  color: #2c3e2f;
  /* 背景改成更柔和的浅绿 */
  background: rgba(240, 253, 244, 0.6);
  padding: 8px 12px;
  border-radius: 20px;
  margin-bottom: 20px;
}

.post-stats {
  display: flex;
  gap: 20px;
  justify-content: space-around;
  padding: 10px 0;
  margin-bottom: 20px;
  border-top: 1px solid rgba(50, 120, 70, 0.15);
  border-bottom: 1px solid rgba(50, 120, 70, 0.15);
  /* 文字改成柔和的绿调 */
  color: #3a7a4e;
  font-size: 13px;
}

.post-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  flex: 1;
  padding: 10px 0;
  border: none;
  border-radius: 40px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.again-btn {
  /* 换一个按钮改成清新浅绿 */
  background: #d6f0dc;
  color: #2d7d46;
}
.again-btn:hover {
  background: #b8e9c9;
  transform: translateY(-2px);
}

.detail-btn {
  /* 查看详情按钮改成清新绿渐变，和叶子主题匹配 */
  background: linear-gradient(135deg, #6dd5ed, #2193b0);
  color: white;
  box-shadow: 0 2px 8px rgba(33, 147, 176, 0.3);
}
.detail-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(33, 147, 176, 0.4);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes slideInRight {
  from { opacity: 0; transform: translateX(50px); }
  to { opacity: 1; transform: translateX(0); }
}
</style>