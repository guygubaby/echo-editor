import { Node } from '@tiptap/core'

import { VIDEO_SIZE } from '@/constants'
import { getCssUnitWithDefault } from '@/utils/utils'

/**
 * Represents the interface for video options, extending GeneralOptions.
 */
export interface VideoOptions {
  /**
   * Poster image URL for the video
   *
   * @default null
   */
  poster: string | null

  onSelectPoster?: () => Promise<string | null | undefined> | string | null | undefined
  /**
   * Width of the video, can be a number or string
   *
   * @default VIDEO_SIZE['size-medium']
   */
  width: number | string
  /**
   * Object fit CSS property for the video
   *
   * @default 'contain'
   */
  objectFit: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  /**
   * Whether to show video controls
   *
   * @default true
   */
  showControls: boolean
  /**
   * Whether the video should autoplay
   *
   * @default false
   */
  autoplay: boolean
  /**
   * Whether the video should loop
   *
   * @default false
   */
  loop: boolean
  /**
   * Whether the video should be muted
   *
   * @default false
   */
  muted: boolean
  /**
   * Whether the video should play inline on mobile
   *
   * @default false
   */
  playsInline: boolean
  /** HTML attributes object for passing additional attributes */
  HTMLAttributes: {
    [key: string]: any
  }
  upload?: (file: File) => Promise<string>
}

/**
 * Represents the type for setting video options
 */
type SetVideoOptions = {
  /** The source URL of the video */
  src: string
  /** The poster image URL for the video */
  poster?: string | null
  /** The width of the video */
  width?: string | number
  /** Object fit CSS property */
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  /** Whether to show video controls */
  showControls?: boolean
  /** Whether the video should autoplay */
  autoplay?: boolean
  /** Whether the video should loop */
  loop?: boolean
  /** Whether the video should be muted */
  muted?: boolean
  /** Whether the video should play inline on mobile */
  playsInline?: boolean
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    video: {
      /**
       * Add an video
       */
      setVideo: (options: Partial<SetVideoOptions>) => ReturnType
      /**
       * Update an video
       */
      updateVideo: (options: Partial<SetVideoOptions>) => ReturnType
    }
  }
}

export const Video = Node.create<VideoOptions>({
  name: 'video',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      src: {
        default: null,
        renderHTML: ({ src }) => ({
          src: src || null,
        }),
      },
      poster: {
        default: null,
        renderHTML: ({ poster }) => ({
          poster: poster || null,
        }),
      },
      width: {
        default: this.options.width,
        renderHTML: ({ width }) => ({
          width: getCssUnitWithDefault(width),
        }),
      },
      objectFit: {
        default: this.options.objectFit,
        renderHTML: ({ objectFit }) => {
          return objectFit ? { style: `object-fit: ${objectFit};` } : {}
        },
      },
      controls: {
        default: this.options.showControls,
        renderHTML: ({ controls }) => (controls ? { controls: '' } : {}),
      },
      autoplay: {
        default: this.options.autoplay,
        renderHTML: ({ autoplay }) => (autoplay ? { autoplay: '' } : {}),
      },
      loop: {
        default: this.options.loop,
        renderHTML: ({ loop }) => (loop ? { loop: '' } : {}),
      },
      muted: {
        default: this.options.muted,
        renderHTML: ({ muted }) => (muted ? { muted: '' } : {}),
      },
      playsInline: {
        default: this.options.playsInline,
        renderHTML: ({ playsInline }) => (playsInline ? { playsinline: '' } : {}),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-video] video',
      },
      {
        tag: 'video',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const divAttrs = {
      ...this.options.HTMLAttributes,
      'data-video': '',
    }

    return ['div', divAttrs, ['video', HTMLAttributes]]
  },

  addCommands() {
    return {
      setVideo:
        options =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          })
        },
      updateVideo:
        options =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, options)
        },
    }
  },

  addOptions() {
    return {
      divider: false,
      spacer: false,
      upload: undefined,
      poster: null,
      width: VIDEO_SIZE['size-medium'],
      objectFit: 'contain',
      showControls: true,
      autoplay: false,
      loop: false,
      muted: false,
      playsInline: false,
      HTMLAttributes: {
        class: 'video-wrapper',
        style: 'display: flex;justify-content: center;',
      },
    }
  },
})
