(() => {
  'use strict'

  const STORAGE_KEY = 'ramie.output-review.v1'
  const PLACEHOLDER_PATTERNS = [
    /will appear here/i,
    /start transcription/i,
    /ai-suggested/i,
    /fill in diagnoses/i,
    /generate a management plan first/i,
    /no output/i
  ]
  const SURFACES = [
    { id: 'differential', label: 'Differential diagnosis', selector: '#differentialOutput', minLength: 40 },
    { id: 'management-plan', label: 'Management plan', selector: '#managementPlanResult', minLength: 40 },
    { id: 'soap-note', label: 'Clinical note', selector: '#soapNoteOutput', minLength: 80 }
  ]
  const EXPORT_SELECTOR = [
    '#exportNoteBtn',
    '#downloadNoteBtn',
    '#copyNoteBtn',
    '[data-action="export-note"]',
    '[data-action="download-note"]',
    '[data-action="copy-note"]',
    '[data-export-clinical-output]'
  ].join(',')

  const records = new Map()
  let notice = null

  function hashText(text) {
    let hash = 0x811c9dc5
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index)
      hash = Math.imul(hash, 0x01000193)
    }
    return (hash >>> 0).toString(16).padStart(8, '0')
  }

  function normalizedText(element) {
    return (element?.innerText || element?.textContent || '').replace(/\s+/g, ' ').trim()
  }

  function hasMaterialOutput(surface, text) {
    if (text.length < surface.minLength) return false
    return !PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(text))
  }

  function loadState() {
    try {
      return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}')
    } catch {
      return {}
    }
  }

  function saveState() {
    const value = {}
    for (const [id, record] of records) {
      value[id] = {
        fingerprint: record.fingerprint,
        status: record.status,
        reviewedAt: record.reviewedAt,
        checks: record.checks
      }
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  }

  function style() {
    if (document.getElementById('ramie-output-review-style')) return
    const node = document.createElement('style')
    node.id = 'ramie-output-review-style'
    node.textContent = `
      .ramie-output-review{margin-top:.8rem;border:1px solid #64748b;border-left:4px solid #d97706;border-radius:10px;background:#111827;color:#e5e7eb;padding:.8rem;font:12px/1.5 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.ramie-output-review[data-status="accepted"]{border-left-color:#16a34a}.ramie-output-review[data-status="needs-editing"]{border-left-color:#f59e0b}.ramie-output-review[data-status="rejected"]{border-left-color:#dc2626}.ramie-output-review[data-status="stale"]{border-left-color:#be123c;background:#2b101b}
      .ramie-output-review__head{display:flex;justify-content:space-between;gap:.75rem;align-items:flex-start}.ramie-output-review__head h3{margin:0;color:#f8fafc;font-size:13px}.ramie-output-review__status{border:1px solid currentColor;border-radius:999px;padding:.2rem .45rem;font-size:9px;font-weight:750;letter-spacing:.07em;text-transform:uppercase;color:#fbbf24}.ramie-output-review[data-status="accepted"] .ramie-output-review__status{color:#86efac}.ramie-output-review[data-status="rejected"] .ramie-output-review__status,.ramie-output-review[data-status="stale"] .ramie-output-review__status{color:#fda4af}
      .ramie-output-review__boundary{margin:.45rem 0;color:#cbd5e1}.ramie-output-review__checks{display:grid;gap:.35rem;margin:.65rem 0}.ramie-output-review__checks label{display:flex;gap:.45rem;align-items:flex-start;color:#d1d5db}.ramie-output-review__checks input{margin-top:.12rem;width:16px;height:16px}.ramie-output-review__actions{display:flex;flex-wrap:wrap;gap:.4rem}.ramie-output-review__actions button{border-radius:7px;padding:.4rem .55rem;border:1px solid #64748b;background:#1f2937;color:#f8fafc;font-weight:650;cursor:pointer}.ramie-output-review__actions button[data-decision="accepted"]{border-color:#16a34a}.ramie-output-review__actions button[data-decision="rejected"]{border-color:#dc2626}.ramie-output-review__error{min-height:1.1rem;margin:.4rem 0 0;color:#fca5a5;font-weight:650}
      #ramie-export-review-notice[hidden]{display:none!important}#ramie-export-review-notice{position:fixed;left:50%;bottom:24px;z-index:100001;transform:translateX(-50%);width:min(640px,calc(100% - 24px));border:1px solid #be123c;border-left:5px solid #be123c;border-radius:10px;background:#4c0519;color:#fff1f2;padding:.8rem 1rem;box-shadow:0 20px 60px rgba(0,0,0,.4);font:650 13px/1.45 system-ui}#ramie-export-review-notice button{float:right;margin-left:.75rem;border:1px solid #fda4af;background:#881337;color:#fff;border-radius:6px;padding:.3rem .5rem;cursor:pointer}
      @media(prefers-reduced-motion:reduce){.ramie-output-review *,#ramie-export-review-notice{transition:none!important;animation:none!important}}
    `
    document.head.append(node)
  }

  function createNotice() {
    if (notice) return notice
    notice = document.createElement('div')
    notice.id = 'ramie-export-review-notice'
    notice.hidden = true
    notice.setAttribute('role', 'alert')
    notice.innerHTML = '<button type="button" aria-label="Dismiss review notice">Dismiss</button><span></span>'
    notice.querySelector('button')?.addEventListener('click', () => { notice.hidden = true })
    document.body.append(notice)
    return notice
  }

  function checklistFor(surfaceId) {
    const common = [
      ['source-supported', 'Compared each material statement with the transcript, uploaded source, or clinician-entered fact.'],
      ['negation-site-laterality', 'Verified negation, body site, laterality, timing, and patient attribution.'],
      ['inference-marked', 'Removed or clearly marked unsupported inference; no generated statement is presented as observed fact.']
    ]
    if (surfaceId === 'differential') {
      return [...common, ['not-diagnosis', 'Confirmed this is a clinician-reviewed differential, not an autonomous diagnosis.']]
    }
    if (surfaceId === 'management-plan') {
      return [...common, ['medication-dose', 'Verified every medication, dose, route, frequency, contraindication, monitoring item, and referral.'], ['patient-context', 'Confirmed recommendations fit the actual patient context and local practice requirements.']]
    }
    return [...common, ['medication-dose', 'Verified every medication, dose, route, frequency, allergy, and monitoring statement.'], ['note-completeness', 'Reviewed omissions, contradictions, examination findings, assessment, and plan before export.']]
  }

  function createPanel(surface, record) {
    const panel = document.createElement('section')
    panel.className = 'ramie-output-review'
    panel.dataset.outputReviewFor = surface.id
    panel.dataset.status = record.status
    panel.setAttribute('aria-label', `${surface.label} clinician review`)
    const checks = checklistFor(surface.id)
    panel.innerHTML = `
      <div class="ramie-output-review__head"><h3>${surface.label} · clinician adjudication</h3><span class="ramie-output-review__status"></span></div>
      <p class="ramie-output-review__boundary">Generated content is unverified until a clinician checks source support, patient attribution, and clinically material details. Editing the output after acceptance makes the review stale.</p>
      <div class="ramie-output-review__checks">
        ${checks.map(([id, label]) => `<label><input type="checkbox" data-check="${id}"><span>${label}</span></label>`).join('')}
      </div>
      <div class="ramie-output-review__actions">
        <button type="button" data-decision="accepted">Accept reviewed output</button>
        <button type="button" data-decision="needs-editing">Needs editing</button>
        <button type="button" data-decision="rejected">Reject output</button>
      </div>
      <p class="ramie-output-review__error" role="alert"></p>
    `
    panel.addEventListener('change', () => {
      record.checks = Object.fromEntries([...panel.querySelectorAll('[data-check]')].map((input) => [input.dataset.check, input.checked]))
      if (record.status === 'accepted') record.status = 'stale'
      render(record)
      saveState()
    })
    panel.addEventListener('click', (event) => {
      const button = event.target.closest('[data-decision]')
      if (!(button instanceof HTMLButtonElement)) return
      decide(record, button.dataset.decision)
    })
    record.panel = panel
    record.element.insertAdjacentElement('afterend', panel)
    return panel
  }

  function render(record) {
    if (!record.panel) return
    record.panel.dataset.status = record.status
    const status = record.panel.querySelector('.ramie-output-review__status')
    if (status) status.textContent = record.status.replace('-', ' ')
    for (const input of record.panel.querySelectorAll('[data-check]')) {
      input.checked = Boolean(record.checks[input.dataset.check])
    }
    const error = record.panel.querySelector('.ramie-output-review__error')
    if (error && record.status !== 'unreviewed') error.textContent = ''
  }

  function decide(record, decision) {
    const error = record.panel?.querySelector('.ramie-output-review__error')
    if (decision === 'accepted') {
      const missing = checklistFor(record.surface.id).filter(([id]) => !record.checks[id])
      if (missing.length) {
        if (error) error.textContent = `Complete all ${missing.length} remaining review check(s) before acceptance.`
        return
      }
    }
    if (!['accepted', 'needs-editing', 'rejected'].includes(decision)) return
    record.status = decision
    record.reviewedAt = new Date().toISOString()
    render(record)
    saveState()
    document.dispatchEvent(new CustomEvent('ramie:output-review', { detail: publicRecord(record) }))
  }

  function publicRecord(record) {
    return {
      id: record.surface.id,
      label: record.surface.label,
      fingerprint: record.fingerprint,
      status: record.status,
      reviewedAt: record.reviewedAt,
      checks: { ...record.checks }
    }
  }

  function registerSurface(surface) {
    const element = document.querySelector(surface.selector)
    if (!(element instanceof HTMLElement)) return
    const saved = loadState()[surface.id] || {}
    const record = {
      surface,
      element,
      panel: null,
      fingerprint: '',
      status: 'unreviewed',
      reviewedAt: null,
      checks: {},
      internalMutation: false
    }
    records.set(surface.id, record)

    const refresh = () => {
      const text = normalizedText(element)
      const material = hasMaterialOutput(surface, text)
      if (!material) {
        record.panel?.remove()
        record.panel = null
        record.fingerprint = ''
        record.status = 'unreviewed'
        record.reviewedAt = null
        record.checks = {}
        saveState()
        return
      }
      const fingerprint = hashText(text)
      if (!record.panel) createPanel(surface, record)
      if (!record.fingerprint) {
        record.fingerprint = fingerprint
        if (saved.fingerprint === fingerprint) {
          record.status = saved.status || 'unreviewed'
          record.reviewedAt = saved.reviewedAt || null
          record.checks = saved.checks || {}
        } else {
          record.status = 'unreviewed'
        }
      } else if (record.fingerprint !== fingerprint) {
        record.fingerprint = fingerprint
        record.status = record.reviewedAt ? 'stale' : 'unreviewed'
      }
      render(record)
      saveState()
    }

    new MutationObserver(() => queueMicrotask(refresh)).observe(element, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true
    })
    refresh()
  }

  function acceptedMaterialRecords() {
    return [...records.values()].filter((record) => record.fingerprint && record.status === 'accepted')
  }

  function unresolvedMaterialRecords() {
    return [...records.values()].filter((record) => record.fingerprint && record.status !== 'accepted')
  }

  function blockUnreviewedExport(event) {
    const control = event.target instanceof Element ? event.target.closest(EXPORT_SELECTOR) : null
    if (!(control instanceof HTMLElement)) return
    const unresolved = unresolvedMaterialRecords()
    if (!unresolved.length) return
    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation()
    createNotice()
    notice.querySelector('span').textContent = `Clinical export blocked: ${unresolved.map((record) => `${record.surface.label} is ${record.status}`).join('; ')}.`
    notice.hidden = false
    unresolved[0].panel?.scrollIntoView({ block: 'center' })
    unresolved[0].panel?.querySelector('input,button')?.focus()
  }

  function boot() {
    style()
    createNotice()
    SURFACES.forEach(registerSurface)
    document.addEventListener('click', blockUnreviewedExport, true)
    window.RamieOutputReview = Object.freeze({
      getRecords: () => [...records.values()].map(publicRecord),
      getRecord: (id) => records.has(id) ? publicRecord(records.get(id)) : null,
      canExport: () => unresolvedMaterialRecords().length === 0 && acceptedMaterialRecords().length > 0,
      unresolved: () => unresolvedMaterialRecords().map(publicRecord),
      accept: (id) => {
        const record = records.get(id)
        if (!record) return false
        for (const [checkId] of checklistFor(id)) record.checks[checkId] = true
        decide(record, 'accepted')
        return record.status === 'accepted'
      }
    })
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true })
  else boot()
})()
