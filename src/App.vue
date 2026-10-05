<script setup lang="ts">
import { nextTick, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'
const route = useRoute()
watch(
  () => route.path,
  async () => {
    await nextTick()
    document.querySelector<HTMLElement>('#main-content')?.focus({ preventScroll: true })
  },
)
</script>
<template>
  <div class="app-shell">
    <a class="skip-link" href="#main-content">跳至主要內容</a>
    <AppHeader />
    <main id="main-content" class="container page-content" tabindex="-1"><RouterView /></main>
    <AppFooter />
  </div>
</template>
