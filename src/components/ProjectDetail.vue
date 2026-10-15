<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ArrowLeft } from '@lucide/vue'
import type { PortfolioProject } from '../data/projects'
defineProps<{ project: PortfolioProject }>()
</script>
<template>
  <article class="page-sections">
    <header class="content-section stack">
      <RouterLink class="text-link" to="/works"
        ><ArrowLeft :size="18" aria-hidden="true" />返回主要作品</RouterLink
      >
      <p class="eyebrow">作品內容整理中</p>
      <h1>{{ project.title }}</h1>
      <p class="intro muted">{{ project.summary ?? '作品簡介尚未提供，將於內容確認後補上。' }}</p>
      <dl class="project-facts">
        <div>
          <dt>作品類型</dt>
          <dd>{{ project.categories.length ? project.categories.join('、') : '待提供' }}</dd>
        </div>
        <div>
          <dt>製作年份</dt>
          <dd>{{ project.year ?? '待提供' }}</dd>
        </div>
        <div>
          <dt>負責角色</dt>
          <dd>{{ project.role ?? '待提供' }}</dd>
        </div>
      </dl>
      <img
        v-if="project.cover"
        class="project-cover"
        :src="project.cover.src"
        :alt="project.cover.alt"
        :width="project.cover.width"
        :height="project.cover.height"
      />
      <div v-else class="placeholder-media">作品主視覺待提供</div>
    </header>
    <section
      v-for="section in project.sections"
      :key="section.id"
      class="content-section stack"
      :aria-labelledby="section.id"
    >
      <h2 :id="section.id">{{ section.title }}</h2>
      <p v-if="section.content" class="intro">{{ section.content }}</p>
      <div v-else class="placeholder-panel"><p class="muted">此區內容與圖片待提供。</p></div>
    </section>
  </article>
</template>

<style scoped>
/* 保留 components layer，維持工具類別的覆寫優先順序。 */
@layer components {
  .project-cover {
    width: 100%;
    height: auto;
    border-radius: var(--radius-panel);
  }
  .project-facts {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
    gap: var(--space-6);
  }
  .project-facts dt {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
  .project-facts dd {
    margin: var(--space-2) 0 0;
  }
}
</style>
