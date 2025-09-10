import { test, expect } from '@jupyterlab/galata';

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

test.describe('Status Bar Message Checks', () => {
  test.beforeEach(async ({ page }) => {
    await setupNotebook(page);
    await createTestCells(page);
  });

  test('lock status message shows correct text', async ({ page }) => {
    await clickAndWaitStatus(page, 'Lock all cells');
    const cellCount = await page.notebook.getCellCount();
    const message = await getStatusMessage(page);
    expect(message).toBe(
      `${cellCount} cells were successfully locked.`
    );
  });

  test('unlock status message shows correct text for all locked cells', async ({
    page
  }) => {
    await lockCells(page);
    await clickAndWaitStatus(page, 'Unlock all cells');
    const cellCount = await page.notebook.getCellCount();
    const message = await getStatusMessage(page);
    expect(message).toBe(
      `${cellCount} cells were successfully unlocked.`
    );
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

/**
 * Sets up a new notebook instance.
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
 */
async function createTestCells(page: any) {
  await page.notebook.setCell(0, 'markdown', '# Hello, World');
  await page.notebook.addCell('code', 'print("Hello, World")');
  await page.notebook.addCell('raw', 'Hello, World');
}

/**
 * Locks all cells in the notebook.
 */
async function lockCells(page: any) {
  await clickAndWaitStatus(page, 'Lock all cells');
}

/**
 * Unlocks all cells in the notebook.
 */
async function unlockCells(page: any) {
  await clickAndWaitStatus(page, 'Unlock all cells');
}

/**
 * Tests cell deletion behavior.
 */
async function testCellDeletion(page: any, isLocked: boolean) {
  const initialCellCount = await page.notebook.getCellCount();
  for (let i = 0; i < initialCellCount; i++) {
    await page.notebook.selectCells(0, 0);
    await page.keyboard.press('d');
    await page.keyboard.press('d');
  }
  const finalCellCount = await page.notebook.getCellCount();
  if (isLocked) {
    expect(finalCellCount).toBe(initialCellCount);
  } else {
    expect(finalCellCount).toBe(1);
  }
}

/**
 * Tests cell editing behavior.
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
 * Clicks a lock/unlock button and waits for a status message to appear.
 */
async function clickAndWaitStatus(page: any, buttonText: string) {
  await page.click(`jp-button:has-text("${buttonText}")`);
  await page.waitForSelector('.jp-CellLockStatus', { timeout: 2000 });
}

/**
 * Gets the current transient status message text.
 */
async function getStatusMessage(page: any) {
  return await page.locator('.jp-CellLockStatus').textContent();
}
