<script setup lang="ts">
import ProjectGrid from '../components/ProjectGrid.vue'
import { RouterLink } from 'vue-router'
</script>
<template>
  <div class="page-sections">
    <section class="content-section stack" aria-labelledby="works-title">
      <h1 id="works-title">主要作品</h1>
      <p class="muted">六個主要作品，名稱與內容待確認。</p>
      <h2 class="sr-only">作品列表</h2>
      <ProjectGrid />
      <RouterLink class="text-link" to="/graphic-works">查看其他平面作品</RouterLink>
    </section>
  </div>
</template>
