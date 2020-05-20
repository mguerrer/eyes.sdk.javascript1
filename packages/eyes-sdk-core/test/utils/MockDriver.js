const {TypeUtils} = require('@applitools/eyes-common')
const EyesJsSnippets = require('../../lib/EyesJsSnippets')

const DEFAULT_STYLES = {
  'border-left-width': '0px',
  'border-top-width': '0px',
  overflow: null,
}

const DEFAULT_PROPS = {
  clientWidth: 300,
  clientHeight: 400,
  overflow: null,
}

class MockDriver {
  constructor() {
    this._scripts = new Map()
    this._elements = new Map()
    this._frames = new Map()
    this._document = {id: Symbol('documentId')}
    this._contextId = null
    this.mockScript(EyesJsSnippets.GET_CURRENT_CONTEXT_INFO, () => {
      const context = this._frames.get(this._contextId)
      const isRoot = !context
      const isCORS = !isRoot && context.isCORS
      const document = context ? context.document : this._document
      const selector = !isCORS && !isRoot ? context.element.selector : null
      return {isRoot, isCORS, document, selector}
    })
    this.mockScript(EyesJsSnippets.GET_FRAMES, () => {
      return Array.from(this._frames.values())
        .filter(frame => frame.parentId === this._contextId)
        .map(frame => ({isCORS: frame.isCORS, element: frame.element}))
    })
    this.mockScript('return document', () => {
      const context = this._frames.get(this._contextId)
      return context ? context.document : this._document
    })
    this.mockScript(EyesJsSnippets.GET_SCROLL_POSITION, () => {
      return [0, 0]
    })
    this.mockScript(EyesJsSnippets.GET_ELEMENT_RECT, element => {
      return element.rect || {x: 0, y: 0, width: 100, height: 100}
    })
    this.mockScript(EyesJsSnippets.GET_ELEMENT_CSS_PROPERTIES, (properties, element) => {
      return properties.map(
        property => (element.styles || {})[property] || DEFAULT_STYLES[property],
      )
    })
    this.mockScript(EyesJsSnippets.GET_ELEMENT_PROPERTIES, (properties, element) => {
      return properties.map(property => (element.props || {})[property] || DEFAULT_PROPS[property])
    })
  }
  mockScript(scriptMatcher, resultGenerator) {
    this._scripts.set(scriptMatcher, resultGenerator)
  }
  mockElement(selector, state) {
    const element = {
      id: Symbol('elementId'),
      selector,
      parentId: null,
      parentContextId: null,
      ...state,
    }
    let elements = this._elements.get(selector)
    if (!elements) {
      elements = []
      this._elements.set(selector, elements)
    }
    elements.push(element)
    if (element.frame) {
      const contextId = Symbol('contextId')
      this._frames.set(contextId, {
        id: contextId,
        parentId: state.parentContextId,
        isCORS: state.isCORS,
        element,
        document: {id: Symbol('documentId')},
      })
      element.contextId = contextId
    }
    return Object.freeze(element)
  }
  mockElements(nodes, {parentId = null, parentContextId = null} = {}) {
    for (const node of nodes) {
      const element = this.mockElement(node.selector, {...node, parentId, parentContextId})
      if (node.children) {
        this.mockElements(node.children, {
          parentId: element.frame ? null : element.id,
          parentContextId: element.frame ? this._frames.get(element.contextId).id : parentContextId,
        })
      }
    }
  }
  async executeScript(script, args = []) {
    for (const [scriptMatcher, resultGenerator] of this._scripts.entries()) {
      if (
        TypeUtils.isFunction(scriptMatcher) ? scriptMatcher(script, args) : scriptMatcher === script
      ) {
        return TypeUtils.isFunction(resultGenerator) ? resultGenerator(...args) : resultGenerator
      }
    }
  }
  async findElement(selector) {
    const elements = this._elements.get(selector)
    return elements ? elements.find(element => element.parentContextId === this._contextId) : null
  }
  async findElements(selector) {
    const elements = this._elements.get(selector)
    return elements ? elements.filter(element => element.parentContextId === this._contextId) : []
  }
  async switchToFrame(element) {
    if (element === null) {
      return (this._contextId = null)
    }
    const frame = this._frames.get(element.contextId)
    if (frame && this._contextId === frame.parentId) {
      return (this._contextId = frame.id)
    } else {
      throw new Error('Frame not found')
    }
  }
  async switchToParentFrame() {
    if (!this._contextId) return
    for (const frame of this._frames.values()) {
      if (frame.id === this._contextId) {
        return (this._contextId = frame.parentId)
      }
    }
  }
}

module.exports = MockDriver