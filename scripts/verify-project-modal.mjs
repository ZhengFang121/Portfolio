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
  '.webp': 'image/webp',
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
const headerChecks = []
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
    // 圖片／影片解碼與頁面初始化在忙碌環境可能超過 5 秒，保留判定並等候最多約 15 秒。
    for (let attempt = 0; attempt < 300; attempt++) {
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
    const windowsVirtualKeyCode = { Tab: 9, Enter: 13, Escape: 27, PageDown: 34, ' ': 32 }[key]
    await cdp('Input.dispatchKeyEvent', {
      type: 'keyDown',
      text: key === 'Enter' ? '\r' : key === ' ' ? ' ' : undefined,
      key,
      code: key === ' ' ? 'Space' : key,
      windowsVirtualKeyCode,
      modifiers,
    })
    await cdp('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key,
      code: key === ' ' ? 'Space' : key,
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
      ...(dialog ? {dialog:rect(dialog), panel:rect(panel),toolbar:rect(dialog.querySelector('.project-modal-toolbar')),heading:rect(dialog.querySelector('h2')),close:rect(document.querySelector('.project-modal-close')),dialogCount:document.querySelectorAll('[role="dialog"]').length,closeCount:dialog.querySelectorAll('.project-modal-close').length,
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
  let headerReference
  async function checkSharedHeader(index, width) {
    const header = await evaluate(`(() => {
      const root=document.querySelector('.project-detail--modal'),header=root.querySelector(':scope > header');
      const classes=['project-design-year','project-detail-title','project-detail-summary','project-categories','project-cover'];
      const children=[...header.children].filter(el=>classes.some(name=>el.classList.contains(name)));
      const style=el=>{const s=getComputedStyle(el);return {font:s.fontFamily,size:s.fontSize,weight:s.fontWeight,lineHeight:s.lineHeight,spacing:s.letterSpacing,color:s.color,align:s.textAlign}};
      const bounds=el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
      const cover=header.querySelector('.project-cover'),s=getComputedStyle(cover);
      const overview=[...root.querySelectorAll('.project-chapter-heading')].find(el=>el.querySelector('.project-chapter-title').textContent.trim()==='作品介紹');
      return {
        slug:document.querySelectorAll('.work-card')[${index}].getAttribute('href').split('/').at(-1),
        height:innerHeight,order:children.map(el=>classes.find(name=>el.classList.contains(name))),
        sectionNumbers:root.querySelectorAll('.project-chapter-number').length,
        yearCount:header.querySelectorAll('.project-design-year').length,coverCount:header.querySelectorAll('.project-cover').length,
        bounds:bounds(header),children:children.map(bounds),
        styles:children.slice(0,3).map(style),
        overviewStyles:{title:style(overview.querySelector('.project-chapter-title')),subtitle:style(overview.querySelector('.project-chapter-subtitle')),gap:getComputedStyle(overview).rowGap},
        layout:{display:getComputedStyle(header).display,gap:getComputedStyle(header).rowGap,align:getComputedStyle(header).justifyItems},
        coverStyle:{width:s.width,maxWidth:s.maxWidth,fit:s.objectFit,radius:s.borderRadius},
        cover:{src:cover.getAttribute('src'),alt:cover.alt,loading:cover.loading,natural:[cover.naturalWidth,cover.naturalHeight],rect:bounds(cover)},
      };
    })()`)
    assert.deepEqual(header.order, [
      'project-design-year',
      'project-detail-title',
      'project-detail-summary',
      'project-categories',
      'project-cover',
    ])
    assert.equal(header.yearCount, 1)
    assert.equal(header.coverCount, 1)
    assert.equal(header.sectionNumbers, 0, '所有作品介紹視窗皆無 SECTION 編號')
    assert.equal(header.overviewStyles.subtitle.size, '12px', '英文副標題使用下一級 sm 字級')
    const shared = {
      styles: header.styles,
      layout: header.layout,
      coverStyle: header.coverStyle,
      overviewStyles: header.overviewStyles,
    }
    if (index === 0) headerReference = shared
    else
      assert.deepEqual(
        shared,
        headerReference,
        '六個作品的頂部資訊、封面與作品介紹中英標題使用相同樣式',
      )
    for (const [childIndex, child] of header.children.entries()) {
      if (childIndex > 0)
        assert.ok(child.top >= header.children[childIndex - 1].bottom - 1, '頂部資訊依序垂直排列')
      assert.ok(
        Math.abs(child.left + child.width / 2 - (header.bounds.left + header.bounds.width / 2)) < 1,
        '頂部資訊與封面水平置中',
      )
    }
    assert.ok(header.cover.alt)
    assert.equal(header.cover.loading, 'lazy')
    assert.ok(
      Math.abs(
        header.cover.rect.width / header.cover.rect.height -
          header.cover.natural[0] / header.cover.natural[1],
      ) < 0.01,
      '共用封面保留原始比例',
    )
    headerChecks.push({ width, ...header })
    if ([1440, 390].includes(width) && header.height > 500) {
      const { data } = await cdp('Page.captureScreenshot', { format: 'png' })
      await writeFile(
        join(output, `${width}x${header.height}-${header.slug}-header.png`),
        Buffer.from(data, 'base64'),
      )
    }
  }
  async function checkDetail(index, width) {
    await checkSharedHeader(index, width)
    if (index === 4) {
      const gallery = await evaluate(`(() => {
        const root=document.querySelector('.project-detail--modal');
        const panel=root.closest('.project-modal-panel');
        const group=root.querySelector('.project-image-group--stack');
        const rect=el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
        const reference=group.closest('.project-section');
        return {
          header:[...root.querySelector(':scope > header').children].filter(el=>el.tagName!=='IMG').map(el=>el.textContent.trim()),
          headings:[...root.querySelectorAll('h3')].map(el=>el.textContent.trim()),
          subtitles:[...root.querySelectorAll('.project-chapter-subtitle')].map(el=>el.textContent.trim()),
          textBlocks:root.querySelectorAll('.project-item-text').length,
          introduction:root.querySelector('.project-item-body').textContent.trim(),
          count:root.querySelectorAll('img').length,cover:root.querySelector('.project-cover').getAttribute('src'),
          sharedRadius:getComputedStyle(root.querySelector('.project-cover')).borderRadius,
          allSources:[...root.querySelectorAll('img')].map(img=>img.getAttribute('src')),
          display:getComputedStyle(group).display,direction:getComputedStyle(group).flexDirection,
          gap:parseFloat(getComputedStyle(group).gap),reference:rect(reference),group:rect(group),
          overflow:panel.scrollWidth>panel.clientWidth || document.documentElement.scrollWidth>document.documentElement.clientWidth,
          images:[...group.querySelectorAll('img')].map(img=>({
            src:img.getAttribute('src'),alt:img.alt,loading:img.loading,rect:rect(img),
            natural:[img.naturalWidth,img.naturalHeight],fit:getComputedStyle(img).objectFit,
            radius:getComputedStyle(img).borderRadius,border:getComputedStyle(img).borderWidth,
            shadow:getComputedStyle(img).boxShadow,background:getComputedStyle(img).backgroundColor,
          })),
        };
      })()`)
      assert.deepEqual(gallery.header, [
        '# 2022 - 2023',
        '似顏繪',
        '客製化肖像插畫',
        'ILLUSTRATION',
      ])
      assert.deepEqual(gallery.headings, ['作品介紹'])
      assert.deepEqual(gallery.subtitles, ['PROJECT OVERVIEW'])
      assert.equal(gallery.textBlocks, 1)
      assert.equal(
        gallery.introduction,
        '依照客戶提供的照片，繪製專屬的人物與寵物似顏繪。以簡約的手繪線條與柔和的色彩，保留每個角色獨特的外型與神情，將照片中的日常回憶轉化為溫暖且富有個人特色的插畫作品。',
      )
      assert.equal(gallery.count, 7)
      assert.equal(gallery.cover, '/images/projects/custom-portrait/cover.jpg')
      assert.deepEqual(
        gallery.allSources,
        ['cover', '01', '02', '03', '04', '05', '06'].map(
          (name) => `/images/projects/custom-portrait/${name}.jpg`,
        ),
      )
      assert.equal(gallery.images.length, 6)
      assert.ok(!gallery.overflow)
      assert.equal(gallery.display, 'flex')
      assert.equal(gallery.direction, 'column')
      assert.equal(gallery.gap, 24)
      assert.ok(Math.abs(gallery.group.width - Math.min(gallery.reference.width, 672)) < 1)
      assert.ok(
        Math.abs(
          gallery.group.left +
            gallery.group.width / 2 -
            gallery.reference.left -
            gallery.reference.width / 2,
        ) < 1,
      )
      assert.ok(gallery.group.width <= 672)
      for (const [imageIndex, image] of gallery.images.entries()) {
        assert.equal(image.src, `/images/projects/custom-portrait/0${imageIndex + 1}.jpg`)
        assert.ok(image.alt)
        assert.equal(image.loading, 'lazy')
        assert.deepEqual(image.natural, [3000, 3000])
        assert.ok(Math.abs(image.rect.width - image.rect.height) < 1, '保留原始 1:1 比例')
        assert.ok(Math.abs(image.rect.width - gallery.group.width) < 1, '六張展示圖片統一寬度')
        assert.ok(Math.abs(image.rect.left - gallery.group.left) < 1, '圖片水平置中')
        if (imageIndex > 0)
          assert.ok(
            Math.abs(image.rect.top - gallery.images[imageIndex - 1].rect.bottom - gallery.gap) < 1,
            '六列展示圖片間距一致',
          )
        assert.equal(image.fit, 'contain')
        assert.equal(image.radius, gallery.sharedRadius, '展示圖片沿用共用圓角')
        assert.equal(image.border, '0px')
        assert.equal(image.shadow, 'none')
        assert.equal(image.background, 'rgba(0, 0, 0, 0)')
      }
      return
    }
    const detail = await evaluate(`(() => {
      const root=document.querySelector('.project-detail--modal');
      const card=document.querySelectorAll('.work-card')[${index}];
      const categories=root.querySelector('.project-categories'),list=categories.querySelector('ul');
      const rect=el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
      const type=el=>{const s=getComputedStyle(el);return {size:parseFloat(s.fontSize),weight:s.fontWeight,lineHeight:s.lineHeight,color:s.color,align:s.textAlign}};
      const pillStyle=el=>{const s=getComputedStyle(el);return {background:s.backgroundColor,color:s.color,fontSize:s.fontSize,padding:s.padding,borderRadius:s.borderRadius}};
      const centeredTexts=[...root.querySelectorAll(':scope > header h2,:scope > header p,.project-chapter-heading > *')];
      return {
        text:root.textContent,year:root.querySelector('.project-design-year').textContent,
        padding:getComputedStyle(root).paddingLeft,root:rect(root),categories:rect(categories),list:rect(list),
        overflow:categories.scrollWidth>categories.clientWidth,
        pills:[...root.querySelectorAll('.project-category')].map(el=>({text:el.textContent.trim(),rect:rect(el),style:pillStyle(el)})),
        cardPills:[...card.querySelectorAll('.project-category')].map(el=>({text:el.textContent.trim(),style:pillStyle(el)})),
        texts:centeredTexts.map(el=>({align:getComputedStyle(el).textAlign,rect:rect(el)})),
        blue:[...root.querySelectorAll('.project-design-year,.project-detail-summary')].map(el=>getComputedStyle(el).color),
        titles:[root.querySelector('.project-detail-title'),card.querySelector('h3')].map(el=>getComputedStyle(el).color),
        media:rect(root.querySelector('img')),ratio:root.querySelector('img').naturalWidth/root.querySelector('img').naturalHeight,
        contentSections:[...root.querySelectorAll(':scope > .project-section')].map(section=>({
          title:section.querySelector('h3').textContent,content:section.querySelector('p').textContent,
          border:getComputedStyle(section).borderTopWidth,
          media:section.querySelectorAll('.project-section-media').length,
        })),
        chapterGap:parseFloat(getComputedStyle(root).rowGap),
        chapters:[...root.querySelectorAll('.project-chapter')].map(chapter=>({
          rect:rect(chapter),border:getComputedStyle(chapter).borderTopWidth,padding:parseFloat(getComputedStyle(chapter).paddingTop),
          number:chapter.querySelector('.project-chapter-number')?.textContent ?? null,
          title:chapter.querySelector('h3').textContent,subtitle:chapter.querySelector('.project-chapter-subtitle').textContent,
          headingTypes:[...chapter.querySelector('.project-chapter-heading').children].map(type),
          headingGap:getComputedStyle(chapter.querySelector('.project-chapter-heading')).rowGap,
          itemGap:parseFloat(getComputedStyle(chapter.querySelector('.project-section-items')).rowGap),
          items:[...chapter.querySelectorAll('.project-section-item')].map(item=>({
            rect:rect(item),text:rect(item.querySelector('.project-item-text')),
            border:getComputedStyle(item).borderTopWidth,padding:parseFloat(getComputedStyle(item).paddingTop),gap:getComputedStyle(item).rowGap,
            textGap:getComputedStyle(item.querySelector('.project-item-text')).rowGap,
            title:item.querySelector('h4').textContent,label:item.querySelector('.project-item-label')?.textContent ?? null,
            titleType:type(item.querySelector('h4')),labelType:item.querySelector('.project-item-label') ? type(item.querySelector('.project-item-label')) : null,
            children:[...item.querySelector('.project-item-text').children].map(el=>({tag:el.tagName,content:el.textContent.trim(),type:type(el),rect:rect(el)})),
            media:[...item.querySelectorAll('video')].map(el=>({
              rect:rect(el),container:rect(el.parentElement),fit:getComputedStyle(el).objectFit,
              src:el.querySelector('source')?.dataset.src,type:el.querySelector('source')?.type,
              button: (()=>{const b=el.parentElement.querySelector('.project-video-toggle'),r=b.getBoundingClientRect(),s=getComputedStyle(b);return {rect:rect(b),controls:b.getAttribute('aria-controls'),label:b.getAttribute('aria-label'),width:r.width,height:r.height,display:s.display,position:s.position,border:s.borderTopWidth,background:s.backgroundColor,text:b.textContent.trim(),icon:rect(b.querySelector('svg'))}})(),
              id:el.id,controls:el.controls,inline:el.playsInline,preload:el.preload,autoplay:el.autoplay,loop:el.loop,muted:el.muted,
              label:el.getAttribute('aria-label'),poster:el.getAttribute('poster'),
            })),
          })),
        })),
        panelOverflow:document.querySelector('.project-modal-panel').scrollWidth>document.querySelector('.project-modal-panel').clientWidth,
      }
    })()`)
    assert.ok(!detail.panelOverflow, `${width}: 介紹內容不水平溢出`)
    const awards = await evaluate(`(() => {
      const root=document.querySelector('.project-detail--modal'),block=root.querySelector('.project-awards');
      if (!block) return null;
      const label=block.querySelector('.project-awards-label'),icon=label.querySelector('svg'),list=block.querySelector('ul');
      const rect=el=>el.getBoundingClientRect(),center=el=>rect(el).left+rect(el).width/2;
      return {label:label.textContent.trim(),iconSize:[rect(icon).width,rect(icon).height],
        colors:[label,icon,list].map(el=>getComputedStyle(el).color),
        weights:[label,list].map(el=>getComputedStyle(el).fontWeight),
        sizes:[label,list].map(el=>getComputedStyle(el).fontSize),
        undecorated:[block,label,list,...list.children].every(el=>{const s=getComputedStyle(el);return s.backgroundColor==='rgba(0, 0, 0, 0)' && s.borderTopWidth==='0px' && s.borderRadius==='0px' && s.boxShadow==='none' && s.padding==='0px'}),
        centered:Math.abs(center(block)-center(root))<1 && Math.abs(center(label)-center(block))<1 && getComputedStyle(list).textAlign==='center',
        ordered:root.querySelector('.project-categories').compareDocumentPosition(block)===Node.DOCUMENT_POSITION_FOLLOWING && block.compareDocumentPosition(root.querySelector('.project-cover'))===Node.DOCUMENT_POSITION_FOLLOWING,
        overflow:[block,label,list,...list.children].some(el=>el.scrollWidth>el.clientWidth+1),
        linesBelow:rect(label).bottom<rect(list).top,
      };
    })()`)
    if (index === 5) {
      assert.equal(awards.label, 'AWARD · 獲獎紀錄')
      assert.deepEqual(awards.iconSize, [18, 18])
      assert.deepEqual(awards.colors, ['rgb(167, 31, 36)', 'rgb(167, 31, 36)', 'rgb(0, 0, 0)'])
      assert.deepEqual(awards.weights, ['500', '500'])
      assert.deepEqual(awards.sizes, ['12px', '16px'])
      assert.ok(awards.undecorated && awards.centered && awards.ordered && awards.linesBelow)
      assert.ok(!awards.overflow, '獎項自然換行且不溢出')
    } else assert.equal(awards, null, '沒有獎項時不產生標籤、圖示或空白區塊')
    const contentMedia = await evaluate(`(() => {
      const root=document.querySelector('.project-detail--modal');
      const rect=el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width}};
      return [...root.querySelectorAll('.project-section-item > .project-section-media,.project-image-group')].map(el=>({
        rect:rect(el),text:rect(el.parentElement.querySelector('.project-item-text')),
        variant:el.classList.contains('project-section-media--phone')?340:el.matches('.project-section-media--qr-code,.project-section-media--logo')?200:null,
      }));
    })()`)
    for (const media of contentMedia) {
      assert.ok(
        Math.abs(media.rect.width - Math.min(media.text.width, media.variant ?? Infinity)) < 1,
        '單張圖片、影片與整個圖片群組遵守閱讀寬度及特殊尺寸',
      )
      assert.ok(
        Math.abs(
          media.rect.left + media.rect.width / 2 - (media.text.left + media.text.width / 2),
        ) < 1,
        '內容媒體與內文水平置中',
      )
    }
    assert.equal(detail.padding, width <= 480 ? '24px' : width <= 899 ? '48px' : '64px')
    assert.match(
      detail.year,
      new RegExp(['2026', '2026', '2022 - 2025', '2021 - 2024', '2022 - 2023', '2017'][index]),
    )
    for (const removed of ['作品內容整理中', '設計年份', '製作年份', '負責角色'])
      assert.ok(!detail.text.includes(removed))
    assert.ok(detail.blue.every((color) => color === 'rgb(185, 218, 232)'))
    assert.ok(detail.titles.every((color) => color === 'rgb(0, 0, 0)'))
    assert.ok(detail.texts.every((text) => text.align === 'center'))
    assert.equal(detail.contentSections.length, 2)
    assert.equal(detail.chapters.length, 2)
    const textReference = detail.chapters[0].items[0].text
    const titleReference = detail.chapters[0].items[0].titleType
    for (const chapter of detail.chapters) {
      assert.equal(chapter.number, null)
      assert.equal(
        chapter.headingTypes[1].size,
        12,
        'DESIGN CONCEPT 與 PROJECT OVERVIEW 皆縮小一級',
      )
      assert.ok(Math.abs(chapter.rect.width - detail.media.width) < 1, '章節與封面同寬')
      assert.ok(Math.abs(chapter.rect.left - detail.media.left) < 1)
      assert.equal(chapter.itemGap, width <= 480 ? 24 : width <= 899 ? 32 : 48)
      assert.ok(detail.chapterGap > chapter.itemGap, '主要章節留白大於子項目留白')
      assert.equal(chapter.padding, 0, '章節間距不再疊加 padding')
      assert.equal(chapter.border, '0px', '章節無分隔線')
      for (const item of chapter.items) {
        assert.ok(Math.abs(item.text.left - textReference.left) < 1, '所有子段落文字區共用左側起點')
        assert.ok(
          Math.abs(item.text.width - textReference.width) < 1,
          '所有子段落文字區共用閱讀寬度',
        )
        assert.ok(item.text.width <= 672, '文字不超過既有 42rem 閱讀寬度')
        assert.ok(
          Math.abs(
            item.text.left + item.text.width / 2 - (chapter.rect.left + chapter.rect.width / 2),
          ) < 1,
        )
        assert.equal(item.gap, width <= 480 ? '16px' : '24px')
        assert.ok(chapter.itemGap > parseFloat(item.gap), '子段落留白大於段內元素')
        assert.equal(item.textGap, width <= 480 ? '8px' : '16px')
        assert.equal(item.padding, 0, '子段落間距不再疊加 padding')
        assert.equal(item.border, '0px', '子段落無分隔線')
        assert.deepEqual(item.titleType, titleReference, '核心句與功能標題使用相同樣式')
        assert.equal(item.titleType.weight, '600')
        assert.ok(item.titleType.size < chapter.headingTypes[0].size)
        if (item.labelType) {
          assert.equal(item.labelType.color, 'rgb(167, 31, 36)')
          assert.ok(item.labelType.size < item.titleType.size)
        }
        assert.ok(
          item.children.every((child) => child.type.align === 'left'),
          '所有內容文字靠左',
        )
        assert.ok(
          item.children.every(
            (child) =>
              child.rect.left >= item.text.left - 1 && child.rect.right <= item.text.right + 1,
          ),
          '文字不溢出',
        )
        assert.ok(item.children.slice(1).every((child) => child.type.color === 'rgb(0, 0, 0)'))
        for (const body of item.children.filter(
          (child) =>
            child.tag === 'P' && child.type.weight === '400' && child.type.color === 'rgb(0, 0, 0)',
        )) {
          assert.equal(body.type.size, 16)
          assert.equal(body.type.lineHeight, '28px')
        }
      }
    }
    if (index === 0) {
      assert.equal(detail.chapters.length, 2)
      assert.deepEqual(
        detail.chapters.map((chapter) => [chapter.number, chapter.title, chapter.subtitle]),
        [
          [null, '設計理念', 'DESIGN CONCEPT'],
          [null, '作品介紹', 'PROJECT OVERVIEW'],
        ],
      )
      assert.deepEqual(
        detail.chapters[0].headingTypes,
        detail.chapters[1].headingTypes,
        '兩章標題字級、字重、行距與對齊完全一致',
      )
      assert.equal(detail.chapters[0].headingGap, detail.chapters[1].headingGap)
      assert.ok(detail.chapters[0].headingTypes[1].size < detail.chapters[0].headingTypes[0].size)
      assert.ok(detail.media.bottom <= detail.chapters[0].rect.top, '封面接續設計理念')
      assert.ok(
        detail.chapters[0].rect.bottom < detail.chapters[1].rect.top,
        '設計理念接續作品介紹',
      )
      assert.deepEqual(
        detail.chapters.map((chapter) => chapter.items.length),
        [3, 8],
      )
      assert.deepEqual(
        detail.chapters[0].items.map((item) => item.label),
        ['INSIGHT — 設計洞察', 'CONCEPT — 設計概念', 'VISION — 品牌願景'],
      )
      assert.ok(detail.chapters[0].items.every((item) => item.media.length === 0))
      const expected = [
        [
          'intro',
          '序章動畫',
          '01 / INTRO ANIMATION',
          '透過角色插畫與動態視覺，帶領使用者進入跑者菲迪的世界。以輕鬆活潑的方式建立第一印象，傳達「陪你開始，伴你成長」的品牌精神，讓每一段跑步旅程從充滿期待的序章展開。',
        ],
        [
          'login',
          '登入',
          '02 / LOGIN',
          '透過簡潔直覺的登入與註冊介面，降低新手開始使用網站的門檻。建立專屬的跑者帳號，保存個人的跑步紀錄與成長歷程，從這裡展開屬於自己的跑步旅程。',
        ],
        [
          'home',
          '首頁',
          '03 / HOME',
          '首頁整合跑者階段、成長進度與個人跑步概況，讓使用者快速掌握目前的成果與下一階段目標。搭配菲迪日報的天氣資訊、跑者學院推薦及阿里的貼心提醒，讓每一次回訪都有新的期待與方向。',
        ],
        [
          'records',
          '新增跑步紀錄',
          '04 / RUNNING RECORD',
          '透過直覺化的表單，記錄每一次跑步的時間、距離、地點與心得，並可搭配照片留下當下的回憶。讓原本單純的跑步數據，轉化成看得見的成長足跡，累積屬於自己的跑者旅程。',
        ],
        [
          'station',
          '足跡驛站',
          '05 / RUNNING STATION',
          '以月曆與跑步紀錄呈現個人的運動歷程，方便回顧每一次努力與進步。透過累積紀錄與成長回饋，讓使用者看見自己的堅持，從每一個小小的成就中獲得持續前進的動力。',
        ],
        [
          'academy',
          '跑者學院',
          '06 / RUNNING ACADEMY',
          '針對新手跑者的需求，整理學習、裝備、補給與賽事四大類跑步知識。透過容易理解的文章內容，陪伴使用者逐步建立正確觀念，減少入門時的迷惘，讓每一次出發都更有信心。',
        ],
        [
          'plaza',
          '菲迪廣場',
          '07 / RUNNER PLAZA',
          '打造讓跑者交流與分享的互動空間，透過動態貼文、留言與活動情報，串起彼此的跑步日常。讓使用者不只能記錄自己的成長，也能從其他跑者的經驗與鼓勵中獲得支持，感受一起前進的力量。',
        ],
        [
          'admin',
          '管理者後台',
          '08 / ADMIN DASHBOARD',
          '建立整合式管理介面，協助管理者掌握網站營運概況，並集中管理玩家、跑者學院文章與菲迪廣場內容。透過清楚的數據呈現與分類管理，提升後台操作效率，讓網站內容與社群互動更容易維護。',
        ],
      ]
      for (const [itemIndex, item] of detail.chapters[1].items.entries()) {
        const [id, title, label, content] = expected[itemIndex]
        assert.equal(item.title, title)
        assert.equal(item.label, label)
        assert.deepEqual(
          item.children.map((child) => child.tag),
          ['P', 'H4', 'P'],
          '英文標籤 → 中文標題 → 正式內文',
        )
        assert.equal(item.children[2].content, content)
        assert.equal(item.media.length, 1)
        const media = item.media[0]
        assert.equal(media.src, `/videos/projects/pheidi-the-runner/${id}.mp4`)
        assert.equal(media.type, 'video/mp4')
        assert.equal(media.fit, 'contain')
        assert.ok(!media.controls && media.inline && !media.autoplay && media.loop && media.muted)
        assert.equal(media.preload, 'none')
        assert.equal(media.poster, null)
        assert.ok(media.label.includes(title))
        assert.ok(Math.abs(media.rect.width - item.text.width) < 1, '八支影片與文字同寬')
        assert.ok(Math.abs(media.rect.left - item.text.left) < 1, '影片與文字左右邊界一致')
        assert.equal(media.button.controls, media.id)
        assert.match(media.button.label, new RegExp(`^(播放|暫停)${title}示範影片$`))
        assert.ok(media.button.width >= 44 && media.button.height >= 44, '控制按鈕有足夠觸控範圍')
        assert.notEqual(media.button.display, 'none', '控制按鈕在觸控裝置也可見')
        assert.equal(media.button.position, 'absolute')
        assert.ok(Math.abs(media.button.rect.top - media.rect.top - 12) < 1, '按鈕距影片上緣 12px')
        assert.ok(
          Math.abs(media.rect.right - media.button.rect.right - 12) < 1,
          '按鈕距影片右緣 12px',
        )
        assert.ok(
          Math.abs(media.container.height - media.rect.height) < 1,
          '按鈕不增加影片外側高度',
        )
        assert.equal(media.button.border, '0px')
        assert.equal(media.button.background, 'rgba(0, 0, 0, 0)')
        assert.equal(media.button.text, '', '不顯示播放或暫停文字')
        assert.equal(media.button.icon.width, 20)
        assert.equal(media.button.icon.height, 20)
        assert.ok(media.rect.top >= item.children[2].rect.bottom, '介紹內文接續影片')
      }
    } else if (index === 1) {
      assert.deepEqual(
        detail.chapters.map((chapter) => [chapter.number, chapter.title, chapter.subtitle]),
        [
          [null, '設計理念', 'DESIGN CONCEPT'],
          [null, '作品介紹', 'PROJECT OVERVIEW'],
        ],
      )
      assert.deepEqual(
        detail.chapters.map((chapter) => chapter.items.length),
        [3, 6],
      )
      assert.ok(!detail.text.includes('內容準備中'))
      const extras = await evaluate(`(() => {
        const root=document.querySelector('.project-detail--modal');
        const rect=el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
        return {
          images:[...root.querySelectorAll('.project-section-media img')].map(img=>({
            rect:rect(img),container:rect(img.closest('.project-section-item')),
            natural:[img.naturalWidth,img.naturalHeight],alt:img.alt,loaded:img.complete && img.naturalWidth>0,
            fit:getComputedStyle(img).objectFit,radius:getComputedStyle(img).borderRadius,
            variant:img.parentElement.classList.contains('project-section-media--phone')?'phone':'qr-code',
          })),
          flow:{rect:rect(root.querySelector('.project-item-flow')),direction:getComputedStyle(root.querySelector('.project-item-flow')).flexDirection,
            steps:[...root.querySelectorAll('.project-item-flow li')].map(li=>({rect:rect(li),text:li.textContent.trim()}))},
          note:root.querySelector('.project-item-note').textContent.trim(),
          links:root.querySelectorAll('.project-item-links a').length,
        };
      })()`)
      assert.equal(extras.images.length, 5)
      assert.deepEqual(
        extras.images.map((img) => img.variant),
        ['phone', 'phone', 'phone', 'phone', 'qr-code'],
      )
      for (const img of extras.images) {
        assert.ok(img.loaded && img.alt)
        assert.equal(img.fit, 'contain')
        assert.ok(
          Math.abs(img.rect.width / img.rect.height - img.natural[0] / img.natural[1]) < 0.01,
          '圖片維持原始比例',
        )
        assert.ok(
          Math.abs(
            img.rect.width - Math.min(img.container.width, img.variant === 'phone' ? 340 : 200),
          ) < 1,
        )
        assert.ok(
          Math.abs(
            img.rect.left + img.rect.width / 2 - (img.container.left + img.container.width / 2),
          ) < 1,
          '圖片水平置中',
        )
        if (img.variant === 'qr-code') assert.equal(img.radius, '0px', 'QR Code 不裁切圓角')
      }
      assert.equal(extras.flow.direction, width <= 899 ? 'column' : 'row')
      assert.equal(extras.flow.steps.length, 4)
      assert.ok(
        extras.flow.steps.every(
          (step) =>
            step.rect.left >= extras.flow.rect.left - 1 &&
            step.rect.right <= extras.flow.rect.right + 1,
        ),
      )
      assert.ok(extras.note.includes('機器人部署於 Render'))
      assert.equal(extras.links, 0)
      assert.ok(!detail.text.includes('07 / SOURCE CODE'))
      assert.ok(!detail.text.includes('GitHub 專案程式碼'))
    } else if (index === 2 || index === 3) {
      assert.deepEqual(
        detail.chapters.map((chapter) => [chapter.number, chapter.title, chapter.subtitle]),
        [
          [null, '設計理念', 'DESIGN CONCEPT'],
          [null, '作品介紹', 'PROJECT OVERVIEW'],
        ],
      )
      assert.deepEqual(
        detail.chapters.map((chapter) => chapter.items.length),
        [3, index === 2 ? 6 : 7],
      )
      assert.deepEqual(
        detail.chapters[0].items.map((item) => item.label),
        ['INSIGHT — 設計洞察', 'CONCEPT — 設計概念', 'GOAL — 設計目標'],
      )
      assert.ok(!detail.text.includes('內容準備中'))
      for (const item of detail.chapters[1].items) {
        assert.equal(item.label, null)
        assert.equal(item.children.length, 1, '作品項目的文字區只保留作品名稱')
        assert.equal(item.children[0].tag, 'H4')
      }
      const gallery = await evaluate(`(() => {
        const root=document.querySelector('.project-detail--modal');
        const rect=el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
        return {
          website:!!root.querySelector('.project-website-link'),
          images:[...root.querySelectorAll('.project-section-media img')].map(img=>({
            src:img.getAttribute('src').split('/').at(-1),alt:img.alt,loading:img.loading,
            natural:[img.naturalWidth,img.naturalHeight],size:[img.width,img.height],
            declared:[Number(img.getAttribute('width')),Number(img.getAttribute('height'))],
            loaded:img.complete && img.naturalWidth>0,fit:getComputedStyle(img).objectFit,
            rect:rect(img),container:rect(img.closest('.project-section-item')),
          })),
          groups:[...root.querySelectorAll('.project-image-group')].map(group=>({
            rect:rect(group),columns:getComputedStyle(group).gridTemplateColumns.split(' ').filter(track=>parseFloat(track)>0).length,
            gap:parseFloat(getComputedStyle(group).gap),children:group.children.length,
            cards:group.classList.contains('project-image-group--cards'),containerWidth:group.parentElement.clientWidth,
            items:[...group.children].map(rect),
          })),
          order:[...root.querySelectorAll('.project-section-item')].filter(item=>item.querySelector('.project-image-group'))
            .every(item=>[...item.children].findIndex(el=>el.classList.contains('project-item-text')) < [...item.children].findIndex(el=>el.classList.contains('project-image-group'))),
        };
      })()`)
      assert.ok(!gallery.website && gallery.order)
      const webpResponses =
        await evaluate(`Promise.all([...document.querySelectorAll('.project-modal img')].map(async img=>{
        const response=await fetch(img.src);
        return {src:img.getAttribute('src'),ok:response.ok,type:response.headers.get('content-type'),
          declared:[Number(img.getAttribute('width')),Number(img.getAttribute('height'))],natural:[img.naturalWidth,img.naturalHeight]};
      }))`)
      for (const response of webpResponses) {
        assert.ok(response.ok && response.src.endsWith('.webp'), '封面與介紹圖片的 WebP 路徑可載入')
        assert.equal(response.type, 'image/webp', '測試伺服器提供正確 WebP MIME Type')
        assert.deepEqual(response.declared, response.natural, 'WebP 封面與介紹圖片尺寸符合素材')
      }
      assert.deepEqual(
        gallery.images.map((img) => img.src),
        index === 2
          ? [
              'drip-bag.webp',
              'drip-bag-light-roast.webp',
              'drip-bag-dark-roast.webp',
              'drip-bag-box-10pcs.webp',
              'cup-sleeve.webp',
              'bean-card-01.webp',
              'bean-card-02.webp',
              'bean-card-03.webp',
              'bean-card-04.webp',
              'bean-card-05.webp',
              'bean-card-06.webp',
              'shopping-bag.webp',
              'voucher.webp',
            ]
          : [
              'cake-box-4-inch.webp',
              'cake-box-6-inch.webp',
              'cake-slice-carrier-box.webp',
              'roll-cake-box.webp',
              'macaron-gift-box.webp',
              'nama-chocolate-box.webp',
              'dm.webp',
              'shopping-bag.webp',
              'sticker.webp',
            ],
      )
      for (const image of gallery.images) {
        assert.ok(image.loaded && image.alt)
        assert.equal(image.loading, 'lazy')
        assert.equal(image.fit, 'contain')
        assert.deepEqual(image.declared, image.natural, '宣告尺寸符合實際原圖')
        assert.ok(
          Math.abs(image.rect.width / image.rect.height - image.natural[0] / image.natural[1]) <
            0.01,
          '保留原始比例',
        )
        assert.ok(
          image.rect.left >= image.container.left - 1 &&
            image.rect.right <= image.container.right + 1,
          '圖片不溢出',
        )
      }
      assert.equal(gallery.groups.length, 2)
      for (const group of gallery.groups) {
        assert.equal(group.gap, 24)
        assert.equal(
          group.columns,
          group.cards
            ? group.containerWidth >= 640
              ? 3
              : group.containerWidth >= 448
                ? 2
                : 1
            : Math.min(
                group.children,
                Math.max(1, Math.floor((group.rect.width + group.gap + 0.1) / (240 + group.gap))),
              ),
        )
        if (group.cards) {
          assert.equal(group.children, 6)
          for (const [index, image] of group.items.entries()) {
            assert.ok(Math.abs(image.width - group.items[0].width) < 1, '豆卡等寬')
            assert.ok(
              Math.abs(image.left - group.items[index % group.columns].left) < 1,
              '豆卡由左至右排列',
            )
            if (index >= group.columns) {
              assert.ok(image.top > group.items[index - group.columns].bottom, '豆卡依序換列')
            } else {
              assert.ok(Math.abs(image.top - group.items[0].top) < 1)
            }
          }
        }
      }
    } else {
      assert.deepEqual(
        detail.chapters.map((chapter) => [chapter.number, chapter.title, chapter.subtitle]),
        [
          [null, '設計理念', 'DESIGN CONCEPT'],
          [null, '作品介紹', 'PROJECT OVERVIEW'],
        ],
      )
      assert.deepEqual(
        detail.chapters.map((chapter) => chapter.items.length),
        [3, 5],
      )
      assert.ok(!detail.text.includes('內容準備中'))
      assert.deepEqual(
        detail.chapters[0].items.map((item) => item.label),
        ['INSIGHT — 設計洞察', 'CONCEPT — 設計概念', 'GOAL — 設計目標'],
      )
      const noodle = await evaluate(`(() => {
        const root=document.querySelector('.project-detail--modal');
        const catalog=root.querySelector('.project-catalog');
        const grid=catalog.querySelector('.project-catalog-groups');
        const rect=el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
        return {
          award:root.querySelector('.project-awards-list').textContent.trim(),
          title:catalog.previousElementSibling.querySelector('.project-item-title').textContent,
          columns:getComputedStyle(grid).gridTemplateColumns.split(' ').length,
          containerWidth:catalog.clientWidth,
          duplicateGrid:!!catalog.parentElement.querySelector('.project-image-group'),
          soap:[...catalog.querySelectorAll('img')].map(img=>img.src.split('/').at(-1)),
          groups:[...catalog.querySelectorAll('.project-catalog-group')].map(group=>({
            title:group.querySelector('.project-catalog-group-title').textContent,
            heading:group.querySelector('.project-catalog-group-title').tagName,
            rect:rect(group),
            items:[...group.querySelectorAll('.project-catalog-item')].map(item=>({
              rect:rect(item),image:rect(item.querySelector('img')),text:rect(item.querySelector('.project-catalog-text')),
              title:item.querySelector('.project-catalog-item-title').textContent,
              heading:item.querySelector('.project-catalog-item-title').tagName,
              description:item.querySelector('p').textContent,
              size:getComputedStyle(item.querySelector('p')).fontSize,
              lineHeight:getComputedStyle(item.querySelector('p')).lineHeight,
              columns:getComputedStyle(item).gridTemplateColumns.split(' ').length,
              overflow:[item,...item.querySelectorAll('*')].some(el=>el.scrollWidth>el.clientWidth+1),
            })),
          })),
          blocks:[...root.querySelectorAll('.project-content-block .project-item-label')].map(el=>el.textContent),
          exhibition:[...root.querySelectorAll('.project-image-group--feature img')].map(img=>({
            file:img.src.split('/').at(-1),rect:rect(img),
          })),
          images:[...root.querySelectorAll('img')].map(img=>({loaded:img.complete && img.naturalWidth>0,
            declared:[Number(img.getAttribute('width')),Number(img.getAttribute('height'))],
            natural:[img.naturalWidth,img.naturalHeight],fit:getComputedStyle(img).objectFit,
            feature:!!img.closest('.project-image-group--feature')})),
          logo:root.querySelector('.project-section-media--logo img').clientWidth,
          website:!!root.querySelector('.project-website-link'),
        };
      })()`)
      assert.equal(noodle.award, '文創之星｜創意概念組・傳承創新 金獎')
      assert.equal(noodle.title, '麵食造型肥皂圖鑑')
      assert.equal(noodle.columns, noodle.containerWidth >= 640 ? 2 : 1)
      assert.ok(!noodle.duplicateGrid, '圖鑑不重複顯示原本圖片網格')
      assert.deepEqual(
        noodle.groups.map((group) => [group.title, group.items.length]),
        [
          ['古早味系列肥皂', 2],
          ['傳統節慶系列肥皂', 3],
        ],
      )
      const [firstGroup, secondGroup] = noodle.groups
      if (noodle.columns === 2) {
        assert.ok(Math.abs(firstGroup.rect.top - secondGroup.rect.top) < 1, '系列標題頂端對齊')
        assert.ok(Math.abs(firstGroup.rect.width - secondGroup.rect.width) < 1, '系列等寬')
        assert.ok(firstGroup.rect.right < secondGroup.rect.left)
      } else assert.ok(firstGroup.rect.bottom < secondGroup.rect.top, '完整古早味系列先於節慶系列')
      for (const group of noodle.groups) {
        assert.equal(group.heading, 'H5')
        for (const product of group.items) {
          assert.equal(product.heading, 'H6')
          assert.ok(product.title && product.description.trim())
          assert.equal(product.size, '16px')
          assert.equal(product.lineHeight, '28px')
          assert.ok(!product.overflow, '圖鑑文字與圖片無水平溢出')
          assert.ok(Math.abs(product.image.width - 112) < 1, '五張圖片顯示寬度一致')
          assert.equal(product.columns, group.rect.width >= 288 ? 2 : 1)
          if (product.columns === 2) {
            assert.ok(product.image.right < product.text.left, '左圖右文')
            assert.ok(
              Math.abs(
                product.image.top +
                  product.image.height / 2 -
                  product.text.top -
                  product.text.height / 2,
              ) < 1,
              '圖文垂直置中',
            )
          } else assert.ok(product.image.bottom < product.text.top, '窄容器改成上圖下文')
        }
      }
      assert.deepEqual(noodle.soap, [
        'soap-yangchun-noodle.png',
        'soap-danzai-noodle.png',
        'soap-dumpling.png',
        'soap-winter-solstice-tangyuan.png',
        'soap-grain-rain-noodle.png',
      ])
      assert.deepEqual(noodle.blocks, [
        'AWARD — 獲獎紀錄',
        'MEDIA — 媒體採訪',
        'EXHIBITION — 實體展示與交流',
      ])
      assert.ok(!noodle.website && noodle.logo <= 200)
      assert.deepEqual(
        noodle.exhibition.map((image) => image.file),
        ['exhibition-01.JPG', 'exhibition-02.jpg', 'exhibition-03.JPG'],
      )
      const [portrait, upper, lower] = noodle.exhibition.map((image) => image.rect)
      const twoColumns = Math.abs(portrait.top - upper.top) < 1
      if (twoColumns) {
        assert.ok(portrait.right < upper.left, '直式展示照在左側')
        assert.ok(Math.abs(upper.left - lower.left) < 1, '右側兩張照片左緣對齊')
        assert.ok(Math.abs(upper.right - lower.right) < 1, '右側兩張照片右緣對齊')
        assert.ok(Math.abs(portrait.bottom - lower.bottom) < 1, '展示區底部對齊')
        assert.ok(upper.bottom < lower.top, '第三張展示照位於右下方')
      } else {
        assert.ok(portrait.bottom < upper.top && upper.bottom < lower.top, '窄版展示照依序單欄')
      }
      for (const image of noodle.images) {
        assert.ok(image.loaded)
        assert.equal(image.fit, image.feature && twoColumns ? 'cover' : 'contain')
        assert.deepEqual(image.declared, image.natural)
      }
    }
    for (const element of [
      ...detail.texts.map((text) => text.rect),
      detail.media,
      detail.categories,
    ])
      assert.ok(
        Math.abs(element.left + element.width / 2 - (detail.root.left + detail.root.width / 2)) < 1,
        '原有置中文字與封面保持置中',
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
  // 以真實指標與按鍵驗證狀態，避免只呼叫 focus() 而漏掉操作方式差異。
  async function interactionStyle(selector) {
    await evaluate(
      `Promise.all(document.querySelector(${JSON.stringify(selector)}).getAnimations().map(animation=>animation.finished.catch(()=>{})))`,
    )
    return evaluate(`(() => {
      const el=document.querySelector(${JSON.stringify(selector)}),s=getComputedStyle(el);
      return {focused:document.activeElement===el,visible:el.matches(':focus-visible'),restoredInput:el.dataset.restoredFocus ?? null,
        outline:s.outlineStyle,outlineColor:s.outlineColor,shadow:s.boxShadow,transform:s.transform,
        background:s.backgroundColor,icon:el.querySelector('.view-more-button-icon') ? getComputedStyle(el.querySelector('.view-more-button-icon')).display : null,
        label:el.querySelector('.view-more-button-label') ? getComputedStyle(el.querySelector('.view-more-button-label')).opacity : null};
    })()`)
  }
  async function tabTo(selector) {
    for (let index = 0; index < 20; index++) {
      await key('Tab')
      if (
        await evaluate(
          `document.activeElement===document.querySelector(${JSON.stringify(selector)})`,
        )
      )
        return
    }
    throw new Error(`Tab 無法到達 ${selector}`)
  }
  const blue = 'rgb(185, 218, 232)'
  const card = '.work-card'
  const moveAway = () => cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 2, y: 2 })
  async function assertRestored(keyboard) {
    await waitFor(`!document.querySelector('.project-modal')`)
    await moveAway()
    await waitFor(`getComputedStyle(document.querySelector('${card}')).transform==='none'`)
    const state = await interactionStyle(card)
    assert.ok(state.focused, '關閉後仍將焦點交還原卡片')
    assert.equal(
      state.restoredInput,
      keyboard ? 'keyboard' : 'pointer',
      '焦點還原明確記錄最後輸入方式',
    )
    assert.equal(state.transform, 'none', '還原焦點不放大卡片')
    assert.ok(!state.shadow.includes('6px'), '還原焦點不殘留 Hover 內框')
    if (keyboard) {
      assert.equal(state.outline, 'solid')
      assert.equal(state.outlineColor, blue)
    } else assert.equal(state.outline, 'none')
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
  await moveAway()
  const initial = await interactionStyle(card)
  assert.equal(initial.outline, 'none', '初次載入卡片沒有焦點框')
  assert.equal(initial.transform, 'none')
  assert.ok(!initial.shadow.includes('6px'))
  await evaluate(
    `document.querySelector('${card}').scrollIntoView({block:'center',behavior:'instant'})`,
  )
  const point = await evaluate(
    `(() => {const r=document.querySelector('${card}').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`,
  )
  await cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point })
  await waitFor(
    `getComputedStyle(document.querySelector('${card}')).transform==='matrix(1.04, 0, 0, 1.04, 0, 0)'`,
  )
  const hover = await interactionStyle(card)
  assert.ok(
    hover.shadow.includes('6px') && hover.shadow.includes(blue),
    '滑鼠 Hover 保留藍色粗內框',
  )
  assert.equal(hover.transform, 'matrix(1.04, 0, 0, 1.04, 0, 0)', 'Hover 保留微放大')
  await moveAway()
  await waitFor(`getComputedStyle(document.querySelector('${card}')).transform==='none'`)
  assert.deepEqual(await interactionStyle(card), initial, '移開滑鼠完全恢復卡片樣式')
  await cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point })
  await cdp('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    ...point,
    button: 'left',
    clickCount: 1,
  })
  assert.equal((await interactionStyle(card)).transform, 'none', '滑鼠按下時保留 Active 回饋')
  await moveAway()
  await cdp('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    x: 2,
    y: 2,
    button: 'left',
    clickCount: 1,
  })
  assert.equal((await interactionStyle(card)).transform, 'none', '放開後不殘留 Active 放大')
  await click(card)
  await waitFor(`document.querySelector('.project-modal h2')===document.activeElement`)
  assert.equal(
    (await interactionStyle('.project-modal h2')).outline,
    'none',
    '滑鼠開啟後標題保留焦點但不畫框',
  )
  await click('.project-modal-close')
  await assertRestored(false)
  // 模擬 Safari 把指標還原誤判為 :focus-visible；驗證的是外觀，並非 Chromium 的判斷結果。
  await cdp('DOM.enable')
  await cdp('CSS.enable')
  const { root: focusDocument } = await cdp('DOM.getDocument')
  const { nodeId: focusCardNode } = await cdp('DOM.querySelector', {
    nodeId: focusDocument.nodeId,
    selector: card,
  })
  await cdp('CSS.forcePseudoState', {
    nodeId: focusCardNode,
    forcedPseudoClasses: ['focus-visible'],
  })
  const forcedPointer = await interactionStyle(card)
  assert.ok(forcedPointer.visible, '確實強制套用 :focus-visible 以測試誤判情境')
  assert.equal(forcedPointer.outline, 'none', '指標還原即使符合 :focus-visible 也不畫焦點框')
  assert.equal(forcedPointer.transform, 'none')
  assert.ok(!forcedPointer.shadow.includes('6px'))
  await cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point })
  const forcedPointerHover = await interactionStyle(card)
  assert.equal(forcedPointerHover.outline, 'none', '誤判情境下真正 Hover 仍只有原本的粗內框')
  assert.ok(forcedPointerHover.shadow.includes('6px'))
  assert.equal(forcedPointerHover.transform, 'matrix(1.04, 0, 0, 1.04, 0, 0)')
  await moveAway()
  await key('ArrowRight')
  const switchedKeyboard = await interactionStyle(card)
  assert.equal(switchedKeyboard.restoredInput, 'keyboard', '還原後鍵盤輸入會更新暫時狀態')
  assert.equal(switchedKeyboard.outline, 'solid')
  assert.equal(switchedKeyboard.outlineColor, blue)
  assert.equal(switchedKeyboard.transform, 'none')
  assert.equal(switchedKeyboard.shadow, 'none')
  await cdp('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    ...point,
    button: 'left',
    clickCount: 1,
  })
  await moveAway()
  await cdp('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    x: 2,
    y: 2,
    button: 'left',
    clickCount: 1,
  })
  assert.equal(
    (await interactionStyle(card)).restoredInput,
    'pointer',
    '還原後指標輸入會更新暫時狀態',
  )
  assert.equal((await interactionStyle(card)).outline, 'none')
  await cdp('CSS.forcePseudoState', { nodeId: focusCardNode, forcedPseudoClasses: [] })
  await tabTo('.work-card:nth-child(2)')
  assert.equal((await interactionStyle(card)).restoredInput, null, '離開卡片後清除暫時焦點標記')
  await key('Tab', 8)
  const focus = await interactionStyle(card)
  assert.ok(focus.visible)
  assert.equal(focus.outlineColor, blue)
  assert.equal(focus.shadow, 'none', '鍵盤焦點只有一層框線')
  assert.equal(focus.transform, 'none', '鍵盤焦點不放大')
  await cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point })
  const hoveredKeyboard = await interactionStyle(card)
  assert.equal(hoveredKeyboard.shadow, 'none', '鍵盤焦點與 Hover 不疊加內框')
  assert.equal(hoveredKeyboard.transform, 'none', '鍵盤焦點與 Hover 不疊加放大')
  await moveAway()
  await key('Enter')
  await waitFor(`document.querySelector('.project-modal h2')===document.activeElement`)
  const title = await interactionStyle('.project-modal h2')
  assert.ok(title.focused, '標題保留程式化焦點')
  assert.equal(title.outline, 'none', '鍵盤開啟後非互動標題也不顯示焦點框')
  await tabTo('.project-modal-close')
  assert.equal((await interactionStyle('.project-modal-close')).outlineColor, blue)
  await tabTo('.project-modal-panel')
  assert.equal((await interactionStyle('.project-modal-panel')).outlineColor, blue)
  await tabTo('.project-modal .project-categories')
  assert.equal((await interactionStyle('.project-modal .project-categories')).outlineColor, blue)
  await key('Escape')
  await assertRestored(true)
  // 鍵盤開啟、滑鼠關閉；滑鼠開啟、Escape 關閉，也必須依最後操作切換。
  await key('Enter')
  await waitFor(`!!document.querySelector('.project-modal')`)
  await click('.project-modal-close')
  await assertRestored(false)
  await click(card)
  await waitFor(`document.querySelector('.project-modal h2')===document.activeElement`)
  await key('Escape')
  await assertRestored(true)
  await navigate('/')
  const button = '.view-more-button'
  await evaluate(
    `document.querySelector('${button}').scrollIntoView({block:'center',behavior:'instant'});document.querySelector('${button}').addEventListener('click',event=>event.preventDefault(),{once:true,capture:true})`,
  )
  await click(button)
  assert.equal((await interactionStyle(button)).icon, 'block', '滑鼠 Hover 保留箭頭')
  await moveAway()
  const clicked = await interactionStyle(button)
  assert.ok(clicked.focused)
  assert.equal(clicked.icon, 'none', '滑鼠移開後一般 focus 不保留箭頭')
  assert.equal(clicked.label, '1')
  await tabTo(card)
  await key('Tab', 8)
  const buttonFocus = await interactionStyle(button)
  assert.ok(buttonFocus.visible)
  assert.equal(buttonFocus.outlineColor, blue)
  assert.equal(buttonFocus.icon, 'none', '鍵盤焦點保留按鈕文字')
  report.push({
    interactions: {
      initial,
      hover,
      focus,
      title,
      forcedPointer,
      switchedKeyboard,
      clicked,
      buttonFocus,
    },
  })
  await navigate('/works')
  await tabTo('.nav-image-link[href="/"]')
  assert.equal((await interactionStyle('.nav-image-link[href="/"]')).outlineColor, blue)
  await cdp('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  })
  await cdp('Emulation.setTouchEmulationEnabled', { enabled: true })
  async function tap(selector) {
    const point = await evaluate(
      `(() => {const el=document.querySelector(${JSON.stringify(selector)});el.scrollIntoView({block:'center',behavior:'instant'});const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`,
    )
    await cdp('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] })
    await cdp('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  }
  await navigate('/works')
  await tap(card)
  await waitFor(`document.querySelector('.project-modal h2')===document.activeElement`)
  assert.equal(
    (await interactionStyle('.project-modal h2')).outline,
    'none',
    '觸控開啟後標題不畫焦點框',
  )
  await tap('.project-modal-close')
  await assertRestored(false)
  await tap(card)
  await waitFor(`document.querySelector('.project-modal h2')===document.activeElement`)
  await key('Escape')
  await assertRestored(true)
  await key('Enter')
  await waitFor(`document.querySelector('.project-modal h2')===document.activeElement`)
  await tap('.project-modal-close')
  await assertRestored(false)
  await navigate('/')
  await evaluate(
    `document.querySelector('${button}').addEventListener('click',event=>event.preventDefault(),{once:true,capture:true})`,
  )
  await tap(button)
  assert.equal((await interactionStyle(button)).icon, 'none', '觸控點擊不殘留箭頭')
  await cdp('Emulation.setTouchEmulationEnabled', { enabled: false })
  await cdp('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  })
  console.log(
    'PASS 無框標題焦點、明確的焦點還原狀態、強制 focus-visible 誤判、輸入切換與 blur 清理、Hover、四種開關組合、VIEW MORE 與觸控狀態（不代表 Safari 實測）',
  )
  const sizes = [
    [1920, 1080],
    [1440, 716],
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
            columns:getComputedStyle(grid).gridTemplateColumns.split(' ').filter(track=>parseFloat(track)>0).length,
            width:grid.clientWidth,gap:parseFloat(getComputedStyle(grid).columnGap),rem:parseFloat(getComputedStyle(document.documentElement).fontSize),
            bottomGap:section.getBoundingClientRect().bottom-grid.getBoundingClientRect().bottom,
            paddingBottom:parseFloat(style.paddingBottom),
            background:style.backgroundColor,radius:style.borderTopLeftRadius,
            overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth}
        })()`)
        assert.equal(layout.count, 6, '六張作品卡片')
        assert.equal(
          layout.columns,
          layout.width >= 19 * layout.rem * 2 + layout.gap ? 2 : 1,
          '作品列表最多兩欄，空間不足時維持單欄',
        )
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
      await waitFor(`document.querySelector('.work-card')`)
      await evaluate(`(async () => {
        for (const img of document.querySelectorAll('.work-card img')) {
          img.scrollIntoView({block:'center',behavior:'instant'});
          await img.decode();
          if (!img.naturalWidth) throw new Error('作品封面載入失敗：'+img.src);
        }
      })()`)
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
        if ([1440, 768, 390].includes(width) && height > 500) {
          for (const [name, selector] of [
            ['concept', '.project-chapter:first-of-type'],
            ['vision', '.project-chapter:first-of-type .project-section-item:last-child'],
            ['overview', '.project-chapter:nth-of-type(2)'],
          ]) {
            await evaluate(
              `document.querySelector('${selector}').scrollIntoView({block:'start',behavior:'instant'})`,
            )
            const { data } = await cdp('Page.captureScreenshot', { format: 'png' })
            await writeFile(
              join(output, `${width}x${height}-${name}.png`),
              Buffer.from(data, 'base64'),
            )
          }
          await evaluate(`document.querySelector('.project-modal-panel').scrollTop=0`)
        }
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
        for (const index of [1, 2, 3, 4, 5]) {
          const card = `.work-card:nth-child(${index + 1})`
          await evaluate(
            `document.querySelector('${card}').scrollIntoView({block:'center',behavior:'instant'});document.querySelector('${card}').focus({preventScroll:true})`,
          )
          const beforeProject = await evaluate(geometry)
          await key('Enter')
          await waitFor(`document.querySelector('.project-modal h2')===document.activeElement`)
          await evaluate(
            `(async () => {
              const panel=document.querySelector('.project-modal-panel');
              for (const img of document.querySelectorAll('.project-modal img')) {
                panel.scrollTo({top:panel.scrollTop+img.getBoundingClientRect().top-panel.getBoundingClientRect().top-(panel.clientHeight-img.clientHeight)/2,behavior:'instant'});
                await img.decode();
              }
              panel.scrollTop=0;
            })()`,
          )
          await checkDetail(index, width)
          if (index === 4 && [1440, 768, 390].includes(width) && height > 500) {
            await evaluate(
              `(() => {const panel=document.querySelector('.project-modal-panel'),heading=document.querySelector('.project-chapter-heading');panel.scrollTo({top:panel.scrollTop+heading.getBoundingClientRect().top-panel.getBoundingClientRect().top,behavior:'instant'})})()`,
            )
            const { data } = await cdp('Page.captureScreenshot', { format: 'png' })
            await writeFile(
              join(output, `${width}x${height}-custom-portrait.png`),
              Buffer.from(data, 'base64'),
            )
            await evaluate(`document.querySelector('.project-modal-panel').scrollTop=0`)
          }
          if ([2, 3].includes(index) && [1440, 768, 390].includes(width) && height > 500) {
            const brand = index === 2 ? 'apollo' : 'r4d'
            const groups = await evaluate(
              `document.querySelectorAll('.project-image-group').length`,
            )
            for (let group = 0; group < groups; group++) {
              await evaluate(
                `(() => {const panel=document.querySelector('.project-modal-panel'),group=document.querySelectorAll('.project-image-group')[${group}];panel.scrollTo({top:panel.scrollTop+group.getBoundingClientRect().top-panel.getBoundingClientRect().top,behavior:'instant'})})()`,
              )
              await delay(150)
              const { data } = await cdp('Page.captureScreenshot', { format: 'png' })
              await writeFile(
                join(output, `${width}x${height}-${brand}-group-${group + 1}.png`),
                Buffer.from(data, 'base64'),
              )
            }
          }
          if (index === 1 && [1440, 768, 390].includes(width) && height > 500) {
            for (const [name, id] of [
              ['phone', 'find-parking'],
              ['flow', 'technical-implementation'],
              ['qr', 'add-friend'],
            ]) {
              await evaluate(
                `(() => {const panel=document.querySelector('.project-modal-panel'),item=document.querySelector('#project-02-modal-line-bot-overview-${id}').closest('.project-section-item');panel.scrollTo({top:panel.scrollTop+item.getBoundingClientRect().top-panel.getBoundingClientRect().top,behavior:'instant'})})()`,
              )
              await delay(150)
              const { data } = await cdp('Page.captureScreenshot', { format: 'png' })
              await writeFile(
                join(output, `${width}x${height}-papago-${name}.png`),
                Buffer.from(data, 'base64'),
              )
            }
          }
          if (index === 5 && [1440, 768, 390].includes(width)) {
            const { data } = await cdp('Page.captureScreenshot', { format: 'png' })
            await writeFile(
              join(output, `${width}x${height}-project-05.png`),
              Buffer.from(data, 'base64'),
            )
            if (height > 500) {
              for (const group of [0, 1]) {
                await evaluate(
                  `(() => {const panel=document.querySelector('.project-modal-panel'),group=document.querySelectorAll('.project-catalog-group')[${group}];panel.scrollTo({top:panel.scrollTop+group.getBoundingClientRect().top-panel.getBoundingClientRect().top,behavior:'instant'})})()`,
                )
                await delay(150)
                const { data } = await cdp('Page.captureScreenshot', { format: 'png' })
                await writeFile(
                  join(output, `${width}x${height}-catalog-${group + 1}.png`),
                  Buffer.from(data, 'base64'),
                )
              }
              await evaluate(`document.querySelector('.project-modal-panel').scrollTop=100000`)
              await delay(150)
              const { data } = await cdp('Page.captureScreenshot', { format: 'png' })
              await writeFile(
                join(output, `${width}x${height}-achievements.png`),
                Buffer.from(data, 'base64'),
              )
            }
          }
          await key('Escape')
          await closed(card, beforeProject)
        }
      }
    }
    console.log(`PASS ${width}×${height}: 首頁／Works 對齊、白底藍框、三種關閉、焦點與捲動`)
  }
  // 真實解碼、播放與跳轉；桌機／平板／手機各跑一輪八支影片。
  for (const width of [1440, 768, 390]) {
    await cdp('Emulation.setDeviceMetricsOverride', {
      width,
      height: width === 390 ? 844 : 1024,
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
        // 自訂按鈕使用真實滑鼠與鍵盤事件，不透過影片 API 代替操作。
        const toggle = '.project-modal .project-video-toggle'
        await evaluate(
          `document.querySelector('${toggle}').scrollIntoView({block:'center',behavior:'instant'})`,
        )
        await click(toggle)
        await waitFor(`!document.querySelector('.project-modal video').paused`)
        await waitFor(
          `document.querySelector('${toggle}').getAttribute('aria-label').startsWith('暫停')`,
        )
        await click(toggle)
        await waitFor(`document.querySelector('.project-modal video').paused`)
        await waitFor(
          `document.querySelector('${toggle}').getAttribute('aria-label').startsWith('播放')`,
        )
        await evaluate(`document.querySelector('${toggle}').focus()`)
        await key('Enter')
        await waitFor(`!document.querySelector('.project-modal video').paused`)
        assert.ok(
          await evaluate(
            `getComputedStyle(document.querySelector('${toggle}')).outlineStyle==='solid'`,
          ),
          '鍵盤焦點可見',
        )
        await key(' ')
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
      // 將焦點移回標題後驗證 Dialog 關閉。
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
  for (const width of [1440, 768, 390]) {
    await cdp('Emulation.setDeviceMetricsOverride', {
      width,
      height: width === 390 ? 844 : 1024,
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
        `${video}.muted && ${video}.defaultMuted && ${video}.loop && ${video}.playsInline && !${video}.controls`,
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
    await evaluate(
      `document.querySelector('.project-video-toggle').scrollIntoView({block:'center',behavior:'instant'})`,
    )
    await click('.project-video-toggle')
    await delay(200)
    assert.ok(await evaluate(`${video}.paused`), '留在可見範圍時尊重使用者手動暫停')
    await scrollVideo(7)
    await scrollVideo(0)
    await delay(200)
    assert.ok(await evaluate(`${video}.paused`), '手動暫停後重新進入也不自動播放')

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
    await evaluate(
      `document.querySelectorAll('.project-video-toggle')[7].scrollIntoView({block:'center',behavior:'instant'})`,
    )
    await evaluate(`document.querySelectorAll('.project-video-toggle')[7].focus()`)
    await key('Enter')
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

    // 模擬瀏覽器拒絕自動播放，再以自訂按鈕手動啟動。
    await evaluate(`window.blockAutoPlayback=true;window.playAttempts=0`)
    await key('Enter')
    await waitFor(`document.querySelector('.project-modal h2')===document.activeElement`)
    await scrollVideo(0)
    await waitFor('window.playAttempts>0')
    await delay(100)
    assert.ok(await evaluate(`${video}.paused && !${video}.controls`))
    assert.deepEqual(await evaluate('window.videoErrors'), [])
    await evaluate(
      `window.blockAutoPlayback=false;document.querySelector('.project-video-toggle').scrollIntoView({block:'center',behavior:'instant'})`,
    )
    if (width === 390) {
      await cdp('Emulation.setTouchEmulationEnabled', { enabled: true })
      const point = await evaluate(
        `(() => {const r=document.querySelector('.project-video-toggle').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`,
      )
      await cdp('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] })
      await cdp('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
      await cdp('Emulation.setTouchEmulationEnabled', { enabled: false })
    } else await click('.project-video-toggle')
    await waitFor(`!${video}.paused && ${video}.currentTime>0.05`)
    await click('.project-modal-close')
    await closed('.work-card', before)
    assert.ok(await evaluate('window.videoObservers.every(o=>o.targets.size===0)'))
    console.log(
      `PASS ${width}px: 可見自動播放、靜音循環、離開暫停／返回續播、自訂按鈕、減少動態、拒播降級與 Observer 清理`,
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
  for (const index of [1, 2, 3, 4, 5, 6]) {
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
      '六個作品內容正確',
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
    if (path.includes('unknown') || path === '/missing-page' || path === '/graphic-works')
      assert.equal(
        await evaluate(`document.querySelector('main h1').textContent`),
        '找不到這個頁面',
      )
  }
  await writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2))
  await writeFile(join(output, 'shared-headers.json'), JSON.stringify(headerChecks, null, 2))
  console.log(
    `PASS 六個作品共用頂部資訊與封面、似顏繪封面加六列單欄展示、修飾鍵、原生中鍵另開頁、觸控捲動、開啟中 resize、卸載清理、直接網址與 404。證據：${output}`,
  )
} finally {
  socket?.close()
  chrome.kill()
  await new Promise((done) => server.close(done))
}
