<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ArrowUpRight } from '@lucide/vue'
import { projects } from '../data/projects'
</script>
<template>
  <div class="project-grid">
    <article v-for="project in projects" :key="project.slug" class="project-card">
      <div class="placeholder-media">作品封面待提供</div>
      <h3>{{ project.title }}</h3>
      <p class="muted">{{ project.summary ?? '作品簡介待提供。' }}</p>
      <RouterLink class="text-link" :to="`/works/${project.slug}`">
        查看作品介紹 <ArrowUpRight :size="18" aria-hidden="true" />
        <span class="sr-only">：{{ project.title }}</span>
      </RouterLink>
    </article>
  </div>
</template>
