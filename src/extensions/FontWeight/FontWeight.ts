import { Extension } from '@tiptap/core'
import FontWeightMenuButton from './components/FontWeightMenuButton.vue'
import type { GeneralOptions } from '@/type'

/**
 * Interface for font weight menu items
 */
export interface Item {
  title: string
  isActive: () => boolean
  action: () => void
  disabled: boolean
  divider: boolean
  default: boolean
}

/**
 * Represents the interface for font weight options, extending GeneralOptions.
 */
export interface FontWeightOptions extends GeneralOptions<FontWeightOptions> {
  types: string[]
  /**
   * List of available font weight values
   *
   * @default [100, 200, 300, 400, 500, 600, 700, 800, 900]
   */
  fontWeights: number[]
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontWeight: {
      /**
       * Set the text font weight. Must be a valid CSS font-weight value (100-900).
       */
      setFontWeight: (fontWeight: number | string) => ReturnType
      /**
       * Unset the font weight
       */
      unsetFontWeight: () => ReturnType
    }
  }
}

const DEFAULT_FONT_WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900] as const
const DEFAULT_FONT_WEIGHT_VALUE = 'default' as const

export const FontWeight = Extension.create<FontWeightOptions>({
  name: 'fontWeight',
  addOptions() {
    return {
      ...this.parent?.(),
      types: ['textStyle'],
      fontWeights: [...DEFAULT_FONT_WEIGHTS],
      button({ editor, extension, t }) {
        const fontWeights = (extension.options?.fontWeights as FontWeightOptions['fontWeights']) || []
        const items: Item[] = [DEFAULT_FONT_WEIGHT_VALUE, ...fontWeights].map(k => ({
          title: k === DEFAULT_FONT_WEIGHT_VALUE ? t('editor.fontWeight.default.tooltip') : String(k),
          isActive: () => {
            const { fontWeight } = editor.getAttributes('textStyle')
            const isDefault = k === DEFAULT_FONT_WEIGHT_VALUE
            const notFontWeight = fontWeight === undefined
            if (isDefault && notFontWeight) {
              return true
            }
            return editor.isActive({ fontWeight: String(k) }) || false
          },
          action: () => {
            if (k === DEFAULT_FONT_WEIGHT_VALUE) {
              editor?.chain().unsetFontWeight().focus().run()
              return
            }
            editor?.chain().setFontWeight(String(k)).focus().run()
          },
          disabled: !editor?.isEditable || !editor.can().setFontWeight(String(k)) || editor.state.selection.empty,
          divider: k === DEFAULT_FONT_WEIGHT_VALUE || false,
          default: k === DEFAULT_FONT_WEIGHT_VALUE || false,
        }))
        const disabled = items.filter(k => k.disabled).length === items.length || editor.state.selection.empty
        return {
          component: FontWeightMenuButton,
          componentProps: {
            editor,
            tooltip: t('editor.fontWeight.tooltip'),
            disabled,
            items,
            maxHeight: 280,
          },
        }
      },
    }
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontWeight: {
            default: null,
            parseHTML: element => {
              const fontWeight = element.style.fontWeight
              if (!fontWeight) {
                return null
              }
              // Convert CSS font-weight values to numbers
              const weightMap: Record<string, string> = {
                normal: '400',
                bold: '700',
              }
              return weightMap[fontWeight] || fontWeight.replace(/['"]+/g, '')
            },
            renderHTML: attributes => {
              if (!attributes.fontWeight) {
                return {}
              }
              return {
                style: `font-weight: ${attributes.fontWeight}`,
              }
            },
          },
        },
      },
    ]
  },
  addCommands() {
    return {
      setFontWeight:
        fontWeight =>
        ({ chain }) => {
          return chain().setMark('textStyle', { fontWeight }).run()
        },
      unsetFontWeight:
        () =>
        ({ chain }) => {
          return chain().setMark('textStyle', { fontWeight: null }).removeEmptyTextStyle().run()
        },
    }
  },
})
