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
    let statusWidget: CellLockStatus | undefined;
    if (statusBar) {
      statusWidget = new CellLockStatus();
      statusBar.registerStatusItem('cellLockStatus', {
        item: statusWidget,
        align: 'middle'
      });
    }

    const lockCommand = 'jupyterlab-cell-lock:lock-cells';
    app.commands.addCommand(lockCommand, {
      label: 'Make All Current Cells Read-Only & Undeletable',
      execute: () => {
        toggleAllCellMetadata(false, false, tracker, statusWidget);
      }
    });

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

      Promise.all([context.ready, notebookPanel.revealed]).then(() => {
        refreshIcons(notebookPanel, statusWidget);
      });

      const addOutputListener = (cellWidget: any) => {
        if (cellWidget.model.type === 'code' && cellWidget.outputArea) {
          cellWidget.outputArea.model.changed.connect(() => {
            setTimeout(() => {
              applyCellIcon(cellWidget.model, cellWidget, statusWidget);
            }, 10);
          });
        }
      };

      notebook.widgets.forEach((cellWidget: any) => {
        addOutputListener(cellWidget);
        cellWidget.model.metadataChanged.connect(() => {
          applyCellIcon(cellWidget.model, cellWidget, statusWidget);
        });
      });

      notebook.model?.cells.changed.connect((_, change: any) => {
        if (change.type === 'add') {
          change.newValues.forEach((cellModel: any, idx: number) => {
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

      context.saveState.connect((_, state) => {
        if (state === 'completed') {
          refreshIcons(notebookPanel, statusWidget);
        }
      });
    });

    tracker.activeCellChanged.connect(() => {
      const current = tracker.currentWidget;
      if (current) {
        refreshIcons(current, statusWidget);
      }
    });
  }
};

export default plugin;
