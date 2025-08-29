import { test, expect } from '@jupyterlab/galata';

test.describe('Lock/Unlock Cell Interactions', () => {
  test.beforeEach(async ({ page }) => {
    // Standard setup: close sidebar, create new notebook, and wait for kernel
    await page.sidebar.close();
    await page.menu.clickMenuItem('File>New>Notebook');
    await page.click('button:has-text("Select")');
    await page.waitForSelector(
      '#jp-main-statusbar >> text=Python 3 (ipykernel) | Idle'
    );

    // Create multiple cells
    await page.notebook.setCell(0, 'markdown', '# Test');
    await page.notebook.addCell('code', 'print("Hello, world")');
    await page.notebook.addCell('code', 'print("Hello, JupyterLab")');
  });

  test('cannot delete a locked cell', async ({ page }) => {
    await page.click('jp-button:has-text("Lock all cells")');
    await page.waitForSelector('.jp-Dialog');
    await page.click('.jp-Dialog button.jp-mod-accept');
    const deleteButton = page.locator('button[aria-label="Delete this cell (D, D)"]');
    const initialCellCount = await page.notebook.getCellCount();
    for (let i = 0; i < initialCellCount; i++) {
      await page.notebook.selectCells(0, 0);
      await deleteButton.click();
    }
    const finalCellCount = await page.notebook.getCellCount();
    console.log("initialCellCount " + initialCellCount + "; finalCellCount " + finalCellCount)
    expect(finalCellCount).toBe(initialCellCount);
  });

  test('cannot edit a locked cell', async ({ page }) => {
    await page.click('jp-button:has-text("Lock all cells")');
    await page.waitForSelector('.jp-Dialog');
    await page.click('.jp-Dialog button.jp-mod-accept');
    const initialCellCount = await page.notebook.getCellCount();

    for (let i = 0; i < initialCellCount; i++) {
      await page.notebook.selectCells(i, i);
      const cell = await page.notebook.getCellLocator(i)
      const initialCellContent = await cell?.textContent();
      await page.notebook.enterCellEditingMode(i);
      await page.keyboard.type("-test");
      const finalCellContent = await cell?.textContent();
      console.log("initialCellContent: " + initialCellContent + "; finalCellContent: " + finalCellContent);
      expect(initialCellContent).toBe(finalCellContent);
    }
  });
});
