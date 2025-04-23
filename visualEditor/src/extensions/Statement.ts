import { Node } from "@tiptap/core";

const Statement = Node.create({
  name: "statement",
  content: "p+",
  group: "blockContent",
  renderHTML() {
    return ["div", { class: "statement" }, 0];
  },
});

export default Statement;
