import React, { Component } from 'react'

export const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

/**
 * The letter a glossary headword is filed under: its first letter, without
 * accent and in capitals, so that "cambiamento" and "Écu" go under C and E.
 */
export function initialOf(headWord) {
  return (headWord ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .charAt(0)
    .toUpperCase()
}

export default class AlphabetLinks extends Component {
  // The heading is looked for in the glossary this bar belongs to: both
  // panes may show the glossary at once.
  scrollTo = (event, letter) => {
    const view = event.currentTarget.closest('#glossaryView')
    const heading = view?.querySelector(`[data-glossary-letter="${letter}"]`)
    heading?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  renderAlphaLinks() {
    const { letters } = this.props
    const letterLinks = alpha.map((letter) => {
      // A letter no headword starts with has nothing to go to.
      const present = !letters || letters.includes(letter)
      return (
        <span key={`link-${letter}`}>
          {present
            ? (
                <a
                  href={`#alpha-${letter}`}
                  onClick={(event) => {
                    event.preventDefault()
                    this.scrollTo(event, letter)
                  }}
                >
                  {letter}
                </a>
              )
            : <span className="alpha-absent">{letter}</span>}
          {' '}
        </span>
      )
    })

    return (
      <div style={{ display: 'inline' }}>
        <input
          id="glossary-filter"
          className="searchBox"
          placeholder="Filter by Entry"
          onChange={this.props.onFilterChange}
          value={this.props.value}
        />

        <div className="alphaNav">
          <span style={{ color: 'black' }}>Go to: </span>
          { letterLinks }
        </div>
      </div>
    )
  }

  render() {
    return (
      <div className="glossaryNav">
        { this.renderAlphaLinks() }
      </div>
    )
  }
}
