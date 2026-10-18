export interface ProjectSection {
  id: string
  title: string
  content: string | null
  label?: string
  subtitle?: string
  paragraphs?: string[]
  tagline?: string
  items?: ProjectSection[]
  media?:
    { type: 'video'; src: string; poster?: string } | { type: 'image'; src: string; alt: string }
}
export interface PortfolioProject {
  slug: string
  title: string
  categories: string[]
  designYear: string
  year: string | null
  role: string | null
  summary: string | null
  cover: { src: string; alt: string; width: number; height: number } | null
  sections: ProjectSection[]
}
// 保留既有 slug，讓已分享的作品網址繼續有效；未提供的介紹內容維持占位。
export const projects: PortfolioProject[] = [
  {
    slug: 'project-01',
    title: '跑者菲迪 Pheidi the Runner',
    categories: ['WEB DESIGN', 'ILLUSTRATION'],
    designYear: '2026',
    year: null,
    role: null,
    summary: '新手跑者養成網站',
    cover: {
      src: '/images/projects/pheidi-the-runner/cover.jpg',
      alt: '跑者菲迪 Pheidi the Runner 作品封面',
      width: 3508,
      height: 2480,
    },
    sections: [
      {
        id: 'design-concept',
        title: '設計理念',
        label: 'SECTION 01',
        subtitle: 'DESIGN CONCEPT',
        content: null,
        items: [
          {
            id: 'design-concept-insight',
            label: 'INSIGHT — 設計洞察',
            title: '跑步容易開始，卻不容易持續。',
            content: null,
            paragraphs: [
              '對新手跑者而言，缺乏目標、成就感與持續的動力，往往讓跑步逐漸變得枯燥，甚至中途放棄。',
            ],
          },
          {
            id: 'design-concept-concept',
            label: 'CONCEPT — 設計概念',
            title: '用遊戲化的方式，讓跑步成為值得期待的日常。',
            content: null,
            paragraphs: [
              '因此，以「遊戲化習慣養成」為核心，設計出陪伴新手跑者建立跑步習慣的網站——「跑者菲迪 Pheidi the Runner」。',
              '透過跑步紀錄、階段成長與成就徽章，讓每一次努力都被看見；結合跑步知識與跑友交流，讓跑步不再只是獨自堅持的過程。',
            ],
          },
          {
            id: 'design-concept-vision',
            label: 'VISION — 品牌願景',
            title: '陪你開始，伴你成長。',
            content: null,
            tagline: 'START・GROW・WITH YOU',
            paragraphs: [
              '用遊戲化建立期待，用知識建立信心，用陪伴養成習慣。',
              '希望陪伴每一位新手跑者勇敢踏出第一步，逐漸養成跑步習慣，並在每一次奔跑中持續成長。',
            ],
          },
        ],
      },
      {
        id: 'website-overview',
        label: 'SECTION 02',
        title: '網站介紹',
        subtitle: 'WEBSITE OVERVIEW',
        content: null,
        items: [
          {
            id: 'intro',
            label: '01 / INTRO ANIMATION',
            title: '序章動畫',
            content: '序章動畫內文',
            media: { type: 'video', src: '/videos/projects/pheidi-the-runner/intro.mp4' },
          },
          {
            id: 'login',
            label: '02 / LOGIN',
            title: '登入',
            content: '登入內文',
            media: { type: 'video', src: '/videos/projects/pheidi-the-runner/login.mp4' },
          },
          {
            id: 'home',
            label: '03 / HOME',
            title: '首頁',
            content: '首頁內文',
            media: { type: 'video', src: '/videos/projects/pheidi-the-runner/home.mp4' },
          },
          {
            id: 'records',
            label: '04 / RUNNING RECORD',
            title: '新增跑步紀錄',
            content: '新增跑步紀錄內文',
            media: { type: 'video', src: '/videos/projects/pheidi-the-runner/records.mp4' },
          },
          {
            id: 'station',
            label: '05 / RUNNING STATION',
            title: '足跡驛站',
            content: '足跡驛站內文',
            media: { type: 'video', src: '/videos/projects/pheidi-the-runner/station.mp4' },
          },
          {
            id: 'academy',
            label: '06 / RUNNING ACADEMY',
            title: '跑者學院',
            content: '跑者學院內文',
            media: { type: 'video', src: '/videos/projects/pheidi-the-runner/academy.mp4' },
          },
          {
            id: 'plaza',
            label: '07 / RUNNER PLAZA',
            title: '菲迪廣場',
            content: '菲迪廣場內文',
            media: { type: 'video', src: '/videos/projects/pheidi-the-runner/plaza.mp4' },
          },
          {
            id: 'admin',
            label: '08 / ADMIN DASHBOARD',
            title: '管理者後台',
            content: '管理者後台內文',
            media: { type: 'video', src: '/videos/projects/pheidi-the-runner/admin.mp4' },
          },
        ],
      },
    ],
  },
  {
    slug: 'project-02',
    title: 'PAPAGO',
    categories: ['LINE BOT', 'ILLUSTRATION'],
    designYear: '2026',
    year: null,
    role: null,
    summary: '一查即停 尋找路邊停車位機器人',
    cover: {
      src: '/images/projects/papago/cover.jpg',
      alt: 'PAPAGO 作品封面',
      width: 3508,
      height: 2480,
    },
    sections: [
      { id: 'overview', title: '作品背景', content: null },
      { id: 'process', title: '設計過程', content: null },
      { id: 'deliverables', title: '作品呈現', content: null },
    ],
  },
  {
    slug: 'project-03',
    title: 'APOLLO',
    categories: ['PACKAGING DESIGN', 'ILLUSTRATION'],
    designYear: '2022 - 2025',
    year: null,
    role: null,
    summary: '品牌視覺設計',
    cover: {
      src: '/images/projects/apollo/cover.jpg',
      alt: 'APOLLO 作品封面',
      width: 3508,
      height: 2480,
    },
    sections: [
      { id: 'overview', title: '作品背景', content: null },
      { id: 'process', title: '設計過程', content: null },
      { id: 'deliverables', title: '作品呈現', content: null },
    ],
  },
  {
    slug: 'project-04',
    title: 'R4D',
    categories: ['PACKAGING DESIGN', 'ILLUSTRATION'],
    designYear: '2021 - 2024',
    year: null,
    role: null,
    summary: '品牌視覺設計',
    cover: {
      src: '/images/projects/r4d/cover.jpg',
      alt: 'R4D 作品封面',
      width: 3508,
      height: 2480,
    },
    sections: [
      { id: 'overview', title: '作品背景', content: null },
      { id: 'process', title: '設計過程', content: null },
      { id: 'deliverables', title: '作品呈現', content: null },
    ],
  },
  {
    slug: 'project-05',
    title: '初次見麵',
    categories: ['PRODUCT DESIGN', 'PACKAGING DESIGN', 'ILLUSTRATION'],
    designYear: '2017',
    year: null,
    role: null,
    summary: '台灣麵食主題肥皂',
    cover: {
      src: '/images/projects/chu-ci-jian-mian/cover.jpg',
      alt: '初次見麵 作品封面',
      width: 3508,
      height: 2480,
    },
    sections: [
      { id: 'overview', title: '作品背景', content: null },
      { id: 'process', title: '設計過程', content: null },
      { id: 'deliverables', title: '作品呈現', content: null },
    ],
  },
]
