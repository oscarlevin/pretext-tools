import { useCurrentEditor } from "@tiptap/react";
//import React from 'react';
import { defaultContent } from "../defaultContent";

export const MenuBar = () => {
  const { editor } = useCurrentEditor();

  if (!editor) {
    return null;
  }

  return (
    <>
      <button
        onClick={() =>
          editor
            .chain()
            .focus()
            .insertContent(
              `<definition><title>Definition</title><p></p></definition>`
            )
            .run()
        }
      >
        Testing
      </button>
      {/* <button
              onClick={() => editor.chain().focus().wrapIn('chapter').run()}
              disabled={!editor.can().chain().focus().wrapIn('chapter').run()}
              className={editor.isActive('chapter') ? 'is-active' : ''}
              >
            Chapter
            </button> */}

      <button
        onClick={() => editor.chain().focus().toggleMark("term").run()}
        disabled={!editor.can().chain().focus().toggleMark("term").run()}
        className={editor.isActive("term") ? "is-active" : ""}
      >
        term
      </button>

      {/* <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              disabled={
                !editor.can()
                  .chain()
                  .focus()
                  .toggleItalic()
                  .run()
              }
              className={editor.isActive('italic') ? 'is-active' : ''}
            >
              emphasis
            </button> */}
      {/* <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              disabled={
                !editor.can()
                  .chain()
                  .focus()
                  .toggleStrike()
                  .run()
              }
              className={editor.isActive('strike') ? 'is-active' : ''}
            >
              strike
            </button> */}
      {/* <button
              onClick={() => editor.chain().focus().toggleCode().run()}
              disabled={
                !editor.can()
                  .chain()
                  .focus()
                  .toggleCode()
                  .run()
              }
              className={editor.isActive('code') ? 'is-active' : ''}
            >
              code
            </button> */}
      <button onClick={() => editor.chain().focus().unsetAllMarks().run()}>
        clear marks
      </button>
      <button onClick={() => editor.chain().focus().clearNodes().run()}>
        clear nodes
      </button>
      {/* <button
              onClick={() => editor.chain().focus().setParagraph().run()}
              className={editor.isActive('para') ? 'is-active' : ''}
            >
              paragraph
            </button> */}
      {/*<button
        onClick={() => editor.chain().focus().toggleTitle().run()}
        disabled={!editor.can().chain().focus().toggleTitle().run()}
      >
        Title
      </button>*/}

      {/* <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={editor.isActive('bulletList') ? 'is-active' : ''}
            >
              bullet list
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={editor.isActive('orderedList') ? 'is-active' : ''}
            >
              ordered list
            </button> */}
      {/* <button
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={editor.isActive('codeBlock') ? 'is-active' : ''}
            >
              code block
            </button> */}
      {/*<button
        onClick={() => editor.chain().focus().toggleDefinition().run()}
        className={editor.isActive('definition') ? 'is-active' : ''}
      >
        Definition
      </button>*/}
      {/* <button onClick={() => editor.chain().focus().setHorizontalRule().run()}>
              horizontal rule
            </button>
            <button onClick={() => editor.chain().focus().setHardBreak().run()}>
              hard break
            </button> */}
      <button
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
      >
        undo
      </button>
      <button
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
      >
        redo
      </button>
      <button
        onClick={() => editor.chain().focus().setContent(defaultContent).run()}
      >
        reset
      </button>
      <button onClick={() => editor.chain().focus().setContent("").run()}>
        Clear Editor
      </button>
      {/* <button
              onClick={() => editor.chain().focus().setColor('#958DF1').run()}
              className={editor.isActive('textStyle', { color: '#958DF1' }) ? 'is-active' : ''}
            >
              purple
            </button> */}
    </>
  );
};
