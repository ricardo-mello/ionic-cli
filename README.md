[![Build Status][circle-badge]][circle-badge-url]
[![npm][npm-badge]][npm-badge-url]

# Ionic CLI

The Ionic command line interface (CLI) is your go-to tool for developing
[Ionic](https://ionicframework.com/) apps.

Use `ionic --help` for more detailed command information.

:mega: **Support/Questions?** Please see our [Support
Page](https://ionicframework.com/support) for general support questions. The
issues on GitHub should be reserved for bug reports and feature requests.

:heart: **Want to contribute?** Please see
[CONTRIBUTING.md](https://github.com/ionic-team/ionic-cli/blob/master/CONTRIBUTING.md).

## Table of Contents ##

  * [Requirements](#requirements)
  * [Install](#install)
  * [Changes from CLI 2](#changes-from-cli-2)
  * [Getting Started](#getting-started)
    + [Ionic Angular](#ionic-angular)
      - [Starter Templates](#starter-templates)
    + [Ionic 1](#ionic-1)
      - [Starter Templates](#starter-templates-1)
  * [Using Cordova](#using-cordova)
    + [Requirements](#requirements-1)
  * [Environment Variables](#environment-variables)
  * [CLI Flags](#cli-flags)
    + [Persistent flags](#persistent-flags)
  * [CLI Hooks](#cli-hooks)
    + [Example](#example)
  * [Service Proxies](#service-proxies)
  * [Using a Proxy](#using-a-proxy)
  * [Legacy Version](#legacy-version)

## Requirements

* Node 6 LTS (latest)
* npm 3+

## Install

```bash
$ npm install -g ionic
```

:memo: *Note: For a global install `-g ionic`, macOS/Linux users may need to
prefix with `sudo` or can setup [proper file permissions for
npm](https://docs.npmjs.com/getting-started/fixing-npm-permissions).*

## Changes from CLI v2

You can review the CLI v2 -> v3 upgrade notes in
[CHANGELOG.md](https://github.com/ionic-team/ionic-cli/blob/master/CHANGELOG.md#upgrading-from-cli-v2).

## Getting Started

### Ionic Angular

#### Starter Templates

* [blank](https://github.com/ionic-team/ionic2-starter-blank)
* [tabs](https://github.com/ionic-team/ionic2-starter-tabs)
* [sidemenu](https://github.com/ionic-team/ionic2-starter-sidemenu)
* [conference](https://github.com/ionic-team/ionic-conference-app)
* [tutorial](https://github.com/ionic-team/ionic2-starter-tutorial)
* [super](https://github.com/ionic-team/ionic-starter-super)

```bash
$ npm install -g ionic@latest
$ ionic start myNewProject
$ cd ./myNewProject
$ ionic serve
```

### Ionic v1

#### Starter Templates

* [blank](https://github.com/ionic-team/ionic-starter-blank)

```bash
$ npm install -g ionic@latest
$ ionic start myNewProject blank --type=ionic1
$ cd ./myNewProject
$ ionic serve
```

## Using Cordova

Integrate Ionic with [Cordova](https://cordova.apache.org/) to bring native
capabilities to your app.

### Requirements

* For iOS development, see the [iOS Platform
  Guide](https://cordova.apache.org/docs/en/latest/guide/platforms/ios/index.html).
* For Android development, see the [Android Platform
  Guide](https://cordova.apache.org/docs/en/latest/guide/platforms/android/index.html).

```bash
$ npm install -g cordova
$ npm install --save-dev --save-exact @ionic/cli-plugin-cordova@latest
$ ionic --help
$ ionic cordova run ios
```

## Environment Variables

The CLI will look for the following environment variables:

* `IONIC_CONFIG_DIRECTORY`: Where the CLI config files live. Defaults to
  `~/.ionic`. You may prefer `~/.config/ionic`.
* `IONIC_HTTP_PROXY`: Set a URL for proxying all CLI requests through. See
  [Using a Proxy](#using-a-proxy). The CLI will also look for `HTTP_PROXY` and
  `HTTPS_PROXY`, both of which npm use.
* `IONIC_EMAIL` / `IONIC_PASSWORD`: For automatic login via environment
  variables.

## CLI Flags

CLI flags are global options that alter CLI behavior.

* `--help`: Instead of running the command, view its help page.
* `--verbose`: Show all log messages for debugging purposes.
* `--quiet`: Only show `WARN` and `ERROR` log messages.

### Persistent flags

The behavior that these flags set is remembered in the CLI config file.

* `--interactive` / `--no-interactive`: Switch between interactive (default)
  and non-interactive mode. In non-interactive mode, the spinner and all
  prompts are disabled (useful for CI/CD servers).
* `--confirm` / `--no-confirm`: Switch between auto-confirmation and
  non-confirmation (default) of confirmation prompts. *Careful*: the CLI
  prompts before doing something potentially harmful. Auto-confirming may have
  unintended results.
* `--timeout` / `--no-timeout`: Switch between timeout (default)
  and non-timeout mode. In non-timeout mode, all requests timeout are disabled.

## CLI Hooks

CLI hooks are how you can run scripts during CLI events, such as "watch" and
"build". To hook into the CLI, use the following [npm
scripts](https://docs.npmjs.com/misc/scripts) in your `package.json` file:

| npm script           | description                                                       | commands                                                     |
|----------------------|-------------------------------------------------------------------|--------------------------------------------------------------|
| `ionic:watch:before` | Runs **before** the file watcher activates during a "watch" event | `ionic serve`, `ionic cordova run`, `ionic cordova emulate`  |
| `ionic:build:before` | Runs **before** the Ionic "build" event starts.                   | `ionic upload`, `ionic package build`, `ionic cordova build` |
| `ionic:build:after`  | Runs **after** the Ionic "build" event finishes.                  | `ionic upload`, `ionic package build`, `ionic cordova build` |

### Example

```json
  "scripts": {
    "ionic:build:before": "mv somefile www/somefile",
  }
```

:memo: *Note: Use gulp? Check out
[@ionic/cli-plugin-gulp](https://github.com/ionic-team/ionic-cli/tree/master/packages/cli-plugin-gulp).*

## Service Proxies

The `serve` command can add some proxies to the HTTP server. These proxies are
useful if you are developing in the browser and you need to make calls to an
external API. With this feature you can proxy request to the external api
through the ionic http server preventing the `No 'Access-Control-Allow-Origin'
header is present on the requested resource` error.

In the `ionic.config.json` file you can add a property with an array of proxies
you want to add. The proxies are object with the following properties:

* `path`: string that will be matched against the beginning of the incoming
  request URL.
* `proxyUrl`: a string with the url of where the proxied request should go.
* `proxyNoAgent`: (optional) true/false, if true opts out of connection
  pooling, see
  [HttpAgent](https://nodejs.org/api/http.html#http_class_http_agent)

```json
{
  "name": "appname",
  "email": "",
  "app_id": "",
  "proxies": [
    {
      "path": "/v1",
      "proxyUrl": "https://api.instagram.com/v1"
    }
  ]
}

```

Using the above configuration, you can now make requests to your local server
at `http://localhost:8100/v1` to have it proxy out requests to
`https://api.instagram.com/v1`.

## Using a Proxy

To proxy CLI requests, you will need to install the global CLI proxy plugin:

```bash
$ npm install -g @ionic/cli-plugin-proxy
```

Then, set the following environment variables:

```bash
$ export HTTP_PROXY=http://internal.proxy.com # used by npm
$ export HTTPS_PROXY=https://internal.proxy.com # used by npm
$ export IONIC_HTTP_PROXY=http://internal.proxy.com
```

For example:

```bash
$ HTTPS_PROXY=https://internal.proxy.com ionic start
```

## Legacy Version

The old version of the CLI can be installed with the `legacy` tag:

```bash
npm install -g ionic@legacy
```

[circle-badge]: https://circleci.com/gh/ionic-team/ionic-cli.svg?style=shield
[circle-badge-url]: https://circleci.com/gh/ionic-team/ionic-cli
[npm-badge]: https://img.shields.io/npm/v/ionic.svg
[npm-badge-url]: https://www.npmjs.com/package/ionic
