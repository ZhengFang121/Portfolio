import { createRouter, createWebHistory } from 'vue-router'
import { routes } from './routes'
export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition ?? { top: 0, left: 0 }
  },
})
router.afterEach((to) => {
  document.title = `${String(to.meta.title ?? '首頁')} | ZhengFang's Portfolio`
})
