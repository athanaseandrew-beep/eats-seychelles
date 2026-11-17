import { expect, test } from '@playwright/test'
import path from 'node:path'

const pdf = (name: string) => ({ name, mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 test') })

test('restaurant registers, pays SCR 200, gets approved and goes live', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  const name = `Chez Playwright ${Date.now() % 10000}`

  await page.goto('/partner')
  await expect(page.getByRole('heading', { name: /Grow your business/ })).toBeVisible()
  await expect(page.getByText('SCR 200.00').first()).toBeVisible()
  await page.getByRole('link', { name: /Start registration/ }).click()

  // Step 1 — validation, then business details
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByText('Enter your business name')).toBeVisible()
  await page.getByPlaceholder('e.g. Chez Batista').fill(name)
  await page.getByPlaceholder('e.g. Creole · Seafood').fill('Creole · Seafood')
  await page.getByRole('button', { name: /Creole/ }).click()
  await page.getByPlaceholder('e.g. B8412345').fill('B7654321')
  await page.getByPlaceholder('e.g. Takamaka, Coastal Road').fill('Takamaka, Coastal Road')
  await page.getByRole('button', { name: 'Continue' }).click()

  // Step 2 — contact
  await page.getByPlaceholder('e.g. Marc Batista').fill('Marie Hoareau')
  await page.getByPlaceholder('2 512 345').fill('123')
  await page.getByPlaceholder('you@business.sc').fill('marie@example.sc')
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByText(/7-digit Seychelles number/)).toBeVisible()
  await page.getByPlaceholder('2 512 345').fill('2 512 345')
  await page.getByRole('button', { name: 'Continue' }).click()

  // Step 3 — cover photo + documents (menu later)
  await page.getByLabel('Cover photo').setInputFiles(path.join(process.cwd(), 'public/images/r3-burger.jpg'))
  await expect(page.getByAltText('Cover preview')).toBeVisible()
  await page.getByLabel('Upload Trade licence').setInputFiles(pdf('trade-licence.pdf'))
  await page.getByLabel('Upload Food hygiene certificate').setInputFiles(pdf('hygiene.pdf'))
  await page.getByLabel('Upload Proof of bank account').setInputFiles(pdf('bank-letter.pdf'))
  await page.getByText(/add my menu later/).click()
  await page.getByRole('button', { name: 'Continue' }).click()

  // Step 4 — plan + terms
  await page.getByRole('radio', { name: /Plus/ }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByText('Please accept the partner terms')).toBeVisible()
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Continue' }).click()

  // Step 5 — pay (demo)
  await expect(page.getByText(/Demo mode/)).toBeVisible()
  await page.getByRole('button', { name: /Pay SCR 200\.00 & submit/ }).click()
  await expect(page).toHaveURL(/\/partner\/status\/APP-[A-Z0-9]+$/)
  await expect(page.getByRole('heading', { name: /reviewing your application/ })).toBeVisible()
  await expect(page.getByText(/First month paid · SCR 200\.00/)).toBeVisible()
  const statusUrl = page.url()

  // Admin approves it
  await page.getByRole('navigation', { name: 'Role switcher' }).getByRole('link', { name: /Admin/ }).click()
  await page.getByRole('link', { name: /Onboarding/ }).filter({ visible: true }).first().click()
  const card = page.locator('.card', { hasText: name })
  await expect(card.getByText(/Paid SCR 200\.00/)).toBeVisible()
  await card.getByRole('button', { name: 'Approve' }).click()
  await expect(card).toBeHidden() // leaves the review queue…
  await page.getByRole('button', { name: 'All', exact: true }).click()
  await expect(card.getByText(/now visible in the Customer feed/)).toBeVisible() // …and shows as live under "All"

  // It's saved: a full reload keeps the approval, and the store is live with its photo + 30-day plan
  await page.goto(statusUrl)
  await expect(page.getByRole('heading', { name: `${name} is live!` })).toBeVisible()
  await page.getByRole('link', { name: 'View your store' }).click()
  await expect(page.getByAltText(`${name} cover photo`)).toBeVisible()

  await page.goto(statusUrl)
  await page.getByRole('link', { name: 'Open Merchant portal' }).click()
  await page.getByRole('link', { name: 'Billing' }).click()
  await expect(page.getByText('Listing plan')).toBeVisible()
  await expect(page.getByText('Active', { exact: true })).toBeVisible()
  await expect(page.getByRole('cell', { name: 'SCR 200.00' })).toBeVisible()

  expect(errors).toEqual([])
})

test('store photos load', async ({ page }) => {
  await page.goto('/')
  const img = page.getByAltText('Forno Napoli cover photo').first()
  await expect(img).toBeVisible()
  expect(await img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true)
})

test('merchant can renew the listing fee', async ({ page }) => {
  await page.goto('/merchant/billing')
  await expect(page.getByText('Listing plan')).toBeVisible()
  // No sideways scrolling on any screen size
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  const rows = page.getByRole('row')
  const before = await rows.count()
  await page.getByRole('button', { name: 'Pay SCR 200.00' }).click()
  await expect(page.getByText('Payment received')).toBeVisible()
  await expect(rows).toHaveCount(before + 1)
})
