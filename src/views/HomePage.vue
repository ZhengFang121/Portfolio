<script setup lang="ts">
import ProjectGrid from '../components/ProjectGrid.vue'
import BaseButton from '../components/BaseButton.vue'
import { projects } from '../data/projects'

const likesBase = `${import.meta.env.BASE_URL}images/profile/likes/`
const heroDecorations = [
  'panda-0.png',
  'mountain-sea-0.png',
  'run-0.png',
  'baseball-0.png',
  'ceramics-0.png',
  'coffee-0.png',
]

// 依固定 slug 選取並排序，不讓 Works 列表順序影響首頁精選作品。
const featuredProjects = ['project-01', 'project-03']
  .map((slug) => projects.find((project) => project.slug === slug))
  .filter((project) => project !== undefined)
</script>
<template>
  <div class="page-sections home-page">
    <section class="content-section home-section home-hero" aria-labelledby="home-title">
      <div class="hero-decorations" aria-hidden="true">
        <img
          v-for="(image, index) in heroDecorations"
          :key="image"
          class="hero-like"
          :class="`hero-like--${index + 1}`"
          :src="`${likesBase}${image}`"
          alt=""
          width="1300"
          height="1000"
          draggable="false"
        />
      </div>
      <div class="home-hero-content">
        <h1 id="home-title" class="home-heading">Fang</h1>
        <p class="home-intro">平面設計師 與 前端網頁設計學習者</p>
        <BaseButton to="/about" variant="cream" aria-label="VIEW MORE：關於 Fang" />
      </div>
    </section>
    <section class="content-section home-section" aria-labelledby="selected-works">
      <h2 id="selected-works" class="home-heading">Works</h2>
      <ProjectGrid :projects="featuredProjects" />
      <BaseButton to="/works" variant="red" aria-label="VIEW MORE：全部主要作品" />
    </section>
  </div>
</template>

<style scoped>
.home-page {
  container: home / inline-size;
}

.home-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-12);
  text-align: center;
}

.home-hero {
  position: relative;
  min-block-size: clamp(22rem, 45.4dvh, 32rem);
  justify-content: center;
  /* 上下預留裝飾空間，中央內容換行時 Hero 會自然增高。 */
  padding-block: clamp(9rem, calc(36cqi - var(--space-4)), 14rem);
}

.home-hero-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-8);
  max-inline-size: 100%;
}

.hero-decorations {
  position: absolute;
  /* 區塊縮短後，維持插圖與中央資訊的距離。 */
  inset: calc(-1 * var(--space-4)) 0;
  pointer-events: none;
}

.hero-like {
  position: absolute;
  display: block;
  inset-inline-start: var(--like-x);
  inset-block-start: var(--like-top, auto);
  inset-block-end: var(--like-bottom, auto);
  /* 百分比寬度與上限一起放大，維持各張插圖原本的尺寸比例。 */
  inline-size: min(var(--like-size), 16.5rem);
  block-size: auto;
  object-fit: contain;
  transform: translate(-50%, var(--like-shift-y, 0%)) rotate(var(--like-rotation));
  pointer-events: none;
}

/* 只改變原有角度，保留定位用的位移；減少動態時維持靜態圖片。 */
@media (prefers-reduced-motion: no-preference) {
  .hero-like {
    animation: hero-like-sway 2.4s ease-in-out infinite alternate;
  }

  .hero-like:nth-child(even) {
    animation-duration: 2.8s;
    animation-direction: alternate-reverse;
  }

  .hero-like:nth-child(3n) {
    animation-delay: -1.2s;
  }
}

@keyframes hero-like-sway {
  from {
    transform: translate(-50%, var(--like-shift-y, 0%)) rotate(calc(var(--like-rotation) - 3deg));
  }

  to {
    transform: translate(-50%, var(--like-shift-y, 0%)) rotate(calc(var(--like-rotation) + 3deg));
  }
}

/* 窄版以高低錯落的上下兩道弧線環繞文字，不沿用左右直排。 */
.hero-like--1 {
  --like-x: 24%;
  --like-top: var(--space-16);
  --like-size: 33%;
  --like-rotation: -12deg;
  max-inline-size: 14.25rem;
}

.hero-like--2 {
  --like-x: 51%;
  --like-top: var(--space-8);
  --like-size: 39%;
  --like-rotation: 8deg;
  max-inline-size: 15rem;
}

.hero-like--3 {
  --like-x: 24%;
  --like-bottom: var(--space-8);
  --like-size: 37.5%;
  --like-rotation: -7deg;
  max-inline-size: 15.75rem;
}

.hero-like--4 {
  --like-x: 77%;
  --like-top: clamp(6rem, 18cqi, 7.5rem);
  --like-size: 30%;
  --like-rotation: 11deg;
  max-inline-size: 12.75rem;
}

.hero-like--5 {
  --like-x: 51%;
  --like-bottom: var(--space-16);
  --like-size: 30%;
  --like-rotation: -9deg;
  max-inline-size: 12rem;
}

.hero-like--6 {
  --like-x: 76%;
  --like-bottom: var(--space-12);
  --like-size: 36%;
  --like-rotation: 6deg;
}

/* 計入左側品牌圖占用的空間，Hero 足夠寬才展開為完整環繞構圖。 */
@container home (min-width: 42rem) {
  .home-hero {
    padding-block: clamp(9rem, calc(22cqi - var(--space-4)), 11rem);
  }

  .hero-like--1 {
    --like-x: 33%;
    --like-size: 27%;
  }

  .hero-like--2 {
    --like-x: 18%;
    --like-top: 51%;
    --like-size: 21%;
    --like-shift-y: -50%;
  }

  .hero-like--3 {
    --like-x: 33%;
    --like-size: 27%;
  }

  .hero-like--4 {
    --like-x: 66%;
    --like-top: var(--space-16);
    --like-size: 24%;
  }

  .hero-like--5 {
    --like-x: 80%;
    --like-top: 48%;
    --like-bottom: auto;
    --like-size: 20.25%;
    --like-shift-y: -50%;
  }

  .hero-like--6 {
    --like-x: 69%;
    --like-bottom: var(--space-2);
    --like-size: 31.5%;
  }
}

.home-heading {
  color: var(--palette-blue);
  font-size: clamp(2.5rem, 4.5vw, 4rem);
  font-weight: var(--font-weight-regular);
}

.home-intro {
  max-inline-size: var(--layout-text-width);
  color: var(--palette-blue);
  font-size: var(--font-size-lg);
}

.home-section :deep(.project-grid) {
  inline-size: 100%;
  min-inline-size: 0;
}
</style>
