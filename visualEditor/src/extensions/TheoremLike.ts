import { Extension, Node, mergeAttributes, wrappingInputRule } from "@tiptap/core";
import { ReactNodeViewRenderer, } from "@tiptap/react";
import { TheoremLikeComponent, ProofComponent } from "../components/TheoremLike";


const TheoremLikeElements = [
  "theorem",
  "lemma",
  "corollary",
  "proposition",
  "claim",
  "fact",
];

const TheoremLike = Extension.create({
  name: "theoremLike",

  addExtensions() {
    const array = [];
    for (const element of TheoremLikeElements) {
      array.push(
        Node.create({
          name: element,
          content: "title? statement proof*",
          group: "block theoremLike",
          selectable: true,
          draggable: true,
          defining: false,
          parseHTML() {
            return [
              {
                tag: element,
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
              },
              component: {
                parseHTML: (element) => element.getAttribute("component"),
              }
            }
          },

          renderHTML({ HTMLAttributes }) {
            return [
              "article",
              mergeAttributes(
                { class: `${element} theorem-like`, ptxtag: element },
                HTMLAttributes // Include all attributes from the node
              ),
            ];
          },
          addNodeView() {
            return ReactNodeViewRenderer(TheoremLikeComponent)
          },
          addInputRules() {
            return [
              wrappingInputRule({
                find: new RegExp(`^#${element}\\s$`, "i"),
                type: this.type,
              }),
              wrappingInputRule({
                find: new RegExp(`(?:^)(<${element}>(\\s))$`, "i"),
                type: this.type,
              }),
              wrappingInputRule({
                find: new RegExp(`(?:^)(${element}:(\\s))$`, "i"),
                type: this.type,
              }),
            ];
          },

        }
        )
      );
    }

    // Add proof node
    array.push(
      Node.create({
        name: "proof",
        content: "title? p+",
        group: "block",
        selectable: true,
        draggable: true,
        parseHTML() {
          return [{ tag: "proof" }];
        },
        renderHTML({ HTMLAttributes }) {
          return [
            "article",
            mergeAttributes(
              { class: "proof", ptxtag: "proof" },
              HTMLAttributes // Include all attributes from the node
            ),
            0,
          ];
        },
        addNodeView() {
          return ReactNodeViewRenderer(ProofComponent)
        },
        addInputRules() {
          return [
            wrappingInputRule({
              find: new RegExp(`^#proof\\s$`, "i"),
              type: this.type,
            }),
            wrappingInputRule({
              find: new RegExp(`(?:^)(<proof>(\\s))$`, "i"),
              type: this.type,
            }),
            wrappingInputRule({
              find: new RegExp(`(?:^)(proof:(\\s))$`, "i"),
              type: this.type,
            }),
          ];
        },
      })
    )

    return array; // Ensure an array is always returned
  },

});


export default TheoremLike;


// return ['h4', {class: "heading"}, ['span', {class: "type"}, "Definition"], ['span', {class: "space"}, " " ], ['span', {class: "codenumber"}, "xx.yy"], ['span', {class: "period"}, "."], ['span', {class: "space"}, " "], ['span', {class: "title"}, 0]]