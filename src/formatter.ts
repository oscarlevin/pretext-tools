import * as vscode from "vscode";

const docStructure = [
  "abstract",
  "acknowledgement",
  "appendix",
  "article",
  "author",
  "backmatter",
  "biography",
  "book",
  "chapter",
  "colophon",
  "contributor",
  "contributors",
  "copyright",
  "credit",
  "dedication",
  "docinfo",
  "editor",
  "feedback",
  "frontmatter",
  "google",
  "html",
  "index",
  "macros",
  "mathbook",
  "preface",
  "pretext",
  "references",
  "search",
  "shortlicense",
  "solutions",
  "subsection",
  "titlepage",
  "website",
];

const docSecs = [
  "assemblage",
  "chapter",
  "conclusion",
  "introduction",
  "objectives",
  "outcomes",
  "paragraphs",
  "part",
  "postlude",
  "prelude",
  "reading-questions",
  "sbsgroup",
  "section",
  "stack",
  "subsection",
  "subsubsection",
  "task",
  "technology",
  "worksheet",
];

const docEnvs = [
  "activity",
  "algorithm",
  "answer",
  "axiom",
  "biblio",
  "blockquote",
  "case",
  "choice",
  "choices",
  "claim",
  "conjecture",
  "console",
  "corollary",
  "definition",
  "demonstration",
  "description",
  "example",
  "exercise",
  "exploration",
  "fact",
  "hint",
  "image",
  "images",
  "insight",
  "lemma",
  "list",
  "listing",
  "note",
  "openconjecture",
  "openproblem",
  "openquestion",
  "page",
  "poem",
  "principle",
  "problem",
  "program",
  "project",
  "proof",
  "proposition",
  "question",
  "remark",
  "shortdescription",
  "solution",
  "stanza",
  "statement",
  "subtask",
  "table",
  "tabular",
  "theorem",
  "warning",
  "webwork",
];

const docPieces = [
  "address",
  "alert",
  "attribution",
  "caption",
  "cd",
  "cell",
  "cline",
  "date",
  "department",
  "description",
  "edition",
  "email",
  "entity",
  "holder",
  "initialism",
  "institution",
  "intertext",
  "journal",
  "line",
  "location",
  "minilicense",
  "mrow",
  "number",
  "personname",
  "pg-macros",
  "pubtitle",
  "q",
  "role",
  "row",
  "set",
  "subtitle",
  "title",
  "url",
  "usage",
  "volume",
  "year",
];

// empty tags that should be on their own line
const docEmpty = [
  "cell",
  "col",
  "notation-list",
  "brandlogo",
  "cross-references",
  "input",
  "video",
  "slate",
  "webwork",
];

const list_like = ["ol", "ul", "dl"];

const math_display = ["me", "men", "md", "mdn"];

const footnote_like = ["fn"];

const nestable_tags = ["ul", "ol", "li", "p", "task", "figure", "sidebyside"];

// note that c is special, because it is inline verbatim
const verbatimTags = [
  "latex-image-preamble",
  "latex-image",
  "latex-preamble",
  "slate",
  "sage",
  "sageplot",
  "asymptote",
  "macros",
  "program",
  "input",
  "output",
  "prompt",
  "pre",
  "pg-code",
  "tikzpicture",
  "tikz",
  "code",
  "c",
];

const newlineTags = [...docStructure, ...docSecs, ...docEnvs, ...nestable_tags, "xi:include"];

const blockTags = [...docStructure, ...docSecs, ...docEnvs, ...nestable_tags, ...math_display];

export function formatPTX(document: vscode.TextDocument): vscode.TextEdit[] {
  // First clean up document so that each line is a single tag when appropriate.
  let allText = document.getText();

  console.log("Getting ready to start formatting.");
  for (let btag of blockTags) {
    let startTag = new RegExp("<" + btag + "(>|(s[^/]*?)>)", "g");
    let endTag = new RegExp("<\\/" + btag + ">(.?)", "g");
    allText = allText.replace(startTag, "\n$&\n");
    allText = allText.replace(endTag, "\n$&\n");
  }

  const extraLineBreaks = vscode.workspace
    .getConfiguration("pretext-tools")
    .get("formatter.breakSentences");
  console.log("extraLineBreaks is", extraLineBreaks);
  let level = 0;
  let verbatim = false;
  let lines = allText.split(/\r\n|\r|\n/g);
  let fixedLines = [];
  for (let line of lines) {
    let trimmedLine = line.trim();
    let openTagMatch = /^<(\w\S*?)(\s.*?|>)$/.exec(trimmedLine);
    let closeTagMatch = /^<\/(\w\S*?)(\s.*?|>)(.?)$/.exec(trimmedLine);
    // let selfCloseTagMatch = /^<(\w*?)(\s.*?\/>|\/>)$/.exec(trimmedLine);
    if (trimmedLine.length === 0) {
      continue;
    } else if (trimmedLine.startsWith("<?")) {
      // It's the start line of the file:
      fixedLines.push(trimmedLine);
    } else if (trimmedLine.startsWith("<!--")) {
      // It's a comment:
      fixedLines.push("\t".repeat(level) + trimmedLine);
    } else if (closeTagMatch) {
      if (blockTags.includes(closeTagMatch[1])) {
        level = Math.max(0, level - 1);
        fixedLines.push("\t".repeat(level) + trimmedLine);
      } else if (verbatimTags.includes(closeTagMatch[1])) {
        verbatim = false;
        fixedLines.push("\t".repeat(level) + trimmedLine);
      } else {
        fixedLines.push("\t".repeat(level) + trimmedLine);
      }
    } else if (openTagMatch) {
      fixedLines.push("\t".repeat(level) + trimmedLine);
      if (blockTags.includes(openTagMatch[1])) {
        level += 1;
      } else if (verbatimTags.includes(openTagMatch[1])) {
        verbatim = true;
      }
    } else if (verbatim) {
      fixedLines.push(line);
    } else {
      if (extraLineBreaks) {
        trimmedLine = trimmedLine.replace(/\.\s+/g, ".\n" + "\t".repeat(level));
      }
      fixedLines.push("\t".repeat(level) + trimmedLine);
    }
  }
  // Second pass: add empty line between appropriate tags.
  for (let i = 0; i < fixedLines.length - 1; i++) {
    if (fixedLines[i].trim().startsWith("</")) {
      for (let tag of newlineTags) {
        let startTag = new RegExp("<" + tag + "(.*?)>", "g");
        if (startTag.test(fixedLines[i + 1])) {
          console.log(
            "Adding newline between",
            fixedLines[i],
            "and",
            fixedLines[i + 1]
          );
          fixedLines[i] += "\n";
        }
      }
    } else if (fixedLines[i].trim().startsWith("<title>")) {
      fixedLines[i] += "\n";
    }
  }
  // Add document identifier line if missing:
  if (!fixedLines[0].trim().startsWith("<?xml")) {
    fixedLines.unshift('<?xml version="1.0" encoding="UTF-8" ?>');
  }

  allText = fixedLines.join("\n");

  return [
    vscode.TextEdit.replace(
      document.validateRange(new vscode.Range(0, 0, document.lineCount, 0)),
      allText + "\n"
    ),
  ];
}
