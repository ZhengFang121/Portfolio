<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'
import { useIntro } from './composables/useIntro'

const route = useRoute()
const shell = ref<HTMLElement | null>(null)
const viewport = ref<HTMLElement | null>(null)
const brand = ref<HTMLElement | null>(null)
const brandAnchor = ref<HTMLElement | null>(null)
const mainContent = ref<HTMLElement | null>(null)
const {
  stage,
  contentReady,
  reducedMotion,
  motionReady,
  animatedReady,
  onBrandLoad,
  onBrandError,
  showContent,
} = useIntro(shell, viewport, brand, brandAnchor, route.path === '/')
const imageBase = `${import.meta.env.BASE_URL}images/intro/`

async function skipToContent() {
  showContent()
  await nextTick()
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  mainContent.value?.focus({ preventScroll: true })
}

watch(contentReady, async (ready, wasReady) => {
  if (ready && !wasReady) {
    await nextTick()
    mainContent.value?.focus({ preventScroll: true })
  }
})

watch(
  () => route.fullPath,
  async () => {
    showContent()
    await nextTick()
    mainContent.value?.focus({ preventScroll: true })
  },
)
</script>

<template>
  <div ref="shell" class="app-shell" :data-stage="stage" :data-content-ready="contentReady">
    <a class="skip-link" href="#main-content" @click.prevent="skipToContent">跳至主要內容</a>
    <p v-if="!contentReady" class="sr-only" role="status">
      {{
        stage === 'intro'
          ? '開場將自動播放，也可點擊、輕觸、向下捲動、向上滑動或按向下鍵繼續。'
          : '稍後將自動進入網站，也可點擊、輕觸、向下捲動、向上滑動或按向下鍵繼續。'
      }}
    </p>

    <!-- 定位點與圖片分開：桌機動畫只改變圖片的 x，不重新建立 APNG。 -->
    <div ref="viewport" class="intro-viewport">
      <div ref="brandAnchor" class="brand-anchor" aria-hidden="true"></div>
      <div ref="brand" class="intro-brand">
        <!-- 圖片載入成功後交叉淡入淡出，避免直接換圖或等待時出現空白。 -->
        <Transition name="intro-illustration" :css="!reducedMotion">
          <img
            v-show="!animatedReady || reducedMotion"
            :src="`${imageBase}${reducedMotion ? 'hello-2-still.png' : 'hello-1.png'}`"
            :aria-hidden="animatedReady && !reducedMotion"
            alt="你好，我是 Fang，這是我的作品集"
            width="1800"
            height="2500"
            draggable="false"
          />
        </Transition>
        <Transition name="intro-illustration" :css="!reducedMotion">
          <img
            v-if="motionReady && stage !== 'intro' && !reducedMotion"
            v-show="animatedReady"
            :src="`${imageBase}hello-2.png`"
            :aria-hidden="!animatedReady"
            alt="你好，我是 Fang，這是我的作品集"
            width="346"
            height="480"
            draggable="false"
            @load="onBrandLoad"
            @error="onBrandError"
          />
        </Transition>
      </div>
    </div>

    <div class="shell-header shell-reveal" :inert="!contentReady">
      <AppHeader />
    </div>
    <div class="site-content shell-reveal" :inert="!contentReady">
      <main id="main-content" ref="mainContent" tabindex="-1">
        <RouterView />
      </main>
      <AppFooter />
    </div>
  </div>
</template>

<style scoped>
.intro-illustration-enter-active,
.intro-illustration-leave-active {
  transition: opacity 450ms ease-in-out;
}

.intro-illustration-enter-from,
.intro-illustration-leave-to {
  opacity: 0;
}
</style>
