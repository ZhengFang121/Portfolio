import {
  computed,
  inject,
  onScopeDispose,
  provide,
  shallowRef,
  watch,
  type InjectionKey,
} from 'vue'
import { useRouter, type HistoryState } from 'vue-router'
import { projects, type PortfolioProject } from '../data/projects'

interface ModalEntry extends HistoryState {
  session: string
  background: string
  originPosition: number | null
}

function createProjectModal() {
  const router = useRouter()
  const route = router.currentRoute
  // 只信任本次載入建立的來源紀錄；重新整理或外部連結一律使用 Works 背景。
  const session = `${Date.now()}-${Math.random()}`
  const historyState = shallowRef(router.options.history.state)
  const triggers = new Map<number, HTMLElement>()
  const trigger = shallowRef<HTMLElement | null>(null)
  const initialInput = shallowRef<'keyboard' | 'pointer'>('pointer')
  const selectedProject = computed(() =>
    projects.find((project) => project.slug === route.value.meta.projectSlug),
  )
  let closing = false

  function readEntry(): ModalEntry | null {
    const value = historyState.value.portfolioModal
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null
    if (
      value.session !== session ||
      typeof value.background !== 'string' ||
      (value.originPosition !== null &&
        (typeof value.originPosition !== 'number' || !Number.isInteger(value.originPosition)))
    )
      return null
    const background = router.resolve(value.background)
    if (background.name !== 'home' && background.name !== 'works') return null
    return value as ModalEntry
  }

  const backgroundRoute = computed(() => {
    if (!selectedProject.value) return route.value
    // Works 同步載入；Home 已在點擊前載入，兩者可直接交給 RouterView。
    const background = router.resolve(readEntry()?.background ?? { name: 'works' })
    return { ...background, name: background.name ?? undefined }
  })
  const displayProject = shallowRef(selectedProject.value)
  let lastBackground = backgroundRoute.value.fullPath

  watch(selectedProject, (project) => {
    if (project) displayProject.value = project
  })

  const removeHook = router.afterEach((to, _from, failure) => {
    closing = false
    if (failure) return
    historyState.value = router.options.history.state
    if (to.meta.projectSlug) {
      const entry = readEntry()
      lastBackground = entry?.background ?? router.resolve({ name: 'works' }).fullPath
      trigger.value =
        entry?.originPosition != null ? (triggers.get(entry.originPosition) ?? null) : null
    } else if (to.fullPath !== lastBackground) {
      trigger.value = null
    }
  })
  onScopeDispose(removeHook)

  function openProject(project: PortfolioProject, event: MouseEvent) {
    if (!(event.currentTarget instanceof HTMLElement)) return
    const entry: ModalEntry = (selectedProject.value ? readEntry() : null) ?? {
      session,
      background: backgroundRoute.value.fullPath,
      originPosition: selectedProject.value ? null : Number(router.options.history.state.position),
    }
    // 只保留仍存在的來源卡片，避免跨頁導覽後持續引用已卸載的 DOM。
    for (const [position, element] of triggers) {
      if (!element.isConnected) triggers.delete(position)
    }
    if (!selectedProject.value && entry.originPosition !== null)
      triggers.set(entry.originPosition, event.currentTarget)
    initialInput.value = event.detail === 0 ? 'keyboard' : 'pointer'
    return router.push({ name: `work-${project.slug}`, state: { portfolioModal: entry } })
  }

  function closeProject() {
    if (!selectedProject.value || closing) return
    closing = true
    const entry = readEntry()
    const distance =
      entry?.originPosition != null
        ? Number(router.options.history.state.position) - entry.originPosition
        : 0
    if (entry && distance > 0) router.go(-distance)
    else void router.replace({ name: 'works' })
  }

  function finishClose() {
    if (!selectedProject.value) displayProject.value = undefined
  }

  return {
    dialogId: 'project-modal',
    selectedProject,
    displayProject,
    backgroundRoute,
    trigger,
    initialInput,
    visible: computed(() => Boolean(selectedProject.value)),
    restoreScroll: computed(() => route.value.fullPath === lastBackground),
    openProject,
    closeProject,
    finishClose,
  }
}

const projectModalKey: InjectionKey<ReturnType<typeof createProjectModal>> = Symbol('project-modal')

export function provideProjectModal() {
  const modal = createProjectModal()
  provide(projectModalKey, modal)
  return modal
}

export function useProjectModal() {
  const modal = inject(projectModalKey)
  if (!modal) throw new Error('作品卡片必須在 App 的作品 Modal 管理範圍內使用')
  return modal
}
