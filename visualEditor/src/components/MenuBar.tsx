import { Editor, useCurrentEditor, useEditorState } from "@tiptap/react";
//import { defaultContent } from "../defaultContent";

export const MenuBar = ({ editor }: { editor: Editor }) => {
  //const { editor } = useCurrentEditor();

  if (!editor) {
    return null;
  }
  // Read the current editor's state, and re-render the component when it changes
  const editorState = useEditorState({
    editor,
    selector: ctx => {
      return {
        //isBold: ctx.editor.isActive('bold'),
        //canBold: ctx.editor.can().chain().focus().toggleBold().run(),
        //isItalic: ctx.editor.isActive('italic'),
        //canItalic: ctx.editor.can().chain().focus().toggleItalic().run(),
        //isStrike: ctx.editor.isActive('strike'),
        //canStrike: ctx.editor.can().chain().focus().toggleStrike().run(),
        //isCode: ctx.editor.isActive('code'),
        //canCode: ctx.editor.can().chain().focus().toggleCode().run(),
        //canClearMarks: ctx.editor.can().chain().focus().unsetAllMarks().run(),
        //isParagraph: ctx.editor.isActive('paragraph'),
        //isHeading1: ctx.editor.isActive('heading', { level: 1 }),
        //isHeading2: ctx.editor.isActive('heading', { level: 2 }),
        //isHeading3: ctx.editor.isActive('heading', { level: 3 }),
        //isHeading4: ctx.editor.isActive('heading', { level: 4 }),
        //isHeading5: ctx.editor.isActive('heading', { level: 5 }),
        //isHeading6: ctx.editor.isActive('heading', { level: 6 }),
        //isBulletList: ctx.editor.isActive('bulletList'),
        //isOrderedList: ctx.editor.isActive('orderedList'),
        //isCodeBlock: ctx.editor.isActive('codeBlock'),
        //isBlockquote: ctx.editor.isActive('blockquote'),
        canUndo: ctx.editor.can().chain().focus().undo().run(),
        canRedo: ctx.editor.can().chain().focus().redo().run(),
      }
    },
  })

  return (
    <div className="control-group">
      <div className="button-group">
        <button
          onClick={() => editor.chain().focus().selectParentNode().setNode('term').run()}
          //disabled={!editor.can().chain().focus().toggleWrap("term").run()}
          className={editor.isActive("term") ? "is-active" : ""}
        >
          Term
        </button>
        {/*<button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editorState.canBold}
          className={editorState.isBold ? 'is-active' : ''}
        >
          Bold
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editorState.canItalic}
          className={editorState.isItalic ? 'is-active' : ''}
        >
          Italic
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editorState.canStrike}
          className={editorState.isStrike ? 'is-active' : ''}
        >
          Strike
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCode().run()}
          disabled={!editorState.canCode}
          className={editorState.isCode ? 'is-active' : ''}
        >
          Code
        </button>
        <button onClick={() => editor.chain().focus().unsetAllMarks().run()}>Clear marks</button>
        <button onClick={() => editor.chain().focus().clearNodes().run()}>Clear nodes</button>
        <button
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={editorState.isParagraph ? 'is-active' : ''}
        >
          Paragraph
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editorState.isHeading1 ? 'is-active' : ''}
        >
          H1
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editorState.isHeading2 ? 'is-active' : ''}
        >
          H2
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editorState.isHeading3 ? 'is-active' : ''}
        >
          H3
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
          className={editorState.isHeading4 ? 'is-active' : ''}
        >
          H4
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}
          className={editorState.isHeading5 ? 'is-active' : ''}
        >
          H5
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()}
          className={editorState.isHeading6 ? 'is-active' : ''}
        >
          H6
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editorState.isBulletList ? 'is-active' : ''}
        >
          Bullet list
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editorState.isOrderedList ? 'is-active' : ''}
        >
          Ordered list
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={editorState.isCodeBlock ? 'is-active' : ''}
        >
          Code block
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editorState.isBlockquote ? 'is-active' : ''}
        >
          Blockquote
        </button>
        <button onClick={() => editor.chain().focus().setHorizontalRule().run()}>Horizontal rule</button>
        <button onClick={() => editor.chain().focus().setHardBreak().run()}>Hard break</button>*/}
        <button onClick={() => editor.chain().focus().undo().run()} disabled={!editorState.canUndo}>
          Undo
        </button>
        <button onClick={() => editor.chain().focus().redo().run()} disabled={!editorState.canRedo}>
          Redo
        </button>
      </div>
    </div>
  )

  //return (
  //  <>
  //    <button
  //      onClick={() =>
  //        editor
  //          .chain()
  //          .focus()
  //          .insertContent(
  //            `<definition><title>Definition</title><p></p></definition>`
  //          )
  //          .run()
  //      }
  //    >
  //      Testing
  //    </button>
  //    {/* <button
  //            onClick={() => editor.chain().focus().wrapIn('chapter').run()}
  //            disabled={!editor.can().chain().focus().wrapIn('chapter').run()}
  //            className={editor.isActive('chapter') ? 'is-active' : ''}
  //            >
  //          Chapter
  //          </button> */}

  //    <button
  //      onClick={() => editor.chain().focus().toggleMark("term").run()}
  //      disabled={!editor.can().chain().focus().toggleMark("term").run()}
  //      className={editor.isActive("term") ? "is-active" : ""}
  //    >
  //      term
  //    </button>

  //    {/* <button
  //            onClick={() => editor.chain().focus().toggleItalic().run()}
  //            disabled={
  //              !editor.can()
  //                .chain()
  //                .focus()
  //                .toggleItalic()
  //                .run()
  //            }
  //            className={editor.isActive('italic') ? 'is-active' : ''}
  //          >
  //            emphasis
  //          </button> */}
  //    {/* <button
  //            onClick={() => editor.chain().focus().toggleStrike().run()}
  //            disabled={
  //              !editor.can()
  //                .chain()
  //                .focus()
  //                .toggleStrike()
  //                .run()
  //            }
  //            className={editor.isActive('strike') ? 'is-active' : ''}
  //          >
  //            strike
  //          </button> */}
  //    {/* <button
  //            onClick={() => editor.chain().focus().toggleCode().run()}
  //            disabled={
  //              !editor.can()
  //                .chain()
  //                .focus()
  //                .toggleCode()
  //                .run()
  //            }
  //            className={editor.isActive('code') ? 'is-active' : ''}
  //          >
  //            code
  //          </button> */}
  //    <button onClick={() => editor.chain().focus().unsetAllMarks().run()}>
  //      clear marks
  //    </button>
  //    <button onClick={() => editor.chain().focus().clearNodes().run()}>
  //      clear nodes
  //    </button>
  //    {/* <button
  //            onClick={() => editor.chain().focus().setParagraph().run()}
  //            className={editor.isActive('para') ? 'is-active' : ''}
  //          >
  //            paragraph
  //          </button> */}
  //    {/*<button
  //      onClick={() => editor.chain().focus().toggleTitle().run()}
  //      disabled={!editor.can().chain().focus().toggleTitle().run()}
  //    >
  //      Title
  //    </button>*/}

  //    {/* <button
  //            onClick={() => editor.chain().focus().toggleBulletList().run()}
  //            className={editor.isActive('bulletList') ? 'is-active' : ''}
  //          >
  //            bullet list
  //          </button>
  //          <button
  //            onClick={() => editor.chain().focus().toggleOrderedList().run()}
  //            className={editor.isActive('orderedList') ? 'is-active' : ''}
  //          >
  //            ordered list
  //          </button> */}
  //    {/* <button
  //            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
  //            className={editor.isActive('codeBlock') ? 'is-active' : ''}
  //          >
  //            code block
  //          </button> */}
  //    {/*<button
  //      onClick={() => editor.chain().focus().toggleDefinition().run()}
  //      className={editor.isActive('definition') ? 'is-active' : ''}
  //    >
  //      Definition
  //    </button>*/}
  //    {/* <button onClick={() => editor.chain().focus().setHorizontalRule().run()}>
  //            horizontal rule
  //          </button>
  //          <button onClick={() => editor.chain().focus().setHardBreak().run()}>
  //            hard break
  //          </button> */}
  //    <button
  //      onClick={() => editor.chain().focus().undo().run()}
  //      disabled={!editor.can().chain().focus().undo().run()}
  //    >
  //      undo
  //    </button>
  //    <button
  //      onClick={() => editor.chain().focus().redo().run()}
  //      disabled={!editor.can().chain().focus().redo().run()}
  //    >
  //      redo
  //    </button>
  //    <button
  //      onClick={() => editor.chain().focus().setContent(defaultContent).run()}
  //    >
  //      reset
  //    </button>
  //    <button onClick={() => editor.chain().focus().setContent("").run()}>
  //      Clear Editor
  //    </button>
  //    {/* <button
  //            onClick={() => editor.chain().focus().setColor('#958DF1').run()}
  //            className={editor.isActive('textStyle', { color: '#958DF1' }) ? 'is-active' : ''}
  //          >
  //            purple
  //          </button> */}
  //  </>
  //);
};
