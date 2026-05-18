import { Extension } from '@tiptap/core'
import { Plugin } from '@tiptap/pm/state'
import FormatPainterButton from './components/FormatPainterButton.vue'
import { formatPainterPluginKey } from './state'

import type { GeneralOptions } from '@/type'
import type { Mark, Node as ProseMirrorNode, NodeType, Schema } from '@tiptap/pm/model'
import type { EditorState, ResolvedPos, Transaction } from '@tiptap/pm/state'
import type {
  FormatPainterAction,
  FormatPainterBlockFormat,
  FormatPainterMode,
  FormatPainterPluginState,
  FormatPainterSnapshot,
} from './state'

export interface FormatPainterOptions extends GeneralOptions<FormatPainterOptions> { }

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    painter: {
      setPainter: (mode?: FormatPainterMode) => ReturnType
      unsetPainter: () => ReturnType
    }
  }
}

const painterCursorSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#000" d="M9 22v-6H4V7q0-1.65 1.175-2.825T8 3h12v13h-5v6zM6 10h12V5h-1v4h-2V5h-1v2h-2V5H8q-.825 0-1.412.588T6 7zm0 4h12v-2H6zm0 0v-2z"/></svg>`
const painterCursor = `url("data:image/svg+xml;utf8,${encodeURIComponent(painterCursorSvg)}"), auto`
const painterActiveClass = 'echo-format-painter-active'
const supportedBlockTypes = new Set(['paragraph', 'heading'])
const blockAttrNames = ['textAlign', 'lineHeight', 'indent'] as const
const excludedMarkNames = new Set(['link', 'comment'])
const visualMarkNames = ['bold', 'italic', 'underline', 'strike', 'code', 'textStyle', 'highlight', 'subscript', 'superscript']

function isCopyableMark(mark: Mark) {
  return !excludedMarkNames.has(mark.type.name)
}

function getSourceMarks(state: EditorState) {
  const { selection } = state

  if (selection.empty) {
    return selection.$head.marks().filter(isCopyableMark)
  }

  let foundText = false
  let marks: Mark[] = []

  state.doc.nodesBetween(selection.from, selection.to, node => {
    if (foundText) return false
    if (!node.isText) return true

    foundText = true
    marks = node.marks.filter(isCopyableMark)
    return false
  })

  return marks
}

function getSourceTextblock(state: EditorState) {
  const { $from } = state.selection

  for (let depth = $from.depth; depth > 0; depth -= 1) {
    const node = $from.node(depth)
    if (node.isTextblock && supportedBlockTypes.has(node.type.name)) {
      return node
    }
  }

  return null
}

function getBlockFormat(node: ProseMirrorNode | null): FormatPainterBlockFormat | null {
  if (!node || !supportedBlockTypes.has(node.type.name)) return null

  const attrs: Record<string, unknown> = {}

  if (node.type.name === 'heading') {
    attrs.level = node.attrs.level
  }

  for (const attrName of blockAttrNames) {
    if (Object.prototype.hasOwnProperty.call(node.attrs, attrName)) {
      attrs[attrName] = node.attrs[attrName]
    }
  }

  return {
    typeName: node.type.name as FormatPainterBlockFormat['typeName'],
    attrs,
  }
}

function getFormatSnapshot(state: EditorState): FormatPainterSnapshot | null {
  const snapshot = {
    marks: getSourceMarks(state),
    block: getBlockFormat(getSourceTextblock(state)),
  }

  if (!snapshot.marks.length && !snapshot.block) return null

  return snapshot
}

function setPainterCursor(dom: HTMLElement, active: boolean) {
  if (!active) {
    dom.classList.remove(painterActiveClass)
    dom.style.removeProperty('--echo-format-painter-cursor')
    return
  }

  dom.classList.add(painterActiveClass)
  dom.style.setProperty('--echo-format-painter-cursor', painterCursor)
}

function attrsEqual(a: Record<string, any>, b: Record<string, any>) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])

  for (const key of keys) {
    if (a[key] !== b[key]) return false
  }

  return true
}

function canReplaceNodeType(tr: Transaction, pos: number, type: NodeType) {
  const $pos = tr.doc.resolve(pos)
  const parent = $pos.parent
  const index = $pos.index()

  return parent.canReplaceWith(index, index + 1, type)
}

function getTargetType(tr: Transaction, schema: Schema, pos: number, node: ProseMirrorNode, block: FormatPainterBlockFormat) {
  const sourceType = schema.nodes[block.typeName]

  if (!sourceType || sourceType === node.type) {
    return node.type
  }

  if (!canReplaceNodeType(tr, pos, sourceType)) {
    return node.type
  }

  return sourceType
}

function getTargetAttrs(node: ProseMirrorNode, targetType: NodeType, block: FormatPainterBlockFormat) {
  const attrs = targetType === node.type ? { ...node.attrs } : {}

  if (targetType.name === 'heading') {
    attrs.level = block.typeName === 'heading' ? block.attrs.level ?? 1 : 1
  }

  for (const attrName of blockAttrNames) {
    if (!Object.prototype.hasOwnProperty.call(targetType.attrs, attrName)) continue
    if (!Object.prototype.hasOwnProperty.call(block.attrs, attrName)) continue

    attrs[attrName] = block.attrs[attrName]
  }

  return attrs
}

function applyBlockFormatToNode(
  tr: Transaction,
  schema: Schema,
  pos: number,
  node: ProseMirrorNode,
  block: FormatPainterBlockFormat
) {
  const targetType = getTargetType(tr, schema, pos, node, block)
  const attrs = getTargetAttrs(node, targetType, block)

  if (targetType === node.type && attrsEqual(node.attrs, attrs)) {
    return true
  }

  tr.setNodeMarkup(pos, targetType, attrs, node.marks)
  return true
}

function applyBlockFormatAtPosition(tr: Transaction, state: EditorState, $pos: ResolvedPos, block: FormatPainterBlockFormat | null) {
  if (!block) return false

  for (let depth = $pos.depth; depth > 0; depth -= 1) {
    const node = $pos.node(depth)
    if (!node.isTextblock) continue

    return applyBlockFormatToNode(tr, state.schema, $pos.before(depth), node, block)
  }

  return false
}

function applyBlockFormatToRange(
  tr: Transaction,
  state: EditorState,
  from: number,
  to: number,
  block: FormatPainterBlockFormat | null
) {
  if (!block) return false

  let touched = false

  state.doc.nodesBetween(from, to, (node, pos) => {
    if (!node.isTextblock) return true

    touched = applyBlockFormatToNode(tr, state.schema, pos, node, block) || touched
    return false
  })

  return touched
}

function removeVisualMarks(tr: Transaction, schema: Schema, from: number, to: number) {
  for (const markName of visualMarkNames) {
    const markType = schema.marks[markName]
    if (markType) {
      tr.removeMark(from, to, markType)
    }
  }
}

function applyMarks(tr: Transaction, state: EditorState, from: number, to: number, marks: Mark[]) {
  removeVisualMarks(tr, state.schema, from, to)

  for (const mark of marks) {
    if (state.schema.marks[mark.type.name]) {
      tr.addMark(from, to, mark)
    }
  }
}

function finishPainterTransaction(tr: Transaction, mode: FormatPainterMode) {
  if (mode === 'once') {
    tr.setMeta(formatPainterPluginKey, { type: 'unset' } satisfies FormatPainterAction)
  }
}

function applySnapshot(view: { state: EditorState; dispatch: (tr: Transaction) => void }, painterState: FormatPainterPluginState) {
  const { mode, snapshot } = painterState
  if (!mode || !snapshot) return false

  const { selection } = view.state
  const tr = view.state.tr
  let touched = false

  if (selection.empty) {
    touched = applyBlockFormatAtPosition(tr, view.state, selection.$from, snapshot.block)
  } else {
    applyMarks(tr, view.state, selection.from, selection.to, snapshot.marks)
    touched = true
    touched = applyBlockFormatToRange(tr, view.state, selection.from, selection.to, snapshot.block) || touched
  }

  if (!touched) return false

  finishPainterTransaction(tr, mode)

  if (tr.docChanged || mode === 'once') {
    view.dispatch(tr)
  }

  return true
}

export const FormatPainter = Extension.create<FormatPainterOptions>({
  name: 'painter',

  addOptions() {
    return {
      ...this.parent?.(),
      button: ({ editor, t }) => ({
        component: FormatPainterButton,
        componentProps: {
          editor,
          disabled: !editor?.isEditable,
          tooltip: t('editor.format'),
          onceTooltip: t('editor.format.tooltip.once'),
          lockedTooltip: t('editor.format.tooltip.locked'),
          exitTooltip: t('editor.format.tooltip.exit'),
        },
      }),
    }
  },

  addCommands() {
    return {
      setPainter:
        (mode: FormatPainterMode = 'once') =>
        ({ state, dispatch }) => {
          const snapshot = getFormatSnapshot(state)
          if (!snapshot) return false

          dispatch?.(
            state.tr.setMeta(formatPainterPluginKey, {
              type: 'set',
              mode,
              snapshot,
            } satisfies FormatPainterAction)
          )

          return true
        },
      unsetPainter:
        () =>
        ({ state, dispatch }) => {
          dispatch?.(state.tr.setMeta(formatPainterPluginKey, { type: 'unset' } satisfies FormatPainterAction))
          return true
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      Escape: () => {
        const painterState = formatPainterPluginKey.getState(this.editor.state)
        if (!painterState?.mode) return false

        return this.editor.commands.unsetPainter()
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin<FormatPainterPluginState>({
        key: formatPainterPluginKey,
        state: {
          init: () => ({
            mode: null,
            snapshot: null,
          }),
          apply: (tr, value) => {
            const action = tr.getMeta(formatPainterPluginKey) as FormatPainterAction | undefined

            if (action?.type === 'set') {
              return {
                mode: action.mode,
                snapshot: action.snapshot,
              }
            }

            if (action?.type === 'unset') {
              return {
                mode: null,
                snapshot: null,
              }
            }

            return value
          },
        },
        view: view => {
          const syncCursor = () => {
            const painterState = formatPainterPluginKey.getState(view.state)
            setPainterCursor(view.dom, Boolean(painterState?.mode))
          }

          syncCursor()

          return {
            update: syncCursor,
            destroy: () => setPainterCursor(view.dom, false),
          }
        },
        props: {
          handleDOMEvents: {
            mousedown(view, event) {
              const painterState = formatPainterPluginKey.getState(view.state)
              if (!painterState?.mode || event.button !== 0) return false

              const mouseup = () => {
                window.setTimeout(() => {
                  const nextPainterState = formatPainterPluginKey.getState(view.state)
                  if (!nextPainterState?.mode) return

                  applySnapshot(view, nextPainterState)
                })
              }

              document.addEventListener('mouseup', mouseup, { once: true })
              return false
            },
          },
        },
      }),
    ]
  },
})
