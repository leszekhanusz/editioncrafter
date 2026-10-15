import Fade from '@material-ui/core/Fade'
import Paper from '@material-ui/core/Paper'
import Popper from '@material-ui/core/Popper'
import Typography from '@material-ui/core/Typography'
import Parser from 'html-react-parser'
import React, { useState } from 'react'

function EditorComment(props) {
  const [anchorRef, setAnchorRef] = useState(null)
  const [open, setOpen] = useState(false)

  const onOpen = (event) => {
    setAnchorRef(event.currentTarget)
    setOpen(true)
  }

  const onClose = (event) => {
    setOpen(false)
  }

  const renderPopper = () => {
    const interpreted = Parser(props.text)
    const content = interpreted || `ERROR: Could not find comment for id: ${props.commentID}.`
    const style = { maxWidth: 200, padding: '25px 15px 15px 15px' }
    const closeXStyle = { float: 'right', padding: 5, fontStyle: 'bold' }

    // Above the page's menus, which would otherwise cover the note.
    return (
      <Popper id={`${props.commentID}-content`} open={open} anchorEl={anchorRef} style={{ zIndex: 10 }}>
        <Fade in={open}>
          <Paper className="editor-comment-content" data-type={props.type}>
            <div onClick={onClose} style={closeXStyle}>
              <span className="fa fa-window-close" />
            </div>
            <Typography style={style}>{content}</Typography>
          </Paper>
        </Fade>
      </Popper>
    )
  }

  // The note stays a `tei-note`, with its attributes and without its text:
  // the same stylesheet rules draw it here and in a CETEIcean rendering of
  // the TEI (TEIEdit's preview), its asterisk included (`tei-note::before`),
  // and its `type` tells kinds of notes apart. The box it opens is rendered
  // beside it, not in it, so that a click in the box does not reach it.
  return (
    <>
      <tei-note
        data-origname="note"
        // React (17 and 18) sets the attributes of a custom element as they are
        // named: `className` would not become `class`.
        class="editor-comment"
        id={props.noteId}
        type={props.type}
        role="button"
        tabIndex={0}
        aria-label="Note"
        onClick={e => onOpen(e)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onOpen(e)
          }
        }}
      />
      {renderPopper()}
    </>
  )
}

export default EditorComment
