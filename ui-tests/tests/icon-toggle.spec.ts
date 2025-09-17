import { test, expect } from '@jupyterlab/galata';
import { setupNotebook, createTestCells, lockCells } from './helpers';

test.describe('Cell lock/edit icon interactions', () => {
  test.beforeEach(async ({ page }) => {
    await setupNotebook(page);
    await createTestCells(page);
  });

  test('editable cells show edit icon', async ({ page }) => {
    const initialCellCount = await page.notebook.getCellCount();
    const icons = page.locator('.jp-CellLockIcon >> svg');
    await expect(icons).toHaveCount(initialCellCount);

    for (let i = 0; i < initialCellCount; i++) {
      await expect(icons.nth(i)).toHaveAttribute('data-icon', 'ui-components:edit');
    }
  });

  test('locked cells show lock icon', async ({ page }) => {
    await lockCells(page);
    const initialCellCount = await page.notebook.getCellCount();
    const icons = page.locator('.jp-CellLockIcon >> svg');
    await expect(icons).toHaveCount(initialCellCount);

    for (let i = 0; i < initialCellCount; i++) {
      await expect(icons.nth(i)).toHaveAttribute('data-icon', 'ui-components:lock');
    }
  });


  test('clicking edit icon locks the cell', async ({ page }) => {
    const firstIcon = page.locator('.jp-CellLockIcon').first();
    await firstIcon.click(); // Lock
    // Editing should fail
    const cell = await page.notebook.getCellLocator(0);
    const initialContent = await cell?.textContent();
    await page.notebook.enterCellEditingMode(0);
    await page.keyboard.type('-test');
    const finalContent = await cell?.textContent();
    expect(finalContent).toBe(initialContent);
  });

  test('clicking lock icon unlocks the cell', async ({ page }) => {
    const firstIcon = page.locator('.jp-CellLockIcon').first();
    await firstIcon.click(); // Lock
    const lockIcon = page.locator('.jp-CellLockIcon').first();
    await lockIcon.click(); // Unlock

    // Editing should succeed
    const cell = await page.notebook.getCellLocator(0);
    const initialContent = await cell?.textContent();
    await page.notebook.enterCellEditingMode(0);
    await page.keyboard.type('-test');
    const finalContent = await cell?.textContent();
    expect(finalContent).toBe(initialContent + '-test');
  });
});
