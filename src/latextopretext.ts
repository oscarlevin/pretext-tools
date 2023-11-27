// module

const BLOCKS: { [key: string]: string } = {
  axiom: "axiom",
  theorem: "theorem",
  lemma: "lemma",
  corollary: "corollary",
  proposition: "proposition",
  definition: "definition",
  example: "example",
  remark: "remark",
  exercise: "exercise",
  question: "question",
  problem: "problem",
  solution: "solution",
  proof: "proof",
  note: "note",
  aside: "aside",
  figure: "figure",
  table: "table",
  algorithm: "algorithm",
  enumerate: "ol",
  itemize: "ul",
};

// Paragraph element conversions /////////////////////////////////

function convertMath(text: string) {
  //convert diplay math mode
  let result = text.replace(
    /(\${2}|\\\[|\\begin{displaymath}|\\begin{equation})(.*?)(\${2}|\\\]|\\end{displaymath}|\\end{equation})/gs,
    "<me>$2</me>"
  );
  //convert inline math mode
  result = result.replace(
    /((?<!\\)\$|\\\(|\\begin{math})(.*?)((?<!\\)\$|\\\)|\\end{math})/gs,
    "<m>$2</m>"
  );

  return result;
}
function convertTextMarkup(text: string) {
  //Convert verbatim
  let result = text.replace(
    /(\\verb\||\\begin{verbatim})(.*?)(\||\\end{verbatim})/gs,
    "<c>$2</c>"
  );
  //convert emphasis/italics
  result = result.replace(/(\\emph{|\\textit{)(.*?)(})/gs, "<em>$2</em>");
  //convert boldface
  result = result.replace(/(\\textbf{)(.*?)(})/gs, "<term>$2</term>");

  return result;
}

function convertQuotation(text: string) {
  //convert double quote
  let result = text.replace(/(``|")(.*?)(''|")/gs, "<q>$2</q>");

  //convert single quote
  result = result.replace(/(`|')(.*?)(')/gs, "<sq>$2</sq>");
  return result;
}

/////////////////////////////////////////////////////////////////

function convertP(text: string) {
  let result = text;
  result = convertMath(result);
  result = convertTextMarkup(result);
  result = convertQuotation(result);
  return result;
}

//////// Convert lines starting with a backslash //////////////////////

function convertBS(text: string) {
  let command = text.match(/(\\.*?)(\\| |$)/);
  // console.log("LINE "+text);
  if (command !== null) {
    // console.log("COMMAND: "+command[1]);
    text = text.replace(command[1], "");
    // console.log("TEXT: "+text);
    // Item:
    if (command[1] === "\\item") {
      return "<li>\n\t<p>\n\t\t" + convertP(text) + "\n<p>\n</li>\n";
    }
    // \vspace or \vskip:
    else if (["\\vskip", "\\vspace"].includes(command[1].trim())) {
      // console.log("VSPACE");
      return "<!-- " + command[1] + text + " -->\n";
    }
    // All other cases, just leave a comment:
    else {
      return (
        "<!-- " + command[1] + " -->\n<p>\n\t" + convertP(text) + "\n</p>\n"
      );
    }
  }
}

//////// Split text into array of lines //////////////////////

function makeLines(text: string) {
  // Create an array of lines, with whitespace stripped from the beginning and end of each line.
  let lines = text.split(/\r\n|\r|\n/);
  lines = lines.map((line) => line.trim());
  // console.log("LINES: "+lines );
  // console.log("LINES LENGTH: "+lines.length );

  // If lines contains multiple lines, we process it, otherwise just return the single line.
  if (lines.length > 1) {
    // Merge lines that start with regular characters into single lines.
    let i = 0;
    while (i < lines.length - 1) {
      if (
        lines[i].length > 0 &&
        lines[i + 1].length > 0 &&
        !lines[i].startsWith("\\") &&
        !lines[i + 1].startsWith("\\")
      ) {
        lines[i] = lines[i] + " " + lines[i + 1];
        lines.splice(i + 1, 1);
      } else {
        i += 1;
      }
    }
    // Then remove empty lines.
    lines = lines.filter((line) => line.length > 0);
  }
  // console.log("LINES: "+lines );
  // console.log("LINES LENGTH: "+lines.length );
  return lines;
  // let loopCount = text.split(/\r\n|\r|\n/).length;
  // let depth = 0;
  // let block = "";
  // console.log("TEXT ARRAY: " + lines);
  // console.log("LOOP COUNT: " + lines.length);
  // let i = 0;
  // while (i < lines.length) {
  //   console.log("LINE: " + lines[i] + "; BLOCK: " + block);
  //   // If we are at depth 0 and we see regular text, assume we are at a start of a paragraph.  Read until an empty line or a \begin is encountered.
  //   if (depth === 0) {
  //     if (lines[i].startsWith("\\begin")) {
  //       depth += 1;
  //       i += 1;
  //     } else if (lines[i].startsWith("\\end")) {
  //       lines[i-1] = lines[i-1]+"\n"+lines[i].
  //       depth -= 1;
  //     }

  //   }
  //   if (convertCheck) {
  //     if (lines[i].trim().length === 0) {
  //       block += "\n";
  //       blockList.push(block);
  //       block = "";
  //       continue;
  //     }
  //     if (lines[i].trim().startsWith("\\begin")) {
  //       block += lines[i].trim() + "\n";

  //       convertCheck = false;
  //     } else {
  //       if (i === 0) {
  //         block += lines[i].trim() + "\n";
  //         if (lines[i + 1].trim().length === 0) {
  //           blockList.push(block);
  //           block = "";
  //         }
  //       } else if (i + 1 === loopCount) {
  //         block += lines[i].trim() + "\n";
  //         blockList.push(block);
  //         block = "";
  //       } else {
  //         block += converter(lines[i]).trim() + "\n";
  //         if (lines[i + 1].trim().length === 0) {
  //           blockList.push(block);
  //           block = "";
  //         }
  //       }
  //     }
  //   } else {
  //     if (lines[i].trim().startsWith("\\end")) {
  //       block += lines[i].trim();

  //       blockList.push(block);
  //       block = "";

  //       convertCheck = true;
  //     } else {
  //       if (lines[i].trim().length === 0) {
  //         block += "\n";
  //       } else {
  //         block += lines[i].trim() + "\n";
  //       }
  //       if (i + 1 === loopCount) {
  //         blockList.push(block);
  //       }
  //     }
  //   }
  // }

  // //log each block in terminal to see how it is building as test
  // for (var blockCheck of blockList) {
  //   console.log("BLOCK CHECK: " + blockCheck);
  // }

  // return blockList;
}

function convertLines(lines: string[]) {
  // We put the lines back together into a single string, with each line converted into its proper PreTeXt form.
  var result = "";
  for (let line of lines) {
    if (line.length === 0) {
      result += "\n";
    }
    //line is a \begin/\end: convert to pretext block
    else if (line.startsWith("\\begin")) {
      let env = line.match(/\\begin{(.*?)}/);
      if (env !== null) {
        if (env[1] in BLOCKS) {
          result += "<" + BLOCKS[env[1]] + ">\n\t";
        } else {
          result +=
            "<!-- START " +
            env[1] +
            " environment (not defined in PreTeXt) -->\n\t";
        }
      }
    } else if (line.startsWith("\\end")) {
      let env = line.match(/\\end{(.*?)}/);
      if (env !== null) {
        if (env[1] in BLOCKS) {
          result += "\n</" + BLOCKS[env[1]] + ">\n";
        } else {
          result += "<!-- END " + env[1] + " environment -->\n";
        }
      }
    }
    //Line starts with a backslash command; could be something like \item
    else if (line.startsWith("\\")) {
      result += convertBS(line);
    }
    // Otherwise we assume it is a paragraph.
    else {
      result += "<p>\n\t" + convertP(line) + "\n</p>\n";
    }
  }
  return result;
}

// Converts full text testing convert line by line//calls each conversion in extension
// export function latexToPretext(text: string) {
//   var result = text;

//   //result = convertParagraph(result);
//   result = convertMath(result);
//   result = convertTextMarkup(result);
//   result = convertQuotation(result);

//   return result;
// }
export function latexToPretext(text: string) {
  var result = convertLines(makeLines(text));

  return result;
}
