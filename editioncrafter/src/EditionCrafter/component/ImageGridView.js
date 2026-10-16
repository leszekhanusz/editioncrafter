import { MenuItem, Select } from '@material-ui/core'
import React, { useEffect, useRef, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroller'
import { connect } from 'react-redux'

/** How far outside the view a thumbnail starts loading. */
const THUMBNAIL_MARGIN = '200px'

/**
 * A transparent pixel shown until then: an image without a source would be
 * drawn as its alt text, ignoring its width and height.
 */
const PLACEHOLDER = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

/**
 * A thumbnail asked for only when it comes near the view, so that opening
 * the grid does not request every thumbnail at once: some image servers
 * (Gallica) block bursts of requests. The browser's own `loading="lazy"`
 * starts much further ahead (about 1250px), hence the observer.
 */
function Thumbnail({ src, size, ...props }) {
  const ref = useRef(null)
  const [near, setNear] = useState(typeof IntersectionObserver === 'undefined')
  useEffect(() => {
    if (near || !ref.current)
      return undefined
    const observer = new IntersectionObserver((entries) => {
      if (entries.some(entry => entry.isIntersecting))
        setNear(true)
    }, { rootMargin: THUMBNAIL_MARGIN })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [near])
  // Its size, known beforehand, keeps the thumbnails not yet loaded in place.
  const [width, height] = size ?? []
  return <img ref={ref} src={near ? src : PLACEHOLDER} width={width} height={height} decoding="async" {...props} />
}

class ImageGridView extends React.Component {
  constructor(props, context) {
    super(props, context)
    this.generateThumbs = this.generateThumbs.bind(this)
    this.loadIncrement = 10
    this.state = {
      jumpToBuffer: '',
      thumbs: '',
      visibleThumbs: [],
      currentDoc: props.selectedDoc || null,
    }
  }

  componentDidUpdate(prevProps) {
    const { documentView } = this.props
    const folioID = documentView[this.props.side].iiifShortID
    const nextFolioID = this.props.documentView[this.props.side].iiifShortID

    if (folioID !== nextFolioID) {
      const thumbs = this.generateThumbs(nextFolioID, this.state.currentDoc ? this.props.document.folios.filter(folio => (folio.doc_id === this.state.currentDoc)) : this.props.document.folios)
      const thumbCount = (thumbs.length > this.loadIncrement) ? this.loadIncrement : thumbs.length
      const visibleThumbs = thumbs.slice(0, thumbCount)
      this.setState({ thumbs, visibleThumbs })
    }
  }

  onJumpToChange = (event) => {
    const jumpToBuffer = event.target.value
    this.setState({ ...this.state, jumpToBuffer })
  }

  onJumpTo = (event) => {
    const { jumpToBuffer } = this.state
    const { side, document, documentViewActions } = this.props
    event.preventDefault()

    // Convert folioName to ID (and confirm it exists)
    if (document.folioByName[jumpToBuffer]) {
      const folio = document.folioByName[jumpToBuffer]
      if (folio) {
        documentViewActions.changeCurrentFolio(folio.id, side)
      }
    }

    this.setState({ ...this.state, jumpToBuffer: '' })
  }

  renderToolbar() {
    return (
      <div className="imageGridToolbar">
        <span className="fas fa-th" style={{ paddingLeft: '15px' }} />
        { this.props.document.variorum
          ? this.renderDocSelect()
          : (
              <div className="doc-select" style={{ marginTop: '5px' }}>
                { this.props.document.documentName }
              </div>
            ) }
        <div className="jump-to">
          <form onSubmit={this.onJumpTo}>
            <span>Jump to: </span>
            <input
              id="jump-to-input"
              placeholder="Page Name (e.g. '3r')"
              onChange={this.onJumpToChange}
              value={this.state.jumpToBuffer}
            />
            <button id="jump-to-button" onClick={this.onJumpTo}>
              <span style={{ color: 'black' }} className="fa fa-hand-point-right" />
            </button>
          </form>
        </div>
      </div>
    )
  }

  // in the case of a variorum, allow for filtering by document
  renderDocSelect() {
    return (
      <div className="doc-select">
        <Select
          id="doc-filter"
          className="dark"
          style={{ color: 'white', fontSize: 'max(16px, 1rem)' }}
          value={this.state.currentDoc || Object.keys(this.props.document.derivativeNames)[0]}
          onClick={this.onSelectDoc}
        >
          {/* <MenuItem value="none" key="none">{this.state.currentDoc ? 'View All' : 'Select a Document'}</MenuItem> */}
          { Object.keys(this.props.document.derivativeNames).map(key => (
            <MenuItem value={key} key={key}>{this.props.document.derivativeNames[key]}</MenuItem>
          ))}
        </Select>
      </div>
    )
  }

  onSelectDoc = (event) => {
    if (!event.target.value || event.target.value == 0) {
      return
    }
    if (event.target.value && event.target.value !== 'none') {
      this.setState({ ...this.state, currentDoc: event.target.value })
    }
    else {
      this.setState({ ...this.state, currentDoc: null })
    }
    const { documentView } = this.props
    const folioID = documentView[this.props.side].iiifShortID
    const thumbs = this.generateThumbs(folioID, event.target.value !== 'none' ? this.props.document.folios.filter(folio => (folio.doc_id === event.target.value)) : this.props.document.folios)
    const thumbCount = (thumbs.length > this.loadIncrement) ? this.loadIncrement : thumbs.length
    const visibleThumbs = thumbs.slice(0, thumbCount)
    this.setState({ thumbs, visibleThumbs })
  }

  componentDidMount() {
    const { documentView } = this.props
    const folioID = documentView[this.props.side].iiifShortID
    const thumbs = this.generateThumbs(folioID, this.props.document.variorum && this.state.currentDoc ? this.props.document.folios.filter(folio => (folio.doc_id === this.state.currentDoc)) : this.props.document.folios)
    const thumbCount = (thumbs.length > this.loadIncrement) ? this.loadIncrement : thumbs.length
    const visibleThumbs = thumbs.slice(0, thumbCount)
    this.setState({ thumbs, visibleThumbs })
  }

  onClickThumb = (id, e) => {
    // Set the folio for this side
    this.props.documentViewActions.changeCurrentFolio(
      id,
      this.props.side,
      'f',
    )
  }

  generateThumbs(currentID, folios) {
    const thumbs = folios.map((folio, index) => (
      // eslint-disable-next-line react/no-array-index-key
      <li key={`thumb-${index}`} className="thumbnail">
        <figure><a id={folio.id} onClick={this.onClickThumb.bind(this, folio.id)}><Thumbnail src={folio.image_thumbnail_url} size={folio.image_thumbnail_size} alt={folio.name} style={{ maxWidth: '130px', maxHeight: '130px' }} onError={({ currentTarget }) => { currentTarget.onerror = null; if (folio.image_zoom_url && currentTarget.src !== `${folio.image_zoom_url.slice(0, -9)}full/full/0/default.jpg`) { currentTarget.src = `${folio.image_zoom_url.slice(0, -9)}full/full/0/default.jpg` } }} /></a></figure>
        <figcaption className="thumbnail-caption">
          {folio.name}
        </figcaption>

      </li>
    ))
    return thumbs
  }

  moreThumbs = () => {
    const { thumbs } = this.state
    let { visibleThumbs } = this.state
    const thumbCount = visibleThumbs.length + this.loadIncrement

    if (thumbs.length >= thumbCount) {
      visibleThumbs = thumbs.slice(0, thumbCount)
    }
    else {
      visibleThumbs = thumbs
    }

    this.setState({ visibleThumbs })
  }

  hasMore() {
    return (this.state.visibleThumbs.length !== this.state.thumbs.length)
  }

  render() {
    let thisClass = 'imageGridComponent'
    thisClass = `${thisClass} ${this.props.side}`
    let { visibleThumbs } = this.state
    if (!visibleThumbs.constructor.toString().includes('Array')) {
      visibleThumbs = []
    }
    return (
      <div className={thisClass}>
        { this.renderToolbar() }
        <InfiniteScroll
          element="ul"
          loadMore={this.moreThumbs}
          hasMore={this.hasMore()}
          useWindow={false}
        >
          {visibleThumbs}
        </InfiniteScroll>
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    document: state.document,
  }
}

export default connect(mapStateToProps)(ImageGridView)
