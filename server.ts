import {
  Options,
  Method,
  Headers as ReqHeaders,
  Retry,
  RequestFn,
  RequestMod as RequestModule,
  Response as ReqResponse,
  BaseResponse,
  SuccessResponse,
  ErrorResponse,
  ExceptionResponse,
} from './types'
const defaultStringify = require('./stringify')

// @browser-ignore
const fetch: (url: string, options?: {}) => Promise<Response> = require('node-fetch')
const AbortController: { new (): AbortController; prototype: AbortController } = require('abort-controller')
// @browser-ignore

const sleep = (ms: number): Promise<string> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const toQs = (params: {}, stringify: { (params: {}): string } = defaultStringify): string => {
  const s = stringify(params)
  return s ? `?${s}` : ''
}

const toObject = (headers: Headers): { [propName: string]: string } => {
  const headersObject: { [key: string]: any } = {}

  // https://stackoverflow.com/questions/49218765/typescript-and-iterator-type-iterableiteratort-is-not-an-array-type
  for (const [key, value] of Array.from(headers.entries())) {
    headersObject[key] = value
  }
  return headersObject
}

const lowercased = (object: { [key: string]: any }): { [key: string]: any } => {
  const obj: { [key: string]: any } = {}
  for (const key of Object.keys(object)) obj[key.toLowerCase()] = object[key]
  return obj
}

const shouldStringify = (object: {}): boolean => {
  const objectType = {}.toString.call(object)
  return objectType === '[object Object]' || objectType === '[object Array]'
}

const getTimeoutSignal = (ms?: number) => {
  if (!ms || typeof AbortController === 'undefined') return undefined
  const controller = new AbortController()
  setTimeout(() => controller.abort(), ms)
  return controller.signal
}

async function _request(
  url: string,
  { method = 'GET', headers = {}, params = {}, body, jsonOut, stringify, ...rest }: Options,
): Promise<Response> {
  const jsonHeaders: ReqHeaders = {}
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
 * Sends request to URL and returns promise that resolves to a response object.
 *
 * @param url - Fully qualified URL
 * @param options - Basically the fetch init object (see README for differences)
 *
 * @returns A promise that resolves to a response object
 */
const request = (async <T = any, ET = any>(url: string, options?: Options<T, ET>): Promise<ReqResponse<T, ET>> => {
  const { retry, timeout, jsonOut = true, ...rest } = options || ({} as Options)
  let response: SuccessResponse<T> | ErrorResponse<ET> | ExceptionResponse, data

  const signal = getTimeoutSignal(timeout)
  try {
    const res = await _request(url, { jsonOut, signal, ...rest })
    const { status, statusText, headers: responseHeaders, url: responseUrl } = res
    const fields: BaseResponse = { status, statusText, headers: toObject(responseHeaders), url: responseUrl }

    if (jsonOut) {
      const text = await res.text()
      try {
        data = JSON.parse(text)
      } catch (e) {
        data = text
      }
    } else {
      data = res
    }

    // Any response without the data you're looking for (status >= 300) is an error
    if (status < 300) response = { ...fields, data, type: 'success' }
    else response = { ...fields, data, type: 'error' }
  } catch (e) {
    response = { data: e as Error, type: 'exception' }
  }

  if (retry) {
    const { retries, delay, multiplier = 2, shouldRetry = res => res.type === 'exception' }: Retry<T, ET> = retry
    if (retries > 0 && shouldRetry(response, { retries, delay })) {
      await sleep(delay)

      const nextRetry: Retry<T, ET> = {
        retries: retries - 1,
        delay: delay * multiplier,
        multiplier,
        shouldRetry,
      }
      return request(url, { retry: nextRetry, timeout, jsonOut, ...rest })
    }
  }
  return response
}) as RequestModule

function requester(method: Method): RequestFn {
  return <T = any, ET = any>(url: string, options?: Options<T, ET>) => request<T, ET>(url, { ...options, method })
}

request.delete = requester('DELETE')
const del = (request.del = requester('DELETE'))
const get = (request.get = requester('GET'))
const head = (request.head = requester('HEAD'))
const options = (request.options = requester('OPTIONS'))
const patch = (request.patch = requester('PATCH'))
const post = (request.post = requester('POST'))
const put = (request.put = requester('PUT'))

export { del, get, head, options, patch, post, put }

export * from './types'

export default request
module.exports = request
