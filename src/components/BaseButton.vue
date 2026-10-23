<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import { ArrowRight } from '@lucide/vue'

const props = withDefaults(
  defineProps<{
    label?: string
    variant?: 'cream' | 'red'
    to?: RouteLocationRaw
    href?: string
    type?: 'button' | 'submit' | 'reset'
  }>(),
  { label: 'VIEW MORE', variant: 'cream', to: undefined, href: undefined, type: 'button' },
)

// 同時設定時以 to 優先；只傳入目前元素需要的屬性，避免混用連結與按鈕屬性。
const elementProps = computed(() => {
  if (props.to) return { to: props.to }
  if (props.href) return { href: props.href, target: '_blank', rel: 'noopener noreferrer' }
  return { type: props.type }
})
</script>

<template>
  <!-- 三種元素共用原有膠囊樣式與鍵盤焦點。 -->
  <component
    :is="to ? RouterLink : href ? 'a' : 'button'"
    v-bind="elementProps"
    class="view-more-button"
    :class="`view-more-button--${variant}`"
  >
    <span class="view-more-button-label">{{ label }}</span>
    <ArrowRight class="view-more-button-icon" :size="18" aria-hidden="true" />
  </component>
</template>

<style scoped>
.view-more-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-block-size: 3.125rem;
  max-inline-size: 100%;
  padding: var(--space-2) var(--space-8);
  border: 0;
  border-radius: var(--radius-full);
  background: var(--button-background);
  color: var(--button-color);
  font-family: var(--font-family-body);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-regular);
  line-height: 1.5;
  text-align: center;
  text-decoration: none;
  cursor: pointer;
}

.view-more-button-icon {
  display: none;
  pointer-events: none;
}

/* 箭頭只回應滑鼠 Hover；一般點擊留下的 focus 不改變按鈕內容。
   文字移出排版，讓膠囊隨箭頭變窄，並保留感應範圍與無障礙名稱。 */
@media (hover: hover) and (pointer: fine) {
  .view-more-button:hover .view-more-button-label {
    position: absolute;
    inset-block-start: 50%;
    inset-inline-start: 50%;
    display: inline-flex;
    align-items: center;
    inline-size: max-content;
    min-block-size: 100%;
    padding: inherit;
    transform: translate(-50%, -50%);
    opacity: 0;
  }

  .view-more-button:hover .view-more-button-icon {
    display: block;
  }
}

.view-more-button--cream {
  --button-background: var(--palette-yellow);
  --button-color: var(--palette-red);
}

.view-more-button--red {
  --button-background: var(--palette-red);
  --button-color: var(--palette-yellow);
}

.view-more-button:active {
  outline: 2px solid var(--button-background);
  outline-offset: 2px;
  text-decoration: underline;
}

.view-more-button:focus-visible {
  outline: 2px solid var(--palette-blue);
  outline-offset: 4px;
  text-decoration: underline;
}
</style>
