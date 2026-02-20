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
    theme: `
      <svg class="legacy-shell__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M21 12.5A8.5 8.5 0 1 1 11.5 3a7 7 0 0 0 9.5 9.5Z" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `,
    reset: `
      <svg class="legacy-shell__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M21 12a9 9 0 1 1-3-6.7" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M21 3v6h-6" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `
  }

  function formatTime(date = new Date()) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }

  function derivePageName() {
    const title = (document.title || '').trim()
    if (title && title.length < 80) return title
    const last = (location.pathname || '').split('/').filter(Boolean).slice(-1)[0] || 'Legacy App'
    return decodeURIComponent(last).replace(/\.(html|htm)$/i, '')
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

    const updateNetwork = () => {
      if (navigator.onLine) {
        networkChip.textContent = 'Online'
        networkChip.dataset.state = 'saved'
      } else {
        networkChip.textContent = 'Offline'
        networkChip.dataset.state = 'offline'
      }
    }

    updateNetwork()
    window.addEventListener('online', updateNetwork)
    window.addEventListener('offline', updateNetwork)

    return {
      setSaved(isSaved) {
        savedChip.dataset.state = isSaved ? 'saved' : 'unsaved'
        savedChip.textContent = isSaved ? 'Saved' : 'Unsaved'
        timestampChip.textContent = `Updated ${formatTime()}`
      }
    }
  }

  function createShell() {
    const wrapper = document.createElement('header')
    wrapper.className = 'legacy-shell'
    wrapper.setAttribute('role', 'banner')
    const pageName = derivePageName()
    wrapper.innerHTML = `
      <div class="legacy-shell__group" role="toolbar" aria-label="Page tools">
        <div class="legacy-shell__title" aria-label="Current tool">
          <span class="legacy-shell__kicker">Legacy</span>
          <span class="legacy-shell__name"></span>
        </div>
        <button type="button" class="legacy-shell__action legacy-focus-ring" data-action="back" aria-label="Go back">
          ${ICONS.back}<span>Back</span>
        </button>
        <button type="button" class="legacy-shell__action legacy-focus-ring" data-action="help" aria-label="Open help">
          ${ICONS.help}<span>Help</span>
        </button>
        <button type="button" class="legacy-shell__action legacy-focus-ring" data-action="theme" aria-label="Toggle theme">
          ${ICONS.theme}<span>Theme</span>
        </button>
        <button type="button" class="legacy-shell__action legacy-focus-ring" data-action="reset" aria-label="Reset local data for this tool">
          ${ICONS.reset}<span>Reset</span>
        </button>
      </div>
      <div class="legacy-shell__status" aria-live="polite">
        <span class="legacy-chip" data-chip="saved" data-state="saved">Saved</span>
        <span class="legacy-chip" data-chip="network" data-state="saved">Online</span>
        <span class="legacy-chip" data-chip="time">Updated ${formatTime()}</span>
      </div>
      <div class="legacy-shell__help" aria-hidden="true" id="legacy-shell-help" role="dialog" aria-modal="true" aria-label="In-page help">
        <div class="legacy-shell__help-card">
          <h2>Help</h2>
          <p>Keyboard: Tab moves between controls, Enter activates. Theme toggles light/dark. Reset clears local browser state for this tool (useful if something looks stuck).</p>
          <div class="legacy-shell__help-actions">
            <button type="button" class="legacy-btn legacy-btn--primary legacy-focus-ring" data-action="close-help">Close</button>
          </div>
        </div>
      </div>
    `

    const nameNode = wrapper.querySelector('.legacy-shell__name')
    if (nameNode) {
      nameNode.textContent = pageName
    }

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

      stepsRoot.appendChild(stepsTitle)
      stepsRoot.appendChild(stepsList)
      helpCard.insertBefore(stepsRoot, helpActions)
    }

    const getScopedStorageKeys = () => {
      const slug = (location.pathname || 'legacy-app').replace(/[^a-z0-9]+/gi, '.').toLowerCase()
      return Object.keys(localStorage).filter((key) => key.includes(slug) || key.startsWith('legacy-guidance-v1'))
    }

    wrapper.querySelector('[data-action="back"]').addEventListener('click', () => history.back())
    const openHelp = () => {
      helpDialog.setAttribute('aria-hidden', 'false')
      const closeButton = wrapper.querySelector('[data-action="close-help"]')
      if (closeButton) closeButton.focus()
    }
    const closeHelp = () => {
      helpDialog.setAttribute('aria-hidden', 'true')
    }

    wrapper.querySelector('[data-action="help"]').addEventListener('click', openHelp)
    wrapper.querySelector('[data-action="close-help"]').addEventListener('click', closeHelp)
    wrapper.querySelector('[data-action="theme"]').addEventListener('click', () => {
      document.documentElement.classList.toggle('legacy-dark')
      const isDark = document.documentElement.classList.contains('legacy-dark')
      document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
    })
    wrapper.querySelector('[data-action="reset"]').addEventListener('click', () => {
      const keys = getScopedStorageKeys()
      keys.forEach((key) => localStorage.removeItem(key))
      window.location.reload()
    })

    wrapper.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && helpDialog.getAttribute('aria-hidden') === 'false') {
        event.preventDefault()
        closeHelp()
        const helpButton = wrapper.querySelector('[data-action="help"]')
        if (helpButton) helpButton.focus()
      }
    })

    return wrapper
  }

  function boot() {
    if (document.body?.dataset?.legacyShell !== 'true') return
    const shell = createShell()
    document.body.prepend(shell)
    const statusApi = initStatus(shell)
    global.LegacyShell = {
      setSaved: statusApi.setSaved
    }
    document.addEventListener('input', () => statusApi.setSaved(false), { passive: true })
    document.addEventListener('change', () => statusApi.setSaved(false), { passive: true })
    statusApi.setSaved(true)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot)
  } else {
    boot()
  }
})(window)
