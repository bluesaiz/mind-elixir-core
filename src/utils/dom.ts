import { LEFT } from '../const'
import type { Topic, Wrapper, Parent, Children, Expander } from '../types/dom'
import type { MindElixirInstance, NodeObj } from '../types/index'
import { encodeHTML, getOffsetLT } from '../utils/index'
import { layoutChildren } from './layout'

// DOM manipulation
const $d = document
export const findEle = function (this: MindElixirInstance, id: string, el?: HTMLElement) {
  const scope = this?.el ? this.el : el ? el : document
  const ele = scope.querySelector<Topic>(`[data-nodeid="me${id}"]`)
  if (!ele) throw new Error(`FindEle: Node ${id} not found, maybe it's collapsed.`)
  return ele
}

export const shapeTpc = function (this: MindElixirInstance, tpc: Topic, nodeObj: NodeObj) {
  tpc.innerHTML = ''

  if (nodeObj.style) {
    const style = nodeObj.style
    type KeyOfStyle = keyof typeof style
    for (const key in style) {
      tpc.style[key as KeyOfStyle] = style[key as KeyOfStyle]!
    }
  }

  if (nodeObj.dangerouslySetInnerHTML) {
    tpc.innerHTML = nodeObj.dangerouslySetInnerHTML
    return
  }

  if (nodeObj.image) {
    const img = nodeObj.image
    if (img.url && img.width && img.height) {
      const imgEl = $d.createElement('img')
      // Use imageProxy function if provided, otherwise use original URL
      imgEl.src = this.imageProxy ? this.imageProxy(img.url) : img.url
      imgEl.style.width = img.width + 'px'
      imgEl.style.height = img.height + 'px'
      if (img.fit) imgEl.style.objectFit = img.fit
      tpc.appendChild(imgEl)
      tpc.image = imgEl
    } else {
      console.warn('Image url/width/height are required')
    }
  } else if (tpc.image) {
    tpc.image = undefined
  }

  if (nodeObj.type) {
    const typeContainer = $d.createElement('span')
    const typeInfo = this.nodeTypes[nodeObj.type]
    if (typeInfo) {
      typeContainer.className = `me-node-type me-node-type-item ${typeInfo.className}`
      typeContainer.textContent = typeInfo.title
      tpc.appendChild(typeContainer)
    }
  }

  {
    const textEl = $d.createElement('span')
    textEl.className = 'text'

    // Check if markdown parser is provided and topic contains markdown syntax
    if (this.markdown) {
      textEl.innerHTML = this.markdown(nodeObj.topic, nodeObj)
    } else {
      textEl.textContent = nodeObj.topic
    }

    tpc.appendChild(textEl)
    tpc.text = textEl
  }

  if (nodeObj.hyperLink) {
    const linkEl = $d.createElement('a')
    linkEl.className = 'hyper-link'
    linkEl.target = '_blank'
    linkEl.innerText = '🔗'
    linkEl.href = nodeObj.hyperLink
    tpc.appendChild(linkEl)
    tpc.link = linkEl
  } else if (tpc.link) {
    tpc.link = undefined
  }

  if (nodeObj.icons && nodeObj.icons.length) {
    const iconsEl = $d.createElement('span')
    iconsEl.className = 'icons'
    iconsEl.innerHTML = nodeObj.icons.map(icon => `<span>${encodeHTML(icon)}</span>`).join('')
    tpc.appendChild(iconsEl)
    tpc.icons = iconsEl
  } else if (tpc.icons) {
    tpc.icons = undefined
  }

  if (nodeObj.tags && nodeObj.tags.length) {
    const tagsEl = $d.createElement('div')
    tagsEl.className = 'tags'

    nodeObj.tags.forEach(tag => {
      const span = $d.createElement('span')

      if (typeof tag === 'string') {
        span.textContent = tag
      } else {
        span.textContent = tag.text
        if (tag.className) {
          span.className = tag.className
        }
        if (tag.style) {
          Object.assign(span.style, tag.style)
        }
      }

      tagsEl.appendChild(span)
    })

    tpc.appendChild(tagsEl)
    tpc.tags = tagsEl
  } else if (tpc.tags) {
    tpc.tags = undefined
  }
}

// everything start from `Wrapper`
export const createWrapper = function (this: MindElixirInstance, nodeObj: NodeObj, omitChildren?: boolean) {
  const grp = $d.createElement('me-wrapper') as Wrapper
  const { p, tpc } = this.createParent(nodeObj)
  grp.appendChild(p)
  if (!omitChildren && nodeObj.children && nodeObj.children.length > 0) {
    const expander = createExpander(nodeObj.expanded)
    p.appendChild(expander)
    // tpc.expander = expander
    if (nodeObj.expanded !== false) {
      const children = layoutChildren(this, nodeObj.children)
      grp.appendChild(children)
    }
  }
  return { grp, top: p, tpc }
}

export const createParent = function (this: MindElixirInstance, nodeObj: NodeObj) {
  const p = $d.createElement('me-parent') as Parent
  const tpc = this.createTopic(nodeObj)
  shapeTpc.call(this, tpc, nodeObj)
  p.appendChild(tpc)
  return { p, tpc }
}

export const createChildren = function (this: MindElixirInstance, wrappers: Wrapper[]) {
  const children = $d.createElement('me-children') as Children
  children.append(...wrappers)
  return children
}

export const createTopic = function (this: MindElixirInstance, nodeObj: NodeObj) {
  const topic = $d.createElement('me-tpc') as Topic
  topic.nodeObj = nodeObj
  topic.dataset.nodeid = 'me' + nodeObj.id
  return topic
}

export function selectText(div: HTMLElement) {
  const range = $d.createRange()
  range.selectNodeContents(div)
  const getSelection = window.getSelection()
  if (getSelection) {
    getSelection.removeAllRanges()
    getSelection.addRange(range)
  }
}

export const editTopic = function (this: MindElixirInstance, el: Topic) {
  console.time('editTopic')
  if (!el) return
  const div = $d.createElement('div')
  const node = el.nodeObj

  // Get the original content from topic
  const originalContent = node.topic

  // Use getOffsetLT to calculate el's offset relative to this.nodes
  const { offsetLeft, offsetTop } = getOffsetLT(this.nodes, el)
  const typeBadge = el.querySelector('.me-node-type') as HTMLElement | null
  const typeOffsetY = typeBadge ? typeBadge.offsetHeight + 6 : 0

  // Insert input box into this.nodes instead of el
  this.nodes.appendChild(div)
  div.id = 'input-box'
  div.textContent = originalContent
  div.contentEditable = 'plaintext-only'
  div.spellcheck = false
  const style = getComputedStyle(el)
  div.style.cssText = `
  left: ${offsetLeft}px;
  top: ${offsetTop + typeOffsetY}px;
  min-width:${el.offsetWidth - 8}px;
  color:${style.color};
  font-size:${style.fontSize};
  padding:${style.padding};
  margin:${style.margin}; 
  background-color:${style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor};
  border: ${style.border};
  border-radius:${style.borderRadius}; `
  if (this.direction === LEFT) div.style.right = '0'

  selectText(div)

  this.bus.fire('operation', {
    name: 'beginEdit',
    obj: el.nodeObj,
  })

  div.addEventListener('keydown', e => {
    e.stopPropagation()
    const key = e.key

    if (key === 'Enter' || key === 'Tab') {
      // keep wrap for shift enter
      if (e.shiftKey) return

      e.preventDefault()
      div.blur()
      this.container.focus()
    }
  })

  div.addEventListener('blur', () => {
    if (!div) return
    div.remove()
    const inputContent = div.textContent?.trim() || ''
    if (inputContent === originalContent || inputContent === '') return

    // Update topic content
    node.topic = inputContent

    if (this.markdown) {
      el.text.innerHTML = this.markdown(node.topic, node)
    } else {
      el.text.textContent = inputContent
    }

    this.linkDiv()
    this.bus.fire('operation', {
      name: 'finishEdit',
      obj: node,
      origin: originalContent,
    })
  })
  console.timeEnd('editTopic')
}

export const createExpander = function (expanded: boolean | undefined): Expander {
  const expander = $d.createElement('me-epd') as Expander
  // if expanded is undefined, treat as expanded
  expander.expanded = expanded !== false
  expander.className = expanded !== false ? 'minus' : ''
  return expander
}

export const createNodeTypeSelect = function (this: MindElixirInstance, el: Topic | null = null, moreInput = false) {
  console.time('createNodeTypeSelect')
  const tpc = el || this.currentNode
  if (!tpc) return
  const div = $d.createElement('div')

  tpc.appendChild(div)
  div.id = 'type-select-box'
  div.tabIndex = 150
  const node = tpc.nodeObj
  const origin = { ...node }
  const nodeTypes = this.nodeTypes

  div.innerHTML = ''
  const items: HTMLSpanElement[] = []
  let currentIndex = 0
  for (const i in nodeTypes) {
    const typeContent = nodeTypes[i]
    const span = $d.createElement('span')
    span.className = `me-node-type-item ${typeContent.className}`
    span.textContent = typeContent.title
    span.tabIndex = 0
    if (node.type && typeContent.title === node.type) {
      currentIndex = items.length
    }
    span.onclick = e => {
      e.stopPropagation() // prevent triggering div.onclick if any
      const typeTitle = span.textContent
      const node = tpc.nodeObj
      const originalType = node.type // Store original type before modification

      // Find the key (type) based on the title
      let typeKey = ''
      for (const key in this.nodeTypes) {
        if (this.nodeTypes[key].title === typeTitle) {
          typeKey = key
          break
        }
      }

      node.type = typeKey || undefined
      div.onblur = null
      div.remove()
      this.typeSelectDiv = undefined

      // Compare with the key stored in nodeTypes, not the display title
      if (typeKey === originalType) return

      shapeTpc.call(this, tpc, node)
      this.linkDiv()
      this.bus.fire('operation', {
        name: 'reshapeNode',
        obj: node,
        origin,
      })
      if (moreInput) {
        this.editTopic(tpc)
      }
    }
    div.appendChild(span)
    items.push(span)
  }

  div.style.cssText = `min-width:${tpc.offsetWidth - 8}px;`
  div.style.top = `${tpc.offsetHeight + 2}px`
  div.style.left = `${tpc.offsetWidth / 2 - div.offsetWidth / 2}px`
  if (this.direction === LEFT) div.style.right = '0'
  div.focus()
  // focus initial item
  if (items.length) {
    items[currentIndex].focus()
  }

  this.typeSelectDiv = div

  div.addEventListener('mousedown', e => {
    e.stopPropagation()
    e.preventDefault()
  })

  const focusItem = (idx: number) => {
    if (!items.length) return
    currentIndex = (idx + items.length) % items.length
    items[currentIndex].focus()
  }
  const selectCurrent = () => {
    if (!items.length) return
    items[currentIndex].click()
  }
  div.addEventListener('keydown', e => {
    e.stopPropagation()
    if (e.key === 'Tab') {
      e.preventDefault()
      focusItem(currentIndex + (e.shiftKey ? -1 : 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      selectCurrent()
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      focusItem(currentIndex + 1)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      focusItem(currentIndex - 1)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      div.onblur = null
      div.remove()
      this.typeSelectDiv = undefined
      if (moreInput) {
        this.editTopic(tpc)
      }
    }
  })

  div.onblur = e => {
    if (!div) return
    div.remove()
    if (moreInput) {
      this.editTopic(tpc)
    }
  }

  console.timeEnd('createNodeTypeSelect')
}
