/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Extension,
  Node,
  mergeAttributes,
  wrappingInputRule,
} from "@tiptap/core";

const AxiomLikeElements = [
  "assumption",
  "axiom",
  "conjecture",
  "heuristic",
  "hypothesis",
  "principle",
];

const AxiomLike = Extension.create({
  name: "axiomLike",

  addExtensions() {
    const array = [];
    for (const element of AxiomLikeElements) {
      array.push(
        Node.create({
          name: element,
          content: "title? para+",
          group: "block axiomLike",
          selectable: true,
          draggable: true,
          parseHTML() {
            return [
              {
                tag: element,
              },
            ];
          },
          renderHTML({ HTMLAttributes }) {
            return [
              "article",
              mergeAttributes(
                { class: `${element} axiom-like`, label: element },
                HTMLAttributes
              ),
              0,
            ];
          },
          addCommands() {
            return {
              [`set${element.charAt(0).toUpperCase() + element.slice(1)}`]:
                (attributes: Record<string, any>) =>
                ({
                  commands,
                }: {
                  commands: {
                    setWrap: (
                      name: string,
                      attributes: Record<string, any>
                    ) => boolean;
                  };
                }) => {
                  return commands.setWrap(this.name, attributes);
                },
              // [`toggle${element.charAt(0).toUpperCase() + element.slice(1)}`]: (attributes: Record<string, any>) =>
              //   ({ commands }: { commands: { toggleWrap: (name: string, attributes: Record<string, any>) => boolean } }) => {
              //     return commands.toggleWrap(this.name, attributes)
              //   },
            };
          },
          addInputRules() {
            return [
              wrappingInputRule({
                find: new RegExp(
                  `^!${element.charAt(0).toUpperCase() + element.slice(1)}\\s$`
                ),
                type: this.type,
              }),
            ];
          },
        })
      );
    }

    return array;
  },
});

export default AxiomLike;
