<script setup lang="ts">
defineProps<{
  categories: readonly string[]
  singleLine?: boolean
  variant?: 'category' | 'award'
}>()
</script>

<template>
  <div
    class="project-categories"
    :class="{
      'project-categories--single-line': singleLine,
      'project-categories--award': variant === 'award',
    }"
    :tabindex="singleLine ? 0 : undefined"
    :role="singleLine ? 'region' : variant === 'award' ? 'group' : undefined"
    :aria-label="
      variant === 'award' ? '作品獲獎資訊' : singleLine ? '作品類型，可水平捲動' : '作品類型'
    "
  >
    <ul class="project-categories-list">
      <li v-for="category in categories" :key="category" class="project-category">
        {{ category }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.project-categories {
  inline-size: 100%;
  min-inline-size: 0;
  max-inline-size: 100%;
}

.project-categories-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.project-category {
  flex-shrink: 0;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  background: var(--palette-yellow);
  color: var(--palette-red);
  font-size: var(--font-size-xs);
  white-space: nowrap;
}

.project-categories--award .project-category {
  max-inline-size: 100%;
  background: var(--palette-red);
  color: var(--palette-yellow);
  font-size: var(--font-size-sm);
  white-space: normal;
  text-align: center;
  overflow-wrap: anywhere;
}

/* 內容比容器寬時從第一顆開始捲動；放得下時整組置中。 */
.project-categories--single-line {
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  scrollbar-color: var(--palette-blue) var(--palette-white);
}

.project-categories--single-line .project-categories-list {
  flex-wrap: nowrap;
  inline-size: max-content;
  min-inline-size: 100%;
}

.project-categories--single-line:focus-visible {
  outline: 2px solid var(--palette-blue);
  outline-offset: -2px;
}
</style>
