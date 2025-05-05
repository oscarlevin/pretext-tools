import {
Node, mergeAttributes,
} from "@tiptap/core";
import katex, { KatexOptions } from "katex";


const MathInline = Node.create({
  name: "m",
  content: "text*",
  inline: true,
  group: "inline math",
  marks: "",

  //addAttributes() {
  //  return {
  //    latex: {
  //      default: "",
  //      parseHTML: (element) => element.getHTML().trim(),
  //    },
  //  }
  //},

  parseHTML() {
    return [{ tag: "m" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const latex = node.textContent.trim();
    return ["span", mergeAttributes({ class: "inlineMath"}, HTMLAttributes), latex];
  },


  addNodeView() {
    return({ node, HTMLAttributes, editor })=>{
      const dom = document.createElement("span");
      dom.classList.add("node-view");
      Object.entries(HTMLAttributes).forEach(([key, value]) => {
        dom.setAttribute(key, value);
      });

      const rendered = document.createElement("span");
      const editable = document.createElement("span");
      const latex = node.textContent.trim();

      console.log("latex:", latex)

      rendered.innerHTML = katex.renderToString(latex, {throwOnError: false});
      rendered.contentEditable = "true";

      editable.classList.add("edit-math");
      editable.classList.add("is-editable");

      dom.append(rendered, editable);

      dom.onchange = () => {
        console.log("onchange!")
      }

      dom.oninput = () => {
        console.log("oninput!")
      }

      dom.addEventListener("blur", () => {
        console.log("Leaving math.")
      })

      window.addEventListener("message", () => {
        console.log("In Math!");
        const newLatex = editable.innerText;
        console.log("newLatex:", newLatex);
        rendered.innerHTML = katex.renderToString(newLatex, {throwOnError: false});
      });
        //editor.commands.setTextSelection({ from: 0, to: 0 });
        //editor.commands.setTextSelection({ from: 0, to: 0 });

      //dom.addEventListener("click", () => {
      //  if (editor.isEditable) {
      //    //const pos = getPos();
      //    //const nodeSize = node.nodeSize;
      //    console.log("In Math!");
      //    // update innerHTML to be the value of otherLatex
      //    dom.innerHTML = latex;
      //    //editor.commands.setTextSelection({ from: pos, to: pos + nodeSize });
      //  }
      //});
      //dom.addEventListener("focusout", () => {
      //  console.log("Leaving math.")
      //  dom.innerHTML = katex.renderToString(latex, this.options.katexOptions);
      //})

      //dom.contentEditable = "true";


      //const showSpan = document.createElement("span");
      //const editSpan = document.createElement("span");
      //showSpan.className = "process-math";
      //showSpan.setAttribute("contenteditable", "true");
      //showSpan.innerHTML = "\\("+node.textContent+" \\).";
      //editSpan.className = "edit-math";
      //editSpan.innerHTML = node.textContent;
      //console.log("math node:", showSpan);
      return {
        dom,
        contentDOM: editable,
      };
    };
  },
});

export { MathInline };
