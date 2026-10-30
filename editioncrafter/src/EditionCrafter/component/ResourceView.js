import React, { useContext, useRef } from 'react'
import { connect } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import TagFilterContext from '../context/TagFilterContext'
import ErrorBoundary from './ErrorBoundary'
import { glossaryIndex } from './GlossaryTerms'
import { clearLinks, highlightLinks } from './LinkHighlight'
import { useLinkTarget } from './LinkTarget'
import Navigation from './Navigation'
import Parser from './Parser'
import { htmlToReactParserOptions } from './TranscriptionView'

/**
 * A resource without pages, such as a bibliography, shown whole whatever
 * the page: as rendered in the whole document (`html/index.html`), parsed
 * as a page of a transcription is, its notes and links included. A link
 * followed to it brings the element it points at into view.
 */
function ResourceView(props) {
  const [searchParams] = useSearchParams()
  const {
    side,
    transcriptionType,
    document,
    documentView,
    documentViewActions,
  } = props
  const { tagsLeft, tagsRight } = useContext(TagFilterContext)
  const contentRef = useRef(null)
  useLinkTarget(contentRef, documentView[side].linkTarget)

  const html = document.wholeResources?.[transcriptionType]
  const parserOptions = htmlToReactParserOptions(
    searchParams.get('zone'),
    side === 'left' ? tagsLeft : tagsRight,
    glossaryIndex(props.glossary?.glossary),
    document.hands ?? null,
    target => documentViewActions.followLink(side, target),
  )

  return (
    <div style={{ position: 'relative', overflow: 'auto' }}>
      <Navigation
        side={side}
        documentView={documentView}
        documentViewActions={documentViewActions}
      />
      <div className="transcriptionViewComponent whole-resource" data-resource-id={transcriptionType}>
        <div className="transcriptContent">
          <ErrorBoundary>
            <div
              ref={contentRef}
              className="surface"
              onMouseOver={highlightLinks}
              onMouseLeave={clearLinks}
            >
              {html && <Parser html={html} htmlToReactParserOptionsSide={parserOptions} />}
            </div>
          </ErrorBoundary>
        </div>
      </div>
    </div>
  )
}

function mapStateToProps(state) {
  return {
    document: state.document,
    glossary: state.glossary,
  }
}

export default connect(mapStateToProps)(ResourceView)
