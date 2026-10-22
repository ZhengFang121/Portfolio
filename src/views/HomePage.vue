<script setup lang="ts">
import ProjectGrid from '../components/ProjectGrid.vue'
import BaseButton from '../components/BaseButton.vue'
import { projects } from '../data/projects'

const likesBase = `${import.meta.env.BASE_URL}images/profile/likes/`
const heroDecorations = [
  'panda-1.png',
  'mountain-sea-1.png',
  'run-1.png',
  'baseball-1.png',
  'ceramics-1.png',
  'coffee-1.png',
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
  padding-block: clamp(10rem, 36cqi, 15rem);
}

.home-hero-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-12);
  max-inline-size: 100%;
}

.hero-decorations {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.hero-like {
  position: absolute;
  display: block;
  inset-inline-start: var(--like-x);
  inset-block-start: var(--like-top, auto);
  inset-block-end: var(--like-bottom, auto);
  inline-size: min(var(--like-size), 11rem);
  block-size: auto;
  object-fit: contain;
  transform: translate(-50%, var(--like-shift-y, 0%)) rotate(var(--like-rotation));
  pointer-events: none;
}

/* 窄版以高低錯落的上下兩道弧線環繞文字，不沿用左右直排。 */
.hero-like--1 {
  --like-x: 20%;
  --like-top: var(--space-8);
  --like-size: 22%;
  --like-rotation: -12deg;
  max-inline-size: 9.5rem;
}

.hero-like--2 {
  --like-x: 51%;
  --like-top: var(--space-8);
  --like-size: 26%;
  --like-rotation: 8deg;
  max-inline-size: 10rem;
}

.hero-like--3 {
  --like-x: 20%;
  --like-bottom: var(--space-8);
  --like-size: 25%;
  --like-rotation: -7deg;
  max-inline-size: 10.5rem;
}

.hero-like--4 {
  --like-x: 81%;
  --like-top: clamp(4rem, 12cqi, 5rem);
  --like-size: 20%;
  --like-rotation: 11deg;
  max-inline-size: 8.5rem;
}

.hero-like--5 {
  --like-x: 51%;
  --like-bottom: var(--space-8);
  --like-size: 20%;
  --like-rotation: -9deg;
  max-inline-size: 8rem;
}

.hero-like--6 {
  --like-x: 80%;
  --like-bottom: clamp(4rem, 12cqi, 5rem);
  --like-size: 24%;
  --like-rotation: 6deg;
}

/* 計入左側品牌圖占用的空間，Hero 足夠寬才展開為完整環繞構圖。 */
@container home (min-width: 42rem) {
  .home-hero {
    padding-block: clamp(10rem, 22cqi, 12rem);
  }

  .hero-like--1 {
    --like-x: 25%;
    --like-size: 18%;
  }

  .hero-like--2 {
    --like-x: 12%;
    --like-top: 51%;
    --like-size: 14%;
    --like-shift-y: -50%;
  }

  .hero-like--3 {
    --like-x: 29%;
    --like-size: 18%;
  }

  .hero-like--4 {
    --like-x: 72%;
    --like-top: var(--space-8);
    --like-size: 16%;
  }

  .hero-like--5 {
    --like-x: 87.5%;
    --like-top: 48%;
    --like-bottom: auto;
    --like-size: 13.5%;
    --like-shift-y: -50%;
  }

  .hero-like--6 {
    --like-x: 73%;
    --like-bottom: var(--space-6);
    --like-size: 21%;
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
