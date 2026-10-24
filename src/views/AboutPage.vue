<script setup lang="ts">
import { onMounted, onUnmounted, useTemplateRef } from 'vue'
import { Mail } from '@lucide/vue'
import ExperienceTimeline from '../components/ExperienceTimeline.vue'
import { experiences } from '../data/experiences'

const educationList = useTemplateRef<HTMLElement>('educationList')
const skillGroupsElement = useTemplateRef<HTMLElement>('skillGroupsElement')
let educationColumnObserver: ResizeObserver | undefined

onMounted(() => {
  const dateColumn = educationList.value?.querySelector<HTMLElement>('.education-entry dt')
  if (!dateColumn) return

  // 沿用學歷實際的年份欄寬，避免寫死字型或文字長度所對應的尺寸。
  const syncColumnWidth = () => {
    skillGroupsElement.value?.style.setProperty(
      '--skill-label-width',
      `${dateColumn.getBoundingClientRect().width}px`,
    )
  }
  syncColumnWidth()
  educationColumnObserver = new ResizeObserver(syncColumnWidth)
  educationColumnObserver.observe(dateColumn)
})

onUnmounted(() => educationColumnObserver?.disconnect())

const education = [
  { years: '2013 - 2017', school: '朝陽科技大學工業設計系' },
  { years: '2010 - 2013', school: '鶯歌高職陶瓷工程科' },
]
const licenses = [
  '網頁設計 丙級技術士',
  '廣告設計 丙級技術士',
  '陶瓷石膏模 丙級技術士',
  'AutoCAD 國際認證',
]
const skillGroups = [
  {
    id: 'visual-design',
    title: '視覺設計',
    skills: ['Illustrator', 'Photoshop', 'Figma', 'Procreate'],
  },
  {
    id: 'frontend',
    title: '前端開發',
    skills: ['HTML', 'CSS', 'JavaScript', 'Vue 3', 'Git','GitHub'],
  },
  { id: 'digital-tools', title: '數位工具', skills: ['ChatGPT', 'Codex', 'Microsoft Office'] },
]
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
    <header class="content-section">
      <div class="about-introduction">
        <img
          class="about-portrait"
          src="/images/profile/fang.JPG"
          alt="正芳 Fang 的個人照片"
          width="2268"
          height="4032"
          decoding="async"
        />
        <div class="about-heading">
          <h1 class="about-title">正芳 Fang</h1>
          <a class="text-link contact-link" href="mailto:skin84121@gmail.com">
            <Mail class="contact-icon" aria-hidden="true" />
            <span>skin84121@gmail.com</span>
          </a>
        </div>
        <p class="about-intro">
          我是一名平面設計師，過去累積約八年的品牌視覺、包裝與插畫設計經驗，近期開始學習前端網頁設計，透過開發網站專案，將視覺設計延伸至數位介面、互動體驗與功能實作。我特別重視設計系統與互動細節，希望讓設計不只具有鮮明的視覺風格，也能帶來直覺、實用的使用體驗。
        </p>
      </div>
    </header>
    <section class="content-section about-background" aria-label="學歷、證照與技能">
      <div class="about-content about-background-content">
        <section class="stack" aria-labelledby="about-education">
          <h2 id="about-education" class="about-section-title">學歷 Education</h2>
          <dl ref="educationList" class="education-list">
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
          <div ref="skillGroupsElement" class="skill-groups">
            <section
              v-for="(group, groupIndex) in skillGroups"
              :key="group.id"
              class="skill-group"
              :aria-labelledby="`skill-group-${group.id}`"
            >
              <div class="skill-group-heading">
                <span class="skill-group-number" aria-hidden="true">{{
                  String(groupIndex + 1).padStart(2, '0')
                }}</span>
                <h3 :id="`skill-group-${group.id}`" class="skill-group-title">{{ group.title }}</h3>
              </div>
              <ul class="skills-list" role="list">
                <li v-for="skill in group.skills" :key="skill" class="skill-item">{{ skill }}</li>
              </ul>
            </section>
          </div>
        </section>
      </div>
    </section>
    <section class="content-section about-experience" aria-label="經歷">
      <div class="about-content">
        <ExperienceTimeline :entries="experiences" />
      </div>
    </section>
    <section class="content-section stack" aria-labelledby="about-likes">
      <h2 id="about-likes" class="about-title about-section-title">喜愛 Likes</h2>
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
  .about-heading {
    grid-area: heading;
    display: grid;
    gap: var(--space-3);
  }

  .about-title {
    text-align: center;
  }

  .about-heading .about-title,
  .about-intro {
    color: var(--palette-blue);
  }

  .about-section-title {
    color: var(--palette-blue);
  }

  .about-introduction {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
    grid-template-areas:
      'portrait heading'
      'portrait intro';
    align-items: center;
    gap: var(--space-6) var(--space-8);
    max-width: var(--layout-text-width);
    margin-inline: auto;
  }

  .about-portrait {
    grid-area: portrait;
    width: 100%;
    max-width: 14rem;
    height: auto;
    aspect-ratio: 7 / 10;
    border-radius: var(--radius-full);
    object-fit: cover;
    object-position: center 60%;
  }

  .about-intro {
    grid-area: intro;
    min-width: 0;
    text-align: center;
  }

  /* 與作品介紹內文共用閱讀寬度，置中後保留兩側留白。 */
  .about-content {
    width: min(100%, var(--layout-text-width));
    margin-inline: auto;
  }

  /* 外層留白沿用作品介紹視窗的內距與斷點。 */
  .about-background,
  .about-experience {
    padding-inline: var(--space-16);
  }

  .about-background-content {
    display: grid;
    /* 保留原本 48px 欄距下的學歷欄寬，新增間距由證照欄吸收。 */
    grid-template-columns: calc((100% - var(--space-12)) / 2) minmax(0, 1fr);
    align-items: start;
    gap: var(--space-12) var(--space-16);
  }

  .about-skills {
    grid-column: 1 / -1;
  }

  .education-list,
  .license-list,
  .skill-groups {
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

  .skill-groups {
    max-width: var(--layout-text-width);
    padding-block: var(--space-6);
  }

  .skill-group {
    display: grid;
    grid-template-columns: var(--skill-label-width, max-content) minmax(0, 1fr);
    align-items: start;
    gap: var(--space-3) var(--space-6);
  }

  .skill-group-heading {
    display: grid;
    grid-template-columns: 2ch max-content;
    align-items: baseline;
    gap: var(--space-3);
  }

  .skill-group-title {
    font: inherit;
    letter-spacing: inherit;
  }

  .skills-list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2) var(--space-3);
    color: var(--color-text);
  }

  .skill-item {
    display: inline-flex;
    flex-shrink: 0;
    white-space: nowrap;
  }

  .skill-item:not(:last-child)::after {
    content: '/';
    margin-inline-start: var(--space-3);
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
    font-size: var(--font-size-md);
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

  .contact-link:focus-visible {
    text-decoration: underline;
  }

  @media (hover: hover) and (pointer: fine) {
    .contact-link:hover {
      text-decoration: underline;
    }

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
    .about-introduction {
      grid-template-columns: minmax(0, 1fr);
      grid-template-areas:
        'portrait'
        'heading'
        'intro';
    }

    .about-portrait {
      justify-self: center;
    }

    .about-background,
    .about-experience {
      padding-inline: var(--space-12);
    }

    .about-background-content {
      grid-template-columns: minmax(0, 1fr);
    }

    .skill-group {
      grid-template-columns: minmax(0, 1fr);
    }

    .likes-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 480px) {
    .about-background,
    .about-experience {
      padding-inline: var(--space-6);
    }

    .education-entry {
      grid-template-columns: minmax(0, 1fr);
      gap: var(--space-1);
    }

    .contact-link {
      font-size: var(--font-size-sm);
    }
  }
}
</style>
