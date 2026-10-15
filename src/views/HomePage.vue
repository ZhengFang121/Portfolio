<script setup lang="ts">
import ProjectGrid from '../components/ProjectGrid.vue'
import BaseButton from '../components/BaseButton.vue'
import { projects } from '../data/projects'

// 依固定 slug 選取並排序，不讓 Works 列表順序影響首頁精選作品。
const featuredProjects = ['project-01', 'project-03']
  .map((slug) => projects.find((project) => project.slug === slug))
  .filter((project) => project !== undefined)
</script>
<template>
  <div class="page-sections">
    <section class="content-section home-section home-hero" aria-labelledby="home-title">
      <h1 id="home-title" class="home-heading">Fang</h1>
      <p class="home-intro">平面設計師 與 前端網頁設計學習者</p>
      <BaseButton to="/about" variant="cream" aria-label="VIEW MORE：關於 Fang" />
    </section>
    <section class="content-section home-section" aria-labelledby="selected-works">
      <h2 id="selected-works" class="home-heading">Works</h2>
      <ProjectGrid :projects="featuredProjects" />
      <BaseButton to="/works" variant="red" aria-label="VIEW MORE：全部主要作品" />
    </section>
  </div>
</template>

<style scoped>
.home-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-12);
  text-align: center;
}

.home-hero {
  min-block-size: clamp(22rem, 45.4dvh, 32rem);
  justify-content: center;
}

.home-heading {
  color: var(--palette-blue);
  font-size: clamp(2.5rem, 4.5vw, 4rem);
  font-weight: var(--font-weight-regular);
}

.home-intro {
  max-inline-size: var(--layout-text-width);
  color: var(--palette-blue);
  font-size: var(--font-size-lg);
}

.home-section :deep(.project-grid) {
  inline-size: 100%;
  min-inline-size: 0;
}
</style>
