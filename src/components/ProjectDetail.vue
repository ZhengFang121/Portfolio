<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ArrowLeft } from '@lucide/vue'
import type { PortfolioProject } from '../data/projects'
defineProps<{ project: PortfolioProject }>()
</script>
<template>
  <article class="section-stack">
    <header class="stack">
      <RouterLink class="text-link" to="/works"
        ><ArrowLeft :size="18" aria-hidden="true" />返回主要作品</RouterLink
      >
      <p class="eyebrow">作品內容整理中</p>
      <h1>{{ project.title }}</h1>
      <p class="intro muted">{{ project.summary ?? '作品簡介尚未提供，將於內容確認後補上。' }}</p>
      <dl class="project-facts">
        <div>
          <dt>作品類型</dt>
          <dd>{{ project.category ?? '待提供' }}</dd>
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
    </header>
    <img
      v-if="project.cover"
      class="project-cover"
      :src="project.cover.src"
      :alt="project.cover.alt"
      :width="project.cover.width"
      :height="project.cover.height"
    />
    <div v-else class="placeholder-media">作品主視覺待提供</div>
    <section
      v-for="section in project.sections"
      :key="section.id"
      class="stack"
      :aria-labelledby="section.id"
    >
      <h2 :id="section.id">{{ section.title }}</h2>
      <p v-if="section.content" class="intro">{{ section.content }}</p>
      <div v-else class="placeholder-panel"><p class="muted">此區內容與圖片待提供。</p></div>
    </section>
  </article>
</template>
