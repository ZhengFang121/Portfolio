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
    observed
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
    closest() {
      return null
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

  function tick(ms) {
    now += ms
    for (const [id, timer] of timers)
      if (timer.at <= now) {
        timers.delete(id)
        timer.fn()
      }
  }
  function fire(name, extra = {}) {
    const event = {
      deltaY: 80,
      deltaX: 0,
      deltaMode: 0,
      ctrlKey: false,
      repeat: false,
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

const wheel = fixture()
assert.equal(wheel.state.stage.value, 'intro')
assert.ok(wheel.scrollLocked)
wheel.fire('wheel', { deltaY: 30 })
assert.equal(wheel.state.stage.value, 'intro')
wheel.fire('wheel', { deltaY: 40 })
assert.equal(wheel.state.stage.value, 'reveal')
wheel.state.onBrandLoad()
for (let i = 0; i < 12; i++) {
  wheel.tick(100)
  wheel.fire('wheel')
}
assert.equal(wheel.state.stage.value, 'reveal', '觸控板慣性不能一次跳過兩個階段')
assert.ok(wheel.scrollLocked)
wheel.tick(321)
wheel.fire('wheel')
await new Promise(setImmediate)
assert.equal(wheel.state.stage.value, 'content')
assert.equal(wheel.state.contentReady.value, false)
assert.ok(wheel.scrollLocked, '動畫期間仍鎖住文件')
assert.equal(wheel.tween.calls[0].vars.x, -545)
assert.equal(wheel.tween.calls[0].vars.y, 0)
assert.equal(wheel.tween.calls[0].vars.scale, 1)
wheel.tween.finish()
assert.equal(wheel.scrollLocked, false)
assert.equal(wheel.listeners.size, 0)
assert.equal(wheel.fire('wheel').prevented, false, '正式內容保留原生 wheel 捲動')
wheel.unmount()
console.log('PASS 兩階段手勢、動畫鎖、完成後解除文件捲動鎖與事件攔截')

const keys = fixture()
keys.fire('keydown', { key: 'ArrowDown' })
keys.state.onBrandLoad()
keys.tick(600)
keys.fire('keydown', { key: 'ArrowDown', repeat: true })
assert.equal(keys.state.stage.value, 'reveal')
keys.fire('keydown', { key: 'PageDown' })
await new Promise(setImmediate)
keys.tween.finish()
assert.equal(keys.fire('keydown', { key: 'ArrowDown' }).prevented, false)
keys.unmount()
console.log('PASS 鍵盤獨立按鍵、長按防護與正式內容原生操作')

const touch = fixture({ compact: true })
touch.fire('touchstart', { touches: [{ clientY: 300 }] })
touch.fire('touchmove', { touches: [{ clientY: 220 }] })
touch.state.onBrandLoad()
touch.tick(600)
touch.fire('touchmove', { touches: [{ clientY: 100 }] })
assert.equal(touch.state.stage.value, 'reveal')
touch.fire('touchend')
touch.fire('touchstart', { touches: [{ clientY: 300 }] })
touch.fire('touchmove', { touches: [{ clientY: 200 }] })
await new Promise(setImmediate)
assert.equal(touch.tween.calls[0].vars.scale, 100 / 625)
touch.unmount()
assert.ok(touch.tween.killed)
console.log('PASS 觸控兩次滑動、窄螢幕定位、動畫中卸載清理')

const reduced = fixture({ reduce: true })
assert.equal(reduced.state.stage.value, 'content')
assert.equal(reduced.state.reducedMotion.value, true)
assert.equal(reduced.scrollLocked, false)
assert.equal(reduced.listeners.size, 0)
reduced.unmount()
const deep = fixture({ home: false, compact: true })
assert.equal(deep.state.contentReady.value, true)
assert.equal(deep.scrollLocked, false)
deep.scroll(2000)
deep.state.showContent()
assert.equal(deep.sets.at(-2).vars.y, -446, '頁面捲動不影響固定品牌圖定位')
assert.equal(deep.sets.at(-2).vars.scale, 100 / 625)
deep.unmount()
console.log('PASS 減少動態、深層連結，以及長頁面捲動後固定圖定位')

const changed = fixture()
changed.fire('wheel')
changed.preference(true)
assert.equal(changed.scrollLocked, false)
assert.equal(changed.listeners.size, 0)
changed.unmount()
const skipped = fixture({ initialLock: 'previous-owner' })
skipped.state.showContent()
assert.equal(skipped.state.contentReady.value, true)
assert.equal(skipped.scrollLocked, false)
skipped.unmount()
const error = fixture()
error.fire('keydown', { key: 'ArrowDown' })
error.state.onBrandError()
error.fire('keydown', { key: 'ArrowDown' })
await new Promise(setImmediate)
error.tween.finish()
error.unmount()
console.log('PASS 動態偏好切換、跳至內容、圖片失敗可繼續、還原原有鎖定狀態')
