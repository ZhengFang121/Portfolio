// 真實 Chromium 檢查；先 npm run build，再 npm run verify:modal。
// 不安裝瀏覽器或套件；非 macOS 可透過 CHROME_BIN 指定 Chromium 路徑。
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { access, mkdir, mkdtemp, readFile, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { extname, resolve, join } from 'node:path'
import { spawn } from 'node:child_process'

const binary =
  process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
await access(binary)
const root = resolve('dist')
await access(join(root, 'index.html'))
const output = resolve('.impeccable/review/project-modal')
await mkdir(output, { recursive: true })
const profile = await mkdtemp(join(tmpdir(), 'portfolio-modal-chrome-'))
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
}
const server = createServer(async (req, res) => {
  try {
    let file = resolve(
      root,
      '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname),
    )
    if (!file.startsWith(root + '/')) file = join(root, 'index.html')
    try {
      if (!(await stat(file)).isFile()) file = join(root, 'index.html')
    } catch {
      file = join(root, 'index.html')
    }
    res.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream')
    res.end(await readFile(file))
  } catch {
    res.statusCode = 500
    res.end('error')
  }
})
await new Promise((done) => server.listen(0, '127.0.0.1', done))
const address = `http://127.0.0.1:${server.address().port}`
const chrome = spawn(
  binary,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    '--remote-debugging-port=0',
    `--user-data-dir=${profile}`,
    'about:blank',
  ],
  { stdio: ['ignore', 'ignore', 'pipe'] },
)
let socket
const delay = (ms) => new Promise((done) => setTimeout(done, ms))
const report = []
try {
  const endpoint = await new Promise((done, reject) => {
    let log = ''
    const timer = setTimeout(
      () => reject(new Error('Chrome startup timeout: ' + log.slice(-500))),
      15000,
    )
    chrome.stderr.on('data', (data) => {
      log += data
      const match = log.match(/DevTools listening on (ws:\/\/[^\s]+)/)
      if (match) {
        clearTimeout(timer)
        done(match[1])
      }
    })
    chrome.on('error', (error) => {
      clearTimeout(timer)
      reject(error)
    })
  })
  socket = new WebSocket(endpoint)
  await new Promise((done, reject) => {
    socket.onopen = done
    socket.onerror = reject
  })
  let sequence = 0
  const pending = new Map()
  socket.onmessage = ({ data }) => {
    const result = JSON.parse(data)
    if (!result.id) return
    const task = pending.get(result.id)
    pending.delete(result.id)
    if (result.error) task.reject(new Error(JSON.stringify(result.error)))
    else task.done(result.result)
  }
  function call(method, params = {}, sessionId) {
    return new Promise((done, reject) => {
      const id = ++sequence
      pending.set(id, { done, reject })
      socket.send(JSON.stringify({ id, method, params, sessionId }))
    })
  }
  const { targetId } = await call('Target.createTarget', { url: 'about:blank' })
  const { sessionId } = await call('Target.attachToTarget', { targetId, flatten: true })
  const cdp = (method, params) => call(method, params, sessionId)
  async function evaluate(expression) {
    const result = await cdp('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    })
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails))
    return result.result.value
  }
  async function waitFor(expression) {
    for (let attempt = 0; attempt < 100; attempt++) {
      if (await evaluate(expression)) return
      await delay(50)
    }
    throw new Error(`Timeout: ${expression}`)
  }
  async function navigate(path) {
    await cdp('Page.navigate', { url: address + path })
    await waitFor(
      `location.pathname === ${JSON.stringify(path)} && document.readyState === 'complete' && document.querySelector('.app-shell')?.dataset.contentReady === 'true' && document.querySelector('main h1')`,
    )
    await evaluate('document.fonts.ready.then(() => true)')
    await delay(150)
  }
  async function key(key, modifiers = 0) {
    const windowsVirtualKeyCode = { Tab: 9, Enter: 13, Escape: 27, PageDown: 34 }[key]
    await cdp('Input.dispatchKeyEvent', {
      type: 'keyDown',
      key,
      code: key,
      windowsVirtualKeyCode,
      modifiers,
    })
    await cdp('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key,
      code: key,
      windowsVirtualKeyCode,
      modifiers,
    })
  }
  async function clickAt(x, y, button = 'left') {
    await cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y })
    await cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button, clickCount: 1 })
    await cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button, clickCount: 1 })
  }
  async function click(selector) {
    const { x, y } = await evaluate(
      `(() => { const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2} })()`,
    )
    await clickAt(x, y)
  }
  const geometry = `(() => {
    const rect = el => { const r=el.getBoundingClientRect(); return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height} };
    const shell=document.querySelector('.app-shell'), panel=document.querySelector('.project-modal-panel'), dialog=document.querySelector('.project-modal');
    return {content:rect(document.querySelector('.site-content')),contentTop:parseFloat(getComputedStyle(document.querySelector('.site-content')).paddingTop),nav:rect(document.querySelector('.shell-header')),brand:rect(document.querySelector('.intro-brand')),stage:shell.dataset.stage,scroll:scrollY,
      ...(dialog ? {dialog:rect(dialog), panel:rect(panel),toolbar:rect(dialog.querySelector('.project-modal-toolbar')),heading:rect(dialog.querySelector('h2')),close:rect(document.querySelector('.project-modal-close')),dialogCount:document.querySelectorAll('[role="dialog"]').length,closeCount:dialog.querySelectorAll('button').length,
        labelledBy:dialog.getAttribute('aria-labelledby'),title:dialog.querySelector('h2').id,titleText:dialog.querySelector('h2').textContent,modal:dialog.getAttribute('aria-modal'),hasH1:!!dialog.querySelector('h1'),
        border:getComputedStyle(dialog).borderTop,background:getComputedStyle(dialog).backgroundColor,color:getComputedStyle(panel).color,opacity:getComputedStyle(panel).opacity,mask:getComputedStyle(dialog.parentElement).backgroundColor,
        closeBackground:getComputedStyle(dialog.querySelector('button')).backgroundColor,closeColor:getComputedStyle(dialog.querySelector('button')).color,dialogOverflowY:getComputedStyle(dialog).overflowY,
        headingFocused:document.activeElement===dialog.querySelector('h2'),backgroundInert:[...shell.children].filter(el=>el!==dialog.parentElement).every(el=>el.inert),overflow:getComputedStyle(document.documentElement).overflowY,
        scrollable:panel.scrollHeight>panel.clientHeight,overflowX:panel.scrollWidth>panel.clientWidth,placeholderBackground:getComputedStyle(dialog.querySelector('.placeholder-panel')).backgroundColor,
        mount:dialog.parentElement.parentElement.className} : {})}
  })()`
  async function closed(selector, before) {
    await waitFor(`!document.querySelector('.project-modal')`)
    assert.ok(
      await evaluate(
        `document.activeElement===document.querySelector(${JSON.stringify(selector)})`,
      ),
      '焦點回到原卡片',
    )
    const after = await evaluate(geometry)
    assert.equal(after.scroll, before.scroll, '關閉還原捲動位置')
    assert.deepEqual(after.nav, before.nav, '關閉後固定導覽位置不變')
    assert.deepEqual(after.brand, before.brand, '關閉後人物位置不變')
    assert.ok(
      await evaluate(
        `!document.querySelector('.site-content').inert && !document.body.classList.contains('p-overflow-hidden') && getComputedStyle(document.documentElement).overflowY==='auto'`,
      ),
      '清除背景鎖定',
    )
  }
  await cdp('Page.enable')
  await cdp('Runtime.enable')
  await cdp('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  })
  const sizes = [
    [1440, 1024],
    [900, 900],
    [899, 900],
    [768, 1024],
    [390, 844],
    [1440, 400],
    [768, 480],
    [390, 480],
    [390, 320],
  ]
  for (const [width, height] of sizes) {
    await cdp('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: false,
    })
    for (const path of ['/', '/works']) {
      await navigate(path)
      const selector = '.work-card'
      await evaluate(
        `document.querySelector('${selector}').scrollIntoView({block:'center',behavior:'instant'}); document.querySelector('${selector}').focus({preventScroll:true})`,
      )
      const before = await evaluate(geometry)
      const url = await evaluate('location.href')
      await key('Enter')
      await waitFor(`document.querySelector('.project-modal h2')===document.activeElement`)
      await evaluate('document.fonts.ready.then(() => true)')
      const state = await evaluate(geometry)
      assert.equal(await evaluate('location.href'), url, '開啟不改網址')
      for (const edge of ['left', 'right', 'width']) {
        assert.ok(
          Math.abs(state.dialog[edge] - before.content[edge]) < 1,
          `${width} ${path}: 對齊內容 ${edge}`,
        )
        assert.ok(
          Math.abs(state.dialog[edge] - state.content[edge]) < 1,
          `${width} ${path}: 開啟中仍對齊內容 ${edge}`,
        )
      }
      assert.ok(Math.abs(state.dialog.top - 24) < 1, '頂端保留 24px，不預留導覽列高度')
      assert.ok(Math.abs(state.dialog.top - (height - state.dialog.bottom)) < 1, '上下留白一致')
      assert.ok(Math.abs(state.dialog.bottom - (height - 24)) < 1, '延伸至可視底端並留 24px')
      assert.ok(
        Math.abs(state.dialog.right - state.close.right - 22) < 1,
        '關閉鈕距右側內邊界 16px',
      )
      assert.ok(Math.abs(state.close.top - state.dialog.top - 18) < 1, '關閉鈕距上方內邊界 12px')
      assert.ok(
        state.close.bottom <= state.panel.top && state.heading.top >= state.panel.top,
        '關閉鈕與標題、捲動內容不重疊',
      )
      assert.equal(state.close.height, 48)
      assert.equal(state.close.width, 48)
      assert.equal(state.closeBackground, 'rgb(251, 237, 179)')
      assert.equal(state.closeColor, 'rgb(167, 31, 36)')
      assert.equal(state.dialogOverflowY, 'hidden', '外框不產生第二個捲軸')
      assert.ok(
        Math.abs(state.panel.bottom - (state.dialog.bottom - 6)) < 1,
        '下方不再保留外部關閉鈕空間',
      )
      assert.equal(state.dialogCount, 1)
      assert.equal(state.closeCount, 1)
      assert.equal(state.labelledBy, state.title)
      assert.equal(state.modal, 'true')
      assert.equal(state.hasH1, false)
      assert.equal(state.border, '6px solid rgb(185, 218, 232)')
      assert.equal(state.background, 'rgb(255, 255, 255)')
      assert.equal(state.placeholderBackground, 'rgb(255, 255, 255)')
      assert.equal(state.color, 'rgb(0, 0, 0)')
      assert.equal(state.opacity, '1')
      assert.match(state.mask, /0\.55\)/, '遮罩半透明且不影響面板')
      assert.ok(state.backgroundInert && state.headingFocused && state.scrollable)
      assert.equal(state.overflowX, false)
      assert.equal(state.mount, 'app-shell')
      assert.equal(state.overflow, 'hidden')
      assert.deepEqual(state.nav, before.nav)
      assert.deepEqual(state.brand, before.brand)
      assert.equal(state.stage, before.stage)
      assert.equal(
        state.scroll,
        before.scroll,
        JSON.stringify({ width, height, path, before, state }),
      )
      for (const modifiers of [0, 8]) {
        for (let i = 0; i < 6; i++) {
          await key('Tab', modifiers)
          assert.ok(
            await evaluate(
              `document.querySelector('.project-modal').contains(document.activeElement)`,
            ),
            'Tab 焦點留在 Dialog',
          )
        }
      }
      await evaluate(`document.querySelector('.project-modal-panel').focus({preventScroll:true})`)
      await key('PageDown')
      await waitFor(`document.querySelector('.project-modal-panel').scrollTop>0`)
      assert.equal(await evaluate('scrollY'), before.scroll, '內部鍵盤捲動不帶動背景')
      const scrolled = await evaluate(geometry)
      assert.deepEqual(scrolled.close, state.close, '捲動後關閉鈕保持原位')
      assert.deepEqual(scrolled.dialog, state.dialog, '捲動後外框保持原位')
      await delay(500)
      await evaluate(
        `document.querySelector('.project-modal-panel').scrollTo({top:0,behavior:'instant'}); document.querySelector('.project-modal h2').focus({preventScroll:true})`,
      )
      await waitFor(`document.querySelector('.project-modal-panel').scrollTop===0`)
      if (path === '/works') {
        await cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 0, y: 0 })
        const { data } = await cdp('Page.captureScreenshot', { format: 'png' })
        await writeFile(join(output, `${width}x${height}.png`), Buffer.from(data, 'base64'))
      }
      await key('Escape')
      await closed(selector, before)
      await click(selector)
      await waitFor(`document.querySelector('.project-modal h2')===document.activeElement`)
      await click('.project-modal-close')
      await closed(selector, before)
      await click(selector)
      await waitFor(`document.querySelector('.project-modal h2')===document.activeElement`)
      await clickAt(2, 2)
      await closed(selector, before)
      report.push({ width, height, path, before, state })
    }
    console.log(`PASS ${width}×${height}: 首頁／Works 對齊、白底藍框、三種關閉、焦點與捲動`)
  }
  await cdp('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 1024,
    deviceScaleFactor: 1,
    mobile: false,
  })
  await cdp('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
  })
  await navigate('/works')
  let projectFrame
  for (const index of [1, 2, 3, 4, 5]) {
    const selector = `.work-card:nth-child(${index})`
    await evaluate(
      `document.querySelector('${selector}').scrollIntoView({block:'center',behavior:'instant'});document.querySelector('${selector}').focus({preventScroll:true})`,
    )
    const before = await evaluate(geometry)
    await key('Enter')
    await waitFor(`document.querySelector('.project-modal h2')===document.activeElement`)
    const frame = (await evaluate(geometry)).dialog
    if (projectFrame) assert.deepEqual(frame, projectFrame, '切換作品時視窗高度穩定')
    projectFrame = frame
    assert.equal(
      await evaluate(`document.querySelector('.project-modal h2').textContent`),
      await evaluate(`document.querySelector('${selector} h3').textContent`),
      '五個作品內容正確',
    )
    await key('Escape')
    await closed(selector, before)
  }
  // 捕捉元件 handler 處理後的 defaultPrevented；測試端再取消瀏覽器導覽。
  for (const modifier of ['ctrlKey', 'metaKey', 'shiftKey', 'altKey', 'middle']) {
    const prevented = await evaluate(`(() => {
      const card=document.querySelector('.work-card'); let prevented;
      card.addEventListener('click',event=>{prevented=event.defaultPrevented;event.preventDefault()},{once:true});
      card.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,${modifier === 'middle' ? 'button:1' : `${modifier}:true`}}));return prevented
    })()`)
    assert.equal(prevented, false, `${modifier}: 不攔截原生連結`)
    assert.ok(await evaluate(`!document.querySelector('.project-modal')`))
  }
  await evaluate(
    `document.querySelector('.work-card').scrollIntoView({block:'center',behavior:'instant'});document.querySelector('.work-card').focus({preventScroll:true})`,
  )
  const existingTargets = new Set(
    (await call('Target.getTargets')).targetInfos.map((target) => target.targetId),
  )
  const cardCenter = await evaluate(
    `(() => { const r=document.querySelector('.work-card').getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2} })()`,
  )
  await clickAt(cardCenter.x, cardCenter.y, 'middle')
  let linkedTarget
  for (let attempt = 0; attempt < 100; attempt++) {
    linkedTarget = (await call('Target.getTargets')).targetInfos.find(
      (target) =>
        !existingTargets.has(target.targetId) && target.url === address + '/works/project-01',
    )
    if (linkedTarget) break
    await delay(50)
  }
  assert.ok(linkedTarget, '原生滑鼠中鍵可另開作品獨立頁')
  await call('Target.closeTarget', { targetId: linkedTarget.targetId })
  assert.equal(await evaluate('location.pathname'), '/works')
  assert.ok(await evaluate(`!document.querySelector('.project-modal')`))
  await key('Enter')
  await waitFor(`document.querySelector('.project-modal h2')===document.activeElement`)
  await cdp('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: false,
  })
  const resized = await evaluate(geometry)
  assert.ok(
    Math.abs(resized.dialog.left - resized.content.left) < 1 &&
      Math.abs(resized.dialog.right - resized.content.right) < 1,
    '開啟中跨斷點仍對齊',
  )
  await cdp('Emulation.setTouchEmulationEnabled', { enabled: true })
  const touchPoint = {
    x: (resized.panel.left + resized.panel.right) / 2,
    y: (resized.panel.top + resized.panel.bottom) / 2,
  }
  const touchScroll = await evaluate('scrollY')
  await cdp('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [touchPoint] })
  for (let step = 1; step <= 6; step++) {
    await cdp('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: touchPoint.x, y: touchPoint.y - step * 24 }],
    })
    await delay(30)
  }
  await cdp('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await waitFor(`document.querySelector('.project-modal-panel').scrollTop>0`)
  assert.equal(await evaluate('scrollY'), touchScroll, '觸控捲動不帶動背景')
  // 模擬程式導覽造成卸載，確認沒有殘留 inert、捲動鎖或 Escape listener。
  await evaluate(`document.querySelector('.nav-image-link[href="/about"]').click()`)
  await waitFor(`location.pathname==='/about' && !document.querySelector('.project-modal')`)
  assert.ok(
    await evaluate(
      `!document.querySelector('.site-content').inert && !document.body.classList.contains('p-overflow-hidden') && getComputedStyle(document.documentElement).overflowY==='auto'`,
    ),
  )
  for (const path of [
    '/works/project-01',
    '/works/project-02',
    '/works/project-03',
    '/works/project-04',
    '/works/project-05',
    '/works/project-06',
    '/works/unknown-project',
    '/missing-page',
  ]) {
    await navigate(path)
    assert.ok(
      await evaluate(
        `!!document.querySelector('main h1') && !document.querySelector('[role="dialog"]')`,
      ),
    )
    if (path.includes('project-06') || path.includes('unknown') || path === '/missing-page')
      assert.equal(
        await evaluate(`document.querySelector('main h1').textContent`),
        '找不到這個頁面',
      )
  }
  await writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2))
  console.log(
    `PASS 五個作品、修飾鍵、原生中鍵另開頁、觸控捲動、開啟中 resize、卸載清理、直接網址與 404。證據：${output}`,
  )
} finally {
  socket?.close()
  chrome.kill()
  await new Promise((done) => server.close(done))
}
