// 以 Vue 的記憶體 Router 與 HTML 渲染確認路由；不代表瀏覽器視覺 QA。
import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import { createServer } from 'vite'
import { createSSRApp } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { renderToString } from '@vue/server-renderer'
import PrimeVue from 'primevue/config'

const server = await createServer({
  // 驗證與開發伺服器不可共用依賴快取，避免覆寫使用中的 PrimeVue 模組。
  cacheDir: 'node_modules/.vite-verify-routes',
  server: { middlewareMode: true, hmr: false, ws: false },
  appType: 'custom',
})

try {
  const globalStyles = await readFile(new URL('../src/styles/index.css', import.meta.url), 'utf8')
  const bodyCopyRule = globalStyles.match(/\.body-copy\s*\{([^}]+)\}/)?.[1]
  assert.ok(bodyCopyRule, '正式內文由全站 body-copy 樣式管理')
  assert.match(bodyCopyRule, /text-align:\s*justify\s*;/)
  assert.match(bodyCopyRule, /text-align-last:\s*start\s*;/)
  assert.equal((globalStyles.match(/\.body-copy\s*\{/g) ?? []).length, 1)

  function bodyCopyText(html) {
    return [...html.matchAll(/<(p|li)\b[^>]*class="[^"]*\bbody-copy\b[^"]*"[^>]*>(.*?)<\/\1>/gs)]
      .map((match) =>
        match[2]
          .replace(/<[^>]+>/g, '')
          .replace(/\s+/g, ' ')
          .trim(),
      )
      .map((text) =>
        text.replace(
          /&(?:amp|lt|gt|quot|#39);/g,
          (entity) =>
            ({
              '&amp;': '&',
              '&lt;': '<',
              '&gt;': '>',
              '&quot;': '"',
              '&#39;': "'",
            })[entity],
        ),
      )
  }
  const { routes } = await server.ssrLoadModule('/src/router/routes.ts')
  const { projects } = await server.ssrLoadModule('/src/data/projects.ts')
  const { experiences } = await server.ssrLoadModule('/src/data/experiences.ts')
  assert.deepEqual(
    experiences.map(({ year }) => year),
    [2026, 2021, 2018, 2017, 2016, 2015, 2014, 2013],
  )
  assert.deepEqual(
    experiences.map(({ items }) => items.length),
    [1, 1, 1, 9, 9, 1, 1, 1],
  )
  assert.equal(
    experiences.find(({ year }) => year === 2021).items[0].text,
    '擔任 恬品軒企業有限公司 設計 ( 2021 - 2025 )',
  )
  assert.equal(
    experiences.find(({ year }) => year === 2017).items[0].text,
    '擔任 奇軒包裝有限公司 設計 ( 2017 - 2021 )',
  )
  const { default: App } = await server.ssrLoadModule('/src/App.vue')
  const { default: ProjectDetail } = await server.ssrLoadModule('/src/components/ProjectDetail.vue')
  const { default: BaseButton } = await server.ssrLoadModule('/src/components/BaseButton.vue')
  const { portfolioPreset } = await server.ssrLoadModule('/src/theme/primevue.ts')
  assert.equal(projects.length, 6)
  assert.equal(new Set(projects.map((project) => project.slug)).size, 6)
  assert.deepEqual(
    projects.map((project) => project.title),
    ['跑者菲迪 Pheidi the Runner', 'PAPAGO', 'APOLLO', 'R4D', '似顏繪', '初次見麵'],
  )
  assert.deepEqual(
    projects.map((project) => project.designYear),
    ['2026', '2026', '2021 - 2025', '2021 - 2025', '2022 - 2023', '2017'],
  )
  const pheidiSections = [
    [
      'intro',
      '序章動畫',
      '01 / INTRO ANIMATION',
      '使用點擊或滑動滾輪來讓動畫進行，透過角色插畫與動態視覺，帶領使用者進入跑者菲迪的世界。以輕鬆活潑的方式建立第一印象，傳達「陪你開始 伴你成長」的品牌精神，讓每一段跑步旅程從充滿期待的序章展開。',
    ],
    [
      'login',
      '登入註冊',
      '02 / LOGIN & REGISTER',
      '透過簡潔直覺的登入與註冊介面，降低新手開始使用網站的門檻。建立專屬的跑者帳號，保存個人的跑步紀錄與成長歷程，從這裡展開屬於自己的跑步旅程。',
    ],
    [
      'home',
      '首頁',
      '03 / HOME',
      '首頁整合跑者階段、成長進度與個人跑步概況，讓使用者快速掌握目前的成果與下一階段目標。搭配菲迪日報的資訊內容，讓每一次回訪都有新的期待與方向。',
    ],
    [
      'records',
      '新增跑步紀錄',
      '04 / RUNNING RECORD',
      '透過直覺化的表單，記錄每一次跑步的時間、距離、地點與心得，並可搭配照片留下當時的回憶。讓原本單純的跑步數據，轉化成看得見的成長足跡，累積屬於自己的跑者旅程。',
    ],
    [
      'station',
      '足跡驛站',
      '05 / RUNNING STATION',
      '以月曆方式呈現個人的跑步歷程，方便回顧每一次努力與進步。同時設計成就徽章系統，透過累積跑步次數、里程與完成不同挑戰來解鎖徽章。透過累積紀錄與成長回饋，讓使用者看見自己的堅持，從每一個小小的成就中獲得持續前進的動力。',
    ],
    [
      'academy',
      '跑者學院',
      '06 / RUNNING ACADEMY',
      '針對新手跑者的需求，整理學習、裝備、補給與賽事四大類跑步知識。文章依照跑者階段逐步解鎖，避免一次接收過多資訊造成負擔，讓使用者能依照自己的成長進度循序學習、建立正確觀念，並在每一次出發時更有信心。',
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
  assert.equal(designConcept.label, undefined)
  assert.equal(projects[0].sections[1].label, undefined)
  assert.equal(projects[0].sections[1].title, '作品介紹')
  assert.equal(projects[0].sections[1].subtitle, 'PROJECT OVERVIEW')
  assert.equal(designConcept.id, 'design-concept')
  assert.equal(designConcept.title, '設計理念')
  assert.equal(designConcept.subtitle, 'DESIGN CONCEPT')
  assert.deepEqual(
    designConcept.items.map((item) => item.label),
    ['設計洞察 INSIGHT', '設計概念 CONCEPT', '品牌願景 VISION'],
  )
  const expectedConceptParagraphs = [
    '跑步容易開始，卻不容易持續。',
    '對新手跑者而言，缺乏目標、成就感與持續的動力，往往讓跑步逐漸變得枯燥，甚至想中途放棄。',
    '用遊戲化的方式，讓跑步成為值得期待的日常。',
    '以「遊戲化」為構思核心，設計出陪伴新手跑者建立跑步習慣的網站 - 「跑者菲迪 Pheidi the Runner」。透過跑步紀錄、階段成長與成就徽章，讓每一次努力都被看見；結合跑步知識與跑友交流，讓跑步不再只是獨自堅持的過程。',
    '陪你開始 伴你成長',
    '用遊戲化建立期待，用知識培養信心，用陪伴養成習慣。希望陪伴每一位新手跑者勇敢踏出第一步，逐漸養成跑步習慣，並在每一次奔跑中持續成長。',
  ]
  assert.deepEqual(
    designConcept.items.flatMap((item) => [item.title, ...item.paragraphs]),
    expectedConceptParagraphs,
  )
  assert.equal(designConcept.items[2].tagline, 'START・GROW・WITH YOU')
  for (const project of projects.filter((project) => project.slug !== 'project-06')) {
    assert.equal(project.sections.length, 2, `${project.slug}: 統一新版兩章架構`)
    assert.deepEqual(
      project.sections.map((section) => section.label),
      [undefined, undefined],
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
  const noodle = projects.find((project) => project.slug === 'project-05')
  assert.equal(noodle.summary, '台灣麵食文化主題肥皂設計')
  assert.deepEqual(
    noodle.sections.map((section) => section.items.length),
    [3, 4],
  )
  assert.deepEqual(
    noodle.sections[0].items.map((item) => item.label),
    ['設計洞察 INSIGHT', '設計概念 CONCEPT', '設計目標 VISION'],
  )
  assert.equal(noodle.sections[0].items[1].paragraphs.length, 2)
  assert.deepEqual(noodle.awards, [
    {
      name: '文創之星',
      category: '創意概念組・傳承創新',
      recognition: '金獎',
    },
  ])
  assert.equal(noodle.sections[1].items[0].media.variant, 'logo')
  const catalogSection = noodle.sections[1].items[1]
  assert.equal(catalogSection.title, '麵食造型肥皂圖鑑')
  assert.equal(catalogSection.imageLayout, undefined)
  assert.equal(catalogSection.images, undefined)
  assert.deepEqual(
    catalogSection.catalog.map((group) => [group.title, group.items.length]),
    [
      ['古早味系列肥皂', 2],
      ['傳統節慶系列肥皂', 3],
    ],
  )
  assert.deepEqual(
    catalogSection.catalog.flatMap((group) => group.items.map((item) => item.title)),
    [
      '01｜陽春麵的寬麵皂',
      '02｜擔仔麵的油麵皂',
      '03｜新年水餃皂',
      '04｜冬至湯圓皂',
      '05｜穀雨麵線皂',
    ],
  )
  assert.deepEqual(
    catalogSection.catalog.flatMap((group) =>
      group.items.map((item) => item.image.src.split('/').at(-1)),
    ),
    [
      'soap-yangchun-noodle.png',
      'soap-danzai-noodle.png',
      'soap-dumpling.png',
      'soap-winter-solstice-tangyuan.png',
      'soap-grain-rain-noodle.png',
    ],
  )
  assert.deepEqual(
    noodle.sections[1].items[3].blocks.map((block) => block.id),
    ['exhibition', 'award', 'media'],
  )
  assert.deepEqual(
    noodle.sections[1].items[3].blocks
      .flatMap((block) => block.images ?? [])
      .map((image) => image.src.split('/').at(-1)),
    [
      'exhibition-01.JPG',
      'exhibition-02.jpg',
      'exhibition-03.JPG',
      'exhibition-04.jpg',
      'exhibition-05.JPG',
    ],
  )
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
      [3, index ? 7 : 5],
    )
    assert.deepEqual(
      project.sections[0].items.map((item) => item.label),
      ['設計洞察 INSIGHT', '設計概念 CONCEPT', '設計目標 VISION'],
    )
    assert.equal(project.sections[0].items[1].paragraphs.length, 1)
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
  assert.equal(papago.sections[1].title, '作品介紹')
  assert.equal(papago.sections[1].subtitle, 'PROJECT OVERVIEW')
  assert.deepEqual(
    papago.sections.map((section) => section.items.length),
    [3, 5],
  )
  assert.deepEqual(
    papago.sections[1].items
      .filter((item) => item.media)
      .map((item) => [item.media.src, item.media.variant]),
    ['find-parking', 'save-parking', 'navigate-to-car'].map((name) => [
      `/images/projects/papago/${name}.png`,
      'phone',
    ]),
  )
  const addFriend = papago.sections[1].items.at(-1)
  assert.equal(addFriend.id, 'add-friend')
  assert.equal(addFriend.label, '05 / ADD FRIEND')
  assert.equal(addFriend.title, '加入 PAPAGO 好友')
  assert.equal(addFriend.imageLayout, 'qr-phone')
  assert.deepEqual(
    addFriend.images.map((image) => image.src),
    ['line-qr-code', 'line-profile'].map((name) => `/images/projects/papago/${name}.png`),
  )
  for (const project of projects) {
    assert.ok(project.cover, `${project.slug}: 封面資料完整`)
    await access(new URL(`../public${project.cover.src}`, import.meta.url))
    const titleId = `verify-${project.slug}-title`
    const modalContent = await renderToString(createSSRApp(ProjectDetail, { project, titleId }))
    const expectedCopy = [
      project.summary ?? '作品簡介尚未提供，將於內容確認後補上。',
      ...project.sections.flatMap((section) =>
        (section.items ?? [section]).flatMap((item) => [
          ...(item.paragraphs ?? []),
          ...(item.content ? [item.content] : []),
          ...(item.catalog ?? []).flatMap((group) =>
            group.items.map((product) => product.description),
          ),
          ...(item.blocks ?? []).flatMap((block) => (block.content ? [block.content] : [])),
          ...(item.note ? [item.note] : []),
        ]),
      ),
    ]
    assert.deepEqual(
      bodyCopyText(modalContent),
      expectedCopy.map((text) => text.replace(/\s+/g, ' ').trim()),
      `${project.slug}: 所有正式段落由共用渲染層套用 body-copy，保留完整文字及順序`,
    )
    assert.ok(
      !/<(?:h[1-6]|p)\b[^>]*class="[^"]*\b(?:project-item-label|project-item-tagline|project-chapter-subtitle|project-design-year)\b[^"]*\bbody-copy\b/.test(
        modalContent,
      ),
    )
    assert.match(modalContent, new RegExp(`<h2[^>]*id="${titleId}"`))
    assert.ok(!modalContent.includes('<h1'), `${project.slug}: Modal 不重複頁面 H1`)
    assert.ok(!modalContent.includes('content-section'), `${project.slug}: Modal 不套紅黃分區`)
    assert.ok(!modalContent.includes('返回主要作品'), `${project.slug}: Modal 保留在原頁面`)
    assert.ok(!modalContent.includes('設計年份'))
    assert.ok(modalContent.includes(`# ${project.designYear}`))
    assert.ok(!modalContent.includes('project-chapter-number'), '介紹視窗不渲染章節編號')
    assert.ok(!modalContent.includes('SECTION 01') && !modalContent.includes('SECTION 02'))
    const header = modalContent.match(/<header\b[^>]*>(.*?)<\/header>/s)[1]
    const headerOrder = [
      'project-design-year',
      'project-detail-title',
      'project-detail-summary',
      'project-categories',
      'project-cover',
    ].map((className) => header.indexOf(className))
    assert.ok(
      headerOrder.every(
        (position, index) => position >= 0 && (!index || position > headerOrder[index - 1]),
      ),
      `${project.slug}: 共用頂部順序為年份、名稱、簡介、分類與封面`,
    )
    assert.equal((header.match(/class="project-design-year"/g) ?? []).length, 1)
    assert.equal((header.match(/class="project-cover"/g) ?? []).length, 1)
    for (const removed of ['作品內容整理中', '製作年份', '負責角色', 'project-facts']) {
      assert.ok(!modalContent.includes(removed), `${project.slug}: 移除 ${removed}`)
    }
    assert.deepEqual(
      [
        ...header
          .match(/<ul\b[^>]*>(.*?)<\/ul>/s)[1]
          .matchAll(/<li\b[^>]*class="project-category"[^>]*>(.*?)<\/li>/gs),
      ].map((match) => match[1].replace(/<[^>]*>/g, '').trim()),
      project.categories,
    )
    for (const section of project.sections) {
      const sectionId = `${project.slug}-modal-${section.id}`
      if (section.title) {
        assert.ok(modalContent.includes(`aria-labelledby="${sectionId}"`))
        assert.match(modalContent, new RegExp(`<h3[^>]*id="${sectionId}"`))
      } else {
        assert.ok(!modalContent.includes(`aria-labelledby="${sectionId}"`))
        assert.ok(!modalContent.includes(`id="${sectionId}"`))
      }
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
        for (const group of item.catalog ?? []) {
          const groupId = `${project.slug}-modal-${section.id}-${item.id}-${group.id}`
          assert.match(modalContent, new RegExp(`<h5[^>]*id="${groupId}"`))
          assert.ok(modalContent.includes(group.title))
          for (const product of group.items) {
            const image = product.image
            await access(new URL(`../public${image.src}`, import.meta.url))
            assert.ok(image.alt && image.width > 0 && image.height > 0)
            assert.ok(product.description && modalContent.includes(product.description))
            assert.ok(modalContent.includes(`<h6 class="project-catalog-item-title"`))
            assert.ok(modalContent.includes(product.title))
            assert.equal(
              modalContent.split(`src="${image.src}"`).length - 1,
              1,
              '圖鑑圖片只出現一次',
            )
            assert.ok(
              modalContent.includes(
                `alt="${image.alt}" width="${image.width}" height="${image.height}" loading="lazy"`,
              ),
            )
          }
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
    assert.equal(header.includes('project-awards'), Boolean(project.awards?.length))
    assert.ok(!header.includes('project-awards-label') && !header.includes('project-awards-list'))
    if (project.awards?.length) {
      assert.ok(modalContent.indexOf('project-categories') < modalContent.indexOf('project-awards'))
      assert.ok(modalContent.indexOf('project-awards') < modalContent.indexOf('project-cover'))
      assert.ok(header.includes('project-categories--award'))
      assert.ok(header.includes('獲獎 AWARD | 文創之星 創意概念組傳承創新 金獎'))
      assert.ok(!header.includes('<svg'), '獲獎膠囊不顯示圖示')
    }
    for (const item of project.sections.flatMap((section) => section.items ?? [section])) {
      for (const block of item.blocks ?? []) {
        if (block.label) assert.ok(modalContent.includes(block.label))
        if (block.content) assert.ok(modalContent.includes(block.content))
        for (const image of block.images ?? []) {
          await access(new URL(`../public${image.src}`, import.meta.url))
          assert.ok(image.alt && image.width > 0 && image.height > 0)
          if (block.content) {
            assert.ok(
              modalContent.indexOf(block.content) < modalContent.indexOf(`src="${image.src}"`),
            )
          }
        }
      }
    }
    const ids = [...modalContent.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1])
    assert.equal(new Set(ids).size, ids.length, '章節與子段落的標題 ID 唯一')
    const renderedSections = [...modalContent.matchAll(/<section\b[^>]*>(.*?)<\/section>/gs)]
    assert.equal(renderedSections.length, project.sections.length)
    if (project === projects[0]) {
      assert.ok(modalContent.indexOf('class="project-cover"') < modalContent.indexOf('設計理念'))
      assert.ok(modalContent.indexOf('設計理念') < modalContent.indexOf('作品介紹'))
      assert.ok(modalContent.indexOf('作品介紹') < modalContent.indexOf('序章動畫'))
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
    } else if (project.slug === 'project-06') {
      assert.equal(project.summary, '客製化肖像插畫')
      assert.deepEqual(project.categories, ['ILLUSTRATION'])
      assert.ok(!modalContent.includes('placeholder-media'))
      assert.ok(header.includes(`src="${project.cover.src}"`))
      const orderedContent = [
        `# ${project.designYear}`,
        project.title,
        project.summary,
        'ILLUSTRATION',
        '/images/projects/custom-portrait/cover.jpg',
        '依照客戶提供的照片，繪製專屬的人物與寵物似顏繪。以簡約的手繪線條與柔和的色彩，保留每個角色獨特的外型與神情，將照片中的日常回憶轉化為溫暖且富有個人特色的插畫作品。',
        '作品介紹',
        'PROJECT OVERVIEW',
      ]
      let previous = -1
      for (const content of orderedContent) {
        const position = modalContent.indexOf(content, previous + 1)
        assert.ok(position > previous, `似顏繪內容順序：${content}`)
        previous = position
      }
      assert.equal(project.sections.length, 2)
      assert.equal(project.sections[0].id, 'project-introduction')
      assert.equal(project.sections[0].title, '設計理念')
      assert.equal(project.sections[0].subtitle, 'DESIGN CONCEPT')
      assert.equal(project.sections[1].id, 'project-gallery')
      assert.equal(project.sections[1].title, '作品介紹')
      assert.equal(project.sections[1].subtitle, 'PROJECT OVERVIEW')
      assert.equal((modalContent.match(/class="project-chapter-heading"/g) ?? []).length, 2)
      assert.ok(modalContent.includes('依照客戶提供的照片'))
      assert.ok(!modalContent.includes('作品展示'))
      assert.equal(project.sections[1].imageLayout, 'stack')
      assert.deepEqual(
        project.sections[1].images.map((image) => image.src),
        ['01', '02', '03', '04', '05', '06'].map(
          (name) => `/images/projects/custom-portrait/${name}.jpg`,
        ),
        '展示區不重複封面，依序顯示六張圖片',
      )
      assert.ok(modalContent.includes('project-image-group--stack'))
      const images = [...modalContent.matchAll(/<img\b[^>]*src="([^"]+)"/g)]
      assert.deepEqual(
        images.map((match) => match[1]),
        ['cover', '01', '02', '03', '04', '05', '06'].map(
          (name) => `/images/projects/custom-portrait/${name}.jpg`,
        ),
        '封面與六張展示圖片各出現一次，依序呈現',
      )
      assert.ok(
        project.sections[1].images.every((image) => image.width === 3000 && image.height === 3000),
      )
    } else {
      assert.equal((modalContent.match(/class="project-chapter-heading"/g) ?? []).length, 2)
      assert.equal((modalContent.match(/內容準備中/g) ?? []).length, 0)
      assert.equal(
        (modalContent.match(/class="[^"]*\bproject-image-group(?: [^"]*)?"/g) ?? []).length,
        project.sections
          .flatMap((section) => section.items ?? [section])
          .reduce(
            (count, item) =>
              count +
              Number(Boolean(item.images?.length)) +
              (item.blocks ?? []).filter((block) => block.images?.length).length,
            0,
          ),
      )
      if (project === papago) {
        assert.equal((modalContent.match(/project-section-media--phone/g) ?? []).length, 3)
        assert.equal((modalContent.match(/project-image-group--qr-phone/g) ?? []).length, 1)
        assert.ok(modalContent.includes('05 / ADD FRIEND'))
        assert.ok(!modalContent.includes('05 / LINE ACCOUNT'))
        assert.ok(!modalContent.includes('06 / ADD FRIEND'))
        assert.ok(!modalContent.includes('id="project-02-modal-line-bot-overview-line-account"'))
        assert.ok(
          modalContent.indexOf('line-qr-code.png') < modalContent.indexOf('line-profile.png'),
        )
        assert.ok(modalContent.includes('aria-label="停車位查詢流程"'))
        for (const step of papago.sections[1].items[3].flow.steps)
          assert.ok(modalContent.includes(step))
        assert.ok(
          modalContent.indexOf('機器人部署於 Render') < modalContent.indexOf('05 / ADD FRIEND'),
        )
        assert.ok(papago.sections[1].items[3].note.includes('機器人部署於 Render'))
        assert.equal(addFriend.note, undefined)
        assert.ok(!modalContent.includes('07 / SOURCE CODE'))
        assert.ok(!modalContent.includes('GitHub 專案程式碼'))
        assert.ok(!modalContent.includes('https://github.com/ZhengFang121/LineBot_PAPAGO'))
      }
    }
    for (const [index, [, html]] of renderedSections.entries()) {
      const section = project.sections[index]
      if (section.title) assert.ok(html.includes(section.title))
      if (index === 1 && projects.slice(2, 4).includes(project)) {
        assert.ok(!html.includes('project-item-body') && !html.includes('project-item-label'))
      }
      for (const item of section.items ?? [section]) {
        if (item.title) assert.ok(html.includes(item.title))
        if (
          !item.content &&
          !item.paragraphs?.length &&
          !item.tagline &&
          !item.media &&
          !item.images?.length &&
          !item.catalog?.length &&
          !item.blocks?.length &&
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
  // 圖鑑可獨立構成有效內容；空值不產生空版面。
  for (const catalog of [undefined, [], catalogSection.catalog]) {
    const html = await renderToString(
      createSSRApp(ProjectDetail, {
        project: {
          ...noodle,
          sections: [{ id: 'catalog', title: '圖鑑', catalog }],
        },
      }),
    )
    assert.equal(html.includes('class="project-catalog"'), Boolean(catalog?.length))
    assert.equal(html.includes('內容準備中'), !catalog?.length)
    assert.equal(html.includes('project-item-text'), !catalog?.length)
  }
  const optionalChapterHtml = await renderToString(
    createSSRApp(ProjectDetail, {
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
    const baseline = await renderWithRouter(ProjectDetail, {
      project: { ...project, websiteUrl: undefined },
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
      })
      assert.equal(html, baseline, `${project.slug}/modal: 無效網址不增加內容或容器`)
    }
    for (const websiteUrl of ['https://example.com/project', 'http://example.com/project']) {
      const html = await renderWithRouter(ProjectDetail, {
        project: { ...project, websiteUrl: `  ${websiteUrl}  ` },
      })
      const link = html.match(
        /<a\b[^>]*>\s*<span\b[^>]*>前往網站<\/span>\s*<svg\b[\s\S]*?<\/svg>\s*<\/a>/,
      )?.[0]
      assert.ok(link, `${project.slug}/modal: 共用網站連結`)
      assert.ok(link.includes(`href="${websiteUrl}"`))
      assert.ok(link.includes('target="_blank"') && link.includes('rel="noopener noreferrer"'))
      assert.ok(link.includes('view-more-button--red'))
      assert.ok(!/\s(?:to|type)=/.test(link), '外部連結不帶 Router 或 button 屬性')
      assert.ok(html.indexOf('project-website-link') > html.lastIndexOf('</section>'))
      assert.match(
        html.replace(/<!--[\s\S]*?-->/g, ''),
        /前往網站<\/span>\s*<svg\b[\s\S]*?<\/svg>\s*<\/a><\/div><\/article>$/,
        '網站按鈕位於整份介紹最後',
      )
    }
  }
  const nativeButton = await renderToString(createSSRApp(BaseButton, { type: 'submit' }))
  assert.match(
    nativeButton,
    /<button\b[^>]*type="submit"[^>]*>\s*<span\b[^>]*>VIEW MORE<\/span>\s*<svg\b[\s\S]*?<\/svg>\s*<\/button>/,
  )
  const nativeIcon = nativeButton.match(/<svg\b[^>]*>/)?.[0] ?? ''
  assert.ok(nativeIcon.includes('lucide-arrow-right') && nativeIcon.includes('aria-hidden="true"'))
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
  console.log('PASS 共用網站連結：六作品、共用 Modal、網址驗證、原生按鈕與連結優先規則')

  for (const project of projects) {
    const router = createRouter({ history: createMemoryHistory(), routes })
    await router.push(`/works/${project.slug}?shared=1#detail`)
    await router.isReady()
    assert.equal(router.currentRoute.value.fullPath, `/works/${project.routeSlug}?shared=1#detail`)
    assert.equal(router.currentRoute.value.meta.projectSlug, project.slug)
    console.log(`PASS 舊網址 ${project.slug} → ${project.routeSlug}`)
  }
  assert.equal(new Set(projects.map((project) => project.routeSlug)).size, 6)

  const cases = [
    ['/', 'home', '平面設計師 與 前端網頁設計學習者'],
    ['/about', 'about', '正芳 Fang'],
    ['/works', 'works', '主要作品'],
    ['/graphic-works', 'not-found', '找不到這個頁面'],
    ...projects.map((project) => [
      `/works/${project.routeSlug}`,
      `work-${project.slug}`,
      '主要作品',
    ]),
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
    const project = projects.find((item) => path === `/works/${item.routeSlug}`)
    const expectedSections = expectedName === 'home' ? 2 : expectedName === 'about' ? 4 : 1
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
    if (expectedName === 'about') {
      assert.match(html, /<p\b[^>]*class="about-intro body-copy"/)
      const narrative = bodyCopyText(html)
      assert.equal(narrative.length, 1 + experiences.flatMap((entry) => entry.items).length)
      assert.deepEqual(
        narrative.slice(1),
        experiences.flatMap((entry) => entry.items.map((item) => item.text)),
      )
      assert.deepEqual(
        [...html.matchAll(/<h2\b[^>]*>(.*?)<\/h2>/gs)].map((match) => match[1]),
        ['學歷 Education', '證照 License', '技能 Skills', '喜愛 Likes'],
      )
      for (const removed of ['個人介紹', '經歷 Experience', '待提供', '待確認']) {
        assert.ok(!html.includes(removed), `Profile 移除舊內容：${removed}`)
      }
      assert.equal((html.match(/class="experience-marker"/g) ?? []).length, experiences.length)
      assert.deepEqual(
        [...html.matchAll(/<time\b[^>]*>(\d+)<\/time>/g)].map((match) => Number(match[1])),
        experiences.map(({ year }) => year),
      )
      let previousPosition = -1
      for (const { items } of experiences) {
        for (const { text } of items) {
          const position = html.indexOf(text)
          assert.ok(position > previousPosition, `經歷完整呈現並維持順序：${text}`)
          assert.equal(html.indexOf(text, position + text.length), -1, `經歷不重複：${text}`)
          previousPosition = position
        }
      }
      assert.ok(previousPosition < html.indexOf('id="about-likes"'), '完整經歷呈現在 Likes 前')
      assert.ok(!/<h2\b[^>]*>聯絡方式<\/h2>/.test(html))
      for (const text of [
        '2013 - 2017',
        '朝陽科技大學工業設計系',
        '2010 - 2013',
        '鶯歌高職陶瓷工程科',
        '網頁設計 丙級技術士',
        '廣告設計 丙級技術士',
        '陶瓷石膏模 丙級技術士',
        'AutoCAD 國際認證',
      ]) {
        assert.ok(html.includes(text), `Profile 資料完整：${text}`)
      }
      assert.deepEqual(
        [...html.matchAll(/<h3\b[^>]*class="skill-group-title"[^>]*>(.*?)<\/h3>/gs)].map(
          (match) => match[1],
        ),
        ['視覺設計', '前端開發', '數位工具'],
      )
      assert.deepEqual(
        [...html.matchAll(/<span\b[^>]*class="skill-group-number"[^>]*>(.*?)<\/span>/gs)].map(
          (match) => match[1],
        ),
        ['01', '02', '03'],
      )
      assert.deepEqual(
        [...html.matchAll(/<li\b[^>]*class="skill-item"[^>]*>(.*?)<\/li>/gs)].map(
          (match) => match[1],
        ),
        [
          'Illustrator',
          'Photoshop',
          'Figma',
          'Procreate',
          'HTML',
          'CSS',
          'JavaScript',
          'Vue 3',
          'Git',
          'GitHub',
          'ChatGPT',
          'Codex',
          'Microsoft Office',
        ],
      )
      const likeImages = [
        ...html.matchAll(/<img\b[^>]*src="(\/images\/profile\/likes\/[^"]+)"[^>]*>/g),
      ]
      assert.deepEqual(
        likeImages.map((match) => match[1].split('/').at(-1)),
        [
          'baseball-1.png',
          'baseball-2.JPG',
          'ceramics-1.png',
          'ceramics-2.jpg',
          'coffee-1.png',
          'coffee-2.JPG',
          'mountain-sea-1.png',
          'mountain-sea-2.jpg',
          'panda-1.png',
          'panda-2.JPG',
          'run-1.png',
          'run-2.JPG',
        ],
      )
      for (const [index, match] of likeImages.entries()) {
        await access(new URL(`../public${match[1]}`, import.meta.url))
        if (index % 2 === 0) assert.ok(/alt="[^"]+"/.test(match[0]))
        else assert.ok(match[0].includes('alt=""') && match[0].includes('aria-hidden="true"'))
      }
      assert.ok(html.includes('href="mailto:skin84121@gmail.com"'))
    }
    if (expectedName === 'home' || expectedName === 'works') {
      const visibleProjects =
        expectedName === 'home'
          ? ['project-01', 'project-03'].map((slug) =>
              projects.find((project) => project.slug === slug),
            )
          : projects
      for (const project of visibleProjects) {
        assert.ok(html.includes(`href="/works/${project.routeSlug}"`))
      }
      if (expectedName === 'home') {
        assert.ok(html.includes('href="/about"'), '首頁保留 Profile 導覽')
        assert.ok(html.includes('href="/works"'), '首頁導向全部主要作品')
        assert.equal(
          (
            html.match(
              /<a\b[^>]*>\s*<span\b[^>]*>VIEW MORE<\/span>\s*<svg\b[\s\S]*?<\/svg>\s*<\/a>/g,
            ) ?? []
          ).length,
          2,
        )
        assert.ok(html.includes('view-more-button--cream'))
        assert.ok(html.includes('view-more-button--red'))
        for (const project of projects.filter((project) => !visibleProjects.includes(project))) {
          assert.ok(!html.includes(`href="/works/${project.routeSlug}"`))
        }
      } else {
        assert.match(html, /<h1\b[^>]*class="sr-only"[^>]*>主要作品<\/h1>/)
        assert.ok(!html.includes('六個主要作品，名稱與內容待確認。'))
      }
      const cards = [...html.matchAll(/<a\b[^>]*class="[^"]*\bwork-card\b[^"]*"[^>]*>(.*?)<\/a>/gs)]
      assert.equal(cards.length, visibleProjects.length, `${path}: 每張作品卡片有一個連結`)
      for (const [index, card] of cards.entries()) {
        assert.ok(!card[1].includes('body-copy'), '作品卡片簡介與短標籤保留置中設計')
        const project = visibleProjects[index]
        assert.ok(card[0].includes(`href="/works/${project.routeSlug}"`), `${path}: 卡片順序正確`)
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
          categories.map((match) => match[1].replace(/<[^>]*>/g, '').trim()),
          project.categories,
        )
        assert.ok(card[1].indexOf('work-card-categories') > card[1].indexOf('work-card-summary'))
        assert.ok(!card[1].includes('work-card-action'))
        assert.ok(!card[1].includes('<a '), `${path}: 作品卡片沒有巢狀連結`)
        assert.ok(!card[1].includes('VIEW MORE'), `${path}: 不加入重複的卡片按鈕`)
      }
    }
    if (expectedName.startsWith('work-')) {
      assert.equal(router.currentRoute.value.meta.projectSlug, project.slug)
      assert.ok(html.includes('id="works-title"'), '直接進入作品網址以 Works 為背景')
      assert.ok(!html.includes('返回主要作品'))
    }
    if (expectedName === 'not-found') {
      assert.deepEqual(bodyCopyText(html), ['這個網址沒有對應的頁面，你可以回到首頁繼續瀏覽作品。'])
      assert.ok(html.includes('href="/"'))
      assert.ok(html.includes('返回首頁'))
    }
    console.log(`PASS ${path}`)
  }
  console.log(`已通過 ${cases.length} 個路由與 HTML 渲染檢查。`)
} finally {
  await server.close()
}
