import { Visitor } from '@babel/core'
import { State } from './transformJsx'
import * as t from '@babel/types'

const visitor: Visitor<State> = {
  JSXElement: {
    enter(path, state) {
      const openElement = path.get('openingElement').node
      if (t.isJSXIdentifier(openElement.name)) {
        const { name } = openElement.name
        // TODO need cover scope identifier for gyron or @gyron/runtime
        if (name === 'Transition') {
          const children = path.get('children')
          children.forEach((path, index) => {
            if (path.isJSXElement()) {
              const openingElement = path.get('openingElement')
              const attr = [
                ...openingElement.node.attributes,
                t.jSXAttribute(
                  t.jsxIdentifier('key'),
                  t.stringLiteral(String(index))
                ),
              ]
              openingElement.replaceWith(
                t.jsxOpeningElement(openingElement.node.name, attr)
              )
            }
          })
        }
      }
    },
  },
}

export default visitor
