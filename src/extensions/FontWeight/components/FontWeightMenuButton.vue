<script lang="ts" setup>
import type { StyleValue } from 'vue'
import { computed, watchEffect, ref } from 'vue'
import type { Editor } from '@tiptap/vue-3'
import { MenuCheckboxItem, MenuSeparator } from '@/components/ui/menu'
import ActionDropdownButton from '@/components/ActionDropdownButton.vue'
import type { ButtonViewReturnComponentProps } from '@/type'
import { useLocale } from '@/locales'

export interface Item {
  title: string
  isActive: NonNullable<ButtonViewReturnComponentProps['isActive']>
  action?: ButtonViewReturnComponentProps['action']
  style?: StyleValue
  disabled?: boolean
  divider?: boolean
  default?: boolean
}
interface Props {
  editor: Editor
  disabled?: boolean
  color?: string
  shortcutKeys?: string[]
  maxHeight?: string | number
  tooltip?: string
  items?: Item[]
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  color: undefined,
  maxHeight: undefined,
  icon: undefined,
  tooltip: '',
  shortcutKeys: undefined,
  items: () => [],
})
const { t } = useLocale()

const isSelectionEmpty = ref(props.editor?.state.selection.empty ?? true)

// Watch for selection changes
watchEffect(() => {
  if (props.editor) {
    isSelectionEmpty.value = props.editor.state.selection.empty
  }
})

// Subscribe to editor updates
if (props.editor) {
  props.editor.on('selectionUpdate', () => {
    isSelectionEmpty.value = props.editor.state.selection.empty
  })

  props.editor.on('update', () => {
    isSelectionEmpty.value = props.editor.state.selection.empty
  })
}

const computedDisabled = computed(() => {
  return props.disabled || isSelectionEmpty.value
})

const active = computed(() => {
  const find: any = props.items.find((k: any) => k.isActive())
  if (find) {
    return find
  }
  const item: Item = {
    title: t.value('editor.fontWeight.default.tooltip'),
    isActive: () => false,
  }
  return item
})

const computedItems = computed(() => {
  return props.items.map(item => ({
    ...item,
    disabled: item.disabled || isSelectionEmpty.value,
  }))
})
</script>

<template>
  <ActionDropdownButton
    :disabled="computedDisabled"
    :tooltip="tooltip"
    :title="active.title"
    btn_class="min-w-24 max-w-32"
  >
    <div class="w-32">
      <template v-for="(item, index) in computedItems" :key="index">
        <MenuCheckboxItem :model-value="active.title === item.title" @select="item.action" :disabled="item.disabled">
          <div class="ml-1 h-full" :style="{ fontWeight: item.default ? undefined : item.title }">
            {{ item.title }}
          </div>
        </MenuCheckboxItem>
        <MenuSeparator v-if="item.title === t('editor.fontWeight.default.tooltip')" />
      </template>
    </div>
  </ActionDropdownButton>
</template>
