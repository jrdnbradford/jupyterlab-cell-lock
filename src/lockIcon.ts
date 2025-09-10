import { lockIcon } from '@jupyterlab/ui-components';

export const asBool = (v: unknown) => (typeof v === 'boolean' ? v : true);

export const applyCellLockIcon = (
  cellModel: any,
  cellWidget: any,
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
        applyCellLockIcon(cellModel, cellWidget, retryCount + 1);
      }, 10);
    }
    return;
  }

  const existing = promptNode.querySelector('.jp-CellLockIcon');
  if (existing) {
    existing.remove();
  }

  if (!editable || !deletable) {
    const iconNode = document.createElement('span');
    iconNode.className = 'jp-CellLockIcon';

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

export const refreshLockIcons = (notebookPanel: any) => {
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
          applyCellLockIcon(cellModel, cellWidget);
        }
      });
    });
  }
};
