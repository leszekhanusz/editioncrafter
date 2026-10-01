import { all, call, fork, select, takeEvery } from 'redux-saga/effects'

import { startFolioLoad } from '../model/Folio'
import { putResolveAction } from '../model/ReduxStore'

const justDocument = state => state.document
const justGlossary = state => state.glossary
const justNotes = state => state.notes

function* parseTagUrl(url) {
  const res = yield fetch(url)

  if (!res.ok) {
    return null
  }

  const html = yield res.text()

  const headerDoc = new DOMParser().parseFromString(html, 'text/html')

  const categoryEls = headerDoc.querySelectorAll('tei-category')

  const documentTags = {}

  for (const categoryEl of categoryEls) {
    const xmlId = categoryEl.getAttribute('id')

    if (xmlId) {
      const desc = categoryEl.querySelector('tei-catdesc')
      if (desc) {
        const name = desc.textContent
        documentTags[xmlId] = name
      }
    }
  }

  return documentTags
}

function* parseTags(headerUrl) {
  if (typeof headerUrl === 'string') {
    const result = yield parseTagUrl(headerUrl)
    yield putResolveAction('DocumentActions.loadTags', result)
  }
  else {
    const tags = {}

    for (const docId of Object.keys(headerUrl)) {
      tags[docId] = yield parseTagUrl(headerUrl[docId])
    }

    yield putResolveAction('DocumentActions.loadTags', tags)
  }
}

function* userNavigation(action) {
  const pathname = action.payload.params[0]
  const pathSegments = pathname.split('/')

  if (pathSegments.length > 1) {
    switch (pathSegments[1]) {
      case 'ec':
      {
        yield resolveDocumentManifest()
        yield resolveDocumentTags()
        yield resolveGlossary()
        yield resolveNotes()
        yield resolveFolio(pathSegments)
        break
      }
      default:
    }
  }
}

function* resolveDocumentTags() {
  const document = yield select(justDocument)

  if (!document.tags) {
    yield parseTags(document.headerUrl)
  }
}

function* resolveDocumentManifest() {
  const document = yield select(justDocument)

  if (!document.loaded) {
    // handle the case where we've passed in an array of manifest URLs, in which case the `variorum` parameter should be set to `true`
    if (document.variorum) {
      const variorumData = {}
      for (const key of Object.keys(document.manifestURL)) {
        const response = yield fetch(document.manifestURL[key])
        variorumData[key] = yield response.json()
      }
      const variorumManifest = {
        type: 'variorum',
        documentData: variorumData,
      }
      yield putResolveAction('DocumentActions.loadDocument', variorumManifest)
      return variorumManifest
    }
    const singleResponse = yield fetch(document.manifestURL)
    const json = yield singleResponse.json()
    yield putResolveAction('DocumentActions.loadDocument', json)
    return json
  }

  return null
}

function* storeFolioImage(id, image) {
  try {
    const tileSource = yield image
    yield putResolveAction('DocumentActions.loadFolioImage', { id, tileSource })
  }
  catch (error) {
    console.error(`Unable to load the image of ${id}`, error)
  }
}

// Loads one page and stores each part as it arrives: the text first, the
// image when the image server has described it.
function* loadAndStoreFolio(id) {
  const document = yield select(justDocument)
  const folioData = document.folioIndex[id]
  if (!folioData)
    return
  const { transcriptions, image } = startFolioLoad(folioData)
  if (image)
    yield fork(storeFolioImage, id, image)
  if (!transcriptions)
    return
  try {
    const loaded = yield transcriptions
    yield putResolveAction('DocumentActions.loadFolio', { id, ...loaded, loading: false })
  }
  catch (error) {
    console.error(`Unable to load the transcriptions of ${id}`, error)
    yield putResolveAction('DocumentActions.loadFolio', { id, loading: false })
  }
}

function* loadFoliosThenNeighbours(folioIDs) {
  yield all(folioIDs.map(id => call(loadAndStoreFolio, id)))
  // With the pages on screen shown, the ones a click away are fetched in
  // the background, so turning the page finds them ready.
  const { folios } = yield select(justDocument)
  const neighbours = new Set()
  for (const id of folioIDs) {
    const index = folios.findIndex(folio => folio.id === id)
    for (const near of [folios[index - 1], folios[index + 1]]) {
      if (index >= 0 && near && !folioIDs.includes(near.id))
        neighbours.add(near.id)
    }
  }
  yield all([...neighbours].map(id => call(loadAndStoreFolio, id)))
}

function* resolveFolio(pathSegments) {
  const document = yield select(justDocument)
  if (document.loaded) {
    let leftID
    let rightID
    let thirdID
    if (pathSegments.length > 2) {
      leftID = pathSegments[2]
      if (pathSegments.length > 4) {
        rightID = pathSegments[4]
        if (pathSegments.length > 6) {
          thirdID = pathSegments[6]
        }
      }
    }
    const folioIDs = []
    folioIDs.push(leftID)
    if (rightID && rightID !== leftID)
      folioIDs.push(rightID)
    if (thirdID && thirdID !== leftID && thirdID !== rightID)
      folioIDs.push(thirdID)

    // Not waited for: navigation goes on while the pages arrive.
    yield fork(
      loadFoliosThenNeighbours,
      folioIDs.filter(id => document.folioIndex[id]),
    )
  }
}

function* resolveGlossary() {
  const glossary = yield select(justGlossary)
  // NOTE: need to figure out how to deal with glossary for multidocument manifests
  if (!glossary.loaded && glossary.URL) {
    const response = yield fetch(glossary.URL)
    const json = yield response.json()
    yield putResolveAction('GlossaryActions.loadGlossary', json)
  }
}

function* resolveNotes() {
  const notes = yield select(justNotes)
  if (!notes.loaded && notes.URL) {
    const response = yield fetch(notes.URL)
    const txt = yield response.text()
    yield putResolveAction('NotesActions.loadNotes', txt)
  }
}

export default function* routeListenerSaga() {
  yield takeEvery('RouteListenerSaga.userNavigation', userNavigation)
}
