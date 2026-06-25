# Integration Testing

This folder contains the [Playwright](https://playwright.dev/docs/intro) integration tests for the extension, built with the [Galata](https://github.com/jupyterlab/jupyterlab/tree/main/galata) helper.

- Playwright configuration: [playwright.config.js](./playwright.config.js)
- JupyterLab server configuration: [jupyter_server_test_config.py](./jupyter_server_test_config.py)

Failing tests produce a video and an HTML report.

## Setup

From the repository root, create the environment and install the extension (only needed once — the `environment.yml` env provides the Node 22 required by the build):

```sh
conda env create -f environment.yml
conda activate jupyterlab-cell-lock
jlpm install && jlpm build:prod
python -m pip install -e .
```

Then install the test dependencies and browser (only needed once):

```sh
cd ui-tests
jlpm install
jlpm playwright install chromium
```

All commands below are run from the `ui-tests` directory. Rebuild the extension with `jlpm build:prod` from the repository root whenever you change the source.

## Run the tests

```sh
jlpm playwright test
```

Results are printed to the terminal; on failure an HTML report opens in your browser (see the [Playwright reporter docs](https://playwright.dev/docs/test-reporters#html-reporter)).

## Create tests

Generate test code interactively with the [Playwright code generator](https://playwright.dev/docs/codegen):

```sh
jlpm start
jlpm playwright codegen localhost:8888
```

## Debug tests

Run in [debug mode](https://playwright.dev/docs/debug):

```sh
jlpm playwright test --debug
```

## Upgrade Playwright and the browser

```sh
jlpm up "@playwright/test"
jlpm playwright install chromium
```
