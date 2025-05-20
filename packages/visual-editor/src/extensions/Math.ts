import { Node, mergeAttributes, nodeInputRule, wrappingInputRule, } from "@tiptap/core";
import katex from "katex";

const MathInline = Node.create({
  name: "m",
  content: "text*",
  group: "inline math",
  inline: true,
  atom: false,

  parseHTML() {
    return [{ tag: "m" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes({ class: "inlineMath" }, HTMLAttributes)];
  },
  addInputRules() {
    return [
      //nodeInputRule({
      //  find: new RegExp('(?:^|\\s)<m>(\\s)', "i"),
      //  type: this.type,
      //}),
      nodeInputRule({
        // Match $...$ but not $$...$$
        find: new RegExp('(?:^|\\s)$(\\s)'),
        type: this.type,
      }),
      nodeInputRule({
        // Matches \( ... \)
        find: /(?:^|\s)(\\\((.*?)\\\))$/,
        type: this.type,
      }),
      wrappingInputRule({
        find: new RegExp(`(?:^|\\s)(<m>(\\s))`),
        type: this.type,
      }),
    ];
  },
  addNodeView() {
    return ({ node, HTMLAttributes }) => {
      const dom = document.createElement("span");
      dom.classList.add("node-view");
      Object.entries(HTMLAttributes).forEach(([key, value]) => {
        dom.setAttribute(key, value);
      });

      const rendered = document.createElement("span");
      const editable = document.createElement("span");
      const latex = node.textContent.trim();

      rendered.innerHTML = katex.renderToString(latex, { throwOnError: false });
      rendered.contentEditable = "true";

      editable.classList.add("edit-math");
      editable.classList.add("is-editable");
      editable.innerHTML = "<m>" + node.textContent + "</m>";

      const observer = new MutationObserver(() => {
        console.log("mutation observer");
        rendered.innerHTML = katex.renderToString(node.textContent, {
          throwOnError: false,
        });
      });
      observer.observe(editable, { characterData: true, subtree: true });
      dom.append(rendered, editable);
      return {
        dom,
        contentDOM: editable,
      };
    };
  },
});

const MathEquation = Node.create({
  name: "me",
  content: "text*",
  group: "inline math",
  inline: true,

  parseHTML() {
    return [{ tag: "me" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes({ class: "displayMath" }, HTMLAttributes)];
  },
  addInputRules() {
    return [
      nodeInputRule({
        find: /(?:^|\s)(<me>(.*?)<\/me>)$/,
        type: this.type,
      }),
      nodeInputRule({
        find: /(?:^|\s)(\$\$(.*?)\$\$)$/,
        type: this.type,
      }),
      nodeInputRule({
        // Matches \( ... \)
        find: /(?:^|\s)(\\\[(.*?)\\\])$/,
        type: this.type,
      }),
    ];
  },
  addNodeView() {
    return ({ node, HTMLAttributes }) => {
      const dom = document.createElement("div");
      dom.classList.add("node-view");
      dom.classList.add("display");
      Object.entries(HTMLAttributes).forEach(([key, value]) => {
        dom.setAttribute(key, value);
      });

      const rendered = document.createElement("span");
      const editable = document.createElement("span");
      const latex = node.textContent.trim();

      rendered.innerHTML = katex.renderToString(latex, { throwOnError: false });
      rendered.contentEditable = "false";

      editable.classList.add("edit-math");
      editable.classList.add("is-editable");
      editable.innerHTML = "<m>" + node.textContent + "</m>";

      const observer = new MutationObserver(() => {
        console.log("mutation observer");
        rendered.innerHTML = katex.renderToString(node.textContent, {
          throwOnError: false,
        });
      });
      observer.observe(editable, { characterData: true, subtree: true });
      dom.append(rendered, editable);
      return {
        dom,
        contentDOM: editable,
      };
    };
  },
});

export { MathInline, MathEquation };
