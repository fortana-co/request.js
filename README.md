# request.js


[![NPM](https://img.shields.io/npm/v/request-dot-js.svg)](https://www.npmjs.com/package/request.js)
[![npm bundle size (minified + gzip)](https://img.shields.io/bundlephobia/minzip/request-dot-js.svg)](https://www.npmjs.com/package/request.js)

A ~1kB wrapper around `fetch` with convenient error handling, automatic JSON transforms, and support for exponential backoff.

It works in the browser, on the server (Node.js), and mobile apps (like React Native), has no dependencies, and ships with TypeScript declarations.


## Installation
`npm i request-dot-js` or `yarn add request-dot-js`.


## Usage
API: `async request(url[, options])`

- `url`: a string
- `options`: basically the fetch [__init__ object](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Syntax)

~~~js
import request from 'request-dot-js'

// in an async function...

const { data, type, headers, status, statusText, url } = await request(
  'https://httpbin.org/get',
  {
    headers: { 'Custom-Header': 'abcd' },
    params: { a: 'b', c: 'd' }, // query params
  },
)

if (type === 'success') handleSuccess(data)

if (type === 'error') handleError(data)

if (type === 'exception') handleException(data)
~~~

For all responses returned by __request.js__, `type` is either `'success'`, `'error'` or `'exception'`.

If no exception is thrown, `data` is read from the response stream. If `status < 300` type is `'success'`. If `status >= 300`, type is `'error'`.

If there's a connection error, timeout, or other exception, type is `'exception'`, and `data` is the exception thrown by fetch.

The other attributes come from the `Response` object returned by fetch:

- `status`: 200, 204, etc...
- `statusText`: 'OK', 'CREATED', etc...
- `url`: url after redirect(s)
- `headers`: object literal instead of `Headers` instance; header names are lowercased

If type is `'exception'`, these attributes are undefined.


### JSON by default
__request.js__ is built for easy interaction with JSON APIs, the de facto standard for data exchange on the web.

If you pass an object literal or an array for `options.body`, `request` adds the `'content-type': 'application/json'` request header and JSON stringifies the body.

By default, `request` also adds the `'accept': 'application/json'` request header and tries to return parsed JSON for `data`. If you don't want it to do this, pass `jsonOut: false` in `options`, and it will return [the fetch Response object](https://developer.mozilla.org/en-US/docs/Web/API/Response) for `data` instead.

~~~js
const { data, type, ...rest } = await request(
  'https://httpbin.org/post',
  {
    method: 'POST', // default method is 'GET'
    body: { a: 'b', c: 'd' }, // object body automatically passed to JSON.stringify
  },
)
if (type === 'success') console.log(data.url) // data is parsed JSON by default
~~~

~~~js
const { data, type } = await request('https://httpbin.org/post', { jsonOut: false })
if (type === 'success') {
  const blob = await data.blob()
  console.log(blob)
}
~~~


### Retries with exponential backoff
~~~js
import request from 'request-dot-js'

// retry request up to 5 times, with 1s, 2s, 4s, 8s and 16s delays between retries
const { data, type, ...rest } = await request(
  'https://httpbin.org/get',
  { params: { a: 'b', c: 'd' }, retry: { retries: 5, delay: 1000 } },
)

// shouldRetry function
const { data, type, ...rest } = await request(
  'https://httpbin.org/get',
  {
    retry: {
      shouldRetry: (response, { retries, delay }) => {
        console.log(retries, delay) // do something with current retries and delay if you want
        return response.type === 'exception' || response.status === 500
      },
    },
  },
)
~~~

The `options` parameter has a special `retry` key that can point to an object with __retry options__ (listed here with their default values):

- `retries`, 4
- `delay`, 1000ms
- `multiplier`, 2
- `shouldRetry`, `response => response.type === 'exception'`

If you pass a `retry` object, even an empty one, and your request throws an exception, __request.js__ retries it up to `retries` times and [backs off exponentially](https://en.wikipedia.org/wiki/Exponential_backoff).

If on any retry you regain connectivity and type is `'success'` or `'error'` instead of `'exception'`, the `request` method stops retrying your request and returns the usual `{ data, type, ...rest }`.

If you want to set a custom condition for when to retry a request, pass your own `shouldRetry` function. It receives the usual response, `{ data, type, ...rest }`, and the current backoff values, `{ retries, delay }`. If it returns a falsy value __request.js__ stops retrying your request.

The `shouldRetry` function also lets you react to individual retries before `request` is done executing all of them, if you want to do that. See the example above.


### Convenience methods
__request.js__ has convenience methods for the following HTTP methods: `DELETE`, `GET`, `HEAD`, `OPTIONS`, `PATCH`, `POST`, and `PUT`.

~~~js
import request from 'request-dot-js'

const { data, type } = await request.delete('https://httpbin.org/delete')

const { data, type } = await request.put('https://httpbin.org/put', { body: { a: 'b' } })
~~~

These allow you to send non-GET requests without passing the `method` key in `options`.


### Query stringification
__request.js__ comes with a function that converts a query `params` object to a query string. If you want a fancier `stringify` function, like the one in [qs](https://github.com/ljharb/qs), you can pass your own in `options`.

~~~js
import qs from 'qs'

const { data, type } = await request(
  'https://httpbin.org/get',
  { params: { a: 'b' }, stringify: qs.stringify },
)
~~~


### Request cancellation
Little known fact, but this is actually [easy to do with fetch](https://developer.mozilla.org/en-US/docs/Web/API/AbortController), it's just not supported on older browsers.


### TypeScript
__request.js__ ships with [TypeScript declarations](https://github.com/fortana-co/request.js/blob/master/index.d.ts) and works great with TypeScript, with a few caveats.

First, make sure you enable `esModuleInterop` if you're using TypeScript to compile your application. This option is enabled by default if you run `tsc --init`.

Regarding convenience methods, you can't do this:

~~~ts
import request from 'request-dot-js'

request.put(...)
~~~

Do this instead:

~~~ts
import { put } from 'request-dot-js'

put(...)
~~~

Also, you can't do this, because `delete` is a restricted keyword:

~~~ts
import { delete as del } from 'request-dot-js'
~~~

Do this instead:

~~~ts
import { del } from 'request-dot-js'
~~~


## Why request.js?
Why not axios, or just fetch? Unlike fetch, __request.js__ is very convenient to use:

- automatic JSON transforms
- query params and response headers as object literals
- no double `await` to read data
- automatically removes body for GET and HEAD requests

And unlike either of them, it doesn't require `try / catch` to handle exceptions. `const { data, type } = await request(...)` has all the info you need to handle successful requests, request errors, and connection errors. 

This design leads to another feature the others don't have: flexible, built-in support for retries with exponential backoff.


## Dependencies
For modern browsers, or React Native, __request.js__ has no dependencies.

If you're targeting older browsers, like Internet Explorer, you need to polyfill [fetch](https://github.com/github/fetch) and `Promise`, and use Babel to transpile your code.

If you use __request.js__ on the server, [node-fetch](https://github.com/bitinn/node-fetch) is the only dependency.


## Development and tests
Clone the repo, then `npm install`, then `npm run test`.
