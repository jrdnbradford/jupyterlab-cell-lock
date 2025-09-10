import { test, expect } from '@jupyterlab/galata';
import {
  setupNotebook,
  createTestCells,
  lockCells,
  clickAndWaitStatus,
  getStatusMessage
} from './helpers';

test.describe('Status Bar Message Checks', () => {
  test.beforeEach(async ({ page }) => {
    await setupNotebook(page);
    await createTestCells(page);
  });

  test('lock status message shows correct text', async ({ page }) => {
    await clickAndWaitStatus(page, 'Lock all cells');
    const cellCount = await page.notebook.getCellCount();
    const message = await getStatusMessage(page);
    expect(message).toBe(`${cellCount} cells were successfully locked.`);
  });

  test('unlock status message shows correct text for all locked cells', async ({
    page
  }) => {
    await lockCells(page);
    await clickAndWaitStatus(page, 'Unlock all cells');
    const cellCount = await page.notebook.getCellCount();
    const message = await getStatusMessage(page);
    expect(message).toBe(`${cellCount} cells were successfully unlocked.`);
  });

  test('unlock status message shows correct text after partial lock', async ({
    page
  }) => {
    await lockCells(page);
    const initialCellCount = await page.notebook.getCellCount();
    await page.notebook.addCell('code', 'test');
    await page.waitForTimeout(500);

    await clickAndWaitStatus(page, 'Unlock all cells');
    const message = await getStatusMessage(page);
    expect(message).toBe(
      `${initialCellCount} cells were successfully unlocked. (1 already unlocked).`
    );
  });
});
