import type { RouteRecordRaw } from 'vue-router'
import { projects } from '../data/projects'
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
    component: () => import('../views/WorksPage.vue'),
    meta: { title: 'Works' },
  },
  ...projects.map((project): RouteRecordRaw => ({
    path: `/works/${project.slug}`,
    name: `work-${project.slug}`,
    component: () => import('../views/ProjectPage.vue'),
    props: { slug: project.slug },
    meta: { title: project.title },
  })),
  {
    path: '/graphic-works',
    name: 'graphic-works',
    component: () => import('../views/GraphicWorksPage.vue'),
    meta: { title: '其他平面作品' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFoundPage.vue'),
    meta: { title: '找不到頁面' },
  },
]
