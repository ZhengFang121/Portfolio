import type { RouteRecordRaw } from 'vue-router'
import { projects } from '../data/projects'
import WorksPage from '../views/WorksPage.vue'

declare module 'vue-router' {
  interface RouteMeta {
    projectSlug?: string
  }
}
export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomePage.vue'),
    meta: { title: 'Home' },
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('../views/AboutPage.vue'),
    meta: { title: 'Profile' },
  },
  {
    path: '/works',
    name: 'works',
    component: WorksPage,
    meta: { title: 'Works' },
  },
  ...projects.map((project): RouteRecordRaw => ({
    path: `/works/${project.routeSlug}`,
    name: `work-${project.slug}`,
    component: WorksPage,
    meta: { title: project.title, projectSlug: project.slug },
  })),
  ...projects.map((project): RouteRecordRaw => ({
    path: `/works/${project.slug}`,
    redirect: (to) => ({ name: `work-${project.slug}`, query: to.query, hash: to.hash }),
  })),
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFoundPage.vue'),
    meta: { title: '找不到頁面' },
  },
]
