/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from 'react';
import {
  useEditor,
  EditorContent,
  FloatingMenu,
  BubbleMenu,
} from "@tiptap/react";
import { Node, generateJSON } from "@tiptap/core";
import { History } from "@tiptap/extension-history";
import { Mathematics } from "@tiptap-pro/extension-mathematics";
import { FileHandler } from "@tiptap-pro/extension-file-handler";
import "katex/dist/katex.min.css";
import Focus from "@tiptap/extension-focus";
import Divisions from "../extensions/Divisions";
import Inline from "../extensions/Inline";
import Blocks from "../extensions/Blocks";
import CodeBlock from "@tiptap/extension-code-block";
import Term from "../extensions/Term";
import Title from "../extensions/Title";
import Definition from "../extensions/Definition";
import KeyboardCommands from "../extensions/Keyboard";
import RawPtx from "../extensions/RawPtx";
//import UnknownMark from "../extensions/UnknownMark";
import "../styles.scss";
//import "../style_oscarlevin.css";
import { preprocessPtx, ptxToJson } from "../utils";
import { json2ptx } from "../json2ptx";
import { useState } from 'react';

//import { useDispatch } from "react-redux";
//import { setPtxSource } from "../ptxSourceSlice";
//import { useSelector } from "react-redux";

import { diff, ParsedModel } from "@emmetio/xml-diff";


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
  KeyboardCommands,
  Document,
  Inline,
  Blocks,
  Divisions,
  Term,
  Title,
  Definition,
  RawPtx,
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
  }),
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
    const handleMessage = (event: MessageEvent) => {
      console.log("Received message from extension");
      const message = event.data; // The data that the extension sent
      switch (message.type) {
        case 'update':
          const text = message.text;

          if (editor) { // TODO: Add test to see if the contents have changed.
            try {
              console.log("preprocessPtx: ", preprocessPtx(text));
              console.log("xast content: ", ptxToJson(text));
              const json = generateJSON(text, extensions);
              console.log("generated JSON content: ", JSON.stringify(json, null, 2));
              editor.commands.setContent(ptxToJson(text));
              //console.log("JSON content: ", JSON.stringify(editor.getJSON(), null, 2));
              //console.log("HTML content: ", editor.getHTML());
              //console.log("PTX content: ", json2ptx(editor.getJSON()));
              //console.log("Comparing text and PTX....");

              console.log("**********************************");
              //console.log("text content: ", cleanText(text));
              //console.log("PTX content: ", cleanText(json2ptx(editor.getJSON())));
              //console.log("Same? ", cleanText(text) === cleanText(json2ptx(editor.getJSON())));
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
      <FloatingMenu editor={editor}>This is the floating menu</FloatingMenu>
      <BubbleMenu editor={editor}>This is the bubble menu</BubbleMenu>
    </>
  );
};

export default VisualEditor;
