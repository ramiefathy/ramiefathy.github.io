export const DEFAULT_TOOL = 'organizer'

export function createInitialStudioState() {
  return {
    activeTool: DEFAULT_TOOL,
    selectedPages: [],
    pageOrder: [],
    deletedPages: [],
    rotations: {},
    lastRun: null
  }
}

export function reduceStudioState(state, action) {
  switch (action.type) {
    case 'SET_TOOL':
      return { ...state, activeTool: action.tool }
    case 'SET_PAGE_ORDER':
      return { ...state, pageOrder: [...action.pageOrder] }
    case 'SET_SELECTED_PAGES':
      return { ...state, selectedPages: [...action.selectedPages] }
    case 'TOGGLE_DELETE_PAGE': {
      const deleted = new Set(state.deletedPages)
      if (deleted.has(action.pageIndex)) {
        deleted.delete(action.pageIndex)
      } else {
        deleted.add(action.pageIndex)
      }
      return { ...state, deletedPages: Array.from(deleted).sort((a, b) => a - b) }
    }
    case 'SET_ROTATION': {
      const rotations = { ...state.rotations, [action.pageIndex]: action.rotation }
      return { ...state, rotations }
    }
    case 'SET_LAST_RUN':
      return { ...state, lastRun: action.payload }
    case 'RESET_DOCUMENT_STATE': {
      return {
        ...state,
        selectedPages: [],
        pageOrder: [],
        deletedPages: [],
        rotations: {},
        lastRun: null
      }
    }
    default:
      return state
  }
}

export function createStudioStore(initial = createInitialStudioState()) {
  let state = { ...initial }
  const listeners = new Set()

  const notify = () => {
    listeners.forEach((listener) => listener(state))
  }

  return {
    getState() {
      return state
    },
    dispatch(action) {
      state = reduceStudioState(state, action)
      notify()
      return state
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    }
  }
}
