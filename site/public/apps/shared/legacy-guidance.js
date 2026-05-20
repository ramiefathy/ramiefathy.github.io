(function initLegacyGuidance(global) {
  const storageKeyPrefix = 'legacy-guidance-v1:'

  function buildOverlay(steps, appKey) {
    const overlay = document.createElement('div')
    overlay.className = 'legacy-shell__help'
    overlay.setAttribute('aria-hidden', 'false')

    const card = document.createElement('div')
    card.className = 'legacy-shell__help-card'
    overlay.appendChild(card)

    const title = document.createElement('h2')
    title.textContent = 'Quick Start'
    card.appendChild(title)

    const list = document.createElement('ol')
    list.style.margin = '0 0 1rem'
    list.style.paddingLeft = '1.2rem'
    list.style.color = 'var(--legacy-text-muted)'
    steps.forEach((step) => {
      const item = document.createElement('li')
      item.textContent = step
      item.style.marginBottom = '0.35rem'
      list.appendChild(item)
    })
    card.appendChild(list)

    const actions = document.createElement('div')
    actions.className = 'legacy-shell__help-actions'
    card.appendChild(actions)

    const dismiss = document.createElement('button')
    dismiss.type = 'button'
    dismiss.className = 'legacy-btn legacy-btn--primary legacy-focus-ring'
    dismiss.textContent = 'Got it'
    dismiss.addEventListener('click', () => {
      overlay.remove()
      localStorage.setItem(`${storageKeyPrefix}${appKey}`, 'done')
    })
    actions.appendChild(dismiss)
    return overlay
  }

  global.LegacyGuidance = {
    maybeShow(appKey, steps) {
      if (!appKey || !Array.isArray(steps) || steps.length === 0) return
      if (navigator.webdriver) return
      const storageKey = `${storageKeyPrefix}${appKey}`
      if (localStorage.getItem(storageKey) === 'done') return
      const overlay = buildOverlay(steps, appKey)
      document.body.appendChild(overlay)
    }
  }
})(window)
