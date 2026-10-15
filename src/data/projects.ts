export interface ProjectSection {
  id: string
  title: string
  content: string | null
}
export interface PortfolioProject {
  slug: string
  title: string
  categories: string[]
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
      { id: 'overview', title: '作品背景', content: null },
      { id: 'process', title: '設計過程', content: null },
      { id: 'deliverables', title: '作品呈現', content: null },
    ],
  },
  {
    slug: 'project-02',
    title: 'PAPAGO',
    categories: ['LINE BOT', 'ILLUSTRATION'],
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
