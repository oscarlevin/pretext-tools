import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'

let editorContent = '<p>Hello World!!!</p>';

new Editor({
    element: document.querySelector('.element'),
    extensions: [StarterKit],
    content: editorContent,
})