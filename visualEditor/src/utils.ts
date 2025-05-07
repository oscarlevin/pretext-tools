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
import { toXml } from "xast-util-to-xml";
import { SKIP, visit} from "unist-util-visit";
import { whitespace } from "hast-util-whitespace";
import type { ElementContent, Root, RootContent } from "xast"; // Import ElementContent type

const KNOWN_TAGS = [
  'm',
  'me',
  'p',
  'subsection',
  'section',
  'title',
  'theorem',
  'statement',
  'proof',
  'term',
  "em",
  "alert",
  "pre",
];

/*
* Clean up incoming PreTeXt source to ensure all tags are ones that the visual editor can handle.
* Tags that are not recognized are wrapped with the <rawptx> placeholder, that can be rendered back to the original.
*/
export function cleanPtx(origXml: string) {
  // We use xast to parse the XML into a AST
  const tree = fromXml(origXml);
  // Visit each node until we find an unknown tag
  visit(tree, (node, index, parent) => {
    if (node.type === "element" && !KNOWN_TAGS.includes(node.name)) {
      // Create a rawptx node whose contents is the sanatized (escaped) xml
      const rawptxNode: ElementContent = {
        type: "element",
        name: "rawptx",
        attributes: {},
        children: [
          //{type: "text", value: '\n'},
          {type: "text", value: toXml(node)},
          //{type: "text", value: '\n'},
        ],
      };
      // replace the node with the rawptx node
      if (typeof index !== 'number' || !parent ) return;
      parent.children.splice(index, 1, rawptxNode);
      // Stop processing children of this node
      return SKIP;
    }
  });
  console.log("xast after: ", tree);
  // Convert the resulting tree back to XML
  const newXml = toXml(tree);
  //console.log("back to xml: ", xml);
  return newXml;
}


export function ptxToJson(xml: string) {
  let json = {};
  const tree = fromXml(xml);
  console.log(JSON.stringify(buildJsonFromTree(tree), null, 2));
  return json
}

function buildJsonFromTree(tree: Root | RootContent ) {
  let ret;
  visit(tree, (node) => {
    if (node.type === "root" && node.children) {
      ret = {
        type: "ptxFragment",
        content: node.children
          .filter((child) => buildJsonFromTree(child) !== undefined)
          .map((child) => buildJsonFromTree(child)),
      };
    } else if (node.type === "element") {
      ret = {
        type: node.name,
        attrs: node.attributes,
        content: node.children
          .filter((child) => buildJsonFromTree(child) !== undefined)
          .map((child) => buildJsonFromTree(child)),
      }
    } else if (node.type === "text" && !whitespace(node)) {
        ret = {
          type: "text",
          text: node.value.trim(),
        }
    }
    return SKIP;
  });
  return ret;
}