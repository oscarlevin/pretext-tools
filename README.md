# pretext-tools README

A Visual Studio Code extension to make writing PreTeXt documents easier.

## Features

- Defines the PreTeXt language, automatically selecting it for `.ptx` files.
- Syntax highlighting and indentation based on XML, plus some additions like recognizing math as LaTeX and "hiding" permid attributes as comments.
- Schema support via the [vscode-xml](https://github.com/redhat-developer/vscode-xml) extension (which also provides many xml tools).
- A large collection of snippets for most PreTeXt elements.
- A front-end for the [PreTeXt-CLI](https://github.com/PreTeXtBook/pretext-cli), with commands available through a menu in the side explorere, the command pallet (Ctrl+Shift+P), and keyboard shortcuts (Ctrl-Alt-B to build, Ctrl-Alt-V to view, etc.).
- Support for the Live Preview and CodeChat extensions to view output, as well as via the PreTeXt-CLI.
- Use pandoc to convert almost any file format to PreTeXt.

## Usage

### Identifying PreTeXt Documents

Open the root folder of your PreTeXt project in VSCode. Open any of your source documents. If it has a `.ptx` file extension, it should be identified as a PreTeXt document, and you will see "PreTeXt" as the language in the bottom right corner of the window. You can associate other file extensions with the PreTeXt language using the "Files: Associations" setting (Ctrl+, brings up settings). Or you can select PreTeXt for a particular document using the "Change Language Mode" command.

Having a document identified as a PreTeXt document will give you:

- Syntax highlighting
- Access to snippets (auto-complete)
- Access to keyboard shortcuts for PreTeXt commands.
- Schema validation (via required vscode-xml extension)

### Snippets

PreTeXt has a lot of markup to describe the structure of the document. To vastly speed up the authoring of the documents, the extension provides _snippets_ for almost all of the supported tags and attributes of PreTeXt. As you type, if you start typing a tag, such as `<example>`, autocomplete will pop up a menu at your cursor suggesting this tag. If you hit ENTER (or if configured, TAB), then the snippet will expand and put your cursor in the right spot to start typing the statement of the example.

![animation showing snippets](assets/snippets.gif "snippet example")

Some shorter snippets also allow you to tab out of them. For example, start typing `<m>` and hit enter. Your cursor will be between the start and end tags. When you are done typing your math, hit tab to jump out of the tags so you can keep typing.

Short tags like `<m>` and `<c>` and `<em>` can also be used to wrap selected content. Select the string of characters you want inside the tag, and start typing the tag name, then hit enter when given the option. The selected text should be restored with the start and end tags surrounding it.

Attributes are available if you start typing with "@".

If you open a new empty document that you will include via `xi:include`, save it with a `.ptx` extension and then fill in the structure using a "!" snippet.

To see a complete list of available snippets, hit Ctrl+Space.

Here are some options that I find make snippets more useful. For each of these, open settings in VS code and search for them.

- Emmet: Excluded Languages. I exclude PreTeXt Emmet for PreTeXt, since the snippets behave better.
- Editor: Snippets Suggestions. I set this to "top" so that the snippets are shown before other autocomplete suggestions.
- Editor: Tab Completion. I set this to "only snippets" so that I can hit TAB or ENTER to select the snippet.
- If you get too many snippet suggestions, experiment with the quick-suggest and completion settings. Please contribute suggestions on the best configuration if you find something that works well.

### Running PreTeXt

To build and view projects, and to generate assets, the extension calls the PreTeXt-CLI. Of course, you can open a terminal in VS Code (CTRL+\`) and type `pretext build web`, but you can also get more visual feedback by using the keyboard shortcut Ctrl+Alt+B, clicking the "run" arrow on the top-right of the editor, or selecting `PreTeXt Tools: Build` from the side menu or command pallet (CTRL+SHIFT+P). This will open up a context menu asking you which target you want to build. Select it and your project will be built for that target. Ctrl+Alt+V will ask you which project you want to view, and Ctrl+Alt+G will ask you what to generate.

There are additional commands that are accessible through the side menu and command pallet. Type Ctrl+Shift+P and start typing "PreTeXt" to see all of them.

In particular, if you are working with multiple projects in the same window, you might need to refresh your list of targets (this list is determined by looking at the `project.ptx` manifest, but is set once when a project is opened).

All this assumes you that have the PreTeXt-CLI installed. The extension will try to install this for you if not, but that still requires Python 3.8.5 or later, and PIP to be installed. If you don't have that yet, see the [PreTeXt documentation](https://pretextbook.org/doc/guide/html/quickstart-getting-pretext.html).

### Converting to PreTeXt

If you have pandoc installed, you can convert almost any format of document to pretext using the `PreTeXt: Convert To PreText` command from the command pallet.

## Change log

You can track the ongoing development progress in the [Changelog](CHANGELOG.md).

## Contributions

Like this extension? [Star it on GitHub](https://github.com/oscarlevin/pretext-tools/stargazers)!

Do you have an idea or suggestion? [Open a feature request](https://github.com/oscarlevin/pretext-tools/issues).

Found something wrong? [File an issue](https://github.com/oscarlevin/pretext-tools//issues).

Pull requests welcome.
