import React from 'react'
import { FaFilm, FaVolumeUp } from 'react-icons/fa'

// Pausing on close: a closed <details> hides its player but would let it
// play on, heard and not seen.
function pauseWhenClosed(event) {
  const details = event.currentTarget
  if (details.open)
    return
  details.querySelectorAll('video, audio').forEach(player => player.pause())
}

/**
 * The player of a TEI <media> element: a button with a film icon (a speaker
 * for audio) and a caret, standing where the element is in the text, which
 * opens the video as a block with the element's description under it, and
 * closes it again. The browser's own controls play it and take it fullscreen.
 */
function MediaPlayer({ url, mimeType, children }) {
  const audio = Boolean(mimeType?.startsWith('audio/'))
  const Player = audio ? 'audio' : 'video'
  const label = audio ? 'Audio' : 'Video'
  return (
    <details className="media-player" onToggle={pauseWhenClosed}>
      <summary aria-label={label} title={label}>
        {audio ? <FaVolumeUp aria-hidden="true" /> : <FaFilm aria-hidden="true" />}
      </summary>
      <Player controls preload="metadata">
        <source src={url} type={mimeType || undefined} />
      </Player>
      {children}
    </details>
  )
}

export default MediaPlayer
