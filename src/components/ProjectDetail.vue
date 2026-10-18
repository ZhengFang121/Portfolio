<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, useTemplateRef, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowLeft, Pause, Play } from '@lucide/vue'
import ProjectCategories from './ProjectCategories.vue'
import type { PortfolioProject, ProjectSection } from '../data/projects'
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
const manuallyPausedVideos = new Set<HTMLVideoElement>()
// 由原生播放事件同步按鈕，涵蓋自動播放、手動操作及瀏覽器拒播。
const playingVideos = reactive(new Set<string>())
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
    playbackEnabled &&
    video.isConnected &&
    !motionPreference?.matches &&
    !manuallyPausedVideos.has(video) &&
    visibleVideos.has(video)
  )
}

async function playVideo(video: HTMLVideoElement, manual = false) {
  if (!playbackEnabled || !video.isConnected || !video.paused) return
  if (!manual && !canAutoPlay(video)) return
  try {
    await video.play()
    // 載入期間可能已捲走、手動暫停或關閉視窗，避免延遲完成的 play() 再啟動影片。
    if (
      !playbackEnabled ||
      !video.isConnected ||
      manuallyPausedVideos.has(video) ||
      (observer && !visibleVideos.has(video)) ||
      (!manual && motionPreference?.matches)
    )
      video.pause()
  } catch {
    // 自動播放遭拒時，仍可透過自訂按鈕再次手動啟動。
  }
}

function onPlaybackChange(event: Event) {
  const video = event.currentTarget
  if (!(video instanceof HTMLVideoElement)) return
  if (video.paused || video.ended) playingVideos.delete(video.id)
  else playingVideos.add(video.id)
}

function toggleVideo(event: MouseEvent) {
  const button = event.currentTarget
  if (!(button instanceof HTMLButtonElement) || !playbackEnabled) return
  const video = button.parentElement?.querySelector('video')
  if (!video) return
  if (!video.paused) {
    manuallyPausedVideos.add(video)
    video.pause()
  } else {
    manuallyPausedVideos.delete(video)
    loadVideo(video)
    // 保持在使用者手勢內呼叫 play()，讓減少動態及拒播環境也能手動播放。
    void playVideo(video, true)
  }
}

function pauseVideos() {
  playbackEnabled = false
  observer?.disconnect()
  observer = null
  visibleVideos.clear()
  videos.forEach((video) => video.pause())
  playingVideos.clear()
  manuallyPausedVideos.clear()
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
    // 不支援 Observer 時只提供按鈕播放，點擊時才載入影片。
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
          // 同一次停留不重複嘗試播放；手動暫停狀態另外保留。
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

// 子段落包含所屬章節，允許不同章節使用相同的子段落 id。
function sectionId(id: string, parentId?: string) {
  if (parentId) id = `${parentId}-${id}`
  return props.mode === 'page' ? id : `${props.project.slug}-modal-${id}`
}

function videoId(section: ProjectSection, item: ProjectSection) {
  return `${sectionId(item.id, section.items?.length ? section.id : undefined)}-video`
}

function headingTag(isChild = false) {
  if (props.mode === 'modal') return isChild ? 'h4' : 'h3'
  return isChild ? 'h3' : 'h2'
}
</script>
<template>
  <article
    ref="detail"
    class="project-detail page-sections"
    :class="{
      'project-detail--modal': mode === 'modal',
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
      <header class="project-chapter-heading">
        <p v-if="section.label" class="project-chapter-number">{{ section.label }}</p>
        <component :is="headingTag()" :id="sectionId(section.id)" class="project-chapter-title">{{
          section.title
        }}</component>
        <p v-if="section.subtitle" class="project-chapter-subtitle">{{ section.subtitle }}</p>
      </header>
      <div class="project-section-items">
        <div
          v-for="item in section.items?.length ? section.items : [section]"
          :key="item.id"
          class="project-section-item stack"
          :role="section.items?.length ? 'group' : undefined"
          :aria-labelledby="section.items?.length ? sectionId(item.id, section.id) : undefined"
        >
          <div
            v-if="section.items?.length || item.content || item.paragraphs?.length || item.tagline"
            class="project-item-text stack"
          >
            <p v-if="section.items?.length && item.label" class="project-item-label">
              {{ item.label }}
            </p>
            <component
              :is="headingTag(true)"
              v-if="section.items?.length"
              :id="sectionId(item.id, section.id)"
              class="project-item-title"
              >{{ item.title }}</component
            >
            <p v-if="item.tagline" class="project-item-tagline">{{ item.tagline }}</p>
            <p v-for="paragraph in item.paragraphs" :key="paragraph" class="project-item-body">
              {{ paragraph }}
            </p>
            <p v-if="item.content" class="project-item-body">{{ item.content }}</p>
          </div>
          <div
            v-if="!item.content && !item.paragraphs?.length && !item.tagline && !item.media"
            class="placeholder-panel"
          >
            <p class="muted">此區內容與圖片待提供。</p>
          </div>
          <div
            v-if="item.media"
            class="project-section-media"
            :class="{ 'project-section-media--video': item.media.type === 'video' }"
          >
            <template v-if="item.media.type === 'video'">
              <video
                :id="videoId(section, item)"
                playsinline
                muted
                loop
                preload="none"
                :poster="item.media.poster"
                :aria-label="`${project.title}：${item.title}示範影片`"
                @play="onPlaybackChange"
                @pause="onPlaybackChange"
                @ended="onPlaybackChange"
              >
                <source :data-src="item.media.src" type="video/mp4" />
                您的瀏覽器不支援影片播放，請<a :href="item.media.src">開啟{{ item.title }}影片</a>。
              </video>
              <button
                class="project-video-toggle"
                type="button"
                :aria-controls="videoId(section, item)"
                :aria-label="`${playingVideos.has(videoId(section, item)) ? '暫停' : '播放'}${item.title}示範影片`"
                @click="toggleVideo"
              >
                <Pause
                  v-if="playingVideos.has(videoId(section, item))"
                  :size="20"
                  aria-hidden="true"
                />
                <Play v-else :size="20" aria-hidden="true" />
              </button>
            </template>
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
  /* 主要章節 64px、子段落 48px、段內元素 16–24px；間距只由 gap 管理。 */
  .project-detail {
    row-gap: var(--space-16);
  }
  .project-section {
    row-gap: var(--space-8);
    min-inline-size: 0;
    text-align: center;
  }
  .project-section-items,
  .project-section-item,
  .project-item-text {
    min-inline-size: 0;
    width: 100%;
  }
  .project-section-items {
    display: grid;
    gap: var(--space-12);
  }
  .project-section-item {
    gap: var(--space-6);
  }
  .project-item-text {
    gap: var(--space-4);
    width: min(100%, var(--layout-text-width));
    margin-inline: auto;
    text-align: left;
  }
  .project-item-text > * {
    justify-self: stretch;
  }
  .project-item-body {
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-regular);
    line-height: var(--line-height-body);
    letter-spacing: var(--letter-spacing-body);
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
  /* 只限制影片；封面與其他作品圖片沿用原本寬度。 */
  .project-section-media--video {
    position: relative;
    width: min(100%, var(--layout-text-width));
    margin-inline: auto;
  }
  .project-section-media video {
    border: 0;
  }
  .project-video-toggle {
    position: absolute;
    inset-block-start: var(--space-3);
    inset-inline-end: var(--space-3);
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--palette-black);
    cursor: pointer;
  }
  .project-video-toggle svg {
    /* 以細白邊保留深色畫面上的辨識度，不增加按鈕底色。 */
    filter: drop-shadow(0 0 1px var(--palette-white));
  }
  .project-video-toggle:hover,
  .project-video-toggle:active {
    color: var(--palette-red);
  }
  .project-video-toggle:focus-visible {
    outline: 2px solid var(--color-focus);
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
  .project-detail > .project-chapter {
    --color-text: var(--palette-black);
    --color-focus: var(--palette-black);
    color: var(--palette-black);
    background: var(--palette-white);
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
  .project-item-label {
    color: var(--palette-red);
    font-size: var(--font-size-sm);
  }
  .project-chapter-title,
  .project-item-title {
    font-family: var(--font-family-heading);
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    line-height: var(--line-height-heading);
    letter-spacing: var(--letter-spacing-heading);
    overflow-wrap: anywhere;
  }
  .project-item-title {
    font-size: var(--font-size-lg);
  }
  .project-item-tagline {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
  }
  @media (max-width: 899px) {
    .project-detail {
      row-gap: var(--space-12);
    }
    .project-section-items {
      gap: var(--space-8);
    }
    .project-detail--modal {
      /* 窄版原水平留白最大為 space-8，增加至 space-12。 */
      padding-inline: var(--space-12);
    }
  }
  @media (max-width: 480px) {
    .project-detail {
      row-gap: var(--space-8);
    }
    .project-section,
    .project-section-items {
      gap: var(--space-6);
    }
    .project-section-item {
      gap: var(--space-4);
    }
    .project-item-text {
      gap: var(--space-2);
    }
    .project-detail--modal {
      /* 手機原為 space-4 左右，使用下一級並保留內容寬度。 */
      padding-inline: var(--space-6);
    }
  }
}
</style>
