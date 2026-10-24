import { createRouter, createWebHistory } from 'vue-router'
import { routes } from './routes'
export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from) {
    // Modal 擁有背景鎖定與位置還原，避免 Router 在開關時把文件捲到頂端。
    if (
      to.meta.projectSlug ||
      (from.meta.projectSlug && (to.name === 'home' || to.name === 'works'))
    )
      return false
    return { top: 0, left: 0, behavior: 'instant' }
  },
})
router.afterEach((to) => {
  document.title = `${String(to.meta.title ?? '首頁')} | ZhengFang's Portfolio`
})
