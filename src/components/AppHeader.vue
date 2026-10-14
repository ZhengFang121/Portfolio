<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()
const imageBase = `${import.meta.env.BASE_URL}images/navigation/`
const items = [
  { to: '/', image: 'home', label: 'Home，首頁', width: 1314 },
  { to: '/about', image: 'profile', label: 'Profile，關於 Fang', width: 1500 },
  { to: '/works', image: 'works', label: 'Works，作品', width: 1469 },
] as const

function isActive(path: string) {
  return path === '/works'
    ? route.path === '/works' || route.path.startsWith('/works/') || route.path === '/graphic-works'
    : route.path === path
}
</script>

<template>
  <header class="site-header">
    <nav class="site-nav" aria-label="主要導覽">
      <RouterLink
        v-for="item in items"
        :key="item.image"
        :to="item.to"
        class="nav-image-link"
        :class="{ 'is-active': isActive(item.to) }"
        :aria-label="item.label"
        :aria-current="isActive(item.to) ? 'page' : undefined"
        :style="{ '--nav-image-ratio': `${item.width} / 500`, '--nav-image-weight': item.width }"
      >
        <img
          class="nav-image-default"
          :src="`${imageBase}${item.image}-1.png`"
          alt=""
          :width="item.width"
          height="500"
          draggable="false"
        />
        <img
          class="nav-image-selected"
          :src="`${imageBase}${item.image}-2.png`"
          alt=""
          :width="item.width"
          height="500"
          draggable="false"
        />
      </RouterLink>
    </nav>
  </header>
</template>
