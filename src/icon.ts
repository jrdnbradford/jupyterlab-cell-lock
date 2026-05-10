import { NotebookPanel } from '@jupyterlab/notebook';
import { lockIcon, editIcon } from '@jupyterlab/ui-components';

import { CellLockStatus } from './status';

export const asBool = (v: unknown) => (typeof v === 'boolean' ? v : true);

const ICON_OPTS = {
  elementPosition: 'left' as const,
  height: '14px',
  width: '14px'
};

const attachToggleAction = (iconNode: HTMLElement, action: () => void) => {
  iconNode.addEventListener('click', action);
  iconNode.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  });
};

export const applyCellIcon = (
  cellModel: any,
  cellWidget: any,
  statusWidget: CellLockStatus | undefined,
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

  promptNode.querySelector('.jp-CellLockIcon')?.remove();

  const iconNode = document.createElement('span');
  iconNode.className = 'jp-CellLockIcon';
  iconNode.setAttribute('role', 'button');
  iconNode.setAttribute('tabindex', '0');

  if (!editable || !deletable) {
    let tooltipMessage = 'This cell is ';
    if (!editable && !deletable) {
      tooltipMessage += 'read-only and undeletable.';
    } else if (!editable) {
      tooltipMessage += 'read-only but can be deleted.';
    } else {
      tooltipMessage += 'undeletable but can be edited.';
    }
    iconNode.title = tooltipMessage;
    iconNode.setAttribute('aria-label', 'Unlock cell');
    lockIcon.element({ container: iconNode, ...ICON_OPTS });
    attachToggleAction(iconNode, () => {
      cellModel.setMetadata('editable', true);
      cellModel.setMetadata('deletable', true);
      applyCellIcon(cellModel, cellWidget, statusWidget);
      statusWidget?.setTemporaryStatus('Cell unlocked.');
    });
  } else {
    iconNode.title = 'This cell is editable and deletable.';
    iconNode.setAttribute('aria-label', 'Lock cell');
    editIcon.element({ container: iconNode, ...ICON_OPTS });
    attachToggleAction(iconNode, () => {
      cellModel.setMetadata('editable', false);
      cellModel.setMetadata('deletable', false);
      applyCellIcon(cellModel, cellWidget, statusWidget);
      statusWidget?.setTemporaryStatus('Cell locked.');
    });
  }

  promptNode.appendChild(iconNode);
};

export const refreshIcons = (
  notebookPanel: NotebookPanel,
  statusWidget: CellLockStatus | undefined
) => {
  const { content: notebook } = notebookPanel;

  if (notebook.model && notebook.widgets) {
    requestAnimationFrame(() => {
      notebook.widgets.forEach((cellWidget, i) => {
        const cellModel = notebook.model!.cells.get(i);
        if (cellModel) {
          applyCellIcon(cellModel, cellWidget, statusWidget);
        }
      });
    });
  }
};
