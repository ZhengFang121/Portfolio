<script setup lang="ts">
import { RouterLink } from 'vue-router'
import BaseCard from './BaseCard.vue'
import type { PortfolioProject } from '../data/projects'

defineProps<{ project: PortfolioProject }>()
</script>

<template>
  <RouterLink v-slot="{ href, navigate }" :to="`/works/${project.slug}`" custom>
    <!-- 整張卡片只有一個連結，支援鍵盤、另開分頁及原生連結操作。 -->
    <BaseCard
      as="a"
      :href="href"
      class="work-card"
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
      <p class="work-card-summary">{{ project.summary ?? '作品簡介待提供。' }}</p>
      <div v-if="project.categories.length" class="work-card-categories">
        <span v-for="category in project.categories" :key="category" class="work-card-category">
          {{ category }}
        </span>
      </div>
    </BaseCard>
  </RouterLink>
</template>

<style scoped>
/* 提高局部選擇器優先序，覆寫 BaseCard 而不改動其他共用卡片。 */
.work-card.base-card {
  --card-focus-color: var(--palette-blue);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  border: 0;
  background: color-mix(in srgb, var(--color-surface) 100%, transparent);
  box-shadow: inset 0 0 0 0 var(--card-focus-color);
  text-align: center;
  text-decoration: none;
  transition:
    background-color 220ms ease-out,
    box-shadow 220ms ease-out,
    transform 220ms ease-out;
}

.work-card-cover {
  flex-shrink: 0;
  inline-size: 100%;
  min-inline-size: 0;
  aspect-ratio: 4 / 3;
  block-size: auto;
  object-fit: cover;
  border-radius: var(--radius-control);
}

.work-card-summary {
  color: var(--palette-blue);
}

.work-card-categories {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-2);
  inline-size: 100%;
  margin-block-start: auto;
}

.work-card-category {
  flex-shrink: 0;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  background: var(--palette-yellow);
  color: var(--palette-red);
  font-size: var(--font-size-sm);
  white-space: nowrap;
}

@media (hover: hover) {
  .work-card:hover {
    box-shadow: inset 0 0 0 6px var(--card-focus-color);
    transform: scale(1.04);
  }
}

.work-card:focus-visible {
  box-shadow: inset 0 0 0 6px var(--card-focus-color);
  transform: scale(1.04);
  outline: 6px solid var(--card-focus-color);
  outline-offset: 4px;
}

.work-card:active {
  box-shadow: inset 0 0 0 6px var(--card-focus-color);
  transform: none;
}

@media (prefers-reduced-motion: reduce) {
  .work-card.base-card {
    transition: none;
  }

  .work-card:is(:hover, :focus-visible, :active) {
    transform: none;
  }
}
</style>
