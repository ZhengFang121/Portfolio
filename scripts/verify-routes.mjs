// 以 Vue 的記憶體 Router 與 HTML 渲染確認路由；不代表瀏覽器視覺 QA。
import assert from 'node:assert/strict'
import { access } from 'node:fs/promises'
import { createServer } from 'vite'
import { createSSRApp } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { renderToString } from '@vue/server-renderer'
import PrimeVue from 'primevue/config'

const server = await createServer({
  server: { middlewareMode: true, hmr: false, ws: false },
  appType: 'custom',
})

try {
  const { routes } = await server.ssrLoadModule('/src/router/routes.ts')
  const { projects } = await server.ssrLoadModule('/src/data/projects.ts')
  const { default: App } = await server.ssrLoadModule('/src/App.vue')
  const { default: ProjectDetail } = await server.ssrLoadModule('/src/components/ProjectDetail.vue')
  const { default: BaseButton } = await server.ssrLoadModule('/src/components/BaseButton.vue')
  const { portfolioPreset } = await server.ssrLoadModule('/src/theme/primevue.ts')
  assert.equal(projects.length, 5)
  assert.equal(new Set(projects.map((project) => project.slug)).size, 5)
  assert.deepEqual(
    projects.map((project) => project.title),
    ['跑者菲迪 Pheidi the Runner', 'PAPAGO', 'APOLLO', 'R4D', '初次見麵'],
  )
  assert.deepEqual(
    projects.map((project) => project.designYear),
    ['2026', '2026', '2022 - 2025', '2021 - 2024', '2017'],
  )
  const pheidiSections = [
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
  assert.deepEqual(
    projects[0].sections[1].items,
    pheidiSections.map(([id, title, label, content]) => ({
      id,
      title,
      label,
      content,
      media: { type: 'video', src: `/videos/projects/pheidi-the-runner/${id}.mp4` },
    })),
    '跑者菲迪八段資料與順序完全符合需求',
  )
  const designConcept = projects[0].sections[0]
  assert.equal(projects[0].sections.length, 2)
  assert.equal(designConcept.label, 'SECTION 01')
  assert.equal(projects[0].sections[1].label, 'SECTION 02')
  assert.equal(projects[0].sections[1].title, '網站介紹')
  assert.equal(projects[0].sections[1].subtitle, 'WEBSITE OVERVIEW')
  assert.equal(designConcept.id, 'design-concept')
  assert.equal(designConcept.title, '設計理念')
  assert.equal(designConcept.subtitle, 'DESIGN CONCEPT')
  assert.deepEqual(
    designConcept.items.map((item) => item.label),
    ['INSIGHT — 設計洞察', 'CONCEPT — 設計概念', 'VISION — 品牌願景'],
  )
  const expectedConceptParagraphs = [
    '跑步容易開始，卻不容易持續。',
    '對新手跑者而言，缺乏目標、成就感與持續的動力，往往讓跑步逐漸變得枯燥，甚至中途放棄。',
    '用遊戲化的方式，讓跑步成為值得期待的日常。',
    '因此，以「遊戲化習慣養成」為核心，設計出陪伴新手跑者建立跑步習慣的網站——「跑者菲迪 Pheidi the Runner」。',
    '透過跑步紀錄、階段成長與成就徽章，讓每一次努力都被看見；結合跑步知識與跑友交流，讓跑步不再只是獨自堅持的過程。',
    '陪你開始，伴你成長。',
    '用遊戲化建立期待，用知識建立信心，用陪伴養成習慣。',
    '希望陪伴每一位新手跑者勇敢踏出第一步，逐漸養成跑步習慣，並在每一次奔跑中持續成長。',
  ]
  assert.deepEqual(
    designConcept.items.flatMap((item) => [item.title, ...item.paragraphs]),
    expectedConceptParagraphs,
  )
  assert.equal(designConcept.items[2].tagline, 'START・GROW・WITH YOU')
  for (const project of projects) {
    assert.equal(project.sections.length, 2, `${project.slug}: 統一新版兩章架構`)
    assert.deepEqual(
      project.sections.map((section) => section.label),
      ['SECTION 01', 'SECTION 02'],
    )
    assert.equal(project.sections[0].title, '設計理念')
    assert.equal(project.sections[0].subtitle, 'DESIGN CONCEPT')
    assert.ok(project.sections.every((section) => section.items?.length))
    assert.ok(
      project.sections.every(
        (section) => !['作品背景', '設計過程', '作品呈現'].includes(section.title),
      ),
    )
  }
  for (const project of projects.slice(4)) {
    assert.equal(project.sections[1].title, '作品介紹')
    assert.equal(project.sections[1].subtitle, 'PROJECT OVERVIEW')
    for (const section of project.sections) {
      assert.equal(section.content, null)
      assert.equal(section.items.length, 1)
      assert.equal(section.items[0].content, null)
      assert.ok(!section.items[0].media && !section.items[0].paragraphs)
    }
  }
  const brandImages = [
    [
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
    ],
    [
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
  ]
  for (const [index, project] of projects.slice(2, 4).entries()) {
    assert.equal(project.sections[1].title, '作品介紹')
    assert.equal(project.sections[1].subtitle, 'PROJECT OVERVIEW')
    for (const item of project.sections[1].items) {
      assert.ok(!item.label && !item.content && !item.paragraphs && !item.tagline)
    }
    assert.deepEqual(
      project.sections.map((section) => section.items.length),
      [3, index ? 7 : 6],
    )
    assert.deepEqual(
      project.sections[0].items.map((item) => item.label),
      ['INSIGHT — 設計洞察', 'CONCEPT — 設計概念', 'GOAL — 設計目標'],
    )
    assert.equal(project.sections[0].items[1].paragraphs.length, 2)
    const ids = project.sections.flatMap((section) => [
      section.id,
      ...section.items.map((item) => item.id),
    ])
    assert.equal(new Set(ids).size, ids.length, '品牌章節與子段落的資料 ID 唯一')
    const images = project.sections[1].items.flatMap((item) => [
      ...(item.media ? [item.media] : []),
      ...(item.images ?? []),
    ])
    assert.deepEqual(
      images.map((image) => image.src.split('/').at(-1)),
      brandImages[index],
    )
    assert.ok(images.every((image) => image.alt && image.width > 0 && image.height > 0))
    assert.deepEqual(
      project.sections[1].items.filter((item) => item.images).map((item) => item.images.length),
      index ? [2, 2] : [2, 6],
    )
  }
  const papago = projects[1]
  assert.equal(papago.sections[1].title, '機器人介紹')
  assert.equal(papago.sections[1].subtitle, 'LINE BOT OVERVIEW')
  assert.deepEqual(
    papago.sections.map((section) => section.items.length),
    [3, 6],
  )
  assert.deepEqual(
    papago.sections[1].items
      .filter((item) => item.media)
      .map((item) => [item.media.src, item.media.variant]),
    ['find-parking', 'save-parking', 'navigate-to-car', 'line-profile', 'line-qr-code'].map(
      (name) => [
        `/images/projects/papago/${name}.png`,
        name === 'line-qr-code' ? 'qr-code' : 'phone',
      ],
    ),
  )
  for (const project of projects) {
    assert.ok(project.cover, `${project.slug}: 封面資料完整`)
    await access(new URL(`../public${project.cover.src}`, import.meta.url))
    const titleId = `verify-${project.slug}-title`
    const modalContent = await renderToString(
      createSSRApp(ProjectDetail, { project, mode: 'modal', titleId }),
    )
    assert.match(modalContent, new RegExp(`<h2[^>]*id="${titleId}"`))
    assert.ok(!modalContent.includes('<h1'), `${project.slug}: Modal 不重複頁面 H1`)
    assert.ok(!modalContent.includes('content-section'), `${project.slug}: Modal 不套紅黃分區`)
    assert.ok(!modalContent.includes('返回主要作品'), `${project.slug}: Modal 保留在原頁面`)
    assert.ok(!modalContent.includes('設計年份'))
    assert.ok(modalContent.includes(`# ${project.designYear}`))
    for (const removed of ['作品內容整理中', '製作年份', '負責角色', 'project-facts']) {
      assert.ok(!modalContent.includes(removed), `${project.slug}: 移除 ${removed}`)
    }
    assert.deepEqual(
      [...modalContent.matchAll(/<li\b[^>]*class="project-category"[^>]*>(.*?)<\/li>/gs)].map(
        (match) => match[1].trim(),
      ),
      project.categories,
    )
    for (const section of project.sections) {
      const sectionId = `${project.slug}-modal-${section.id}`
      assert.ok(modalContent.includes(`aria-labelledby="${sectionId}"`))
      assert.match(modalContent, new RegExp(`<h3[^>]*id="${sectionId}"`))
      for (const item of section.items ?? [section]) {
        if (item.media) await access(new URL(`../public${item.media.src}`, import.meta.url))
        for (const image of item.images ?? []) {
          await access(new URL(`../public${image.src}`, import.meta.url))
          assert.ok(
            modalContent.includes(
              `src="${image.src}" alt="${image.alt}" width="${image.width}" height="${image.height}" loading="lazy"`,
            ),
          )
        }
        if (item.images?.length && item.media)
          assert.ok(
            modalContent.indexOf(`src="${item.media.src}"`) <
              modalContent.indexOf(`src="${item.images[0].src}"`),
            '單一媒體先於圖片群組',
          )
        if (section.items)
          assert.match(
            modalContent,
            new RegExp(`<h4[^>]*id="${project.slug}-modal-${section.id}-${item.id}"`),
          )
      }
    }
    const ids = [...modalContent.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1])
    assert.equal(new Set(ids).size, ids.length, '章節與子段落的標題 ID 唯一')
    const renderedSections = [...modalContent.matchAll(/<section\b[^>]*>(.*?)<\/section>/gs)]
    assert.equal(renderedSections.length, project.sections.length)
    if (project === projects[0]) {
      assert.ok(modalContent.indexOf('class="project-cover"') < modalContent.indexOf('設計理念'))
      assert.ok(modalContent.indexOf('設計理念') < modalContent.indexOf('網站介紹'))
      assert.ok(modalContent.indexOf('網站介紹') < modalContent.indexOf('序章動畫'))
      assert.equal((modalContent.match(/class="project-chapter-heading"/g) ?? []).length, 2)
      for (const paragraph of expectedConceptParagraphs) assert.ok(modalContent.includes(paragraph))
      assert.ok(modalContent.includes('START・GROW・WITH YOU'))
      const conceptHtml = renderedSections[0][1]
      assert.equal((conceptHtml.match(/<h4\b/g) ?? []).length, 3)
      assert.ok(!conceptHtml.includes('placeholder-panel'))
      assert.ok(
        conceptHtml.indexOf('陪你開始，伴你成長。') < conceptHtml.indexOf('START・GROW・WITH YOU'),
      )
      assert.ok(
        conceptHtml.indexOf('START・GROW・WITH YOU') < conceptHtml.indexOf('用遊戲化建立期待'),
      )
    } else {
      assert.equal((modalContent.match(/class="project-chapter-heading"/g) ?? []).length, 2)
      assert.ok(modalContent.includes('SECTION 01') && modalContent.includes('SECTION 02'))
      assert.equal(
        (modalContent.match(/內容準備中/g) ?? []).length,
        project === projects[4] ? 2 : 0,
      )
      assert.equal(
        (modalContent.match(/class="[^"]*\bproject-image-group(?: [^"]*)?"/g) ?? []).length,
        project.sections
          .flatMap((section) => section.items ?? [section])
          .filter((item) => item.images?.length).length,
      )
      if (project === papago) {
        assert.equal((modalContent.match(/project-section-media--phone/g) ?? []).length, 4)
        assert.equal((modalContent.match(/project-section-media--qr-code/g) ?? []).length, 1)
        assert.ok(modalContent.includes('aria-label="停車位查詢流程"'))
        for (const step of papago.sections[1].items[3].flow.steps)
          assert.ok(modalContent.includes(step))
        assert.ok(
          modalContent.indexOf('line-qr-code.png') < modalContent.indexOf('機器人部署於 Render'),
        )
        assert.ok(!modalContent.includes('07 / SOURCE CODE'))
        assert.ok(!modalContent.includes('GitHub 專案程式碼'))
        assert.ok(!modalContent.includes('https://github.com/ZhengFang121/LineBot_PAPAGO'))
      }
    }
    for (const [index, [, html]] of renderedSections.entries()) {
      const section = project.sections[index]
      assert.ok(html.includes(section.title))
      if (index === 1 && projects.slice(2, 4).includes(project)) {
        assert.ok(!html.includes('project-item-body') && !html.includes('project-item-label'))
      }
      for (const item of section.items ?? [section]) {
        assert.ok(html.includes(item.title))
        if (
          !item.content &&
          !item.paragraphs?.length &&
          !item.tagline &&
          !item.media &&
          !item.images?.length &&
          !item.flow &&
          !item.links?.length &&
          !item.note
        ) {
          assert.ok(html.includes('內容準備中'))
          continue
        }
        if (item.content) assert.ok(html.includes(item.content))
        if (item.media?.type === 'video') {
          assert.ok(
            html.indexOf(item.label) <
              html.indexOf(`id="${project.slug}-modal-${section.id}-${item.id}"`),
          )
          assert.ok(html.indexOf(item.title) < html.indexOf(item.content))
          assert.ok(html.indexOf(item.content) < html.indexOf(`data-src="${item.media.src}"`))
          assert.match(html, /<video\b[^>]*playsinline[^>]*preload="none"/)
          assert.ok(!/<video\b[^>]*\scontrols(?:\s|=|>)/.test(html), '影片不使用原生控制列')
          const videoId = `${project.slug}-modal-${section.id}-${item.id}-video`
          assert.ok(html.includes(`aria-controls="${videoId}"`))
          assert.ok(html.includes(`aria-label="播放${item.title}示範影片"`))
          assert.ok(html.includes(`data-src="${item.media.src}" type="video/mp4"`))
          assert.match(html, /<video\b[^>]*muted[^>]*loop/)
          assert.ok(!/<source\b[^>]*\ssrc=/.test(html), '來源等影片可見時才掛上')
          assert.ok(html.includes(`aria-label="${project.title}：${item.title}示範影片"`))
          assert.ok(!/\b(?:autoplay|poster)=?/.test(html))
        }
      }
    }
  }

  // 測試未來圖片與選用 poster 分支，不改動其他作品的正式資料。
  const imageHtml = await renderToString(
    createSSRApp(ProjectDetail, {
      mode: 'modal',
      project: {
        ...projects[1],
        sections: [
          {
            id: 'image',
            title: '圖片段落',
            content: '圖片內文',
            media: { type: 'image', src: projects[1].cover.src, alt: '圖片替代文字' },
          },
        ],
      },
    }),
  )
  assert.match(imageHtml, /<p[^>]*>圖片內文<\/p>.*<img[^>]*alt="圖片替代文字"[^>]*loading="lazy"/s)
  assert.ok(!imageHtml.includes('<video'))
  assert.ok(!imageHtml.includes('project-section-media--phone'))
  assert.ok(!imageHtml.includes('project-section-media--qr-code'))
  const extrasOnlyHtml = await renderToString(
    createSSRApp(ProjectDetail, {
      mode: 'modal',
      project: {
        ...papago,
        sections: [
          {
            id: 'flow',
            title: '流程',
            content: null,
            flow: { label: '流程說明', steps: ['步驟一', '步驟二'] },
          },
          {
            id: 'link',
            title: '連結',
            content: null,
            links: [{ label: '查看專案', href: 'https://example.com' }],
          },
          { id: 'note', title: '補充', content: null, note: '補充說明' },
        ],
      },
    }),
  )
  assert.ok(!extrasOnlyHtml.includes('內容準備中'))
  assert.ok(!extrasOnlyHtml.includes('project-item-text'))
  assert.ok(extrasOnlyHtml.includes('步驟一') && extrasOnlyHtml.includes('步驟二'))
  assert.ok(extrasOnlyHtml.includes('查看專案') && extrasOnlyHtml.includes('補充說明'))
  // 空陣列仍呈現單層內容；只有媒體時不顯示空文字區或待提供訊息。
  const mediaOnlyHtml = await renderToString(
    createSSRApp(ProjectDetail, {
      mode: 'modal',
      project: {
        ...projects[1],
        sections: [
          {
            id: 'image',
            title: '圖片段落',
            content: null,
            items: [],
            media: { type: 'image', src: projects[1].cover.src, alt: '圖片替代文字' },
          },
        ],
      },
    }),
  )
  assert.ok(mediaOnlyHtml.includes('圖片替代文字'))
  assert.ok(!mediaOnlyHtml.includes('placeholder-panel'))
  assert.ok(!mediaOnlyHtml.includes('project-item-text'))
  // 圖片群組單獨存在時是有效內容；空陣列不留下容器或間距。
  for (const images of [undefined, [], [papago.cover]]) {
    const html = await renderToString(
      createSSRApp(ProjectDetail, {
        mode: 'modal',
        project: {
          ...papago,
          sections: [{ id: 'gallery', title: '圖片群組', content: null, images }],
        },
      }),
    )
    assert.equal(html.includes('class="project-image-group"'), Boolean(images?.length))
    assert.equal(html.includes('內容準備中'), !images?.length)
    assert.equal(html.includes('project-item-text'), !images?.length)
  }
  const optionalChapterHtml = await renderToString(
    createSSRApp(ProjectDetail, {
      mode: 'modal',
      project: {
        ...projects[1],
        sections: ['first', 'second'].map((id) => ({
          id,
          title: '測試章節',
          content: null,
          items: [{ id: 'shared', title: '測試子段落', content: '測試內文' }],
        })),
      },
    }),
  )
  assert.ok(!optionalChapterHtml.includes('project-chapter-number'))
  assert.ok(!optionalChapterHtml.includes('project-chapter-subtitle'))
  for (const id of ['first', 'second']) {
    assert.ok(optionalChapterHtml.includes(`id="project-02-modal-${id}-shared"`))
    assert.ok(optionalChapterHtml.includes(`aria-labelledby="project-02-modal-${id}-shared"`))
  }
  const posterHtml = await renderToString(
    createSSRApp(ProjectDetail, {
      mode: 'modal',
      project: {
        ...projects[0],
        sections: [
          {
            ...projects[0].sections[1].items[0],
            media: { ...projects[0].sections[1].items[0].media, poster: projects[0].cover.src },
          },
        ],
      },
    }),
  )
  assert.ok(posterHtml.includes(`poster="${projects[0].cover.src}"`))

  // 只在測試資料設定網址，不把測試網址寫入正式作品資料。
  async function renderWithRouter(component, props) {
    const router = createRouter({ history: createMemoryHistory(), routes })
    const app = createSSRApp(component, props).use(router)
    await router.push('/works')
    await router.isReady()
    return renderToString(app)
  }
  for (const project of projects) {
    for (const mode of ['page', 'modal']) {
      const baseline = await renderWithRouter(ProjectDetail, {
        project: { ...project, websiteUrl: undefined },
        mode,
      })
      assert.ok(!baseline.includes('project-website-link'), '無網址不渲染外層容器')
      for (const websiteUrl of [
        '',
        '   ',
        'not-a-url',
        '/works',
        'https://',
        'https:example.com',
        'javascript:alert(1)',
        'data:text/html,test',
      ]) {
        const html = await renderWithRouter(ProjectDetail, {
          project: { ...project, websiteUrl },
          mode,
        })
        assert.equal(html, baseline, `${project.slug}/${mode}: 無效網址不增加內容或容器`)
      }
      for (const websiteUrl of ['https://example.com/project', 'http://example.com/project']) {
        const html = await renderWithRouter(ProjectDetail, {
          project: { ...project, websiteUrl: `  ${websiteUrl}  ` },
          mode,
        })
        const link = html.match(/<a\b[^>]*>前往網站<\/a>/)?.[0]
        assert.ok(link, `${project.slug}/${mode}: 共用網站連結`)
        assert.ok(link.includes(`href="${websiteUrl}"`))
        assert.ok(link.includes('target="_blank"') && link.includes('rel="noopener noreferrer"'))
        assert.ok(link.includes('view-more-button--red'))
        assert.ok(!/\s(?:to|type)=/.test(link), '外部連結不帶 Router 或 button 屬性')
        assert.ok(html.indexOf('project-website-link') > html.lastIndexOf('</section>'))
        assert.match(
          html.replace(/<!--[\s\S]*?-->/g, ''),
          /前往網站<\/a><\/div><\/article>$/,
          '網站按鈕位於整份介紹最後',
        )
      }
    }
  }
  const nativeButton = await renderToString(createSSRApp(BaseButton, { type: 'submit' }))
  assert.match(nativeButton, /<button\b[^>]*type="submit"[^>]*>VIEW MORE<\/button>/)
  assert.ok(!/\s(?:to|href|target|rel)=/.test(nativeButton))
  const internalButton = await renderWithRouter(BaseButton, { to: '/about', variant: 'red' })
  const conflictingButton = await renderWithRouter(BaseButton, {
    to: '/about',
    href: 'https://example.com',
    variant: 'red',
  })
  assert.equal(conflictingButton, internalButton, 'to 與 href 並存時維持原站內導覽')
  assert.ok(internalButton.includes('href="/about"'))
  assert.ok(!/\s(?:type|target|rel)=/.test(internalButton))
  console.log('PASS 共用網站連結：五作品、兩種版型、網址驗證、原生按鈕與連結優先規則')

  const cases = [
    ['/', 'home', '平面設計師 與 前端網頁設計學習者'],
    ['/about', 'about', '關於 Fang'],
    ['/works', 'works', '主要作品'],
    ['/graphic-works', 'not-found', '找不到這個頁面'],
    ...projects.map((project) => [`/works/${project.slug}`, `work-${project.slug}`, project.title]),
    ['/works/project-06', 'not-found', '找不到這個頁面'],
    ['/works/unknown-project', 'not-found', '找不到這個頁面'],
    ['/missing-page', 'not-found', '找不到這個頁面'],
    ['/missing/nested/page', 'not-found', '找不到這個頁面'],
  ]

  for (const [path, expectedName, expectedContent] of cases) {
    const router = createRouter({ history: createMemoryHistory(), routes })
    const app = createSSRApp(App)
      .use(router)
      .use(PrimeVue, {
        theme: { preset: portfolioPreset, options: { darkModeSelector: false } },
      })
    await router.push(path)
    await router.isReady()
    assert.equal(router.currentRoute.value.name, expectedName)
    const html = await renderToString(app)
    // Vue 會把單引號編碼，先還原再比對可見文案。
    assert.ok(html.replaceAll('&#39;', "'").includes(expectedContent), path)
    assert.equal((html.match(/<h1(?:\s|>)/g) ?? []).length, 1, `${path}: 一個 h1`)
    assert.ok(html.includes('aria-label="主要導覽"'))
    assert.ok(html.includes('<footer'))
    assert.ok(!html.includes('href="/graphic-works"'), `${path}: 無已移除頁面的內部連結`)
    assert.ok(html.includes('site-content shell-reveal'), `${path}: 共用文件內容區`)
    assert.ok(html.includes('class="intro-viewport"'), `${path}: 獨立固定視窗層`)
    assert.ok(!html.includes('content-scroll'), `${path}: 移除內層捲動容器`)
    assert.ok(html.indexOf('<footer') > html.indexOf('</main>'), `${path}: Footer 接續主內容`)
    const project = projects.find((item) => path === `/works/${item.slug}`)
    const expectedSections = project
      ? 1 + project.sections.length
      : expectedName === 'home'
        ? 2
        : expectedName === 'about'
          ? 3
          : 1
    assert.equal(
      (html.match(/class="[^"]*\bcontent-section\b[^"]*"/g) ?? []).length,
      expectedSections,
      `${path}: 依主要章節分區，卡片不獨立分區`,
    )
    assert.ok(html.includes('data-stage="' + (path === '/' ? 'intro' : 'content') + '"'))
    const activeImage =
      path === '/'
        ? 'home'
        : path === '/about'
          ? 'profile'
          : path.startsWith('/works')
            ? 'works'
            : null
    const activeLinks = [...html.matchAll(/<a\b[^>]*class="[^"]*is-active[^"]*"[^>]*>(.*?)<\/a>/gs)]
    assert.equal(activeLinks.length, activeImage ? 1 : 0, `${path}: 正確的導覽狀態`)
    if (activeImage) assert.ok(activeLinks[0][1].includes(`${activeImage}-2.png`))
    if (expectedName === 'home' || expectedName === 'works') {
      const visibleProjects =
        expectedName === 'home'
          ? ['project-01', 'project-03'].map((slug) =>
              projects.find((project) => project.slug === slug),
            )
          : projects
      for (const project of visibleProjects) {
        assert.ok(html.includes(`href="/works/${project.slug}"`))
      }
      if (expectedName === 'home') {
        assert.ok(html.includes('href="/about"'), '首頁保留 Profile 導覽')
        assert.ok(html.includes('href="/works"'), '首頁導向全部主要作品')
        assert.equal((html.match(/>\s*VIEW MORE\s*<\/a>/g) ?? []).length, 2)
        assert.ok(html.includes('view-more-button--cream'))
        assert.ok(html.includes('view-more-button--red'))
        for (const project of projects.filter((project) => !visibleProjects.includes(project))) {
          assert.ok(!html.includes(`href="/works/${project.slug}"`))
        }
      } else {
        assert.match(html, /<h1\b[^>]*class="sr-only"[^>]*>主要作品<\/h1>/)
        assert.ok(!html.includes('六個主要作品，名稱與內容待確認。'))
      }
      const cards = [...html.matchAll(/<a\b[^>]*class="[^"]*\bwork-card\b[^"]*"[^>]*>(.*?)<\/a>/gs)]
      assert.equal(cards.length, visibleProjects.length, `${path}: 每張作品卡片有一個連結`)
      for (const [index, card] of cards.entries()) {
        const project = visibleProjects[index]
        assert.ok(card[0].includes(`href="/works/${project.slug}"`), `${path}: 卡片順序正確`)
        assert.ok(card[0].includes('aria-haspopup="dialog"'), `${path}: 宣告開啟 Dialog`)
        assert.ok(card[0].includes('aria-expanded="false"'), `${path}: 初始 Modal 關閉`)
        assert.ok(card[1].includes(project.title))
        assert.ok(card[1].includes(project.summary))
        assert.ok(card[1].includes(`src="${project.cover.src}"`))
        assert.ok(card[1].includes(`width="${project.cover.width}"`))
        assert.ok(card[1].includes(`height="${project.cover.height}"`))
        const categories = [
          ...card[1].matchAll(/<li\b[^>]*class="project-category"[^>]*>(.*?)<\/li>/gs),
        ]
        assert.deepEqual(
          categories.map((match) => match[1].trim()),
          project.categories,
        )
        assert.ok(card[1].indexOf('work-card-categories') > card[1].indexOf('work-card-summary'))
        assert.ok(!card[1].includes('work-card-action'))
        assert.ok(!card[1].includes('<a '), `${path}: 作品卡片沒有巢狀連結`)
        assert.ok(!card[1].includes('VIEW MORE'), `${path}: 不加入重複的卡片按鈕`)
      }
    }
    if (expectedName.startsWith('work-')) {
      for (const section of project.sections) assert.ok(html.includes(section.title))
      assert.ok(html.includes(`src="${project.cover.src}"`))
      for (const category of project.categories) assert.ok(html.includes(category))
      assert.ok(html.includes(`# ${project.designYear}`))
      assert.equal(
        html.includes('內容準備中'),
        project.sections
          .flatMap((section) => section.items ?? [section])
          .some(
            (item) =>
              !item.content &&
              !item.paragraphs?.length &&
              !item.tagline &&
              !item.media &&
              !item.images?.length &&
              !item.flow &&
              !item.links?.length &&
              !item.note,
          ),
      )
    }
    if (expectedName === 'not-found') {
      assert.ok(html.includes('href="/"'))
      assert.ok(html.includes('返回首頁'))
    }
    console.log(`PASS ${path}`)
  }
  console.log(`已通過 ${cases.length} 個路由與 HTML 渲染檢查。`)
} finally {
  await server.close()
}
