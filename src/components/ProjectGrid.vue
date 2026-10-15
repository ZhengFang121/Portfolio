<script setup lang="ts">
import { ref, shallowRef, useId } from 'vue'
import WorkCard from './WorkCard.vue'
import ProjectModal from './ProjectModal.vue'
import { projects as allProjects, type PortfolioProject } from '../data/projects'

withDefaults(defineProps<{ projects?: readonly PortfolioProject[] }>(), {
  projects: () => allProjects,
})

const dialogId = `project-modal-${useId()}`
const selectedProject = shallowRef<PortfolioProject | null>(null)
const trigger = shallowRef<HTMLElement | null>(null)
const visible = ref(false)

function openProject(project: PortfolioProject, event: MouseEvent) {
  if (!(event.currentTarget instanceof HTMLElement)) return
  trigger.value = event.currentTarget
  selectedProject.value = project
  visible.value = true
}
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
  <ProjectModal
    v-if="selectedProject"
    :id="dialogId"
    v-model:visible="visible"
    :project="selectedProject"
    :trigger="trigger"
    @after-hide="selectedProject = null"
  />
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
