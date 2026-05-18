import { PluginKey } from '@tiptap/pm/state'

import type { Mark } from '@tiptap/pm/model'

export type FormatPainterMode = 'once' | 'locked'

export interface FormatPainterBlockFormat {
  typeName: 'paragraph' | 'heading'
  attrs: Record<string, unknown>
}

export interface FormatPainterSnapshot {
  marks: Mark[]
  block: FormatPainterBlockFormat | null
}

export interface FormatPainterPluginState {
  mode: FormatPainterMode | null
  snapshot: FormatPainterSnapshot | null
}

export type FormatPainterAction =
  | {
      type: 'set'
      mode: FormatPainterMode
      snapshot: FormatPainterSnapshot
    }
  | {
      type: 'unset'
    }

export const formatPainterPluginKey = new PluginKey<FormatPainterPluginState>('format-painter')
