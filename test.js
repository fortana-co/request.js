import test from 'ava'
import request, { requestBackoff, toQs } from '.'

// request
test('request: default headers', async t => {
  const { data: { headers, url }, error, exception } = await request('https://httpbin.org/get')
  t.is(url, 'https://httpbin.org/get')
  t.is(headers['Content-Type'], 'application/json')
  t.is(headers.Accept, 'application/json')
  t.is(error, undefined)
  t.is(exception, undefined)
})

test('request: querystring', async t => {
  const { data: { url } } = await request('https://httpbin.org/get', { params: { a: 'b', c: 'd' } })
  t.is(url, 'https://httpbin.org/get?a=b&c=d')
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

// toQs
test('toQs: works', async t => {
  let qs = toQs({ a: 'b', c: 'd' })
  t.is(qs, '?a=b&c=d')
  qs = toQs({})
  t.is(qs, '')
})

// requestBackoff
test.cb('requestBackoff: passes response to onResponse', t => {
  t.plan(1)

  const onResponse = ({ data }) => {
    t.is(data.url, 'https://httpbin.org/get')
    t.end()
  }
  requestBackoff(() => request('https://httpbin.org/get'), onResponse)
})

test.cb('requestBackoff: retries on exception', t => {
  t.plan(3)

  const onResponse = ({ exception }, count) => {
    t.truthy(exception)
    if (count >= 3) t.end()
  }
  requestBackoff(
    () => request('https://httpbin.smorg/get'),
    onResponse,
    { retries: 2, initialDelay: 250, multiplier: 2 },
  )
})
