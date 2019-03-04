# request.js


[![NPM](https://img.shields.io/npm/v/request-dot-js.svg)](https://www.npmjs.com/package/request.js)
[![npm bundle size (minified + gzip)](https://img.shields.io/bundlephobia/minzip/request-dot-js.svg)](https://www.npmjs.com/package/request.js)

A ~1kB wrapper around `fetch`, with a convenient API for interacting with JSON APIs and support for retrying requests using exponential backoff.

It works in the browser, on the server (Node.js), and mobile apps (like React Native).


## Installation
`npm i request-dot-js` or `yarn add request-dot-js`.


## Usage
API: `async request(url[, options])`

- `url`: a string
- `options`: the fetch [__init__ object](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Syntax)

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

if (type === 'success') handleSuccess(data) // do something with success

if (type === 'error') handleError(data) // do something with error

if (type === 'exception') handleException(data) // do something with exception
~~~

For all responses returned by __request.js__, `type` is either `'success'`, `'error'` or `'exception'`.

If there's no connection error, `data` is read from the response stream. If `status < 300` type is `'success'`. If `status >= 300`, type is `'error'`.

If there's a connection error or timeout, type is `'exception'`, and `data` is the exception thrown by fetch.

The other attributes come from the `Response` object returned by fetch:

- `headers`: object literal with headers; all header names lowercased, like axios
- `status`: 200, 204, etc...
- `statusText`: 'OK', 'CREATED', etc...
- `url`: url after redirect(s)

If type is `'exception'`, these attributes are undefined.


### JSON by default
__request.js__ is built for easy interaction with JSON APIs, the de facto standard for success exchange on the web.

`request` adds `'content-type': 'application/json'` and `accept: 'application/json'` request headers by default. You can override this by passing your own `content-type` and `accept` headers. As with fetch and axios, header names are case insensitive.

If __content-type__ is not overridden, `request` automatically JSON stringifies `options.body`.

~~~js
const { data, type, ...rest } = await request(
  'https://httpbin.org/post',
  {
    method: 'POST', // default method is 'GET'
    body: { a: 'b', c: 'd' }, // body passed to JSON.stringify by default
  },
)
~~~

If __accept__ is not overridden, `request` tries to return parsed JSON for `data`, else it returns the raw response string.

~~~js
const { data } = await request('https://httpbin.org/get')
console.log(data.url)
~~~


### Retry with exponential backoff
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

`request`s second argument has a special `retry` key that can point to an object with __retry options__ (listed here with their default values):

- `retries`, 4
- `delay`, 1000ms
- `multiplier`, 2
- `shouldRetry`, `response => response.type === 'exception'`

If you pass a `retry` object, even an empty one, and your request throws an exception, __request.js__ retries it up to `retries` times and [backs off exponentially](https://en.wikipedia.org/wiki/Exponential_backoff).

If on any retry you regain connectivity and type is `'success'` or `'error'` instead of `'exception'`, the `request` method stops retrying your request and returns the usual `{ data, type, ...rest }`.

If you want to set a custom condition for when to retry a request, pass your own `shouldRetry` function. It receives the usual response, `{ data, type, ...rest }`, and the current backoff vaules, `{ retries, delay }`. If it returns a falsy value __request.js__ stops retrying your request.

The `shouldRetry` function also lets you react to individual retries before `request` is done executing all of them, if you want to do that. See the example above.


## HTTP Convenience Methods
__request.js__ has convenience methods for the following HTTP methods: `delete`, `get`, `head`, `options`, `patch`, `post`, and `put`.

~~~js
import request from 'request-dot-js'

const { data, type } = await request.post('https://httpbin.org/post', { body: { a: 'b' } })

const { data, type } = await request.put('https://httpbin.org/put', { body: { a: 'b' } })
~~~

These allow you to send non-GET requests without passing the `method` key in the second argument.


## Dependencies
For modern browsers, or React Native, __request.js__ has no dependencies.

If you're targeting older browsers, like Internet Explorer, you need to polyfill [fetch](https://github.com/github/fetch) and `Promise`, and use Babel to transpile your code.

If you use __request.js__ on the server, [node-fetch](https://github.com/bitinn/node-fetch) is the only dependency.


### Query stringification
__request.js__ comes with a function that converts a query `params` object to a query string. If you want a fancier stringify function, feel free to use something like [qs](https://github.com/ljharb/qs) and write a wrapper around `request`.


## Development and tests
Clone the repo, then `npm install`, then `npm run test`.
