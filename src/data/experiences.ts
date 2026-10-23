export interface ExperienceItem {
  text: string
  type?: 'award' | 'nomination'
}

export interface ExperienceYear {
  year: number
  items: ExperienceItem[]
}

export const experiences: ExperienceYear[] = [
  {
    year: 2026,
    items: [{ text: '參與 勞動部勞動力發展署職前訓練「前端技術與 AI 應用」課程' }],
  },
  {
    year: 2021,
    items: [{ text: '擔任 恬品軒企業有限公司 設計 ( 2021 - 2025 )' }],
  },
  { year: 2018, items: [{ text: '參與 杭州文博會' }] },
  {
    year: 2017,
    items: [
      { text: '擔任 奇軒包裝有限公司 設計 ( 2017 - 2021 )' },
      { text: '參與 創藝多腦河節目 採訪' },
      { text: '獲得 文創之星創意概念組傳承創新 金獎', type: 'award' },
      { text: '金點新秀年度最佳設計獎 入圍', type: 'nomination' },
      { text: '金點新秀贊助特別獎 入圍', type: 'nomination' },
      { text: 'A+創意季 視覺設計組 入圍', type: 'nomination' },
      { text: '參與 新一代設計展 / A+創意季' },
      { text: '參與 朝陽科大工設系106級畢業專刊 編輯製作' },
      { text: '擔任 朝陽科大設計學院辦公室 工讀生' },
    ],
  },
  {
    year: 2016,
    items: [
      { text: '參與 韓國首爾發明展' },
      { text: '擔任 台中舊城散步特展 展覽人員' },
      { text: '擔任 中區再生基地 實習生' },
      { text: '獲得 校內創意好點子設計競賽 佳作', type: 'award' },
      { text: '獲得 Red Dot Design Award 入選', type: 'nomination' },
      { text: '擔任 畢籌會 執行秘書' },
      { text: '獲得 青年設計大賽 優選', type: 'award' },
      { text: '獲得 工研院產學合作案 第四名', type: 'award' },
      { text: '擔任 創造力講座課程 助教' },
    ],
  },
  {
    year: 2015,
    items: [{ text: '參與 國際設計競賽培訓營 Red Dot Design Award／IF World Design Guide' }],
  },
  { year: 2014, items: [{ text: '擔任 鶯歌陶瓷博物館教學助理（拉坯／注漿教學）' }] },
  { year: 2013, items: [{ text: '獲得 三鶯藝術村愛泥一四畢業展 佳作', type: 'award' }] },
]
