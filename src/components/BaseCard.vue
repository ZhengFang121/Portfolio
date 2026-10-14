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
  --color-text: var(--card-color);
  --color-text-muted: var(--card-color);
  --color-border: var(--card-border-color);
  --color-link: var(--card-action-color);
  --color-link-hover: var(--card-action-hover-color);
  --color-focus: var(--card-focus-color);
  box-sizing: border-box;
  min-inline-size: 0;
  padding: var(--card-padding);
  border: var(--card-border-width) solid var(--card-border-color);
  border-radius: var(--card-radius);
  background: var(--card-background);
  box-shadow: var(--card-shadow);
  color: var(--card-color);
}

.base-card--surface {
  --card-background: var(--card-surface-background);
}

.base-card--subtle {
  --card-background: var(--card-subtle-background);
}
</style>
