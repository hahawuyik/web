import * as THREE from 'three'

export function createParticleEngine(container, onReady) {
  let scene
  let camera
  let renderer
  let animationId

  let textContainer = null

  let state = 'text'
  let stateStartTime = 0

  const openJpgUrl =
    new URL('@/assets/open.jpg', import.meta.url).href

  const TIMELINE = {
    TEXT_HOLD: 2000
  }

  init()

  function init() {
    scene = new THREE.Scene()

    camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )

    camera.position.z = 5

    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    })

    renderer.setSize(
      window.innerWidth,
      window.innerHeight
    )

    renderer.setClearColor(0x000000, 0)

    container.appendChild(renderer.domElement)

    document.body.style.background = '#000'

    createTextContainer()

    showText('生命有一万次春天', 68)

    stateStartTime = performance.now()

    animate()

    window.addEventListener(
      'resize',
      onResize
    )
  }

  function createTextContainer() {
    textContainer = document.createElement('div')

    textContainer.style.position = 'fixed'
    textContainer.style.top = '45%'
    textContainer.style.left = '50%'
    textContainer.style.transform =
      'translate(-50%, -50%)'

    textContainer.style.color = '#ffffff'

    textContainer.style.fontSize = '68px'
    textContainer.style.fontWeight = 'bold'
    textContainer.style.textAlign = 'center'

    textContainer.style.letterSpacing = '12px'

    textContainer.style.fontFamily =
      '"Microsoft YaHei","PingFang SC","Helvetica Neue",sans-serif'

    textContainer.style.zIndex = '20'

    textContainer.style.whiteSpace = 'nowrap'

    textContainer.style.pointerEvents = 'none'

    textContainer.style.transition =
      'all 2.5s ease'

    textContainer.style.textShadow =
      '0 0 20px rgba(255,255,255,.4)'

    document.body.appendChild(textContainer)
  }

  function showText(text, size) {
    textContainer.innerHTML = text

    textContainer.style.fontSize =
      `${size}px`

    if (window.innerWidth < 760) {
      textContainer.style.fontSize = '40px'
      textContainer.style.whiteSpace = 'normal'
      textContainer.style.width = '90%'
    }
  }

  function revealImageInText() {
    textContainer.style.color = 'transparent'

    textContainer.style.backgroundImage =
      `url(${openJpgUrl})`

    textContainer.style.backgroundSize =
      '180%'

    textContainer.style.backgroundPosition =
      '55% center'

    textContainer.style.backgroundRepeat =
      'no-repeat'

    textContainer.style.webkitBackgroundClip =
      'text'

    textContainer.style.backgroundClip =
      'text'

    textContainer.style.textShadow = 'none'

    setTimeout(() => {
      showStartButton()
    }, 800)
  }

  function showStartButton() {
    if (document.querySelector('.start-btn'))
      return

    const button =
      document.createElement('button')

    button.textContent = '开始'

    button.className = 'start-btn'

    button.style.position = 'fixed'
    button.style.bottom = '22%'
    button.style.left = '50%'

    button.style.transform =
      'translateX(-50%)'

    button.style.padding =
      '14px 48px'

    button.style.fontSize = '24px'

    button.style.fontWeight = 'bold'

    button.style.border = 'none'

    button.style.borderRadius = '60px'

    button.style.cursor = 'pointer'

    button.style.color = '#fff'

    button.style.background =
      'linear-gradient(135deg,#ff6fa5,#ff95b8)'

    button.style.boxShadow =
      '0 8px 20px rgba(0,0,0,.2),0 0 15px rgba(255,105,180,.5)'

    button.style.zIndex = '100'

    button.style.transition =
      'all .25s ease'

    button.onmouseenter = () => {
      button.style.transform =
        'translateX(-50%) scale(1.05)'
    }

    button.onmouseleave = () => {
      button.style.transform =
        'translateX(-50%) scale(1)'
    }

    button.onclick = () => {
      if (onReady) {
        onReady()
      }
    }

    document.body.appendChild(button)
  }

  function animate() {
    animationId =
      requestAnimationFrame(animate)

    const now = performance.now()

    const elapsed =
      now - stateStartTime

    if (
      state === 'text' &&
      elapsed > TIMELINE.TEXT_HOLD
    ) {
      state = 'image_text'
      revealImageInText()
    }

    camera.position.x =
      Math.sin(Date.now() * 0.0002) *
      0.2

    renderer.render(scene, camera)
  }

  function onResize() {
    renderer.setSize(
      window.innerWidth,
      window.innerHeight
    )

    camera.aspect =
      window.innerWidth /
      window.innerHeight

    camera.updateProjectionMatrix()
  }

  function destroy() {
    cancelAnimationFrame(animationId)

    window.removeEventListener(
      'resize',
      onResize
    )

    if (textContainer)
      textContainer.remove()

    const startBtn =
      document.querySelector('.start-btn')

    if (startBtn)
      startBtn.remove()

    renderer.dispose()
  }

  return {
    destroy
  }
}