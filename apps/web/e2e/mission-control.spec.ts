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

  await expect(page.getByText('Drone registered successfully.')).toBeVisible();
  await expect(page.getByRole('link', { name: uniqueSerial })).toBeVisible();

  await page.goto('/missions');

  await page.getByTestId('mission-name-input').fill(missionName);
  const droneOptionValue = await page
    .getByTestId('mission-drone-select')
    .locator(`option:has-text("${uniqueSerial}")`)
    .getAttribute('value');

  expect(droneOptionValue).toBeTruthy();

  await page
    .getByTestId('mission-drone-select')
    .selectOption(droneOptionValue as string);
  await page.getByLabel('Pilot name').fill('E2E Pilot');
  await page.getByLabel('Site location').fill('Hamburg, Germany');
  await page.getByTestId('create-mission-submit').click();

  await expect(page.getByText('Mission scheduled successfully.')).toBeVisible();
  await page.getByRole('cell', { name: missionName }).click();

  await page.getByTestId('mission-transition-submit').click();
  await expect(
    page.getByText('Mission status updated successfully.'),
  ).toBeVisible();

  await page.getByRole('cell', { name: missionName }).click();
  await page.getByTestId('mission-transition-submit').click();
  await expect(
    page.getByText('Mission status updated successfully.'),
  ).toBeVisible();

  await page.getByRole('cell', { name: missionName }).click();
  await page.getByLabel('Flight hours logged').fill('2');
  await page.getByTestId('mission-transition-submit').click();
  await expect(
    page.getByText('Mission status updated successfully.'),
  ).toBeVisible();

  await page.goto('/drones');
  const droneRow = page.locator('tr', {
    has: page.getByRole('link', { name: uniqueSerial }),
  });

  await expect(
    droneRow.getByRole('link', { name: uniqueSerial }),
  ).toBeVisible();
  await expect(droneRow.getByText('MAINTENANCE')).toBeVisible();
});
