/** The class the counterparts of a hovered link carry. */
export const LINK_HIGHLIGHT = 'link-highlight'

// A pointer to an element of the document: `#id`, or a bare id. A URL is
// not one, nor anything else with a scheme or a path in it.
function pointedIds(target) {
  return target
    .split(/\s+/u)
    .map(token => (token.startsWith('#') ? token.slice(1) : token))
    .filter(id => id && !/[:/]/u.test(id))
}

function quoted(value) {
  return `"${value.replace(/["\\]/gu, '\\$&')}"`
}

/**
 * The elements linked to `element`: those its `target` points at, and those
 * whose `target` points at its `id`. Every copy is found, since the same
 * transcription can be open in both panes.
 */
function counterparts(element, root) {
  const found = new Set()
  const target = element.getAttribute('target')
  if (target) {
    for (const id of pointedIds(target)) {
      root.querySelectorAll(`[id=${quoted(id)}]`).forEach(node => found.add(node))
    }
  }
  if (element.id) {
    root
      .querySelectorAll(`[target~=${quoted(`#${element.id}`)}], [target~=${quoted(element.id)}]`)
      .forEach(node => found.add(node))
  }
  found.delete(element)
  return found
}

function clear(root) {
  root.querySelectorAll(`.${LINK_HIGHLIGHT}`).forEach(node => node.classList.remove(LINK_HIGHLIGHT))
}

/**
 * Highlights what the hovered element is linked to: hovering a `metamark`
 * whose `target` is `#add1` highlights the element with that id, and
 * hovering that element highlights the metamark. The nearest linked element
 * around the pointer is the one that counts.
 */
export function highlightLinks(event) {
  const surface = event.currentTarget
  const root = surface.closest('.editioncrafter') ?? surface.ownerDocument
  clear(root)
  for (let node = event.target; node && node !== surface; node = node.parentElement) {
    if (!(node instanceof Element))
      continue
    const linked = counterparts(node, root)
    if (linked.size > 0) {
      linked.forEach(found => found.classList.add(LINK_HIGHLIGHT))
      return
    }
  }
}

export function clearLinks(event) {
  const surface = event.currentTarget
  clear(surface.closest('.editioncrafter') ?? surface.ownerDocument)
}
