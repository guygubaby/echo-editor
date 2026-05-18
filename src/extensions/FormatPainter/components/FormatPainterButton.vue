<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Toggle } from '@/components/ui/toggle'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Icon } from '@/components/icons'
import { formatPainterPluginKey } from '../state'

import type { Editor } from '@tiptap/core'
import type { FormatPainterMode } from '../state'

interface Props {
  editor: Editor
  disabled?: boolean
  tooltip?: string
  onceTooltip?: string
  lockedTooltip?: string
  exitTooltip?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  tooltip: undefined,
  onceTooltip: undefined,
  lockedTooltip: undefined,
  exitTooltip: undefined,
})

const clickTimerRef = ref<ReturnType<typeof window.setTimeout> | null>(null)
const modeRef = ref<FormatPainterMode | null>(null)
const isActiveRef = computed(() => modeRef.value !== null)

function clearClickTimer() {
  if (!clickTimerRef.value) return
  window.clearTimeout(clickTimerRef.value)
  clickTimerRef.value = null
}

function syncMode() {
  const state = formatPainterPluginKey.getState(props.editor.state)
  modeRef.value = state?.mode ?? null
}

function handleMouseDown(event: MouseEvent) {
  event.preventDefault()
}

function handleClick(event: MouseEvent) {
  event.preventDefault()
  if (props.disabled) return

  if (clickTimerRef.value && event.detail > 1) return

  if (modeRef.value) {
    clearClickTimer()
    props.editor.commands.unsetPainter()
    syncMode()
    return
  }

  props.editor.commands.setPainter('once')
  syncMode()
  clearClickTimer()
  clickTimerRef.value = window.setTimeout(() => {
    clickTimerRef.value = null
  }, 220)
}

function handleDoubleClick(event: MouseEvent) {
  event.preventDefault()
  if (props.disabled) return

  clearClickTimer()
  props.editor.commands.setPainter('locked')
  syncMode()
}

onMounted(() => {
  syncMode()
  props.editor.on('transaction', syncMode)
})

onBeforeUnmount(() => {
  clearClickTimer()
  props.editor.off('transaction', syncMode)
})
</script>

<template>
  <TooltipProvider>
    <Tooltip :delay-duration="0">
      <TooltipTrigger>
        <Toggle
          size="sm"
          class="h-[32px] w-[32px]"
          :model-value="isActiveRef"
          :disabled="disabled"
          @mousedown="handleMouseDown"
          @click="handleClick"
          @dblclick="handleDoubleClick"
        >
          <Icon name="PaintRoller" />
        </Toggle>
      </TooltipTrigger>
      <TooltipContent v-if="tooltip" side="top" class="max-w-none">
        <div class="w-56 text-left">
          <div class="z-99999 text-sm font-medium">{{ tooltip }}</div>
          <div class="mt-1.5 space-y-1 text-primary-foreground/80">
            <div v-if="onceTooltip">{{ onceTooltip }}</div>
            <div v-if="lockedTooltip">{{ lockedTooltip }}</div>
            <div v-if="exitTooltip">{{ exitTooltip }}</div>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>
