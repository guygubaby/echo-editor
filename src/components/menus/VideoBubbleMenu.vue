<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import type { Editor } from '@tiptap/vue-3'
import { BubbleMenu } from '@tiptap/vue-3'
import { sticky } from 'tippy.js'
import { getRenderContainer } from '@/utils/getRenderContainer'
import { useLocale } from '@/locales'
import { deleteSelection } from '@tiptap/pm/commands'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { MenuCheckboxItem } from '@/components/ui/menu'
import ActionButton from '@/components/ActionButton.vue'
import { VIDEO_SIZE } from '@/constants'
import { Input } from '../ui/input'
import { Button } from '../ui/button'

interface Props {
  editor: Editor
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
})

const { t } = useLocale()

const posterUrl = ref('')

const videoOptions = computed(() => {
  return props.editor.extensionManager.extensions.find(extension => extension.name === 'video')?.options
})

const hasOnSelectPoster = computed(() => {
  return typeof videoOptions.value?.onSelectPoster === 'function'
})

const currentPoster = computed(() => {
  if (!props.editor.isActive('video')) {
    return ''
  }
  const attrs = props.editor.getAttributes('video')
  return attrs.poster || ''
})

const objectFitOptions = [
  { value: 'contain', label: 'Contain' },
  { value: 'cover', label: 'Cover' },
  { value: 'fill', label: 'Fill' },
  { value: 'none', label: 'None' },
  { value: 'scale-down', label: 'Scale Down' },
] as const

const currentObjectFit = computed(() => {
  if (!props.editor.isActive('video')) {
    return 'contain'
  }
  const attrs = props.editor.getAttributes('video')
  return attrs.objectFit || 'contain'
})

const currentObjectFitLabel = computed(() => {
  const option = objectFitOptions.find(opt => opt.value === currentObjectFit.value)
  return option?.label || 'Contain'
})

function handleObjectFitChange(value: string) {
  props.editor
    .chain()
    .focus()
    .updateVideo({ objectFit: value as any })
    .run()
}

function handleSizeChange(size: 'size-small' | 'size-medium' | 'size-large') {
  props.editor.chain().focus().updateVideo({ width: VIDEO_SIZE[size] }).run()
}

function handlePosterChange() {
  props.editor
    .chain()
    .focus()
    .updateVideo({ poster: posterUrl.value || null })
    .run()
}

async function handleSelectPoster() {
  const onSelectPoster = videoOptions.value?.onSelectPoster
  if (!onSelectPoster) return

  try {
    const result = await Promise.resolve(onSelectPoster())
    if (result) {
      props.editor
        .chain()
        .focus()
        .updateVideo({ poster: result || null })
        .run()
    }
  } catch (error) {
    console.error('Poster selection failed:', error)
  }
}

function handleRemove() {
  const { state, dispatch } = props.editor.view
  deleteSelection(state, dispatch)
}

const shouldShow = ({ editor }) => {
  const { selection } = editor.view.state
  return selection.node?.type.name === 'video'
}

const getReferenceClientRect = computed(() => {
  const renderContainer = getRenderContainer(props.editor, 'video-wrapper')
  return renderContainer?.getBoundingClientRect() || new DOMRect(-1000, -1000, 0, 0)
})

// Sync posterUrl with current poster when video is selected
watch(
  () => props.editor.getAttributes('video'),
  attrs => {
    if (attrs) {
      posterUrl.value = attrs.poster || ''
    }
  },
  { immediate: true }
)
</script>

<template>
  <BubbleMenu
    :editor="editor"
    pluginKey="video-menus-123"
    :shouldShow="shouldShow"
    :updateDelay="0"
    :tippy-options="{
      offset: [0, 8],
      zIndex: 10,
      appendTo: 'parent',
      getReferenceClientRect: getReferenceClientRect.value,
      plugins: [sticky],
      sticky: 'popper',
      maxWidth: 500,
    }"
  >
    <div
      class="border px-3 py-2 transition-all select-none pointer-events-auto shadow-sm rounded-sm w-auto bg-background"
    >
      <div class="flex items-center flex-nowrap whitespace-nowrap h-[26px] justify-start relative gap-0.5">
        <ActionButton
          :tooltip="t('editor.size.small.tooltip')"
          icon="SizeS"
          :action="() => handleSizeChange('size-small')"
          :is-active="() => editor.isActive('video', { width: VIDEO_SIZE['size-small'] })"
        />
        <ActionButton
          :tooltip="t('editor.size.medium.tooltip')"
          icon="SizeM"
          :action="() => handleSizeChange('size-medium')"
          :is-active="() => editor.isActive('video', { width: VIDEO_SIZE['size-medium'] })"
        />
        <ActionButton
          :tooltip="t('editor.size.large.tooltip')"
          icon="SizeL"
          :action="() => handleSizeChange('size-large')"
          :is-active="() => editor.isActive('video', { width: VIDEO_SIZE['size-large'] })"
        />
        <Separator orientation="vertical" class="mx-1 me-2 h-[16px]" />
        <Popover>
          <PopoverTrigger>
            <ActionButton tooltip="Object Fit" :title="currentObjectFitLabel" />
          </PopoverTrigger>
          <PopoverContent class="w-auto p-1">
            <MenuCheckboxItem
              v-for="option in objectFitOptions"
              :key="option.value"
              :model-value="currentObjectFit === option.value"
              @select="() => handleObjectFitChange(option.value)"
            >
              {{ option.label }}
            </MenuCheckboxItem>
          </PopoverContent>
        </Popover>
        <Separator orientation="vertical" class="mx-1 me-2 h-[16px]" />
        <ActionButton
          v-if="hasOnSelectPoster"
          icon="ImageUp"
          tooltip="Set Video Poster"
          :title="currentPoster ? 'Change Poster' : 'Set Poster'"
          :action="handleSelectPoster"
        />
        <Popover v-else>
          <PopoverTrigger>
            <ActionButton tooltip="Poster" :title="currentPoster ? 'Change Poster' : 'Set Poster'" />
          </PopoverTrigger>
          <PopoverContent class="w-84">
            <div class="flex items-center gap-2">
              <Input
                id="posterUrl"
                v-model="posterUrl"
                type="url"
                placeholder="https://example.com/poster.jpg"
                @keyup.enter="handlePosterChange"
                class="flex-1 h-8"
              />
              <Button type="primary" @click="handlePosterChange">Set Poster</Button>
            </div>
          </PopoverContent>
        </Popover>
        <Separator orientation="vertical" class="mx-1 me-2 h-[16px]" />
        <ActionButton
          :tooltip="t('editor.remove')"
          icon="Trash2"
          :action="handleRemove"
          :disabled="!editor.isEditable"
        />
      </div>
    </div>
  </BubbleMenu>
</template>
