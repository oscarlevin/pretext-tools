/* eslint-disable @typescript-eslint/no-explicit-any */
const tt2ptx = {
  para: "p",
  bulletList: "ul",
  orderedList: "ol",
  listItem: "li",
  italic: "em",
};

function json2ptx(json: any) {
  let ptx = "";
  if (json.content) {
    // every node should have a type; if it needs to be changed, we do so:
    const elementName =
      json.type in tt2ptx
        ? tt2ptx[json.type as keyof typeof tt2ptx]
        : json.type;
    ptx = ptx + "<" + elementName + ">\n";
    // console.log("content is:"+ json.content)
    for (const fragment of json.content) {
      ptx = ptx + json2ptx(fragment);
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

export default json2ptx;
