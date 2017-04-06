'use strict'
const render = require('../')
const test = require('tape')
const h = require('hub.js')
const { puid } = require('brisky-struct')

test('render', t => {


  const hub = h({ dirty: 'its some text', dweep: 'blue' })

  const briskyH = (storage, tag, id, attributes, children) => {
    const elem = document.createElement(tag)
    storage[id] = elem
    for (let i = 0; i < children.length; i++) {
      const child = children[i]

      // here we need to handle
      // other dom nodes

      if (child && typeof child === 'object' && child.inherits) {
        elem.appendChild((storage[id + i] = document.createTextNode(child.compute())))
      } else if (typeof child === 'string') {
        elem.appendChild(document.createTextNode(child))
      }
    }

    // needs to bind to props!!!!
    if (attributes) {
      for (let attr in attributes) {
        if (attr === 'style') {
          // handle style here
          const styles = attributes[attr]
          for (let key in styles) {
            const style = styles[key]
            if (style && typeof style === 'object' && style.inherits) {
              elem.style[key] = style.compute()
            } else {
              elem.style[key] = style
            }
          }
        }
      }
    }

    return elem
  }

  const getParent = (id, tree) => {
    var p = tree
    while (p) {
      if (p._ && (id in p._)) {
        return p._[id]
      }
      p = p._p
    }
  }

  const remove = (node) => {
    if (node) node.parentNode.removeChild(node)
  }

const B = (({ dirty, dweep = 'pink' }) => {
  return h('div', { style: { color: dweep } }, dirty)
})

  const render = (props) => {
    const tree = {}
    hub.subscribe({
      val: 'property', // to handle initial app
      _: {
        property: [
          (state, type, subs, tree) => {
            if (!tree._) tree._ = {}
            if (type === 'remove') {
              remove(tree._[1])
            } else if (type === 'new') {
              const dirty = state.get('dirty', '') // since its bound to text
              const dweep = state.get('dweep', 'pink') // default

              const storage = {}
              briskyH(
                storage,
                'div',
                'node',
                { style: { color: dweep } },
                [ dirty ]
                // coninuation of other STATE elements are a bit harder -- need to find your parent
                // probably add parent id to the function to fin it
              )
              tree._[1] = storage
              // add to parent
            }
          }
        ]
      },
      dirty: {
        val: 'shallow',
        _: {
          update: [
            (state, type, subs, tree) => {
              getParent(1, tree).node0.nodeValue = state.compute()
            }
          ]
        }
      },
      dweep: {
        val: 'shallow',
        _: {
          update: [
            (state, type, subs, tree) => {
              getParent(1, tree).node.style.color = state.compute()
            }
          ]
        }
      }
    }, (state, type, subs, tree) => {
      const _ = subs._
      if (_) {
        if (type !== 'update') {
          if (_.property) {
            let i = _.property.length
            while (i--) _.property[i](state, type, subs, tree)
          }
        } else if (_.update) {
          let i = _.update.length
          while (i--) _.update[i](state, type, subs, tree)
        }
      }
    }, true, tree)
    return tree._[1].node
  }

  // render(B, hub)
  document.body.appendChild(render(hub))

  const timeout = i => new Promise(resolve => {
    setTimeout(() => resolve(i), 10)
  })

  // hub.set({
  //   dirty: function * () {
  //     let i = 100
  //     while (i--) { yield timeout(i) }
  //   }
  // })

  let d = Date.now()
  let i = 1e5
  while (i--) {
    hub.set({
      dweep: i % 2 ? 'orange' : 'purple',
      dirty: i
    })
  }
  console.log(Date.now() - d, 'ms')

  t.end()
})
