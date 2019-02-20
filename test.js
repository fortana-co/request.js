import test from 'ava'
import request from '.'

test('get request', async t => {
  const { data } = request('https://httpbin.org/get')
  t.is(data.url, 'https://httpbin.org/get')
})
