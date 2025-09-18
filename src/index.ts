import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';
import { IStatusBar } from '@jupyterlab/statusbar';
import { ToolbarButton } from '@jupyterlab/apputils';
import { lockIcon, editIcon } from '@jupyterlab/ui-components';

import { CellLockStatus } from './status';
import { applyCellIcon, refreshIcons } from './icon';
import { toggleAllCellMetadata } from './metadata';

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

    let statusWidget: CellLockStatus;
    if (statusBar) {
      statusWidget = new CellLockStatus();
      statusBar.registerStatusItem('cellLockStatus', {
        item: statusWidget,
        align: 'middle'
      });
    }

    // Define the lock command
    const lockCommand = 'jupyterlab-cell-lock:lock-cells';
    app.commands.addCommand(lockCommand, {
      label: 'Make All Current Cells Read-Only & Undeletable',
      execute: () => {
        toggleAllCellMetadata(false, false, tracker, statusWidget);
      }
    });

    // Define the unlock command
    const unlockCommand = 'jupyterlab-cell-lock:unlock-cells';
    app.commands.addCommand(unlockCommand, {
      label: 'Make All Current Cells Editable & Deletable',
      execute: () => {
        toggleAllCellMetadata(true, true, tracker, statusWidget);
      }
    });

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
        refreshIcons(notebookPanel, statusWidget);
      });

      // Function to add output area listeners to a code cell
      const addOutputListener = (cellWidget: any) => {
        if (cellWidget.model.type === 'code' && cellWidget.outputArea) {
          const outputAreaModel = cellWidget.outputArea.model;
          outputAreaModel.changed.connect(() => {
            setTimeout(() => {
              applyCellIcon(cellWidget.model, cellWidget, statusWidget);
            }, 10);
          });
          outputAreaModel.stateChanged.connect((sender: any, args: any) => {
            if (args.name === 'outputs' || args.name === 'length') {
              setTimeout(() => {
                applyCellIcon(cellWidget.model, cellWidget, statusWidget);
              }, 10);
            }
          });
        }
      };

      // Add listeners to existing cells
      notebook.widgets.forEach(cellWidget => {
        addOutputListener(cellWidget);
      });

      // Handle new cells being added
      notebook.model?.cells.changed.connect((_, change) => {
        if (change.type === 'add') {
          change.newValues.forEach((cellModel, idx) => {
            const cellWidget = notebook.widgets[change.newIndex + idx];
            if (cellWidget) {
              setTimeout(() => {
                applyCellIcon(cellModel, cellWidget, statusWidget);
                addOutputListener(cellWidget);
              }, 10);
            }
          });
        }
      });

      // Refresh on metadata change
      notebook.widgets.forEach(cellWidget => {
        cellWidget.model.metadataChanged.connect(() => {
          applyCellIcon(cellWidget.model, cellWidget, statusWidget);
        });
      });

      // Refresh on save
      context.saveState.connect((_, state) => {
        if (state === 'completed') {
          refreshIcons(notebookPanel, statusWidget);
        }
      });
    });

    // Refresh when the active cell changes
    tracker.activeCellChanged.connect(() => {
      const current = tracker.currentWidget;
      if (current) {
        refreshIcons(current, statusWidget);
      }
    });
  }
};

export default plugin;
