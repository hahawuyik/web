// src/composables/useTypingFireworks.js
import confetti from 'canvas-confetti'

const getCursorScreenPosition = (inputEl) => {
  if (!inputEl) return null
  const rect = inputEl.getBoundingClientRect()
  const value = inputEl.value
  const selectionStart = inputEl.selectionStart
  const textBeforeCursor = value.slice(0, selectionStart)

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

  const computedStyle = window.getComputedStyle(inputEl)
  const paddingLeft = parseFloat(computedStyle.paddingLeft)
  const borderLeft = parseFloat(computedStyle.borderLeftWidth)

  const cursorX = rect.left + paddingLeft + borderLeft + textWidth
  const cursorY = rect.top + rect.height / 2

  return {
    x: cursorX / window.innerWidth,
    y: cursorY / window.innerHeight
  }
}

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

export const useTypingFireworks = () => {
  const fireworksHandler = () => {
    const activeEl = document.activeElement
    triggerFireworks(activeEl)
  }
  return { fireworksHandler }
}