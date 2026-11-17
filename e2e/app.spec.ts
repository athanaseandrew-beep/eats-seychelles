import { expect, test, type Page } from '@playwright/test'

/** Fails the test if the page throws an uncaught error. */
function trackErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  return errors
}

test.describe('every role view loads', () => {
  const routes: [string, RegExp | string][] = [
    ['/', 'Kaz Kreol'],
    ['/store/r1', 'Octopus Curry (Kari Zourit)'],
    ['/orders', 'No orders yet'],
    ['/merchant', '#4821'],
    ['/merchant/menu', 'Octopus Curry (Kari Zourit)'],
    ['/courier', /online/i],
    ['/admin', /EAT-4795/],
    ['/admin/onboarding', 'Chez Batista'],
    ['/admin/fees', 'Service fee cap'],
    ['/admin/disputes', 'D-1042'],
  ]
  for (const [path, text] of routes) {
    test(path, async ({ page }) => {
      const errors = trackErrors(page)
      await page.goto(path)
      await expect(page.getByText(text).first()).toBeVisible()
      expect(errors).toEqual([])
    })
  }
})

test('unknown routes redirect home', async ({ page }) => {
  await page.goto('/does-not-exist')
  await expect(page).toHaveURL(/\/$/)
})

test('customer orders from Kaz Kreol and the merchant receives it', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/')

  // Open the store and the item.
  await page.getByText('Kaz Kreol').first().click()
  await expect(page).toHaveURL(/\/store\/r1$/)
  await page.getByRole('button', { name: /Octopus Curry \(Kari Zourit\)/ }).first().click()

  // Required options are validated before adding.
  const item = page.getByRole('dialog')
  await item.getByRole('button', { name: /^Add 1/ }).click()
  await expect(item.getByText('Please make a selection').first()).toBeVisible()
  await item.getByText('Regular', { exact: true }).click()
  await item.getByText('Mild', { exact: true }).click()
  await item.getByRole('button', { name: /^Add 1/ }).click()
  await expect(item).toBeHidden()

  // Cart → checkout → place order.
  await page.getByRole('button', { name: 'Open cart' }).click()
  const cart = page.getByRole('dialog')
  await expect(cart.getByText('Octopus Curry (Kari Zourit)')).toBeVisible()
  await cart.getByRole('button', { name: 'Go to checkout' }).click()
  await cart.getByRole('button', { name: 'EATS20' }).click()
  await cart.getByRole('button', { name: /Place order/ }).click()

  await expect(page).toHaveURL(/\/track\/EAT-\d{4}$/)
  const orderNumber = page.url().split('EAT-').pop()!

  // Same tab, client-side navigation keeps the shared store: the merchant sees the order
  // (the KDS shows it as #1234) under "New incoming".
  await page.getByRole('navigation', { name: 'Role switcher' }).getByRole('link', { name: /Merchant/ }).click()
  await expect(page).toHaveURL(/\/merchant$/)
  await expect(page.getByText(`#${orderNumber}`, { exact: true })).toBeVisible()

  expect(errors).toEqual([])
})
