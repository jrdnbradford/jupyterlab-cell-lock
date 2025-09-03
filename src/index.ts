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

      let editedCellCount = 0;
      let nonEditedCellCount = 0;
      for (let i = 0; i < cells.length; i++) {
        const cell = cells.get(i);
        const isEditable = asBool(cell.getMetadata('editable'));
        const isDeletable = asBool(cell.getMetadata('deletable'));

        if (isEditable !== editable || isDeletable !== deletable) {
          cell.setMetadata('editable', editable);
          cell.setMetadata('deletable', deletable);
          editedCellCount++;
        } else {
          nonEditedCellCount++;
        }
      }

      const action = editable ? 'unlocked' : 'locked';
      const message = editable
        ? 'editable and deletable.'
        : 'read-only and undeletable.';

      let dialogBody = '';
      if (editedCellCount === 0) {
        dialogBody = `All cells were already ${action}.`;
      } else {
        // Create message for edited cells
        dialogBody = `${editedCellCount} cell${editedCellCount > 1 ? 's' : ''} ${
          editedCellCount > 1 ? 'were' : 'was'
        } successfully ${action}.`;

        // Create message for non-edited cells
        if (nonEditedCellCount > 0) {
          dialogBody += ` ${nonEditedCellCount} cell${nonEditedCellCount > 1 ? 's' : ''} ${
            nonEditedCellCount > 1 ? 'were' : 'was'
          } already ${action}.`;
        }
        dialogBody += ` All cells are now ${message}`;
      }

      showDialog({
        title: `Cells ${action}`,
        body: dialogBody,
        buttons: [Dialog.okButton()]
      });
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
      label: 'Make All Currrent Cells Editable & Deletable',
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
    });
  }
};

export default plugin;
