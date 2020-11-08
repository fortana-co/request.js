import test from 'ava'
import request, { del, get, post, Retry, SuccessResponse, ErrorResponse, ExceptionResponse, Response } from './server'

test('request: type, status, statusText, url and default headers', async t => {
  interface SuccessData {
    origin: string
    url: string
    headers: { [key: string]: string }
  }

  const response = await request<SuccessData>('https://httpbin.org/get')
  if (response.type === 'success') {
    const { data, type, status, statusText, url } = response
    t.is(data.url, 'https://httpbin.org/get')
    t.is(data.headers['Content-Type'], undefined)
    t.is(data.headers['Accept'], 'application/json')
    t.is(type, 'success')
    t.is(status, 200)
    t.is(statusText, 'OK')
    t.is(url, 'https://httpbin.org/get')
  }
})

test('request: querystring', async t => {
  const response = (await request('https://httpbin.org/get', {
    params: { a: 'b', c: 'd', e: undefined },
  })) as SuccessResponse<{ url: string }>
  t.is(response.data.url, 'https://httpbin.org/get?a=b&c=d')
})

test('request: custom stringify', async t => {
  const { data } = await request('https://httpbin.org/get', {
    params: { a: 'b', c: 'd' },
    stringify: () => 'a=b',
  })
  t.is(data.url, 'https://httpbin.org/get?a=b')
})

test('request: json body, including content-type header', async t => {
  const { data } = await request('https://httpbin.org/post', {
    method: 'POST',
    body: { a: 'b', c: 'd' },
  })
  t.is(data.headers['Content-Type'], 'application/json')
  t.deepEqual(data.json, { a: 'b', c: 'd' })
})

test('request: redirect', async t => {
  const { url, status } = (await request('https://google.com/')) as SuccessResponse
  t.is(url, 'https://www.google.com/')
  t.is(status, 200)
})

test('request: redirect manual', async t => {
  const { type, status } = (await request('https://google.com/', {
    redirect: 'manual',
  })) as ErrorResponse
  t.is(type, 'error')
  t.is(status, 301)
})

test('request: can override default content-type header, case insensitive', async t => {
  const { data } = await request('https://httpbin.org/headers', {
    headers: { 'CONTENT-TYPE': '*/*' },
  })
  t.is(data.headers['Content-Type'], '*/*')
})

// client code must manually parse response JSON, no double stringify
test('request: jsonOut false', async t => {
  const { data } = await request('https://httpbin.org/post', {
    method: 'POST',
    body: JSON.stringify({ a: 'b', c: 'd' }),
    jsonOut: false,
  })
  const text = await data.text()
  const parsed = JSON.parse(text)
  t.deepEqual(parsed.json, { a: 'b', c: 'd' })
})

test('request: response headers are object literal', async t => {
  const { headers } = (await request('https://httpbin.org/get')) as SuccessResponse
  t.is(headers['content-type'], 'application/json')
})

test('request: error', async t => {
  const { type, status } = (await request('https://httpbin.org/GET')) as ErrorResponse
  t.is(status, 404)
  t.is(type, 'error')
})

test('request: exception', async t => {
  const { data, type, ...rest } = (await request('https://httpbin.smorg/get')) as ExceptionResponse
  t.is(data.name, 'FetchError') // would be 'TypeError' in a browser
  t.is(type, 'exception')
  t.deepEqual(rest, {})
})

test('request: convenience methods', async t => {
  let response = await post('https://httpbin.org/post', { body: { a: 'b' } })
  t.is(response.type, 'success')
  t.is(response.data.json.a, 'b')
  response = await del('https://httpbin.org/delete')
  t.is(response.type, 'success')
  response = await get('https://httpbin.org/post')
  t.is(response.type, 'error')
})

test('request: convenience methods (properties of request)', async t => {
  let response = await request.post('https://httpbin.org/post', { body: { a: 'b' } })
  t.is(response.type, 'success')
  t.is(response.data.json.a, 'b')
  response = await request.del('https://httpbin.org/delete')
  t.is(response.type, 'success')
  response = await request.get('https://httpbin.org/post')
  t.is(response.type, 'error')
})

// backoff
test.cb('retry: retries on exception, increases delay', t => {
  t.plan(5)

  const shouldRetry: Retry['shouldRetry'] = ({ type }, { retries, delay }) => {
    t.is(type, 'exception')
    if (retries <= 1) {
      t.is(delay, 1000)
      t.end()
    }
    return type === 'exception'
  }
  request('https://httpbin.smorg/get', { retry: { shouldRetry, retries: 4, delay: 125 } })
})

test('retry: eventually returns response', async t => {
  const { type } = await request('https://httpbin.smorg/get', { retry: { delay: 250, retries: 3 } })
  t.is(type, 'exception')
})

test.cb('retry: callback style', t => {
  t.plan(1)

  request('https://httpbin.smorg/get', { retry: { delay: 250, retries: 3 } }).then(({ type }) => {
    t.is(type, 'exception')
    t.end()
  })
})

test('timeout', async t => {
  let response = await request('https://httpbin.org/get', { timeout: 10 })
  t.is(response.type, 'exception')
  t.is(response.data.name, 'AbortError')

  response = await request('https://httpbin.org/get', { timeout: 10000 })
  t.is(response.type, 'success')
})

test.cb('retry: retries on custom condition', t => {
  t.plan(4)

  const shouldRetry: Retry['shouldRetry'] = (response: Response, { retries }) => {
    t.pass()
    if (retries <= 1) t.end()
    return response.type !== 'exception' && response.status === 500
  }
  request('https://httpbin.org/status/500', { retry: { shouldRetry, retries: 4, delay: 125 } })
})

test('retry: no exception -> no retry', async t => {
  const shouldRetry: Retry['shouldRetry'] = ({ type }, { retries }) => {
    t.pass()
    if (retries < 3) t.fail()
    return type === 'exception'
  }
  await request('https://httpbin.org/status/500', {
    retry: { shouldRetry, retries: 3, delay: 125 },
  })
})

test('graphql', async t => {
  const query = `
{
  continents {
    name
    code
    countries {
      name
      code
      currency
    }
  }
}
`
  const { type, data } = await request('https://countries.trevorblades.com/', {
    body: { query },
    method: 'POST',
  })
  if (type === 'success') {
    t.is(data.data.continents.length, 7)
  }
})
