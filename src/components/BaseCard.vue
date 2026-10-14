<script setup lang="ts">
withDefaults(
  defineProps<{
    as?: 'div' | 'article' | 'section' | 'a'
    variant?: 'surface' | 'subtle'
  }>(),
  { as: 'div', variant: 'surface' },
)
</script>

<template>
  <component :is="as" class="base-card" :class="`base-card--${variant}`">
    <slot />
  </component>
</template>

<style scoped>
.base-card {
  /* 卡片與 WorkCard 共用的局部契約；不可引用下方覆寫的同名語意，避免循環。 */
  --card-color: var(--palette-black);
  --card-border-color: var(--palette-black);
  --card-action-color: var(--color-action);
  --card-action-hover-color: var(--color-action-hover);
  --card-focus-color: var(--palette-red);
  --color-text: var(--card-color);
  --color-text-muted: var(--card-color);
  --color-border: var(--card-border-color);
  --color-link: var(--card-action-color);
  --color-link-hover: var(--card-action-hover-color);
  --color-focus: var(--card-focus-color);
  box-sizing: border-box;
  min-inline-size: 0;
  padding: var(--space-6);
  border: 1px solid var(--card-border-color);
  border-radius: var(--radius-panel);
  background: var(--card-background);
  box-shadow: none;
  color: var(--card-color);
}

.base-card--surface {
  --card-background: var(--color-surface);
}

.base-card--subtle {
  --card-background: var(--color-surface-subtle);
}
</style>
