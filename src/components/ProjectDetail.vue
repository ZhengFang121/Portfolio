<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, useTemplateRef, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowLeft, ArrowRight, Award, ExternalLink, Pause, Play } from '@lucide/vue'
import BaseButton from './BaseButton.vue'
import ProjectCategories from './ProjectCategories.vue'
import type { PortfolioProject, ProjectSection } from '../data/projects'
const props = withDefaults(
  defineProps<{ project: PortfolioProject; mode?: 'page' | 'modal'; titleId?: string }>(),
  {
    mode: 'page',
    titleId: undefined,
  },
)

// 作品網站僅接受完整的 HTTP／HTTPS 網址；空值或無效格式不產生按鈕與留白。
const websiteUrl = computed(() => {
  const value = props.project.websiteUrl?.trim()
  if (!value || !/^https?:\/\//i.test(value)) return undefined
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) && url.hostname ? value : undefined
  } catch {
    return undefined
  }
})

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

function hasItemContent(item: ProjectSection) {
  return Boolean(
    item.content ||
    item.paragraphs?.length ||
    item.tagline ||
    item.media ||
    item.images?.length ||
    item.catalog?.length ||
    item.blocks?.length ||
    item.flow?.steps.length ||
    item.links?.length ||
    item.note,
  )
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
      <div
        v-if="project.awards?.length"
        class="project-awards"
        role="group"
        aria-label="作品獲獎資訊"
      >
        <p class="project-awards-label">
          <Award :size="18" aria-hidden="true" />
          <span>AWARD · 獲獎紀錄</span>
        </p>
        <ul class="project-awards-list">
          <li v-for="award in project.awards" :key="`${award.name}-${award.category}`">
            {{ award.name }}｜{{ award.category }} {{ award.recognition }}
          </li>
        </ul>
      </div>
      <img
        v-if="project.cover"
        class="project-cover"
        :src="project.cover.src"
        :alt="project.cover.alt"
        :width="project.cover.width"
        :height="project.cover.height"
        loading="lazy"
      />
      <div v-else class="placeholder-media">作品主視覺待提供</div>
    </header>
    <section
      v-for="section in project.sections"
      :key="section.id"
      class="project-section stack"
      :class="{ 'content-section': mode === 'page', 'project-chapter': section.items?.length }"
      :aria-labelledby="section.title ? sectionId(section.id) : undefined"
    >
      <header v-if="section.title" class="project-chapter-heading">
        <p v-if="mode === 'page' && section.label" class="project-chapter-number">
          {{ section.label }}
        </p>
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
          :class="{
            'project-section-item--card-grid': item.imageLayout === 'card-grid',
            'project-section-item--qr-phone': item.imageLayout === 'qr-phone',
          }"
          :role="section.items?.length ? 'group' : undefined"
          :aria-labelledby="
            section.items?.length && item.title ? sectionId(item.id, section.id) : undefined
          "
        >
          <div
            v-if="
              section.items?.length ||
              item.content ||
              item.paragraphs?.length ||
              item.tagline ||
              !hasItemContent(item)
            "
            class="project-item-text stack"
          >
            <p v-if="section.items?.length && item.label" class="project-item-label">
              {{ item.label }}
            </p>
            <component
              :is="headingTag(true)"
              v-if="section.items?.length && item.title"
              :id="sectionId(item.id, section.id)"
              class="project-item-title"
              >{{ item.title }}</component
            >
            <p v-if="item.tagline" class="project-item-tagline">{{ item.tagline }}</p>
            <p v-for="paragraph in item.paragraphs" :key="paragraph" class="project-item-body">
              {{ paragraph }}
            </p>
            <p v-if="item.content" class="project-item-body">{{ item.content }}</p>
            <p v-if="!hasItemContent(item)" class="project-item-body">內容準備中</p>
          </div>
          <div
            v-if="item.media"
            class="project-section-media"
            :class="{
              'project-section-media--video': item.media.type === 'video',
              'project-section-media--phone':
                item.media.type === 'image' && item.media.variant === 'phone',
              'project-section-media--qr-code':
                item.media.type === 'image' && item.media.variant === 'qr-code',
              'project-section-media--logo':
                item.media.type === 'image' && item.media.variant === 'logo',
            }"
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
            <img
              v-else
              :src="item.media.src"
              :alt="item.media.alt"
              :width="item.media.width"
              :height="item.media.height"
              loading="lazy"
            />
          </div>
          <div
            v-if="item.images?.length"
            class="project-image-group"
            :class="{
              'project-image-group--cards': item.imageLayout === 'card-grid',
              'project-image-group--stack': item.imageLayout === 'stack',
              'project-image-group--qr-phone': item.imageLayout === 'qr-phone',
            }"
          >
            <div v-for="image in item.images" :key="image.src" class="project-section-media">
              <img
                :src="image.src"
                :alt="image.alt"
                :width="image.width"
                :height="image.height"
                loading="lazy"
              />
            </div>
          </div>
          <div v-if="item.catalog?.length" class="project-catalog">
            <div class="project-catalog-groups">
              <div
                v-for="group in item.catalog"
                :key="group.id"
                class="project-catalog-group"
                role="group"
                :aria-labelledby="sectionId(`${item.id}-${group.id}`, section.id)"
              >
                <component
                  :is="mode === 'modal' ? 'h5' : 'h4'"
                  :id="sectionId(`${item.id}-${group.id}`, section.id)"
                  class="project-catalog-group-title"
                  >{{ group.title }}</component
                >
                <ul class="project-catalog-items">
                  <li v-for="product in group.items" :key="product.id" class="project-catalog-item">
                    <img
                      class="project-catalog-image"
                      :src="product.image.src"
                      :alt="product.image.alt"
                      :width="product.image.width"
                      :height="product.image.height"
                      loading="lazy"
                    />
                    <div class="project-catalog-text">
                      <component
                        :is="mode === 'modal' ? 'h6' : 'h5'"
                        class="project-catalog-item-title"
                        >{{ product.title }}</component
                      >
                      <p class="project-item-body">{{ product.description }}</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div v-if="item.blocks?.length" class="project-content-blocks">
            <div v-for="block in item.blocks" :key="block.id" class="project-content-block stack">
              <div class="project-item-text stack">
                <p class="project-item-label">{{ block.label }}</p>
                <component
                  :is="mode === 'modal' ? 'h5' : 'h4'"
                  v-if="block.title"
                  class="project-block-title"
                  >{{ block.title }}</component
                >
                <p class="project-item-body">{{ block.content }}</p>
              </div>
              <div
                v-if="block.images?.length"
                class="project-image-group"
                :class="{ 'project-image-group--feature': block.imageLayout === 'feature-grid' }"
              >
                <div v-for="image in block.images" :key="image.src" class="project-section-media">
                  <img
                    :src="image.src"
                    :alt="image.alt"
                    :width="image.width"
                    :height="image.height"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
          <ol
            v-if="item.flow?.steps.length"
            class="project-item-flow"
            :aria-label="item.flow.label"
          >
            <li v-for="(step, index) in item.flow.steps" :key="index">
              <span>{{ step }}</span>
              <ArrowRight v-if="index < item.flow.steps.length - 1" :size="20" aria-hidden="true" />
            </li>
          </ol>
          <p v-if="item.note" class="project-item-note project-item-body">{{ item.note }}</p>
          <div v-if="item.links?.length" class="project-item-links">
            <a
              v-for="link in item.links"
              :key="link.href"
              class="text-link"
              :href="link.href"
              target="_blank"
              rel="noopener noreferrer"
              >{{ link.label }}<ExternalLink :size="18" aria-hidden="true" /><span class="sr-only"
                >（另開新分頁）</span
              ></a
            >
          </div>
        </div>
      </div>
    </section>
    <div v-if="websiteUrl" class="project-website-link">
      <BaseButton label="前往網站" variant="red" :href="websiteUrl" />
    </div>
  </article>
</template>

<style scoped>
/* 保留 components layer，維持工具類別的覆寫優先順序。 */
@layer components {
  /* 主要章節 64px、子段落 48px、段內元素 16–24px；間距只由 gap 管理。 */
  .project-detail {
    row-gap: var(--space-16);
  }
  .project-website-link {
    display: flex;
    justify-content: center;
    min-inline-size: 0;
    padding-block-end: var(--space-6);
  }
  .project-awards {
    display: grid;
    justify-self: center;
    gap: var(--space-2);
    min-inline-size: 0;
    max-inline-size: min(100%, var(--layout-text-width));
    font-weight: var(--font-weight-medium);
    text-align: center;
    overflow-wrap: anywhere;
  }
  .project-awards-label {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    color: var(--palette-red);
    font-size: var(--font-size-sm);
  }
  .project-awards-list {
    display: grid;
    gap: var(--space-2);
    min-inline-size: 0;
    margin: 0;
    padding: 0;
    list-style: none;
    color: var(--palette-black);
    font-size: var(--font-size-md);
    text-wrap: balance;
  }
  .project-awards svg {
    flex-shrink: 0;
  }
  .project-section {
    row-gap: var(--space-8);
    min-inline-size: 0;
    text-align: center;
  }
  .project-section-items,
  .project-section-item,
  .project-item-text,
  .project-content-blocks,
  .project-content-block {
    min-inline-size: 0;
    width: 100%;
  }
  .project-section-items,
  .project-content-blocks {
    display: grid;
    gap: var(--space-12);
  }
  .project-section-item,
  .project-content-block {
    gap: var(--space-6);
  }
  .project-content-block {
    container: project-content-block / inline-size;
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
  /* 單張媒體與圖片群組共用內文閱讀寬度；封面維持原有樣式。 */
  .project-section-media,
  .project-image-group {
    min-inline-size: 0;
    width: min(100%, var(--layout-text-width));
    max-inline-size: 100%;
    margin-inline: auto;
  }
  .project-image-group {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
    align-items: start;
    gap: var(--space-6);
  }
  /* 由作品資料選用固定單欄，各尺寸皆保留圖片完整原貌。 */
  .project-image-group--stack {
    display: flex;
    flex-direction: column;
  }
  /* QR Code 在前、帳號畫面在後；依實際容器寬度決定並排或堆疊。 */
  .project-section-item--qr-phone {
    container: project-qr-phone / inline-size;
  }
  .project-image-group--qr-phone {
    grid-template-columns: minmax(0, 1fr);
    place-items: center;
  }
  @container project-qr-phone (min-width: 36rem) {
    .project-image-group--qr-phone {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  /* 窄容器依圖片順序單欄；寬容器以首張直式圖搭配右側上下兩張照片。 */
  .project-image-group--feature {
    grid-template-columns: minmax(0, 1fr);
  }
  @container project-content-block (min-width: 31.5rem) {
    .project-image-group--feature {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      grid-template-rows: repeat(2, minmax(0, 1fr));
      align-items: stretch;
    }
    .project-image-group--feature > :first-child {
      grid-row: span 2;
    }
    .project-image-group--feature .project-section-media img {
      height: 100%;
      object-fit: cover;
    }
  }
  /* 依作品項目的可用寬度換欄，讓獨立頁與介紹視窗使用相同規則。 */
  .project-section-item--card-grid {
    container: project-card-grid / inline-size;
  }
  .project-image-group--cards {
    grid-template-columns: minmax(0, 1fr);
  }
  @container project-card-grid (min-width: 28rem) {
    .project-image-group--cards {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  .project-section-media :is(video, img) {
    display: block;
    width: 100%;
    max-inline-size: 100%;
    height: auto;
    object-fit: contain;
    border-radius: var(--radius-panel);
  }
  .project-section-media--video {
    position: relative;
  }
  /* 圖鑑以實際閱讀寬度換欄；系列與單項產品各自判斷可用空間。 */
  .project-catalog {
    container: project-catalog / inline-size;
    width: min(100%, var(--layout-text-width));
    min-inline-size: 0;
    margin-inline: auto;
    text-align: left;
  }
  .project-catalog-groups {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-12) var(--space-8);
    align-items: start;
  }
  .project-catalog-group {
    container: project-catalog-group / inline-size;
    min-inline-size: 0;
  }
  .project-catalog-group-title,
  .project-catalog-item-title {
    font-family: var(--font-family-heading);
    font-weight: var(--font-weight-semibold);
    line-height: var(--line-height-heading);
    letter-spacing: var(--letter-spacing-heading);
    overflow-wrap: anywhere;
  }
  .project-catalog-group-title {
    margin-block-end: var(--space-6);
    font-size: var(--font-size-lg);
  }
  .project-catalog-item-title {
    font-size: var(--font-size-md);
  }
  .project-catalog-items {
    display: grid;
    gap: var(--space-8);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .project-catalog-item {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    align-items: center;
    gap: var(--space-4);
    min-inline-size: 0;
  }
  .project-catalog-image {
    display: block;
    width: 7rem;
    max-inline-size: 100%;
    height: auto;
    object-fit: contain;
  }
  .project-catalog-text {
    display: grid;
    gap: var(--space-2);
    min-inline-size: 0;
    overflow-wrap: anywhere;
  }
  @container project-catalog (min-width: 40rem) {
    .project-catalog-groups {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @container project-catalog-group (min-width: 18rem) {
    .project-catalog-item {
      grid-template-columns: 7rem minmax(0, 1fr);
    }
  }
  .project-section-media video {
    border: 0;
  }
  /* 特殊變體保留原有尺寸，仍受父容器寬度限制。 */
  .project-section-media--phone,
  .project-image-group--qr-phone > :last-child {
    width: min(100%, 340px);
  }
  .project-section-media--qr-code,
  .project-image-group--qr-phone > :first-child {
    width: min(100%, 200px);
  }
  .project-section-media--logo {
    width: min(100%, 200px);
  }
  .project-section-media--qr-code img,
  .project-image-group--qr-phone > :first-child img,
  .project-section-media--logo img {
    border-radius: 0;
  }
  .project-item-flow,
  .project-item-note,
  .project-item-links {
    width: min(100%, var(--layout-text-width));
    margin-inline: auto;
  }
  .project-item-flow {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: 0;
    list-style: none;
    font-size: var(--font-size-md);
  }
  .project-item-flow li {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-3);
    min-width: 0;
  }
  .project-item-flow span {
    display: grid;
    place-items: center;
    width: 100%;
    padding: var(--space-3);
    border: 1px solid var(--palette-blue);
    border-radius: var(--radius-control);
    overflow-wrap: anywhere;
  }
  .project-item-flow svg {
    flex-shrink: 0;
    transform: rotate(90deg);
  }
  .project-item-note,
  .project-item-links {
    text-align: left;
  }
  .project-item-links {
    --color-link: var(--palette-red);
    --color-link-hover: var(--palette-black);
    display: grid;
    gap: var(--space-2);
  }
  .project-item-links a {
    text-decoration: underline;
  }
  .project-item-links svg {
    flex-shrink: 0;
  }
  @media (min-width: 900px) {
    .project-item-flow,
    .project-item-flow li {
      flex-direction: row;
    }
    .project-item-flow li {
      flex: 1;
      align-self: stretch;
    }
    .project-item-flow span {
      flex: 1;
      align-self: stretch;
    }
    .project-item-flow svg {
      transform: none;
    }
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
  @media (hover: hover) and (pointer: fine) {
    .project-video-toggle:hover {
      color: var(--palette-red);
    }
  }

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
  /* 標題用於宣讀視窗名稱與定位閱讀起點，並非可操作控制項。 */
  .project-detail--modal .project-detail-title[tabindex='-1']:focus {
    outline: none;
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
  .project-detail--modal .project-chapter-subtitle {
    font-size: var(--font-size-sm);
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
  .project-block-title {
    font-family: var(--font-family-heading);
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-semibold);
    line-height: var(--line-height-heading);
    letter-spacing: var(--letter-spacing-heading);
    overflow-wrap: anywhere;
  }
  @media (max-width: 899px) {
    .project-detail {
      row-gap: var(--space-12);
    }
    .project-section-items,
    .project-content-blocks {
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
    .project-section-items,
    .project-content-blocks {
      gap: var(--space-6);
    }
    .project-section-item,
    .project-content-block {
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
