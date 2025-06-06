/* eslint-disable @typescript-eslint/no-explicit-any */
import { Focus, Gapcursor, UndoRedo } from "@tiptap/extensions";
import { useEffect } from 'react';
import { useEditor, EditorContent } from "@tiptap/react";
import { Editor, Node } from "@tiptap/core";
import { MathEquation, MathInline } from "../extensions/Math";
import "katex/dist/katex.min.css";
import Divisions from "../extensions/Divisions";
import Inline from "../extensions/Inline";
import Blocks from "../extensions/Blocks";
import CodeBlock from "@tiptap/extension-code-block";
import Title from "../extensions/Title";
import Definition from "../extensions/Definition";
import RawPtx from "../extensions/RawPtx";
import "../styles.scss";
import { cleanPtx } from "../utils";
import { json2ptx } from "../json2ptx";
import { useState } from 'react';
import { MenuBar } from "./MenuBar";
import { PtxBubbleMenu } from "./BubbleMenu";
//import { PtxFloatingMenu } from "./FloatingMenu";
import { getCursorPos } from "../extensions/getCursorPos";
import KeyboardCommands from "../extensions/Keyboard";


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
  Title,
  Definition,
  RawPtx,
  MathInline,
  MathEquation,
  Focus.configure({ mode: "deepest" }),
  UndoRedo,
  Gapcursor,
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


const InfoMessage = ({ editor }: { editor: Editor }) => {
  const [cursorInfo, setCursorInfo] = useState({
    pos: 0,
    parentType: "",
    depth: 0,
    prevNodeIsText: false,
    nextNodeIsText: false,
    prevNodeSize: 0,
    nextNodeSize: 0,
    inTextNode: false,
    location: "",
    parentTypeAlt: "",
  });

  useEffect(() => {
    if (!editor) return;

    const updateCursorInfo = () => {
      const cursor = getCursorPos(editor);
      const altCursor = editor.state.selection.$anchor;
      const location = `Line: ${altCursor.start()} Column: ${altCursor.parentOffset}`;
      setCursorInfo({
        pos: cursor.pos(),
        parentType: cursor.parentType(),
        depth: cursor.depth(),
        prevNodeIsText: cursor.prevNodeIsText(),
        nextNodeIsText: cursor.nextNodeIsText(),
        prevNodeSize: cursor.prevNodeSize(),
        nextNodeSize: cursor.nextNodeSize(),
        inTextNode: cursor.inTextNode(),
        location,
        parentTypeAlt: altCursor.parent.type.name,
      });
    };

    updateCursorInfo();

    editor.on("selectionUpdate", updateCursorInfo);

    return () => {
      editor.off("selectionUpdate", updateCursorInfo);
    };
  }, [editor]);



  return (
    <div className="info">
      <p>Debugging Info:</p>
      <ul>
        <li>Position: {cursorInfo.pos}</li>
        <li>Parent Type: {cursorInfo.parentType}</li>
        <li>Depth: {cursorInfo.depth}</li>
        <li>Node before is text? {cursorInfo.prevNodeIsText ? "Yes" : "No"}</li>
        <li>Node after is text? {cursorInfo.nextNodeIsText ? "Yes" : "No"}</li>
        <li>Previous node size: {cursorInfo.prevNodeSize}</li>
        <li>Next node size: {cursorInfo.nextNodeSize}</li>
        <li>In text node? {cursorInfo.inTextNode ? "Yes" : "No"}</li>
        <li>Location: {cursorInfo.location}</li>
        <li>Parent type: {cursorInfo.parentTypeAlt}</li>
      </ul>
    </div>
  );
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
      console.log("VisualEditor: onUpdate");
      console.log(JSON.stringify(editor.getJSON(), null, 2));
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
        case 'load':
          const initialText = message.text;
          if (editor) {
            try {
              editor.commands.setContent(cleanPtx(initialText), { emitUpdate: false });
              setIsValid(true);
            } catch (error) {
              console.error("Error setting content: ", error);
              setIsValid(false);
            }
            // Always set editor to non-editable mode when first loading content
            if (editor.isEditable) {
              editor.setEditable(false, false);
            }
          }
      }
    };

    // Add the event listener
    window.addEventListener('message', handleMessage);

    // Cleanup the event listener on unmount
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []); // Empty dependency array ensures this runs only once

  const [isEditable, setIsEditable] = useState(false);

  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditable, false);
    }
  }
    , [editor, isEditable]);

  return (
    <>
      <div className="control-group">
        <p>Warning: The PreTeXt Visual Editor is still experimental.  Do not edit files you don't have backups for; editing with the visual editor may modify your original PreTeXt file in unexpected ways.
          <br />
          <label>
            <input type="checkbox" checked={isEditable} onChange={() => setIsEditable(!isEditable)} />
            Enable editing
          </label>
        </p>
      </div>
      <WarningMessage isValid={isValid} />
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
      <PtxBubbleMenu editor={editor} />
      {/*<InfoMessage editor={editor} />*/}
    </>
  );
};

export default VisualEditor;
