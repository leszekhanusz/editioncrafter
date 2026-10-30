import { useEffect, useRef } from 'react'

/** The class of the element a followed link led to. */
export const LINK_TARGET = 'link-target'

// The surface a `facs` names, `#f006` or `f006`.
function surfaceOf(facs) {
  const token = facs?.trim().split(/\s+/u)[0]
  if (!token)
    return null
  return token.slice(token.lastIndexOf('#') + 1) || null
}

/**
 * Where each element of a document is, read from the whole document
 * rendered (`html/index.html`): by `xml:id`, the resource holding it and the
 * page it is on. A text is cut into pages by its `pb facs`, a sourceDoc by
 * its `surface facs`; the facsimile is shown as `f`. A resource without
 * pages, such as a bibliography, is shown whole: its rendering is kept, by
 * its id, in `wholeResources`.
 */
export function linkIndex(doc) {
  const targets = {}
  const wholeResources = {}
  for (const resource of doc.querySelectorAll('tei-text[id], tei-sourcedoc[id]')) {
    // A text inside another (a group) is part of it.
    if (resource.parentElement?.closest('tei-text, tei-sourcedoc'))
      continue
    const sourceDoc = resource.localName === 'tei-sourcedoc'
    const paged = Boolean(resource.querySelector(sourceDoc ? 'tei-surface[facs]' : 'tei-pb[facs]'))
    if (!paged)
      wholeResources[resource.id] = resource.outerHTML
    let page = null
    let first = null
    for (const el of resource.querySelectorAll('*')) {
      if (!sourceDoc && el.localName === 'tei-pb' && el.hasAttribute('facs'))
        page = surfaceOf(el.getAttribute('facs'))
      if (!el.id)
        continue
      const folioID = !paged
        ? null
        : sourceDoc
          ? surfaceOf(el.closest('tei-surface[facs]')?.getAttribute('facs'))
          : page
      first ??= folioID
      targets[el.id] = { resource: resource.id, folioID, whole: !paged }
    }
    targets[resource.id] = { resource: resource.id, folioID: first, whole: !paged }
  }
  for (const surface of doc.querySelectorAll('tei-facsimile tei-surface[id]')) {
    targets[surface.id] = { resource: 'f', folioID: surface.id, whole: false }
    for (const el of surface.querySelectorAll('[id]'))
      targets[el.id] = { resource: 'f', folioID: surface.id, whole: false }
  }
  return { targets, wholeResources }
}

/**
 * Where a `target` leads: an address with a scheme (`https:`, `mailto:`) is
 * opened as is; `#id`, or a bare id, is the element of the document with
 * that id, on the page holding it. The first of several pointers is the one
 * followed. Null when it leads nowhere known.
 */
export function resolveLink(document, target) {
  const token = target?.trim().split(/\s+/u)[0]
  if (!token)
    return null
  if (/^[a-z][a-z\d+.-]*:/iu.test(token))
    return { url: token }
  const id = token.startsWith('#') ? token.slice(1) : token
  if (!id || id.includes('/'))
    return null
  const found = document.variorum ? null : document.linkTargets?.[id]
  if (!found)
    return { id }
  // On a page the manifest has, or in a resource shown whole.
  if (!found.whole && !document.folioIndex[found.folioID])
    return { id }
  return { id, ...found }
}

/**
 * Brings the element a followed link led to into view in a pane, once its
 * content is there, and marks it with `link-target`. A note is opened. Each
 * link followed is applied once; until its element is found (the page may
 * still be arriving), every render of the pane looks again.
 */
export function useLinkTarget(containerRef, linkTarget) {
  const applied = useRef(null)
  useEffect(() => {
    const container = containerRef.current
    if (!container || !linkTarget || applied.current === linkTarget.nonce)
      return
    const found = [...container.querySelectorAll('[id]')]
      .find(el => el.id === linkTarget.id)
    if (!found)
      return
    applied.current = linkTarget.nonce
    container.querySelectorAll(`.${LINK_TARGET}`)
      .forEach(el => el.classList.remove(LINK_TARGET))
    found.classList.add(LINK_TARGET)
    found.scrollIntoView({ block: 'center' })
    if (found.localName === 'tei-note' && found.classList.contains('editor-comment'))
      found.click()
  })
}
