import * as vscode from 'vscode';

const docStructure = [
  'pretext', 'mathbook', 'book', 'part', 'article', 
  'docinfo', 'macros',
  'html', 'search', 'google', 'feedback', 'index',
  'frontmatter', 'backmatter', 
  'appendix', 'solutions', 'references', 'biography', 'dedication',
  'titlepage', 'preface', 'abstract', 'colophon', 'shortlicense',
  'acknowledgement', 'credit', 'website', 'copyright',
  'author', 'editor', 'contributor', 'contributors' ];

const docSecs = ['chapter', 'section', 'subsection', 'subsubsection',
'technology', 'worksheet',
'objectives', 'outcomes', 'paragraphs', 'task',
'sbsgroup', 'stack',
'introduction', 'conclusion', 'assemblage',
'prelude', 'postlude'];

const docEnvs = ['proof',
'project',
'theorem', 'proposition', 'lemma', 'conjecture',
'corollary', 'principle', 'algorithm',
'definition', 'axiom', 'example', 'insight', 'exploration',
'problem', 'exercise', 'question',
'statement', 'hint', 'solution', 'answer', 'case',
'note', 'blockquote',
'openconjecture', 'openproblem', 'openquestion',
'activity', 'remark', 'warning', 'table', 'tabular',
'list', 'listing', 'program', 'console', 'demonstration',
'images', 'image',
'fact', 'subtask', 'claim', 'biblio',
'poem', 'stanza'];

const docPieces = ['title', 'subtitle', 'cell', 'caption',
                   'address', 'attribution', 'location', 'edition',
                   'personname', 'date', 'email', 'department', 'institution',
                   'cd', 'line', 'cline',
                   'alert', 'url', 'q', 'pubtitle',
                   'role', 'entity', 'year', 'minilicense', 'holder',
                   'usage', 'description', 'journal', 'volume', 'number',
                   'mrow', 'intertext', 'initialism',
                   'set', 'pg-macros'];

// empty tags that should be on their own line
const docEmpty = ['cell', 'col', 'notation-list', 'brandlogo',
'cross-references', 'input', 'video', 'slate',
'webwork'];

const list_like = ['ol', 'ul', 'dl'];

const math_display = ['me', 'men', 'md', 'mdn'];

const footnote_like = ['fn'];

const nestable_tags = ["ul", "ol", "li", "p", "task", "figure", "sidebyside"];

// note that c is special, because it is inline verbatim
const verbatimTags = ['latex-image-preamble', 'latex-image', 'latex-preamble',
                 'slate', 'sage', 'sageplot', 'asymptote', 'macros',
                 'program', 'input', 'output', 'prompt', 'pre', 'pg-code',
                 'tikzpicture', 'tikz', 'code',
                 'c'];

const newlineTags = docStructure.concat(docSecs).concat(docEnvs).concat(nestable_tags);

const blockTags = newlineTags.concat(math_display);



export function formatPTX(document: vscode.TextDocument): vscode.TextEdit[] {
  // let changes = [];
  // const firstLine = document.lineAt(0);
  // if (!firstLine.text.startsWith("<?xml")) {
  //   changes.push(
  //     vscode.TextEdit.insert(firstLine.range.start, '<?xml version="1.0" encoding="UTF-8"?>\n')
  //   );
  // } 

  // First clean up document so that each line is a single tag when appropriate.
  let allText = document.getText();

  console.log("Getting ready to start formatting.")
  for (let btag of blockTags) {
    let startTag = new RegExp('<'+btag+'(>|(\s[^/]*?)>)', 'g');
    let endTag = new RegExp('<\\/'+btag+'>(.?)', 'g');
    allText = allText.replace(startTag, "\n$&\n");
    allText = allText.replace(endTag, "\n$&\n");
  }

  let level = 0;
  let verbatim = false;
  let lines = allText.split(/\r\n|\r|\n/g);
  console.log("Finished splitting lines. Now will process", lines.length, "lines.");
  let fixedLines = [];
  for (let line of lines) {
    console.log("level is", level, "and verbatim is", verbatim, "and line is", line);
    let trimmedLine = line.trim();
    let openTagMatch = /^<(\w*?)(\s.*?|>)$/.exec(trimmedLine);
    let closeTagMatch = /^<\/(\w*?)(\s.*?|>)(.?)$/.exec(trimmedLine);
    let selfCloseTagMatch = /^<(\w*?)(\s.*?\/>|\/>)$/.exec(trimmedLine);
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
        level = Math.max(0, level-1);
        fixedLines.push("\t".repeat(level) + trimmedLine);
      } else if (verbatimTags.includes(closeTagMatch[1])) {
        verbatim = false;
        fixedLines.push("\t".repeat(level) + trimmedLine);
      }
    } else if (openTagMatch) {
      if (blockTags.includes(openTagMatch[1])) {
        fixedLines.push("\t".repeat(level) + trimmedLine);
        level += 1;
      } else if (verbatimTags.includes(openTagMatch[1])) {
        verbatim = true;
        fixedLines.push("\t".repeat(level) + trimmedLine);
      }
    } else if (verbatim) {
      fixedLines.push(line);
    } else {
      fixedLines.push("\t".repeat(level) + trimmedLine);
    }
  }
  // Second pass: add empty line between appropriate tags.
  for (let i = 0; i < fixedLines.length-1; i++) {
    if (fixedLines[i].trim().startsWith("</")){
      for (let tag of newlineTags) {
        let startTag = new RegExp('<'+tag+'(.*?)>', 'g');
        if (startTag.test(fixedLines[i+1])) {
          console.log("Adding newline between", fixedLines[i], "and", fixedLines[i+1]);
          fixedLines[i] += "\n";
        }
      } 
    }
  }
  // Add document identifier line if missing:
  if (!fixedLines[0].trim().startsWith('<?xml')) {
    fixedLines.unshift('<?xml version="1.0" encoding="UTF-8" ?>');
  }

  allText = fixedLines.join("\n");

  return [vscode.TextEdit.replace(document.validateRange(new vscode.Range(0, 0, document.lineCount, 0)), allText)];
}