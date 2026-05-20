import { createStudioStore, createInitialStudioState } from './core/state.js'

import * as organizerTool from './tools/organizer.js'
import * as extractTool from './tools/extract.js'
import * as imageTool from './tools/image.js'
import * as stampTool from './tools/stamp.js'
import * as assembleTool from './tools/assemble.js'
import * as metadataTool from './tools/metadata.js'
import * as ocrTool from './tools/ocr.js'
import * as compressTool from './tools/compress.js'
import * as textExtractTool from './tools/textextract.js'

const TOOL_REGISTRY = [
  organizerTool,
  extractTool,
  imageTool,
  stampTool,
  assembleTool,
  metadataTool,
  ocrTool,
  compressTool,
  textExtractTool
]

const TOOL_MAP = new Map(TOOL_REGISTRY.map((tool) => [tool.id, tool]))

function getToolFromQuery() {
  const params = new URLSearchParams(window.location.search)
  const toolFromQuery = params.get('tool') || 'organizer'
  if (TOOL_MAP.has(toolFromQuery)) {
    return toolFromQuery
  }

  if (toolFromQuery === 'merger') return 'assemble'
  if (toolFromQuery === 'splitter') return 'extract'
  if (toolFromQuery === 'extractor') return 'textextract'
  return 'organizer'
}

function updateQueryTool(toolId) {
  const url = new URL(window.location.href)
  url.searchParams.set('tool', toolId)
  window.history.replaceState({}, '', url)
}

function createSection(title) {
  const section = document.createElement('section')
  section.className = 'legacy-workflow__section'
  const heading = document.createElement('h2')
  heading.textContent = title
  section.append(heading)
  return section
}

function clear(target) {
  while (target.firstChild) target.firstChild.remove()
}

function createToolButton(tool, activeTool, onClick) {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'pdf-studio__tool-button legacy-focus-ring'
  button.dataset.tool = tool.id
  if (tool.id === activeTool) button.classList.add('is-active')

  const label = document.createElement('span')
  label.textContent = tool.navLabel || tool.label
  const badge = document.createElement('span')
  badge.className = 'caption'
  badge.textContent = tool.badge || ''

  button.append(label, badge)
  button.addEventListener('click', () => onClick(tool.id))
  return button
}

function renderToolNav(root, store, onToolChange) {
  clear(root)
  const heading = document.createElement('h2')
  heading.textContent = 'PDF Studio'
  const description = document.createElement('p')
  description.className = 'pdf-studio__tool-description'
  description.textContent = 'Local-first utilities for page editing, extraction, packaging, and document cleanup.'
  const list = document.createElement('div')
  list.className = 'pdf-studio__tool-list'

  const activeTool = store.getState().activeTool
  TOOL_REGISTRY.forEach((tool) => {
    list.append(createToolButton(tool, activeTool, onToolChange))
  })

  root.append(heading, description, list)
}

function createContext(primaryPanel, secondaryPanel, store) {
  return {
    primaryPanel,
    secondaryPanel,
    store,
    createSection,
    clear,
    setStatus(message, tone = 'default') {
      window.LegacyStatus?.clear?.(secondaryPanel)
      if (tone === 'error') {
        window.LegacyStatus?.showError(secondaryPanel, message)
      } else if (tone === 'success') {
        window.LegacyStatus?.showSuccess(secondaryPanel, message)
      }
    }
  }
}

async function bootstrap() {
  const navRoot = document.getElementById('pdf-studio-nav')
  const primaryPanel = document.getElementById('pdf-studio-primary')
  const secondaryPanel = document.getElementById('pdf-studio-secondary')

  if (!navRoot || !primaryPanel || !secondaryPanel) {
    console.error('PDF Studio mount nodes not found.')
    return
  }

  const store = createStudioStore({
    ...createInitialStudioState(),
    activeTool: getToolFromQuery()
  })

  let cleanupCurrentTool = null

  const mountActiveTool = async () => {
    const activeTool = store.getState().activeTool
    const tool = TOOL_MAP.get(activeTool) || organizerTool
    updateQueryTool(tool.id)

    if (typeof cleanupCurrentTool === 'function') {
      cleanupCurrentTool()
    }

    clear(primaryPanel)
    clear(secondaryPanel)

    const title = document.getElementById('pdf-studio-title')
    const subtitle = document.getElementById('pdf-studio-subtitle')
    if (title) title.textContent = tool.label
    if (subtitle) subtitle.textContent = tool.description

    renderToolNav(navRoot, store, (toolId) => {
      store.dispatch({ type: 'SET_TOOL', tool: toolId })
      mountActiveTool().catch((error) => {
        console.error(error)
      })
    })

    const context = createContext(primaryPanel, secondaryPanel, store)
    const cleanup = await tool.mount(context)
    cleanupCurrentTool = typeof cleanup === 'function' ? cleanup : null
  }

  await mountActiveTool()
}

document.addEventListener('DOMContentLoaded', () => {
  bootstrap().catch((error) => {
    console.error('Failed to initialize PDF Studio', error)
  })
})
