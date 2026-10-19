export interface ProjectSection {
  id: string
  title: string
  content: string | null
  label?: string
  subtitle?: string
  paragraphs?: string[]
  tagline?: string
  items?: ProjectSection[]
  note?: string
  links?: { label: string; href: string }[]
  flow?: { label: string; steps: string[] }
  media?:
    | { type: 'video'; src: string; poster?: string }
    | {
        type: 'image'
        src: string
        alt: string
        variant?: 'default' | 'phone' | 'qr-code'
        width?: number
        height?: number
      }
}
export interface PortfolioProject {
  slug: string
  title: string
  categories: string[]
  designYear: string
  year: string | null
  role: string | null
  summary: string | null
  websiteUrl?: string
  cover: { src: string; alt: string; width: number; height: number } | null
  sections: ProjectSection[]
}
// 每次建立獨立的章節資料，未來補作品內容時不會連動到其他作品。
function createPlaceholderSections(): ProjectSection[] {
  return [
    {
      id: 'design-concept',
      label: 'SECTION 01',
      title: '設計理念',
      subtitle: 'DESIGN CONCEPT',
      content: null,
      items: [{ id: 'concept', label: 'CONCEPT', title: '理念說明', content: null }],
    },
    {
      id: 'project-overview',
      label: 'SECTION 02',
      title: '作品介紹',
      subtitle: 'PROJECT OVERVIEW',
      content: null,
      items: [{ id: 'overview', label: '01 / PROJECT', title: '作品內容', content: null }],
    },
  ]
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
    websiteUrl: 'https://pheidi-the-runner.vercel.app',
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
      {
        id: 'design-concept',
        label: 'SECTION 01',
        title: '設計理念',
        subtitle: 'DESIGN CONCEPT',
        content: null,
        items: [
          {
            id: 'insight',
            label: 'INSIGHT — 設計洞察',
            title: '找車位不容易，找回愛車也很麻煩。',
            content: null,
            paragraphs: [
              '在台北市與新北市，開車出門經常需要花費不少時間尋找路邊停車位。即使順利停好車，也可能因為不熟悉周遭環境，而忘記愛車停放的位置。',
              '如何減少尋找車位的時間，並讓停車與取車的過程更加便利，成為這次專案想解決的問題。',
            ],
          },
          {
            id: 'concept',
            label: 'CONCEPT — 設計概念',
            title: '透過 LINE，讓停車資訊一查即得。',
            content: null,
            paragraphs: [
              '以使用者熟悉的 LINE 作為操作介面，結合即時停車資訊，開發出「PAPAGO 一查即停」停車小幫手。',
              '不需要額外下載 App，只要分享位置，就能查詢附近的路邊空停車位，並透過記住停車位置與導航功能，讓停車體驗更加輕鬆。',
            ],
          },
          {
            id: 'vision',
            label: 'VISION — 設計目標',
            title: '一按即查，一查即停。',
            content:
              '希望透過簡單直覺的互動方式，降低查詢停車資訊的操作門檻，減少駕駛尋找車位的負擔，讓每一次停車都能更有效率。',
          },
        ],
      },
      {
        id: 'line-bot-overview',
        label: 'SECTION 02',
        title: '機器人介紹',
        subtitle: 'LINE BOT OVERVIEW',
        content: null,
        items: [
          {
            id: 'find-parking',
            label: '01 / FIND PARKING',
            title: '尋找空停車位',
            content:
              '透過 LINE 分享目前位置，即可查詢附近最近的三個路邊空停車位，查看停車格資訊及距離，並透過導航連結前往目的地，減少尋找停車位所花費的時間。',
            media: {
              type: 'image',
              src: '/images/projects/papago/find-parking.png',
              alt: 'PAPAGO 尋找空停車位：LINE 對話顯示附近停車格、距離與導航按鈕',
              variant: 'phone',
              width: 945,
              height: 1925,
            },
          },
          {
            id: 'save-parking',
            label: '02 / SAVE PARKING LOCATION',
            title: '記住停車位置',
            content:
              '停好車後，點選「記住停車位置」，再透過 LINE 分享停車地點，就能記錄愛車的停放位置，避免因不熟悉周遭環境而忘記停車地點。',
            media: {
              type: 'image',
              src: '/images/projects/papago/save-parking.png',
              alt: 'PAPAGO 記住停車位置：透過 LINE 分享位置並確認已記錄停車地點',
              variant: 'phone',
              width: 945,
              height: 1925,
            },
          },
          {
            id: 'navigate-to-car',
            label: '03 / NAVIGATE TO CAR',
            title: '導航愛車位置',
            content:
              '準備取車時，只要點選「導航愛車位置」，即可取得 Google Maps 導航連結，快速返回先前記錄的停車地點，讓取車更加方便。',
            media: {
              type: 'image',
              src: '/images/projects/papago/navigate-to-car.png',
              alt: 'PAPAGO 導航愛車位置：LINE 提供返回已記錄停車地點的 Google Maps 連結',
              variant: 'phone',
              width: 945,
              height: 1925,
            },
          },
          {
            id: 'technical-implementation',
            label: '04 / TECHNICAL IMPLEMENTATION',
            title: '技術整合',
            content: null,
            paragraphs: [
              'PAPAGO 以 LINE Bot 作為互動介面，結合 TDX 運輸資料流通服務取得停車資訊，並透過後端程式處理使用者的查詢請求，再將結果回傳至 LINE 對話中。',
              'Node.js 後端整合停車格基本資料與即時狀態，篩選附近空位並依距離排序，透過 LINE Flex Message 回傳最近的三個車位與 Google Maps 導航連結。',
            ],
            flow: {
              label: '停車位查詢流程',
              steps: [
                'LINE 使用者分享位置',
                'Node.js 後端查詢 TDX 停車資料',
                '篩選空位並依距離排序',
                'LINE 回傳最近三個車位',
              ],
            },
          },
          {
            id: 'line-account',
            label: '05 / LINE ACCOUNT',
            title: 'LINE 官方帳號',
            content:
              'PAPAGO 透過 LINE 提供停車相關功能，使用者可在熟悉的聊天介面中完成停車位查詢、位置記錄及導航操作。',
            media: {
              type: 'image',
              src: '/images/projects/papago/line-profile.png',
              alt: 'PAPAGO LINE 官方帳號個人檔案與加入好友畫面',
              variant: 'phone',
              width: 945,
              height: 1925,
            },
          },
          {
            id: 'add-friend',
            label: '06 / ADD FRIEND',
            title: '加入 PAPAGO 好友',
            content:
              '使用手機掃描下方 QR Code，即可前往 PAPAGO 的 LINE 官方帳號，體驗停車位查詢與愛車位置記錄功能。',
            media: {
              type: 'image',
              src: '/images/projects/papago/line-qr-code.png',
              alt: '加入 PAPAGO LINE 官方帳號好友的 QR Code',
              variant: 'qr-code',
              width: 360,
              height: 360,
            },
            note: '機器人部署於 Render，若伺服器進入休眠，首次回應可能稍有延遲，請稍候再試。',
          },
        ],
      },
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
    sections: createPlaceholderSections(),
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
    sections: createPlaceholderSections(),
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
    sections: createPlaceholderSections(),
  },
]
