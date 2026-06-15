// src/composables/useTypingFireworks.js
import confetti from 'canvas-confetti'

/**
 * 获取光标在单行 input 中的屏幕坐标
 * @param {HTMLInputElement} inputEl
 * @returns {{ x: number, y: number } | null}
 */
const getCursorScreenPosition = (inputEl) => {
  if (!inputEl) return null
  const rect = inputEl.getBoundingClientRect()
  const value = inputEl.value
  const selectionStart = inputEl.selectionStart
  const textBeforeCursor = value.slice(0, selectionStart)

  // 创建隐藏 span 测量文本宽度
  const span = document.createElement('span')
  span.style.position = 'absolute'
  span.style.visibility = 'hidden'
  span.style.whiteSpace = 'pre'
  span.style.font = window.getComputedStyle(inputEl).font
  span.style.letterSpacing = window.getComputedStyle(inputEl).letterSpacing
  span.style.padding = window.getComputedStyle(inputEl).padding
  span.textContent = textBeforeCursor || ' '
  document.body.appendChild(span)

  const textWidth = span.offsetWidth
  document.body.removeChild(span)

  // 获取输入框内文字的左侧内边距和边框
  const computedStyle = window.getComputedStyle(inputEl)
  const paddingLeft = parseFloat(computedStyle.paddingLeft)
  const borderLeft = parseFloat(computedStyle.borderLeftWidth)

  const cursorX = rect.left + paddingLeft + borderLeft + textWidth
  const cursorY = rect.top + rect.height / 2   // 光标垂直居中

  return {
    x: cursorX / window.innerWidth,
    y: cursorY / window.innerHeight
  }
}

/**
 * 触发打字烟花特效（跟随光标）
 * @param {HTMLInputElement} inputEl - 输入框元素
 * @param {Object} options - 可选配置
 */
export const triggerFireworks = (inputEl, options = {}) => {
  if (!inputEl || !inputEl.matches('input, textarea')) return

  const pos = getCursorScreenPosition(inputEl)
  if (!pos) return

  const defaultColors = ['#ff595e', '#ff924c', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93']
  confetti({
    particleCount: options.particleCount || 10,
    spread: options.spread || 40,
    origin: pos,
    startVelocity: options.startVelocity || 8,
    colors: options.colors || defaultColors
  })
}

/**
 * 在组件中使用：为输入框绑定 input 事件即可自动获取当前聚焦元素
 */
export const useTypingFireworks = () => {
  const fireworksHandler = () => {
    const activeEl = document.activeElement
    triggerFireworks(activeEl)
  }
  return { fireworksHandler }
}