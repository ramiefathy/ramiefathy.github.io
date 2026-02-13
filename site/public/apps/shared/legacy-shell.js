(function initLegacyShell(global) {
  function formatTime(date = new Date()) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
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
    wrapper.innerHTML = `
      <div class="legacy-shell__group" role="toolbar" aria-label="Legacy app controls">
        <span class="legacy-shell__label">Page</span>
        <button type="button" class="legacy-shell__action legacy-focus-ring" data-action="back">Back</button>
        <button type="button" class="legacy-shell__action legacy-focus-ring" data-action="help">Help</button>
        <button type="button" class="legacy-shell__action legacy-focus-ring" data-action="theme">Theme</button>
        <button type="button" class="legacy-shell__action legacy-focus-ring" data-action="reset">Reset</button>
      </div>
      <div class="legacy-shell__status" aria-live="polite">
        <span class="legacy-chip" data-chip="saved" data-state="saved">Saved</span>
        <span class="legacy-chip" data-chip="network" data-state="saved">Online</span>
        <span class="legacy-chip" data-chip="time">Updated ${formatTime()}</span>
      </div>
      <div class="legacy-shell__help" aria-hidden="true" id="legacy-shell-help">
        <div class="legacy-shell__help-card">
          <h2>In-Page Help</h2>
          <p>Use search first, then navigate with keyboard controls. Use Reset to clear local state for this app.</p>
          <div class="legacy-shell__help-actions">
            <button type="button" class="legacy-btn legacy-btn--primary legacy-focus-ring" data-action="close-help">Close</button>
          </div>
        </div>
      </div>
    `

    const helpDialog = wrapper.querySelector('#legacy-shell-help')
    const getScopedStorageKeys = () => {
      const slug = (location.pathname || 'legacy-app').replace(/[^a-z0-9]+/gi, '.').toLowerCase()
      return Object.keys(localStorage).filter((key) => key.includes(slug) || key.startsWith('legacy-guidance-v1'))
    }

    wrapper.querySelector('[data-action="back"]').addEventListener('click', () => history.back())
    wrapper.querySelector('[data-action="help"]').addEventListener('click', () => {
      helpDialog.setAttribute('aria-hidden', 'false')
    })
    wrapper.querySelector('[data-action="close-help"]').addEventListener('click', () => {
      helpDialog.setAttribute('aria-hidden', 'true')
    })
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
