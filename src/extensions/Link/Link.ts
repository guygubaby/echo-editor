import type { LinkOptions as TiptapLinkOptions } from '@tiptap/extension-link'
import { Link as TiptapLink } from '@tiptap/extension-link'
import { mergeAttributes } from '@tiptap/core'
import { Plugin, TextSelection } from '@tiptap/pm/state'
import { EditorView } from '@tiptap/pm/view'
import { getMarkRange } from '@tiptap/core'
import LinkEditPopover from './components/LinkEditPopover.vue'
import type { GeneralOptions } from '@/type'

export interface LinkOptions extends TiptapLinkOptions, GeneralOptions<LinkOptions> {
  /** If true, the link will be validated as a URL. In some cases, you may want to allow non-URL links, like email addresses or relative links. */
  strictUrl?: boolean
}

export const Link = TiptapLink.extend<LinkOptions>({
  inclusive: false,

  addAttributes() {
    return {
      ...this.parent?.(),
      strictUrl: {
        default: this.options.strictUrl ?? true,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'a[href]:not([data-type="button"]):not([href *= "javascript:" i])',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'a',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: 'link',
      }),
      0,
    ]
  },

  addOptions() {
    return {
      ...this.parent?.(),
      openOnClick: true,
      button: ({ editor, t }) => {
        return {
          component: LinkEditPopover,
          componentProps: {
            action: value => {
              const { link, text, openInNewTab } = value as any
              editor
                .chain()
                .extendMarkRange('link')
                .insertContent({
                  type: 'text',
                  text: text,
                  marks: [
                    {
                      type: 'link',
                      attrs: {
                        href: link,
                        target: openInNewTab ? '_blank' : '_self',
                      },
                    },
                  ],
                })
                .setLink({ href: link })
                .focus()
                .run()
            },
            isActive: () => editor.isActive('link') || false,
            disabled: !editor.isEditable || !editor.can().setLink({ href: '' }),
            icon: 'Link',
            tooltip: t('editor.link.tooltip'),
          },
        }
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handleClick: (view: EditorView, pos: number) => {
            const { schema, doc, tr } = view.state
            const range = getMarkRange(doc.resolve(pos), schema.marks.link)
            if (!range) return false
            const $start = doc.resolve(range.from)
            const $end = doc.resolve(range.to)
            const transaction = tr.setSelection(new TextSelection($start, $end))
            view.dispatch(transaction)
          },
        },
      }),
    ]
  },
})
