<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3'
import { useLocale } from '@/locales'
import { truncate } from '@/utils/utils'
import ActionButton from '@/components/ActionButton.vue'
import { Separator } from '@/components/ui/separator'

interface Props {
  editor: Editor
  link?: string
}
withDefaults(defineProps<Props>(), {
  link: undefined,
})
const { t } = useLocale()
const emits = defineEmits(['clear', 'edit'])

function onClear() {
  emits('clear')
}
function onEdit() {
  emits('edit')
}
</script>

<template>
  <div class="flex w-fit max-w-[calc(100vw-2rem)] items-center gap-2 p-2 pl-4 bg-card rounded-lg shadow-sm border">
    <a :href="link" target="_blank" rel="noopener noreferrer" class="block max-w-64 truncate text-sm underline sm:max-w-96">
      {{
        truncate(link, {
          length: 50,
          omission: '…',
        })
      }}
    </a>
    <Separator orientation="vertical" class="h-4 shrink-0" v-if="link" />
    <div class="flex shrink-0 flex-nowrap">
      <ActionButton
        icon="Pencil"
        :tooltip="t('editor.link.edit.tooltip')"
        :action="onEdit"
        :tooltip-options="{ sideOffset: 15 }"
      />
      <ActionButton
        icon="Unlink"
        :tooltip="t('editor.link.unlink.tooltip')"
        :action="onClear"
        :tooltip-options="{ sideOffset: 15 }"
      />
    </div>
  </div>
</template>
