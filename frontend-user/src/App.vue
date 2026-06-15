<<template>
  <div id="app" class="app-bg">
    <ThreeBackground />
    <Navbar />
    <main class="main">
      <router-view />
    </main>
    <Footer />
    <AiChatFloat />
    
    <!-- 全局音乐控制按钮 -->
    <div 
      class="global-music-btn" 
      :class="{ 'is-playing': isPlaying }"
      @click="togglePlay"
    >
      <span class="music-icon">🎵</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import axios from '@/utils/request'
import Navbar from '@/components/Navbar.vue'
import Footer from '@/components/Footer.vue'
import AiChatFloat from './components/AiChatFloat.vue'
import { useAudioStore } from './stores/audio.js'
import ThreeBackground from './components/ThreeBackground.vue'

const bgColor = ref('#f5f5f5')
const audioStore = useAudioStore()

const { isPlaying } = storeToRefs(audioStore)
const { togglePlay, initAudio } = audioStore

onMounted(async () => {
  initAudio()
  try {
    const res = await axios.get('/emotion/global-stats')
    bgColor.value = res.backgroundColor
  } catch (e) {
    console.error('获取全局情绪失败', e)
  }
})
</script>

<style>
html,
body {
  margin: 0;
  padding: 0;
  width: 100%;
  min-height: 100vh;
}

#app {
  margin: 0;
  padding: 0;
  width: 100%;
  min-height: 100vh;
}

.app-bg {
  background-image: url('/back.png');
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  background-attachment: fixed;
}

/* 全局音乐控制按钮样式 */
.global-music-btn {
  position: fixed;
  left: 20px;
  bottom: 20px;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1000;
  transition: all 0.2s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.global-music-btn.is-playing {
  background: #85b8e8;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

.global-music-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.global-music-btn:active {
  transform: scale(0.98);
}

.music-icon {
  font-size: 24px;
  color: #333;
}

@media (max-width: 768px) {
  .global-music-btn {
    width: 44px;
    height: 44px;
    left: 16px;
    bottom: 16px;
  }
  
  .music-icon {
    font-size: 20px;
  }
}

/* 自定义查看帖子按钮样式 */
.btn-view-post {
  background-color: #74a892 !important;
  border-color: #74a892 !important;
  color: white !important;
}
.btn-view-post:hover {
  background-color: #5f8f7a !important;
  border-color: #5f8f7a !important;
  color: white !important;
}

.btn-delete {
  background-color: #e5c185 !important;
  border-color: #e5c185 !important;
  color: white !important;
}

</style>