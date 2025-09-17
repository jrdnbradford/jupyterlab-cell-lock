import { lockIcon, editIcon } from '@jupyterlab/ui-components';
import { CellLockStatus } from './status';

export const asBool = (v: unknown) => (typeof v === 'boolean' ? v : true);

export const applyCellIcon = (
  cellModel: any,
  cellWidget: any,
  statusWidget: CellLockStatus | null = null,
  retryCount = 0
) => {
  const editable = asBool(cellModel.getMetadata('editable'));
  const deletable = asBool(cellModel.getMetadata('deletable'));

  const promptNode = cellWidget.node.querySelector(
    '.jp-InputPrompt.jp-InputArea-prompt'
  );

  if (!promptNode) {
    if (retryCount < 10) {
      setTimeout(() => {
        applyCellIcon(cellModel, cellWidget, statusWidget, retryCount + 1);
      }, 10);
    }
    return;
  }

  const existing = promptNode.querySelector('.jp-CellLockIcon');
  if (existing) {
    existing.remove();
  }

  const iconNode = document.createElement('span');
  iconNode.className = 'jp-CellLockIcon';

  if (!editable || !deletable) {
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

    // Click to unlock
    iconNode.addEventListener('click', () => {
      cellModel.setMetadata('editable', true);
      cellModel.setMetadata('deletable', true);
      applyCellIcon(cellModel, cellWidget, statusWidget);
      if (statusWidget) {
        statusWidget.setTemporaryStatus('Cell unlocked.');
      }
    });

  } else {
    iconNode.title = 'This cell is editable and deletable.';

    editIcon.element({
      container: iconNode,
      elementPosition: 'left',
      height: '14px',
      width: '14px'
    });

    // Click to lock
    iconNode.addEventListener('click', () => {
      cellModel.setMetadata('editable', false);
      cellModel.setMetadata('deletable', false);
      applyCellIcon(cellModel, cellWidget, statusWidget);
      if (statusWidget) {
        statusWidget.setTemporaryStatus('Cell locked.');
      }
    });
  }
  promptNode.appendChild(iconNode);
};

export const refreshIcons = (
  notebookPanel: any,
  statusWidget: CellLockStatus | null = null
) => {
  if (!notebookPanel) {
    return;
  }
  const { content: notebook } = notebookPanel;

  if (notebook.model && notebook.widgets) {
    console.log('Refreshing lock icons for', notebook.widgets.length, 'cells');
    requestAnimationFrame(() => {
      notebook.widgets.forEach((cellWidget: any, i: number) => {
        const cellModel = notebook.model.cells.get(i);
        if (cellModel) {
          applyCellIcon(cellModel, cellWidget, statusWidget);
        }
      });
    });
  }
};
