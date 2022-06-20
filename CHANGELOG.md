# Change Log

All notable changes to the "pretext-tools" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

### Initial release.  Added

- Some basic extensions to the xml grammar:
  - permid attributes are highlighted as comments.
  - math is highlighted as LaTeX does.
  - Commented "TODO" highlighted as keyword.
- A healthy collection of snippets to get started.
  - Should have all divisions and environments.
  - Has a few attributes to help remember what can go where.
  - A start on longer "templates", allowing a new pretext document to be filled in.