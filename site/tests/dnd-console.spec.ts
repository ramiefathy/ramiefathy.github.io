import { expect, test, type Page } from '@playwright/test'

const route = '/tools/dnd-l20-console-f2c7a9/'
const version = '4.0.0-srd521'
const patchVersion = '4.0.1-ci-remediation'

async function openClean(page: Page) {
  await page.goto(route, { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'networkidle' })
  await expect(page.locator('.app')).toHaveAttribute('data-version', version)
  await expect(page.locator('.app')).toHaveAttribute('data-patch-version', patchVersion)
}

async function tab(page: Page, name: string) {
  await page.locator(`[data-action="tab"][data-tab="${name}"]`).first().click()
  await expect(page.locator('main h1')).toBeVisible()
}

test.describe('Table Ledger D&D console', () => {
  test('serves direct static assets and substantive version markers', async ({ request, page }) => {
    for (const asset of ['', 'styles.css', 'data.js', 'app.js', 'manifest.webmanifest', 'icon.svg', 'sw.js']) {
      const response = await request.get(`${route}${asset}`)
      expect(response.status(), asset).toBe(200)
    }
    const index = await (await request.get(route)).text()
    expect(index).toContain('styles.css')
    expect(index).toContain('data.js')
    expect(index).toContain('app.js')
    expect(index).not.toContain('payload-01.js')
    expect(index).not.toContain('boot.js')
    expect(index).toContain('4.0.1-ci-remediation')
    const app = await (await request.get(`${route}app.js`)).text()
    for (const marker of ['calculateCurrentCharacter', 'renderDefenses', 'calculateEncumbrance', 'renderBuilder', 'calculateSpellSlots']) expect(app).toContain(marker)
    const data = await (await request.get(`${route}data.js`)).text()
    for (const marker of ['4.0.0-srd521', 'Lisa Blesslie', 'Steph Scurry', 'Gloves of Thievery', 'Athletics', 'Boon of Speed']) expect(data).toContain(marker)
    await openClean(page)
  })

  test('shows Lisa expertise math and recalculates equipment-dependent totals', async ({ page }) => {
    await openClean(page)
    await tab(page, 'sheet')
    await expect(page.locator('[data-testid="skill-athletics"] .bonus')).toHaveText('+19')
    await expect(page.locator('[data-testid="skill-athletics"]')).toContainText('STR +7')
    await expect(page.locator('[data-testid="skill-athletics"]')).toContainText('Expertise +12')
    await expect(page.locator('[data-testid="ability-str"] b')).toHaveText('25')
    await expect(page.locator('main')).toContainText('Printed 25')
    await expect(page.locator('main')).toContainText('Armor Class')
    await expect(page.locator('main')).toContainText('22')
    await expect(page.locator('main')).toContainText('Current maximum')

    await tab(page, 'inventory')
    await expect(page.locator('[data-testid="attunement-count"]')).toHaveText('3/3')
    await expect(page.locator('#rules-mode')).toHaveValue('source')
    await expect(page.locator('main')).toContainText('Source-applied')
    await page.selectOption('#rules-mode', 'strict')
    await tab(page, 'sheet')
    await expect(page.locator('[data-testid="ability-str"] b')).toHaveText('12')
    await expect(page.locator('[data-testid="skill-athletics"] .bonus')).toHaveText('+13')
    await expect(page.locator('[data-testid="skill-athletics"] td').nth(3)).toContainText('+19')

    await tab(page, 'inventory')
    await page.selectOption('#rules-mode', 'source')
    await page.locator('[data-item-id="amulet-health"] [data-item-field="attuned"]').uncheck()
    await tab(page, 'sheet')
    await expect(page.locator('[data-testid="ability-con"] b')).toHaveText('8')
    await expect(page.locator('main')).toContainText('Current maximum')

    await tab(page, 'inventory')
    await page.locator('[data-item-id="arrow-shield"] [data-item-field="equipped"]').uncheck()
    await tab(page, 'sheet')
    await expect(page.locator('main')).toContainText('Printed 22')
  })

  test('shows Steph expertise and item bonus sources and recalculates them', async ({ page }) => {
    await openClean(page)
    await page.selectOption('#character-select', 'steph')
    await tab(page, 'sheet')
    const sleight = page.locator('[data-testid="skill-sleight-of-hand"]')
    await expect(sleight.locator('.bonus')).toHaveText('+24')
    await expect(sleight).toContainText('DEX +6')
    await expect(sleight).toContainText('Expertise +12')
    await expect(sleight).toContainText('Items +6')
    await expect(page.locator('[data-testid="skill-stealth"] .bonus')).toHaveText('+19')
    await expect(page.locator('[data-testid="skill-perception"] .bonus')).toHaveText('+15')

    await tab(page, 'inventory')
    await page.locator('[data-item-id="stone-luck"] [data-item-field="attuned"]').uncheck()
    await tab(page, 'sheet')
    await expect(page.locator('[data-testid="skill-sleight-of-hand"] .bonus')).toHaveText('+23')
    await tab(page, 'inventory')
    await page.locator('[data-item-id="gloves-thievery"] [data-item-field="equipped"]').uncheck()
    await tab(page, 'sheet')
    await expect(page.locator('[data-testid="skill-sleight-of-hand"] .bonus')).toHaveText('+18')
  })

  test('dedicated defenses surface contains active and conditional protections', async ({ page }) => {
    await openClean(page)
    await tab(page, 'defenses')
    for (const label of ['Force resistance', 'Fey Ancestry', 'Aura of Protection', 'Aura of Courage', 'Glorious Defense', 'Arrow-Catching Shield']) await expect(page.locator('main')).toContainText(label)
    await page.selectOption('#character-select', 'steph')
    await tab(page, 'defenses')
    for (const label of ['Evasion', 'Uncanny Dodge', 'Elusive', 'Slippery Mind', 'Cloak of Displacement']) await expect(page.locator('main')).toContainText(label)
    const hpBefore = Number(await page.locator('[data-testid="rail-hp"]').innerText().then(x => x.split('/')[0]))
    await page.fill('#defense-damage', '20')
    await page.check('#defense-uncanny')
    await page.locator('[data-action="defense-damage"]').click()
    const hpAfter = Number(await page.locator('[data-testid="rail-hp"]').innerText().then(x => x.split('/')[0]))
    expect(hpBefore - hpAfter).toBe(10)
    await expect(page.locator('main')).toContainText('Suppressed')
  })

  test('action builders spend slots, ammo, and strike dice transactionally', async ({ page }) => {
    await openClean(page)
    await tab(page, 'actions')
    await page.selectOption('#strike-smite-level', '1')
    const slotsBefore = await page.evaluate(() => window.TableLedger.getState().characters.lisa.spellSlotsCurrent['1'])
    await page.locator('[data-action="paladin-strike"]').click()
    await expect(page.locator('#action-result')).toContainText('Total damage')
    const slotsAfter = await page.evaluate(() => window.TableLedger.getState().characters.lisa.spellSlotsCurrent['1'])
    expect(slotsAfter).toBe(slotsBefore - 1)

    await page.selectOption('#character-select', 'steph')
    await tab(page, 'actions')
    await page.check('.cunning-option[value="Trip"]')
    const ammoBefore = await page.evaluate(() => window.TableLedger.getState().characters.steph.items.find((x: any) => x.id === 'bolts-2').quantity)
    await page.locator('[data-action="rogue-strike"]').click()
    await expect(page.locator('#action-result')).toContainText('9d6 Sneak Attack')
    const ammoAfter = await page.evaluate(() => window.TableLedger.getState().characters.steph.items.find((x: any) => x.id === 'bolts-2').quantity)
    expect(ammoAfter).toBe(ammoBefore - 1)
  })

  test('retains every uploaded spell and inventory entry used for play', async ({ page }) => {
    await openClean(page)
    await tab(page, 'spells')
    for (const name of ['Divine Smite', 'Find Steed', 'Haste', 'Freedom of Movement', 'Revivify', 'Destructive Wave', "Yolande's Regal Presence"]) await expect(page.locator('main')).toContainText(name)
    await tab(page, 'inventory')
    for (const name of ['Belt of Fire Giant Strength', 'Wraps of Unarmed Power +2', 'Arrow-Catching Shield', 'Amulet of Health', 'Plate Armor of Resistance (Force)']) await expect(page.locator('main')).toContainText(name)

    await page.selectOption('#character-select', 'steph')
    await tab(page, 'spells')
    await expect(page.locator('main')).toContainText('Invisibility')
    await expect(page.locator('main')).toContainText('Revivify')
    await tab(page, 'inventory')
    for (const name of ['Hand Crossbow +2', 'Gloves of Thievery', 'Oil of Slipperiness', 'Eversmoking Bottle', 'Wand of Paralysis', 'Manual of Quickness of Action', 'Boots of Speed', 'Stone of Good Luck', 'Cloak of Displacement']) await expect(page.locator('main')).toContainText(name)
  })

  test('supports weights, containers, carried state, encumbrance, and unknown values', async ({ page }) => {
    await openClean(page)
    await page.selectOption('#character-select', 'steph')
    await tab(page, 'inventory')
    await expect(page.locator('main')).toContainText('Unknown-weight units')
    const boltRow = page.locator('[data-item-id="bolts-2"]')
    await boltRow.locator('[data-item-field="weight"]').fill('0.075')
    await boltRow.locator('[data-item-field="weight"]').press('Tab')
    await expect(page.locator('main')).toContainText('Known carried lb')
    const caseRow = page.locator('[data-item-id="bolt-case"]')
    await caseRow.locator('[data-item-field="carried"]').uncheck()
    const enc = await page.evaluate(() => window.TableLedger.calculateCurrentCharacter(window.TableLedger.getState().characters.steph).encumbrance)
    expect(enc.known).toBe(0)
    await page.locator('[data-action="add-container"]').click()
    await expect(page.locator('main')).toContainText('New container')
  })

  test('enforces attunement limits while preserving the imported source snapshot', async ({ page }) => {
    await openClean(page)
    await tab(page, 'inventory')
    await expect(page.locator('[data-testid="attunement-count"]')).toHaveText('3/3')
    await expect(page.locator('#rules-mode')).toHaveValue('source')
    await expect(page.locator('[data-item-id="belt-fire-giant"] [data-item-field="attuned"]')).not.toBeChecked()
    await expect(page.locator('main')).toContainText('does not consume an attunement slot')
    await page.selectOption('#character-select', 'steph')
    await tab(page, 'inventory')
    await expect(page.locator('[data-testid="attunement-count"]')).toHaveText('4/4')
  })

  test('migrates an older over-limit Lisa save into a legal source-snapshot state', async ({ page }) => {
    await openClean(page)
    await page.evaluate(() => {
      const state = window.TableLedger.getState()
      const belt = state.characters.lisa.items.find((item: any) => item.id === 'belt-fire-giant')
      belt.attuned = true
      delete belt.sourceApplied
      delete state.characters.lisa.rulesMode
      localStorage.setItem('table-ledger-state-v4', JSON.stringify(state))
    })
    await page.reload({ waitUntil: 'networkidle' })
    await tab(page, 'inventory')
    await expect(page.locator('[data-testid="attunement-count"]')).toHaveText('3/3')
    await expect(page.locator('#rules-mode')).toHaveValue('source')
    await tab(page, 'sheet')
    await expect(page.locator('[data-testid="ability-str"] b')).toHaveText('25')
  })

  test('builder exposes all SRD classes, species paths, backgrounds, feats and level unlocks', async ({ page }) => {
    await openClean(page)
    await tab(page, 'builder')
    const catalog = await page.evaluate(() => ({
      classes: Object.keys(window.TABLE_LEDGER_DATA.classes).length,
      species: Object.keys(window.TABLE_LEDGER_DATA.species).length,
      backgrounds: Object.keys(window.TABLE_LEDGER_DATA.backgrounds).length,
      feats: window.TABLE_LEDGER_DATA.feats.length,
      spells: window.TABLE_LEDGER_DATA.spells.length,
    }))
    expect(catalog.classes).toBe(12)
    expect(catalog.species).toBeGreaterThanOrEqual(10)
    expect(catalog.backgrounds).toBeGreaterThanOrEqual(17)
    expect(catalog.feats).toBeGreaterThan(60)
    expect(catalog.spells).toBe(337)

    await page.fill('#builder-name', 'Aster Vale')
    await page.selectOption('[data-builder-class="0"]', 'warlock')
    await page.fill('[data-builder-level="0"]', '20')
    await page.locator('[data-builder-level="0"]').press('Enter')
    await expect(page.locator('main')).toContainText('Pact Magic 4×L5')
    await expect(page.locator('main')).toContainText('Eldritch Invocations')
    await expect(page.locator('main')).toContainText('Epic Boon')

    await page.selectOption('#builder-species', 'tiefling')
    await expect(page.locator('main')).toContainText('Fiendish Legacy')
    await expect(page.locator('main')).toContainText('Legacy Spellcasting Ability')
    await page.selectOption('#builder-species', 'custom')
    await page.fill('#builder-custom-species', 'Clockwork Kin')
    await page.locator('[data-action="create-built-character"]').click()
    await expect(page.locator('.portrait h2')).toHaveText('Aster Vale')
    await expect(page.locator('.portrait p')).toContainText('Clockwork Kin')
  })

  test('persists item and journal changes and exports versioned state', async ({ page }) => {
    await openClean(page)
    await tab(page, 'journal')
    await page.fill('#journal-text', 'Meet the envoy at dawn.')
    await page.reload({ waitUntil: 'networkidle' })
    await tab(page, 'journal')
    await expect(page.locator('#journal-text')).toHaveValue('Meet the envoy at dawn.')
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('table-ledger-state-v4') || '{}'))
    expect(stored.version).toBe(version)
    expect(stored.characters.lisa.name).toBe('Lisa Blesslie')
  })

  test('is keyboard reachable, reduced-motion aware, and mobile-safe', async ({ page, browser }) => {
    await openClean(page)
    await page.keyboard.press('Tab')
    await expect(page.locator('.skip-link')).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.locator('#main')).toBeFocused()

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
    await mobile.goto(route, { waitUntil: 'networkidle' })
    const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(1)
    await expect(mobile.locator('.mobile-nav')).toBeVisible()
    const reduced = await mobile.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
    expect(reduced).toBe(true)
    await mobile.close()
  })

  test('has no runtime, page, or request failures during representative navigation', async ({ page }) => {
    const consoleErrors: string[] = []
    const pageErrors: string[] = []
    const requestFailures: string[] = []
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()) })
    page.on('pageerror', err => pageErrors.push(err.message))
    page.on('requestfailed', req => requestFailures.push(`${req.method()} ${req.url()} ${req.failure()?.errorText}`))
    await openClean(page)
    for (const name of ['sheet', 'defenses', 'actions', 'spells', 'inventory', 'features', 'builder', 'journal', 'audit']) await tab(page, name)
    expect(consoleErrors).toEqual([])
    expect(pageErrors).toEqual([])
    expect(requestFailures).toEqual([])
  })
})

declare global {
  interface Window {
    TableLedger: any
    TABLE_LEDGER_DATA: any
  }
}
