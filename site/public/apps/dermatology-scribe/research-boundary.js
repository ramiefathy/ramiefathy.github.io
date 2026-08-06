(() => {
  'use strict'

  const ACK_KEY = 'ramie.research-boundary-ack.v1'
  const CONFIG_FINGERPRINT_KEY = 'ramie.research-boundary-config.v1'
  const URL_KEYS = [
    'dermascribe.websocketUrl',
    'dermascribe.websocket_url',
    'ramie.websocketUrl',
    'websocketUrl'
  ]
  const TOKEN_KEYS = [
    'dermascribe.sessionToken',
    'dermascribe.session_token',
    'ramie.sessionToken',
    'sessionToken'
  ]
  const TRANSMISSION_CONTROLS = [
    '#startChatModeCard',
    '#startTranscriptionModeCard',
    '#startBtn',
    '#transcriptionImageUploadBtn',
    '#generatePlanBtn',
    '#generateNoteBtn',
    '#chatAttachImageBtn',
    '#chatSendBtn',
    '#chatFinalizeBtn'
  ].join(',')

  let dialog = null
  let previousFocus = null
  let pendingControl = null
  let bypassControl = null

  function readStorage(keys) {
    for (const key of keys) {
      const sessionValue = sessionStorage.getItem(key)
      if (sessionValue) return sessionValue
      const localValue = localStorage.getItem(key)
      if (localValue) return localValue
    }
    return ''
  }

  function configuredUrl() {
    const input = document.getElementById('websocketUrlInput')
    const liveValue = input instanceof HTMLInputElement ? input.value.trim() : ''
    return liveValue || readStorage(URL_KEYS)
  }

  function tokenPresent() {
    const input = document.getElementById('sessionTokenInput')
    const liveValue = input instanceof HTMLInputElement ? input.value.trim() : ''
    return Boolean(liveValue || readStorage(TOKEN_KEYS))
  }

  function safeDestination(rawUrl = configuredUrl()) {
    if (!rawUrl) return { label: 'Not configured', host: '', secure: false, valid: false }
    try {
      const parsed = new URL(rawUrl)
      const secure = parsed.protocol === 'wss:'
      const valid = secure || parsed.protocol === 'ws:'
      return {
        label: valid ? `${parsed.protocol}//${parsed.host}` : 'Invalid WebSocket URL',
        host: parsed.host,
        secure,
        valid
      }
    } catch {
      return { label: 'Invalid WebSocket URL', host: '', secure: false, valid: false }
    }
  }

  function configFingerprint() {
    const destination = safeDestination()
    return JSON.stringify({ destination: destination.label, tokenPresent: tokenPresent() })
  }

  function isAcknowledged() {
    return sessionStorage.getItem(ACK_KEY) === 'true' &&
      sessionStorage.getItem(CONFIG_FINGERPRINT_KEY) === configFingerprint()
  }

  function clearAcknowledgment() {
    sessionStorage.removeItem(ACK_KEY)
    sessionStorage.removeItem(CONFIG_FINGERPRINT_KEY)
    updateBoundary()
  }

  function getBoundary() {
    return document.getElementById('ramie-research-boundary')
  }

  function getDestinationNode() {
    return document.getElementById('ramie-destination-value')
  }

  function getAcknowledgmentNode() {
    return document.getElementById('ramie-boundary-state')
  }

  function updateBoundary() {
    const destination = safeDestination()
    const destinationNode = getDestinationNode()
    const acknowledgmentNode = getAcknowledgmentNode()
    if (destinationNode) {
      destinationNode.textContent = destination.label
      destinationNode.dataset.state = destination.valid
        ? destination.secure ? 'secure' : 'insecure'
        : 'missing'
    }
    if (acknowledgmentNode) {
      acknowledgmentNode.textContent = isAcknowledged() ? 'Data flow reviewed for this session' : 'Review required before transmission'
      acknowledgmentNode.dataset.state = isAcknowledged() ? 'acknowledged' : 'required'
    }

    if (dialog && !dialog.hidden) renderDialogState()
  }

  function style() {
    if (document.getElementById('ramie-research-boundary-style')) return
    const node = document.createElement('style')
    node.id = 'ramie-research-boundary-style'
    node.textContent = `
      #ramie-research-boundary{display:grid;grid-template-columns:minmax(11rem,auto) minmax(18rem,1fr) auto;gap:.55rem 1rem;align-items:center;margin:1rem 0 1.25rem;padding:.9rem 1rem;border:1px solid #a6573d;border-left:5px solid #a6573d;border-radius:10px;background:#fff7f1;color:#2b1710;font:13px/1.45 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-shadow:0 8px 24px rgba(50,28,18,.08)}
      #ramie-research-boundary strong{font-size:11px;letter-spacing:.09em;text-transform:uppercase;color:#8d3d25}
      .ramie-boundary__copy{display:grid;gap:.2rem}.ramie-boundary__copy span{font-weight:650}.ramie-boundary__copy small{color:#6c5045}
      .ramie-boundary__meta{display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.25rem}.ramie-boundary__chip{border:1px solid currentColor;border-radius:999px;padding:.25rem .5rem;font-size:10px;letter-spacing:.04em;text-transform:uppercase}
      #ramie-destination-value[data-state="secure"]{color:#166534}#ramie-destination-value[data-state="insecure"]{color:#9a3412}#ramie-destination-value[data-state="missing"]{color:#9f1239}
      #ramie-boundary-state[data-state="acknowledged"]{color:#166534}#ramie-boundary-state[data-state="required"]{color:#9f1239}
      .ramie-boundary__button{border:1px solid #7c2d12;background:#7c2d12;color:#fff;border-radius:8px;padding:.55rem .75rem;font:700 11px/1.2 system-ui;letter-spacing:.04em;text-transform:uppercase;cursor:pointer}.ramie-boundary__button:hover{background:#9a3412}.ramie-boundary__button:focus-visible{outline:3px solid #fb923c;outline-offset:2px}
      #ramie-research-dialog[hidden]{display:none!important}#ramie-research-dialog{position:fixed;inset:0;z-index:100000;display:grid;place-items:center;padding:1rem;background:rgba(15,23,42,.78)}
      .ramie-research-dialog__card{width:min(680px,100%);max-height:min(88vh,760px);overflow:auto;border:1px solid #a6573d;border-radius:14px;background:#fffaf7;color:#24140f;box-shadow:0 30px 90px rgba(0,0,0,.35)}
      .ramie-research-dialog__head{display:flex;justify-content:space-between;gap:1rem;align-items:flex-start;padding:1rem 1.1rem;border-bottom:1px solid #e5c7ba}.ramie-research-dialog__head p{margin:0 0 .25rem;color:#8d3d25;font-size:10px;font-weight:750;letter-spacing:.1em;text-transform:uppercase}.ramie-research-dialog__head h2{margin:0;font:650 22px/1.1 system-ui}
      .ramie-research-dialog__close{border:1px solid #9f8175;background:#fff;color:#24140f;border-radius:7px;padding:.45rem .65rem;cursor:pointer}
      .ramie-research-dialog__body{display:grid;gap:1rem;padding:1.1rem}.ramie-research-dialog__alert{border-left:4px solid #be123c;background:#fff1f2;padding:.75rem .85rem;color:#881337}.ramie-research-dialog__grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.75rem}.ramie-research-dialog__panel{border:1px solid #decac1;border-radius:9px;padding:.75rem;background:#fff}.ramie-research-dialog__panel h3{margin:0 0 .35rem;font-size:13px}.ramie-research-dialog__panel p,.ramie-research-dialog__panel li{font-size:12px;line-height:1.5;color:#5b463d}.ramie-research-dialog__panel ul{margin:.3rem 0 0;padding-left:1.15rem}
      .ramie-research-dialog__ack{display:flex;gap:.65rem;align-items:flex-start;border:1px solid #a6573d;border-radius:9px;padding:.8rem;background:#fff7f1;font-size:13px}.ramie-research-dialog__ack input{margin-top:.15rem;width:18px;height:18px}.ramie-research-dialog__error{min-height:1.2em;margin:0;color:#b91c1c;font-size:12px;font-weight:650}
      .ramie-research-dialog__actions{display:flex;justify-content:flex-end;gap:.6rem}.ramie-research-dialog__actions button{border-radius:8px;padding:.6rem .85rem;font-weight:700;cursor:pointer}.ramie-research-dialog__cancel{border:1px solid #9f8175;background:#fff}.ramie-research-dialog__continue{border:1px solid #7c2d12;background:#7c2d12;color:#fff}.ramie-research-dialog__continue:disabled{opacity:.45;cursor:not-allowed}
      @media(max-width:760px){#ramie-research-boundary{grid-template-columns:1fr}.ramie-boundary__button{justify-self:start}.ramie-research-dialog__grid{grid-template-columns:1fr}}
      @media(prefers-reduced-motion:reduce){#ramie-research-dialog *{scroll-behavior:auto!important;transition:none!important;animation:none!important}}
    `
    document.head.append(node)
  }

  function createBoundary() {
    if (getBoundary()) return
    const boundary = document.createElement('aside')
    boundary.id = 'ramie-research-boundary'
    boundary.setAttribute('role', 'note')
    boundary.setAttribute('aria-label', 'RAMIE research prototype and data-flow boundary')
    boundary.innerHTML = `
      <strong>Research prototype</strong>
      <div class="ramie-boundary__copy">
        <span>Feature-rich research and demonstration system; every generated output requires clinician verification.</span>
        <small>Public demo not approved for protected health information. Audio, images, transcripts, and prompts may be sent to the configured backend and model provider.</small>
        <div class="ramie-boundary__meta">
          <span class="ramie-boundary__chip">Destination: <b id="ramie-destination-value">Not configured</b></span>
          <span class="ramie-boundary__chip" id="ramie-boundary-state">Review required before transmission</span>
        </div>
      </div>
      <button type="button" class="ramie-boundary__button" id="ramie-review-data-flow">Review data flow</button>
    `

    const subtitle = document.querySelector('.ramie-subtitle')
    const main = document.querySelector('.ramie-landing__main')
    if (subtitle?.parentElement) subtitle.insertAdjacentElement('afterend', boundary)
    else if (main) main.prepend(boundary)
    else document.body.prepend(boundary)

    boundary.querySelector('#ramie-review-data-flow')?.addEventListener('click', () => openDialog(null))
  }

  function createDialog() {
    if (dialog) return dialog
    dialog = document.createElement('div')
    dialog.id = 'ramie-research-dialog'
    dialog.hidden = true
    dialog.innerHTML = `
      <section class="ramie-research-dialog__card" role="dialog" aria-modal="true" aria-labelledby="ramie-research-dialog-title" aria-describedby="ramie-research-dialog-description">
        <header class="ramie-research-dialog__head">
          <div><p>Research prototype · transmission preflight</p><h2 id="ramie-research-dialog-title">Review where consultation data may go</h2></div>
          <button type="button" class="ramie-research-dialog__close" aria-label="Close data-flow review">Close</button>
        </header>
        <div class="ramie-research-dialog__body">
          <p class="ramie-research-dialog__alert" id="ramie-research-dialog-description"><strong>Do not enter protected health information into the public demo.</strong> This acknowledgment does not make the deployment clinically validated, HIPAA compliant, institutionally approved, or safe for patient care.</p>
          <div class="ramie-research-dialog__grid">
            <section class="ramie-research-dialog__panel"><h3>Configured destination</h3><p id="ramie-dialog-destination"></p><p id="ramie-dialog-security"></p></section>
            <section class="ramie-research-dialog__panel"><h3>Content that may be transmitted</h3><ul><li>Microphone audio and transcript text</li><li>Uploaded clinical images or documents</li><li>Prompts, differential requests, management requests, and note-generation inputs</li></ul></section>
            <section class="ramie-research-dialog__panel"><h3>Required review</h3><ul><li>Verify transcript fidelity, negation, site, laterality, medication, and dose</li><li>Separate source-derived documentation from model inference</li><li>Accept, edit, or reject generated sections before export</li></ul></section>
            <section class="ramie-research-dialog__panel"><h3>Not established by this prototype</h3><ul><li>Diagnostic accuracy or clinical efficacy</li><li>Patient-specific prescribing appropriateness</li><li>Institutional privacy/compliance approval</li><li>Safety of autonomous use</li></ul></section>
          </div>
          <label class="ramie-research-dialog__ack"><input type="checkbox" id="ramie-research-ack"><span>I understand that this is a research prototype, the public demo is not approved for PHI, configured services may receive the listed data, and a clinician must verify every output.</span></label>
          <p class="ramie-research-dialog__error" id="ramie-research-dialog-error" role="alert"></p>
          <div class="ramie-research-dialog__actions"><button type="button" class="ramie-research-dialog__cancel">Cancel</button><button type="button" class="ramie-research-dialog__continue" disabled>Acknowledge for this session</button></div>
        </div>
      </section>
    `
    document.body.append(dialog)

    const checkbox = dialog.querySelector('#ramie-research-ack')
    const continueButton = dialog.querySelector('.ramie-research-dialog__continue')
    checkbox?.addEventListener('change', () => {
      if (continueButton instanceof HTMLButtonElement && checkbox instanceof HTMLInputElement) {
        continueButton.disabled = !checkbox.checked
      }
    })
    dialog.querySelector('.ramie-research-dialog__close')?.addEventListener('click', closeDialog)
    dialog.querySelector('.ramie-research-dialog__cancel')?.addEventListener('click', closeDialog)
    continueButton?.addEventListener('click', acknowledgeAndContinue)
    dialog.addEventListener('mousedown', (event) => {
      if (event.target === dialog) closeDialog()
    })
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && dialog && !dialog.hidden) {
        event.preventDefault()
        closeDialog()
      }
    })
    return dialog
  }

  function renderDialogState() {
    if (!dialog) return
    const destination = safeDestination()
    const destinationNode = dialog.querySelector('#ramie-dialog-destination')
    const securityNode = dialog.querySelector('#ramie-dialog-security')
    const errorNode = dialog.querySelector('#ramie-research-dialog-error')
    if (destinationNode) destinationNode.textContent = destination.label
    if (securityNode) {
      securityNode.textContent = !destination.valid
        ? 'No valid ws:// or wss:// destination is currently configured.'
        : destination.secure
          ? 'Encrypted WebSocket transport requested (wss://). This alone does not establish regulatory compliance.'
          : location.protocol === 'https:'
            ? 'Blocked configuration: an HTTPS page must not transmit through insecure ws://.'
            : 'Unencrypted ws:// transport is suitable only for controlled local development.'
    }
    if (errorNode) errorNode.textContent = ''
  }

  function openDialog(control) {
    createDialog()
    previousFocus = document.activeElement
    pendingControl = control
    const checkbox = dialog.querySelector('#ramie-research-ack')
    const continueButton = dialog.querySelector('.ramie-research-dialog__continue')
    if (checkbox instanceof HTMLInputElement) checkbox.checked = false
    if (continueButton instanceof HTMLButtonElement) continueButton.disabled = true
    renderDialogState()
    dialog.hidden = false
    dialog.querySelector('.ramie-research-dialog__close')?.focus()
  }

  function closeDialog() {
    if (!dialog) return
    dialog.hidden = true
    pendingControl = null
    if (previousFocus instanceof HTMLElement) previousFocus.focus()
    previousFocus = null
  }

  function acknowledgeAndContinue() {
    if (!dialog) return
    const checkbox = dialog.querySelector('#ramie-research-ack')
    const errorNode = dialog.querySelector('#ramie-research-dialog-error')
    if (!(checkbox instanceof HTMLInputElement) || !checkbox.checked) {
      if (errorNode) errorNode.textContent = 'Check the acknowledgment before continuing.'
      return
    }

    const destination = safeDestination()
    if (location.protocol === 'https:' && destination.valid && !destination.secure) {
      if (errorNode) errorNode.textContent = 'Insecure WebSocket URL on an HTTPS page. Configure wss:// before transmitting data.'
      return
    }

    sessionStorage.setItem(ACK_KEY, 'true')
    sessionStorage.setItem(CONFIG_FINGERPRINT_KEY, configFingerprint())
    const control = pendingControl
    dialog.hidden = true
    pendingControl = null
    updateBoundary()

    if (control instanceof HTMLElement) {
      bypassControl = control
      control.click()
      queueMicrotask(() => { bypassControl = null })
    } else if (previousFocus instanceof HTMLElement) {
      previousFocus.focus()
    }
    previousFocus = null
  }

  function onPotentialTransmission(event) {
    const target = event.target instanceof Element ? event.target.closest(TRANSMISSION_CONTROLS) : null
    if (!(target instanceof HTMLElement)) return
    if (target === bypassControl || isAcknowledged()) return
    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation()
    openDialog(target)
  }

  function bindConfigurationTracking() {
    for (const id of ['websocketUrlInput', 'sessionTokenInput']) {
      document.getElementById(id)?.addEventListener('input', clearAcknowledgment)
      document.getElementById(id)?.addEventListener('change', clearAcknowledgment)
    }
    document.getElementById('saveBackendConfigBtn')?.addEventListener('click', () => {
      queueMicrotask(() => {
        clearAcknowledgment()
        updateBoundary()
      })
    })
    window.addEventListener('storage', updateBoundary)
  }

  function boot() {
    style()
    createBoundary()
    createDialog()
    bindConfigurationTracking()
    updateBoundary()
    document.addEventListener('click', onPotentialTransmission, true)
    document.addEventListener('keydown', (event) => {
      if ((event.key === 'Enter' || event.key === ' ') && event.target instanceof Element) {
        const control = event.target.closest(TRANSMISSION_CONTROLS)
        if (control && !isAcknowledged()) onPotentialTransmission(event)
      }
    }, true)

    window.RamieResearchBoundary = Object.freeze({
      isAcknowledged,
      clearAcknowledgment,
      getDestination: () => safeDestination().label,
      open: () => openDialog(null)
    })
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true })
  else boot()
})()
