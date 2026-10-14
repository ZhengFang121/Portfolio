<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ArrowUpRight } from '@lucide/vue'
import BaseCard from './BaseCard.vue'
import type { PortfolioProject } from '../data/projects'

withDefaults(defineProps<{ project: PortfolioProject; align?: 'start' | 'center' }>(), {
  align: 'start',
})
</script>

<template>
  <RouterLink v-slot="{ href, navigate }" :to="`/works/${project.slug}`" custom>
    <!-- 整張卡片只有一個連結，支援鍵盤、另開分頁及原生連結操作。 -->
    <BaseCard
      as="a"
      :href="href"
      class="work-card"
      :class="{ 'work-card--center': align === 'center' }"
      :aria-label="`查看作品介紹：${project.title}`"
      @click="navigate"
    >
      <img
        v-if="project.cover"
        class="work-card-cover"
        :src="project.cover.src"
        :alt="project.cover.alt"
        :width="project.cover.width"
        :height="project.cover.height"
        loading="lazy"
        decoding="async"
      />
      <div v-else class="work-card-cover placeholder-media">作品封面待提供</div>
      <h3>{{ project.title }}</h3>
      <p v-if="project.category" class="work-card-category">{{ project.category }}</p>
      <p>{{ project.summary ?? '作品簡介待提供。' }}</p>
      <span class="work-card-action">
        查看作品介紹 <ArrowUpRight :size="18" aria-hidden="true" />
      </span>
    </BaseCard>
  </RouterLink>
</template>

<style scoped>
.work-card {
  display: grid;
  align-content: start;
  gap: var(--space-4);
  text-decoration: none;
}

.work-card--center {
  justify-items: center;
  text-align: center;
}

.work-card-cover {
  inline-size: 100%;
  min-inline-size: 0;
  aspect-ratio: var(--work-card-cover-ratio);
  block-size: auto;
  object-fit: cover;
  border-radius: var(--radius-control);
}

.work-card-category {
  font-size: var(--font-size-small);
}

.work-card-action {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-block-size: 44px;
  color: var(--card-action-color);
  text-underline-offset: 0.25em;
}

@media (hover: hover) {
  .work-card:hover {
    border-color: var(--card-focus-color);
  }
  .work-card:hover .work-card-action {
    color: var(--card-action-hover-color);
    text-decoration: underline;
  }
}

.work-card:focus-visible {
  outline: 2px solid var(--card-focus-color);
  outline-offset: 4px;
}

.work-card:focus-visible .work-card-action,
.work-card:active .work-card-action {
  color: var(--card-action-hover-color);
  text-decoration: underline;
}
</style>
