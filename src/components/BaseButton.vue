<script setup lang="ts">
import { RouterLink, type RouteLocationRaw } from 'vue-router'

withDefaults(
  defineProps<{
    label?: string
    variant?: 'cream' | 'red'
    to?: RouteLocationRaw
    type?: 'button' | 'submit' | 'reset'
  }>(),
  { label: 'VIEW MORE', variant: 'cream', to: undefined, type: 'button' },
)
</script>

<template>
  <!-- 沿用共用膠囊樣式；有 to 時導覽，否則提供原生按鈕操作。 -->
  <component
    :is="to ? RouterLink : 'button'"
    :to="to"
    :type="to ? undefined : type"
    class="view-more-button"
    :class="`view-more-button--${variant}`"
  >
    {{ label }}
  </component>
</template>

<style scoped>
.view-more-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-block-size: 3.125rem;
  max-inline-size: 100%;
  padding: var(--space-2) var(--space-12);
  border: 0;
  border-radius: var(--radius-full);
  background: var(--button-background);
  color: var(--button-color);
  font-family: var(--font-family-body);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-regular);
  line-height: 1.5;
  text-align: center;
  text-decoration: none;
  cursor: pointer;
}

.view-more-button--cream {
  --button-background: var(--palette-yellow);
  --button-color: var(--palette-red);
}

.view-more-button--red {
  --button-background: var(--palette-red);
  --button-color: var(--palette-yellow);
}

@media (hover: hover) {
  .view-more-button:hover {
    text-decoration: underline;
  }
}

.view-more-button:active {
  outline: 2px solid var(--button-background);
  outline-offset: 2px;
  text-decoration: underline;
}

.view-more-button:focus-visible {
  outline: 2px solid var(--button-background);
  outline-offset: 4px;
  text-decoration: underline;
}
</style>
