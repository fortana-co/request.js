import test from 'ava'
import request, { requestBackoff, toQs } from '.'

test('toQs', async t => {
  let qs = toQs({ a: 'b', c: 'd' })
  t.is(qs, '?a=b&c=d')
  qs = toQs({})
  t.is(qs, '')
})

test('get request', async t => {
  const { data: { headers, url } } = await request('https://httpbin.org/get')
  t.is(url, 'https://httpbin.org/get')
  t.is(headers['Content-Type'], 'application/json')
  t.is(headers.Accept, 'application/json')
})
