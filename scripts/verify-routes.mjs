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
  const { portfolioPreset } = await server.ssrLoadModule('/src/theme/primevue.ts')
  assert.equal(projects.length, 5)
  assert.equal(new Set(projects.map((project) => project.slug)).size, 5)
  assert.deepEqual(
    projects.map((project) => project.title),
    ['跑者菲迪 Pheidi the Runner', 'PAPAGO', 'APOLLO', 'R4D', '初次見麵'],
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
    for (const section of project.sections) {
      const sectionId = `${project.slug}-modal-${section.id}`
      assert.ok(modalContent.includes(`aria-labelledby="${sectionId}"`))
      assert.match(modalContent, new RegExp(`<h3[^>]*id="${sectionId}"`))
    }
  }

  const cases = [
    ['/', 'home', '平面設計師 與 前端網頁設計學習者'],
    ['/about', 'about', '關於 Fang'],
    ['/works', 'works', '主要作品'],
    ['/graphic-works', 'graphic-works', '其他平面作品'],
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
    assert.ok(html.includes('site-content shell-reveal'), `${path}: 共用文件內容區`)
    assert.ok(html.includes('class="intro-viewport"'), `${path}: 獨立固定視窗層`)
    assert.ok(!html.includes('content-scroll'), `${path}: 移除內層捲動容器`)
    assert.ok(html.indexOf('<footer') > html.indexOf('</main>'), `${path}: Footer 接續主內容`)
    const project = projects.find((item) => path === `/works/${item.slug}`)
    const expectedSections = project
      ? 1 + project.sections.length
      : expectedName === 'home' || expectedName === 'graphic-works'
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
          : path.startsWith('/works') || path === '/graphic-works'
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
        assert.ok(html.includes('href="/graphic-works"'), `${path}: 保留其他平面作品入口`)
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
          ...card[1].matchAll(/<span\b[^>]*class="work-card-category"[^>]*>(.*?)<\/span>/gs),
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
      assert.ok(html.includes('作品背景'))
      assert.ok(html.includes(`src="${project.cover.src}"`))
      assert.ok(html.includes(project.categories.join('、')))
      assert.ok(html.includes('此區內容與圖片待提供。'))
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
