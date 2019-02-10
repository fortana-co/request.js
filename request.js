import 'whatwg-fetch'
import qs from 'qs'

const toQs = (params) => {
  const s = qs.stringify(params)
  return s ? `?${s}` : ''
}

const _request = async (url, { method = 'GET', body = {}, params = {}, headers = {} } = {}) => {
  const options = {
    method,
    body: JSON.stringify(body), // `body` must be a string, not an object
    headers: new Headers({ ...headers, 'Content-Type': 'application/json', Accept: 'application/json' }),
  }

  if (['GET', 'HEAD'].indexOf(method) > -1) delete options.body

  return fetch(`${url}${toQs(params)}`, options)
}

/**
 * Guarantees that object returned has truthy value for exactly one of `data`,
 * `error`, and `exception` keys.
 */
const request = async (url, params = {}) => {
  try {
    const r = await _request(url, params)
    const { status, headers } = r

    let data
    try {
      data = await r.json() || {}
    } catch (exception) {
      data = {}
    }

    if (status >= 400) return { error: data, status, headers }
    return { data, status, headers }
  } catch (exception) {
    return { exception }
  }
}

/**
 * Calls `requester`. If there's no connection error, passes response to
 * `onResponse`. Else calls requester again, backing off exponentially.
 */
const requestBackoff = async (requester, onResponse, { retries = 3, initialDelay = 1000, multiplier = 2 } = {}) => {
  let count = 0
  let delay = initialDelay
  const inner = async () => {
    const response = await requester()
    onResponse(response)

    if (response.exception) {
      if (count >= retries) return
      setTimeout(inner, delay)
      delay *= multiplier
      count += 1
    }
  }
  inner()
}

export default request
export { toQs, requestBackoff }
