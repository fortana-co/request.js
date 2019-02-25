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
  { method = 'GET', body = {}, params = {}, headers = {}, ...rest } = {}
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
const request = async (url, { headers: hdrs = {}, ...rest } = {}, backoff) => {
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json', ...hdrs }

  try {
    const response = await _request(url, { headers, ...rest })
    const { status, statusText, headers: responseHeaders, url: responseUrl } = response
    const fields = { status, statusText, headers: toObject(responseHeaders), url: responseUrl }

    let content
    if (headers.Accept === 'application/json') {
      try {
        content = (await response.json()) || {}
      } catch (exception) {
        content = {}
      }
    } else {
      content = (await response.text()) || '{}'
    }

    if (status >= 300) return { ...fields, error: content }
    return { ...fields, data: content }
  } catch (exception) {
    if (backoff) {
      const { retries = 3, delay = 1000, multiplier = 2, onRetry } = backoff
      if (retries > 0) {
        if (onRetry) onRetry({ exception }, { retries, delay })
        await timeout(delay)

        const nextBackoff = { retries: retries - 1, delay: delay * multiplier, multiplier, onRetry }
        return request(url, { headers, ...rest }, nextBackoff)
      }
    }
    return { exception }
  }
}

module.exports = request
