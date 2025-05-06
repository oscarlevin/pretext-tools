import { Focus, Gapcursor, UndoRedo } from "@tiptap/extensions";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from 'react';
import { useEditor, EditorContent } from "@tiptap/react";
import { FloatingMenu, BubbleMenu } from "@tiptap/react/menus";
import { Node, generateJSON } from "@tiptap/core";
//import { Mathematics } from "@tiptap-pro/extension-mathematics";
//import { FileHandler } from "@tiptap-pro/extension-file-handler";
import { MathEquation, MathInline } from "../extensions/Math";
import "katex/dist/katex.min.css";
import Divisions from "../extensions/Divisions";
import Inline from "../extensions/Inline";
import Blocks from "../extensions/Blocks";
import CodeBlock from "@tiptap/extension-code-block";
import Term from "../extensions/Term";
import Title from "../extensions/Title";
import Definition from "../extensions/Definition";
//import KeyboardCommands from "../extensions/Keyboard";
import RawPtx from "../extensions/RawPtx";
import "../styles.scss";
import { cleanPtx, ptxToJson } from "../utils";
import { json2ptx } from "../json2ptx";
import { useState } from 'react';
import Emphasis from '../extensions/Emph';


const Document = Node.create({
  name: "ptxFragment",
  topNode: true,
  content: "title? introduction? chapter* section* subsection*",
});

export function toggleMenu() {
  const x = document.getElementById("menuid");
  if (x) {
    x.style.display = x.style.display === "none" ? "block" : "none";
  }
  console.log("can you see the menu?");
  return true;
}

const extensions = [
  CodeBlock.configure({
    defaultLanguage: "xml",
  }),
  //KeyboardCommands,
  Document,
  Inline,
  Blocks,
  Divisions,
  Term,
  Title,
  Emphasis,
  Definition,
  RawPtx,
  //UnknownMark,
  MathInline,
  MathEquation,
  Focus.configure({ mode: "deepest" }),
  UndoRedo,
  //onPaste: (currentEditor, files, htmlContent) => {
  //  files.forEach((file) => {
  //    if (htmlContent) {
  //      console.log(htmlContent);
  //      return false;
  //    }
  //    const fileReader = new FileReader();
  //    fileReader.readAsDataURL(file);
  //    fileReader.onload = () => {
  //      currentEditor
  //        .chain()
  //        .insertContentAt(currentEditor.state.selection.anchor, {
  //          type: "image",
  //          attrs: { src: fileReader.result },
  //        })
  //        .focus()
  //        .run();
  //    };
  //  });
  //},
];

const WarningMessage: React.FC<{ isValid: boolean }> = ({ isValid }) => {
  if (!isValid) {
    return (
      <div className="warning-message">
        <p>
          Warning: PreTeXt source contains a schema error. You will not be able to edit the content on this panel until that is fixed.
        </p>
      </div>
    );
  } else {
    return null;
  }
};

// @ts-ignore
const vscode = acquireVsCodeApi();


const VisualEditor: React.FC = () => {

  const [isValid, setIsValid] = useState(true);

  const editor = useEditor({
    extensions,
    content: "",
    onContentError(props) {
      console.log("Content error: ", props.error);
      props.disableCollaboration();
      props.editor.setEditable(false, false);
    },
    enableContentCheck: true,
    onUpdate: ({ editor }) => {
      vscode.postMessage({
        type: 'update',
        value: json2ptx(editor.getJSON())
      })
    }
  });

  useEffect(() => {
    // Notify VS Code that the web panel is ready
    vscode.postMessage({ type: 'ready' });

    const handleMessage = (event: MessageEvent) => {
      console.log("Received message from extension");
      const message = event.data; // The data that the extension sent
      switch (message.type) {
        case 'update':
          const text = message.text;

          if (editor) { // TODO: Add test to see if the contents have changed.
            try {
              editor.commands.setContent(cleanPtx(text), { emitUpdate: false });
              console.log("JSON content: ", JSON.stringify(editor.getJSON(), null, 2));
              console.log("HTML content: ", editor.getHTML());
              console.log("PTX content: ", json2ptx(editor.getJSON()));
              if (!editor.isEditable) {
                editor.setEditable(true, false);
              }
              setIsValid(true);
            } catch (error) {
              console.error("Error setting content: ", error);
              setIsValid(false);
              if (editor.isEditable) {
                editor.setEditable(false, false);
              }
            }
          }
          return;
      }
    };

    // Add the event listener
    window.addEventListener('message', handleMessage);

    // Cleanup the event listener on unmount
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []); // Empty dependency array ensures this runs only once



  return (
    <>
      <WarningMessage isValid={isValid} />
      <EditorContent editor={editor} />
      <FloatingMenu editor={editor} shouldShow={null}>This is the floating menu</FloatingMenu>
      <BubbleMenu editor={editor} shouldShow={null}>This is the bubble menu</BubbleMenu>
    </>
  );
};

export default VisualEditor;
