import React from 'react'

/**
 * The reading guide the project gives the viewer through its `readingGuide`
 * prop: how its own stylesheet presents the encoding, so it belongs to the
 * project rather than to EditionCrafter. Null when the project gives none.
 */
const ReadingGuideContext = React.createContext(null)

export default ReadingGuideContext
