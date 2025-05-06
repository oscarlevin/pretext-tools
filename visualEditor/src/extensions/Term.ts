import {
  Node,
  mergeAttributes,
  nodeInputRule,
  nodePasteRule,
} from "@tiptap/core";

export const inputPTXRegex = /(?:^|\s)(<term>(.*?)<\/term>)$/;
export const pastePTXRegex = /(?:^|\s)(<term>(.*?)<\/term>)/g;

export const inputMDRegex = /(?:^|\s)(\*(.*?)\*)$/;
export const inputRegex = /(?:^|\s)`t\s$/;

// /(?:^|\s)(`(?!\s+`)((?:[^`]+))`(?!\s+`))$/

const Definition = Node.create({
  name: "term",
  content: "text*",
  group: "inline",
  inline: true,

  parseHTML() {
    return [{ tag: "term" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes({ class: "term" }, HTMLAttributes), 0];
  },

  // The following works, but since we will have so many, we probably just want to use the toggleMark('term') command directly.
  // addCommands() {
  //   return {
  //     setTerm: () => ({ commands }) => {
  //       return commands.setMark(this.name)
  //     },
  //     toggleTerm: () => ({ commands }) => {
  //       return commands.toggleMark(this.name)
  //     },
  //     unsetTerm: () => ({ commands }) => {
  //       return commands.unsetMark(this.name)
  //     },
  //   }
  // },

  // addKeyboardShortcuts() {
  //   return {
  //     'Mod-d': () => this.editor.commands.toggleTerm()
  //   }
  // },

  addInputRules() {
    return [
      nodeInputRule({
        find: inputRegex,
        type: this.type,
      }),
      nodeInputRule({
        find: inputPTXRegex,
        type: this.type,
      }),
      nodeInputRule({
        find: inputMDRegex,
        type: this.type,
      }),
    ];
  },
  addPasteRules() {
    return [
      nodePasteRule({
        find: pastePTXRegex,
        type: this.type,
      }),
    ];
  },
});

export default Definition;
