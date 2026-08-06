(function initLegacyShell(global) {
  const ICONS = {
    back: `
      <svg class="legacy-shell__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M10 6 4 12l6 6" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M4 12h16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `,
    help: `
      <svg class="legacy-shell__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 18h.01" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M9.25 9.25a3 3 0 1 1 4.5 2.6c-.9.5-1.75 1.25-1.75 2.65v.25" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10Z" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>
      </svg>
    `,
    reset: `
      <svg class="legacy-shell__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M21 12a9 9 0 1 1-3-6.7" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M21 3v6h-6" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `
  }

  const ALLOWED_KICKERS = new Set(['Clinical', 'Reference', 'Learning', 'Productivity', 'Research', 'Archive'])

  const ROUTE_POLICIES = [
    {
      test: /\/apps\/dermatology-scribe\//,
      kicker: 'Research',
      label: 'Research prototype',
      tone: 'research',
      message: 'RAMIE is a feature-rich research and demonstration prototype. Transcription, multimodal analysis, differential generation, management drafting, and note generation remain available, but every output requires clinician verification.',
      detail: 'Audio, images, transcripts, and prompts may be sent to the configured backend and model provider. The public demo is not approved for protected health information.'
    },
    {
      test: /\/apps\/biologic-monitoring-dashboard\//,
      kicker: 'Reference',
      label: 'Clinical reference — review due',
      tone: 'warning',
      message: 'The embedded clinical content was last reviewed September 23, 2025 and is undergoing agent-level source reconciliation.',
      detail: 'Confirm consequential decisions against the current prescribing information, applicable guidelines, patient context, and local policy.'
    },
    {
      test: /\/apps\/WoundCareWebpages\.html$/,
      kicker: 'Archive',
      label: 'Historical archive · November 21, 2019',
      tone: 'archive',
      message: 'This page is preserved as a historical artifact and is not a current wound-care reference.',
      detail: 'Do not use it for patient-specific diagnosis, treatment, dressing selection, staging, or referral decisions.'
    },
    {
      test: /\/apps\/pdf-studio\.html$/,
      kicker: 'Productivity',
      label: 'Local-first utility',
      tone: 'local',
      message: 'PDF processing occurs in this browser; the application does not upload documents to an application server.',
      detail: 'Visual masking is not secure redaction unless the underlying content has been removed and the result independently verified.'
    },
    {
      test: /\/apps\/dermatopathology-(modern|differentials)/,
      kicker: 'Learning',
      label: 'Educational tool',
      tone: 'learning',
      message: 'This application supports dermatopathology learning and comparison, not patient-specific diagnosis.',
      detail: 'Verify clinically consequential interpretations against current primary references and expert review.'
    },
    {
      test: /\/apps\/MindMaps\//,
      kicker: 'Learning',
      label: 'Educational archive',
      tone: 'learning',
      message: 'This legacy mind-map surface is retained for education; the current searchable mind-map library is available from the application catalog.',
      detail: 'Do not treat educational summaries as patient-specific guidance.'
    },
    {
      test: /\/apps\/legacy\//,
      kicker: 'Archive',
      label: 'Historical archive',
      tone: 'archive',
      message: 'This route contains historical applications and reports retained for context and code archaeology.',
      detail: 'Archived clinical content may be outdated and must not be treated as current guidance.'
    }
  ]

  function formatTime(date = new Date()) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }

  function derivePageName() {
    const title = (document.title || '').trim()
    if (title && title.length < 80) return title
    const last = (location.pathname || '').split('/').filter(Boolean).slice(-1)[0] || 'Application'
    return decodeURIComponent(last).replace(/\.(html|htm)$/i, '')
  }

  function getRoutePolicy() {
    const pathname = location.pathname || ''
    return ROUTE_POLICIES.find((policy) => policy.test.test(pathname)) || null
  }

  function getKicker(policy) {
    const requested = document.body?.dataset?.shellKicker
    if (requested && ALLOWED_KICKERS.has(requested)) return requested
    if (policy?.kicker && ALLOWED_KICKERS.has(policy.kicker)) return policy.kicker
    return null
  }

  function parseHelpSteps(rawValue) {
    if (!rawValue || typeof rawValue !== 'string') return null

    try {
      const parsed = JSON.parse(rawValue)
      if (!Array.isArray(parsed)) return null

      const steps = parsed
        .filter((step) => typeof step === 'string')
        .map((step) => step.trim())
        .filter((step) => step.length > 0)
        .slice(0, 12)

      return steps.length > 0 ? steps : null
    } catch (error) {
      return null
    }
  }

  function initStatus(shell) {
    const statusRoot = shell.querySelector('.legacy-shell__status')
    const savedChip = statusRoot.querySelector('[data-chip="saved"]')
    const networkChip = statusRoot.querySelector('[data-chip="network"]')
    const timestampChip = statusRoot.querySelector('[data-chip="time"]')
    const currencyChip = statusRoot.querySelector('[data-chip="currency"]')

    const updateNetwork = () => {
      if (navigator.onLine) {
        networkChip.textContent = 'Online'
        networkChip.dataset.state = 'saved'
      } else {
        networkChip.textContent = 'Offline'
        networkChip.dataset.state = 'offline'
      }
    }

    const setState = (state, text, showTime) => {
      savedChip.dataset.state = state
      savedChip.textContent = text
      timestampChip.hidden = !showTime
      timestampChip.textContent = showTime ? `Saved ${formatTime()}` : ''
    }

    updateNetwork()
    window.addEventListener('online', updateNetwork)
    window.addEventListener('offline', updateNetwork)

    setState('ready', 'Ready', false)

    return {
      markDirty() {
        setState('unsaved', 'Unsaved', false)
      },
      markSaving() {
        setState('saving', 'Saving…', false)
      },
      markSaved() {
        setState('saved', 'Saved', true)
      },
      setSaved(isSaved) {
        if (isSaved) this.markSaved()
        else this.markDirty()
      },
      setDatasetCurrency(text) {
        const value = typeof text === 'string' ? text.trim() : ''
        currencyChip.hidden = !value
        currencyChip.textContent = value
      }
    }
  }

  function createBoundary(policy) {
    if (!policy) return null
    const boundary = document.createElement('aside')
    boundary.className = `legacy-boundary legacy-boundary--${policy.tone}`
    boundary.setAttribute('role', 'note')
    boundary.setAttribute('aria-label', policy.label)

    const heading = document.createElement('strong')
    heading.className = 'legacy-boundary__label'
    heading.textContent = policy.label

    const message = document.createElement('span')
    message.className = 'legacy-boundary__message'
    message.textContent = policy.message

    const detail = document.createElement('span')
    detail.className = 'legacy-boundary__detail'
    detail.textContent = policy.detail

    boundary.append(heading, message, detail)
    return boundary
  }

  function createShell(policy) {
    const wrapper = document.createElement('header')
    wrapper.className = 'legacy-shell'
    wrapper.setAttribute('role', 'banner')
    const pageName = derivePageName()
    const kicker = getKicker(policy)
    wrapper.innerHTML = `
      <div class="legacy-shell__group" role="toolbar" aria-label="Page tools">
        <div class="legacy-shell__title" aria-label="Current tool">
          ${kicker ? '<span class="legacy-shell__kicker"></span>' : ''}
          <span class="legacy-shell__name"></span>
        </div>
        <button type="button" class="legacy-shell__action legacy-focus-ring" data-action="back" aria-label="Go back">
          ${ICONS.back}<span>Back</span>
        </button>
        <button type="button" class="legacy-shell__action legacy-focus-ring" data-action="help" aria-label="Open help">
          ${ICONS.help}<span>Help</span>
        </button>
        <button type="button" class="legacy-shell__action legacy-focus-ring" data-action="reset" aria-label="Reset local data for this tool">
          ${ICONS.reset}<span>Reset</span>
        </button>
      </div>
      <div class="legacy-shell__status" aria-live="polite">
        <span class="legacy-chip" data-chip="saved" data-state="ready">Ready</span>
        <span class="legacy-chip" data-chip="network" data-state="saved">Online</span>
        <span class="legacy-chip" data-chip="currency" hidden></span>
        <span class="legacy-chip" data-chip="time" hidden></span>
      </div>
      <div class="legacy-shell__help" aria-hidden="true" id="legacy-shell-help" role="dialog" aria-modal="true" aria-label="In-page help">
        <div class="legacy-shell__help-card">
          <h2>Help</h2>
          <p>Keyboard: Tab moves between controls, Enter activates. Reset clears local browser state for this tool. Review the boundary notice before using any clinical, research, or archived content.</p>
          <div class="legacy-shell__help-actions">
            <button type="button" class="legacy-btn legacy-btn--primary legacy-focus-ring" data-action="close-help">Close</button>
          </div>
        </div>
      </div>
    `

    const nameNode = wrapper.querySelector('.legacy-shell__name')
    if (nameNode) nameNode.textContent = pageName
    const kickerNode = wrapper.querySelector('.legacy-shell__kicker')
    if (kickerNode) kickerNode.textContent = kicker

    const helpDialog = wrapper.querySelector('#legacy-shell-help')
    const helpCard = wrapper.querySelector('.legacy-shell__help-card')
    const helpActions = wrapper.querySelector('.legacy-shell__help-actions')
    const helpSteps = parseHelpSteps(document.body?.getAttribute('data-help-steps'))

    if (helpCard && helpActions && helpSteps && !helpCard.querySelector('.legacy-shell__help-steps')) {
      const stepsRoot = document.createElement('section')
      stepsRoot.className = 'legacy-shell__help-steps'
      stepsRoot.setAttribute('aria-label', 'Quick start steps')

      const stepsTitle = document.createElement('p')
      stepsTitle.className = 'legacy-shell__help-steps-title'
      stepsTitle.textContent = 'Quick start'

      const stepsList = document.createElement('ol')
      stepsList.className = 'legacy-shell__help-steps-list'

      for (const step of helpSteps) {
        const item = document.createElement('li')
        item.textContent = step
        stepsList.appendChild(item)
      }

      stepsRoot.append(stepsTitle, stepsList)
      helpCard.insertBefore(stepsRoot, helpActions)
    }

    const getScopedStorageKeys = () => {
      const slug = (location.pathname || 'application').replace(/[^a-z0-9]+/gi, '.').toLowerCase()
      return Object.keys(localStorage).filter((key) => key.includes(slug) || key.startsWith('legacy-guidance-v1'))
    }

    wrapper.querySelector('[data-action="back"]').addEventListener('click', () => history.back())
    const openHelp = () => {
      helpDialog.setAttribute('aria-hidden', 'false')
      wrapper.querySelector('[data-action="close-help"]')?.focus()
    }
    const closeHelp = () => helpDialog.setAttribute('aria-hidden', 'true')

    wrapper.querySelector('[data-action="help"]').addEventListener('click', openHelp)
    wrapper.querySelector('[data-action="close-help"]').addEventListener('click', closeHelp)
    wrapper.querySelector('[data-action="reset"]').addEventListener('click', () => {
      const keys = getScopedStorageKeys()
      keys.forEach((key) => localStorage.removeItem(key))
      window.location.reload()
    })

    wrapper.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && helpDialog.getAttribute('aria-hidden') === 'false') {
        event.preventDefault()
        closeHelp()
        wrapper.querySelector('[data-action="help"]')?.focus()
      }
    })

    return wrapper
  }

  function boot() {
    if (document.body?.dataset?.legacyShell !== 'true') return
    const policy = getRoutePolicy()
    const shell = createShell(policy)
    document.body.prepend(shell)
    const boundary = createBoundary(policy)
    if (boundary) shell.insertAdjacentElement('afterend', boundary)

    const statusApi = initStatus(shell)
    global.LegacyShell = {
      markDirty: statusApi.markDirty,
      markSaving: statusApi.markSaving,
      markSaved: statusApi.markSaved,
      setSaved: statusApi.setSaved.bind(statusApi),
      setDatasetCurrency: statusApi.setDatasetCurrency
    }
    document.addEventListener('input', () => statusApi.markDirty(), { passive: true })
    document.addEventListener('change', () => statusApi.markDirty(), { passive: true })
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot)
  else boot()
})(window)
