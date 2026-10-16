<script setup lang="ts">
import { nextTick, onBeforeUnmount, useTemplateRef, watch } from 'vue'
import Dialog from 'primevue/dialog'
import { X } from '@lucide/vue'
import ProjectDetail from './ProjectDetail.vue'
import type { PortfolioProject } from '../data/projects'

const props = defineProps<{
  id: string
  project: PortfolioProject
  trigger: HTMLElement | null
}>()
const visible = defineModel<boolean>('visible', { required: true })
const emit = defineEmits<{ 'after-hide': [] }>()
const detail = useTemplateRef<InstanceType<typeof ProjectDetail>>('detail')

// Escape、遮罩與關閉鈕都會更新 visible；同步暫停，避免隱藏期間繼續發聲。
watch(
  visible,
  (isVisible) => {
    if (!isVisible) detail.value?.pauseVideos()
  },
  { flush: 'sync' },
)

let background: { element: HTMLElement; inert: boolean }[] = []
let scrollPosition: { x: number; y: number } | null = null
let previousOverflow = ''
let previousOverflowPriority = ''

async function onShow() {
  const root = document.documentElement
  scrollPosition = { x: window.scrollX, y: window.scrollY }
  previousOverflow = root.style.getPropertyValue('overflow')
  previousOverflowPriority = root.style.getPropertyPriority('overflow')
  // PrimeVue 鎖定 body；同時鎖定文件捲動根節點，保留既有 scrollbar-gutter。
  root.style.setProperty('overflow', 'hidden')
  await nextTick()
  if (!visible.value) return

  const dialog = document.getElementById(props.id)
  const mask = dialog?.parentElement
  if (mask?.parentElement) {
    // Dialog 直接掛在 app-shell，讓背景不能被點擊或取得鍵盤焦點。
    background = [...mask.parentElement.children]
      .filter(
        (element): element is HTMLElement => element instanceof HTMLElement && element !== mask,
      )
      .map((element) => ({ element, inert: element.inert }))
    background.forEach(({ element }) => {
      element.inert = true
    })
  }
  document.getElementById(`${props.id}-title`)?.focus({ preventScroll: true })
}

function restoreBackground() {
  background.forEach(({ element, inert }) => {
    element.inert = inert
  })
  background = []
  if (!scrollPosition) return
  const root = document.documentElement
  if (previousOverflow)
    root.style.setProperty('overflow', previousOverflow, previousOverflowPriority)
  else root.style.removeProperty('overflow')
  window.scrollTo({ left: scrollPosition.x, top: scrollPosition.y, behavior: 'instant' })
  scrollPosition = null
}

function onAfterHide() {
  if (props.trigger?.isConnected) props.trigger.focus({ preventScroll: true })
  emit('after-hide')
}

onBeforeUnmount(restoreBackground)
</script>

<template>
  <!-- 掛在 app-shell，繼承 899px 以下的定位覆寫，並避開作品卡片的 transform。 -->
  <Dialog
    :id="id"
    v-model:visible="visible"
    append-to=".app-shell"
    modal
    dismissable-mask
    :closable="false"
    :draggable="false"
    :aria-labelledby="`${id}-title`"
    class="project-modal"
    :pt="{ mask: { class: 'project-modal-mask' }, transition: { css: false } }"
    @show="onShow"
    @hide="restoreBackground"
    @after-hide="onAfterHide"
  >
    <template #container="{ closeCallback }">
      <div class="project-modal-toolbar">
        <button
          class="project-modal-close"
          type="button"
          aria-label="關閉作品介紹"
          @click="closeCallback"
        >
          <X :size="28" :stroke-width="2" aria-hidden="true" />
        </button>
      </div>
      <div class="project-modal-panel" tabindex="0" aria-label="作品介紹內容，可捲動">
        <ProjectDetail ref="detail" :project="project" mode="modal" :title-id="`${id}-title`" />
      </div>
    </template>
  </Dialog>
</template>

<style>
/* PrimeVue 的 body 捲動輔助樣式不在 layer 中，這一條也需在 layer 外覆寫。
   html 已用 scrollbar-gutter 保留捲軸空間，避免重複 body 內距使內容縮窄。 */
body.p-overflow-hidden:has(.project-modal-mask) {
  padding-right: 0;
}

/* Dialog 是 Teleport 內容，樣式僅限作品浮層，不改其他 PrimeVue Dialog。 */
@layer components {
  .project-modal-mask {
    /* 本次需求指定的黑色半透明遮罩；透明度僅套在遮罩背景。 */
    background: color-mix(in srgb, var(--palette-black) 55%, transparent);
    /* 停用內建遮罩動畫，避免 preset 的不透明黑底覆蓋此背景。 */
    animation: none;
  }

  .project-modal {
    /* 上下共用同一距離；任一側有安全區時同步增加，保持對稱。 */
    --project-modal-inset-block: max(
      var(--space-6),
      env(safe-area-inset-top),
      env(safe-area-inset-bottom)
    );
    position: fixed;
    inset: var(--project-modal-inset-block) var(--shell-edge) var(--project-modal-inset-block)
      var(--shell-content-left);
    display: flex;
    flex-direction: column;
    align-items: stretch;
    width: auto;
    height: calc(100dvh - var(--project-modal-inset-block) * 2);
    min-height: 0;
    max-height: none;
    margin: 0;
    overflow: hidden;
    border: 6px solid var(--palette-blue);
    border-radius: var(--content-section-radius);
    background: var(--palette-white);
    box-shadow: none;
    color: var(--palette-black);
    font-family: var(--font-family-body);
  }

  /* 關閉鈕與可捲動內容分列，避免捲動時消失或蓋住作品文字。 */
  .project-modal-toolbar {
    display: flex;
    flex: 0 0 auto;
    justify-content: flex-end;
    padding: var(--space-3) max(var(--space-4), env(safe-area-inset-right)) var(--space-3)
      var(--space-4);
  }

  .project-modal-panel {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-color: var(--palette-black) var(--palette-white);
    background: var(--palette-white);
    color: var(--palette-black);
  }

  .project-modal .project-modal-panel .project-detail--modal {
    /* 上方已有固定控制區，避免再次疊加原本整塊內容的上內距。 */
    padding-block-start: var(--space-4);
  }

  .project-modal-panel:focus-visible {
    outline: 2px solid var(--palette-black);
    outline-offset: -4px;
  }

  .project-modal-close {
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    width: 48px;
    height: 48px;
    padding: 0;
    border-radius: var(--radius-full);
    background: var(--palette-yellow);
    color: var(--palette-blue);
    cursor: pointer;
  }

  .project-modal-close:hover,
  .project-modal-close:active {
    outline: 2px solid var(--palette-blue);
    outline-offset: 2px;
  }

  .project-modal-close:focus-visible {
    outline: 3px solid var(--palette-blue);
    outline-offset: 4px;
  }
}
</style>
