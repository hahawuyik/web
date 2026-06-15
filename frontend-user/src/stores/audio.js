import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAudioStore = defineStore('audio', () => {
  // 状态
  const audioInstance = ref(null)
  const isPlaying = ref(false)
  let initialized = false

  // 初始化音频实例（预加载，不自动播放）
  const initAudio = () => {
    if (initialized) return

    const audio = new Audio('/music.m4a')  // 音乐文件路径
    audio.loop = true                      // 循环播放
    audio.preload = 'auto'                 // 预加载

    // 监听播放/暂停事件，同步状态
    audio.addEventListener('play', () => {
      isPlaying.value = true
    })

    audio.addEventListener('pause', () => {
      isPlaying.value = false
    })

    audio.addEventListener('error', (e) => {
      console.error('音频加载或播放出错', e)
      isPlaying.value = false
    })

    audioInstance.value = audio
    initialized = true
  }

  // 切换播放/暂停
  const togglePlay = async () => {
    // 确保音频已初始化
    if (!audioInstance.value) {
      initAudio()
    }

    const audio = audioInstance.value
    if (!audio) return

    try {
      if (audio.paused) {
        await audio.play()
      } else {
        audio.pause()
      }
    } catch (err) {
      console.error('播放/暂停失败', err)
      // 播放失败时保持状态一致，用户可再次点击重试
    }
  }

  return {
    isPlaying,
    togglePlay,
    initAudio
  }
})