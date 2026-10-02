import ClickAwayListener from '@material-ui/core/ClickAwayListener'
import Fade from '@material-ui/core/Fade'
import Paper from '@material-ui/core/Paper'
import Popper from '@material-ui/core/Popper'
import Typography from '@material-ui/core/Typography'
import Parser from 'html-react-parser'
import React, { useContext, useEffect, useRef } from 'react'
import { BsFillGrid3X3GapFill } from 'react-icons/bs'
import { FaCode, FaHandPointRight } from 'react-icons/fa'
import { GoTag } from 'react-icons/go'
import { HiOutlineBookOpen } from 'react-icons/hi'
import { IoArrowBackCircleOutline, IoArrowForwardCircleOutline, IoLockOpenOutline } from 'react-icons/io5'
import DocumentPagesIcon from '../icons/DocumentPagesIcon'
import ReadingGuideContext from './ReadingGuideContext'
import { htmlToReactParserOptions } from './TranscriptionView'

// The buttons of the toolbar, with the icons the toolbar itself shows.
const TOOLBAR_BUTTONS = [
  { icon: <BsFillGrid3X3GapFill />, label: 'Show all the pages' },
  {
    icon: (
      <>
        <IoArrowBackCircleOutline />
        <IoArrowForwardCircleOutline />
      </>
    ),
    label: 'Go back / forward one page',
  },
  { icon: <FaHandPointRight />, label: 'Click the page name to jump to a page' },
  {
    icon: (
      <>
        <HiOutlineBookOpen />
        <DocumentPagesIcon />
      </>
    ),
    label: 'Book mode: two pages side by side, or one page',
  },
  { icon: <IoLockOpenOutline />, label: 'Sync views: both panes turn pages together' },
  { icon: <FaCode />, label: 'Show the XML of the page' },
  { icon: <GoTag />, label: 'Show the tags of the page, when the edition has some' },
]

/**
 * A reading-guide example, written with the `tei-*` elements a transcription
 * is made of and shown exactly as in one: the project's stylesheet styles it,
 * and a note becomes the same marker as in the text.
 */
function GuideExample({ html }) {
  return Parser(html, htmlToReactParserOptions(null, [], null))
}

function HelpPopper({ anchorEl, open, onClose, marginStyle }) {
  const readingGuide = useContext(ReadingGuideContext)
  const paperRef = useRef(null)

  // Opened, the menu takes the focus, so that leaving it can close it.
  useEffect(() => {
    if (open)
      paperRef.current?.focus()
  }, [open])

  // The button that toggles the menu handles its own clicks.
  const onClickAway = (event) => {
    if (anchorEl?.contains(event.target))
      return
    onClose()
  }

  // Focus moving elsewhere on the page closes the menu; focus leaving the
  // window altogether (no next element) does not.
  const onBlur = (event) => {
    const next = event.relatedTarget
    if (!next || paperRef.current?.contains(next) || anchorEl?.contains(next))
      return
    onClose()
  }

  const onKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.stopPropagation()
      onClose()
      anchorEl?.focus?.()
    }
  }

  return (
    // Kept inside the viewer rather than at the end of the page, so that the
    // viewer's styles — and the project's — reach it.
    <Popper anchorEl={anchorEl} open={open} style={marginStyle} disablePortal placement="bottom-end">
      <ClickAwayListener onClickAway={onClickAway}>
        <Fade in={open}>
          <Paper
            className="helpContainer"
            ref={paperRef}
            tabIndex={-1}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            role="dialog"
            aria-label="Help"
          >
            <Typography variant="h6" component="h2">Toolbar Buttons</Typography>
            <table className="help-table">
              <tbody>
                {TOOLBAR_BUTTONS.map(({ icon, label }) => (
                  <tr key={label}>
                    <td className="help-icon">{icon}</td>
                    <td><Typography>{label}</Typography></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {readingGuide?.length > 0 && (
              <div className="readingGuide">
                <Typography variant="h6" component="h2">Reading Guide</Typography>
                <table className="help-table">
                  <tbody>
                    {readingGuide.map(({ example, meaning }) => (
                      <tr key={`${example}\u0000${meaning}`}>
                        <td className="help-example"><GuideExample html={example} /></td>
                        <td><Typography>{meaning}</Typography></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Paper>
        </Fade>
      </ClickAwayListener>
    </Popper>
  )
}

export default HelpPopper
