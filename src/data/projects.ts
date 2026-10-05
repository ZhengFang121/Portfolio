export interface ProjectSection {
  id: string
  title: string
  content: string | null
}
export interface PortfolioProject {
  slug: string
  title: string
  category: string | null
  year: string | null
  role: string | null
  summary: string | null
  cover: { src: string; alt: string; width: number; height: number } | null
  sections: ProjectSection[]
}
// 作品名稱與內容待確認；暫定網址不猜測資料夾中的作品。
export const projects: PortfolioProject[] = Array.from({ length: 6 }, (_, index) => ({
  slug: `project-${String(index + 1).padStart(2, '0')}`,
  title: `主要作品 ${String(index + 1).padStart(2, '0')}（名稱待補）`,
  category: null,
  year: null,
  role: null,
  summary: null,
  cover: null,
  sections: [
    { id: 'overview', title: '作品背景', content: null },
    { id: 'process', title: '設計過程', content: null },
    { id: 'deliverables', title: '作品呈現', content: null },
  ],
}))
