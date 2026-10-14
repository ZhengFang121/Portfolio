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
  min-block-size: var(--view-more-min-height);
  max-inline-size: 100%;
  padding: var(--view-more-padding-block) var(--view-more-padding-inline);
  border: 0;
  border-radius: var(--view-more-radius);
  background: var(--view-more-background);
  color: var(--view-more-color);
  font-family: var(--font-body);
  font-size: var(--view-more-font-size);
  font-weight: var(--view-more-font-weight);
  line-height: var(--view-more-line-height);
  text-align: center;
  text-decoration: none;
  cursor: pointer;
}

.view-more-button--cream {
  --view-more-background: var(--view-more-cream-background);
  --view-more-color: var(--view-more-cream-color);
}

.view-more-button--red {
  --view-more-background: var(--view-more-red-background);
  --view-more-color: var(--view-more-red-color);
}

@media (hover: hover) {
  .view-more-button:hover {
    text-decoration: underline;
  }
}

.view-more-button:active {
  outline: 2px solid var(--view-more-background);
  outline-offset: 2px;
  text-decoration: underline;
}

.view-more-button:focus-visible {
  outline: 2px solid var(--view-more-background);
  outline-offset: 4px;
  text-decoration: underline;
}
</style>
