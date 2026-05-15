export const ECHO_EDITOR_PORTAL_ROOT_ID = 'echo-editor-overlay-root'
export const ECHO_EDITOR_PORTAL_ROOT_ATTR = 'data-echo-editor-portal-root'
export const ECHO_EDITOR_PORTAL_ROOT_SELECTOR = `#${ECHO_EDITOR_PORTAL_ROOT_ID}[${ECHO_EDITOR_PORTAL_ROOT_ATTR}]`

let portalRoot: HTMLElement | null = null
let bodyObserver: MutationObserver | null = null
let moveScheduled = false

function getExistingPortalRoot() {
  return (
    (document.querySelector(ECHO_EDITOR_PORTAL_ROOT_SELECTOR) as HTMLElement | null) ??
    (document.getElementById(ECHO_EDITOR_PORTAL_ROOT_ID) as HTMLElement | null)
  )
}

function applyPortalRootAttributes(root: HTMLElement) {
  root.id = ECHO_EDITOR_PORTAL_ROOT_ID
  root.setAttribute(ECHO_EDITOR_PORTAL_ROOT_ATTR, '')
  root.classList.add('echo-editor')
  Object.assign(root.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '0',
    height: '0',
    zIndex: '2147483647',
    background: 'transparent',
    boxShadow: 'none',
    outline: 'none',
  })
}

function movePortalRootToBodyEnd(root: HTMLElement) {
  if (document.body.lastElementChild !== root) {
    document.body.appendChild(root)
  }
}

function schedulePortalRootMove(root: HTMLElement) {
  if (moveScheduled) return

  moveScheduled = true
  queueMicrotask(() => {
    moveScheduled = false
    movePortalRootToBodyEnd(root)
  })
}

function startBodyObserver(root: HTMLElement) {
  if (bodyObserver || typeof MutationObserver === 'undefined') return

  // Host apps may append body-level overlays after the editor; keep ours last.
  bodyObserver = new MutationObserver(() => {
    schedulePortalRootMove(root)
  })

  bodyObserver.observe(document.body, { childList: true })
}

export function ensureEchoEditorPortalRoot(): HTMLElement {
  if (typeof document === 'undefined' || !document.body) {
    throw new Error('Echo Editor portal root can only be created in a browser document.')
  }

  portalRoot = portalRoot ?? getExistingPortalRoot() ?? document.createElement('div')
  applyPortalRootAttributes(portalRoot)
  movePortalRootToBodyEnd(portalRoot)
  startBodyObserver(portalRoot)

  return portalRoot
}
