const parse = require('./transpile')
const standard = require('standard')
const browser = require('./transpile/ui/browser')

module.exports = (code, cb, ui) => {
  if (!ui) ui = browser
  console.log('\nstart parsing...', ui.id)
  const result = parse(code, ui)
  const raw = [ 'module.exports = ' ]
  const parseRaw = (result, key) => {
    if (typeof result === 'object') {
      if (key) {
        raw.push(key + ': ')
      }
      raw.push('{')
      for (let key in result) {
        parseRaw(result[key], key)
      }
      const l = raw.length - 1
      if (raw[l] && raw[l][raw[l].length - 1] === ',') {
        raw[l] = raw[l].slice(0, -1)
      }
      raw.push('},')
    } else {
      raw.push(key + ': ' + result + ',')
    }
  }
  parseRaw(result.subs)
  raw[raw.length - 1] = raw[raw.length - 1].slice(0, -1)
  const str = result.init + '\n' + raw.join('\n')
  standard.lintText(str, { fix: true }, (err, data) => {
    const messages = data.results
      .reduce((a, b) => a + b.messages
        .reduce((a, b) => b + `(${b.line}:${b.column}) ${b.message}`,
          ''),
        '')
    // not good enough
    console.log(messages)
    cb(err, err ? messages : data.results[0].output)
  })
}
