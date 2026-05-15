import { Extension } from '@tiptap/core'
import { Fragment, type Mark, type MarkType, type Node as ProseMirrorNode, type Schema, Slice } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'

const TEXT_STYLE_MARK_NAME = 'textStyle'
const FONT_FAMILY_ATTR = 'fontFamily'

export interface PasteFontFamilyOptions {
  /**
   * Font family to apply to pasted text.
   *
   * When omitted or set to null, pasted font-family values are removed so the
   * editor falls back to the host site's font.
   */
  fontFamily?: string | null
}

function hasUsefulAttrs(attrs: Record<string, unknown>) {
  return Object.values(attrs).some(value => value !== null && value !== undefined && value !== '')
}

function getFontFamily(options: PasteFontFamilyOptions) {
  return typeof options.fontFamily === 'string' && options.fontFamily.trim() !== '' ? options.fontFamily : null
}

function normalizeTextStyleMarks(
  marks: readonly Mark[],
  options: PasteFontFamilyOptions,
  textStyle: MarkType | undefined
) {
  const nextMarks: Mark[] = []
  let hasTextStyleMark = false
  const fontFamily = getFontFamily(options)

  for (const mark of marks) {
    if (mark.type.name !== TEXT_STYLE_MARK_NAME) {
      nextMarks.push(mark)
      continue
    }

    hasTextStyleMark = true
    const nextAttrs = { ...mark.attrs }

    if (fontFamily) {
      nextAttrs[FONT_FAMILY_ATTR] = fontFamily
    } else {
      delete nextAttrs[FONT_FAMILY_ATTR]
    }

    if (hasUsefulAttrs(nextAttrs)) {
      nextMarks.push(mark.type.create(nextAttrs))
    }
  }

  if (fontFamily && !hasTextStyleMark && textStyle) {
    nextMarks.push(textStyle.create({ [FONT_FAMILY_ATTR]: fontFamily }))
  }

  return nextMarks
}

function normalizeNode(node: ProseMirrorNode, options: PasteFontFamilyOptions, schema: Schema): ProseMirrorNode {
  let nextNode = node

  if (node.content.size) {
    const children: ProseMirrorNode[] = []
    node.content.forEach(child => {
      children.push(normalizeNode(child, options, schema))
    })
    nextNode = node.copy(Fragment.fromArray(children))
  }

  if (!nextNode.isText) return nextNode

  const nextMarks = normalizeTextStyleMarks(nextNode.marks, options, schema.marks[TEXT_STYLE_MARK_NAME])
  return nextNode.mark(nextMarks)
}

function normalizeSlice(slice: Slice, options: PasteFontFamilyOptions, schema: Schema) {
  const children: ProseMirrorNode[] = []

  slice.content.forEach(child => {
    children.push(normalizeNode(child, options, schema))
  })

  return new Slice(Fragment.fromArray(children), slice.openStart, slice.openEnd)
}

export const PasteFontFamily = Extension.create<PasteFontFamilyOptions>({
  name: 'pasteFontFamily',

  addOptions() {
    return {
      fontFamily: null,
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey(this.name),
        props: {
          transformPasted: (slice, view) => normalizeSlice(slice, this.options, view.state.schema),
        },
      }),
    ]
  },
})

export function createPasteFontFamilyExtension(options: PasteFontFamilyOptions = {}) {
  return PasteFontFamily.configure(options)
}
