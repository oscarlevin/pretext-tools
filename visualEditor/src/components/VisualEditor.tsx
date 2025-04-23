/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  useEditor,
  EditorContent,
  FloatingMenu,
  BubbleMenu,
} from "@tiptap/react";
import { Node } from "@tiptap/core";
import { History } from "@tiptap/extension-history";
import { Mathematics } from "@tiptap-pro/extension-mathematics";
import { FileHandler } from "@tiptap-pro/extension-file-handler";
import "katex/dist/katex.min.css";
import Focus from "@tiptap/extension-focus";
import Divisions from "../extensions/Divisions";
import Inline from "../extensions/Inline";
import Blocks from "../extensions/Blocks";
import Term from "../extensions/Term";
import Title from "../extensions/Title";
import Definition from "../extensions/Definition";
import KeyboardCommands from "../extensions/Keyboard";
import UnknownNode from "../extensions/UnknownNode";
//import UnknownMark from "../extensions/UnknownMark";
import "../styles.scss";
//import "../style_oscarlevin.css";
import json2ptx from "../extensions/json2ptx";
import { preprocessPtx } from "../utils";
//import { useState } from 'react';

//import { useDispatch } from "react-redux";
//import { setPtxSource } from "../ptxSourceSlice";
//import { useSelector } from "react-redux";

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
  KeyboardCommands,
  Document,
  Inline,
  Blocks,
  Divisions,
  Term,
  Title,
  Definition,
  //UnknownNode,
  //UnknownMark,
  Mathematics,
  Focus.configure({ mode: "deepest" }),
  History,
  FileHandler.configure({
    allowedMimeTypes: ["text/*"],
    onDrop: (currentEditor, files, pos) => {
      files.forEach((file) => {
        const fileReader = new FileReader();
        fileReader.readAsText(file);
        fileReader.onload = () => {
          const content = fileReader.result;
          console.log(content);
          currentEditor.chain().insertContentAt(pos, content).focus().run();
        };
      });
    },
    onPaste: (currentEditor, files, htmlContent) => {
      files.forEach((file) => {
        if (htmlContent) {
          console.log(htmlContent);
          return false;
        }
        const fileReader = new FileReader();
        fileReader.readAsDataURL(file);
        fileReader.onload = () => {
          currentEditor
            .chain()
            .insertContentAt(currentEditor.state.selection.anchor, {
              type: "image",
              attrs: { src: fileReader.result },
            })
            .focus()
            .run();
        };
      });
    },
  }),
];


// Add a debounce function to limit the rate at which the visual editor updates
function debounce(
  func: (...args: any[]) => void,
  wait: number,
  immediate?: boolean
): (...args: any[]) => void {
  let timeout: NodeJS.Timeout | null;
  return function (this: any, ...args: any[]) {
    const context = this;
    const later = function () {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

// @ts-ignore
const vscode = acquireVsCodeApi();

const VisualEditor = () => {
  //const dispatch = useDispatch();
  //const ptxSource = useSelector((state: any) => state.ptxSource.value);

  const editor = useEditor({
    extensions,
    content: "",
    enableContentCheck: true,
    onUpdate: ({ editor }) => {
      vscode.postMessage({
        type: 'update',
        value: json2ptx(editor.getJSON())
      })
      //console.log("HTML content: ", editor.getHTML());
      //console.log("JSON content: ", JSON.stringify(editor.getJSON(), null, 2));
      //console.log("PTX content: ", json2ptx(editor.getJSON()));
    }

  });


  editor?.on('contentError', ({ editor, error, disableCollaboration }) => {
    disableCollaboration();
    console.log("Content error: ", error);
    const emitUpdate = false;
    editor.setEditable(false, emitUpdate);
  });

  // Handle messages sent from the extension to the webview
  // We debounce these updates so that updates are only made after the user stops making changes for half a second.
  // TODO: don't debounce for initial load.
  window.addEventListener('message', debounce(
    (event) => {
      const message = event.data; // The data that the extension sent
      switch (message.type) {
        case 'update':
          //console.log("Received text ", message.text);
          //const text = preprocessPtx(message.text);
          //console.log("Processed text: ", text);
          const text = message.text;

          if (editor) { //add test to see if the contents has changed.
            editor.commands.setContent(text);
            console.log("HTML content: ", editor.getHTML());
            console.log("JSON content: ", JSON.stringify(editor.getJSON(), null, 2));
            console.log("PTX content: ", json2ptx(editor.getJSON()));
          }
          return;
      }
    }, 500)
  );
  // Update our webview's content
  //updateContent(text);

  // Then persist state information.
  // This state is returned in the call to `vscode.getState` below when a webview is reloaded.
  //vscode.setState({ text });


  // Set the content of the visual editor when the code editor changes
  //useEffect(() => {
  //  if (editor && ptxSourceEditor === "code") {
  //    editor.commands.setContent(ptxSource);
  //  }
  //}, [ptxSource, ptxSourceEditor, editor]);


  return (
    <>
      <EditorContent editor={editor} />
      <FloatingMenu editor={editor}>This is the floating menu</FloatingMenu>
      <BubbleMenu editor={editor}>This is the bubble menu</BubbleMenu>
    </>
  );
};

export default VisualEditor;
