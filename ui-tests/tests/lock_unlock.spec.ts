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

test.describe('Dialog Text Checks', () => {
  test.beforeEach(async ({ page }) => {
    await setupNotebook(page);
    await createTestCells(page);
  });

  test('lock dialog shows correct message for cells', async ({ page }) => {
    const message = await getDialogMessage(page, 'Lock all cells');
    const cellCount = await page.notebook.getCellCount();
    expect(message).toBe(
      `${cellCount} cells were successfully locked. All cells are now read-only and undeletable.`
    );
  });

  test('unlock dialog shows correct message for all already locked cells', async ({
    page
  }) => {
    await lockCells(page);
    const message = await getDialogMessage(page, 'Unlock all cells');
    const cellCount = await page.notebook.getCellCount();
    expect(message).toBe(
      `${cellCount} cells were successfully unlocked. All cells are now editable and deletable.`
    );
  });

  test('unlock dialog shows correct message after locking', async ({
    page
  }) => {
    await lockCells(page);
    const initialCellCount = await page.notebook.getCellCount();
    await page.notebook.addCell('code', 'test');
    await page.waitForTimeout(500);

    const message = await getDialogMessage(page, 'Unlock all cells');
    expect(message).toBe(
      `${initialCellCount} cells were successfully unlocked. 1 cell was already unlocked. All cells are now editable and deletable.`
    );
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
  await page.waitForSelector(
    '#jp-main-statusbar >> text=Python 3 (ipykernel) | Idle'
  );
}

/**
 * Creates the initial set of test cells.
 * @param {import('@playwright/test').Page} page
 */
async function createTestCells(page: any) {
  await page.notebook.setCell(0, 'markdown', '# Hello, World');
  await page.notebook.addCell('code', 'print("Hello, World")');
  await page.notebook.addCell('raw', 'Hello, World)');
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

/**
 * Clicks the specified button and retrieves the dialog message.
 * @param {import('@playwright/test').Page} page
 * @param {string} buttonText
 */
async function getDialogMessage(page: any, buttonText: string) {
  await page.click(`jp-button:has-text("${buttonText}")`);
  await page.waitForSelector('.jp-Dialog-body');
  const dialogBody = await page.locator('.jp-Dialog-body').textContent();
  await page.click('.jp-Dialog button.jp-mod-accept');
  return dialogBody;
}
