//convertParagraph function using regex currently unused
// function convertParagraph(text: string) {
//   //convert empty lines to paragraph
//   let result = text.replace(
//     /(\r|\n(?!\r|\n))(.*?)((\r|\n)\s*?(\r|\n))/gs,
//     "<p>\n$2\n</p>\n\n"
//   );
//   return result;
// }

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

function converter(text: string) {
  let result = text;
  //result = convertParagraph(result);
  result = convertMath(result);
  result = convertTextMarkup(result);
  result = convertQuotation(result);

  return result;
}

function getBlockList(text: string) {
  // We parse the text input and return a list of strings, each a separate "block", which could be a paragraph or a \begin/\end environment.
  let blockList: string[] = [];
  let textArray = text.split(/\r\n|\r|\n/);
  let loopCount = text.split(/\r\n|\r|\n/).length;
  let convertCheck = true;
  let block = "";
  
  for (let i = 0; i < loopCount; i++) {


    if (textArray[i].trim().length === 0) {
      console.log(i + 1 + ": " + textArray[i] + "empty");
      block += "\n";
      blockList.push(block);
      block = "";
      continue;
    }

    if (convertCheck) {
      if (textArray[i].trim().startsWith("\\begin")) {
        block += textArray[i].trim() + "\n";

        convertCheck = false;
      } else {
        if (i === 0) {
          block += "\n" + converter(textArray[i]).trim() + "\n";
          if (textArray[i + 1].trim().length === 0) {
            block += "\n";
            blockList.push(block);
            block = "";
          }
        } else if (i + 1 === loopCount) {
          if (textArray[i - 1].trim().length === 0) {
            block += "\n";
          }
          block += converter(textArray[i]).trim() + "\n";
          blockList.push(block);
          block = "";
        } else {
          if (textArray[i - 1].trim().length === 0) {
            block += "\n";
          }
          block += converter(textArray[i]).trim() + "\n";
          if (textArray[i + 1].trim().length === 0) {
            block += "\n";
            blockList.push(block);
            block = "";
          }
        }
      }
    } else {
      if (textArray[i].trim().startsWith("\\end")) {
        block += textArray[i].trim() + "\n";

        blockList.push(block);
        block = "";

        convertCheck = true;
      } else {
        block += textArray[i].trim() + "\n";
      }
    }
  }


  for (var blockCheck of blockList) {
    console.log("BLOCK CHECK: " + blockCheck);
  }
  
  return blockList;
}

function convertBlockList(blockList: Array<string>) {
  // We convert the block list to pretext.
  for (let block in blockList) {
    // if the block is a \begin/\end block in a "don't touch" list, we skip it.
    // else if the block is a \begin/\end block in a "convert" list, we wrap it with the right thing and run a getBlockList and convertBlockList on the contents.
    // else we run a converter on the block.
  }
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
  getBlockList(text);
  let textArray = text.split(/\r\n|\r|\n/);
  var result = "";
  let convertCheck = true;
  let loopCount = text.split(/\r\n|\r|\n/).length;

  // let blockList = makeBlockList(textArray);
  // result = convertBlockList(blockList);

  for (let i = 0; i < loopCount; i++) {
    if (textArray[i].trim().length === 0) {
      console.log(i + 1 + ": " + textArray[i] + "empty");
      result += "\n";
      continue;
    }

    console.log(i + 1 + ": " + textArray[i]);

    if (convertCheck) {
      if (textArray[i].trim().startsWith("\\begin")) {
        result += textArray[i].trim() + "\n";

        convertCheck = false;
      } else {
        if (i === 0) {
          result += "\n<p>\n" + converter(textArray[i]).trim() + "\n";
          if (textArray[i + 1].trim().length === 0) {
            result += "</p>\n";
          }
        } else if (i + 1 === loopCount) {
          if (textArray[i - 1].trim().length === 0) {
            result += "<p>\n";
          }
          result += converter(textArray[i]).trim() + "\n</p>\n";
        } else {
          if (textArray[i - 1].trim().length === 0) {
            result += "<p>\n";
          }
          result += converter(textArray[i]).trim() + "\n";
          if (textArray[i + 1].trim().length === 0) {
            result += "</p>\n";
          }
        }
      }
    } else {
      if (textArray[i].trim().startsWith("\\end")) {
        result += textArray[i].trim() + "\n";

        convertCheck = true;
      } else {
        result += textArray[i].trim() + "\n";
      }
    }
  }

  return result;
}
