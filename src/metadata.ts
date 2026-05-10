import { INotebookTracker } from '@jupyterlab/notebook';

import { applyCellIcon, asBool } from './icon';
import { CellLockStatus } from './status';

export const toggleAllCellMetadata = (
  editable: boolean,
  deletable: boolean,
  tracker: INotebookTracker,
  statusWidget: CellLockStatus | undefined
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
  for (let i = 0; i < cells.length; i++) {
    const cellModel = cells.get(i);
    const isEditable = asBool(cellModel.getMetadata('editable'));
    const isDeletable = asBool(cellModel.getMetadata('deletable'));

    if (isEditable !== editable || isDeletable !== deletable) {
      cellModel.setMetadata('editable', editable);
      cellModel.setMetadata('deletable', deletable);
      applyCellIcon(cellModel, notebook.widgets[i], statusWidget);
      editedCellCount++;
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
    const nonEditedCellCount = cells.length - editedCellCount;
    if (nonEditedCellCount > 0) {
      statusMessage += ` (${nonEditedCellCount} already ${action}).`;
    }
  }

  statusWidget?.setTemporaryStatus(statusMessage);
};
