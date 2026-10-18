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
            content:
              '透過角色插畫與動態視覺，帶領使用者進入跑者菲迪的世界。以輕鬆活潑的方式建立第一印象，傳達「陪你開始，伴你成長」的品牌精神，讓每一段跑步旅程從充滿期待的序章展開。',
            media: { type: 'video', src: '/videos/projects/pheidi-the-runner/intro.mp4' },
          },
          {
            id: 'login',
            label: '02 / LOGIN',
            title: '登入',
            content:
              '透過簡潔直覺的登入與註冊介面，降低新手開始使用網站的門檻。建立專屬的跑者帳號，保存個人的跑步紀錄與成長歷程，從這裡展開屬於自己的跑步旅程。',
            media: { type: 'video', src: '/videos/projects/pheidi-the-runner/login.mp4' },
          },
          {
            id: 'home',
            label: '03 / HOME',
            title: '首頁',
            content:
              '首頁整合跑者階段、成長進度與個人跑步概況，讓使用者快速掌握目前的成果與下一階段目標。搭配菲迪日報的天氣資訊、跑者學院推薦及阿里的貼心提醒，讓每一次回訪都有新的期待與方向。',
            media: { type: 'video', src: '/videos/projects/pheidi-the-runner/home.mp4' },
          },
          {
            id: 'records',
            label: '04 / RUNNING RECORD',
            title: '新增跑步紀錄',
            content:
              '透過直覺化的表單，記錄每一次跑步的時間、距離、地點與心得，並可搭配照片留下當下的回憶。讓原本單純的跑步數據，轉化成看得見的成長足跡，累積屬於自己的跑者旅程。',
            media: { type: 'video', src: '/videos/projects/pheidi-the-runner/records.mp4' },
          },
          {
            id: 'station',
            label: '05 / RUNNING STATION',
            title: '足跡驛站',
            content:
              '以月曆與跑步紀錄呈現個人的運動歷程，方便回顧每一次努力與進步。透過累積紀錄與成長回饋，讓使用者看見自己的堅持，從每一個小小的成就中獲得持續前進的動力。',
            media: { type: 'video', src: '/videos/projects/pheidi-the-runner/station.mp4' },
          },
          {
            id: 'academy',
            label: '06 / RUNNING ACADEMY',
            title: '跑者學院',
            content:
              '針對新手跑者的需求，整理學習、裝備、補給與賽事四大類跑步知識。透過容易理解的文章內容，陪伴使用者逐步建立正確觀念，減少入門時的迷惘，讓每一次出發都更有信心。',
            media: { type: 'video', src: '/videos/projects/pheidi-the-runner/academy.mp4' },
          },
          {
            id: 'plaza',
            label: '07 / RUNNER PLAZA',
            title: '菲迪廣場',
            content:
              '打造讓跑者交流與分享的互動空間，透過動態貼文、留言與活動情報，串起彼此的跑步日常。讓使用者不只能記錄自己的成長，也能從其他跑者的經驗與鼓勵中獲得支持，感受一起前進的力量。',
            media: { type: 'video', src: '/videos/projects/pheidi-the-runner/plaza.mp4' },
          },
          {
            id: 'admin',
            label: '08 / ADMIN DASHBOARD',
            title: '管理者後台',
            content:
              '建立整合式管理介面，協助管理者掌握網站營運概況，並集中管理玩家、跑者學院文章與菲迪廣場內容。透過清楚的數據呈現與分類管理，提升後台操作效率，讓網站內容與社群互動更容易維護。',
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
