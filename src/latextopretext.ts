//convertParagraph function using regex currently unused
// function convertParagraph(text: string) {
//   //convert empty lines to paragraph
//   let result = text.replace(
//     /(\r|\n(?!\r|\n))(.*?)((\r|\n)\s*?(\r|\n))/gs,
//     "<p>\n$2\n</p>\n\n"
//   );
//   return result;
// }

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
function converter(text: string) {
  let result = text;
  //result = convertParagraph(result);
  result = convertMath(result);
  result = convertTextMarkup(result);
  result = convertQuotation(result);

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
  let textArray = text.split(/\r\n|\r|\n/);
  var result = "";
  let convertCheck = true;
  let loopCount = text.split(/\r\n|\r|\n/).length;

  for (let i = 0; i < loopCount; i++) {
    //test i + 1 i - 0 .length(0)
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
