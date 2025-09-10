import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';
import { IStatusBar } from '@jupyterlab/statusbar';
import { ToolbarButton } from '@jupyterlab/apputils';
import { lockIcon, editIcon } from '@jupyterlab/ui-components';
import { Widget } from '@lumino/widgets';

class CellLockStatus extends Widget {
  private _statusNode: HTMLElement;
  private _timer: number | null = null;

  constructor() {
    super();

    this._statusNode = document.createElement('span');
    this._statusNode.classList.add('jp-CellLockStatus');
    this._statusNode.style.display = 'inline-flex';
    this._statusNode.style.alignItems = 'center';
    this._statusNode.style.padding = '0 8px';
    this._statusNode.style.fontSize = 'var(--jp-ui-font-size1)';
    this._statusNode.innerText = '';
    this.node.appendChild(this._statusNode);
    this.node.style.display = 'inline-flex';
    this.node.style.alignItems = 'center';
  }

  setTemporaryStatus(summary: string, timeoutMs = 4000) {
    this._statusNode.innerText = summary;

    if (this._timer) {
      window.clearTimeout(this._timer);
    }

    this._timer = window.setTimeout(() => {
      this._statusNode.innerText = '';
      this._timer = null;
    }, timeoutMs);
  }
}

const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-cell-lock:plugin',
  autoStart: true,
  requires: [INotebookTracker],
  optional: [IStatusBar],
  activate: (
    app: JupyterFrontEnd,
    tracker: INotebookTracker,
    statusBar: IStatusBar | null
  ) => {
    console.log('jupyterlab-cell-lock extension activated!');

    const asBool = (v: unknown) => (typeof v === 'boolean' ? v : true);

    // Create a status bar widget
    let statusWidget: CellLockStatus | null = null;
    if (statusBar) {
      statusWidget = new CellLockStatus();
      statusBar.registerStatusItem('cellLockStatus', {
        item: statusWidget,
        align: 'middle'
      });
    }

    const applyCellLockIcon = (
      cellModel: any,
      cellWidget: any,
      retryCount = 0
    ) => {
      // JupyterLab may omit "editable"/"deletable" when they are true,
      // as this is the default. To handle this correctly, the extension treats
      // missing values as true so the comparison logic works as expected.
      const editable = asBool(cellModel.getMetadata('editable'));
      const deletable = asBool(cellModel.getMetadata('deletable'));

      const promptNode = cellWidget.node.querySelector(
        '.jp-InputPrompt.jp-InputArea-prompt'
      );

      if (!promptNode) {
        if (retryCount < 10) {
          setTimeout(() => {
            applyCellLockIcon(cellModel, cellWidget, retryCount + 1);
          }, 10);
        }
        return;
      }

      // Remove old lock icon if present
      const existing = promptNode.querySelector('.jp-CellLockIcon');
      if (existing) {
        existing.remove();
      }

      // Add the icon if the cell is locked in any way
      if (!editable || !deletable) {
        const iconNode = document.createElement('span');
        iconNode.className = 'jp-CellLockIcon';

        // Construct the tooltip message
        let tooltipMessage = 'This cell is ';
        const isReadOnly = !editable;
        const isUndeletable = !deletable;

        if (isReadOnly && isUndeletable) {
          tooltipMessage += 'read-only and undeletable.';
        } else if (isReadOnly) {
          tooltipMessage += 'read-only but can be deleted.';
        } else if (isUndeletable) {
          tooltipMessage += 'undeletable but can be edited.';
        }

        iconNode.title = tooltipMessage;

        lockIcon.element({
          container: iconNode,
          elementPosition: 'left',
          height: '14px',
          width: '14px'
        });
        promptNode.appendChild(iconNode);
      }
    };

    const toggleCellMetadata = (
      editable: boolean,
      deletable: boolean,
      tracker: INotebookTracker
    ) => {
      const current = tracker.currentWidget;
      if (!current) {
        console.warn('No active notebook.');
        return;
      }

      const notebook = current.content;
      const cells = notebook.model?.cells;
      if (!cells) {
        return;
      }

      let editedCellCount = 0;
      let nonEditedCellCount = 0;
      for (let i = 0; i < cells.length; i++) {
        const cellModel = cells.get(i);
        const cellWidget = notebook.widgets[i];

        const isEditable = asBool(cellModel.getMetadata('editable'));
        const isDeletable = asBool(cellModel.getMetadata('deletable'));

        if (isEditable !== editable || isDeletable !== deletable) {
          cellModel.setMetadata('editable', editable);
          cellModel.setMetadata('deletable', deletable);

          applyCellLockIcon(cellModel, cellWidget);
          editedCellCount++;
        } else {
          nonEditedCellCount++;
        }
      }

      const action = editable ? 'unlocked' : 'locked';
      let statusMessage = '';
      if (editedCellCount === 0) {
        statusMessage = `All cells were already ${action}.`;
      } else {
        statusMessage = `${editedCellCount} cell${editedCellCount > 1 ? 's' : ''} ${
          editedCellCount > 1 ? 'were' : 'was'
        } successfully ${action}.`;
        if (nonEditedCellCount > 0) {
          statusMessage += ` (${nonEditedCellCount} already ${action}).`;
        }
      }

      // Show message in status bar transiently
      if (statusWidget) {
        statusWidget.setTemporaryStatus(statusMessage);
      } else {
        console.log('[CellLockStatus]', statusMessage);
      }
    };

    // Define the lock command
    const lockCommand = 'jupyterlab-cell-lock:lock-cells';
    app.commands.addCommand(lockCommand, {
      label: 'Make All Current Cells Read-Only & Undeletable',
      execute: () => {
        toggleCellMetadata(false, false, tracker);
      }
    });

    // Define the unlock command
    const unlockCommand = 'jupyterlab-cell-lock:unlock-cells';
    app.commands.addCommand(unlockCommand, {
      label: 'Make All Current Cells Editable & Deletable',
      execute: () => {
        toggleCellMetadata(true, true, tracker);
      }
    });

    const refreshLockIcons = (notebookPanel: any) => {
      if (!notebookPanel) {
        return;
      }
      const { content: notebook } = notebookPanel;

      // Ensure the notebook model is ready before trying to access cells
      if (notebook.model && notebook.widgets) {
        console.log(
          'Refreshing lock icons for',
          notebook.widgets.length,
          'cells'
        );

        requestAnimationFrame(() => {
          notebook.widgets.forEach((cellWidget: any, i: number) => {
            const cellModel = notebook.model.cells.get(i);
            if (cellModel) {
              applyCellLockIcon(cellModel, cellWidget);
            }
          });
        });
      }
    };

    tracker.widgetAdded.connect((_, notebookPanel) => {
      const { content: notebook, context } = notebookPanel;

      const lockButton = new ToolbarButton({
        label: 'Lock all cells',
        icon: lockIcon,
        onClick: () => {
          app.commands.execute(lockCommand);
        },
        tooltip: 'Make all current cells read-only & undeletable'
      });

      const unlockButton = new ToolbarButton({
        label: 'Unlock all cells',
        icon: editIcon,
        onClick: () => {
          app.commands.execute(unlockCommand);
        },
        tooltip: 'Make all current cells editable & deletable'
      });

      notebookPanel.toolbar.insertItem(10, 'lockCells', lockButton);
      notebookPanel.toolbar.insertItem(11, 'unlockCells', unlockButton);

      // Apply icons once the notebook is fully loaded and revealed
      Promise.all([context.ready, notebookPanel.revealed]).then(() => {
        console.log('Notebook ready and revealed, refreshing icons');
        refreshLockIcons(notebookPanel);
      });

      // Apply icons for new cells
      notebook.model?.cells.changed.connect((_, change) => {
        if (change.type === 'add') {
          change.newValues.forEach((cellModel: any, idx) => {
            const cellWidget = notebook.widgets[change.newIndex + idx];
            if (cellWidget) {
              // Delay slightly to ensure the cell DOM is rendered
              setTimeout(() => {
                applyCellLockIcon(cellModel, cellWidget);
              }, 20);
            }
          });
        }
      });

      // Refresh on metadata change
      notebook.widgets.forEach(cellWidget => {
        cellWidget.model.metadataChanged.connect(() => {
          applyCellLockIcon(cellWidget.model, cellWidget);
        });
      });

      // Refresh on save
      context.saveState.connect((_, state) => {
        if (state === 'completed') {
          console.log('Notebook saved, refreshing icons...');
          refreshLockIcons(notebookPanel);
        }
      });
    });

    // Refresh when the active cell changes
    tracker.activeCellChanged.connect(() => {
      const current = tracker.currentWidget;
      if (current) {
        refreshLockIcons(current);
      }
    });
  }
};

export default plugin;
