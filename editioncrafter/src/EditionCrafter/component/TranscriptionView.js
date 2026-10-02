import { domToReact } from 'html-react-parser'
import React, { useContext } from 'react'
import { connect } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import TagFilterContext from '../context/TagFilterContext'
import EditorComment from './EditorComment'
import ErrorBoundary from './ErrorBoundary'
import { glossaryIndex, withGlossaryTerms } from './GlossaryTerms'
import MediaPlayer from './MediaPlayer'
import Navigation from './Navigation'
import Pagination from './Pagination'
import Parser from './Parser'
import { BigRingSpinner } from './RingSpinner'
import Watermark from './Watermark'

function addZoneStyle(selectedZone, domNode, facses) {
  if (facses.includes(selectedZone)) {
    // Keep any classes that might already be set
    if (domNode.attribs.classname) {
      domNode.attribs.classname += ' selected-zone'
    }
    else {
      domNode.attribs.classname = 'selected-zone'
    }
  }

  return domNode
}

function setUpForZoneHighlighting(selectedZone, domNode) {
  if (selectedZone && domNode.attribs['data-facs']) {
    // The facs field can contain multiple values
    const facses = domNode.attribs['data-facs'].split(' ')

    return addZoneStyle(selectedZone, domNode, facses)
  }

  return domNode
}

function handleTags(domNode, selectedTags) {
  const ana = domNode.attribs?.ana

  if (ana) {
    const truncated = ana.split(' ').map(t => t.slice(1))
    if (truncated.some(tag => selectedTags.includes(tag))) {
      domNode.attribs.class = 'active'
    }
  }

  return domNode
}

// Text whose words are not looked up in the glossary: notes are shown by
// their own component from their raw text.
const NO_GLOSSARY = new Set(['tei-note', 'script', 'style'])

function insideNoGlossary(domNode) {
  for (let node = domNode.parent; node; node = node.parent) {
    if (NO_GLOSSARY.has(node.name))
      return true
  }
  return false
}

export function htmlToReactParserOptions(selectedZone, selectedTags, glossary) {
  let textCount = 0
  const parserOptions = {
    replace(domNode) {
      // Words the glossary knows are wrapped so that hovering them shows
      // their part of speech and meaning.
      if (domNode.type === 'text') {
        if (!glossary || insideNoGlossary(domNode))
          return undefined
        textCount += 1
        const nodes = withGlossaryTerms(domNode.data, glossary, `gloss-${textCount}`)
        return nodes ? <>{nodes}</> : undefined
      }
      switch (domNode.name) {
        case 'div': {
          domNode = handleTags(domNode, selectedTags)
          return setUpForZoneHighlighting(selectedZone, domNode)
        }
        case 'tei-seg': {
          return handleTags(domNode, selectedTags)
        }
        case 'tei-line': {
          return setUpForZoneHighlighting(selectedZone, domNode)
        }
        case 'tei-surface': {
          return setUpForZoneHighlighting(selectedZone, domNode)
        }
        case 'tei-note': {
          const text = domNode.children[0]?.data || ''
          const id = domNode.attribs.n || domNode.attribs.id

          // Not sure what else to do if there's no ID
          if (!id) {
            return domNode
          }

          return (
            <EditorComment commentID={id} text={text} />
          )
        }
        case 'tei-figure': {
          const graphicEl = domNode.children.find(ch => ch.name === 'tei-graphic')
          const src = graphicEl?.attribs?.url
          if (!src) {
            return domNode
          }

          const descEl = domNode.children.find(ch => ch.name === 'tei-figdesc')
          const desc = descEl?.children[0]?.data
          return (
            <figure className="inline-figure">
              <img src={src} alt={desc || ''} className="inline-image" />
              { desc ? <figcaption>{desc}</figcaption> : null }
            </figure>
          )
        }
        case 'tei-media': {
          const url = domNode.attribs?.url?.trim()
          if (!url) {
            return domNode
          }

          // The element keeps its place, for stylesheets to select; its
          // description is parsed like any other transcription content.
          return (
            <tei-media data-origname="media">
              <MediaPlayer url={url} mimeType={domNode.attribs.mimetype?.trim()}>
                {domToReact(domNode.children, parserOptions)}
              </MediaPlayer>
            </tei-media>
          )
        }

        default:
          /* Otherwise, Just pass through */
          return domNode
      }
    },
  }
  return parserOptions
}

function TranscriptionView(props) {
  const [searchParams] = useSearchParams()

  const {
    side,
    folioID,
    transcriptionType,
    document,
    documentView,
    documentViewActions,
  } = props

  const { tagsLeft, tagsRight } = useContext(TagFilterContext)
  const tags = side === 'left' ? tagsLeft : tagsRight

  if (folioID === '-1') {
    return (
      <Watermark
        documentView={documentView}
        documentViewActions={documentViewActions}
        side={side}
      />
    )
  }

  const folio = document.folioIndex[folioID]

  if (folio && !folio.loading && !folio.transcription) {
    return (
      <Watermark
        documentView={documentView}
        documentViewActions={documentViewActions}
        side={side}
      />
    )
  }

  const transcriptionData = folio && folio.transcription && folio.transcription[transcriptionType]

  if (folio && !folio.loading && !transcriptionData) {
    return (
      <Watermark
        documentView={documentView}
        documentViewActions={documentViewActions}
        side={side}
      />
    )
  }

  // Configure parser to replace certain tags with components
  const htmlToReactParserOptionsSide = htmlToReactParserOptions(
    searchParams.get('zone'),
    tags,
    glossaryIndex(props.glossary?.glossary),
  )
  const html = transcriptionData && transcriptionData.html
  const layout = transcriptionData && transcriptionData.layout

  if (folio && !folio.loading && !html) {
    return (
      <Watermark
        documentView={documentView}
        documentViewActions={documentViewActions}
        side={side}
      />
    )
  }

  if (folio && folio.loading) {
    return (
      <div>
        <Navigation
          side={side}
          documentView={documentView}
          documentViewActions={documentViewActions}
          documentName={document.variorum && folio.doc_id}
        />
        <Pagination side={side} documentView={documentView} documentViewActions={documentViewActions} />
        <div className="transcriptionViewComponent">
          <div className="transcriptContent">
            <ErrorBoundary>
              <BigRingSpinner delay={3000} color="dark" />
            </ErrorBoundary>
          </div>
        </div>

        <Pagination
          side={side}
          documentView={documentView}
          documentViewActions={documentViewActions}
          bottom
        />
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', overflow: 'auto' }}>
      <Navigation
        side={side}
        documentView={documentView}
        documentViewActions={documentViewActions}
        documentName={document.variorum && folio.doc_id}
      />
      <Pagination side={side} documentView={documentView} documentViewActions={documentViewActions} />
      <div className="transcriptionViewComponent">
        <div className="transcriptContent">
          <ErrorBoundary>
            <div
              className="surface grid-mode"
              style={{ gridTemplateAreas: layout }}
            >
              <Parser
                html={html}
                htmlToReactParserOptionsSide={htmlToReactParserOptionsSide}
              />
            </div>
          </ErrorBoundary>
        </div>
      </div>

      <Pagination
        side={side}
        documentView={documentView}
        documentViewActions={documentViewActions}
        bottom
      />
    </div>
  )
}

function mapStateToProps(state) {
  return {
    annotations: state.annotations,
    document: state.document,
    glossary: state.glossary,
  }
}

export default connect(mapStateToProps)(TranscriptionView)
