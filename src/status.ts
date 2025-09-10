import { Widget } from '@lumino/widgets';

export class CellLockStatus extends Widget {
  private _statusNode: HTMLElement;
  private _timer: number | null = null;

  constructor() {
    super();
    this.addClass('jp-CellLockStatus');
    this._statusNode = document.createElement('span');
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
