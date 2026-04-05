import { expect, test } from '@playwright/test';
import type { SkyopsApiErrorBody } from './api-types';

const API_BASE = 'http://127.0.0.1:3000/api';

test('API rejects a second mission that overlaps an active window on the same drone', async ({
  page,
}) => {
  const uniqueSerial = `SKY-N${Date.now().toString().slice(-3)}-X9Y8`;

  await page.goto('/sign-in');
  await page.getByTestId('signin-email-input').fill('e2e@skyops.test');
  await page.getByTestId('signin-password-input').fill('E2eTestPass1');
  await page.getByTestId('signin-submit').click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto('/drones');
  await page.getByTestId('drone-serial-input').fill(uniqueSerial);
  await page.getByLabel('Total flight hours').fill('10');
  await page.getByLabel('Hours at last maintenance').fill('0');
  await page.getByTestId('create-drone-submit').click();
  await expect(page.getByText(/registered successfully/i)).toBeVisible();

  const token = await page.evaluate(() =>
    localStorage.getItem('skyops_access_token'),
  );
  expect(token).toBeTruthy();

  const listRes = await page.request.get(`${API_BASE}/drones`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(listRes.ok()).toBeTruthy();
  const listJson = (await listRes.json()) as {
    data: { id: string; serialNumber: string }[];
  };
  const drone = listJson.data.find((d) => d.serialNumber === uniqueSerial);
  expect(drone).toBeTruthy();

  const window = {
    plannedStart: '2031-05-10T12:00:00.000Z',
    plannedEnd: '2031-05-10T14:00:00.000Z',
  };

  const first = await page.request.post(`${API_BASE}/missions`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: {
      name: 'First slot',
      type: 'WIND_TURBINE_INSPECTION',
      droneId: drone!.id,
      pilotName: 'E2E',
      siteLocation: 'Test site',
      ...window,
    },
  });
  expect(first.status()).toBe(201);

  const second = await page.request.post(`${API_BASE}/missions`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: {
      name: 'Overlap attempt',
      type: 'WIND_TURBINE_INSPECTION',
      droneId: drone!.id,
      pilotName: 'E2E',
      siteLocation: 'Test site',
      ...window,
    },
  });
  expect(second.status()).toBe(409);
  const errBody = (await second.json()) as SkyopsApiErrorBody;
  const msg = Array.isArray(errBody.message)
    ? errBody.message.join(' ')
    : (errBody.message ?? '');
  expect(msg.toLowerCase()).toMatch(/time window|overlapping|scheduled/i);
});
