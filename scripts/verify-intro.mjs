// 測試真實 Vue reactivity 與入口事件控制；DOM / GSAP 為替身，不能取代瀏覽器 QA。
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import * as vue from 'vue'
import ts from 'typescript'

const source = readFileSync(new URL('../src/composables/useIntro.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText

const timing = (name) => Number(source.match(new RegExp(`^const ${name} = (\\d+)$`, 'm'))?.[1])
const INTRO_MS = timing('INTRO_HOLD_MS')
const AUTO_MS = timing('REVEAL_AUTO_HOLD_MS')
const MANUAL_MS = timing('REVEAL_MANUAL_HOLD_MS')
const LOAD_TIMEOUT_MS = timing('IMAGE_LOAD_TIMEOUT_MS')
const IDLE_MS = timing('GESTURE_IDLE_MS')
const FRAME_MS = 16
const png = readFileSync(new URL('../public/images/intro/hello-2.png', import.meta.url))
const delays = []
let frameCount, playCount
for (let offset = 8; offset < png.length;) {
  const length = png.readUInt32BE(offset)
  const chunk = png.toString('ascii', offset + 4, offset + 8)
  if (chunk === 'acTL') {
    frameCount = png.readUInt32BE(offset + 8)
    playCount = png.readUInt32BE(offset + 12)
  }
  if (chunk === 'fcTL') {
    delays.push((1000 * png.readUInt16BE(offset + 28)) / (png.readUInt16BE(offset + 30) || 100))
  }
  offset += length + 12
}
assert.equal(frameCount, 8)
assert.equal(playCount, 0, 'APNG 無限循環，不等待 animationend')
assert.equal(delays.length, frameCount)
const apngCycleMs = delays.reduce((sum, delay) => sum + delay, 0)
assert.equal(apngCycleMs, 4000, '素材維持原本 4 秒循環，停留時間依最新需求獨立設定')
assert.equal(INTRO_MS, 2500)
assert.equal(AUTO_MS, 3000)
assert.ok(MANUAL_MS > 0 && MANUAL_MS < AUTO_MS)
assert.ok(LOAD_TIMEOUT_MS > 0)
console.log(`PASS APNG ${frameCount} 格、完整一輪 ${apngCycleMs}ms、無限循環與集中時序常數`)

function fixture({ home = true, reduce = false, compact = false, initialLock = null } = {}) {
  const mounted = [],
    unmounted = [],
    listeners = new Map(),
    timers = new Map(),
    sets = []
  const attributes = new Map(initialLock === null ? [] : [['data-intro-locked', initialLock]])
  let now = 0,
    timerId = 0,
    mediaCallback,
    cleanup,
    tween,
    resize,
    observed,
    timelineCount = 0
  let disconnected = false,
    reverted = false,
    rootScroll = 0
  const ctx = { conditions: { reduce }, add: (fn) => fn() }
  const gsap = {
    matchMedia: () => ({
      add: (_conditions, fn) => {
        mediaCallback = fn
        cleanup = fn(ctx)
      },
      revert: () => {
        cleanup?.()
        reverted = true
      },
    }),
    set: (target, vars) => sets.push({ target, vars }),
    timeline: (options) => {
      timelineCount++
      tween = {
        calls: [],
        killed: false,
        to(target, vars) {
          this.calls.push({ target, vars })
          return this
        },
        kill() {
          this.killed = true
        },
        finish() {
          options.onComplete()
        },
      }
      return tween
    },
  }
  class ElementStub {
    constructor(interactive = false) {
      this.interactive = interactive
    }
    closest() {
      return this.interactive ? this : null
    }
  }
  const sandbox = {
    exports: {},
    require: (id) =>
      id === 'vue'
        ? {
            ...vue,
            onMounted: (fn) => mounted.push(fn),
            onUnmounted: (fn) => unmounted.push(fn),
          }
        : { gsap },
    Element: ElementStub,
    performance: { now: () => now },
    document: {
      documentElement: {
        getAttribute: (name) => attributes.get(name) ?? null,
        setAttribute: (name, value) => attributes.set(name, value),
        removeAttribute: (name) => attributes.delete(name),
        toggleAttribute: (name, force) => {
          if (force) attributes.set(name, '')
          else attributes.delete(name)
        },
      },
    },
    window: {
      innerHeight: 1024,
      addEventListener: (name, handler) => listeners.set(name, handler),
      removeEventListener: (name, handler) => {
        if (listeners.get(name) === handler) listeners.delete(name)
      },
    },
    ResizeObserver: class {
      constructor(fn) {
        resize = fn
      }
      observe(target) {
        observed = target
      }
      disconnect() {
        disconnected = true
      }
    },
    setTimeout: (fn, delay) => {
      const id = ++timerId
      timers.set(id, { fn, at: now + delay })
      return id
    },
    clearTimeout: (id) => timers.delete(id),
    requestAnimationFrame: (fn) => {
      const id = ++timerId
      timers.set(id, { fn, at: now + FRAME_MS })
      return id
    },
    cancelAnimationFrame: (id) => timers.delete(id),
  }
  vm.runInNewContext(compiled, sandbox)
  const root = {
    value: {
      getBoundingClientRect: () => ({ left: 0, top: -rootScroll, width: 1440, height: 6000 }),
    },
  }
  const viewport = {
    value: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1440, height: 1024 }) },
  }
  const brand = { value: { offsetHeight: 625 } }
  const anchor = {
    value: {
      getBoundingClientRect: () =>
        compact
          ? { left: 16, top: 16, width: 72, height: 100 }
          : { left: 175, top: 512, width: 0, height: 0 },
    },
  }
  const state = sandbox.exports.useIntro(root, viewport, brand, anchor, home)
  mounted.forEach((fn) => fn())
  assert.equal(observed, viewport.value, '只觀察固定視窗，不依文件高度重定位')

  async function tick(ms) {
    const end = now + ms
    await vue.nextTick()
    // 依時間順序執行，回呼中新建的計時器也必須經過自己的等待時間。
    while (true) {
      const next = [...timers].sort((a, b) => a[1].at - b[1].at)[0]
      if (!next || next[1].at > end) break
      now = next[1].at
      timers.delete(next[0])
      next[1].fn()
      await vue.nextTick()
    }
    now = end
    await vue.nextTick()
  }
  function fire(name, extra = {}) {
    const event = {
      deltaY: 80,
      deltaX: 0,
      deltaMode: 0,
      ctrlKey: false,
      repeat: false,
      button: 0,
      detail: 1,
      touches: [],
      target: new ElementStub(),
      prevented: false,
      preventDefault() {
        this.prevented = true
      },
      ...extra,
    }
    listeners.get(name)?.(event)
    return event
  }
  return {
    state,
    tick,
    fire,
    sets,
    listeners,
    interactiveTarget: () => new ElementStub(true),
    get timerCount() {
      return timers.size
    },
    get timelineCount() {
      return timelineCount
    },
    get tween() {
      return tween
    },
    get scrollLocked() {
      return attributes.has('data-intro-locked')
    },
    resize: () => resize(),
    scroll: (position) => {
      rootScroll = position
    },
    preference(value) {
      cleanup?.()
      ctx.conditions.reduce = value
      cleanup = mediaCallback(ctx)
    },
    unmount() {
      unmounted.forEach((fn) => fn())
      assert.equal(listeners.size, 0)
      assert.equal(timers.size, 0)
      assert.ok(disconnected)
      assert.ok(reverted)
      assert.equal(attributes.get('data-intro-locked') ?? null, initialLock, '清理並還原文件捲動鎖')
    },
  }
}

async function load(f) {
  await f.state.onBrandLoad()
  await f.tick(FRAME_MS)
}
function finish(f) {
  assert.equal(f.state.stage.value, 'content')
  assert.equal(f.state.contentReady.value, false)
  assert.ok(f.scrollLocked, 'GSAP 轉場完成前維持捲動鎖')
  assert.equal(f.timelineCount, 1, '自動與手動只能建立一次轉場')
  f.tween.finish()
  assert.equal(f.scrollLocked, false)
  assert.equal(f.listeners.size, 0)
  assert.equal(f.timerCount, 0)
  for (const name of ['click', 'wheel', 'keydown', 'touchmove', 'touchend']) {
    assert.equal(f.fire(name, { key: 'ArrowDown' }).prevented, false, '正式內容不再攔截事件')
  }
}

const auto = fixture()
assert.equal(auto.state.stage.value, 'intro')
assert.ok(auto.scrollLocked)
await auto.tick(INTRO_MS - 1)
assert.equal(auto.state.stage.value, 'intro')
await auto.tick(1)
assert.equal(auto.state.stage.value, 'reveal')
await auto.tick(2000)
assert.equal(auto.state.stage.value, 'reveal', '下載時間不能計入 APNG 播放時間')
await load(auto)
await auto.tick(AUTO_MS - 1)
assert.equal(auto.state.stage.value, 'reveal')
await auto.tick(1)
assert.equal(auto.tween.calls[0].vars.x, -545)
assert.equal(auto.tween.calls[0].vars.y, 0)
assert.equal(auto.tween.calls[0].vars.scale, 1)
assert.equal(auto.tween.calls[1].vars.autoAlpha, 1)
finish(auto)
auto.unmount()
console.log('PASS 無操作依序 intro 2.5 秒 → reveal 載入顯示後 3 秒 → 原有桌機轉場')

for (const input of ['wheel', 'click', 'keydown']) {
  const manual = fixture()
  await manual.tick(INTRO_MS) // 自動進入第二階段，沒有第一個手動手勢的連續事件。
  await load(manual)
  await manual.tick(MANUAL_MS)
  manual.fire(input, { key: 'ArrowDown' })
  assert.equal(manual.state.stage.value, 'content', input + ' 在第二階段可直接觸發第三階段')
  await manual.tick(0)
  finish(manual)
  await manual.tick(AUTO_MS)
  assert.equal(manual.timelineCount, 1, '手動切換後原本 3 秒自動排程已取消')
  manual.unmount()
}
console.log('PASS 第二階段的滾輪、向下鍵、點擊皆立即接續 GSAP，不必等自動 3 秒到期')

const wheel = fixture()
assert.equal(wheel.fire('wheel', { ctrlKey: true }).prevented, false)
wheel.fire('wheel', { deltaY: -80 })
wheel.fire('wheel', { deltaX: 200 })
wheel.fire('wheel', { deltaY: 30 })
await wheel.tick(IDLE_MS + 1)
wheel.fire('wheel', { deltaY: 40 })
assert.equal(wheel.state.stage.value, 'intro', '閒置後清除累積距離')
wheel.fire('wheel', { deltaY: 30 })
assert.equal(wheel.state.stage.value, 'reveal')
await load(wheel)
for (let i = 0; i < 8; i++) {
  await wheel.tick(100)
  wheel.fire('wheel')
}
assert.equal(wheel.state.stage.value, 'reveal', '長時間觸控板慣性不可提出第二次切換')
await wheel.tick(IDLE_MS + 1)
wheel.fire('wheel')
await wheel.tick(0)
finish(wheel)
wheel.unmount()
console.log('PASS 滾輪門檻、閒置重設、觸控板慣性、手動提前切換與原生捲動恢復')

const click = fixture()
click.fire('click')
assert.equal(click.state.stage.value, 'reveal')
await load(click)
for (let i = 0; i < 8; i++) {
  await click.tick(100)
  click.fire('click')
}
assert.equal(click.state.stage.value, 'reveal', '連續點擊不可排入第二階段的提前請求')
await click.tick(AUTO_MS - 800)
finish(click)
click.unmount()
const pending = fixture()
pending.fire('click')
await pending.tick(IDLE_MS + 1)
pending.fire('click', { detail: 2 })
await pending.tick(IDLE_MS + 1)
pending.fire('click')
assert.equal(pending.timerCount, 2, '尚未載入時只保留載入逾時與點擊防抖計時器')
await load(pending)
await pending.tick(MANUAL_MS - 1)
assert.equal(pending.state.stage.value, 'reveal', '提前請求只需等待短暫保護時間')
await pending.tick(1)
finish(pending)
await pending.tick(INTRO_MS + AUTO_MS + LOAD_TIMEOUT_MS)
assert.equal(pending.timelineCount, 1, '已取消的自動計時器不會再切換')
pending.unmount()
console.log('PASS 滑鼠連點／雙擊防護、載入前的提前請求與自動計時器取消')

const boundary = fixture()
await boundary.tick(INTRO_MS - 1)
boundary.fire('click')
await boundary.tick(1)
assert.equal(boundary.state.stage.value, 'reveal', 'intro 自動排程取消後不會再提出切換')
await load(boundary)
await boundary.tick(AUTO_MS - 1)
boundary.fire('keydown', { key: 'ArrowDown' })
await boundary.tick(1)
finish(boundary)
boundary.unmount()
console.log('PASS 自動計時器到期前 1ms 手動切換的競態邊界')

const keys = fixture()
keys.fire('keydown', { key: 'ArrowDown' })
await load(keys)
await keys.tick(500)
keys.fire('keydown', { key: 'ArrowDown', repeat: true })
await keys.tick(MANUAL_MS - 500)
assert.equal(keys.state.stage.value, 'reveal', '長按不會暫存第二次切換')
keys.fire('keydown', { key: 'PageDown' })
await keys.tick(0)
finish(keys)
keys.unmount()
const queuedKey = fixture()
queuedKey.fire('keydown', { key: 'ArrowDown' })
await load(queuedKey)
queuedKey.fire('keydown', { key: 'ArrowDown' })
await queuedKey.tick(MANUAL_MS - 1)
assert.equal(queuedKey.state.stage.value, 'reveal')
await queuedKey.tick(1)
finish(queuedKey)
queuedKey.unmount()
console.log('PASS 鍵盤獨立操作、長按防護與短暫保護期間的單次提前請求')

const touch = fixture({ compact: true })
touch.fire('touchstart', { touches: [{ clientX: 30, clientY: 300 }] })
touch.fire('touchmove', { touches: [{ clientX: 30, clientY: 280 }] })
assert.equal(touch.state.stage.value, 'intro')
touch.fire('touchmove', { touches: [{ clientX: 30, clientY: 220 }] })
await load(touch)
touch.fire('touchmove', { touches: [{ clientX: 30, clientY: 100 }] })
touch.fire('touchend')
touch.fire('click')
await touch.tick(MANUAL_MS)
assert.equal(touch.state.stage.value, 'reveal', '同次滑動與觸控合成 click 不得提出第二次切換')
touch.fire('touchstart', { touches: [{ clientY: 300 }] })
touch.fire('touchmove', { touches: [{ clientY: 200 }] })
touch.fire('touchend')
await touch.tick(0)
assert.equal(touch.tween.calls[0].vars.scale, 100 / 625)
touch.unmount()
assert.ok(touch.tween.killed)
const tap = fixture({ compact: true })
tap.fire('touchstart', { touches: [{ clientY: 300 }] })
tap.fire('touchend')
tap.fire('click')
await load(tap)
await tap.tick(MANUAL_MS)
assert.equal(tap.state.stage.value, 'reveal')
tap.fire('touchstart', { touches: [{ clientY: 300 }] })
assert.equal(tap.fire('touchend').prevented, true)
await tap.tick(0)
finish(tap)
tap.unmount()
console.log('PASS 手機輕觸／向上滑動、觸控合成 click 防護、窄版定位與動畫中卸載')

for (const kind of ['touchcancel', 'horizontal', 'down', 'multi']) {
  const invalid = fixture()
  invalid.fire('touchstart', { touches: [{ clientX: 100, clientY: 200 }] })
  if (kind === 'touchcancel') invalid.fire('touchcancel')
  else
    invalid.fire('touchmove', {
      touches:
        kind === 'multi'
          ? [{ clientY: 100 }, { clientY: 100 }]
          : [{ clientX: kind === 'horizontal' ? 250 : 100, clientY: kind === 'down' ? 300 : 180 }],
    })
  invalid.fire('touchend')
  assert.equal(invalid.state.stage.value, 'intro', kind + ' 不可被誤判為輕觸')
  invalid.unmount()
}
const crossing = fixture()
crossing.fire('touchstart', { touches: [{ clientY: 300 }] })
await crossing.tick(INTRO_MS)
crossing.fire('touchend')
await load(crossing)
await crossing.tick(MANUAL_MS)
assert.equal(crossing.state.stage.value, 'reveal', '跨自動切換的同次觸控不會再前進')
crossing.unmount()
console.log('PASS 取消觸控、多指、橫向／向下滑動與跨階段手勢防護')

for (const fail of ['error', 'timeout']) {
  const fallback = fixture()
  await fallback.tick(INTRO_MS)
  if (fail === 'error') fallback.state.onBrandError()
  else await fallback.tick(LOAD_TIMEOUT_MS)
  await fallback.tick(0)
  assert.equal(fallback.state.animatedReady.value, false, '保留 hello-1 備援')
  finish(fallback)
  await fallback.state.onBrandLoad()
  await fallback.tick(LOAD_TIMEOUT_MS)
  assert.equal(fallback.state.animatedReady.value, false, '逾時後忽略遲到的載入回呼')
  fallback.unmount()
}
console.log('PASS 圖片載入失敗／逾時皆自動進入內容，遲到回呼不會重啟入口')

const reduced = fixture({ reduce: true })
assert.equal(reduced.state.stage.value, 'content')
assert.equal(reduced.state.reducedMotion.value, true)
assert.equal(reduced.scrollLocked, false)
assert.equal(reduced.listeners.size, 0)
assert.equal(reduced.timerCount, 0)
reduced.unmount()
const deep = fixture({ home: false, compact: true })
assert.equal(deep.state.contentReady.value, true)
assert.equal(deep.scrollLocked, false)
assert.equal(deep.listeners.size, 0)
assert.equal(deep.timerCount, 0)
deep.scroll(2000)
deep.state.showContent()
assert.equal(deep.sets.at(-2).vars.y, -446, '頁面捲動不影響固定品牌圖定位')
assert.equal(deep.sets.at(-2).vars.scale, 100 / 625)
deep.unmount()
console.log('PASS 減少動態直接顯示、非首頁深層連結不攔截、長頁捲動後定位維持')

for (const phase of ['intro', 'loading', 'frame', 'playing', 'queued', 'transition']) {
  const cleanup = fixture({ initialLock: 'previous-owner' })
  if (phase !== 'intro') cleanup.fire('click')
  if (['frame', 'playing', 'queued', 'transition'].includes(phase))
    await cleanup.state.onBrandLoad()
  if (['playing', 'queued', 'transition'].includes(phase)) await cleanup.tick(FRAME_MS)
  if (phase === 'queued') cleanup.fire('keydown', { key: 'ArrowDown' })
  if (phase === 'transition') await cleanup.tick(AUTO_MS)
  cleanup.unmount()
  await cleanup.state.onBrandLoad()
  cleanup.state.onBrandError()
  await cleanup.tick(LOAD_TIMEOUT_MS + MANUAL_MS)
  assert.equal(cleanup.timerCount, 0, '卸載後的非同步回呼不得重新排程')
}
for (const action of ['preference', 'skip', 'route', 'resize']) {
  const interrupted = fixture()
  interrupted.fire('click')
  await load(interrupted)
  interrupted.fire('keydown', { key: 'ArrowDown' })
  if (action === 'preference') interrupted.preference(true)
  else if (action === 'resize') {
    await interrupted.tick(MANUAL_MS)
    interrupted.resize()
    assert.ok(interrupted.tween.killed)
  } else interrupted.state.showContent() // App 的跳至內容與路由變更共用此入口。
  assert.equal(interrupted.state.contentReady.value, true)
  assert.equal(interrupted.listeners.size, 0)
  assert.equal(interrupted.timerCount, 0)
  await interrupted.tick(LOAD_TIMEOUT_MS + MANUAL_MS)
  interrupted.unmount()
}
const controls = fixture()
for (const name of ['click', 'keydown', 'touchstart']) {
  controls.fire(name, {
    key: 'ArrowDown',
    target: controls.interactiveTarget(),
    touches: [{ clientY: 0 }],
  })
}
controls.fire('touchend')
assert.equal(controls.state.stage.value, 'intro', '保留無障礙連結與互動控制項自己的事件')
controls.unmount()
console.log('PASS 各階段卸載清理、偏好／路由／跳至內容／resize 中斷、互動元素保護與捲動鎖還原')
