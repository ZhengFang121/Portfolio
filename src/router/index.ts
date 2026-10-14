import { createRouter, createWebHistory } from 'vue-router'
import { routes } from './routes'
export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    // 所有導覽（含上一頁／下一頁）都從新頁面頂部開始。
    return { top: 0, left: 0, behavior: 'instant' }
  },
})
router.afterEach((to) => {
  document.title = `${String(to.meta.title ?? '首頁')} | ZhengFang's Portfolio`
})
