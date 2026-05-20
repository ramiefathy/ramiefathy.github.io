import { describe, expect, it } from 'vitest'

import {
  createInitialStudioState,
  createStudioStore,
  reduceStudioState
} from '../../public/apps/shared/pdf-studio/core/state.js'

describe('pdf studio state reducer', () => {
  it('switches tools and tracks selection state', () => {
    const initial = createInitialStudioState()
    const toolState = reduceStudioState(initial, { type: 'SET_TOOL', tool: 'extract' })
    const selectedState = reduceStudioState(toolState, { type: 'SET_SELECTED_PAGES', selectedPages: [1, 2, 4] })

    expect(toolState.activeTool).toBe('extract')
    expect(selectedState.selectedPages).toEqual([1, 2, 4])
  })

  it('toggles deleted pages deterministically', () => {
    const initial = createInitialStudioState()
    const once = reduceStudioState(initial, { type: 'TOGGLE_DELETE_PAGE', pageIndex: 3 })
    const twice = reduceStudioState(once, { type: 'TOGGLE_DELETE_PAGE', pageIndex: 3 })

    expect(once.deletedPages).toEqual([3])
    expect(twice.deletedPages).toEqual([])
  })

  it('publishes updates via store subscriptions', () => {
    const store = createStudioStore()
    const snapshots: string[] = []
    const unsubscribe = store.subscribe((state) => {
      snapshots.push(state.activeTool)
    })

    store.dispatch({ type: 'SET_TOOL', tool: 'metadata' })
    store.dispatch({ type: 'SET_TOOL', tool: 'stamp' })
    unsubscribe()
    store.dispatch({ type: 'SET_TOOL', tool: 'compress' })

    expect(snapshots).toEqual(['metadata', 'stamp'])
  })
})
