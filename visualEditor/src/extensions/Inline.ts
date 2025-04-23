import { Extension } from "@tiptap/core";
import { Text } from "@tiptap/extension-text";
import { HardBreak } from "@tiptap/extension-hard-break";

const MyText = Text.extend({});

const MyHardBreak = HardBreak.extend({});

const Inline = Extension.create({
  name: "inline",

  addExtensions() {
    return [MyText, MyHardBreak];
  },
});

export default Inline;
