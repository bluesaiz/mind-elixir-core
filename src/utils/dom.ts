import { LEFT } from '../const'
import { encodeHTML } from '../utils/index'

// DOM manipulation
const $d = document
export const findEle = (id: string, instance?) => {
  const scope = instance ? instance.mindElixirBox : $d
  return scope.querySelector(`[data-nodeid=me${id}]`)
}

export const shapeTpc = function (tpc: Topic, nodeObj: NodeObj, mind: MindElixirInstance) {

  if (nodeObj.style) {
    tpc.style.color = nodeObj.style.color || null
    tpc.style.background = nodeObj.style.background || null
    tpc.style.fontSize = nodeObj.style.fontSize + 'px'
    tpc.style.fontWeight = nodeObj.style.fontWeight || 'normal'
  }


  if (nodeObj.type) {
    const typeContainer = $d.createElement('span')
    typeContainer.className = `me-node-type me-node-type-item ${mind.NodeTypeClassMap[nodeObj.type]}` // 
    typeContainer.textContent = nodeObj.type
    tpc.appendChild(typeContainer)
  }

  if(nodeObj.topic){
    const textContainer = $d.createElement('span')
    textContainer.className = 'me-node-text'
    textContainer.textContent = nodeObj.topic
    tpc.appendChild(textContainer)
  }

  if (nodeObj.image) {
    const img = nodeObj.image
    if (img.url && img.width && img.height) {
      const imgContainer = $d.createElement('img')
      imgContainer.src = img.url
      imgContainer.style.width = img.width + 'px'
      imgContainer.style.height = img.height + 'px'
      tpc.appendChild(imgContainer)
    } else {
      console.warn('image url/width/height are required')
    }
  }

  if (nodeObj.hyperLink) {
    const linkContainer = $d.createElement('a')
    linkContainer.className = 'hyper-link'
    linkContainer.target = '_blank'
    linkContainer.innerText = '🔗'
    linkContainer.href = nodeObj.hyperLink
    tpc.appendChild(linkContainer)
    tpc.linkContainer = linkContainer
    console.log(linkContainer)
  } else if (tpc.linkContainer) {
    tpc.linkContainer.remove()
    tpc.linkContainer = null
  }
  if (nodeObj.icons && nodeObj.icons.length) {
    const iconsContainer = $d.createElement('span')
    iconsContainer.className = 'icons'
    iconsContainer.innerHTML = nodeObj.icons.map(icon => `<span>${encodeHTML(icon)}</span>`).join('')
    tpc.appendChild(iconsContainer)
  }
  if (nodeObj.tags && nodeObj.tags.length) {
    const tagsContainer = $d.createElement('div')
    tagsContainer.className = 'tags'
    tagsContainer.innerHTML = nodeObj.tags.map(tag => `<span>${encodeHTML(tag)}</span>`).join('')
    tpc.appendChild(tagsContainer)
  }

  if (nodeObj.branchColor) {
    tpc.style.borderColor = nodeObj.branchColor
  }
}

// everything is staring from `Wrapper`
export const createWrapper: CreateWrapper = function (nodeObj, omitChildren) {
  const grp = $d.createElement('me-wrapper') as Wrapper
  const top = this.createParent(nodeObj)
  grp.appendChild(top)
  if (!omitChildren && nodeObj.children && nodeObj.children.length > 0) {
    top.appendChild(createExpander(nodeObj.expanded))
    if (nodeObj.expanded !== false) {
      const children = this.layoutChildren(nodeObj.children)
      grp.appendChild(children)
    }
  }
  return { grp, top }
}

export const createParent: CreateParent = function (nodeObj: NodeObj): Parent {
  const top = $d.createElement('me-parent') as Parent
  const tpc = this.createTopic(nodeObj)
  shapeTpc(tpc, nodeObj, this)
  top.appendChild(tpc)
  return top
}

export const createChildren: CreateChildren = function (wrappers) {
  const children = $d.createElement('me-children') as Children
  children.append(...wrappers)
  return children
}

export const createTopic: CreateTopic = function (nodeObj) {
  const topic = $d.createElement('me-tpc') as Topic
  topic.nodeObj = nodeObj
  topic.dataset.nodeid = 'me' + nodeObj.id
  topic.draggable = this.draggable
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

export const createInputDiv: CreateInputDiv = function (tpc) {
  console.time('createInputDiv')
  if (!tpc) return
  let div = $d.createElement('div')
  
  const textNode = tpc.querySelector('.me-node-text')
  const origin = textNode.textContent as string

  tpc.appendChild(div)
  div.id = 'input-box'
  div.textContent = origin
  div.contentEditable = 'true'
  div.spellcheck = false
  div.style.cssText = `min-width:${tpc.offsetWidth - 8}px;`
  if (this.direction === LEFT) div.style.right = '0'
  div.focus()

  selectText(div)
  this.inputDiv = div

  this.bus.fire('operation', {
    name: 'beginEdit',
    obj: tpc.nodeObj,
  })

  div.addEventListener('keydown', e => {
    e.stopPropagation()
    const key = e.key

    if (key === 'Enter' || key === 'Tab') {
      // keep wrap for shift enter
      if (e.shiftKey) return

      e.preventDefault()
      this.inputDiv.blur()
      this.map.focus()
    }
  })
  div.addEventListener('blur', () => {
    if (!div) return
    const node = tpc.nodeObj
    const topic = div.textContent!.trim()

    if (topic === '') node.topic = origin
    else node.topic = topic
    div.remove()
    this.inputDiv = div = null
    if (topic === origin) return
    const textNode = tpc.querySelector('.me-node-text')
    textNode.textContent = node.topic
    this.linkDiv()
    this.bus.fire('operation', {
      name: 'finishEdit',
      obj: node,
      origin,
    })
    // this.createNodeTypeSelect()
  })
  console.timeEnd('createInputDiv')
}





export const createNodeTypeSelect: CreateDiv = function (el: Topic | null  = null, moreInput = false) {
  console.time('createNodeTypeSelect')
  const tpc = el || this.currentNode
  let typeNode = tpc.querySelector(".me-node-type")

  let div = $d.createElement('div')

  tpc.appendChild(div)
  div.id = 'type-select-box'
  div.tabIndex = 150
  const origin = typeNode ? typeNode.textContent : ''
  const nodeTypes = this.nodeTypes
  let divInnerHtml = ''
  for(let i in nodeTypes){
    const typeContent = nodeTypes[i]
    divInnerHtml = divInnerHtml.concat(`<span class="me-node-type-item ${typeContent.className}">${typeContent.title}</span>\n`)
  }
  div.innerHTML = divInnerHtml
  div.style.cssText = `min-width:${tpc.offsetWidth - 8}px;`
  div.style.top = `${tpc.offsetHeight + 2}px`
  div.style.left = `${tpc.offsetWidth / 2 - div.offsetWidth / 2}px`
  if (this.direction === LEFT) div.style.right = '0'
  div.focus()

  this.typeSelectDiv = div


  div.onblur = (e) => {
    if (!div) return
    div.remove()
    if(moreInput){
      this.createInputDiv(tpc)
    }
  }

  div.onclick = (e) => {
    if (!div) return
    const selectedEle = e.target as HTMLElement
    if (!(selectedEle.classList.contains('me-node-type-item')) ) return
    const type = selectedEle.textContent
    const node = tpc.nodeObj

    node.type = type 
    div.onblur = null
    div.remove()
    this.typeSelectDiv = div = null

    if (type === origin) return
    let typeNode = tpc.querySelector('.me-node-type')
    if(!typeNode){
      typeNode = $d.createElement('span')
      tpc.insertBefore(typeNode, tpc.firstChild)
    }
    typeNode.textContent = node.type
    typeNode.className = `me-node-type ${selectedEle.className}`
    this.linkDiv()
    this.bus.fire('operation', {
      name: 'updateType',
      obj: node,
      origin,
    })
    if (moreInput) {
      this.createInputDiv(tpc)
    }
  }
  console.timeEnd('createNodeTypeSelect')
}




export const createExpander = function (expanded: boolean | undefined): Expander {
  const expander = $d.createElement('me-epd') as Expander
  // 包含未定义 expanded 的情况，未定义视为展开
  expander.expanded = expanded !== false
  expander.className = expanded !== false ? 'minus' : ''
  return expander
}
