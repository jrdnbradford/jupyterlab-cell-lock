import { test } from '@jupyterlab/galata';
import {
  setupNotebook,
  createTestCells,
  lockCells,
  unlockCells,
  testCellDeletion,
  testCellEditing
} from './helpers';

test.describe('Lock/Unlock Cell Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await setupNotebook(page);
    await createTestCells(page);
  });

  test('normal JupyterLab cell editing/deleting behavior', async ({ page }) => {
    await testCellDeletion(page, false);
    await testCellEditing(page, false);
  });

  test('locked cells cannot be edited or deleted', async ({ page }) => {
    await lockCells(page);
    await testCellDeletion(page, true);
    await testCellEditing(page, true);
  });

  test('can lock and then unlock cells to edit', async ({ page }) => {
    await lockCells(page);
    await testCellEditing(page, true);
    await unlockCells(page);
    await testCellEditing(page, false);
  });
});
