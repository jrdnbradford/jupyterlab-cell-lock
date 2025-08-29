conda env create
conda activate jupyterlab-cell-lock
python -m pip install -e .
jupyter labextension develop . --overwrite
jlpm run build
jupyter lab
