[![build](https://github.com/jrdnbradford/jupyterlab-cell-lock/actions/workflows/build.yaml/badge.svg)](https://github.com/jrdnbradford/jupyterlab-cell-lock/actions/workflows/build.yaml)
[![PyPI version](https://img.shields.io/pypi/v/jupyterlab-cell-lock.svg)](https://pypi.org/project/jupyterlab-cell-lock/)
![PyPI - Downloads](https://img.shields.io/pypi/dm/jupyterlab-cell-lock?label=PyPI%20downloads)

# 🔒 jupyterlab-cell-lock

![JupyterLab UI showing "Lock all cells" and "Unlock all cells" buttons in the toolbar with lock and edit icons, respectively](https://raw.githubusercontent.com/jrdnbradford/jupyterlab-cell-lock/main/docs/img/ui.png)

A JupyterLab extension for easily locking cells, making them read-only and undeletable.

## ⚠️ Limitations

This is _not_ a security feature. It is primarily for preventing accidental modifications.

The extension locks cells by modifying metadata in the notebook file. Any user with knowledge of JupyterLab or the notebook file format can edit or remove this metadata to bypass the lock.

You should _always_ use source control for your notebooks.

## 📝 Requirements

- [JupyterLab](https://jupyterlab.readthedocs.io/en/latest/) >= 4.0, < 5.0

## 📦 Installation

Install with `pip`:

```sh
pip install jupyterlab-cell-lock
```

Confirm installation:

```sh
jupyter labextension list
```

# 💡 Use Cases

- **Educators Distributing Assignments and Notes**: Provide notebooks with text, problem descriptions, and code, helping prevent students from accidentally editing assignments/lecture notes while still allowing them to add their own notes/answers in new or designated cells.

- **Protecting Content**: Lock your notebook to ensure you don't accidentally delete or modify your work while iterating.

- **Creating Templates**: Lock down template notebooks used to standardize workflows.
