import { expect } from '@jupyterlab/galata';

/**
 * Sets up a new notebook instance.
 */
export async function setupNotebook(page: any) {
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
export async function createTestCells(page: any) {
  await page.notebook.setCell(0, 'markdown', '# Hello, World');
  await page.notebook.addCell('code', 'print("Hello, World")');
  await page.notebook.addCell('raw', 'Hello, World');
}

/**
 * Locks all cells in the notebook.
 */
export async function lockCells(page: any) {
  await clickAndWaitStatus(page, 'Lock all cells');
}

/**
 * Unlocks all cells in the notebook.
 */
export async function unlockCells(page: any) {
  await clickAndWaitStatus(page, 'Unlock all cells');
}

/**
 * Tests cell deletion behavior.
 */
export async function testCellDeletion(page: any, isLocked: boolean) {
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
export async function testCellEditing(page: any, isLocked: boolean) {
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
export async function clickAndWaitStatus(page: any, buttonText: string) {
  await page.click(`jp-button:has-text("${buttonText}")`);
  await page.waitForSelector('.jp-CellLockStatus', { timeout: 2000 });
}

/**
 * Gets the current transient status message text.
 */
export async function getStatusMessage(page: any) {
  return await page.locator('.jp-CellLockStatus').textContent();
}
