import React from 'react'

// A word: letters, with the apostrophes and hyphens that can join them.
const WORD = /[\p{L}\p{M}][\p{L}\p{M}'’-]*/gu

const indexes = new WeakMap()

function normalise(form) {
  return form.trim().toLocaleLowerCase()
}

/**
 * The glossary's entries by every form a reader may meet in the text: the
 * headword and each alternate spelling, compared without regard to case.
 * A form may be several words long. Built once per glossary.
 */
export function glossaryIndex(glossary) {
  if (!glossary?.entries)
    return null
  const known = indexes.get(glossary)
  if (known)
    return known
  const forms = new Map()
  let longest = 1
  for (const entry of Object.values(glossary.entries)) {
    const spellings = [
      entry.headWord,
      ...(entry.alternateSpellings ?? '').split(','),
    ]
    for (const spelling of spellings) {
      const form = normalise(spelling ?? '')
      if (!form || forms.has(form))
        continue
      forms.set(form, entry)
      longest = Math.max(longest, form.split(/\s+/u).length)
    }
  }
  const index = forms.size > 0 ? { forms, longest } : null
  indexes.set(glossary, index)
  return index
}

const MARGIN = 8

/**
 * Places the tooltip of the term being hovered or focused against the
 * window rather than the word: the transcription pane scrolls, and clips
 * whatever overflows it, so a tooltip hanging from a word near its edge
 * would be cut off. It opens under the word, and moves left, or above the
 * word, when it would run off the screen.
 */
function placeTooltip(event) {
  const term = event.currentTarget
  const tooltip = term.querySelector(':scope > .glossary-tooltip')
  if (!tooltip)
    return
  const word = term.getBoundingClientRect()
  const { offsetWidth: width, offsetHeight: height } = tooltip
  const left = Math.max(
    MARGIN,
    Math.min(word.left, window.innerWidth - MARGIN - width),
  )
  const below = word.bottom + 4
  const top = below + height > window.innerHeight - MARGIN
    ? Math.max(MARGIN, word.top - 4 - height)
    : below
  tooltip.style.left = `${left}px`
  tooltip.style.top = `${top}px`
}

function GlossaryTooltip({ entry }) {
  const numbered = entry.meanings.length > 1
  return (
    <span className="glossary-tooltip" role="tooltip">
      <span className="glossary-tooltip-headword">{entry.headWord}</span>
      {entry.meanings.map((meaning, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <span className="glossary-tooltip-meaning" key={index}>
          {numbered && `${index + 1}. `}
          {meaning.partOfSpeech && (
            <span className="glossary-tooltip-pos">{meaning.partOfSpeech}</span>
          )}
          {meaning.partOfSpeech && ' '}
          {meaning.meaning}
        </span>
      ))}
    </span>
  )
}

/**
 * The text with every word, or run of words, that the glossary knows
 * wrapped in a `glossary-term` span holding its `glossary-tooltip`, or null
 * when the text holds none. The longest form wins, so a two-word headword is
 * not cut into two one-word ones.
 */
export function withGlossaryTerms(text, index, keyPrefix) {
  if (!index || !text)
    return null
  const words = [...text.matchAll(WORD)]
  if (words.length === 0)
    return null
  const nodes = []
  let cursor = 0
  let matched = false
  for (let at = 0; at < words.length;) {
    let found = null
    for (let count = Math.min(index.longest, words.length - at); count >= 1; count -= 1) {
      const first = words[at]
      const last = words[at + count - 1]
      const span = text.slice(first.index, last.index + last[0].length)
      // Only words separated by plain spaces make up a phrase.
      if (count > 1 && /[^\p{L}\p{M}'’\s-]/u.test(span))
        continue
      const entry = index.forms.get(normalise(span.replace(/\s+/gu, ' ')))
      if (entry) {
        found = { entry, start: first.index, end: last.index + last[0].length, count }
        break
      }
    }
    if (!found) {
      at += 1
      continue
    }
    matched = true
    if (found.start > cursor)
      nodes.push(text.slice(cursor, found.start))
    nodes.push(
      <span
        className="glossary-term"
        tabIndex={0}
        key={`${keyPrefix}-${found.start}`}
        onMouseEnter={placeTooltip}
        onFocus={placeTooltip}
      >
        {text.slice(found.start, found.end)}
        <GlossaryTooltip entry={found.entry} />
      </span>,
    )
    cursor = found.end
    at += found.count
  }
  if (!matched)
    return null
  if (cursor < text.length)
    nodes.push(text.slice(cursor))
  return nodes
}
