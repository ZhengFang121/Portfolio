<script setup lang="ts">
import { Mail } from '@lucide/vue'
import ExperienceTimeline from '../components/ExperienceTimeline.vue'
import { experiences } from '../data/experiences'

const education = [
  { years: '2013 - 2017', school: '朝陽科技大學工業設計系' },
  { years: '2010 - 2013', school: '鶯歌高職陶瓷工程科' },
]
const licenses = ['丙級網頁設計技術士','丙級陶瓷石膏模技術士', '丙級廣告設計技術士', 'AutoCAD 國際認證']
const skills = ['Ai', 'Ps', 'Procreate', 'html','css','javascript','Figma',,'ChatGPT','Word', 'PowerPoint', 'Excel', '陶瓷']
const likes = [
  { id: 'baseball', alt: '棒球', defaultImage: 'baseball-1.png', hoverImage: 'baseball-2.JPG' },
  { id: 'ceramics', alt: '陶瓷', defaultImage: 'ceramics-1.png', hoverImage: 'ceramics-2.jpg' },
  { id: 'coffee', alt: '咖啡', defaultImage: 'coffee-1.png', hoverImage: 'coffee-2.JPG' },
  {
    id: 'mountain-sea',
    alt: '山與海',
    defaultImage: 'mountain-sea-1.png',
    hoverImage: 'mountain-sea-2.jpg',
  },
  { id: 'panda', alt: '貓熊', defaultImage: 'panda-1.png', hoverImage: 'panda-2.JPG' },
  { id: 'run', alt: '跑步', defaultImage: 'run-1.png', hoverImage: 'run-2.JPG' },
]
</script>

<template>
  <div class="page-sections">
    <header class="content-section stack">
      <h1 class="about-title">正芳 Fang</h1>
      <a class="text-link contact-link" href="mailto:skin84121@gmail.com">
        <Mail class="contact-icon" aria-hidden="true" />
        <span>skin84121@gmail.com</span>
      </a>
      <div class="about-introduction">
        <img
          class="about-portrait"
          src="/images/profile/fang.JPG"
          alt="正芳 Fang 的個人照片"
          width="2268"
          height="4032"
          decoding="async"
        />
        <p class="about-intro">
          我是一名具有平面設計背景的前端網頁設計學習者。過去主要投入品牌、包裝與視覺設計，有完整的視覺設計經驗，現在能把設計延伸至數位互動與前端網頁開發。我特別關注Typography、Layout、Design System與互動細節，也希望讓設計不只停留在畫面，而能真正成為可使用的產品。
        </p>
      </div>
    </header>
    <section class="content-section about-background" aria-label="學歷、證照與技能">
      <section class="stack" aria-labelledby="about-education">
        <h2 id="about-education" class="about-section-title">學歷 Education</h2>
        <dl class="education-list">
          <div v-for="entry in education" :key="entry.years" class="education-entry">
            <dt>{{ entry.years }}</dt>
            <dd>{{ entry.school }}</dd>
          </div>
        </dl>
      </section>
      <section class="stack" aria-labelledby="about-license">
        <h2 id="about-license" class="about-section-title">證照 License</h2>
        <ul class="license-list" role="list">
          <li v-for="license in licenses" :key="license">{{ license }}</li>
        </ul>
      </section>
      <section class="stack about-skills" aria-labelledby="about-skills">
        <h2 id="about-skills" class="about-section-title">技能 Skills</h2>
        <ul class="skills-list" role="list">
          <li v-for="skill in skills" :key="skill" class="skill-tag">{{ skill }}</li>
        </ul>
      </section>
    </section>
    <section class="content-section" aria-label="經歷">
      <ExperienceTimeline :entries="experiences" />
    </section>
    <section class="content-section stack" aria-labelledby="about-likes">
      <h2 id="about-likes" class="about-title about-section-title">Likes</h2>
      <ul class="likes-grid" role="list">
        <li v-for="like in likes" :key="like.id" class="like-image">
          <img
            :src="`/images/profile/likes/${like.defaultImage}`"
            :alt="like.alt"
            width="1300"
            height="1000"
            loading="lazy"
            decoding="async"
          />
          <img
            class="like-image-hover"
            :src="`/images/profile/likes/${like.hoverImage}`"
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
          />
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
@layer components {
  .about-title {
    text-align: center;
  }

  .about-section-title {
    color: var(--palette-blue);
  }

  .about-introduction {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
    align-items: center;
    gap: var(--space-8);
    max-width: var(--layout-text-width);
    margin-inline: auto;
  }

  .about-portrait {
    width: 100%;
    max-width: 14rem;
    height: auto;
    aspect-ratio: 7 / 9;
    border-radius: var(--radius-full);
    object-fit: cover;
    object-position: center 60%;
  }

  .about-intro {
    text-align: left;
  }

  .about-background {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
    gap: var(--space-12) var(--space-8);
  }

  .about-skills {
    grid-column: 1 / -1;
  }

  .education-list,
  .license-list {
    display: grid;
    gap: var(--space-3);
  }

  .education-entry {
    display: grid;
    grid-template-columns: max-content minmax(0, 1fr);
    gap: var(--space-6);
  }

  .education-entry dt {
    font-variant-numeric: tabular-nums;
  }

  .skills-list {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: var(--space-3);
  }

  .skill-tag {
    display: grid;
    place-items: center;
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-control);
    background: var(--palette-blue);
    color: var(--palette-red);
    text-align: center;
    overflow-wrap: anywhere;
  }

  .likes-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--space-6);
  }

  .like-image {
    position: relative;
    aspect-ratio: 13 / 10;
    overflow: hidden;
    border-radius: var(--radius-panel);
  }

  .like-image img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .like-image-hover {
    opacity: 0;
  }

  .contact-link {
    max-width: 100%;
    margin-inline: auto;
    color: var(--color-link);
    font-size: var(--font-size-lg);
  }

  .contact-link span {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .contact-icon {
    flex-shrink: 0;
    width: 1.25em;
    height: 1.25em;
  }

  .contact-link:hover,
  .contact-link:focus-visible {
    text-decoration: underline;
  }

  @media (hover: hover) and (pointer: fine) {
    .like-image:hover .like-image-hover {
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: no-preference) {
    .like-image-hover {
      transition: opacity var(--motion-duration-feedback) ease-out;
    }
  }

  @media (max-width: 899px) {
    .skills-list {
      /* 窄螢幕沿用最多四欄，依可用寬度自動換行。 */
      grid-template-columns: repeat(
        auto-fit,
        minmax(min(100%, max(7rem, calc((100% - var(--space-3) * 3) / 4))), 1fr)
      );
    }

    .likes-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 480px) {
    .about-background {
      column-gap: var(--space-4);
    }

    .about-introduction {
      grid-template-columns: minmax(0, 1fr);
    }

    .about-portrait {
      justify-self: center;
    }

    .education-entry {
      grid-template-columns: minmax(0, 1fr);
      gap: var(--space-1);
    }

    .contact-link {
      font-size: var(--font-size-md);
    }
  }
}
</style>
