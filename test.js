import test from 'ava'
import request, { toQs } from '.'

request
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

// request backoff
test.cb('backoff: retries on exception', t => {
  t.plan(4)

  const onRetry = ({ exception }, { retries, delay }) => {
    t.truthy(exception)
    if (retries <= 1) {
      t.is(delay, 500)
      t.end()
    }
  }
  request('https://httpbin.smorg/get', {}, { onRetry, delay: 125 })
})

test('backoff: eventually returns response', async t => {
  const { exception } = await request('https://httpbin.smorg/get', {}, { delay: 250 })
  t.truthy(exception)
})

test.cb('backoff: callback style', t => {
  t.plan(1)

  request('https://httpbin.smorg/get', {}, { delay: 250 }).then(({ exception }) => {
    t.truthy(exception)
    t.end()
  })
})

// toQs
test('toQs: simple', async t => {
  let qs = toQs({ a: 'b', c: 'd' })
  t.is(qs, '?a=b&c=d')
  qs = toQs({})
  t.is(qs, '')
})
