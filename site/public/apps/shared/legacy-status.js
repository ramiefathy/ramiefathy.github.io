(function initLegacyStatusModule(global) {
  const stateCache = new WeakMap()

  function ensurePanel(container) {
    if (!container) return null
    let panel = stateCache.get(container)
    if (panel) return panel
    panel = document.createElement('section')
    panel.className = 'legacy-status-panel'
    panel.setAttribute('aria-live', 'polite')
    container.appendChild(panel)
    stateCache.set(container, panel)
    return panel
  }

  function renderStatus(container, type, title, message, actions = []) {
    const panel = ensurePanel(container)
    if (!panel) return
    panel.classList.remove('is-error', 'is-success')
    if (type === 'error') panel.classList.add('is-error')
    if (type === 'success') panel.classList.add('is-success')
    panel.innerHTML = ''

    const header = document.createElement('h3')
    header.textContent = title
    panel.appendChild(header)

    const text = document.createElement('p')
    text.textContent = message
    panel.appendChild(text)

    if (actions.length) {
      const actionRow = document.createElement('div')
      actionRow.style.marginTop = '0.65rem'
      actionRow.style.display = 'flex'
      actionRow.style.gap = '0.5rem'
      actions.forEach((action) => {
        const button = document.createElement('button')
        button.className = 'legacy-btn legacy-btn--secondary legacy-focus-ring'
        button.type = 'button'
        button.textContent = action.label
        button.addEventListener('click', action.onClick)
        actionRow.appendChild(button)
      })
      panel.appendChild(actionRow)
    }
  }

  global.LegacyStatus = {
    showEmpty(container, message) {
      renderStatus(container, 'empty', 'No Data Yet', message)
    },
    showLoading(container, message) {
      renderStatus(container, 'loading', 'Working', message)
    },
    showError(container, message, retry) {
      const actions = retry ? [{ label: 'Retry', onClick: retry }] : []
      renderStatus(container, 'error', 'Action Needed', message, actions)
    },
    showRetry(container, message, retry) {
      const actions = retry ? [{ label: 'Retry', onClick: retry }] : []
      renderStatus(container, 'error', 'Retry Suggested', message, actions)
    },
    showSuccess(container, message) {
      renderStatus(container, 'success', 'Complete', message)
    }
  }
})(window)
