# Change Log

All notable changes to the "pretext-tools" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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