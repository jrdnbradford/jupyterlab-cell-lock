## Releasing

Releases are published automatically via the [publish workflow](.github/workflows/publish.yaml) using PyPI Trusted Publishing.

### Release process

1. Bump the version in `package.json` (the only file to edit — everything else is generated).

1. Rebuild the extension:
   ```sh
   conda env create -f environment.yml
   conda activate jupyterlab-cell-lock
   jlpm clean:all && jlpm install && jlpm build:prod
   ```

1. Commit and open a PR:
   ```sh
   git checkout -b release/vX.Y.Z
   git add .
   git commit -m "Release vX.Y.Z"
   git push -u origin release/vX.Y.Z
   ```

1. After the PR is merged, push a tag:
   ```sh
   git checkout main && git pull
   git tag vX.Y.Z
   git push origin vX.Y.Z
   ```

   CI publishes to Test PyPI automatically. Verify the release:

   ```sh
   pip install -i https://test.pypi.org/simple/ jupyterlab-cell-lock==X.Y.Z
   ```

1. Create a [GitHub Release](https://github.com/jrdnbradford/jupyterlab-cell-lock/releases/new) from the tag. CI publishes to PyPI automatically.
