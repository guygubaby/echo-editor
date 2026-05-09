import { Extension, isTextSelection, isiOS, resolveFocusPosition } from '@tiptap/core'
import type { FocusPosition, RawCommands } from '@tiptap/core'
import { NodeSelection, Plugin, TextSelection } from '@tiptap/pm/state'

interface FocusOptions {
  scrollIntoView?: boolean
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    focus: {
      focus: (position?: FocusPosition, options?: FocusOptions) => ReturnType
    }
  }
}

const isAndroid = () => typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)

export const FocusWithoutScroll = Extension.create({
  name: 'focusWithoutScroll',
  priority: 1,

  addCommands() {
    return {
      focus:
        ((position: FocusPosition = null, options: FocusOptions = {}) =>
          ({ editor, view, tr, dispatch }) => {
            const focusOptions = {
              scrollIntoView: false,
              ...options,
            }

            const delayedFocus = () => {
              if (isiOS() || isAndroid()) {
                const element = view.dom as HTMLElement
                element.focus()
              }

              requestAnimationFrame(() => {
                if (!editor.isDestroyed) {
                  view.focus()

                  if (focusOptions.scrollIntoView) {
                    editor.commands.scrollIntoView()
                  }
                }
              })
            }

            if ((view.hasFocus() && position === null) || position === false) {
              return true
            }

            if (dispatch && position === null && !isTextSelection(editor.state.selection)) {
              delayedFocus()
              return true
            }

            const selection = resolveFocusPosition(tr.doc, position) || editor.state.selection
            const isSameSelection = editor.state.selection.eq(selection)

            if (dispatch) {
              if (!isSameSelection) {
                tr.setSelection(selection)
              }

              if (isSameSelection && tr.storedMarks) {
                tr.setStoredMarks(tr.storedMarks)
              }

              delayedFocus()
            }

            return true
          }) as RawCommands['focus'],
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handleDOMEvents: {
            mousedown: (view, event) => {
              if (event.button !== 0 || view.hasFocus()) {
                return false
              }

              const { selection } = view.state
              if (!(selection instanceof NodeSelection) || selection.node.type.name !== 'image') {
                return false
              }

              const target = event.target as Node | null
              const selectedNode = view.nodeDOM(selection.from)
              if (!target || selectedNode?.contains(target)) {
                return false
              }

              const position = view.posAtCoords({
                left: event.clientX,
                top: event.clientY,
              })
              if (!position) {
                return false
              }

              const nextSelection = TextSelection.near(view.state.doc.resolve(position.pos))
              if (!nextSelection.eq(selection)) {
                view.dispatch(view.state.tr.setSelection(nextSelection).setMeta('pointer', true))
              }

              return false
            },
          },
        },
      }),
    ]
  },
})
