import test from 'ava'
import request from '.'

test('request: redirect', async t => {
  const { data, status } = await request('https://httpbin.org/redirect-to?url=get')
  t.is(data.url, 'https://httpbin.org/get')
  t.is(status, 200)
  t.pass()
})

test('request: redirect manual', async t => {
  const { error, status } = await request('https://httpbin.org/redirect-to?url=get', { redirect: 'manual' })
  t.deepEqual(error, {})
  t.is(status, 302)
})

test('request: default headers', async t => {
  const { data, error, exception } = await request('https://httpbin.org/get')
  t.is(data.url, 'https://httpbin.org/get')
  t.is(data.headers['Content-Type'], 'application/json')
  t.is(data.headers.Accept, 'application/json')
  t.is(error, undefined)
  t.is(exception, undefined)
})

test('request: querystring', async t => {
  const { data } = await request('https://httpbin.org/get', { params: { a: 'b', c: 'd' } })
  t.is(data.url, 'https://httpbin.org/get?a=b&c=d')
})

test('request: json body', async t => {
  const { data } = await request('https://httpbin.org/post', { method: 'POST', body: { a: 'b', c: 'd' } })
  t.deepEqual(data.json, { a: 'b', c: 'd' })
})

// client code must manually stringify request body and parse response JSON
test('request: custom headers', async t => {
  const { data } = await request(
    'https://httpbin.org/post',
    { method: 'POST', headers: { 'Content-Type': '*', 'Accept': '*' }, body: JSON.stringify({ a: 'b', c: 'd' }) },
  )
  const parsed = JSON.parse(data)
  t.deepEqual(parsed.json, { a: 'b', c: 'd' })
})

test('request: headers returned as object literal', async t => {
  const { headers } = await request('https://httpbin.org/get')
  t.is(headers['content-encoding'], 'gzip')
})

test('request: error', async t => {
  const { data, error, exception, status } = await request('https://httpbin.org/GET')
  t.is(status, 404)
  t.deepEqual(error, {})
  t.is(data, undefined)
  t.is(exception, undefined)
})

test('request: exception', async t => {
  const { data, error, exception, ...rest } = await request('https://httpbin.smorg/get')
  t.is(exception.code, 'ENOTFOUND')
  t.deepEqual(rest, {})
  t.is(data, undefined)
  t.is(error, undefined)
})

// backoff
test.cb('retry: retries on exception, increases delay', t => {
  t.plan(5)

  const shouldRetry = ({ exception }, { retries, delay }) => {
    t.truthy(exception)
    if (retries <= 1) {
      t.is(delay, 1000)
      t.end()
    }
    return exception !== undefined
  }
  request('https://httpbin.smorg/get', { retry: { shouldRetry, delay: 125 } })
})

test('retry: eventually returns response', async t => {
  const { exception } = await request('https://httpbin.smorg/get', { retry: { delay: 250, retries: 3 } })
  t.truthy(exception)
})

test.cb('retry: callback style', t => {
  t.plan(1)

  request('https://httpbin.smorg/get', { retry: { delay: 250, retries: 3 } }).then(({ exception }) => {
    t.truthy(exception)
    t.end()
  })
})

test.cb('retry: retries on custom condition', t => {
  t.plan(4)

  const shouldRetry = ({ status }, { retries }) => {
    t.pass()
    if (retries <= 1) t.end()
    return status === 500
  }
  request('https://httpbin.org/status/500', { retry: { shouldRetry, delay: 125 } }, )
})

test('retry: no exception -> no retry', async t => {
  const shouldRetry = ({ exception }, { retries }) => {
    t.pass()
    if (retries < 3) t.fail()
    return exception !== undefined
  }
  await request('https://httpbin.org/status/500', { retry: { shouldRetry, retries: 3, delay: 125 } })
})
