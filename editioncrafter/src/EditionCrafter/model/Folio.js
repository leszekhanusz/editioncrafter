import OpenSeadragon from 'openseadragon'
import { layoutMargin3 } from './folioLayout'

function getTagIds(html) {
  const tagIds = []
  const doc = new DOMParser().parseFromString(html, 'text/html')

  const tagEls = doc.querySelectorAll('tei-div[ana], tei-seg[ana]')

  for (const tagEl of tagEls) {
    const ana = tagEl.getAttribute('ana')

    if (ana) {
      const split = ana.split(' ').map(t => t.slice(1))

      for (const tag of split) {
        if (!tagIds.includes(tag)) {
          tagIds.push(tag)
        }
      }
    }
  }

  return tagIds
}

function getZoneTagData(annotations) {
  const tagIds = new Set()
  const zoneTagIndex = {}

  annotations.forEach((anno) => {
    zoneTagIndex[anno.id] = []
    anno.body.forEach((item) => {
      if (item.purpose === 'classifying') {
        const value = item.value.slice(1)
        tagIds.add(value)
        zoneTagIndex[anno.id].push(value)
      }
    })
  })

  return {
    tagIds: Array.from(tagIds),
    zoneTagIndex,
  }
}

// Pages being loaded, by id: a page asked for twice — shown, then prefetched,
// or prefetched, then shown — is fetched once.
const pending = new Map()

/** Whether a page's transcriptions are loaded. */
export function hasTranscriptions(folioData) {
  return Boolean(folioData.transcription) && !folioData.loading
}

function loadTileSource(folio) {
  if (folio.image_zoom_url.endsWith('.json')) {
    return fetch(folio.image_zoom_url)
      .then(response => response.json())
      .then(imageServerResponse => new OpenSeadragon.IIIFTileSource(imageServerResponse))
  }
  return Promise.resolve(new OpenSeadragon.ImageTileSource({
    type: 'image',
    url: folio.image_zoom_url,
  }))
}

async function loadTranscriptions(folio) {
  const { tagIds, zoneTagIndex } = getZoneTagData(folio.annotations)
  const transcriptionTypes = Object.keys(folio.annotationURLs)
  // Every file of every transcription type at once: one after the other,
  // the six files of a three-type edition took over a second.
  const loaded = await Promise.all(transcriptionTypes.map(async (transcriptionType) => {
    const { htmlURL, xmlURL } = folio.annotationURLs[transcriptionType]
    const [html, xml] = await Promise.all([
      fetch(htmlURL).then(response => response.text()),
      fetch(xmlURL).then(response => response.text()),
    ])
    const transcription = parseTranscription(html, xml)
    if (!transcription)
      throw new Error(`Unable to load transcription: ${htmlURL}`)
    return { transcriptionType, transcription, tagIds: getTagIds(html) }
  }))
  const transcription = {}
  const allTagIds = [...tagIds]
  for (const item of loaded) {
    transcription[item.transcriptionType] = item.transcription
    allTagIds.push(...item.tagIds)
  }
  return {
    transcription,
    tagIds: allTagIds,
    zoneTagIndex: { ...zoneTagIndex },
  }
}

/**
 * Starts loading a page, as two independent parts: its transcriptions, and
 * the tile source of its image. The text does not wait for the image server
 * to describe the image; each part is stored as soon as it arrives.
 *
 * `transcriptions` is null when they are already loaded, `image` when the
 * tile source is. Both are shared by every caller while the page loads.
 */
export function startFolioLoad(folioData) {
  const running = pending.get(folioData.id)
  if (running)
    return running
  const load = {
    transcriptions: hasTranscriptions(folioData)
      ? null
      : loadTranscriptions(folioData),
    image: folioData.tileSource ? null : loadTileSource(folioData),
  }
  if (!load.transcriptions && !load.image)
    return load
  // Shown as loading at once, as before: the transcription pane tells a page
  // still on its way from one that has no transcription.
  if (load.transcriptions)
    folioData.loading = true
  pending.set(folioData.id, load)
  Promise.allSettled([load.transcriptions, load.image]).then(() => {
    pending.delete(folioData.id)
  })
  return load
}

// returns transcription or error message if unable to parse
function parseTranscription(html, xml) {
  const transcriptionData = layoutMargin3(html)
  return {
    ...transcriptionData,
    xml,
  }
}
