export interface ProjectImage {
  src: string
  alt: string
  width?: number
  height?: number
}

export interface ProjectCatalogItem {
  id: string
  title: string
  description: string
  image: ProjectImage
}

export interface ProjectCatalogGroup {
  id: string
  title: string
  items: ProjectCatalogItem[]
}

// 同一子段落可依序穿插文字與圖片，不必增加主要章節。
export interface ProjectContentBlock {
  id: string
  label: string
  title?: string
  content: string
  images?: ProjectImage[]
  imageLayout?: 'feature-grid'
}

export interface ProjectAward {
  name: string
  category: string
  recognition: string
}

export interface ProjectSection {
  id: string
  title?: string
  content?: string | null
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
    | (ProjectImage & {
        type: 'image'
        variant?: 'default' | 'phone' | 'qr-code' | 'logo'
      })
  images?: ProjectImage[]
  imageLayout?: 'card-grid' | 'stack' | 'qr-phone'
  catalog?: ProjectCatalogGroup[]
  blocks?: ProjectContentBlock[]
}
export interface PortfolioProject {
  // 既有識別碼用於精選作品、章節 ID 與舊網址；routeSlug 只決定公開網址。
  slug: string
  routeSlug: string
  title: string
  categories: string[]
  designYear: string
  year: string | null
  role: string | null
  summary: string | null
  websiteUrl?: string
  awards?: ProjectAward[]
  cover: { src: string; alt: string; width: number; height: number } | null
  sections: ProjectSection[]
}
// 保留既有 slug，讓已分享的作品網址繼續有效。
export const projects: PortfolioProject[] = [
  {
    slug: 'project-01',
    routeSlug: 'pheidi',
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
        subtitle: 'DESIGN CONCEPT',
        content: null,
        items: [
          {
            id: 'design-concept-insight',
            label: '設計洞察 INSIGHT',
            title: '跑步容易開始，卻不容易持續。',
            content: null,
            paragraphs: [
              '對新手跑者而言，缺乏目標、成就感與持續的動力，往往讓跑步逐漸變得枯燥，甚至想中途放棄。',
            ],
          },
          {
            id: 'design-concept-concept',
            label: '設計概念 CONCEPT',
            title: '用遊戲化的方式，讓跑步成為值得期待的日常。',
            content: null,
            paragraphs: [
              '以「遊戲化」為構思核心，設計出陪伴新手跑者建立跑步習慣的網站 - 「跑者菲迪 Pheidi the Runner」。透過跑步紀錄、階段成長與成就徽章，讓每一次努力都被看見；結合跑步知識與跑友交流，讓跑步不再只是獨自堅持的過程。',
            ],
          },
          {
            id: 'design-concept-vision',
            label: '品牌願景 VISION',
            title: '陪你開始 伴你成長',
            content: null,
            tagline: 'START・GROW・WITH YOU',
            paragraphs: [
              '用遊戲化建立期待，用知識培養信心，用陪伴養成習慣。希望陪伴每一位新手跑者勇敢踏出第一步，逐漸養成跑步習慣，並在每一次奔跑中持續成長。',
            ],
          },
        ],
      },
      {
        id: 'website-overview',
        title: '作品介紹',
        subtitle: 'PROJECT OVERVIEW',
        content: null,
        items: [
          {
            id: 'intro',
            label: '01 / INTRO ANIMATION',
            title: '序章動畫',
            content:
              '使用點擊或滑動滾輪來讓動畫進行，透過角色插畫與動態視覺，帶領使用者進入跑者菲迪的世界。以輕鬆活潑的方式建立第一印象，傳達「陪你開始 伴你成長」的品牌精神，讓每一段跑步旅程從充滿期待的序章展開。',
            media: { type: 'video', src: '/videos/projects/pheidi-the-runner/intro.mp4' },
          },
          {
            id: 'login',
            label: '02 / LOGIN & REGISTER',
            title: '登入註冊',
            content:
              '透過簡潔直覺的登入與註冊介面，降低新手開始使用網站的門檻。建立專屬的跑者帳號，保存個人的跑步紀錄與成長歷程，從這裡展開屬於自己的跑步旅程。',
            media: { type: 'video', src: '/videos/projects/pheidi-the-runner/login.mp4' },
          },
          {
            id: 'home',
            label: '03 / HOME',
            title: '首頁',
            content:
              '首頁整合跑者階段、成長進度與個人跑步概況，讓使用者快速掌握目前的成果與下一階段目標。搭配菲迪日報的資訊內容，讓每一次回訪都有新的期待與方向。',
            media: { type: 'video', src: '/videos/projects/pheidi-the-runner/home.mp4' },
          },
          {
            id: 'records',
            label: '04 / RUNNING RECORD',
            title: '新增跑步紀錄',
            content:
              '透過直覺化的表單，記錄每一次跑步的時間、距離、地點與心得，並可搭配照片留下當時的回憶。讓原本單純的跑步數據，轉化成看得見的成長足跡，累積屬於自己的跑者旅程。',
            media: { type: 'video', src: '/videos/projects/pheidi-the-runner/records.mp4' },
          },
          {
            id: 'station',
            label: '05 / RUNNING STATION',
            title: '足跡驛站',
            content:
              '以月曆方式呈現個人的跑步歷程，方便回顧每一次努力與進步。同時設計成就徽章系統，透過累積跑步次數、里程與完成不同挑戰來解鎖徽章。透過累積紀錄與成長回饋，讓使用者看見自己的堅持，從每一個小小的成就中獲得持續前進的動力。',
            media: { type: 'video', src: '/videos/projects/pheidi-the-runner/station.mp4' },
          },
          {
            id: 'academy',
            label: '06 / RUNNING ACADEMY',
            title: '跑者學院',
            content:
              '針對新手跑者的需求，整理學習、裝備、補給與賽事四大類跑步知識。文章依照跑者階段逐步解鎖，避免一次接收過多資訊造成負擔，讓使用者能依照自己的成長進度循序學習、建立正確觀念，並在每一次出發時更有信心。',
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
    routeSlug: 'papago',
    title: 'PAPAGO',
    categories: ['LINE BOT', 'ILLUSTRATION'],
    designYear: '2026',
    year: null,
    role: null,
    summary: '尋找路邊停車位機器人',
    cover: {
      src: '/images/projects/papago/cover.jpg',
      alt: 'PAPAGO 作品封面',
      width: 3508,
      height: 2480,
    },
    sections: [
      {
        id: 'design-concept',
        title: '設計理念',
        subtitle: 'DESIGN CONCEPT',
        content: null,
        items: [
          {
            id: 'insight',
            label: '設計洞察 INSIGHT',
            title: '找車位不容易，找回愛車也很麻煩。',
            content: null,
            paragraphs: [
              '在台北市與新北市，開車出門經常需要花費不少時間尋找路邊停車位。即使順利停好車，也可能因為不熟悉周遭環境，而忘記愛車停放的位置。如何減少尋找車位的時間，並讓停車與取車的過程更加便利，成為這次專案想解決的問題。',
            ],
          },
          {
            id: 'concept',
            label: '設計概念 CONCEPT',
            title: '透過 LINE，讓停車資訊一查即得。',
            content: null,
            paragraphs: [
              '以使用者熟悉的 LINE 作為操作介面，結合即時停車資訊，開發出「PAPAGO 一查即停」停車小幫手。',
              '不需要額外下載 App，只要分享位置，就能查詢附近的路邊空停車位，並透過記住停車位置與導航功能，讓停車體驗更加輕鬆。',
            ],
          },
          {
            id: 'vision',
            label: '設計目標 VISION',
            title: '一按即查，一查即停。',
            content:
              '希望透過簡單直覺的互動方式，降低查詢停車資訊的操作門檻，減少駕駛尋找車位的負擔，讓每一次停車都能更有效率。',
          },
        ],
      },
      {
        id: 'line-bot-overview',
        title: '作品介紹',
        subtitle: 'PROJECT OVERVIEW',
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
            note: '機器人部署於 Render，若伺服器進入休眠，首次回應可能稍有延遲，請稍候再試。',
          },
          {
            id: 'add-friend',
            label: '05 / ADD FRIEND',
            title: '加入 PAPAGO 好友',
            content:
              '使用手機掃描下方 QR Code，即可前往 PAPAGO 的 LINE 官方帳號，體驗停車位查詢與愛車位置記錄功能。',
            imageLayout: 'qr-phone',
            images: [
              {
                src: '/images/projects/papago/line-qr-code.png',
                alt: '加入 PAPAGO LINE 官方帳號好友的 QR Code',
                width: 360,
                height: 360,
              },
              {
                src: '/images/projects/papago/line-profile.png',
                alt: 'PAPAGO LINE 官方帳號個人檔案與加入好友畫面',
                width: 945,
                height: 1925,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: 'project-03',
    routeSlug: 'apollo',
    title: 'APOLLO',
    categories: ['PACKAGING DESIGN', 'ILLUSTRATION'],
    designYear: '2022 - 2025',
    year: null,
    role: null,
    summary: '咖啡品牌視覺設計',
    cover: {
      src: '/images/projects/apollo/cover.webp',
      alt: 'APOLLO 作品封面',
      width: 1448,
      height: 1086,
    },
    sections: [
      {
        id: 'apollo-design-concept',
        title: '設計理念',
        subtitle: 'DESIGN CONCEPT',
        content: null,
        items: [
          {
            id: 'apollo-design-insight',
            label: '設計洞察 INSIGHT',
            title: '讓不同的咖啡風味，擁有清楚而一致的視覺呈現。',
            content:
              '咖啡產品具有不同的烘焙程度與風味特色，如何在維持品牌一致性的同時，清楚呈現各款產品的差異，是包裝設計的重要課題。',
          },
          {
            id: 'apollo-design-approach',
            label: '設計概念 CONCEPT',
            title: '以原創插畫，延伸咖啡品牌的視覺魅力。',
            content: null,
            paragraphs: [
              '以既有品牌識別為基礎，結合原創插畫、色彩搭配與版面設計，將品牌視覺延伸至濾掛咖啡包裝、咖啡豆介紹卡、禮盒與周邊商品。',
            ],
          },
          {
            id: 'apollo-design-goal',
            label: '設計目標 VISION',
            title: '讓產品保有特色，讓品牌保持一致。',
            content: '透過系列化的視覺設計，讓不同咖啡產品展現各自特色，同時維持一致的品牌形象。',
          },
        ],
      },
      {
        id: 'apollo-brand-applications',
        title: '作品介紹',
        subtitle: 'PROJECT OVERVIEW',
        content: null,
        items: [
          {
            id: 'apollo-drip-coffee-packaging',
            title: '濾掛咖啡包裝設計',
            media: {
              type: 'image',
              src: '/images/projects/apollo/drip-bag.webp',
              alt: 'APOLLO 濾掛咖啡系列包裝與原創插畫主要展示',
              width: 1448,
              height: 1086,
            },
            images: [
              {
                src: '/images/projects/apollo/drip-bag-light-roast.webp',
                alt: 'APOLLO 淺焙濾掛咖啡包裝視覺',
                width: 1448,
                height: 1086,
              },
              {
                src: '/images/projects/apollo/drip-bag-dark-roast.webp',
                alt: 'APOLLO 深焙濾掛咖啡包裝視覺',
                width: 1448,
                height: 1086,
              },
            ],
          },
          {
            id: 'apollo-gift-box-packaging',
            title: '濾掛咖啡禮盒設計',
            media: {
              type: 'image',
              src: '/images/projects/apollo/drip-bag-box-10pcs.webp',
              alt: 'APOLLO 十入濾掛咖啡禮盒包裝視覺',
              width: 1448,
              height: 1086,
            },
          },
          {
            id: 'apollo-cup-sleeve',
            title: '咖啡杯套設計',
            media: {
              type: 'image',
              src: '/images/projects/apollo/cup-sleeve.webp',
              alt: 'APOLLO 咖啡杯套設計',
              width: 1448,
              height: 1086,
            },
          },
          {
            id: 'apollo-coffee-bean-cards',
            title: '咖啡豆介紹卡設計',
            imageLayout: 'card-grid',
            images: [
              {
                src: '/images/projects/apollo/bean-card-01.webp',
                alt: 'APOLLO 咖啡豆介紹卡 01：原創插畫與版面設計',
                width: 1448,
                height: 1086,
              },
              {
                src: '/images/projects/apollo/bean-card-02.webp',
                alt: 'APOLLO 咖啡豆介紹卡 02：原創插畫與版面設計',
                width: 1448,
                height: 1086,
              },
              {
                src: '/images/projects/apollo/bean-card-03.webp',
                alt: 'APOLLO 咖啡豆介紹卡 03：原創插畫與版面設計',
                width: 1448,
                height: 1086,
              },
              {
                src: '/images/projects/apollo/bean-card-04.webp',
                alt: 'APOLLO 咖啡豆介紹卡 04：原創插畫與版面設計',
                width: 1448,
                height: 1086,
              },
              {
                src: '/images/projects/apollo/bean-card-05.webp',
                alt: 'APOLLO 咖啡豆介紹卡 05：原創插畫與版面設計',
                width: 1448,
                height: 1086,
              },
              {
                src: '/images/projects/apollo/bean-card-06.webp',
                alt: 'APOLLO 咖啡豆介紹卡 06：原創插畫與版面設計',
                width: 1448,
                height: 1086,
              },
            ],
          },
          {
            id: 'apollo-shopping-bag',
            title: '品牌提袋設計',
            media: {
              type: 'image',
              src: '/images/projects/apollo/shopping-bag.webp',
              alt: 'APOLLO 品牌提袋視覺設計',
              width: 1448,
              height: 1086,
            },
          },
        ],
      },
    ],
  },
  {
    slug: 'project-04',
    routeSlug: 'r4d',
    title: 'R4D',
    categories: ['PACKAGING DESIGN', 'ILLUSTRATION'],
    designYear: '2021 - 2024',
    year: null,
    role: null,
    summary: '甜點品牌視覺設計',
    cover: {
      src: '/images/projects/r4d/cover.webp',
      alt: 'R4D 作品封面',
      width: 1448,
      height: 1086,
    },
    sections: [
      {
        id: 'r4d-design-concept',
        title: '設計理念',
        subtitle: 'DESIGN CONCEPT',
        content: null,
        items: [
          {
            id: 'r4d-design-insight',
            label: '設計洞察 INSIGHT',
            title: '甜點的美好體驗，從包裝開始。',
            content:
              '甜點具有豐富的產品種類與包裝形式，除了傳達品牌形象，也需要依照不同商品的特色與使用情境，呈現適合的視覺設計。',
          },
          {
            id: 'r4d-design-approach',
            label: '設計概念 CONCEPT',
            title: '以插畫與包裝設計，增添甜點的視覺魅力。',
            content: null,
            paragraphs: [
              '延續品牌既有的視覺識別，結合親自繪製的原創插畫，將設計應用於蛋糕盒、甜點禮盒、品牌宣傳物與周邊商品。',
              '依照不同甜點的包裝形式與產品特色，調整插畫構圖與版面配置，讓各式包裝保有獨特性，也呈現一致的品牌風格。',
            ],
          },
          {
            id: 'r4d-design-goal',
            label: '設計目標 VISION',
            title: '讓包裝不只是容器，更是品牌體驗的一部分。',
            content:
              '透過包裝視覺與周邊設計的整合，讓品牌形象融入產品展示、選購與送禮等不同情境，延續甜點帶來的美好感受。',
          },
        ],
      },
      {
        id: 'r4d-brand-applications',
        title: '作品介紹',
        subtitle: 'PROJECT OVERVIEW',
        content: null,
        items: [
          {
            id: 'r4d-cake-packaging',
            title: '蛋糕盒包裝設計',
            images: [
              {
                src: '/images/projects/r4d/cake-box-4-inch.webp',
                alt: 'R4D 四吋蛋糕盒包裝視覺與原創插畫',
                width: 1024,
                height: 1536,
              },
              {
                src: '/images/projects/r4d/cake-box-6-inch.webp',
                alt: 'R4D 六吋蛋糕盒包裝視覺與原創插畫',
                width: 1024,
                height: 1536,
              },
            ],
          },
          {
            id: 'r4d-cake-carrier-box',
            title: '切片蛋糕手提盒設計',
            media: {
              type: 'image',
              src: '/images/projects/r4d/cake-slice-carrier-box.webp',
              alt: 'R4D 切片蛋糕手提盒包裝視覺',
              width: 1448,
              height: 1086,
            },
          },
          {
            id: 'r4d-roll-cake-packaging',
            title: '長條蛋糕盒設計',
            media: {
              type: 'image',
              src: '/images/projects/r4d/roll-cake-box.webp',
              alt: 'R4D 長條蛋糕盒插畫構圖與包裝視覺',
              width: 1448,
              height: 1086,
            },
          },
          {
            id: 'r4d-macaron-gift-box',
            title: '馬卡龍禮盒設計',
            media: {
              type: 'image',
              src: '/images/projects/r4d/macaron-gift-box.webp',
              alt: 'R4D 馬卡龍禮盒包裝視覺與原創插畫',
              width: 1024,
              height: 1536,
            },
          },
          {
            id: 'r4d-chocolate-gift-box',
            title: '生巧克力禮盒設計',
            media: {
              type: 'image',
              src: '/images/projects/r4d/nama-chocolate-box.webp',
              alt: 'R4D 生巧克力禮盒包裝視覺與原創插畫',
              width: 1448,
              height: 1086,
            },
          },
          {
            id: 'r4d-promotional-design',
            title: '品牌宣傳物設計',
            media: {
              type: 'image',
              src: '/images/projects/r4d/dm.webp',
              alt: 'R4D 品牌宣傳物圖文編排設計',
              width: 1448,
              height: 1086,
            },
          },
          {
            id: 'r4d-brand-accessories',
            title: '品牌提袋與貼紙設計',
            images: [
              {
                src: '/images/projects/r4d/shopping-bag.webp',
                alt: 'R4D 品牌提袋視覺設計',
                width: 1448,
                height: 1086,
              },
              {
                src: '/images/projects/r4d/sticker.webp',
                alt: 'R4D 品牌貼紙視覺設計',
                width: 1448,
                height: 1086,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: 'project-06',
    routeSlug: 'custom-portrait',
    title: '似顏繪',
    categories: ['ILLUSTRATION'],
    designYear: '2022 - 2023',
    year: null,
    role: null,
    summary: '客製化肖像插畫',
    cover: {
      src: '/images/projects/custom-portrait/cover.jpg',
      alt: '似顏繪：長髮人物與白色小狗的客製化肖像插畫',
      width: 3000,
      height: 3000,
    },
    sections: [
      {
        id: 'project-introduction',
        content:
          '依照客戶提供的照片，繪製專屬的人物與寵物似顏繪。以簡約的手繪線條與柔和的色彩，保留每個角色獨特的外型與神情，將照片中的日常回憶轉化為溫暖且富有個人特色的插畫作品。',
      },
      {
        id: 'project-gallery',
        title: '作品介紹',
        subtitle: 'PROJECT OVERVIEW',
        imageLayout: 'stack',
        images: [
          {
            src: '/images/projects/custom-portrait/01.jpg',
            alt: '似顏繪 01：長髮人物與白色小狗',
            width: 3000,
            height: 3000,
          },
          {
            src: '/images/projects/custom-portrait/02.jpg',
            alt: '似顏繪 02：長髮人物抱著銀灰色虎斑貓',
            width: 3000,
            height: 3000,
          },
          {
            src: '/images/projects/custom-portrait/03.jpg',
            alt: '似顏繪 03：四隻不同毛色與神情的貓咪肖像',
            width: 3000,
            height: 3000,
          },
          {
            src: '/images/projects/custom-portrait/04.jpg',
            alt: '似顏繪 04：戴帽人物抱著棕色虎斑貓',
            width: 3000,
            height: 3000,
          },
          {
            src: '/images/projects/custom-portrait/05.jpg',
            alt: '似顏繪 05：孩童伸手碰觸虎斑白貓的前腳',
            width: 3000,
            height: 3000,
          },
          {
            src: '/images/projects/custom-portrait/06.jpg',
            alt: '似顏繪 06：灰白色貓咪與戴紅色領巾的長毛狗',
            width: 3000,
            height: 3000,
          },
        ],
      },
    ],
  },
  {
    slug: 'project-05',
    routeSlug: 'chu-ci-jian-mian',
    title: '初次見麵',
    categories: ['PRODUCT DESIGN', 'PACKAGING DESIGN', 'ILLUSTRATION'],
    designYear: '2017',
    year: null,
    role: null,
    summary: '台灣麵食文化主題肥皂設計',
    awards: [
      {
        name: '文創之星',
        category: '創意概念組・傳承創新',
        recognition: '金獎',
      },
    ],
    cover: {
      src: '/images/projects/chu-ci-jian-mian/cover.jpg',
      alt: '初次見麵 作品封面',
      width: 3508,
      height: 2480,
    },
    sections: [
      {
        id: 'design-concept',
        title: '設計理念',
        subtitle: 'DESIGN CONCEPT',
        items: [
          {
            id: 'insight',
            label: '設計洞察 INSIGHT',
            title: '熟悉的台灣麵食，承載著生活與文化的記憶。',
            content:
              '台灣麵食不僅是日常飲食的一部分，也蘊含各地的飲食特色與傳統節慶文化。如何透過不同的設計形式，讓人重新認識這些熟悉的文化元素，是本次創作的起點。',
          },
          {
            id: 'concept',
            label: '設計概念 CONCEPT',
            title: '當台灣麵食遇上肥皂，讓文化融入日常。',
            paragraphs: [
              '以台灣麵食文化為靈感，將陽春麵、擔仔麵、水餃、湯圓與麵線轉化為五款造型肥皂，並結合品牌識別與系列包裝設計。',
              '透過麵食的外觀、線條、觸感與氣味，讓使用者在日常生活中，以不同的感官重新體驗台灣麵食文化。',
            ],
            media: {
              type: 'image',
              src: '/images/projects/chu-ci-jian-mian/soap-in-use.jpg',
              alt: '初次見麵麵食造型肥皂的使用情境',
              width: 3543,
              height: 2657,
            },
          },
          {
            id: 'goal',
            label: '設計目標 VISION',
            title: '讓日常用品，成為傳遞文化與記憶的媒介。',
            content:
              '藉由趣味化的產品設計，讓台灣麵食不再只是餐桌上的食物，而是能被觀看、觸摸與使用的文化創意商品，喚起人們對台灣傳統飲食的熟悉感與美好記憶。',
          },
        ],
      },
      {
        id: 'project-overview',
        title: '作品介紹',
        subtitle: 'PROJECT OVERVIEW',
        items: [
          {
            id: 'brand-identity',
            label: '01 / BRAND IDENTITY',
            title: '品牌識別',
            content:
              '「初次見麵」以台灣麵食文化為主題，透過具有書寫感的文字設計，建立品牌識別，並將傳統飲食意象延伸至產品與包裝視覺。',
            media: {
              type: 'image',
              variant: 'logo',
              src: '/images/projects/chu-ci-jian-mian/logo.png',
              alt: '初次見麵品牌識別：具有書寫感的文字標誌',
              width: 1300,
              height: 1831,
            },
          },
          {
            id: 'product-design',
            label: '02 / PRODUCT DESIGN',
            title: '麵食造型肥皂圖鑑',
            content:
              '從台灣日常麵食與傳統節慶中汲取靈感，將陽春麵、擔仔麵、水餃、湯圓與麵線轉化為五款造型肥皂，透過外觀、觸感與使用體驗，賦予熟悉的飲食文化全新樣貌。',
            catalog: [
              {
                id: 'traditional-flavors',
                title: '古早味系列肥皂',
                items: [
                  {
                    id: 'yangchun-noodle',
                    title: '01｜陽春麵的寬麵皂',
                    description:
                      '陽春麵是一種不加上其他菜餚配料的簡單湯麵，常見搭配的麵條為寬麵。將樸實的麵條造型轉化為肥皂，呈現台灣日常飲食的熟悉樣貌。',
                    image: {
                      src: '/images/projects/chu-ci-jian-mian/soap-yangchun-noodle.png',
                      alt: '雙手捧著陽春麵的寬麵造型肥皂',
                      width: 1438,
                      height: 1876,
                    },
                  },
                  {
                    id: 'danzai-noodle',
                    title: '02｜擔仔麵的油麵皂',
                    description:
                      '擔仔麵是發源於台南的傳統小吃，「擔仔」在台語中有挑扁擔之意。以油麵的捲曲線條為靈感，呈現具有地方特色的肥皂造型。',
                    image: {
                      src: '/images/projects/chu-ci-jian-mian/soap-danzai-noodle.png',
                      alt: '雙手捧著擔仔麵的油麵造型肥皂',
                      width: 1402,
                      height: 1769,
                    },
                  },
                ],
              },
              {
                id: 'traditional-festivals',
                title: '傳統節慶系列肥皂',
                items: [
                  {
                    id: 'dumpling',
                    title: '03｜新年水餃皂',
                    description:
                      '台灣新年有吃水餃的習俗，因水餃的形狀如同元寶，象徵吉祥與富貴。將這份年節祝福轉化為造型肥皂。',
                    image: {
                      src: '/images/projects/chu-ci-jian-mian/soap-dumpling.png',
                      alt: '雙手捧著新年水餃造型肥皂',
                      width: 1426,
                      height: 1852,
                    },
                  },
                  {
                    id: 'winter-solstice-tangyuan',
                    title: '04｜冬至湯圓皂',
                    description:
                      '冬至是二十四節氣之一，吃湯圓有團圓及象徵年長一歲的意涵。以粉白相間的湯圓造型，喚起熟悉的節慶記憶。',
                    image: {
                      src: '/images/projects/chu-ci-jian-mian/soap-winter-solstice-tangyuan.png',
                      alt: '雙手捧著粉白相間的冬至湯圓造型肥皂',
                      width: 1417,
                      height: 1775,
                    },
                  },
                  {
                    id: 'grain-rain-noodle',
                    title: '05｜穀雨麵線皂',
                    description:
                      '取材自穀雨節氣與傳統孝親文化，以麵線作為創作元素，將祝福與敬親的文化意涵融入造型肥皂。',
                    image: {
                      src: '/images/projects/chu-ci-jian-mian/soap-grain-rain-noodle.png',
                      alt: '雙手捧著穀雨麵線造型肥皂',
                      width: 1463,
                      height: 1936,
                    },
                  },
                ],
              },
            ],
          },
          {
            id: 'packaging-design',
            label: '03 / PACKAGING DESIGN',
            title: '系列包裝設計',
            content:
              '以台灣傳統飲食文化為設計元素，結合插畫、產品標籤與系列圖紋，將麵食造型肥皂延伸為完整的包裝設計，呈現具有在地特色的品牌視覺。',
            media: {
              type: 'image',
              src: '/images/projects/chu-ci-jian-mian/packaging-collection.jpg',
              alt: '初次見麵麵食造型肥皂系列包裝、插畫與產品標籤',
              width: 2048,
              height: 1365,
            },
          },
          {
            id: 'brand-photography',
            label: '04 / BRAND PHOTOGRAPHY',
            title: '品牌形象照',
            content:
              '透過產品陳列、攝影構圖與色彩搭配，呈現麵食造型肥皂的系列特色，讓產品設計與品牌包裝形成完整的視覺體驗。',
            images: [
              {
                src: '/images/projects/chu-ci-jian-mian/brand-photo-01.jpg',
                alt: '初次見麵品牌形象照 01：麵食造型肥皂與品牌包裝陳列',
                width: 3508,
                height: 2480,
              },
              {
                src: '/images/projects/chu-ci-jian-mian/brand-photo-02.jpg',
                alt: '初次見麵品牌形象照 02：系列產品與包裝攝影',
                width: 2362,
                height: 1670,
              },
            ],
          },
          {
            id: 'achievements-media',
            label: '05 / ACHIEVEMENTS & MEDIA',
            title: '成果與肯定',
            blocks: [
              {
                id: 'award',
                label: 'AWARD — 獲獎紀錄',
                title: '文創之星｜創意概念組・傳承創新 金獎',
                content:
                  '「初次見麵」以台灣麵食文化為創作核心，將傳統飲食元素轉化為具有實用性與文化意涵的造型肥皂，獲得金獎肯定。',
                images: [
                  {
                    src: '/images/projects/chu-ci-jian-mian/exhibition-04.jpg',
                    alt: '初次見麵獲獎紀錄照片',
                    width: 4096,
                    height: 2733,
                  },
                ],
              },
              {
                id: 'media',
                label: 'MEDIA — 媒體採訪',
                title: '《創藝多腦河》節目採訪',
                content:
                  '作品曾接受《創藝多腦河》節目採訪，透過媒體呈現「初次見麵」的設計理念與創作成果。',
                images: [
                  {
                    src: '/images/projects/chu-ci-jian-mian/exhibition-05.JPG',
                    alt: '初次見麵接受《創藝多腦河》電視節目採訪的紀錄照片',
                    width: 1920,
                    height: 1080,
                  },
                ],
              },
              {
                id: 'exhibition',
                label: 'EXHIBITION — 實體展示與交流',
                imageLayout: 'feature-grid',
                content:
                  '透過實體作品展示，向觀眾介紹產品造型、設計理念與台灣麵食文化的連結，呈現從概念發想到實際成果的完整設計過程。',
                images: [
                  {
                    src: '/images/projects/chu-ci-jian-mian/exhibition-01.JPG',
                    alt: '初次見麵實體作品展示與交流紀錄 01',
                    width: 1181,
                    height: 1608,
                  },
                  {
                    src: '/images/projects/chu-ci-jian-mian/exhibition-02.jpg',
                    alt: '初次見麵實體作品展示與交流紀錄 02',
                    width: 1181,
                    height: 821,
                  },
                  {
                    src: '/images/projects/chu-ci-jian-mian/exhibition-03.JPG',
                    alt: '初次見麵實體作品展示與交流紀錄 03',
                    width: 960,
                    height: 720,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]
