import { expect, test } from '@playwright/test';

test('creates a drone, schedules a mission, transitions it, and reflects the fleet status', async ({
  page,
}) => {
  const uniqueSerial = `SKY-E${Date.now().toString().slice(-3)}-A1B2`;
  const missionName = `E2E Mission ${Date.now().toString().slice(-5)}`;

  await page.goto('/sign-in');
  await page.getByTestId('signin-email-input').fill('e2e@skyops.test');
  await page.getByTestId('signin-password-input').fill('E2eTestPass1');
  await page.getByTestId('signin-submit').click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto('/drones');

  await page.getByTestId('drone-serial-input').fill(uniqueSerial);
  await page.getByLabel('Total flight hours').fill('49');
  await page.getByLabel('Hours at last maintenance').fill('0');
  await page.getByTestId('create-drone-submit').click();

  await expect(
    page.getByText(/registered successfully/i),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: uniqueSerial })).toBeVisible();

  await page.goto('/missions');

  await page.getByTestId('mission-name-input').fill(missionName);
  await page.getByTestId('mission-drone-select').click();
  await page
    .getByRole('option', { name: new RegExp(uniqueSerial) })
    .click();
  await page.getByLabel('Pilot name').fill('E2E Pilot');
  await page.getByLabel('Site location').fill('Hamburg, Germany');

  const createMissionResponse = page.waitForResponse((res) => {
    if (res.request().method() !== 'POST') return false;
    try {
      const { pathname } = new URL(res.url());
      return pathname.endsWith('/missions');
    } catch {
      return false;
    }
  });
  await page.getByTestId('create-mission-submit').click();
  const created = await createMissionResponse;
  expect(
    created.status(),
    `POST /missions failed: ${await created.text()}`,
  ).toBe(201);

  await expect(
    page.getByText('Mission Scheduled', { exact: false }).first(),
  ).toBeVisible();
  await page.getByRole('cell', { name: missionName }).click();

  await page.getByTestId('mission-transition-submit').click();
  await expect(
    page.getByText(/successfully transitioned/i).first(),
  ).toBeVisible();

  await page.getByRole('cell', { name: missionName }).click();
  await page.getByTestId('mission-transition-submit').click();
  await expect(
    page.getByText(/successfully transitioned/i).first(),
  ).toBeVisible();

  await page.getByRole('cell', { name: missionName }).click();
  await page.getByLabel('Flight hours logged').fill('2');
  await page.getByTestId('mission-transition-submit').click();
  await expect(
    page.getByText(/successfully transitioned/i).first(),
  ).toBeVisible();

  await page.goto('/dashboard');
  await expect(page.getByText('Fleet Health')).toBeVisible();
  await expect(page.getByText('Maintenance watchlist')).toBeVisible();

  await page.goto('/drones');
  const droneRow = page.locator('tr', {
    has: page.getByRole('link', { name: uniqueSerial }),
  });

  await expect(
    droneRow.getByRole('link', { name: uniqueSerial }),
  ).toBeVisible();
  await expect(droneRow.getByText('MAINTENANCE')).toBeVisible();
});
