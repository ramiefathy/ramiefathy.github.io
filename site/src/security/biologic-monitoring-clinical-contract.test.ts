import { describe, expect, it } from 'vitest'
import {
  CONDITION_LABELS,
  REQUIREMENT_LABELS,
  dataVersion,
  monitoringEntries
} from '../../public/apps/biologic-monitoring-dashboard/data.js'
import {
  formatClinicalDataDate,
  runClinicalDataGate
} from '../../public/apps/biologic-monitoring-dashboard/clinical-data-gate.js'

function freshEntries() {
  return structuredClone(monitoringEntries)
}

describe('biologic monitoring clinical data contract', () => {
  it('fails closed only after validating every embedded treatment record', () => {
    const entries = freshEntries()
    const report = runClinicalDataGate({
      monitoringEntries: entries,
      conditionLabels: CONDITION_LABELS,
      requirementLabels: REQUIREMENT_LABELS,
      dataVersion
    })

    expect(report.ok, JSON.stringify(report.errors, null, 2)).toBe(true)
    expect(report.errors).toEqual([])
    expect(report.entryCount).toBe(entries.length)
    expect(report.entryCount).toBeGreaterThan(10)
    expect(dataVersion).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(formatClinicalDataDate(dataVersion)).toMatch(/[A-Z][a-z]+ \d{1,2}, \d{4}/)
  })

  it('separates IL-17 treatment indications from inflammatory-bowel-disease cautions', () => {
    const entries = freshEntries()
    const report = runClinicalDataGate({
      monitoringEntries: entries,
      conditionLabels: CONDITION_LABELS,
      requirementLabels: REQUIREMENT_LABELS,
      dataVersion
    })
    const il17 = entries.find((entry) => entry.id === 'il17-inhibitors')

    expect(report.ok).toBe(true)
    expect(il17).toBeDefined()
    expect(il17.conditions).not.toContain('crohns-disease')
    expect(il17.conditions).not.toContain('ulcerative-colitis')
    expect(il17.cautionConditions).toEqual(expect.arrayContaining(['crohns-disease', 'ulcerative-colitis']))
    expect(report.corrections.some((item) => item.entryId === 'il17-inhibitors')).toBe(true)
  })

  it('rejects malformed schedules and insecure source URLs', () => {
    const entries = freshEntries()
    entries[0].monitoringSchedule[0].relativeWeeks = Number.NaN
    entries[0].references[0].url = 'http://example.test/insecure-label.pdf'

    const report = runClinicalDataGate({
      monitoringEntries: entries,
      conditionLabels: CONDITION_LABELS,
      requirementLabels: REQUIREMENT_LABELS,
      dataVersion
    })

    expect(report.ok).toBe(false)
    expect(report.errors.some((item) => item.field === 'monitoringSchedule')).toBe(true)
    expect(report.errors.some((item) => item.field === 'references' && /HTTPS/.test(item.message))).toBe(true)
  })
})
