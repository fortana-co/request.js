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

const shouldStringify = object => {
  const objectType = {}.toString.call(object)
  return objectType === '[object Object]' || objectType === '[object Array]'
}

const _request = async (url, { method = 'GET', headers = {}, params = {}, body, jsonOut, stringify, ...rest } = {}) => {
  const jsonHeaders = {}
  let requestBody = body

  if (shouldStringify(body)) {
    jsonHeaders['content-type'] = 'application/json'
    requestBody = JSON.stringify(body)
  }
  if (jsonOut) jsonHeaders.accept = 'application/json'

  const requestHeaders = {
    ...jsonHeaders,
    ...lowercased(headers),
  }

  const options = {
    method,
    headers: requestHeaders,
    body: requestBody,
    ...rest,
  }

  if (['GET', 'HEAD'].indexOf(method.toUpperCase()) > -1) delete options.body

  return fetch(`${url}${toQs(params, stringify)}`, options)
}

/**
 * Returns response object with `data`, `type` (one of 'success', 'error', 'exception'),
 * along with other response properties.
 */
const request = async (url, { retry, jsonOut = true, ...rest } = {}) => {
  let data,
    type,
    fields = {}

  try {
    const response = await _request(url, { jsonOut, ...rest })
    const { status, statusText, headers: responseHeaders, url: responseUrl } = response
    fields = { status, statusText, headers: toObject(responseHeaders), url: responseUrl }

    if (jsonOut) {
      const text = await response.text()
      try {
        data = JSON.parse(text)
      } catch (e) {
        data = text
      }
    } else {
      data = response
    }

    if (status < 300) type = 'success'
    else type = 'error'
  } catch (e) {
    data = e
    type = 'exception'
  }

  const response = { ...fields, data, type }
  if (retry) {
    const { retries = 4, delay = 1000, multiplier = 2, shouldRetry = r => r.type === 'exception' } = retry
    if (retries > 0 && shouldRetry(response, { retries, delay })) {
      await timeout(delay)

      const nextRetry = {
        retries: retries - 1,
        delay: delay * multiplier,
        multiplier,
        shouldRetry,
      }
      return request(url, { retry: nextRetry, jsonOut, ...rest })
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
