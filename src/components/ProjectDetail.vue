<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowLeft } from '@lucide/vue'
import ProjectCategories from './ProjectCategories.vue'
import type { PortfolioProject } from '../data/projects'
const props = withDefaults(
  defineProps<{ project: PortfolioProject; mode?: 'page' | 'modal'; titleId?: string }>(),
  {
    mode: 'page',
    titleId: undefined,
  },
)

const detail = useTemplateRef<HTMLElement>('detail')
let observer: IntersectionObserver | null = null
let motionPreference: MediaQueryList | null = null
let videos: HTMLVideoElement[] = []
const visibleVideos = new Set<HTMLVideoElement>()
let playbackEnabled = false

function loadVideo(video: HTMLVideoElement) {
  const source = video.querySelector('source[data-src]')
  if (!(source instanceof HTMLSourceElement) || source.getAttribute('src') === source.dataset.src)
    return
  source.src = source.dataset.src ?? ''
  video.load()
}

function canAutoPlay(video: HTMLVideoElement) {
  return (
    playbackEnabled && video.isConnected && !motionPreference?.matches && visibleVideos.has(video)
  )
}

async function playVideo(video: HTMLVideoElement) {
  if (!canAutoPlay(video) || !video.paused) return
  try {
    await video.play()
    // 載入期間可能已捲走或關閉視窗，避免延遲完成的 play() 再啟動影片。
    if (!canAutoPlay(video)) video.pause()
  } catch {
    // 自動播放被阻擋或捲動造成播放取消時，仍保留原生控制列供手動播放。
  }
}

function pauseVideos() {
  playbackEnabled = false
  observer?.disconnect()
  observer = null
  visibleVideos.clear()
  videos.forEach((video) => video.pause())
}

function setupVideos() {
  pauseVideos()
  videos = [...(detail.value?.querySelectorAll('video') ?? [])]
  playbackEnabled = true
  videos.forEach((video) => {
    // 同時設定屬性與 DOM property，讓 Safari 在第一次播放前就確定為靜音。
    video.defaultMuted = true
    video.muted = true
  })
  if (!videos.length) return
  if (!('IntersectionObserver' in window)) {
    // 舊瀏覽器只提供手動播放；preload="none" 仍避免一次下載全部影片。
    videos.forEach(loadVideo)
    return
  }
  observer = new IntersectionObserver(
    (entries) => {
      if (!playbackEnabled) return
      entries.forEach((entry) => {
        const video = entry.target as HTMLVideoElement
        if (!videos.includes(video)) return
        const isVisible = entry.isIntersecting && entry.intersectionRatio >= 0.01
        if (isVisible) {
          // 同一次停留不重複播放，讓使用者手動暫停後維持暫停。
          if (visibleVideos.has(video)) return
          visibleVideos.add(video)
          loadVideo(video)
          void playVideo(video)
        } else {
          visibleVideos.delete(video)
          video.pause()
        }
      })
    },
    { root: detail.value?.closest('.project-modal-panel') ?? null, threshold: 0.01 },
  )
  videos.forEach((video) => observer?.observe(video))
}

function onMotionChange() {
  if (motionPreference?.matches) videos.forEach((video) => video.pause())
  else visibleVideos.forEach((video) => void playVideo(video))
}

onMounted(() => {
  motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
  motionPreference.addEventListener('change', onMotionChange)
  setupVideos()
})
// 獨立作品頁切換作品時可能重用元件，需重新觀察新的影片。
watch(() => props.project, setupVideos, { flush: 'post' })

// 視窗既有關閉機制會呼叫此方法；同時停用 Observer，防止排隊中的回呼重播。
defineExpose({ pauseVideos })
onBeforeUnmount(() => {
  pauseVideos()
  motionPreference?.removeEventListener('change', onMotionChange)
  videos = []
})

function sectionId(id: string) {
  return props.mode === 'page' ? id : `${props.project.slug}-modal-${id}`
}

function headingTag(isChild = false) {
  if (props.mode === 'modal') return isChild ? 'h4' : 'h3'
  return isChild ? 'h3' : 'h2'
}
</script>
<template>
  <article
    ref="detail"
    class="page-sections"
    :class="{
      'project-detail--modal': mode === 'modal',
      'project-detail--chapters': project.sections.some((section) => section.items?.length),
    }"
  >
    <header class="stack" :class="{ 'content-section': mode === 'page' }">
      <RouterLink v-if="mode === 'page'" class="text-link" to="/works"
        ><ArrowLeft :size="18" aria-hidden="true" />返回主要作品</RouterLink
      >
      <p class="project-design-year"># {{ project.designYear }}</p>
      <component
        :is="mode === 'modal' ? 'h2' : 'h1'"
        :id="titleId"
        :tabindex="mode === 'modal' ? -1 : undefined"
        class="project-detail-title"
        >{{ project.title }}</component
      >
      <p class="project-detail-summary intro muted">
        {{ project.summary ?? '作品簡介尚未提供，將於內容確認後補上。' }}
      </p>
      <ProjectCategories
        v-if="project.categories.length"
        :categories="project.categories"
        :single-line="mode === 'modal'"
      />
      <p v-else class="muted">作品類型待提供</p>
      <img
        v-if="project.cover"
        class="project-cover"
        :src="project.cover.src"
        :alt="project.cover.alt"
        :width="project.cover.width"
        :height="project.cover.height"
      />
      <div v-else class="placeholder-media">作品主視覺待提供</div>
    </header>
    <section
      v-for="section in project.sections"
      :key="section.id"
      class="project-section stack"
      :class="{ 'content-section': mode === 'page', 'project-chapter': section.items?.length }"
      :aria-labelledby="sectionId(section.id)"
    >
      <header v-if="section.items?.length" class="project-chapter-heading">
        <p class="project-chapter-number">{{ section.label }}</p>
        <component :is="headingTag()" :id="sectionId(section.id)">{{ section.title }}</component>
        <p class="project-chapter-subtitle">{{ section.subtitle }}</p>
      </header>
      <div class="project-section-items">
        <div
          v-for="item in section.items ?? [section]"
          :key="item.id"
          class="project-section-item stack"
          :role="section.items?.length ? 'group' : undefined"
          :aria-labelledby="section.items?.length ? sectionId(item.id) : undefined"
        >
          <div class="project-item-text stack">
            <p v-if="item.label" class="project-item-label">{{ item.label }}</p>
            <component
              :is="headingTag(!!section.items?.length)"
              :id="sectionId(item.id)"
              class="project-item-title"
              >{{ item.title }}</component
            >
            <p v-if="item.tagline" class="project-item-tagline">{{ item.tagline }}</p>
            <p v-for="paragraph in item.paragraphs" :key="paragraph">{{ paragraph }}</p>
            <p v-if="item.content" class="intro">{{ item.content }}</p>
          </div>
          <div v-if="!item.content && !item.paragraphs?.length" class="placeholder-panel">
            <p class="muted">此區內容與圖片待提供。</p>
          </div>
          <div v-if="item.media" class="project-section-media">
            <video
              v-if="item.media.type === 'video'"
              controls
              playsinline
              muted
              loop
              preload="none"
              :poster="item.media.poster"
              :aria-label="`${project.title}：${item.title}示範影片`"
            >
              <source :data-src="item.media.src" type="video/mp4" />
              您的瀏覽器不支援影片播放，請<a :href="item.media.src">開啟{{ item.title }}影片</a>。
            </video>
            <img v-else :src="item.media.src" :alt="item.media.alt" loading="lazy" />
          </div>
        </div>
      </div>
    </section>
  </article>
</template>

<style scoped>
/* 保留 components layer，維持工具類別的覆寫優先順序。 */
@layer components {
  .project-section {
    min-inline-size: 0;
    text-align: center;
  }
  .project-section-items,
  .project-section-item,
  .project-item-text {
    min-inline-size: 0;
    width: 100%;
  }
  .project-item-text > .intro {
    justify-self: center;
  }
  .project-section-media {
    min-inline-size: 0;
    width: 100%;
    max-inline-size: 100%;
  }
  .project-section-media :is(video, img) {
    display: block;
    width: 100%;
    max-inline-size: 100%;
    height: auto;
    object-fit: contain;
    border-radius: var(--radius-panel);
  }
  .project-section-media video {
    border: 0;
    /* 原生播放器會覆寫外框；僅在影片使用 important，並保留鍵盤實線提示。 */
    outline: none !important;
  }
  .project-section-media video:focus-visible {
    outline: 2px solid var(--color-focus) !important;
    outline-offset: 4px;
  }
  .project-detail--modal {
    --color-text: var(--palette-black);
    --color-text-muted: var(--palette-black);
    --color-border: var(--palette-black);
    --color-focus: var(--palette-black);
    /* 原水平留白最大為 space-12，增加至下一級 space-16。 */
    padding: var(--content-section-padding-block) var(--space-16);
    color: var(--palette-black);
    text-align: center;
  }
  .project-detail--modal .stack {
    min-inline-size: 0;
    justify-items: center;
  }
  .project-detail--modal .stack > * {
    min-inline-size: 0;
    max-inline-size: 100%;
  }
  .project-design-year {
    color: var(--palette-blue);
    font-size: var(--font-size-sm);
    text-align: center;
  }
  .project-detail--modal .project-detail-summary {
    color: var(--palette-blue);
  }
  .project-detail--modal .project-detail-title {
    color: var(--palette-black);
    font-size: var(--font-size-2xl);
  }
  .project-detail--modal h3 {
    font-size: var(--font-size-xl);
  }
  .project-detail--modal .placeholder-panel {
    width: 100%;
    background: var(--palette-white);
  }
  .project-detail--modal :is(img, video, iframe, audio) {
    display: block;
    max-inline-size: 100%;
    margin-inline: auto;
  }
  .project-detail--modal :is(img, video) {
    height: auto;
    object-fit: contain;
  }
  .project-cover {
    width: 100%;
    height: auto;
    border-radius: var(--radius-panel);
  }
  /* 只有提供子項目的作品啟用章節版型，其他作品保留原本排版。 */
  .project-detail--chapters {
    row-gap: var(--space-12);
  }
  .project-detail--chapters > .project-chapter {
    --color-text: var(--palette-black);
    --color-focus: var(--palette-black);
    row-gap: var(--space-8);
    color: var(--palette-black);
    background: var(--palette-white);
  }
  .project-chapter + .project-chapter {
    padding-block-start: var(--space-12);
    border-block-start: 1px solid var(--palette-blue);
  }
  .project-chapter-heading {
    display: grid;
    gap: var(--space-2);
    text-align: center;
  }
  .project-chapter-number {
    font-size: var(--font-size-sm);
  }
  .project-chapter-subtitle {
    font-size: var(--font-size-md);
  }
  .project-chapter .project-section-items {
    display: grid;
    gap: var(--space-8);
  }
  .project-chapter .project-item-text {
    gap: var(--space-4);
    width: min(100%, var(--layout-text-width));
    margin-inline: auto;
    text-align: left;
  }
  .project-chapter .project-item-text > * {
    justify-self: stretch;
  }
  .project-chapter .project-section-item + .project-section-item {
    padding-block-start: var(--space-8);
    border-block-start: 1px solid var(--palette-blue);
  }
  .project-item-label {
    color: var(--palette-red);
    font-size: var(--font-size-sm);
  }
  .project-chapter .project-item-title {
    font-family: var(--font-family-heading);
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    line-height: var(--line-height-heading);
    letter-spacing: var(--letter-spacing-heading);
    overflow-wrap: anywhere;
  }
  .project-item-tagline {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
  }
  @media (max-width: 899px) {
    .project-detail--modal {
      /* 窄版原水平留白最大為 space-8，增加至 space-12。 */
      padding-inline: var(--space-12);
    }
  }
  @media (max-width: 480px) {
    .project-detail--chapters {
      row-gap: var(--space-8);
    }
    .project-detail--chapters > .project-chapter,
    .project-chapter .project-section-items {
      gap: var(--space-6);
    }
    .project-chapter + .project-chapter {
      padding-block-start: var(--space-8);
    }
    .project-chapter .project-section-item + .project-section-item {
      padding-block-start: var(--space-6);
    }
    .project-detail--modal {
      /* 手機原為 space-4 左右，使用下一級並保留內容寬度。 */
      padding-inline: var(--space-6);
    }
  }
}
</style>
