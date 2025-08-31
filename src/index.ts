import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';
import { ToolbarButton } from '@jupyterlab/apputils';
import { lockIcon, editIcon } from '@jupyterlab/ui-components';
import { showDialog, Dialog } from '@jupyterlab/apputils';

const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-cell-lock:plugin',
  autoStart: true,
  requires: [INotebookTracker],
  activate: (app: JupyterFrontEnd, tracker: INotebookTracker) => {
    console.log('jupyterlab-cell-lock extension activated!');

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

      const cells = current.content.model?.cells;
      if (!cells) {
        return;
      }

      // JupyterLab may omit "editable"/"deletable" when they are true,
      // as this is the default. To handle this correctly, the extension treats
      // missing values as true so the comparison logic works as expected.
      const asBool = (v: unknown) => (typeof v === 'boolean' ? v : true);

      let count = 0;
      for (let i = 0; i < cells.length; i++) {
        const cell = cells.get(i);

        const curEditable = asBool(cell.getMetadata('editable'));
        const curDeletable = asBool(cell.getMetadata('deletable'));

        if (curEditable !== editable || curDeletable !== deletable) {
          cell.setMetadata('editable', editable);
          cell.setMetadata('deletable', deletable);
          count++;
        }
      }

      const action = editable ? 'unlocked' : 'locked';
      const message = editable
        ? 'editable and deletable.'
        : 'read-only and undeletable.';

      const dialogBody =
        count === 0
          ? `All cells were already ${action}.`
          : `${count} cell${count > 1 ? 's' : ''} ${
              count > 1 ? 'were' : 'was'
            } successfully ${action}. All cells are now ${message}`;

      showDialog({
        title: `Cells ${action}`,
        body: dialogBody,
        buttons: [Dialog.okButton()]
      });
    };

    // Define the lock command
    const lockCommand = 'metadata-editor:lock-cells';
    app.commands.addCommand(lockCommand, {
      label: 'Make All Cells Read-Only & Undeletable',
      execute: () => {
        toggleCellMetadata(false, false, tracker);
      }
    });

    // Define the unlock command
    const unlockCommand = 'metadata-editor:unlock-cells';
    app.commands.addCommand(unlockCommand, {
      label: 'Make All Cells Editable & Deletable',
      execute: () => {
        toggleCellMetadata(true, true, tracker);
      }
    });

    // Add toolbar buttons
    tracker.widgetAdded.connect((_, notebookPanel) => {
      const lockButton = new ToolbarButton({
        label: 'Lock all cells',
        icon: lockIcon,
        onClick: () => {
          app.commands.execute(lockCommand);
        },
        tooltip: 'Lock all cells (read-only & undeletable)'
      });

      const unlockButton = new ToolbarButton({
        label: 'Unlock all cells',
        icon: editIcon,
        onClick: () => {
          app.commands.execute(unlockCommand);
        },
        tooltip: 'Unlock all cells (editable & deletable)'
      });

      notebookPanel.toolbar.insertItem(10, 'lockCells', lockButton);
      notebookPanel.toolbar.insertItem(11, 'unlockCells', unlockButton);
    });
  }
};

export default plugin;
