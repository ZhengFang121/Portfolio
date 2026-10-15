<script setup lang="ts">
import WorkCard from './WorkCard.vue'
import { projects as allProjects, type PortfolioProject } from '../data/projects'

withDefaults(defineProps<{ projects?: readonly PortfolioProject[] }>(), {
  projects: () => allProjects,
})
</script>
<template>
  <div class="project-grid">
    <WorkCard v-for="project in projects" :key="project.slug" :project="project" />
  </div>
</template>

<style>
/* 只管理自身 class；避免 scoped id 穿過 WorkCard 的 custom RouterLink 根節點。
   保留 components layer，維持工具類別的覆寫優先順序。 */
@layer components {
  .project-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 19rem), 1fr));
    gap: var(--space-6);
  }
}
</style>
