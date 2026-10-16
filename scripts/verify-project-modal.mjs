// 真實 Chromium 檢查；先 npm run build，再 npm run verify:modal。
// 不安裝瀏覽器或套件；非 macOS 可透過 CHROME_BIN 指定 Chromium 路徑。
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { access, mkdir, mkdtemp, readFile, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { extname, resolve, join } from 'node:path'
import { spawn } from 'node:child_process'
import { createReadStream } from 'node:fs'

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
  '.mp4': 'video/mp4',
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
    if (extname(file) === '.mp4') {
      const { size } = await stat(file)
      res.setHeader('Accept-Ranges', 'bytes')
      const range = req.headers.range?.match(/^bytes=(\d+)-(\d*)$/)
      const start = range ? Number(range[1]) : 0
      const end = range?.[2] ? Math.min(Number(range[2]), size - 1) : size - 1
      if (start > end || start >= size) {
        res.writeHead(416, { 'Content-Range': `bytes */${size}` })
        return res.end()
      }
      res.setHeader('Content-Length', end - start + 1)
      if (range) res.writeHead(206, { 'Content-Range': `bytes ${start}-${end}/${size}` })
      createReadStream(file, { start, end }).pipe(res)
      return
    }
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
        scrollable:panel.scrollHeight>panel.clientHeight,overflowX:panel.scrollWidth>panel.clientWidth,placeholderBackground:dialog.querySelector('.placeholder-panel') ? getComputedStyle(dialog.querySelector('.placeholder-panel')).backgroundColor : null,
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
    assert.ok(
      await evaluate(`!window.playingVideo || window.playingVideo.paused`),
      '關閉後影片停止播放',
    )
  }
  async function checkDetail(index, width) {
    const detail = await evaluate(`(() => {
      const root = document.querySelector('.project-detail--modal');
      const card = document.querySelectorAll('.work-card')[${index}];
      const categories = root.querySelector('.project-categories');
      const list = categories.querySelector('ul');
      const rect = el => { const r=el.getBoundingClientRect(); return {left:r.left,right:r.right,top:r.top,width:r.width,height:r.height} };
      const pillStyle = el => { const s=getComputedStyle(el); return {background:s.backgroundColor,color:s.color,fontSize:s.fontSize,padding:s.padding,borderRadius:s.borderRadius} };
      return {
        text:root.textContent,year:root.querySelector('.project-design-year').textContent,
        padding:getComputedStyle(root).paddingLeft,
        root:rect(root),categories:rect(categories),list:rect(list),
        overflow:categories.scrollWidth>categories.clientWidth,
        pills:[...root.querySelectorAll('.project-category')].map(el=>({text:el.textContent.trim(),rect:rect(el),style:pillStyle(el)})),
        cardPills:[...card.querySelectorAll('.project-category')].map(el=>({text:el.textContent.trim(),style:pillStyle(el)})),
        texts:[...root.querySelectorAll('h2,h3,p')].map(el=>({align:getComputedStyle(el).textAlign,rect:rect(el)})),
        blue:[...root.querySelectorAll('.project-design-year,.project-detail-summary')].map(el=>getComputedStyle(el).color),
        titles:[root.querySelector('.project-detail-title'),card.querySelector('h3')].map(el=>getComputedStyle(el).color),
        media:rect(root.querySelector('img')),ratio:root.querySelector('img').naturalWidth/root.querySelector('img').naturalHeight,
        sections:[...root.querySelectorAll('header,section')].map(rect),
        contentSections:[...root.querySelectorAll('section')].map(section=>({
          title:section.querySelector('h3').textContent,
          content:section.querySelector('p').textContent,
          order:[...section.children].map(el=>el.tagName),
          gap:getComputedStyle(section).rowGap,
          media:[...section.querySelectorAll('.project-section-media video,.project-section-media img')].map(el=>({
            rect:rect(el),fit:getComputedStyle(el).objectFit,
            src:el.querySelector('source')?.dataset.src,type:el.querySelector('source')?.type,
            controls:el.controls,inline:el.playsInline,preload:el.preload,autoplay:el.autoplay,loop:el.loop,muted:el.muted,
            label:el.getAttribute('aria-label'),poster:el.getAttribute('poster'),
          })),
        })),
        panelOverflow:document.querySelector('.project-modal-panel').scrollWidth>document.querySelector('.project-modal-panel').clientWidth,
      }
    })()`)
    assert.ok(!detail.panelOverflow, `${width}: 介紹內容不水平溢出`)
    assert.equal(detail.padding, width <= 480 ? '24px' : width <= 899 ? '48px' : '64px')
    assert.match(
      detail.year,
      new RegExp(['2026', '2026', '2022 - 2025', '2021 - 2024', '2017'][index]),
    )
    for (const removed of ['作品內容整理中', '設計年份', '製作年份', '負責角色'])
      assert.ok(!detail.text.includes(removed))
    assert.ok(detail.blue.every((color) => color === 'rgb(185, 218, 232)'))
    assert.ok(detail.titles.every((color) => color === 'rgb(0, 0, 0)'))
    assert.ok(detail.texts.every((text) => text.align === 'center'))
    assert.equal(detail.contentSections.length, index === 0 ? 8 : 3)
    const expected = [
      ['intro', '序章動畫'],
      ['login', '登入'],
      ['home', '首頁'],
      ['records', '新增跑步紀錄'],
      ['station', '足跡驛站'],
      ['academy', '跑者學院'],
      ['plaza', '菲迪廣場'],
      ['admin', '管理者後台'],
    ]
    for (const [sectionIndex, section] of detail.contentSections.entries()) {
      assert.equal(section.gap, '24px', '段落內使用 space-6 間距')
      if (index !== 0) {
        assert.equal(section.media.length, 0, '其他作品不加入媒體')
        assert.equal(section.content, '此區內容與圖片待提供。')
        continue
      }
      const [id, title] = expected[sectionIndex]
      assert.equal(section.title, title)
      assert.equal(section.content, `${title}內文`)
      assert.deepEqual(section.order, ['H3', 'P', 'DIV'], '內標題 → 內文 → 媒體')
      assert.equal(section.media.length, 1)
      const media = section.media[0]
      assert.equal(media.src, `/videos/projects/pheidi-the-runner/${id}.mp4`)
      assert.equal(media.type, 'video/mp4')
      assert.equal(media.fit, 'contain')
      assert.ok(media.controls && media.inline && !media.autoplay && media.loop && media.muted)
      assert.equal(media.preload, 'none')
      assert.equal(media.poster, null, '沒有自行增加 poster')
      assert.ok(media.label.includes(title))
      assert.ok(
        media.rect.left >= detail.root.left && media.rect.right <= detail.root.right,
        '影片不溢出',
      )
    }
    for (const element of [
      ...detail.texts.map((text) => text.rect),
      detail.media,
      detail.categories,
    ])
      assert.ok(
        Math.abs(element.left + element.width / 2 - (detail.root.left + detail.root.width / 2)) < 1,
        '文字與媒體水平置中',
      )
    assert.ok(
      Math.abs(detail.media.width / detail.media.height - detail.ratio) < 0.01,
      '封面維持原始比例',
    )
    assert.deepEqual(
      detail.pills.map((pill) => ({ text: pill.text, style: pill.style })),
      detail.cardPills,
      '卡片與視窗共用膠囊樣式及內容',
    )
    assert.ok(
      detail.pills.every((pill) => Math.abs(pill.rect.top - detail.pills[0].rect.top) < 1),
      '膠囊維持單行',
    )
    if (!detail.overflow) {
      const first = detail.pills[0].rect,
        last = detail.pills.at(-1).rect
      assert.ok(
        Math.abs(
          (first.left + last.right) / 2 - (detail.categories.left + detail.categories.width / 2),
        ) < 1,
        '膠囊整組置中',
      )
    } else {
      await evaluate(
        `document.querySelector('.project-detail--modal .project-categories').scrollLeft=10000`,
      )
      assert.ok(
        await evaluate(
          `(() => {const region=document.querySelector('.project-detail--modal .project-categories'),last=region.querySelector('li:last-child');return region.scrollLeft>0 && last.getBoundingClientRect().right<=region.getBoundingClientRect().right+1})()`,
        ),
        '可捲至最後一顆完整膠囊',
      )
    }
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
    [320, 568],
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
      if (path === '/works') {
        const layout = await evaluate(`(() => {
          const grid=document.querySelector('.project-grid'),section=grid.parentElement;
          const style=getComputedStyle(section);
          return {count:grid.querySelectorAll('.work-card').length,last:section.lastElementChild===grid,
            bottomGap:section.getBoundingClientRect().bottom-grid.getBoundingClientRect().bottom,
            paddingBottom:parseFloat(style.paddingBottom),
            background:style.backgroundColor,radius:style.borderTopLeftRadius,
            overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth}
        })()`)
        assert.equal(layout.count, 5, '保留五張作品卡片')
        assert.ok(layout.last, '作品列表後沒有多餘入口或容器')
        assert.ok(
          Math.abs(layout.bottomGap - layout.paddingBottom) < 1,
          '列表底部僅保留原本區塊 Padding',
        )
        assert.equal(layout.background, 'rgb(167, 31, 36)')
        assert.equal(layout.radius, width <= 899 ? '18px' : '24px')
        assert.ok(!layout.overflow, 'Works 頁面無水平溢出')
        if ([1440, 768, 390].includes(width) && height > 500) {
          await evaluate(
            `document.querySelector('.work-card:last-child').scrollIntoView({block:'end',behavior:'instant'})`,
          )
          await evaluate(`document.querySelector('.work-card:last-child img').decode()`)
          await delay(150)
          const { data } = await cdp('Page.captureScreenshot', { format: 'png' })
          await writeFile(
            join(output, `${width}x${height}-works-bottom.png`),
            Buffer.from(data, 'base64'),
          )
        }
      }
      const selector = '.work-card'
      await evaluate(
        `document.querySelector('${selector}').scrollIntoView({block:'center',behavior:'instant'}); document.querySelector('${selector}').focus({preventScroll:true})`,
      )
      const before = await evaluate(geometry)
      const url = await evaluate('location.href')
      await key('Enter')
      await waitFor(`document.querySelector('.project-modal h2')===document.activeElement`)
      await evaluate('document.fonts.ready.then(() => true)')
      await evaluate(
        `Promise.all([...document.querySelectorAll('.project-modal img')].map(img=>img.decode()))`,
      )
      await checkDetail(0, width)
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
      assert.equal(state.closeColor, 'rgb(185, 218, 232)')
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
      assert.equal(state.placeholderBackground, null, '菲迪八段使用提供的內文與影片')
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
      if (path === '/works') {
        for (const index of [1, 2, 3, 4]) {
          const card = `.work-card:nth-child(${index + 1})`
          await evaluate(
            `document.querySelector('${card}').scrollIntoView({block:'center',behavior:'instant'});document.querySelector('${card}').focus({preventScroll:true})`,
          )
          const beforeProject = await evaluate(geometry)
          await key('Enter')
          await waitFor(`document.querySelector('.project-modal h2')===document.activeElement`)
          await evaluate(
            `Promise.all([...document.querySelectorAll('.project-modal img')].map(img=>img.decode()))`,
          )
          await checkDetail(index, width)
          if (index === 4 && [1440, 768, 390].includes(width)) {
            const { data } = await cdp('Page.captureScreenshot', { format: 'png' })
            await writeFile(
              join(output, `${width}x${height}-project-05.png`),
              Buffer.from(data, 'base64'),
            )
          }
          await key('Escape')
          await closed(card, beforeProject)
        }
      }
    }
    console.log(`PASS ${width}×${height}: 首頁／Works 對齊、白底藍框、三種關閉、焦點與捲動`)
  }
  // 真實解碼、播放與跳轉；桌機／手機各跑一輪八支影片。
  for (const width of [1440, 390]) {
    await cdp('Emulation.setDeviceMetricsOverride', {
      width,
      height: width === 1440 ? 1024 : 844,
      deviceScaleFactor: 1,
      mobile: false,
    })
    await navigate('/works')
    await evaluate(
      `document.querySelector('.work-card').scrollIntoView({block:'center',behavior:'instant'});document.querySelector('.work-card').focus({preventScroll:true})`,
    )
    await key('Enter')
    await waitFor(`document.querySelector('.project-modal h2')===document.activeElement`)
    assert.equal(
      await evaluate(
        `performance.getEntriesByType('resource').filter(entry=>entry.name.includes('.mp4')).length`,
      ),
      0,
      '開啟視窗未下載八支影片',
    )
    const playback = []
    for (let index = 0; index < 8; index++) {
      await evaluate(`(() => {
        const video=document.querySelectorAll('.project-modal video')[${index}];
        video.scrollIntoView({block:'center',behavior:'instant'});
      })()`)
      await waitFor(
        `document.querySelectorAll('.project-modal video')[${index}].querySelector('source').hasAttribute('src')`,
      )
      await evaluate(`document.querySelectorAll('.project-modal video')[${index}].play()`)
      await waitFor(`document.querySelectorAll('.project-modal video')[${index}].currentTime>0.05`)
      await evaluate(`(() => {
        const video=document.querySelectorAll('.project-modal video')[${index}];
        video.pause(); video.currentTime=video.duration/2;
      })()`)
      await waitFor(
        `(() => {const v=document.querySelectorAll('.project-modal video')[${index}];return !v.seeking && Math.abs(v.currentTime-v.duration/2)<0.2})()`,
      )
      const state = await evaluate(`(() => {
        const v=document.querySelectorAll('.project-modal video')[${index}],r=v.getBoundingClientRect(),panel=document.querySelector('.project-modal-panel');
        return {src:v.currentSrc,duration:v.duration,time:v.currentTime,paused:v.paused,error:v.error?.code,
          videoWidth:v.videoWidth,videoHeight:v.videoHeight,width:r.width,height:r.height,
          overflow:panel.scrollWidth>panel.clientWidth,fit:getComputedStyle(v).objectFit};
      })()`)
      assert.ok(state.paused && !state.error && state.duration > 0 && state.videoWidth > 0)
      assert.ok(!state.overflow)
      assert.equal(state.fit, 'contain')
      assert.ok(
        Math.abs(state.width / state.height - state.videoWidth / state.videoHeight) < 0.01,
        '播放後仍維持原始比例',
      )
      playback.push(state)
      if (index === 0) {
        // 透過 Chromium 原生控制列操作，補足程式跳轉以外的拖曳驗證。
        const { root: dom } = await cdp('DOM.getDocument', { depth: -1, pierce: true })
        function findControl(node, pseudo) {
          const attributes = node.attributes ?? []
          if (attributes.some((value, i) => value === 'pseudo' && attributes[i + 1] === pseudo))
            return node
          for (const child of [...(node.children ?? []), ...(node.shadowRoots ?? [])]) {
            const match = findControl(child, pseudo)
            if (match) return match
          }
        }
        async function controlRect(pseudo) {
          const node = findControl(dom, pseudo)
          assert.ok(node, `原生控制項 ${pseudo} 存在`)
          const { model } = await cdp('DOM.getBoxModel', { nodeId: node.nodeId })
          const [left, top, right, , , bottom] = model.content
          return { left, right, y: (top + bottom) / 2 }
        }
        const timeline = await controlRect('-webkit-media-controls-timeline')
        const x = timeline.left + (timeline.right - timeline.left) / 2
        await cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y: timeline.y })
        await cdp('Input.dispatchMouseEvent', {
          type: 'mousePressed',
          x,
          y: timeline.y,
          button: 'left',
          clickCount: 1,
        })
        await cdp('Input.dispatchMouseEvent', {
          type: 'mouseMoved',
          x: timeline.left + (timeline.right - timeline.left) * 0.75,
          y: timeline.y,
          button: 'left',
          buttons: 1,
        })
        await cdp('Input.dispatchMouseEvent', {
          type: 'mouseReleased',
          x: timeline.left + (timeline.right - timeline.left) * 0.75,
          y: timeline.y,
          button: 'left',
          clickCount: 1,
        })
        await waitFor(
          `(() => {const v=document.querySelector('.project-modal video');return !v.seeking && v.currentTime/v.duration>0.65 && v.currentTime/v.duration<0.85})()`,
        )
        const playButton = await controlRect('-webkit-media-controls-play-button')
        await clickAt((playButton.left + playButton.right) / 2, playButton.y)
        await waitFor(`!document.querySelector('.project-modal video').paused`)
        await clickAt((playButton.left + playButton.right) / 2, playButton.y)
        await waitFor(`document.querySelector('.project-modal video').paused`)
        const { data } = await cdp('Page.captureScreenshot', { format: 'png' })
        await writeFile(join(output, `${width}-video.png`), Buffer.from(data, 'base64'))
      }
    }
    report.push({ width, playback })
    for (const method of ['escape', 'button', 'mask']) {
      if (method !== 'escape') {
        await key('Enter')
        await waitFor(`document.querySelector('.project-modal h2')===document.activeElement`)
      }
      const before = await evaluate(geometry)
      await evaluate(
        `document.querySelector('.project-modal video').scrollIntoView({block:'center',behavior:'instant'})`,
      )
      await waitFor(`document.querySelector('.project-modal video source').hasAttribute('src')`)
      await evaluate(
        `(async () => { window.playingVideo=document.querySelector('.project-modal video');await window.playingVideo.play() })()`,
      )
      await waitFor(`window.playingVideo.currentTime>0.05 && !window.playingVideo.paused`)
      // 原生控制列可能先消耗 Escape；將焦點移回標題後驗證 Dialog 關閉。
      await evaluate(`document.querySelector('.project-modal h2').focus({preventScroll:true})`)
      if (method === 'escape') await key('Escape')
      else if (method === 'button') await click('.project-modal-close')
      else await clickAt(2, 2)
      await closed('.work-card', before)
      assert.ok(await evaluate('window.playingVideo.paused && !window.playingVideo.isConnected'))
    }
    console.log(
      `PASS ${width}px: 八支 MP4 解碼、播放、暫停、跳轉、原始比例、延後載入與三種關閉後停止`,
    )
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
  // 記錄未處理的 Promise 拒絕與 Observer 清理；僅測試環境注入。
  const { identifier: videoProbe } = await cdp('Page.addScriptToEvaluateOnNewDocument', {
    source: `
      window.videoErrors=[]; window.videoObservers=[]; window.playAttempts=0;
      addEventListener('unhandledrejection',event=>window.videoErrors.push(String(event.reason)));
      const NativeObserver=window.IntersectionObserver;
      window.IntersectionObserver=class extends NativeObserver {
        constructor(...args) {super(...args);this.targets=new Set();window.videoObservers.push(this)}
        observe(target) {this.targets.add(target);super.observe(target)}
        disconnect() {this.targets.clear();super.disconnect()}
      };
      const nativePlay=HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play=function() {
        window.playAttempts++;
        if(window.blockAutoPlayback) return Promise.reject(new DOMException('測試自動播放遭拒','NotAllowedError'));
        return nativePlay.call(this);
      };
    `,
  })
  for (const width of [1440, 390]) {
    await cdp('Emulation.setDeviceMetricsOverride', {
      width,
      height: width === 1440 ? 1024 : 844,
      deviceScaleFactor: 1,
      mobile: width === 390,
    })
    await navigate('/works')
    await evaluate(
      `document.querySelector('.work-card').scrollIntoView({block:'center',behavior:'instant'});document.querySelector('.work-card').focus({preventScroll:true})`,
    )
    const before = await evaluate(geometry)
    await key('Enter')
    await waitFor(`document.querySelector('.project-modal h2')===document.activeElement`)
    const video = `document.querySelector('.project-modal video')`
    const scrollVideo = (index) =>
      evaluate(
        `document.querySelectorAll('.project-modal video')[${index}].scrollIntoView({block:'center',behavior:'instant'})`,
      )
    await scrollVideo(0)
    await waitFor(`${video}.currentTime>0.1 && !${video}.paused`)
    assert.ok(
      await evaluate(
        `${video}.muted && ${video}.defaultMuted && ${video}.loop && ${video}.playsInline && ${video}.controls`,
      ),
    )
    assert.ok(
      await evaluate(`document.querySelectorAll('.project-modal video source[src]').length<8`),
      '首次可見只掛上附近影片來源',
    )
    assert.ok(
      await evaluate(
        `!document.querySelectorAll('.project-modal video source')[7].hasAttribute('src')`,
      ),
      '遠處影片不載入',
    )

    await scrollVideo(7)
    await waitFor(`${video}.paused`)
    const pausedAt = await evaluate(`${video}.currentTime`)
    await delay(200)
    assert.equal(await evaluate(`${video}.currentTime`), pausedAt, '離開視窗可見區後進度停止')
    await scrollVideo(0)
    await waitFor(`!${video}.paused && ${video}.currentTime>${pausedAt}`)
    assert.ok(await evaluate(`${video}.currentTime<${pausedAt}+2`), '重新進入時延續暫停位置')
    await evaluate(`${video}.currentTime=${video}.duration-0.15`)
    await waitFor(`${video}.currentTime<1 && !${video}.paused`)
    await evaluate(`${video}.pause()`)
    await delay(200)
    assert.ok(await evaluate(`${video}.paused`), '留在可見範圍時尊重使用者手動暫停')

    for (let index = 1; index < 8; index++) {
      await scrollVideo(index)
      await waitFor(
        `(() => {const v=document.querySelectorAll('.project-modal video')[${index}];return !v.paused && v.currentTime>0.05})()`,
      )
      await waitFor(`(() => {
        const panel=document.querySelector('.project-modal-panel').getBoundingClientRect();
        return [...document.querySelectorAll('.project-modal video')].every(v=>{
          const r=v.getBoundingClientRect();return r.bottom>panel.top && r.top<panel.bottom || v.paused;
        });
      })()`)
    }
    await cdp('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    })
    await waitFor(`[...document.querySelectorAll('.project-modal video')].every(v=>v.paused)`)
    await evaluate(`document.querySelectorAll('.project-modal video')[7].play()`)
    await waitFor(`!document.querySelectorAll('.project-modal video')[7].paused`)
    await evaluate(`document.querySelector('.project-modal-panel').scrollTop=0`)
    await waitFor(`document.querySelectorAll('.project-modal video')[7].paused`)
    await scrollVideo(7)
    await delay(200)
    assert.ok(
      await evaluate(`document.querySelectorAll('.project-modal video')[7].paused`),
      '減少動態環境重新進入時不自動播放',
    )
    await cdp('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
    })
    await waitFor(`!document.querySelectorAll('.project-modal video')[7].paused`)
    await evaluate(
      `window.closedVideos=[...document.querySelectorAll('.project-modal video')];document.querySelector('.project-modal h2').focus({preventScroll:true})`,
    )
    await key('Escape')
    await closed('.work-card', before)
    await delay(100)
    assert.ok(
      await evaluate(
        `window.closedVideos.every(v=>v.paused) && window.videoObservers.every(o=>o.targets.size===0)`,
      ),
      '關閉後影片全數暫停、Observer 清除',
    )
    assert.deepEqual(await evaluate('window.videoErrors'), [])

    // 模擬瀏覽器拒絕自動播放，確保錯誤被處理，原生控制列仍能手動播放。
    await evaluate(`window.blockAutoPlayback=true;window.playAttempts=0`)
    await key('Enter')
    await waitFor(`document.querySelector('.project-modal h2')===document.activeElement`)
    await scrollVideo(0)
    await waitFor('window.playAttempts>0')
    await delay(100)
    assert.ok(await evaluate(`${video}.paused && ${video}.controls`))
    assert.deepEqual(await evaluate('window.videoErrors'), [])
    await evaluate(`window.blockAutoPlayback=false;${video}.play()`)
    await waitFor(`!${video}.paused && ${video}.currentTime>0.05`)
    await click('.project-modal-close')
    await closed('.work-card', before)
    assert.ok(await evaluate('window.videoObservers.every(o=>o.targets.size===0)'))
    console.log(
      `PASS ${width}px: 可見自動播放、靜音循環、離開暫停／返回續播、手動暫停、減少動態、拒播降級與 Observer 清理`,
    )
  }
  await cdp('Page.removeScriptToEvaluateOnNewDocument', { identifier: videoProbe })
  await cdp('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 1024,
    deviceScaleFactor: 1,
    mobile: false,
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
  await evaluate(
    `document.querySelector('.project-modal video').scrollIntoView({block:'center',behavior:'instant'})`,
  )
  await waitFor(`document.querySelector('.project-modal video source').hasAttribute('src')`)
  await evaluate(
    `(async () => {window.playingVideo=document.querySelector('.project-modal video');await window.playingVideo.play()})()`,
  )
  await evaluate(`document.querySelector('.nav-image-link[href="/about"]').click()`)
  await waitFor(`location.pathname==='/about' && !document.querySelector('.project-modal')`)
  assert.ok(await evaluate('window.playingVideo.paused'), '導覽卸載後影片停止播放')
  assert.ok(
    await evaluate(
      `!document.querySelector('.site-content').inert && !document.body.classList.contains('p-overflow-hidden') && getComputedStyle(document.documentElement).overflowY==='auto'`,
    ),
  )
  for (const path of [
    '/graphic-works',
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
    if (
      path.includes('project-06') ||
      path.includes('unknown') ||
      path === '/missing-page' ||
      path === '/graphic-works'
    )
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
