// Utilities for the visual editor

//export function addAttributes(){
//  return {
//    label: {
//      parseHTML: (element) => element.getAttribute("label"),
//    },
//    "xml:id": {
//      parseHTML: (element) => element.getAttribute("xml:id"),
//    }
//  }
//}
//import { formatPTX } from "../../src/formatter";


//export function cleanText(text: string) {
//  return formatPTX(text
//    .split("\n")
//    .map((line) => line.trim())
//    .join("\n"));
//}

import { fromXml } from "xast-util-from-xml";

const KNOWN_TAGS = [
  'p',
  'subsection',
  'section',
  'title',
  'theorem',
  'term',
  "unknown",
  "pre",
];


export function ptxToJson(text: string) {
  const output = fromXml(text);
  return output;
}


/*
* Clean up incoming PreTeXt source to ensure all tags are ones that the visual editor can handle.
* Tags that are not recognized will be replaced with a placeholder, that can be rendered back to the original.
*/
export function preprocessPtx(text: string): string {
  let inUnknownTag = false;
  let unknownTag = "";

  let lines = text.split("\n");
  for (let line of lines) {
    if (!inUnknownTag) {
      const tagMatches = [...line.matchAll(/<([^>]+)>/g)];
      if (tagMatches) {
        for (const match of tagMatches) {
          if (!KNOWN_TAGS.includes(match[1])) {
            inUnknownTag = true;
            unknownTag = match[1];
            // insert <rawptx> before the unknown tag
            line = line.replace(match[0], "<rawptx>" + match[0]);
            const endTag = "</" + match[1] + ">";
            if (line.includes(endTag)) {
              // if the end tag is on the same line, replace it with </rawptx>
              line = line.replace(endTag, endTag+"</rawptx>");
              inUnknownTag = false;
            }
            // and escape everything in between
            line = line.replace(/<rawptx>(.*?)(<\/rawptx>|$)/g, (_, content) => {
              return content.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            });
            console.log("Unknown tag: " + match[1]);
            console.log("Line: " + line);
            break;
          }
        }
      }
    }

  }

  text = lines.join("\n");
  return text;
}