[![build](https://github.com/jrdnbradford/jupyterlab-cell-lock/actions/workflows/build.yaml/badge.svg)](https://github.com/jrdnbradford/jupyterlab-cell-lock/actions/workflows/build.yaml)
[![PyPI version](https://img.shields.io/pypi/v/jupyterlab-cell-lock.svg)](https://pypi.org/project/jupyterlab-cell-lock/)

# 🔒 jupyterlab-cell-lock

A JupyterLab extension for easily locking cells, making them read-only and undeletable.

## ⚠️ Limitations

This extension modifies the cell metadata (`editable` and `deletable` fields) in the notebook file. This is _not_ a security feature. Any user with knowledge of JupyterLab or the notebook file format can manually edit or remove this metadata to bypass the lock. It is primarily for preventing accidental modifications, not intentional ones. You should always use source control for your code.

## 📝 Requirements

- JupyterLab >= 4.0, < 5

## 📦 Installation

```sh
pip install jupyterlab-cell-lock
```

# 💡 Use Cases

## Educators and Instructors

- **Distributing Assignments**: You can provide a template notebook with introductory text, problem descriptions, or starter code in read-only cells. This prevents students from accidentally deleting or changing the core parts of the assignment, while still allowing them to add their answers in new or designated cells.

- **Interactive Lecture Notes**: Share lecture notebooks with pre-populated, locked cells containing explanations and examples. Students can run the code, add their own notes, or experiment without altering your content.

## Students and Learners

- **Protecting Content**: When working with course material, tutorials, and assignments you can lock your notebook to ensure you don't accidentally delete or modify your work while experimenting with new cells.

## Researchers and Teams

- **Sharing Analyses and Code**: When sharing a notebook, you can lock the cells containing the final results, plots, and key methodology. This helps others on your team run the notebook and see the output without risk of accidentally changing the notebook.

- **Creating Templates**: Lock down template notebooks used for standard data analysis workflows. This ensures everyone on the team uses the same core steps while allowing them to add their own custom analyses.
