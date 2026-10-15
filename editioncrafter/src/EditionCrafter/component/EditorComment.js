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
      <Popper id={props.commentID} open={open} anchorEl={anchorRef} style={{ zIndex: 10 }}>
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

  // The note's `type` is kept, so that a site can tell kinds of notes apart:
  // `.editor-comment[data-type~="…"] .editor-comment-asterisk`.
  return (
    <div className="editor-comment" data-type={props.type}>
      <span className="editor-comment-asterisk" onClick={e => onOpen(e)}>*</span>
      {renderPopper()}
    </div>
  )
}

export default EditorComment
