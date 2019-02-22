require('whatwg-fetch')
const qs = require('qs')

let fetch
const req = (module) => require(module)
if (typeof window === 'undefined') fetch = req('node-fetch')
else fetch = window.fetch

const toQs = (params) => {
  const s = qs.stringify(params)
  return s ? `?${s}` : ''
}

const _request = async (url, { method = 'GET', body = {}, params = {}, headers = {}, ...rest } = {}) => {
  const options = {
    method,
    body: headers['Content-Type'] === 'application/json' ? JSON.stringify(body) : body,
    headers,
    ...rest,
  }

  if (['GET', 'HEAD'].indexOf(method) > -1) delete options.body

  return fetch(`${url}${toQs(params)}`, options)
}

/**
 * Returns object with truthy value for exactly one of `data`, `error`, and
 * `exception` keys, along with other response properties.
 */
const request = async (url, { headers: hdrs = {}, ...rest } = {}) => {
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json', ...hdrs }

  try {
    const response = await _request(url, { headers, ...rest })
    const { headers: responseHeaders, status, statusText, redirected, url: responseUrl, type } = response
    const fields = { headers: responseHeaders, status, statusText, redirected, url: responseUrl, type }

    let content
    if (headers.Accept === 'application/json') {
      try {
        content = await response.json() || {}
      } catch (exception) {
        content = {}
      }
    } else {
      content = await response.text() || '{}'
    }

    if (status >= 400) return { ...fields, error: content }
    return { ...fields, data: content }
  } catch (exception) {
    return { exception }
  }
}

/**
 * Calls `requester`. If there's no exception (connection error), passes response
 * to `onResponse`. Else calls `requester` again, backing off exponentially.
 */
const requestBackoff = async (requester, onResponse, { retries = 3, initialDelay = 1000, multiplier = 2 } = {}) => {
  let count = 0
  let delay = initialDelay
  const inner = async () => {
    const response = await requester()
    if (onResponse) onResponse(response)

    if (response && response.exception) {
      if (count >= retries) return
      setTimeout(inner, delay)
      delay *= multiplier
      count += 1
    }
  }
  inner()
}

module.exports = request
module.exports.requestBackoff = requestBackoff
module.exports.toQs = toQs
