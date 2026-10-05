// 以 Vue 的記憶體 Router 與 HTML 渲染確認路由；不代表瀏覽器視覺 QA。
import assert from 'node:assert/strict'
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
  const { portfolioPreset } = await server.ssrLoadModule('/src/theme/primevue.ts')
  assert.equal(projects.length, 6)
  assert.equal(new Set(projects.map((project) => project.slug)).size, 6)

  const cases = [
    ['/', 'home', "ZhengFang's Portfolio"],
    ['/about', 'about', '關於 Fang'],
    ['/works', 'works', '主要作品'],
    ['/graphic-works', 'graphic-works', '其他平面作品'],
    ...projects.map((project) => [`/works/${project.slug}`, `work-${project.slug}`, project.title]),
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
    if (expectedName === 'home' || expectedName === 'works') {
      for (const project of projects) {
        assert.ok(html.includes(`href="/works/${project.slug}"`))
      }
    }
    if (expectedName.startsWith('work-')) {
      assert.ok(html.includes('作品背景'))
      assert.ok(html.includes('作品主視覺待提供'))
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
