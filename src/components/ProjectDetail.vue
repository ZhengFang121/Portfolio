<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ArrowLeft } from '@lucide/vue'
import ProjectCategories from './ProjectCategories.vue'
import type { PortfolioProject } from '../data/projects'
const props = withDefaults(
  defineProps<{ project: PortfolioProject; mode?: 'page' | 'modal'; titleId?: string }>(),
  {
    mode: 'page',
    titleId: undefined,
  },
)

function sectionId(id: string) {
  return props.mode === 'page' ? id : `${props.project.slug}-modal-${id}`
}
</script>
<template>
  <article class="page-sections" :class="{ 'project-detail--modal': mode === 'modal' }">
    <header class="stack" :class="{ 'content-section': mode === 'page' }">
      <RouterLink v-if="mode === 'page'" class="text-link" to="/works"
        ><ArrowLeft :size="18" aria-hidden="true" />返回主要作品</RouterLink
      >
      <p class="project-design-year"># {{ project.designYear }}</p>
      <component
        :is="mode === 'modal' ? 'h2' : 'h1'"
        :id="titleId"
        :tabindex="mode === 'modal' ? -1 : undefined"
        class="project-detail-title"
        >{{ project.title }}</component
      >
      <p class="project-detail-summary intro muted">
        {{ project.summary ?? '作品簡介尚未提供，將於內容確認後補上。' }}
      </p>
      <ProjectCategories
        v-if="project.categories.length"
        :categories="project.categories"
        :single-line="mode === 'modal'"
      />
      <p v-else class="muted">作品類型待提供</p>
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
      class="stack"
      :class="{ 'content-section': mode === 'page' }"
      :aria-labelledby="sectionId(section.id)"
    >
      <component :is="mode === 'modal' ? 'h3' : 'h2'" :id="sectionId(section.id)">{{
        section.title
      }}</component>
      <p v-if="section.content" class="intro">{{ section.content }}</p>
      <div v-else class="placeholder-panel"><p class="muted">此區內容與圖片待提供。</p></div>
    </section>
  </article>
</template>

<style scoped>
/* 保留 components layer，維持工具類別的覆寫優先順序。 */
@layer components {
  .project-detail--modal {
    --color-text: var(--palette-black);
    --color-text-muted: var(--palette-black);
    --color-border: var(--palette-black);
    --color-focus: var(--palette-black);
    /* 原水平留白最大為 space-12，增加至下一級 space-16。 */
    padding: var(--content-section-padding-block) var(--space-16);
    color: var(--palette-black);
    text-align: center;
  }
  .project-detail--modal .stack {
    min-inline-size: 0;
    justify-items: center;
  }
  .project-detail--modal .stack > * {
    min-inline-size: 0;
    max-inline-size: 100%;
  }
  .project-design-year {
    color: var(--palette-blue);
    font-size: var(--font-size-sm);
    text-align: center;
  }
  .project-detail--modal .project-detail-summary {
    color: var(--palette-blue);
  }
  .project-detail--modal .project-detail-title {
    color: var(--palette-black);
    font-size: var(--font-size-2xl);
  }
  .project-detail--modal h3 {
    font-size: var(--font-size-xl);
  }
  .project-detail--modal .placeholder-panel {
    width: 100%;
    background: var(--palette-white);
  }
  .project-detail--modal :is(img, video, iframe, audio) {
    display: block;
    max-inline-size: 100%;
    margin-inline: auto;
  }
  .project-detail--modal :is(img, video) {
    height: auto;
    object-fit: contain;
  }
  .project-cover {
    width: 100%;
    height: auto;
    border-radius: var(--radius-panel);
  }
  @media (max-width: 899px) {
    .project-detail--modal {
      /* 窄版原水平留白最大為 space-8，增加至 space-12。 */
      padding-inline: var(--space-12);
    }
  }
  @media (max-width: 480px) {
    .project-detail--modal {
      /* 手機原為 space-4 左右，使用下一級並保留內容寬度。 */
      padding-inline: var(--space-6);
    }
  }
}
</style>
