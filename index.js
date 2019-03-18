const defaultStringify = require('./stringify')

let fetch
const req = module => require(module)
if (typeof window === 'undefined') fetch = req('node-fetch')
else fetch = window.fetch

const timeout = ms => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const toQs = (params, stringify = defaultStringify) => {
  const s = stringify(params)
  return s ? `?${s}` : ''
}

const toObject = headers => {
  const headersObject = {}
  for (const pair of headers.entries()) headersObject[pair[0]] = pair[1]
  return headersObject
}

const lowercased = object => {
  const obj = {}
  for (const key of Object.keys(object)) obj[key.toLowerCase()] = object[key]
  return obj
}

const _request = async (
  url,
  { method = 'GET', body = {}, params = {}, headers = {}, stringify, ...rest } = {},
) => {
  const options = {
    method,
    body: headers['content-type'] === 'application/json' ? JSON.stringify(body) : body,
    headers,
    ...rest,
  }

  if (['GET', 'HEAD'].indexOf(method.toUpperCase()) > -1) delete options.body

  return fetch(`${url}${toQs(params, stringify)}`, options)
}

/**
 * Returns response object with `data`, `type` (one of 'success', 'error', 'exception'),
 * along with other response properties.
 */
const request = async (url, { headers, retry, ...rest } = {}) => {
  let data,
    type,
    fields = {}
  const requestHeaders = {
    'content-type': 'application/json',
    accept: 'application/json',
    ...lowercased(headers || {}),
  }

  try {
    const response = await _request(url, { headers: requestHeaders, ...rest })
    const { status, statusText, headers: responseHeaders, url: responseUrl } = response
    fields = { status, statusText, headers: toObject(responseHeaders), url: responseUrl }

    const text = await response.text()
    if (requestHeaders.accept === 'application/json') {
      try {
        data = JSON.parse(text)
      } catch (e) {
        data = text
      }
    } else {
      data = text
    }

    if (status < 300) type = 'success'
    else type = 'error'
  } catch (e) {
    data = e
    type = 'exception'
  }

  const response = { ...fields, data, type }
  if (retry) {
    const {
      retries = 4,
      delay = 1000,
      multiplier = 2,
      shouldRetry = r => r.exception !== undefined,
    } = retry
    if (retries > 0 && shouldRetry(response, { retries, delay })) {
      await timeout(delay)

      const nextRetry = {
        retries: retries - 1,
        delay: delay * multiplier,
        multiplier,
        shouldRetry,
      }
      return request(url, { headers, retry: nextRetry, ...rest })
    }
  }
  return response
}

const requester = method => (url, options = {}) => request(url, { ...options, method })

module.exports = request
module.exports.del = requester('DELETE')
module.exports.delete = requester('DELETE')
module.exports.get = requester('GET')
module.exports.head = requester('HEAD')
module.exports.options = requester('OPTIONS')
module.exports.patch = requester('PATCH')
module.exports.post = requester('POST')
module.exports.put = requester('PUT')
