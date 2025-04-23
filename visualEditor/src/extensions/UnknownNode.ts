import { Node, mergeAttributes, wrappingInputRule } from '@tiptap/core'

const UnknownNode = Node.create({
  name: 'unknownNode',

  content: 'unknownContent*',

  group: 'unknownContent',

  selectable: false,

  draggable: false,

  defining: false,


  // This would make it so an extra delete would not delete the parent node.  Not sure how we would end up deleting it. 
  // isolating: true,

  parseHTML() {
    return [
      {
        tag: 'unknown',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes({ class: 'unknown'}, HTMLAttributes), 0]
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

export default UnknownNode;