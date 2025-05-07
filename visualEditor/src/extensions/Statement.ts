import { Node } from "@tiptap/core";

const Statement = Node.create({
  name: "statement",
  content: "p+",
  group: "blockContent",
  parseHTML() {
    return [{ tag: "statement" }];
  },
  renderHTML() {
    return ["div", { class: "statement", ptxtag: "statement" }, 0];
  },
});

export default Statement;
