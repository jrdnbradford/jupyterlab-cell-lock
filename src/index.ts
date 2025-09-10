import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';
import { IStatusBar } from '@jupyterlab/statusbar';
import { ToolbarButton } from '@jupyterlab/apputils';
import { lockIcon, editIcon } from '@jupyterlab/ui-components';

import { CellLockStatus } from './status';
import { applyCellLockIcon, refreshLockIcons } from './lockIcon';
import { toggleCellMetadata } from './metadata';

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

    let statusWidget: CellLockStatus | null = null;
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
        toggleCellMetadata(false, false, tracker, statusWidget);
      }
    });

    // Define the unlock command
    const unlockCommand = 'jupyterlab-cell-lock:unlock-cells';
    app.commands.addCommand(unlockCommand, {
      label: 'Make All Current Cells Editable & Deletable',
      execute: () => {
        toggleCellMetadata(true, true, tracker, statusWidget);
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
