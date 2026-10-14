<script setup lang="ts">
import WorkCard from './WorkCard.vue'
import { projects as allProjects, type PortfolioProject } from '../data/projects'

withDefaults(
  defineProps<{ projects?: readonly PortfolioProject[]; align?: 'start' | 'center' }>(),
  {
    projects: () => allProjects,
    align: 'start',
  },
)
</script>
<template>
  <div class="project-grid">
    <WorkCard v-for="project in projects" :key="project.slug" :project="project" :align="align" />
  </div>
</template>
