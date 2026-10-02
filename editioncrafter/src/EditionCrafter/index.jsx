import { createTheme, ThemeProvider } from '@material-ui/core/styles'
import React from 'react'
import DiploMatic from './component/DiploMatic'
import ReadingGuideContext from './component/ReadingGuideContext'
import { createReduxStore } from './model/ReduxStore'
import './scss/editioncrafter.scss'

/**
 * Default instantiation
 */
function EditionCrafter(props) {
  const theme = createTheme({
    palette: {
      primary: {
        main: '#792421',
      },
      secondary: {
        main: '#EBE3DD',
      },
    },
  })

  const tagExplorerMode = props.tagExplorerMode === true

  return (
    <ThemeProvider theme={theme}>
      <ReadingGuideContext.Provider value={props.readingGuide ?? null}>
        <DiploMatic config={props} store={createReduxStore(props)} tagExplorerMode={tagExplorerMode} />
      </ReadingGuideContext.Provider>
    </ThemeProvider>
  )
}

export default EditionCrafter
