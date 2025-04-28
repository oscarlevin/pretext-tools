/* eslint-disable @typescript-eslint/no-explicit-any */
const tt2ptx = {
  para: "p",
  bulletList: "ul",
  orderedList: "ol",
  listItem: "li",
  italic: "em",
};



function json2ptx(json: any) {
  let ptx = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n\n";
  // Top level node is a ptxFragment, but double check this:
  if (json.type !== "ptxFragment") {
    console.log("Top level node is not a ptxFragment");
    return "";
  }
  // Now take the content of the ptxFragment and process it:
  if (!json.content) {
    console.log("No content in json");
    return "";
  }
  // There should only be one child in json.content
  if (json.content.length !== 1) {
    console.log("More than one child in json.content");
    return "";
  }
  ptx +=  processNode(json.content[0]);
  return ptx;
}


function processNode(json: any) {
  let ptx = "";
  if (json.content) {
    // every node should have a type; if it needs to be changed, we do so:
    const elementName =
      json.type in tt2ptx
        ? tt2ptx[json.type as keyof typeof tt2ptx]
        : json.type;
      // nodes might have attrs
      const elementAttrs = json.attrs
      ptx = ptx + "<" + elementName;
      if (elementAttrs) {
        for (const [key, value] of Object.entries(elementAttrs)) {
          console.log(key, value)
          ptx = ptx + " " + key + '="' + value + '"';
        }
      }
      ptx = ptx + ">\n";
    // console.log("content is:"+ json.content)
    for (const fragment of json.content) {
      ptx = ptx + processNode(fragment);
      // console.log(fragment)
      //   // ptx = ptx + "<"+fragment.type+">"
      //   ptx = ptx + json2ptx(fragment.content)
      //   // ptx = ptx + "</"+fragment.type+">\n"
    }
    ptx = ptx + "\n</" + elementName + ">\n";
  } else {
    // text type nodes are exactly the leaf nodes
    if (json.type === "text") {
      if (json.marks) {
        // assume there is only one mark per text node
        const markName =
          json.marks[0].type in tt2ptx
            ? tt2ptx[json.marks[0].type as keyof typeof tt2ptx]
            : json.marks[0].type;
        ptx = ptx + "<" + markName + ">" + json.text + "</" + markName + ">";
      } else {
        ptx = ptx + json.text;
      }
    } else {
      // console.log("Unexpected leaf node type:")
      ptx = ptx + "<!-- Something is missing -->";
    }
  }
  return ptx;
}

export {json2ptx};
