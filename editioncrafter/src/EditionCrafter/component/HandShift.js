import React from 'react'

import { placeTooltip } from './GlossaryTerms'

/** The writing hand a change of hand is drawn as. */
const WRITING_HAND = '✍'

/**
 * The hand a `new` attribute points at: `#id`, or a bare id.
 */
export function handId(pointer) {
  const first = (pointer ?? '').trim().split(/\s+/u)[0] ?? ''
  return first.startsWith('#') ? first.slice(1) : first
}

/**
 * A TEI `<handShift>`: a writing hand where the hand changes. Hovering or
 * focusing it shows the description of the hand it changes to, from the
 * `<handNote>` of the header its `new` attribute points at, in the same
 * tooltip as a glossary word. A site restyles it through the classes
 * `hand-shift` and `hand-shift-tooltip`.
 */
export function HandShift({ pointer, description }) {
  const id = handId(pointer)
  const label = description || id
  return (
    <tei-handshift data-origname="handShift" new={pointer}>
      <span
        className="hand-shift"
        tabIndex={label ? 0 : undefined}
        aria-label={label ? `Change of hand: ${label}` : 'Change of hand'}
        onMouseEnter={placeTooltip}
        onFocus={placeTooltip}
      >
        <span aria-hidden="true">{WRITING_HAND}</span>
        {label && (
          <span className="glossary-tooltip hand-shift-tooltip" role="tooltip">
            {description
              ? <span className="glossary-tooltip-meaning">{description}</span>
              : <span className="glossary-tooltip-headword">{id}</span>}
          </span>
        )}
      </span>
    </tei-handshift>
  )
}
