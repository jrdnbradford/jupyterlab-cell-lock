import { test, expect } from '@jupyterlab/galata';

test.describe('Lock/Unlock Cell Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await setupNotebook(page);
    await createTestCells(page);
  });

  test('unlocked cells can be edited and deleted', async ({ page }) => {
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

/**
 * Sets up a new notebook instance.
 * @param {import('@playwright/test').Page} page
 */
async function setupNotebook(page: any) {
  await page.sidebar.close();
  await page.menu.clickMenuItem('File>New>Notebook');
  await page.click('button:has-text("Select")');
  await page.waitForSelector('#jp-main-statusbar >> text=Python 3 (ipykernel) | Idle');
}

/**
 * Creates the initial set of test cells.
 * @param {import('@playwright/test').Page} page
 */
async function createTestCells(page: any) {
  await page.notebook.setCell(0, 'markdown', '# Test');
  await page.notebook.addCell('code', 'print("Hello, world")');
  await page.notebook.addCell('code', 'print("Hello, JupyterLab")');
}

/**
 * Locks all cells in the notebook.
 * @param {import('@playwright/test').Page} page
 */
async function lockCells(page: any) {
  await page.click('jp-button:has-text("Lock all cells")');
  await page.waitForSelector('.jp-Dialog');
  await page.click('.jp-Dialog button.jp-mod-accept');
}

/**
 * Unlocks all cells in the notebook.
 * @param {import('@playwright/test').Page} page
 */
async function unlockCells(page: any) {
  await page.click('jp-button:has-text("Unlock all cells")');
  await page.waitForSelector('.jp-Dialog');
  await page.click('.jp-Dialog button.jp-mod-accept');
}

/**
 * Tests cell deletion behavior.
 * @param {import('@playwright/test').Page} page
 * @param {boolean} isLocked
 */
async function testCellDeletion(page: any, isLocked: boolean) {
  const initialCellCount = await page.notebook.getCellCount();
  for (let i = 0; i < initialCellCount; i++) {
    await page.notebook.selectCells(0, 0);
    // The cell delete shortcut
    await page.keyboard.press('d');
    await page.keyboard.press('d');
  }
  const finalCellCount = await page.notebook.getCellCount();
  if (isLocked) {
    expect(finalCellCount).toBe(initialCellCount);
  } else {
    // JupyterLab ensures there is always one cell
    expect(finalCellCount).toBe(1);
  }
}

/**
 * Tests cell editing behavior.
 * @param {import('@playwright/test').Page} page
 * @param {boolean} isLocked
 */
async function testCellEditing(page: any, isLocked: boolean) {
  const initialCellCount = await page.notebook.getCellCount();
  for (let i = 0; i < initialCellCount; i++) {
    await page.notebook.selectCells(i, i);
    const cell = await page.notebook.getCellLocator(i);
    const initialCellContent = await cell.textContent();
    await page.notebook.enterCellEditingMode(i);
    await page.keyboard.type('-test');
    const finalCellContent = await cell.textContent();
    if (isLocked) {
      expect(finalCellContent).toBe(initialCellContent);
    } else {
      expect(finalCellContent).toBe(initialCellContent + '-test');
    }
  }
}
