[//]: # "Types: Added | Changed | Deprecated | Removed | Fixed | Security"
[//]: # "Source: http://keepachangelog.com/en/1.0.0/"

# Changelog
All notable changes to this project will be documented in this file.

## [0.4.0] - 2026-07-18

Maintainership of this project has moved to a fork maintained by Oliver Anteros (@Olian04). The original author remains L. Sabatelli (@Lor-Saba).

#### Changed
- Renamed the extension to **Code Injector Reborn**, to keep the fork distinct from the original store listings.
- Migrated the extension from Manifest V2 to **Manifest V3** (required for continued distribution on the Chrome Web Store).
  - `browser_action` is now `action`.
  - The background page is now a service worker.
  - `<all_urls>` moved to `host_permissions`; added the `scripting` permission.
  - Code injection now uses `chrome.scripting.executeScript` instead of the removed `tabs.executeScript`.
- The code editors name their monospace font stack explicitly instead of relying on Monaco's per-platform default, and the minimap is gone — it cost horizontal space the popup does not have.

#### Added
- A build toolchain (`npm run build` / `npm run zip`) that assembles a loadable `dist/` folder (SCSS compilation, vendored Monaco editor and webextension-polyfill, script bundling).
- The popup now paints the rules list before loading Monaco, then warms the editor in idle time, so opening the action no longer waits on ~4 MB of editor code.
- The popup document ships the rules shell, so the first paint no longer waits for React either; the placeholder row is swapped for the real list once the stored rules are read.
- **Dark mode.** It follows the system colour scheme, including Monaco's theme, and the new *Appearance* setting in the options page overrides it. The choice is cached so an override applies before the popup's first paint.
- End-to-end tests now run against Firefox as well as Chromium, in a CI matrix. Firefox has no Playwright API for loading extensions, so the harness installs the build over the remote debugging protocol and drives the background script through it.
- A GitHub Actions workflow that publishes to the Chrome Web Store via a service-account on GitHub Release, and attaches the Firefox build to the release.
- The HTML tab now completes the classes and ids defined in the same rule's CSS tab, including selectors nested in at-rules such as `@media`. Suggestions follow the CSS you are typing, saved or not.
- Help popovers, built on the [Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API). Hovering the *URL pattern* field brings up a regular-expression cheat sheet with worked examples, and hovering *On page load* or *Top frame only* explains what both states of that option do. Each bubble stays up long enough to move the pointer into it and read or scroll.

#### Fixed
- The *Top frame only* tooltip described the opposite of what the option does ("Set if this rule can be injected to iframes").
- Monaco's language services now run in web workers again; they were falling back to the main thread, which left JavaScript validation and completions dead.
- `npm run build` no longer emits a development bundle for the first browser target.

#### Removed
- The per-rule **Files** list, and with it `file://` injection. Reading local files is not possible from a Manifest V3 service worker, which left the feature half working, and the remote half is already expressible in the code tabs — `import("https://…")` in JavaScript, `@import url("…")` in CSS, tags in HTML — so a fourth tab that only accepted a URL was not earning its place. Rules that still carry a `files` array import cleanly; the list is ignored.
- The Edge build target. The Chromium bundle already covers Edge, Brave and other Chromium forks, as the Firefox bundle does for Firefox forks.
- The unimplemented "night mode" toggle, replaced by the *Appearance* setting.

#### Security
- Build tooling telemetry stays off (`--no-telemetry` on every Extension.js invocation), and the extension itself contains no analytics, tracking or remote reporting of any kind.

## [0.3.3] - 2022-01-12 
   
#### changed
- badge counter now exclude disabled rules 

#### Fixed
- import from remote json
- scroll stuck for firefox

## [0.3.2] - 2020-01-23 
   
#### Added
- "Options" button to easly open the extension options page

#### Fixed
- CRITICAL Bug which was blocking the extension from reading the rules list eng tab data

## [0.3.0] - 2020-01-19  

#### Added
- A new property for the rules: "Top frame only" (enabled by default). 
  - if *enabled* the rule will be injected ONLY in the top frame of the page (when the selector matches the tab url, as it has done up to now)
  - if *disabled* the rule will be injected in iframes too.
- A new Rule UI indicator for the rules injected in iframes (a dotted light blu border on the right)
- Support for MAC `COMMAND + S` in the editors

#### Changed
- Replaced the old "Active Tab data" system to handle async calls and navigations in the background.js
- Repository files rearranged
- reworked the badge counter system to display the correct number of active rules 

## [0.2.3] - 2019-04-28  

#### Added
- A *start-grunt.bat* file to run grunt tasks [buld|dev] (to remove the Grunt global SO installation dependency)

#### Fixed
- Some packages compatibilities
- A bug wich was stopping the injection flow when including an axternal css file.
- Outdated error handling in the injector file
- Grip style differences (gray dots) between firefox and chrome for *rules* and *files*.

#### Changed
- Update Monaco editor from 0.13.1 to 0.16.2
- npm packages dependencies refactored


## [0.2.2] - ????-??-?? (skipped)

#### Changed
- Update Monaco editor from 0.9.0 to 0.13.1


## [0.2.1] - 2018-01-20

#### Fixed
- Strange black rendering bars on rules.


## [0.2.0] - 2018-01-14

#### Added
- A *context-menu* to handle rule's actions.
- It's now possible to manually inject a rule (from the rule's *context-menu*).
- A rule can be moved as the first or last in the *rules list* (from the rule's *context-menu*).
- More *import* methods (in the options page).
  - *Local JSON file* read and import a set of rules from a loca json file (from your machine).
  - *Remote JSON file* read and import a set of rules from a remote json file address.
  - *GitHub repository* read and import a rule from a [GitHub](https://github.com/) repository.

#### Fixed
- Multiple injection of the same rule on webkit browsers.
- Appended a *version-control* when requesting remote files to prevent the browser to load cached versions (hopefully).
- Various background fixes.

#### Changed
- Because of the new *context-menu*:
  - The *edit* and *delete* buttons (at the end of a rule bar) are been replaced with a single button which show the *context-menu*.
  - the *edit* action has been moved to the *context-menu*.
  - the *delete* action has been moved to the *context-menu*.
  - the *enabled* option (from the *Editor Page*) has been moved to the *context-menu*.
- It's now possible to choose which rules to *export* (in the options page). 
- Reworked the injection process. Now it should be more stable and secure.
- keymap to quit from the editor view from `esc` to `ctrl + esc`.



## [0.1.1] - 2017-10-10

#### Security
- HTML-String templates conversions are now handled by a native JavaScript constructor to improve security.


## [0.1.0] - 2017-10-09
The initial Beta release




[0.4.0]: https://github.com/Olian04/code-injector-reborn/releases/tag/v0.4.0
[0.3.3]: https://github.com/Lor-Saba/Code-Injector/releases/tag/v0.3.3
[0.3.2]: https://github.com/Lor-Saba/Code-Injector/releases/tag/v0.3.2
[0.3.0]: https://github.com/Lor-Saba/Code-Injector/releases/tag/v0.3.0
[0.2.3]: https://github.com/Lor-Saba/Code-Injector/releases/tag/v0.2.3
[0.2.2]: https://github.com/Lor-Saba/Code-Injector/releases/tag/v0.2.2
[0.2.1]: https://github.com/Lor-Saba/Code-Injector/releases/tag/v0.2.1
[0.2.0]: https://github.com/Lor-Saba/Code-Injector/releases/tag/v0.2.0
[0.1.1]: https://github.com/Lor-Saba/Code-Injector/releases/tag/v0.1.1
[0.1.0]: https://github.com/Lor-Saba/Code-Injector/releases/tag/v0.1.0