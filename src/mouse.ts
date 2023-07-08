import dragMoveHelper from './utils/dragMoveHelper'

export default function (mind) {
  mind.map.addEventListener('click', e => {
    // if (dragMoveHelper.afterMoving) return
    // e.preventDefault() // can cause <a /> tags don't work

    if (e.target.tagName === 'ME-EPD') {
      mind.expandNode(e.target.previousSibling)
    } else if (!mind.editable) {
      return
    } else if (e.target.parentElement.tagName === 'ME-PARENT' || e.target.parentElement.tagName === 'ME-ROOT') {
      mind.selectNode(e.target, false, e)
    } else if ( ['me-node-text'].includes(e.target.className)  && e.target.parentElement.tagName === 'ME-TPC'){
      mind.selectNode(e.target.parentElement, false, e)
    } else if ( e.target.classList.contains('me-node-type')  && e.target.parentElement.tagName === 'ME-TPC'){
      const tpc = e.target.parentElement
      mind.selectNode(tpc, false, e)
      mind.createNodeTypeSelect(tpc)
    } else if (e.target.tagName === 'path') {
      if (e.target.parentElement.tagName === 'g') {
        mind.selectLink(e.target.parentElement)
      }
    } else if (e.target.className === 'circle') {
      // skip circle
    } else {
      mind.unselectNode()
      // lite version doesn't have hideLinkController
      mind.hideLinkController && mind.hideLinkController()
    }
  })

  mind.map.addEventListener('dblclick', e => {
    e.preventDefault()

    if (!mind.editable) return
    if (e.target.parentElement.tagName === 'ME-PARENT' || e.target.parentElement.tagName === 'ME-ROOT') {
      mind.beginEdit(e.target)
    }
    if (e.target.className === 'me-node-text') {
      mind.beginEdit(e.target.parentElement)
    }
  })

  /**
   * drag and move
   */
  mind.map.addEventListener('mousemove', e => {
    // click trigger mousemove in windows chrome
    // the 'true' is a string
    if (e.target.contentEditable !== 'true') {
      dragMoveHelper.onMove(e, mind.container)
    }
  })
  mind.map.addEventListener('mousedown', e => {
    if (e.target.contentEditable !== 'true') {
      dragMoveHelper.afterMoving = false
      dragMoveHelper.mousedown = true
    }
  })
  mind.map.addEventListener('mouseleave', e => {
    dragMoveHelper.clear()
  })
  mind.map.addEventListener('mouseup', e => {
    dragMoveHelper.clear()
  })
}
