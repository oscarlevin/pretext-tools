import { Node, mergeAttributes } from '@tiptap/core'

const RawPtx = Node.create({
  name: 'rawptx',

  content: 'text*',

  marks: '',

  selectable: true,

  draggable: true,

  defining: true,

  code: true,

  //atom: true,

  whitespace: 'pre',


  // This would make it so an extra delete would not delete the parent node.  Not sure how we would end up deleting it. 
  // isolating: true,

  parseHTML() {
    return [
      {
        tag: 'rawptx',
        preserveWhitespace: 'full',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['pre', mergeAttributes({ class: 'rawptx'}, HTMLAttributes), 0]
  },


//  addInputRules() {
//    return [
//      wrappingInputRule({
//        find: new RegExp(`^!def\\s$`),
//        type: this.type,
//      }),
//    ]
//  },

  // addKeyboardShortcuts() {
  //   return {
  //     'Mod-d': this.editor.commands.insertContent('<definition><title>Definition</title><p></p></definition>'),
  //   }
  // }

})

export default RawPtx;