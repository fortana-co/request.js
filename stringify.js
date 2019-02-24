// based on: https://github.com/Gozala/querystring/blob/master/encode.js
const stringifyPrimitive = function(v) {
  switch (typeof v) {
  case 'string':
    return v

  case 'boolean':
    return v ? 'true' : 'false'

  case 'number':
    return isFinite(v) ? v : ''

  default:
    return ''
  }
}

module.exports = function(obj) {
  if (!obj) return ''

  const sep = '&'
  const eq = '='

  return Object.keys(obj).map(function(k) {
    const ks = encodeURIComponent(stringifyPrimitive(k)) + eq
    if (Array.isArray(obj[k])) {
      return obj[k].map(function(v) {
        return ks + encodeURIComponent(stringifyPrimitive(v))
      }).join(sep)
    } else {
      return ks + encodeURIComponent(stringifyPrimitive(obj[k]))
    }
  }).filter(Boolean).join(sep)
}
