/**
 * Drives the built single-file poster over file:// — the environment it actually ships into —
 * and checks the things that are easy to break and hard to notice.
 *
 * Usage: node scripts/verify.ts [chromium|firefox] [--shots <dir>]
 */
import { chromium, firefox, type Browser, type Page } from 'playwright'
import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const DIST = join(import.meta.dirname, '..', 'dist')
const url = `file://${join(DIST, 'index.html')}`

const shotsArg = process.argv.indexOf('--shots')
const SHOTS = shotsArg === -1 ? null : process.argv[shotsArg + 1]
const only = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : null

const engines = { chromium, firefox }

let failures = 0
const check = (name: string, pass: boolean, detail = '') => {
  if (!pass) failures++
  console.log(`  ${pass ? 'ok  ' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`)
}

async function settle(page: Page) {
  await page.waitForSelector('#poster')
  await page.evaluate(() => document.fonts.ready)
  await page.waitForFunction(() =>
    [...document.images].every((img) => img.complete && img.naturalWidth > 0),
  )
  // Geometry checks measure the rendered poster, so it has to be at 1:1. The zoom controls only
  // exist when the window is too narrow to show it that way.
  const fullSize = page.locator('.toolbar button[title*="Valós méret"]')
  if ((await fullSize.count()) > 0) await fullSize.click()
}

async function run(name: string, browser: Browser) {
  console.log(`\n=== ${name}`)
  // Wide enough for the type panel and the poster at 1:1 side by side.
  const page = await browser.newPage({ viewport: { width: 1400, height: 1400 } })
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))

  await page.goto(url)
  await settle(page)

  // Geometry: the whole design rests on the page being exactly this size.
  const box = await page.locator('#poster').boundingBox()
  check(
    'poster is 842x1264',
    box?.width === 842 && box.height === 1264,
    `${String(box?.width)}x${String(box?.height)}`,
  )

  // Every dish and price from the data reaches the page.
  const rows = await page.locator('.dish-row').count()
  check('18 dish rows render', rows === 18, String(rows))
  check(
    'first dish intact',
    (await page.locator('.dish-row .dish-name').first().textContent()) ===
      'SÁRGABORSÓFŐZELÉK, SERTÉS PÖRKÖLT',
  )

  if (SHOTS) {
    await mkdir(SHOTS, { recursive: true })
    await page.locator('#poster').screenshot({ path: join(SHOTS, `poster-${name}.png`) })
  }

  // Typing commits on blur and survives a reload.
  const target = page.locator('#day-hetfo .dish-row .dish-name').first()
  await target.click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.type('PRÓBA ÉTEL')
  const rendersDuringTyping = await target.textContent()
  check(
    'text stays put while typing',
    rendersDuringTyping === 'PRÓBA ÉTEL',
    rendersDuringTyping ?? '',
  )
  await page.keyboard.press('Tab')

  await page.reload()
  await settle(page)
  check(
    'edit persisted across reload',
    (await page.locator('#day-hetfo .dish-row .dish-name').first().textContent()) === 'PRÓBA ÉTEL',
  )

  // Dish count is capped at 2-5; the MENU row sits outside that bound.
  const hetfoRows = () => page.locator('#day-hetfo .dish-row').count()
  check('monday starts with 4', (await hetfoRows()) === 4)
  await page.locator('#day-hetfo .dish-add').click()
  check('added a 5th', (await hetfoRows()) === 5)
  check('add disabled at 5', await page.locator('#day-hetfo .dish-add').isDisabled())
  for (let i = 0; i < 3; i++) await page.locator('#day-hetfo .dish-remove').first().click()
  check('floor holds at 2', (await hetfoRows()) === 2)
  check('remove disabled at 2', await page.locator('#day-hetfo .dish-remove').first().isDisabled())
  check(
    'the MENU row is untouched by the floor',
    await page.locator('#day-hetfo .menu-row').isVisible(),
  )
  const afterEdits = await page.locator('#poster').boundingBox()
  check('page size unchanged after edits', afterEdits?.height === 1264, String(afterEdits?.height))

  // Closing a day swaps the rows for the notice and keeps the page height.
  await page.locator('#day-kedd .day-closed-toggle').click()
  check('kedd shows ZÁRVA', await page.locator('#day-kedd .closed-panel').isVisible())
  check('kedd has no dish rows', (await page.locator('#day-kedd .dish-row').count()) === 0)
  const closedBox = await page.locator('#poster').boundingBox()
  check('page size unchanged when closed', closedBox?.height === 1264, String(closedBox?.height))
  if (SHOTS) await page.locator('#poster').screenshot({ path: join(SHOTS, `closed-${name}.png`) })
  await page.locator('#day-kedd .day-closed-toggle').click()
  check('reopening restores the dishes', (await page.locator('#day-kedd .dish-row').count()) === 3)

  // A closure does not have to state a reason.
  await page.locator('#day-szerda .day-closed-toggle').click()
  await page.waitForTimeout(150)
  const szerdaNote = page.locator('#day-szerda .closed-note')
  check('a freshly closed day has no reason', (await szerdaNote.textContent()) === '')

  const centred = async () =>
    page.evaluate(() => {
      const poster = document.querySelector<HTMLElement>('#poster')!
      poster.dataset.mode = 'export'
      const panel = document.querySelector('#day-szerda .closed-panel')!.getBoundingClientRect()
      const line = document.querySelector('#day-szerda .closed-headline')!.getBoundingClientRect()
      const note = document.querySelector('#day-szerda .closed-note')!
      const noteShown = getComputedStyle(note).display !== 'none'
      poster.dataset.mode = 'edit'
      return {
        noteShown,
        top: +(line.top - panel.top).toFixed(1),
        bottom: +(panel.bottom - line.bottom).toFixed(1),
        left: +(line.left - panel.left).toFixed(1),
        right: +(panel.right - line.right).toFixed(1),
      }
    })

  const blank = await centred()
  check('an empty reason is not printed at all', !blank.noteShown)
  check(
    'ZÁRVA centres vertically without one',
    Math.abs(blank.top - blank.bottom) < 1,
    `${String(blank.top)} above, ${String(blank.bottom)} below`,
  )
  check(
    'and horizontally',
    Math.abs(blank.left - blank.right) < 1,
    `${String(blank.left)} left, ${String(blank.right)} right`,
  )

  // Typing a reason and clearing it again must leave the panel exactly as it was — a field
  // emptied by hand can keep a stray <br> that would stop it collapsing.
  await szerdaNote.click()
  await page.keyboard.type('PRÓBA OK')
  await page.keyboard.press('Tab')
  await page.waitForTimeout(150)
  const withNote = await centred()
  check('a stated reason is shown', withNote.noteShown)
  check('and pushes ZÁRVA up', withNote.top < withNote.bottom - 1)

  await szerdaNote.click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.press('Delete')
  await page.keyboard.press('Tab')
  await page.waitForTimeout(150)
  const cleared = await centred()
  check('clearing it collapses the line again', !cleared.noteShown)
  check(
    'and re-centres ZÁRVA',
    Math.abs(cleared.top - cleared.bottom) < 1,
    `${String(cleared.top)} above, ${String(cleared.bottom)} below`,
  )
  await page.locator('#day-szerda .day-closed-toggle').click()
  await page.waitForTimeout(150)

  // Week navigation steps the date line without retyping it.
  const dateText = () => page.locator('.date').textContent()
  // Compared as dates rather than as strings, so a change in how the week is written cannot be
  // mistaken for a change in which week it is.
  const weekStart = () =>
    page.evaluate(() => {
      const match = /(\d{4})\D+(\d{1,2})\D+(\d{1,2})/.exec(
        document.querySelector('.date')?.textContent ?? '',
      )
      return match ? match.slice(1).join('-') : null
    })

  const startWeek = await weekStart()
  const startText = await dateText()
  await page.locator('.week-nav button', { hasText: 'Következő' }).click()
  const nextText = await dateText()
  check(
    'next week advances the date',
    nextText !== startText,
    `${startText ?? ''} -> ${nextText ?? ''}`,
  )
  await page.locator('.week-nav button', { hasText: 'Előző' }).click()
  const backWeek = await weekStart()
  check(
    'previous week returns to the same week',
    backWeek === startWeek,
    `${startWeek ?? ''} vs ${backWeek ?? ''}`,
  )
  await page.locator('.week-nav button', { hasText: 'Most' }).click()
  const now = await dateText()
  const expected = await page.evaluate(() => {
    const d = new Date()
    const wd = d.getDay()
    d.setDate(d.getDate() + (wd === 0 ? -6 : 1 - wd))
    const p = (n: number) => String(n).padStart(2, '0')
    return `${String(d.getFullYear())}. ${p(d.getMonth() + 1)}. ${p(d.getDate())}.`
  })
  check(
    '"Most" jumps to this week',
    now?.startsWith(expected) === true,
    `${now ?? ''} (expected start ${expected})`,
  )
  check(
    'week nav is edit-only',
    (await page.locator('.week-nav').getAttribute('class'))?.includes('edit-only') === true,
  )
  // Public holidays. Stepping back to the week of 2026-08-17 puts Aug 20 — Államalapítás — on
  // the Thursday, which is exactly the case postrr ships as its holiday-week fixture.
  await page.locator('.date').click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.type('2026. 08. 17. – 08. 21.')
  await page.keyboard.press('Enter')
  await page.waitForTimeout(150)

  // The moveable ones are the risk: they are derived from Easter rather than looked up. The week
  // of 2026-04-06 opens on Húsvéthétfő.
  await page.locator('.date').click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.type('2026. 04. 06. – 04. 10.')
  await page.keyboard.press('Enter')
  await page.waitForTimeout(150)
  check(
    'an Easter-derived holiday is found too',
    (await page.locator('#day-hetfo .day-closed-toggle').getAttribute('data-holiday')) ===
      'Húsvéthétfő',
    (await page.locator('#day-hetfo .day-closed-toggle').getAttribute('data-holiday')) ?? 'none',
  )

  await page.locator('.date').click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.type('2026. 08. 17. – 08. 21.')
  await page.keyboard.press('Enter')
  await page.waitForTimeout(150)

  const csutortokToggle = page.locator('#day-csutortok .day-closed-toggle')
  check(
    'holiday is flagged on the right weekday',
    (await csutortokToggle.getAttribute('data-holiday')) === 'Államalapítás ünnepe',
    (await csutortokToggle.getAttribute('data-holiday')) ?? 'none',
  )
  check(
    'the suggestion is offered on the toggle',
    (await csutortokToggle.textContent()) === 'Ünnep · Zárva?',
  )
  check(
    'an ordinary weekday is left alone',
    (await page.locator('#day-hetfo .day-closed-toggle').getAttribute('data-holiday')) === null,
  )
  check(
    'a holiday suggestion does not close the day by itself',
    (await page.locator('#day-csutortok .dish-row').count()) > 0,
  )
  check(
    'the suggestion is visible without hovering',
    (await csutortokToggle.evaluate((el) => getComputedStyle(el).opacity)) === '1',
  )

  await csutortokToggle.click()
  await page.waitForTimeout(150)
  check(
    'accepting it closes the day',
    await page.locator('#day-csutortok .closed-panel').isVisible(),
  )
  check(
    "and fills the reason in the poster's own wording",
    (await page.locator('#day-csutortok .closed-note').textContent()) ===
      'ÁLLAMI ÜNNEP · AUGUSZTUS 20.',
    (await page.locator('#day-csutortok .closed-note').textContent()) ?? '',
  )
  check(
    'the page still measures 842x1264',
    (await page.locator('#poster').boundingBox())?.height === 1264,
  )

  // A typed reason is a statement about the shop; the calendar must not overwrite it.
  await page.locator('#day-csutortok .day-closed-toggle').click()
  await page.locator('#day-csutortok .dish-name').first().waitFor()
  const note = page.locator('#day-csutortok .closed-note')
  await page.locator('#day-csutortok .day-closed-toggle').click()
  await note.waitFor()
  await note.click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.type('CSALÁDI NAP')
  await page.keyboard.press('Enter')
  await page.locator('#day-csutortok .day-closed-toggle').click()
  await page.locator('#day-csutortok .day-closed-toggle').click()
  await page.waitForTimeout(150)
  check(
    'a hand-typed reason survives the suggestion',
    (await note.textContent()) === 'CSALÁDI NAP',
    (await note.textContent()) ?? '',
  )

  // A suggestion this feature wrote must not outlive the week it was written for: a reopened day
  // keeps its note, and that note used to block the next week's suggestion. Both 2026-10-23 and
  // 2026-12-25 fall on a Friday.
  const setWeek = async (text: string) => {
    await page.locator('.date').click()
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.type(text)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(150)
  }
  const pentekToggle = page.locator('#day-pentek .day-closed-toggle')
  const pentekNote = page.locator('#day-pentek .closed-note')

  await setWeek('2026. 10. 19. – 10. 23.')
  await pentekToggle.click()
  await page.waitForTimeout(150)
  check(
    'Oct 23 writes its own reason',
    (await pentekNote.textContent()) === 'NEMZETI ÜNNEP · OKTÓBER 23.',
    (await pentekNote.textContent()) ?? '',
  )

  // Geometry: the last day sits against the photos, and a toggle hung below its label lands on
  // one — where it is both unreadable and unclickable, because the photo takes the pointer.
  const lastDayToggle = await page.evaluate(() => {
    const button = document.querySelector('#day-pentek .day-closed-toggle')!
    const t = button.getBoundingClientRect()
    const photo = document.querySelector('.photo-left')!.getBoundingClientRect()
    return {
      overlapsPhoto:
        t.left < photo.right &&
        t.right > photo.left &&
        t.top < photo.bottom &&
        t.bottom > photo.top,
      reachable: button.contains(
        document.elementFromPoint((t.left + t.right) / 2, (t.top + t.bottom) / 2),
      ),
    }
  })
  check("the last day's toggle keeps off the photo", !lastDayToggle.overlapsPhoto)
  check('and stays clickable there', lastDayToggle.reachable)

  await pentekToggle.click()
  await page.waitForTimeout(150)
  await setWeek('2026. 12. 21. – 12. 25.')
  await pentekToggle.click()
  await page.waitForTimeout(150)
  check(
    "a stale suggestion is replaced by the new week's",
    (await pentekNote.textContent()) === 'KARÁCSONY · DECEMBER 25.',
    (await pentekNote.textContent()) ?? '',
  )
  await pentekToggle.click()

  await page.locator('.week-nav button', { hasText: 'Most' }).click()

  // Dish types: a list of recurring prices beside the poster, offered where a price is written.
  check(
    'the type panel lists the defaults',
    (await page.locator('.types-list .types-row').count()) === 3,
    String(await page.locator('.types-list .types-row').count()),
  )
  check(
    'the MENU price is listed separately and cannot be removed',
    (await page.locator('.types-row--fixed .types-remove').count()) === 0 &&
      (await page.locator('.types-row--fixed .types-name--fixed').textContent()) === 'MENÜ',
  )

  const firstPrice = page.locator('#day-szerda .dish-row').first().locator('.dish-price')
  const picker = page.locator('#day-szerda .dish-row').first().locator('.price-picker')
  check(
    'the picker is hidden until the price is hovered',
    (await picker.evaluate((el) => getComputedStyle(el).opacity)) === '0',
  )
  await firstPrice.hover()
  await page.waitForTimeout(200)
  check(
    'hovering the price reveals it',
    (await picker.evaluate((el) => getComputedStyle(el).opacity)) === '1',
  )
  check('it offers one pill per type', (await picker.locator('.price-pill').count()) === 3)

  // Walking the pointer from the price to the pills crosses the gap between them. If that gap
  // hovers neither, the picker disappears before it can be reached.
  const priceBox = (await firstPrice.boundingBox())!
  const pickerBox = (await picker.boundingBox())!
  const opacity = () => picker.evaluate((el) => getComputedStyle(el).opacity)

  await page.mouse.move(priceBox.x + priceBox.width / 2, priceBox.y + priceBox.height / 2)
  await page.mouse.move(pickerBox.x + pickerBox.width + 6, pickerBox.y + pickerBox.height / 2, {
    steps: 10,
  })
  check('it survives the gap between the price and the pills', (await opacity()) === '1')
  await page.mouse.move(pickerBox.x + pickerBox.width / 2, pickerBox.y + pickerBox.height / 2, {
    steps: 10,
  })
  check('and is still there over the pills', (await opacity()) === '1')

  // The bridge must not swallow clicks meant for the price field.
  await firstPrice.click()
  check(
    'the price is still clickable while the picker is open',
    await page.evaluate(() => document.activeElement?.hasAttribute('data-editable') === true),
  )
  await page.keyboard.press('Escape')

  await firstPrice.hover()
  await page.waitForTimeout(150)
  await picker.locator('.price-pill', { hasText: 'Tészta' }).click()
  await page.waitForTimeout(200)
  check(
    'picking a type writes its price',
    (await firstPrice.textContent()) === '1400 Ft',
    (await firstPrice.textContent()) ?? '',
  )

  // Editing a type changes what the picker offers.
  // The name lives in an input's value, which a text filter cannot see, so the row is addressed
  // by position: főzelék, főétel, tészta.
  const tesztaRow = page.locator('.types-list .types-row').nth(2)
  const testaPrice = tesztaRow.locator('.types-price')
  await testaPrice.fill('1550')
  await page.locator('.types-title').click()
  await page.waitForTimeout(200)
  await firstPrice.hover()
  await page.waitForTimeout(200)
  await picker.locator('.price-pill', { hasText: 'Tészta' }).click()
  await page.waitForTimeout(200)
  check(
    'an edited type feeds the picker',
    (await firstPrice.textContent()) === '1550 Ft',
    (await firstPrice.textContent()) ?? '',
  )

  // The MENU row gets exactly one option, its own.
  const menuPicker = page.locator('#day-szerda .menu-row .price-picker')
  await page.locator('#day-szerda .menu-row .dish-price').hover()
  await page.waitForTimeout(200)
  check(
    'the MENU row offers exactly one option',
    (await menuPicker.locator('.price-pill').count()) === 1,
  )
  check(
    'and it is the MENU price',
    (await menuPicker.locator('.price-pill-value').textContent()) === '2000',
  )

  // Adding and removing types.
  await page.locator('.types-add').click()
  await page.waitForTimeout(150)
  check('a type can be added', (await page.locator('.types-list .types-row').count()) === 4)
  await page.locator('.types-list .types-remove').last().click()
  await page.waitForTimeout(150)
  check('and removed', (await page.locator('.types-list .types-row').count()) === 3)

  check(
    'the list survives a reload',
    await page.reload().then(async () => {
      await settle(page)
      return (
        (await page
          .locator('.types-list .types-row')
          .nth(2)
          .locator('.types-price')
          .inputValue()) === '1550'
      )
    }),
  )

  // None of it may reach the output.
  await page.emulateMedia({ media: 'print' })
  const hiddenInPrint = await page.evaluate(() => ({
    panel: getComputedStyle(document.querySelector('.types-panel')!).display,
    picker: getComputedStyle(document.querySelector('.price-picker')!).display,
  }))
  await page.emulateMedia({ media: null })
  check('the type panel is not printed', hiddenInPrint.panel === 'none', hiddenInPrint.panel)
  check('nor is the picker', hiddenInPrint.picker === 'none', hiddenInPrint.picker)

  // "Új hét" clears the board for next week's menu.
  // Located by title, not by text: the label changes to the confirmation once it is armed.
  const newWeek = page.locator('.toolbar button[title*="jövő hét"]')
  // Earlier checks leave some days shut, and a closed day renders no dish rows at all — so open
  // everything first, or the snapshot would not cover the same rows before and after.
  for (const id of ['hetfo', 'kedd', 'szerda', 'csutortok', 'pentek']) {
    if ((await page.locator(`#day-${id} .closed-panel`).count()) > 0) {
      await page.locator(`#day-${id} .day-closed-toggle`).click()
      await page.waitForTimeout(100)
    }
  }
  const pricesBefore = await page.evaluate(() =>
    [...document.querySelectorAll('.dish-price')].map((el) => el.textContent),
  )
  await page.locator('#day-kedd .day-closed-toggle').click()

  await newWeek.click()
  await page.waitForTimeout(150)
  check(
    'it asks before clearing',
    (await newWeek.textContent())?.includes('Biztos') === true,
    (await newWeek.textContent()) ?? '',
  )
  await newWeek.click()
  await page.waitForTimeout(250)

  const expectedNext = await page.evaluate(() => {
    const d = new Date()
    const wd = d.getDay()
    d.setDate(d.getDate() + (wd === 0 ? -6 : 1 - wd) + 7)
    const p = (n: number) => String(n).padStart(2, '0')
    return `${String(d.getFullYear())}. ${p(d.getMonth() + 1)}. ${p(d.getDate())}.`
  })
  check(
    'the week moves to the one after this',
    (await page.locator('.date').textContent())?.startsWith(expectedNext) === true,
    `${(await page.locator('.date').textContent()) ?? ''} (expected start ${expectedNext})`,
  )
  check(
    'every dish name is cleared',
    (await page.evaluate(() =>
      [...document.querySelectorAll('.dish-name')].every((el) => el.textContent === ''),
    )) === true,
  )
  const pricesAfter = await page.evaluate(() =>
    [...document.querySelectorAll('.dish-price')].map((el) => el.textContent),
  )
  check(
    'the prices are kept',
    JSON.stringify(pricesAfter) === JSON.stringify(pricesBefore),
    `${String(pricesBefore.length)} before, ${String(pricesAfter.length)} after`,
  )
  check('a closed day is reopened', (await page.locator('.closed-panel').count()) === 0)
  check(
    'the restaurant details are untouched',
    (await page.locator('.brand-name').textContent()) === 'ZÓNA ÉTTEREM',
  )
  check(
    'the page still measures 842x1264',
    (await page.locator('#poster').boundingBox())?.height === 1264,
  )
  check(
    'it survives a reload like any other edit',
    await page.reload().then(async () => {
      await settle(page)
      return (await page.locator('.date').textContent())?.startsWith(expectedNext) === true
    }),
  )

  // Photos: picking one stores a path beside the HTML plus the cached copy the exporter needs.
  const photoName = 'leves.png'
  await mkdir(join(DIST, 'images'), { recursive: true })
  await copyFile(
    join(import.meta.dirname, '..', 'assets', 'images', 'placeholder-left.png'),
    join(DIST, 'images', photoName),
  )

  await page
    .locator('input[type=file]')
    .first()
    .setInputFiles(join(DIST, 'images', photoName))
  await page.waitForFunction(
    (name) =>
      document.querySelector('img[data-slot=left]')?.getAttribute('src') === `images/${name}`,
    photoName,
    { timeout: 10_000 },
  )
  check('photo stores a relative path', true, `images/${photoName}`)
  check(
    'photo cached for export',
    (await page.getAttribute('img[data-slot=left]', 'data-export-src'))?.startsWith(
      'data:image/jpeg',
    ) === true,
  )

  await page.reload()
  await settle(page)
  const restored = await page.evaluate(() => {
    const img = document.querySelector<HTMLImageElement>('img[data-slot=left]')
    return {
      src: img?.getAttribute('src'),
      loaded: (img?.naturalWidth ?? 0) > 0,
      cached: img?.dataset.exportSrc?.slice(0, 15),
    }
  })
  check('photo path survives reload', restored.src === `images/${photoName}`, restored.src ?? '')
  check('photo loads from disk after reload', restored.loaded)
  check(
    'export cache survives reload',
    restored.cached === 'data:image/jpeg',
    restored.cached ?? 'missing',
  )

  // No edit chrome may survive into an export.
  const chromeVisible = await page.evaluate(() => {
    const poster = document.querySelector<HTMLElement>('#poster')!
    poster.dataset.mode = 'export'
    const shown = [...poster.querySelectorAll('.edit-only')].filter(
      (el) => getComputedStyle(el).display !== 'none',
    ).length
    poster.dataset.mode = 'edit'
    return shown
  })
  check(
    'edit chrome hidden in export mode',
    chromeVisible === 0,
    `${String(chromeVisible)} visible`,
  )

  // PNG export.
  const download = page.waitForEvent('download', { timeout: 30_000 })
  await page.locator('.toolbar button', { hasText: 'PNG' }).click()
  try {
    const file = await download
    const path = await file.path()
    const { readFile } = await import('node:fs/promises')
    const bytes = await readFile(path)
    const width = bytes.readUInt32BE(16)
    const height = bytes.readUInt32BE(20)
    check(
      'PNG is 1684x2528',
      width === 1684 && height === 2528,
      `${String(width)}x${String(height)}`,
    )
    const notice = (await page.locator('.notice').textContent()) ?? ''
    check('PNG export used the cached photo', !notice.includes('kimaradtak'), notice)
    if (SHOTS) await writeFile(join(SHOTS, `export-${name}.png`), bytes)
  } catch (e) {
    check('PNG export', false, e instanceof Error ? e.message.split('\n')[0] : String(e))
  }

  // Printing has to put the poster into the same state as an export, or anything that only makes
  // sense while editing goes onto the paper. A day closed without a reason is the case that shows
  // it: both its placeholder and its empty line are editor-only.
  await page.locator('#day-kedd .day-closed-toggle').click()
  await page.waitForTimeout(150)

  // page.pdf() does not fire the print events, so raise them the way a real print would.
  await page.evaluate(() => {
    window.dispatchEvent(new Event('beforeprint'))
  })
  await page.emulateMedia({ media: 'print' })

  const printed = await page.evaluate(() => {
    const poster = document.querySelector<HTMLElement>('#poster')!
    const note = document.querySelector('#day-kedd .closed-note')!
    const panel = document.querySelector('#day-kedd .closed-panel')!.getBoundingClientRect()
    const line = document.querySelector('#day-kedd .closed-headline')!.getBoundingClientRect()
    const sheet = document.querySelector('.sheet')!.getBoundingClientRect()
    const box = poster.getBoundingClientRect()
    return {
      mode: poster.dataset.mode ?? '',
      placeholder: getComputedStyle(note, '::before').content,
      noteShown: getComputedStyle(note).display !== 'none',
      above: +(line.top - panel.top).toFixed(1),
      below: +(panel.bottom - line.bottom).toFixed(1),
      chrome: [...poster.querySelectorAll('.edit-only')].filter(
        (el) => getComputedStyle(el).display !== 'none',
      ).length,
      fill: {
        width: +(box.width - sheet.width).toFixed(1),
        height: +(box.height - sheet.height).toFixed(1),
        left: +(box.left - sheet.left).toFixed(1),
        top: +(box.top - sheet.top).toFixed(1),
      },
    }
  })

  check('printing leaves edit mode', printed.mode === 'export', printed.mode)
  check('no placeholder reaches the paper', printed.placeholder === 'none', printed.placeholder)
  check('an empty reason takes no space on paper', !printed.noteShown)
  check(
    'so ZÁRVA prints centred',
    Math.abs(printed.above - printed.below) < 1,
    `${String(printed.above)} above, ${String(printed.below)} below`,
  )
  check('no edit chrome is printed', printed.chrome === 0, `${String(printed.chrome)} visible`)
  // The ticket and the photos bleed off the poster's edges, so any margin between poster and
  // paper shows up as them stopping short.
  check(
    'the printed poster fills the sheet edge to edge',
    Object.values(printed.fill).every((d) => Math.abs(d) < 1),
    JSON.stringify(printed.fill),
  )

  // One A4 page, chromium only (firefox has no pdf API).
  if (name === 'chromium') {
    const pdf = await page.pdf({ format: 'A4', printBackground: true })
    const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length
    check('prints on exactly one A4 page', pages === 1, `${String(pages)} pages`)
    if (SHOTS) await writeFile(join(SHOTS, 'print-chromium.pdf'), pdf)
  }

  await page.emulateMedia({ media: null })
  await page.evaluate(() => {
    window.dispatchEvent(new Event('afterprint'))
  })
  check(
    'and returns to edit mode afterwards',
    (await page.getAttribute('#poster', 'data-mode')) === 'edit',
    (await page.getAttribute('#poster', 'data-mode')) ?? '',
  )
  await page.locator('#day-kedd .day-closed-toggle').click()

  check('no page errors', errors.length === 0, errors.slice(0, 2).join(' | '))
  await page.close()
}

for (const [name, engine] of Object.entries(engines)) {
  if (only && only !== name) continue
  const browser = await engine.launch()
  try {
    await run(name, browser)
  } finally {
    await browser.close()
  }
}

console.log(failures === 0 ? '\nAll checks passed.' : `\n${String(failures)} check(s) failed.`)
process.exit(failures === 0 ? 0 : 1)
