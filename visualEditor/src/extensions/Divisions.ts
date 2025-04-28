import {
  Extension,
  Node,
  mergeAttributes,
  wrappingInputRule,
} from "@tiptap/core";

const Introduction = Node.create({
  name: "introduction",

  content: "block+ rawptx*",

  group: "division introduction",

  selectable: true,
  draggable: true,

  defining: false,

  parseHTML() {
    return [
      {
        tag: "introduction",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "article",
      mergeAttributes(
        { class: "introduction", label: "introduction" },
        HTMLAttributes
      ),
      0,
    ];
  },

  addInputRules() {
    return [
      wrappingInputRule({
        find: new RegExp(`^#intro\\s$`),
        type: this.type,
      }),
    ];
  },
});

const Chapter = Node.create({
  name: "chapter",

  content: "title ((introduction?|section+)|block+)",

  group: "division",

  selectable: true,

  draggable: true,

  defining: false,

  parseHTML() {
    return [
      {
        tag: "chapter",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "section",
      mergeAttributes({ class: "chapter", ptxtag: "chapter" }, HTMLAttributes),
      0,
    ];
  },

  addInputRules() {
    return [
      wrappingInputRule({
        find: new RegExp(`^#ch\\s$`),
        type: this.type,
      }),
    ];
  },
});
const Section = Node.create({
  name: "section",
  content: "title ((introduction?|subsection+)|block+)",
  group: "division",
  selectable: true,
  draggable: true,
  defining: false,
  parseHTML() {
    return [
      {
        tag: "section",
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "section",
      mergeAttributes({ class: "section", ptxtag: "section" }, HTMLAttributes),
      0,
    ];
  },
  addInputRules() {
    return [
      wrappingInputRule({
        find: new RegExp(`^#sec\\s$`),
        type: this.type,
      }),
    ];
  },
});

const Subsection = Node.create({
  name: "subsection",
  content: "title? (block|rawptx)*",
  group: "division",
  selectable: false,
  draggable: true,
  defining: false,
  parseHTML() {
    return [
      {
        tag: "subsection",
      },
    ];
  },
  addAttributes() {
    return {
      label: {
        parseHTML: (element) => element.getAttribute("label"),
      },
      "xml:id": {
        parseHTML: (element) => element.getAttribute("xml:id"),
      }
    }
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "section",
      mergeAttributes(
        { class: "subsection", ptxtag: "subsection" },
        HTMLAttributes
      ),
      0,
    ];
  },

  addInputRules() {
    return [
      wrappingInputRule({
        find: new RegExp(`^#subsec\\s$`),
        type: this.type,
      }),
    ];
  },
});

const Divisions = Extension.create({
  name: "divisions",

  addExtensions() {
    return [Introduction, Chapter, Section, Subsection];
  },
});

export default Divisions;
