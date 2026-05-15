import { onMounted, shallowRef } from 'vue'
import { ensureEchoEditorPortalRoot } from '@/utils/portal'

export function useEchoEditorPortalRoot() {
  const portalTarget = shallowRef<HTMLElement>()

  onMounted(() => {
    portalTarget.value = ensureEchoEditorPortalRoot()
  })

  return portalTarget
}
