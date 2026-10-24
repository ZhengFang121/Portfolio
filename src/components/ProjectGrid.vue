<script setup lang="ts">
import WorkCard from './WorkCard.vue'
import { useProjectModal } from '../composables/useProjectModal'
import { projects as allProjects, type PortfolioProject } from '../data/projects'

withDefaults(defineProps<{ projects?: readonly PortfolioProject[] }>(), {
  projects: () => allProjects,
})

const { dialogId, selectedProject, visible, openProject } = useProjectModal()
</script>
<template>
  <div class="project-grid">
    <WorkCard
      v-for="project in projects"
      :key="project.slug"
      :project="project"
      :expanded="visible && selectedProject?.slug === project.slug"
      :dialog-id="dialogId"
      @open="openProject(project, $event)"
    />
  </div>
</template>

<style>
/* 只管理自身 class；避免 scoped id 穿過 WorkCard 的 custom RouterLink 根節點。
   保留 components layer，維持工具類別的覆寫優先順序。 */
@layer components {
  .project-grid {
    display: grid;
    /* 卡片至少佔可用寬度的一半，最多兩欄；不足原本最小寬度時維持單欄。 */
    grid-template-columns: repeat(
      auto-fit,
      minmax(min(100%, max(19rem, calc((100% - var(--space-6)) / 2))), 1fr)
    );
    gap: var(--space-6);
  }
}
</style>
