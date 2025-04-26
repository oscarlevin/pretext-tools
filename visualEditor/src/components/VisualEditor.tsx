/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect } from 'react';
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
import { preprocessPtx } from "../utils";
import json2ptx from "../extensions/json2ptx";
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

const VisualEditor: React.FC = () => {
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
    const handleMessage = (event: MessageEvent) => {
      console.log("Received message from extension");
      const message = event.data; // The data that the extension sent
      switch (message.type) {
        case 'update':
          const text = message.text;

          if (editor) { // TODO: Add test to see if the contents have changed.
            editor.commands.setContent(text);
            console.log("HTML content: ", editor.getHTML());
            console.log("JSON content: ", JSON.stringify(editor.getJSON(), null, 2));
            console.log("PTX content: ", json2ptx(editor.getJSON()));
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
      <EditorContent editor={editor} />
      <FloatingMenu editor={editor}>This is the floating menu</FloatingMenu>
      <BubbleMenu editor={editor}>This is the bubble menu</BubbleMenu>
    </>
  );
};

export default VisualEditor;
