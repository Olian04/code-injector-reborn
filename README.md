<!--img src="./readme-resources/wip.jpg" style="width: 350px; height: 345px;"-->

> **Maintainership note**
>
> This is a maintained fork of the original [Code-Injector](https://github.com/Lor-Saba/Code-Injector) by **L. Sabatelli ([@Lor-Saba](https://github.com/Lor-Saba))**, who is the original author of this project. The upstream project has been abandoned, and since the Chrome Web Store no longer accepts Manifest V2 extensions, this fork has been migrated to **Manifest V3** and is now maintained by **Oliver Anteros ([@Olian04](https://github.com/Olian04))**. All credit for the original design and implementation goes to L. Sabatelli.
>
> The fork is published as **Code Injector Reborn** to keep it distinct from the original listings.

# Code Injector Reborn

A [WebExtensions](https://developer.mozilla.org/en-US/Add-ons/WebExtensions) based addon which let the user inject code into the websites

> This is an add-on which requires a minimum of knowledge of web programming to be able to properly use it.

## Installation

`Code Injector Reborn` is not on the Web Stores yet — see [Building from source](#building-from-source) to run it locally.

The original `Code Injector` (Manifest V2, no longer maintained) is still listed here:

<table>
  <tr>
    <td align="right"><b>Browser</b></td>
    <td align="center"><img src="readme-resources/browsers/firefox.png" title="Firefox"></td>
    <td align="center"><img src="readme-resources/browsers/chrome.png" title="Chrome"></td>
    <td align="center"><img src="readme-resources/browsers/opera.png"  title="Opera"></td>
    <td align="center"><img src="readme-resources/browsers/edge-webkit.png"  title="Edge Webkit"></td>
  </tr>
  <tr>
    <td align="right"><b>Online version</b></td>
    <td align="center">0.3.3</td>
    <td align="center">0.3.2</td>
    <td align="center"></td>
    <td align="center">0.3.2</td>
  </tr>
  <tr>
    <td align="right"><b>Web Store link</b></td>
    <td align="center"><a href="https://addons.mozilla.org/en-US/firefox/addon/codeinjector/">Download</a></td>
    <td align="center"><a href="https://chrome.google.com/webstore/detail/code-injector/edkcmfocepnifkbnbkmlcmegedeikdeb">Download</a></td>
    <td align="center">(uploading..)</td>
    <td align="center"><a href="https://microsoftedge.microsoft.com/addons/detail/kgmlfocfgenookigofalapefagndnlnc">Download</a></td>
  </tr>
</table>

## Contents

- [Code Injector Reborn](#code-injector-reborn)
  - [Installation](#installation)
  - [Contents](#contents)
  - [Purpose](#purpose)
  - [Quick start](#quick-start)
  - [Main view (Rules list)](#main-view-rules-list)
      - [Rules](#rules)
      - [Rules structure](#rules-structure)
  - [Editor view](#editor-view)
      - [URL pattern](#url-pattern)
      - [Editors](#editors)
      - [On page load](#on-page-load)
      - [Top frame only](#top-frame-only)
  - [Options view](#options-view)
      - [Saved rules](#saved-rules)
      - [Size](#size)
      - [Import / Export](#import--export)
      - [Appearance](#appearance)
      - [Show counter](#show-counter)
  - [Injection flow](#injection-flow)
  - [What's next](#whats-next)
  - [Building from source](#building-from-source)
  - [Testing](#testing)
    - [How each browser is driven](#how-each-browser-is-driven)
  - [Publishing](#publishing)
  - [Privacy](#privacy)
  - [Credits](#credits)
  - [Info](#info)

## Purpose

There are several sites with invasive popups / login screens, a messy layout or some missing capabilities.  
I was usually getting around these boring stuff by opening the browser console to edit the DOM style and structure but it was starting to get tiring doing it everytime, so why not making an extension which do it by itself in background?

## Quick start

Get started creating a new _[Rule](#rules)_.  
[<img src="readme-resources/screenshots/1.png" height="100">](readme-resources/screenshots/1.png)
[<img src="readme-resources/screenshots/2.png" height="100">](readme-resources/screenshots/2.png)

Complete the _Rule_ by entering the [_URL Pattern_ and _Contents_](#editor-view),  
then save and reload the page (or navigate to the matching address) to apply your script.  
[<img src="readme-resources/screenshots/3.png" height="100">](readme-resources/screenshots/3.png)
[<img src="readme-resources/screenshots/4.png" height="100">](readme-resources/screenshots/4.png)

---

## Main view (Rules list)

<img src="readme-resources/screenshots/view_ruleslist.png">

The _Main view_ is the initial and main page of the addon where you can create and manage your code injections with a list of _Rules_.

#### Rules

A _Rule_ may contain **JavaScript**, **CSS** and **HTML** and will be splitted and injected with the following order:

1. CSS
2. HTML
3. JavaScript

> **Note:**  
> Each rule will inherit the previous injected code.

#### Rules structure

<img src="readme-resources/screenshots/rule_structure.png">

The _Rule_'s element bar can be subdivided into 3 sections: _Pattern_, _Insight_ and _Actions_.

- **Pattern:**  
  The Rule's _Pattern_, as defined [here](#url-pattern) in the _Editor section_, specifies in what pages the rule should be applied.  
  It will be highlighted in blue if it matches with the address of the current page. (it's dotted if injected in iframes)  
  If the rule is disabled the _Patern_ is highlighted in red with a line over the text.  
  Also, the whole area is draggable allowing to move the _Rule_ and change the injection order.

- **Insight:**  
  Shows a minimal description of the Rule whether contains or not a language using 3 coloured dots.  
  (from left to right: _JavaScript_, _CSS_ and _HTML_)

- **Actions:**
  - **Edit**  
    Open the Rule in the _Editor view_.

  - **Inject**  
    Manually inject the Rule into the current tab.

  - **Move Top**  
    Move the rule as fisrt of the list.

  - **Move Bottom**  
    Move the rule as last of the list.

  - **Enabled**  
    define if the current Rule can be injected.

  - **Delete**  
    Delete the Rule. (must be clicked twice)

## Editor view

<img src="readme-resources/screenshots/view_editor.png">

The _Editor view_ is where can be defined a [_Rule_](#rules) codes and properties.

#### URL pattern

The URL pattern specifies in what pages the rule should be applied.

When a page is opened, the pattern will be matched against the full address of the new page, if the pattern corresponds with that address then the code contained in the rule will be injected into the page.

The URL pattern follows the ECMAScript (a.k.a. JavaScript) regular expressions syntax, see [here](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions) for more detailed information.

The add-on helps you on checking whether the pattern is correct by highlighting it in blue if it matches with the address of the current page and highlight it in red if it is invalid.

In depth example in case of _google_ as url pattern:  
_<small style="color: #555">(this example is just for knowledge purposes)</small>_

```javascript
    // the URL pattern "google" is passed as argument
    // by the "URL Pattern" to the RegExp constructor.
    new RegExp("google");

    // resulting in..
    /google/

    // assuming "https://www.google.com" as page address:
    /google/.test("https://www.google.com");

    // if TRUE the rule will be queued for injection

```

> **Note:**  
> Because the URL pattern text box is meant to contain only a regular expression, the forward slashes / used as delimiters in the JavaScript language are not needed.  
> _You should therefore write `hello world` instead of `/hello world/`_.

#### Editors

The main section of the _Editor view_.

From left to right you can access the _JavaScript_, _CSS_ and _HTML_ editors by clicking on the tabs.

> **Note:**  
> If an editor contains just comments the code wont be injected.

To pull in code hosted elsewhere, reference it from the editor that suits it: `import("https://…")` in _JavaScript_, `@import url("…")` in _CSS_, or a tag in _HTML_.

#### On page load

If `TRUE`, the rule will be injected on page load, else it will be injected on navigation.  
Check the [Injection flow](#injection-flow) for more details.

#### Top frame only

`TRUE` by default, if set to `FALSE` the rule will be injected to the iframes too.

## Options view

<img src="readme-resources/screenshots/view_options.png">

#### Saved rules

A simple section wich shows the number of total registered rules and a button to remove them all.

> **Note:**  
> The _Clean_ button must be clicked twice to confirm the action.

#### Size

Define the size of the popup window. (in px)

#### Import / Export

**Export:**

- Press on the _export button_ to show the "export modal".
- In the "export modal" will be listed all your _Rules_.
- Select which rules you'd like to export and click on the _export button_.  
  (At least 1 rule has to be selected to enable the _export button_)  
  The selected _Rules_ will be downloaded as a json file.  

**Import:**

- Press on the _import button_ to show the "import modal".
- You can chose from 3 types of import method:
  1. _Local JSON File_  
     Navigate into your system and select a file containing a valid _JSON_ of _Rules_.
  2. _Remote JSON File_  
     give a remote file URL containing a valid _JSON_ of _Rules_.  
     Example: `https://www.mydomain.com/path/to/ruleslist.json`
  3. _GitHub repository_  
     Import a rule from a GitHub repository address.  
     Example: [`https://github.com/Lor-Saba/Code-Injector-GitHub-Rule`](https://github.com/Lor-Saba/Code-Injector-GitHub-Rule)
- Click on the _import button_ to confirm.

> **Note:**
> A message should appear to tell whether the operation is successful or not.

#### Appearance

Chooses between the light and dark themes. _System_ is the default and follows your operating system's colour scheme; _Light_ and _Dark_ override it. The choice applies to the popup, the editor (Monaco switches to its dark theme) and this options page.

#### Show counter

If `true`, a badge with the number of currently injected rules will be visible over the icon.

## Injection flow

A _Rule_ by default is set up to be injected on page load _(after the document and all its resources have finished loading)_ but can be changed to be injected when the navigation is committed _(the DOM is recived and still loading)_ by deselecting the property "[On page load](#on-page-load)" in the _Editor view_.

The rules whose _URL Pattern_ match with the page address will be selected and queued for injection. (from top to bottom, grouped by type)

<img src="./readme-resources/injection_flow.jpg">

## What's next

I would like to make it more and more easy to use so that even who's new to programming can use this add-on with ease.

## Building from source

The project uses [Extension.js](https://extension.js.org/) with React + TypeScript. Production builds emit per-browser folders under `dist/`.

Node.js 26 is what CI and the release workflow run — it becomes the LTS line in October 2026. The pinned major lives in `.nvmrc`, so `nvm use` picks it up. Extension.js itself needs at least 22.12.

```bash
npm install
npm run dev          # watch + launch Chrome (polyfill enabled)
npm run build        # dist/chrome, dist/firefox
npm run build:chrome # chromium only (used by tests)
npm run zip          # build both targets and write store-ready zips
```

The two targets cover the browsers people actually run it in: the Chromium build
works in Chrome, Edge, Brave and other Chromium forks, and the Firefox build
works in Firefox and its forks such as Zen.

To try it out, open `chrome://extensions`, enable **Developer mode**, click **Load unpacked** and select `dist/chrome`.

> **Note:** each target is built in its own `extension build` invocation on purpose. Passing several browsers to a single invocation makes the first target come out as a development build (React Refresh, source maps, a dev-server client that reloads pages).

> **Note on Manifest V3:** the per-rule _Files_ list is gone. Its local half (reading `file://` paths) is not possible from a Manifest V3 service worker, and its remote half is already covered by the code editors — `import("https://…")`, `@import url("…")` and HTML tags.

## Testing

End-to-end tests use [Playwright](https://playwright.dev/docs/chrome-extensions) against the real built extension, in both Chromium and Firefox. Each project rebuilds the bundle it needs in global setup, so no separate build step is required.

```bash
npm install
npx playwright install chromium firefox   # one-time browser download
npm run test:e2e                          # both browsers
npm run test:e2e:chromium
npm run test:e2e:firefox
```

Specs live under `tests/e2e/` and cover:

- Smoke: background context, popup UI, options page
- Inline injection: CSS, HTML, JS script-node insertion, comment-only skip
- ESM import: a rule whose JavaScript imports a module served over http
- Timing/guards: onLoad vs onCommit, disabled rules, URL non-match, unparseable URL pattern, mixed rule lists
- Popup: seeded rules list, insight dots, disabled styling
- Popup shell: the pre-rendered list paints without the bundle
- Appearance: system colour scheme and the options override

### How each browser is driven

Chromium is launched with a persistent context and `--load-extension`, using Playwright's bundled Chromium channel — installed Chrome/Edge no longer allow sideloading via those flags.

Firefox has no Playwright API for installing extensions, so `tests/e2e/helpers/firefox-extension.js` talks to Firefox's remote debugging protocol: it installs the build as a temporary add-on, pins the extension's UUID through a profile preference, pre-grants host permissions, and evaluates code in the background script to seed rules (the counterpart to `serviceWorker.evaluate` in Chromium).

Playwright's Firefox cannot navigate to privileged documents, `moz-extension://` pages included, so specs that open the popup or options page are skipped there and run in Chromium only. Everything about injection — the part that touches real web pages — runs in both.

Rules are seeded through `chrome.storage.local` (Monaco editor interaction is intentionally out of scope).

The two engines disagree about injected JavaScript, and the specs assert each one's actual behaviour. Firefox applies the _page's_ content security policy to a `<script>` node that a content script appended, so it runs. Chromium applies the _extension's own_ Manifest V3 policy to DOM work done from the content script's isolated world, so it refuses to run that node however permissive the page is — the specs therefore assert the node's presence in Chromium rather than its side effects.

## Publishing

Releases are automated via GitHub Actions ([.github/workflows/release.yml](.github/workflows/release.yml)). When a GitHub **Release** is published, the workflow builds and zips both targets. The Chromium zip is authenticated against the Chrome Web Store API v2 using a Google Cloud service account and published; the Firefox zip is attached to the release for upload to addons.mozilla.org, which still needs signing credentials to automate.

The following repository **secrets** must be configured:

| Secret                                | Description                                                                                                                                                            |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CHROME_WEBSTORE_SERVICE_ACCOUNT_JWT` | The service-account **JSON key** contents. The workflow signs a fresh JWT with it and exchanges it for an access token. (A pre-signed JWT assertion is also accepted.) |
| `CHROME_EXTENSION_ID`                 | The Chrome Web Store item ID of the extension.                                                                                                                         |
| `CHROME_PUBLISHER_ID`                 | The Chrome Web Store publisher ID that owns the item.                                                                                                                  |

The service account must be granted access under the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) → _Account_, and the Chrome Web Store API must be enabled in the Google Cloud project. See the [official docs](https://developer.chrome.com/docs/webstore/service-accounts) for details.

The workflow can also be triggered manually from the Actions tab via _workflow_dispatch_.

## Privacy

The extension collects nothing. There is no analytics, no crash reporting and no phoning home of any kind: rules and settings live in `storage.local` on your machine, and the only network requests it makes are the ones your own rules ask for when they reference a remote file. Build tooling telemetry is disabled too — every Extension.js invocation passes `--no-telemetry`.

See [PRIVACY.md](PRIVACY.md) for the full policy.

## Credits

- Built with [Extension.js](https://extension.js.org/).
- Code editors handled using [monaco-editor](https://github.com/Microsoft/monaco-editor).
- UI built with [React](https://react.dev/).
- UI-Icons by [material-design-icons](https://github.com/google/material-design-icons).
- A thank you to [@JD342](https://github.com/JD342) for the help provided in the testing process and for the [Icon](https://github.com/JD342/code-injector-icons)!

## Info

_Code Injector_ was originally written by [L. Sabatelli (@Lor-Saba)](https://github.com/Lor-Saba).  
_Code Injector Reborn_, this Manifest V3 fork, is maintained by [Oliver Anteros (@Olian04)](https://github.com/Olian04).  
License: [GPLv3](https://www.gnu.org/licenses/quick-guide-gplv3.html)
