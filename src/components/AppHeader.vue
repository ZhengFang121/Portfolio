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

<style scoped>
/* 保留 components layer，維持工具類別的覆寫優先順序。 */
@layer components {
  .site-nav {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--shell-nav-gap);
  }
  .nav-image-link {
    position: relative;
    display: grid;
    place-items: center;
    height: var(--shell-nav-height);
    min-height: 44px;
    aspect-ratio: var(--nav-image-ratio);
    border-radius: var(--radius-control);
  }
  .nav-image-link img {
    grid-area: 1 / 1;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  .nav-image-selected {
    visibility: hidden;
  }
  .nav-image-link.is-active .nav-image-selected,
  .nav-image-link:focus-visible .nav-image-selected {
    visibility: visible;
  }
  .nav-image-link.is-active .nav-image-default,
  .nav-image-link:focus-visible .nav-image-default {
    visibility: hidden;
  }
  @media (hover: hover) {
    .nav-image-link:hover .nav-image-selected {
      visibility: visible;
    }
    .nav-image-link:hover .nav-image-default {
      visibility: hidden;
    }
  }

  @media (max-width: 899px) {
    .nav-image-link {
      min-width: 0;
      min-height: 44px;
      flex: var(--nav-image-weight) 1 0;
      height: max(44px, var(--shell-nav-height));
      aspect-ratio: auto;
    }
  }
}
</style>
