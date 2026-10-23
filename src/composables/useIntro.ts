import { nextTick, onMounted, onUnmounted, ref, watch, type Ref } from 'vue'
import { gsap } from 'gsap'

type IntroStage = 'intro' | 'reveal' | 'content'

const INTRO_HOLD_MS = 2500
// APNG 持續播放、不重新建立；自動停留依需求為 3 秒，手動操作只保留短暫防誤觸時間。
const REVEAL_AUTO_HOLD_MS = 3000
const REVEAL_MANUAL_HOLD_MS = 550
const IMAGE_LOAD_TIMEOUT_MS = 10000
const CONTENT_TRANSITION_SECONDS = 0.75
const CONTENT_FADE_SECONDS = 0.55
const CONTENT_FADE_DELAY_SECONDS = 0.15
const GESTURE_IDLE_MS = 320
const TOUCH_CLICK_SUPPRESSION_MS = 800
const WHEEL_THRESHOLD = 64
const TOUCH_THRESHOLD = 48
const TAP_MOVEMENT_LIMIT = 12

/** Vue 共用同一套自動／手動階段控制，GSAP 只負責既有視覺轉換。 */
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
  let pendingAdvance = false
  let imageSettled = false
  let autoTimer: ReturnType<typeof setTimeout> | undefined
  let imageLoadTimer: ReturnType<typeof setTimeout> | undefined
  let revealTimer: ReturnType<typeof setTimeout> | undefined
  let revealFrame: number | undefined
  let wheelTimer: ReturnType<typeof setTimeout> | undefined
  let clickTimer: ReturnType<typeof setTimeout> | undefined
  let wheelDistance = 0
  let wheelConsumed = false
  let clickConsumed = false
  let suppressClickUntil = 0
  let touchStartX = 0
  let touchStartY = 0
  let touchStage: IntroStage | undefined
  let touchConsumed = true
  let touchMoved = false

  function clearStageTimers() {
    clearTimeout(autoTimer)
    clearTimeout(imageLoadTimer)
    clearTimeout(revealTimer)
    if (revealFrame !== undefined) cancelAnimationFrame(revealFrame)
    autoTimer = imageLoadTimer = revealTimer = undefined
    revealFrame = undefined
    pendingAdvance = false
  }

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
    window.removeEventListener('click', onClick)
    window.removeEventListener('wheel', onWheel)
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('touchstart', onTouchStart)
    window.removeEventListener('touchmove', onTouchMove)
    window.removeEventListener('touchend', onTouchEnd)
    window.removeEventListener('touchcancel', onTouchCancel)
    clearTimeout(wheelTimer)
    clearTimeout(clickTimer)
    clearStageTimers()
  }

  function completeContent() {
    contentReady.value = true
    locked = false
    detachGestures()
  }

  function showContent() {
    if (disposed) return
    clearStageTimers()
    transition?.kill()
    stage.value = 'content'
    placeBrand()
    context?.add(() => {
      gsap.set('.shell-reveal', { clearProps: 'opacity,visibility' })
    })
    completeContent()
  }

  async function onBrandLoad() {
    if (disposed || imageSettled) return
    imageSettled = true
    animatedReady.value = true
    if (stage.value !== 'reveal') return
    clearTimeout(imageLoadTimer)
    imageLoadTimer = undefined
    // v-show 先更新，再於顯示影格開始計時；下載時間不算停留時間。
    await nextTick()
    if (disposed || stage.value !== 'reveal') return
    revealFrame = requestAnimationFrame(() => {
      revealFrame = undefined
      revealTimer = setTimeout(() => {
        revealTimer = undefined
        locked = false
        if (pendingAdvance) void advance()
      }, REVEAL_MANUAL_HOLD_MS)
      if (!pendingAdvance) {
        autoTimer = setTimeout(() => void advance(), REVEAL_AUTO_HOLD_MS)
      }
    })
  }

  function onBrandError() {
    if (disposed || imageSettled) return
    imageSettled = true
    // 素材載入失敗仍可繼續使用網站，保留第一張圖作為替代。
    if (stage.value !== 'reveal') return
    clearStageTimers()
    locked = false
    void advance()
  }

  async function advance() {
    if (disposed || stage.value === 'content') return
    // 手動請求取消自動排程；短暫保護時間內最多暫存一次，解鎖後立即接續。
    clearTimeout(autoTimer)
    autoTimer = undefined
    if (locked) {
      if (stage.value === 'reveal') pendingAdvance = true
      return
    }
    clearStageTimers()
    locked = true
    if (stage.value === 'intro') {
      stage.value = 'reveal'
      wheelDistance = 0
      wheelConsumed = wheelTimer !== undefined
      imageLoadTimer = setTimeout(onBrandError, IMAGE_LOAD_TIMEOUT_MS)
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
        defaults: { duration: CONTENT_TRANSITION_SECONDS, ease: 'power2.inOut' },
        onComplete: completeContent,
      })
      transition
        .to(brand.value, targetTransform(), 0)
        .to(
          '.shell-reveal',
          { autoAlpha: 1, duration: CONTENT_FADE_SECONDS },
          CONTENT_FADE_DELAY_SECONDS,
        )
    })
  }

  function onWheel(event: WheelEvent) {
    if (contentReady.value || event.ctrlKey) return // 保留觸控板縮放手勢。
    event.preventDefault()
    clearTimeout(wheelTimer)
    wheelTimer = setTimeout(() => {
      wheelTimer = undefined
      wheelConsumed = false
      wheelDistance = 0
    }, GESTURE_IDLE_MS)
    if (wheelConsumed || event.deltaY <= 0 || Math.abs(event.deltaX) > event.deltaY) return
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1
    wheelDistance += event.deltaY * unit
    if (wheelDistance >= WHEEL_THRESHOLD) {
      wheelConsumed = true
      void advance()
    }
  }

  function onKeyDown(event: KeyboardEvent) {
    if (contentReady.value || !['ArrowDown', 'PageDown', ' ', 'End'].includes(event.key)) return
    if (isInteractive(event.target)) return
    event.preventDefault()
    if (!event.repeat) void advance()
  }

  function isInteractive(target: EventTarget | null) {
    return (
      target instanceof Element &&
      target.closest('a, button, input, textarea, select, [contenteditable], [role="button"]')
    )
  }

  function onClick(event: MouseEvent) {
    if (
      contentReady.value ||
      event.button !== 0 ||
      performance.now() < suppressClickUntil ||
      isInteractive(event.target)
    )
      return
    const consumed = clickConsumed || event.detail > 1
    clickConsumed = true
    clearTimeout(clickTimer)
    clickTimer = setTimeout(() => {
      clickConsumed = false
    }, GESTURE_IDLE_MS)
    if (!consumed) void advance()
  }

  function onTouchStart(event: TouchEvent) {
    suppressClickUntil = performance.now() + TOUCH_CLICK_SUPPRESSION_MS
    touchStartX = event.touches[0]?.clientX ?? 0
    touchStartY = event.touches[0]?.clientY ?? 0
    touchStage = stage.value
    touchConsumed = event.touches.length !== 1 || Boolean(isInteractive(event.target))
    touchMoved = false
  }

  function onTouchMove(event: TouchEvent) {
    if (contentReady.value) return
    if (event.touches.length !== 1) {
      touchConsumed = true
      return
    }
    event.preventDefault()
    const dx = (event.touches[0]?.clientX ?? touchStartX) - touchStartX
    const dy = touchStartY - (event.touches[0]?.clientY ?? touchStartY)
    if (Math.abs(dx) > TAP_MOVEMENT_LIMIT || Math.abs(dy) > TAP_MOVEMENT_LIMIT) touchMoved = true
    if (touchConsumed || touchStage !== stage.value) return
    if (dy >= TOUCH_THRESHOLD && dy > Math.abs(dx)) {
      touchConsumed = true
      void advance()
    }
  }

  function onTouchEnd(event: TouchEvent) {
    suppressClickUntil = performance.now() + TOUCH_CLICK_SUPPRESSION_MS
    if (!contentReady.value && !touchConsumed && !touchMoved && touchStage === stage.value) {
      event.preventDefault()
      void advance()
    }
    touchConsumed = true
    touchStage = undefined
  }

  function onTouchCancel() {
    suppressClickUntil = performance.now() + TOUCH_CLICK_SUPPRESSION_MS
    touchConsumed = true
    touchStage = undefined
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
          clearStageTimers()
          transition?.kill()
          context = undefined
        }
      },
      shell.value!,
    )

    if (!contentReady.value) {
      autoTimer = setTimeout(() => void advance(), INTRO_HOLD_MS)
      window.addEventListener('click', onClick)
      window.addEventListener('wheel', onWheel, { passive: false })
      window.addEventListener('keydown', onKeyDown)
      window.addEventListener('touchstart', onTouchStart, { passive: true })
      window.addEventListener('touchmove', onTouchMove, { passive: false })
      window.addEventListener('touchend', onTouchEnd, { passive: false })
      window.addEventListener('touchcancel', onTouchCancel)
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
