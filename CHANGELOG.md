# Change Log

All notable changes to the "pretext-tools" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [UNRELEASED]

### Changed

- View in codechat or browser given as options in main menu.
- `Deploy to GitHub` now makes a commit to save recent work (using the `-u` option).

### [0.14.1] - 2023-12-14

### Added

- New option to break paragraphs into separate lines for each sentence when formatting.

### Fixed

- Formatting no longer removes unknown tags (bug).
- Detection of math using `\(...\)` in latex to pretext conversion.

### Removed

- Deprecated "Live Preview" as a view option (use "CodeChat" instead).

## [0.14.0] - 2023-12-12

### Added

- Formatting support using vs-code's built-in formatting engine.  From the command palette, select "Format Document".

### Fixed

- Bug that prevent initialization if not in a pretext project folder.


## [0.13.0] - 2023-11-27

### Added

- Experimental support for converting selected LaTeX to PreTeXt.

## [0.12.2] - 2023-09-12

### Fixed

- Bug that doesn't stop notification when using `pretext view` fixed.

## [0.12.0] - 2023-09-08

### Changed

- First quickPick menu item now builds most recently built target (or default).
- Target select menu no longer reorders targets.
- `generate` no longer in quickPick menu (since `pretext build` automatically generates assets that have changed).
- Only one error notification when process produces an error, with an option to view log.

### Added

- New Button Menu Options: You can now refresh the list of targets and initiate a "Convert to PreTeXt" from the PreTeXt button menu.
- Progress notification for most commands.

### Fixed

- Fixed bug producing warning when clicking on the pretext button while running (undefined state).

## [0.11.3] - 2023-07-09

### Fixed

- Fix issue with schema not loading on activation.

## [0.11.2] - 2023-05-19

### Fixed

- Check for pandoc passes even if pandoc 2 is installed.
- "li-d" snippet fixed.
- Fix workspace attribute and page block snippets.

## [0.11.1] - 2023-05-15

### Added

- `CTRL+ALT+p` now brings up the "run pretext command" selection menu

### Removed

- No longer have green "run" button at top of window (Pretext status bar button makes that redundant).

## [0.11.0] - 2023-05-12

### Added

- New function to use pandoc to convert an arbitrary file to PreTeXt. Pandoc must already be installed.

## [0.10.1] - 2023-04-28

### Fixed

- If pretext is not installed, ask user whether they want to try to install, with option to stop asking.

## [0.10.0] - 2023-03-11

### Added

- Status bar item: click to select a pretext command; shows when pretext is running; displays success/warnings (and opens output channel if clicked while running or on warning).
- Debug mode: clicking status bar or run icon includes option to run pretext commands in a terminal, allowing a user to interact or debug issues.
- View output/dismiss buttons on success message popup.
- Show log/dismiss buttons on error message popup.

### Fixed

- All output (both stdout and stderr) shown in output channel.
- Better status messages for warnings and success messages.

### Changed

- Output channel not shown by default.
- Removed PreTeXt-Commands menu (functionality replaced by status bar button)

## [0.9.0]

### Added

- Setting to decide schema version (Stable/Experimental) ready for updated schema from the CLI.
- Set default value for `xml.references` so that `<xref ref="foo"/>` is linked to `@xml:id="foo"`.

### Fixed

- Snippets that insert sanitized version of title as the xml:id remove all punctuation.
- PreTeXt Commands menu persists as long as extension is active.

## [0.8.1] - 2023-01-02

### Fixed

- Pretext commands menu will be expanded by default first time it is used.

## [0.8.0] - 2022-12-21

### Added

- Menu of available commands shows in explorer view.
- Support for Live Preview and CodeChat to view output. User is asked which of the available methods to use, or can select a default in settings.
- New snippets to create template part, chapter, section, exercises subfiles.

### Changed

- Commands now categorized as "PreTeXt" instead of "PreTeXt Tools".
- Generate command now asks for target for which assets should be generated.

## [0.7.1] - 2022-12-21

### Fixed

- Fixed file pattern for schema checking
- Set default configuration of XML package to follow xinclude elements.
- Improved a few snippets

## [0.7.0]

### Added

- Support for PreTeXt schema validation via (now required) vscode-xml extension
- Build icon on top of editor

### Fixed

- Snippets only appear on pretext document, not any XML document

## [0.6.0]

### Added

- PreTeXt is now a language, autodetected on ".ptx" files.
- New keybindings for build, view, and generate.
- Reorganized functions that call the CLI.
- CLI functions get list of targets from the project manifest.
- Checks for the CLI being installed; otherwise tries to install it.
- New snippets: console, creator, pre, cdata, <, &, all remark-like blocks, outcomes, computation, technology.
- More tags now wrap selected text (e.g., c, em, term, etc)

## [0.5.0] - 2022-06-20

### Changed

- Most snippets now start with `<`
- Move of repository on github to just oscarlevin/pretext-tools

### Fixed

- Tabular snippet has correct closing tag

## [0.4.1] - 2021-07-28

### Fixed

- Improved highlighting of math inside md and mdn.

## [0.4.0] - 2021-07-16

### Added

- New commands registered that allow you to build and view PreTeXt documents in various formats by calling the PreTeXt-CLI (which needs to be installed).

## [0.3.0] - 2020-10-30

### Added

- New snippets: url, url-empty, email, code-display, cline, alert, delete, insert, stale, foreign, taxon, pubtitle, articletitle, youtube, tag, tage, attribute, fillin.
- If text is selected, using m snippet keeps selected text (inside m).
- Grammar now selects stray less-than characters as illegal
- Grammar now bolds terms and alerts, specifies titles, and marks up code as raw.

### Fixed

- Now all snippets indent with tabs/spaces consistent with users settings.
- Tabstop on theorem snippet works.
- me with permid now gets highlighted as math

## [0.2.0] - 2020-05-11

### Fixed

- Now all snippets indent with tabs/spaces consistent with users settings.

## [0.1.3] - 2019-09-04

### Added

- new snippets: exercise-worksheet; exercise-numbered; @number; mdn.

### Fixed

- Set final tabstop for paragraphs to $0, so that additional snippets can be deployed.
- Fixed bug causing !ptx-article to appear when not wanted.

## [0.1.2] - 2019-08-19

### Added

- reading questions snippets
- worksheets snippets (including @workspace and pagebreak)

## [0.1.0] - 2019-08-18

### Initial release. Added

- Some basic extensions to the xml grammar:
  - permid attributes are highlighted as comments.
  - math is highlighted as LaTeX does.
  - Commented "TODO" highlighted as keyword.
- A healthy collection of snippets to get started.
  - Should have all divisions and environments.
  - Has a few attributes to help remember what can go where.
  - A start on longer "templates", allowing a new pretext document to be filled in.
