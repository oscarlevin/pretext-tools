import { Node, mergeAttributes, wrappingInputRule } from '@tiptap/core'

const Definition = Node.create({
  name: 'definition',

  content: 'title? p+',

  group: 'block definitionLike',

  selectable: true,

  draggable: true,

  defining: false,


  // This would make it so an extra delete would not delete the parent node.  Not sure how we would end up deleting it. 
  // isolating: true,

  parseHTML() {
    return [
      {
        tag: 'definition',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['article', mergeAttributes({ class: 'definition definition-like', label: 'definition' }, HTMLAttributes), 0]
  },


  addInputRules() {
    return [
      wrappingInputRule({
        find: new RegExp(`^!def\\s$`),
        type: this.type,
      }),
    ]
  },

  // addKeyboardShortcuts() {
  //   return {
  //     'Mod-d': this.editor.commands.insertContent('<definition><title>Definition</title><p></p></definition>'),
  //   }
  // }

})

export default Definition;