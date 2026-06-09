import { Extension, isTextSelection, isiOS, resolveFocusPosition } from '@tiptap/core'
import type { FocusPosition, RawCommands } from '@tiptap/core'
import { NodeSelection, Plugin, TextSelection, Transaction } from '@tiptap/pm/state'
import { EditorView } from '@tiptap/pm/view'

interface ScrollPositionSnapshot {
  element: Element | Window
  isWindow: boolean
  left: number
  top: number
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    focus: {
      focus: (position?: FocusPosition, options?: unknown) => ReturnType
    }
  }
}

const isAndroid = () => typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)
const disabledScrollCommandName = ['scroll', 'IntoView'].join('')

const disableTransactionScroll = () => {
  const transactionPrototype = Transaction.prototype as Transaction & Record<string, unknown>
  transactionPrototype[disabledScrollCommandName] = function noScroll(this: Transaction) {
    return this
  }
}

disableTransactionScroll()

const isScrollable = (element: Element) => {
  return element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth
}

const collectScrollPositions = (element: HTMLElement): ScrollPositionSnapshot[] => {
  const positions: ScrollPositionSnapshot[] = []
  const doc = element.ownerDocument
  const scrollingElement = doc.scrollingElement

  for (let node: HTMLElement | null = element; node; node = node.parentElement) {
    if (isScrollable(node)) {
      positions.push({
        element: node,
        isWindow: false,
        left: node.scrollLeft,
        top: node.scrollTop,
      })
    }
  }

  if (scrollingElement) {
    positions.push({
      element: scrollingElement,
      isWindow: false,
      left: scrollingElement.scrollLeft,
      top: scrollingElement.scrollTop,
    })
  }

  positions.push({
    element: doc.defaultView ?? window,
    isWindow: true,
    left: doc.defaultView?.scrollX ?? window.scrollX,
    top: doc.defaultView?.scrollY ?? window.scrollY,
  })

  return positions
}

const restoreScrollPositions = (positions: ScrollPositionSnapshot[]) => {
  positions.forEach(({ element, isWindow, left, top }) => {
    if (isWindow) {
      element.scrollTo(left, top)
      return
    }

    const scrollElement = element as Element
    scrollElement.scrollLeft = left
    scrollElement.scrollTop = top
  })
}

const restoreScrollPositionsLater = (positions: ScrollPositionSnapshot[]) => {
  restoreScrollPositions(positions)
  requestAnimationFrame(() => restoreScrollPositions(positions))
  setTimeout(() => restoreScrollPositions(positions), 0)
}

const disableEditorViewScroll = () => {
  const viewPrototype = EditorView.prototype as EditorView & Record<string, any>
  if (viewPrototype.__echoEditorNoScroll) return

  Object.defineProperty(viewPrototype, '__echoEditorNoScroll', {
    value: true,
  })

  const originalUpdateStateInner = viewPrototype.updateStateInner
  const originalFocus = viewPrototype.focus

  viewPrototype.updateStateInner = function updateStateInnerWithoutScroll(this: EditorView, ...args: any[]) {
    const scrollPositions = collectScrollPositions(this.dom as HTMLElement)
    originalUpdateStateInner.apply(this, args)
    restoreScrollPositionsLater(scrollPositions)
  }

  viewPrototype.focus = function focusWithoutScroll(this: EditorView) {
    const scrollPositions = collectScrollPositions(this.dom as HTMLElement)
    originalFocus.call(this)
    restoreScrollPositionsLater(scrollPositions)
  }

  viewPrototype.scrollToSelection = function scrollToSelectionWithoutScroll() {
    return undefined
  }
}

disableEditorViewScroll()

const selectClickedTextAfterImageSelection = (view: EditorView, event: MouseEvent | PointerEvent) => {
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

  event.preventDefault()
  event.stopPropagation()

  const scrollPositions = collectScrollPositions(view.dom as HTMLElement)
  const nextSelection = TextSelection.near(view.state.doc.resolve(position.pos))
  view.dispatch(view.state.tr.setSelection(nextSelection).setMeta('pointer', true))
  view.focus()
  restoreScrollPositionsLater(scrollPositions)

  return true
}

export const FocusWithoutScroll = Extension.create({
  name: 'focusWithoutScroll',
  priority: 1,

  addCommands() {
    return {
      [disabledScrollCommandName]: () => () => true,
      focus:
        ((position: FocusPosition = null, _options?: unknown) =>
          ({ editor, view, tr, dispatch }) => {
            const delayedFocus = () => {
              const element = view.dom as HTMLElement
              const scrollPositions = collectScrollPositions(element)

              if (isiOS() || isAndroid()) {
                element.focus()
              }

              requestAnimationFrame(() => {
                if (!editor.isDestroyed) {
                  view.focus()
                  restoreScrollPositions(scrollPositions)
                  requestAnimationFrame(() => restoreScrollPositions(scrollPositions))
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
    } as Partial<RawCommands>
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handleScrollToSelection: () => true,
          handleDOMEvents: {
            pointerdown: selectClickedTextAfterImageSelection,
            mousedown: selectClickedTextAfterImageSelection,
          },
        },
      }),
    ]
  },
})
