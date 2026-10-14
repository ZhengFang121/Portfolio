import { nextTick, onMounted, onUnmounted, ref, watch, type Ref } from 'vue'
import { gsap } from 'gsap'

type IntroStage = 'intro' | 'reveal' | 'content'

/** Vue 管理階段與手勢，GSAP 只負責圖片及外框的視覺轉換。 */
export function useIntro(
  shell: Ref<HTMLElement | null>,
  viewport: Ref<HTMLElement | null>,
  brand: Ref<HTMLElement | null>,
  anchor: Ref<HTMLElement | null>,
  startsOnHome: boolean,
) {
  const stage = ref<IntroStage>(startsOnHome ? 'intro' : 'content')
  const contentReady = ref(!startsOnHome)
  const reducedMotion = ref(false)
  const motionReady = ref(false)
  const animatedReady = ref(false)
  let media: ReturnType<typeof gsap.matchMedia> | undefined
  let context: gsap.Context | undefined
  let transition: gsap.core.Timeline | undefined
  let observer: ResizeObserver | undefined
  let stopScrollLock: (() => void) | undefined
  let previousScrollLock: string | null = null
  let locked = false
  let disposed = false
  let revealTimer: ReturnType<typeof setTimeout> | undefined
  let wheelTimer: ReturnType<typeof setTimeout> | undefined
  let wheelDistance = 0
  let wheelConsumed = false
  let touchStartY = 0
  let touchConsumed = false
  const WHEEL_THRESHOLD = 64
  const TOUCH_THRESHOLD = 48
  const GESTURE_IDLE_MS = 320
  const REVEAL_HOLD_MS = 550

  function targetTransform() {
    if (!viewport.value || !brand.value || !anchor.value) return { x: 0, y: 0, scale: 1 }
    // 固定視窗層不受文件高度、頁面捲動或路由內容影響。
    const shellBox = viewport.value.getBoundingClientRect()
    const destination = anchor.value.getBoundingClientRect()
    // 桌機定位點高為零：y 與 scale 分別保持 0、1。
    // 窄螢幕改為頂部縮小品牌圖，留出全寬閱讀區域。
    const compact = destination.height > 0
    return {
      x: destination.left + destination.width / 2 - shellBox.left - shellBox.width / 2,
      y: compact
        ? destination.top + destination.height / 2 - shellBox.top - shellBox.height / 2
        : 0,
      scale: compact ? destination.height / brand.value.offsetHeight : 1,
    }
  }

  function placeBrand() {
    if (stage.value !== 'content' || !context) return
    context.add(() => {
      gsap.set(brand.value, targetTransform())
    })
  }

  function detachGestures() {
    window.removeEventListener('wheel', onWheel)
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('touchstart', onTouchStart)
    window.removeEventListener('touchmove', onTouchMove)
    window.removeEventListener('touchend', onTouchEnd)
    window.removeEventListener('touchcancel', onTouchEnd)
    clearTimeout(wheelTimer)
    clearTimeout(revealTimer)
  }

  function completeContent() {
    contentReady.value = true
    locked = false
    detachGestures()
  }

  function showContent() {
    transition?.kill()
    stage.value = 'content'
    placeBrand()
    context?.add(() => {
      gsap.set('.shell-reveal', { clearProps: 'opacity,visibility' })
    })
    completeContent()
  }

  function onBrandLoad() {
    animatedReady.value = true
    if (stage.value !== 'reveal') return
    // 等圖片真正載入才開始短暫鎖定，慢速連線也不會跳過第二階段。
    clearTimeout(revealTimer)
    revealTimer = setTimeout(() => {
      locked = false
    }, REVEAL_HOLD_MS)
  }

  function onBrandError() {
    // 素材載入失敗仍可繼續使用網站，保留第一張圖作為替代。
    locked = false
  }

  async function advance() {
    if (locked || stage.value === 'content') return
    locked = true
    if (stage.value === 'intro') {
      stage.value = 'reveal'
      return
    }

    stage.value = 'content'
    await nextTick()
    if (disposed || contentReady.value) return
    if (reducedMotion.value || !context) {
      showContent()
      return
    }
    context.add(() => {
      transition = gsap.timeline({
        defaults: { duration: 0.75, ease: 'power2.inOut' },
        onComplete: completeContent,
      })
      transition
        .to(brand.value, targetTransform(), 0)
        .to('.shell-reveal', { autoAlpha: 1, duration: 0.55 }, 0.15)
    })
  }

  function onWheel(event: WheelEvent) {
    if (contentReady.value || event.ctrlKey) return // 保留觸控板縮放手勢。
    event.preventDefault()
    clearTimeout(wheelTimer)
    wheelTimer = setTimeout(() => {
      wheelConsumed = false
      wheelDistance = 0
    }, GESTURE_IDLE_MS)
    if (locked || wheelConsumed || event.deltaY <= 0 || Math.abs(event.deltaX) > event.deltaY)
      return
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1
    wheelDistance += event.deltaY * unit
    if (wheelDistance >= WHEEL_THRESHOLD) {
      wheelConsumed = true
      void advance()
    }
  }

  function onKeyDown(event: KeyboardEvent) {
    if (contentReady.value || !['ArrowDown', 'PageDown', ' ', 'End'].includes(event.key)) return
    if (
      event.target instanceof Element &&
      event.target.closest('a, button, input, textarea, select, [contenteditable]')
    )
      return
    event.preventDefault()
    if (!event.repeat) void advance()
  }

  function onTouchStart(event: TouchEvent) {
    touchStartY = event.touches[0]?.clientY ?? 0
    touchConsumed = locked || event.touches.length !== 1
  }

  function onTouchMove(event: TouchEvent) {
    if (contentReady.value || event.touches.length !== 1) return
    event.preventDefault()
    if (locked || touchConsumed) return
    if (touchStartY - (event.touches[0]?.clientY ?? touchStartY) >= TOUCH_THRESHOLD) {
      touchConsumed = true
      void advance()
    }
  }

  function onTouchEnd() {
    touchConsumed = false
  }

  onMounted(() => {
    previousScrollLock = document.documentElement.getAttribute('data-intro-locked')
    stopScrollLock = watch(
      contentReady,
      (ready) => {
        document.documentElement.toggleAttribute('data-intro-locked', !ready)
      },
      { immediate: true, flush: 'sync' },
    )
    media = gsap.matchMedia()
    media.add(
      {
        normal: '(prefers-reduced-motion: no-preference)',
        reduce: '(prefers-reduced-motion: reduce)',
      },
      (ctx) => {
        context = ctx
        reducedMotion.value = Boolean(ctx.conditions?.reduce)
        motionReady.value = true
        if (reducedMotion.value) showContent()
        else placeBrand()
        // 事件回呼建立的 timeline 也加入此 context，偏好改變與卸載時一併清理。
        return () => {
          transition?.kill()
          context = undefined
        }
      },
      shell.value!,
    )

    if (!contentReady.value) {
      window.addEventListener('wheel', onWheel, { passive: false })
      window.addEventListener('keydown', onKeyDown)
      window.addEventListener('touchstart', onTouchStart, { passive: true })
      window.addEventListener('touchmove', onTouchMove, { passive: false })
      window.addEventListener('touchend', onTouchEnd)
      window.addEventListener('touchcancel', onTouchEnd)
    }
    observer = new ResizeObserver(() => {
      if (stage.value !== 'content') return
      // 視窗改變時結束過時的移動目標，再依目前可視範圍定位。
      if (!contentReady.value) showContent()
      else placeBrand()
    })
    if (viewport.value) observer.observe(viewport.value)
  })

  onUnmounted(() => {
    disposed = true
    stopScrollLock?.()
    if (previousScrollLock === null) document.documentElement.removeAttribute('data-intro-locked')
    else document.documentElement.setAttribute('data-intro-locked', previousScrollLock)
    detachGestures()
    observer?.disconnect()
    media?.revert()
  })

  return {
    stage,
    contentReady,
    reducedMotion,
    motionReady,
    animatedReady,
    onBrandLoad,
    onBrandError,
    showContent,
  }
}
