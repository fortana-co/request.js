const stringify = require('./stringify')

let fetch
const req = module => require(module)
if (typeof window === 'undefined') fetch = req('node-fetch')
else fetch = window.fetch

const timeout = ms => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const toQs = params => {
  const s = stringify(params)
  return s ? `?${s}` : ''
}

const toObject = headers => {
  const headersObject = {}
  for (const pair of headers.entries()) headersObject[pair[0]] = pair[1]
  return headersObject
}

const _request = async (
  url,
  { method = 'GET', body = {}, params = {}, headers = {}, ...rest } = {},
) => {
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
const request = async (url, { headers: hdrs = {}, retry, ...rest } = {}) => {
  let value,
    type,
    fields = {}
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json', ...hdrs }

  try {
    const response = await _request(url, { headers, ...rest })
    const { status, statusText, headers: responseHeaders, url: responseUrl } = response
    fields = { status, statusText, headers: toObject(responseHeaders), url: responseUrl }

    const text = await response.text()
    if (headers.Accept === 'application/json') {
      try {
        value = JSON.parse(text)
      } catch (e) {
        value = text
      }
    } else {
      value = text
    }

    if (status < 300) type = 'data'
    else type = 'error'
  } catch (e) {
    value = e
    type = 'exception'
  }

  const response = { ...fields, value, type }
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
      return request(url, { headers: hdrs, retry: nextRetry, ...rest })
    }
  }
  return response
}

module.exports = request
