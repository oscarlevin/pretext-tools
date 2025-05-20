import { Editor, useEditorState } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import React, { useEffect } from "react";
//import { defaultContent } from "../defaultContent";

export const PtxBubbleMenu = ({ editor }: { editor: Editor }) => {
    //const { editor } = useCurrentEditor();


    const [showMenu] = React.useState(true)
    const [isEditable] = React.useState(true)

    // Read the current editor's state, and re-render the component when it changes
    const editorState = useEditorState({
        editor,
        selector: ctx => {
            return {
                isTerm: ctx.editor.isActive('term'),
                canTerm: ctx.editor.can().chain().focus().toggleMark('term').run(),
                isEm: ctx.editor.isActive('em'),
                canEm: ctx.editor.can().chain().focus().toggleMark('em').run(),
                isAlert: ctx.editor.isActive('alert'),
                canAlert: ctx.editor.can().chain().focus().toggleMark('alert').run(),
                isCode: ctx.editor.isActive('code'),
                canCode: ctx.editor.can().chain().focus().toggleMark('c').run(),
                isQuote: ctx.editor.isActive('q'),
                canQuote: ctx.editor.can().chain().focus().toggleMark('q').run(),
            }
        },
    })

    useEffect(() => {
        if (editor) {
            editor.setEditable(isEditable)
        }
    }, [isEditable, editor])

    if (!editor) {
        return null;
    }

    return (
        <>
            {editor && showMenu && (
                <BubbleMenu shouldShow={null}
                    editor={editor} options={{ placement: 'bottom', autoPlacement: true, offset: 8 }}>
                    <div className="button-group">
                        <button
                            onClick={() => editor.chain().focus().toggleMark('em').run()}
                            disabled={!editorState.canEm}
                            className={editorState.isEm ? 'is-active' : ''}
                        >
                            &lt;em&gt;
                        </button>
                        <button
                            onClick={() => editor.chain().focus().toggleMark('term').run()}
                            disabled={!editorState.canTerm}
                            className={editorState.isTerm ? 'is-active' : ''}
                        >
                            &lt;term&gt;
                        </button>
                        <button
                            onClick={() => editor.chain().focus().toggleMark('alert').run()}
                            disabled={!editorState.canAlert}
                            className={editorState.isAlert ? 'is-active' : ''}
                        >
                            &lt;alert&gt;
                        </button>
                        <button
                            onClick={() => editor.chain().focus().toggleMark('c').run()}
                            disabled={!editorState.canCode}
                            className={editorState.isCode ? 'is-active' : ''}
                        >
                            &lt;c&gt;
                        </button>
                        <button
                            onClick={() => editor.chain().focus().toggleMark('q').run()}
                            disabled={!editorState.canQuote}
                            className={editorState.isQuote ? 'is-active' : ''}
                        >
                            &lt;q&gt;
                        </button>
                    </div>
                </BubbleMenu>
            )}
        </>
    )

};
