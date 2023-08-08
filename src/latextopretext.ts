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
    if (convertCheck) {
      if (textArray[i].trim().length === 0) {
        block += "\n";
        blockList.push(block);
        block = "";
        continue;
      }
      if (textArray[i].trim().startsWith("\\begin")) {
        block += textArray[i].trim() + "\n";

        convertCheck = false;
      } else {
        if (i === 0) {
          block += textArray[i].trim() + "\n";
          if (textArray[i + 1].trim().length === 0) {
            blockList.push(block);
            block = "";
          }
        } else if (i + 1 === loopCount) {
          block += textArray[i].trim() + "\n";
          blockList.push(block);
          block = "";
        } else {
          block += converter(textArray[i]).trim() + "\n";
          if (textArray[i + 1].trim().length === 0) {
            blockList.push(block);
            block = "";
          }
        }
      }
    } else {
      if (textArray[i].trim().startsWith("\\end")) {
        block += textArray[i].trim();

        blockList.push(block);
        block = "";

        convertCheck = true;
      } else {
        if (textArray[i].trim().length === 0) {
          block += "\n";
        } else {
          block += textArray[i].trim() + "\n";
        }
        if (i + 1 === loopCount) {
          blockList.push(block);
        }
      }
    }
  }

  // //log each block in terminal to see how it is building as test
  // for (var blockCheck of blockList) {
  //   console.log("BLOCK CHECK: " + blockCheck);
  // }

  return blockList;
}

function convertBlockList(blockList: Array<string>) {
  var result = "";
  for (let block of blockList) {
    if (block.trim().length === 0) {
      result += "\n";
    }
    //block is a \begin/\end block skip for now.
    else if (block.trim().startsWith("\\begin")) {
      const blockArray = block.split("\n");

      const insideBlock = blockArray.slice(1, -1);
      result +=
        "<block>\n\t" +
        convertBlockList(getBlockList(insideBlock.join("\n"))) +
        "\n</block>";

      //additional conditionals can be added within this section for /begin blocks to detemine convert|!convert
      // result += block;
    }
    //Block likely a paragraph run a converter on the block.
    else {
      if (block.trim().startsWith("\\")) {
        result += converter(block);
      } else {
        result += "<p>\n" + converter(block) + "</p>\n";
      }
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
  var result = convertBlockList(getBlockList(text));

  return result;
}
