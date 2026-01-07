<script setup lang="ts">
import { reactive, watchEffect, ref, onMounted } from 'vue'
import { Icon } from '@/components/icons'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { onClickOutside } from '@vueuse/core'
import type { Editor } from '@tiptap/vue-3'
import { useLocale } from '@/locales'
import { useFocus } from '@vueuse/core'

interface Props {
  editor: Editor
}
const props = withDefaults(defineProps<Props>(), {})
const emits = defineEmits(['onSetLink', 'onClickOutside'])

const { t } = useLocale()

let form = reactive({
  text: '',
  link: '',
})
const inputRef = ref<HTMLInputElement | null>(null)
const { focused } = useFocus(inputRef)
const openInNewTab = ref<boolean>(false)
const isStrictUrl = ref<boolean>(true)
const target = ref(null)
onClickOutside(target, event => emits('onClickOutside', event))

watchEffect(() => {
  const { href: link, target, strictUrl } = props.editor.getAttributes('link')
  const { from, to } = props.editor.state.selection
  const text = props.editor.state.doc.textBetween(from, to, ' ')
  form = {
    link,
    text,
  }
  openInNewTab.value = target === '_blank' ? true : false
  isStrictUrl.value = strictUrl
})
function handleSubmit() {
  emits('onSetLink', form.link, form.text, openInNewTab.value)
}
onMounted(() => {
  focused.value = true
})
</script>

<template>
  <div ref="target" class="p-2 rounded-lg bg-card shadow-sm border">
    <form @submit.prevent="handleSubmit" class="flex flex-col gap-2">
      <Label> {{ t('editor.link.dialog.text') }} </Label>
      <div class="flex w-full max-w-sm items-center gap-1.5">
        <div class="relative w-full max-w-sm items-center">
          <textarea
            v-model="form.text"
            required
            class="flex h-9 w-80 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            :placeholder="t('editor.link.dialog.input.text')"
            rows="3"
          ></textarea>
        </div>
      </div>
      <Label>{{ t('editor.link.dialog.link') }}</Label>
      <div class="flex w-full max-w-sm items-center gap-1.5">
        <div class="relative w-full max-w-sm items-center">
          <textarea
            :type="isStrictUrl ? 'url' : 'text'"
            ref="inputRef"
            v-model="form.link"
            required
            class="flex h-9 w-80 rounded-md border border-input bg-transparent px-3 py-1 pl-10 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            rows="3"
          ></textarea>
          <span class="absolute start-0 top-2 flex items-center justify-center px-2">
            <Icon class="size-5 text-muted-foreground" name="Link" />
          </span>
        </div>
      </div>
      <div class="flex items-center space-x-2 mt-1">
        <Checkbox v-model="openInNewTab" id="openInNewTab" />
        <Label for="openInNewTab">{{ t('editor.link.dialog.openInNewTab') }}</Label>
      </div>
      <Button type="submit" class="mt-2 self-end">{{ t('editor.link.dialog.button.apply') }} </Button>
    </form>
  </div>
</template>
