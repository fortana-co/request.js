# request.js


[![NPM](https://img.shields.io/npm/v/request-dot-js.svg)](https://www.npmjs.com/package/request.js)
[![npm bundle size (minified + gzip)](https://img.shields.io/bundlephobia/minzip/request-dot-js.svg)](https://www.npmjs.com/package/request.js)

A ~1kB wrapper around `fetch`, with a convenient API for interacting with JSON APIs and support for exponential backoff.

It works in the browser, on the server (Node.js), and mobile apps (like React Native).


## Installation
`npm i request-dot-js` or `yarn add request-dot-js`.


## Usage
API: `async request(url[, options[, backoffOptions]])`

~~~js
import request from 'request-dot-js'

// in your async function...

const { data, error, exception, ...rest } = await request(
  'https://httpbin.org/get',
  {
    headers: { 'Custom-Header': 'value' },
    params: { a: 'b', c: 'd' }, // query params
  },
)

const { data, error, exception, headers, status, statusText, url } = await request(
  'https://httpbin.org/post',
  {
    method: 'POST', // default method is 'GET'
    body: { a: 'b', c: 'd' }, // body passed to JSON.stringify by default
  },
)
~~~

In the examples above, exactly one of `data`, `error` or `exception` will be truthy. If there is no connection error, and response status is less than 300, it's `data`, else it's `error`.

If there is a connection error or timeout, it's `exception`.

`rest` contains a few other attributes in the `Response` object returned by `fetch`:

- `headers`: object literal with headers, like axios
- `status`: 200, 204, etc...
- `statusText`: 'OK', 'CREATED', etc...
- `url`: url after redirect(s)


### JSON by default
__request.js__ is built for easy interaction with JSON APIs, the de facto standard for data serialization over HTTP.

`request` adds `'Content-Type': 'application/json', Accept: 'application/json'` to request headers by default.

You can override this by passing your own `Content-Type` and `Accept` headers.

If __Content-Type__ is not overridden, `request` automatically stringifies `options.body`. If __Accept__ is not overridden, `request` returns parsed JSON for __data/error__, else it returns a string.


### Exponential backoff
~~~js
import request from 'request-dot-js'

// retry request up to 4 times, with 1s, 2s, 4s, and 8s delays between retries
const { data, error, exception, ...rest } = await request(
  'https://httpbin.org/get',
  { params: { a: 'b', c: 'd' } },
  { retries: 4, delay: 1000 },
)

// callback style
request('https://httpbin.org/get', {}, {}).then(response => {
  const { data, error, exception, ...rest } = response
  console.log(data, error, exception, rest)
})

// onRetry callback
const { data, error, exception, ...rest } = await request(
  'https://httpbin.org/get',
  {},
  {
    onRetry: ({ exception }, backoffParams) => {
      const { retries, delay } = backoffParams
      console.log(retries, delay) // do something with remaining retries and current delay
    },
  },
)
~~~

The third argument to `request` is an object literal with the following backoff options (listed here with their default values):

- `retries`, 3
- `delay`, 1000ms
- `multiplier`, 2
- `onRetry`, undefined

If you invoke `request` with this third argument, even an empty object literal, __request.js__ will retry your request up to `retries` times and [back off exponentially](https://en.wikipedia.org/wiki/Exponential_backoff), as long as it's returning `exception`.

If on any retry you regain connectivity and your request returns `data` or `error` instead of `exception`, the `request` method stops retrying your request and returns the usual `{ data, error, exception, ...rest }`.

If you want to react to individual retries before `request` is done executing all of them, you can pass an `onRetry` callback, which receives `{ exception }, { retries, delay }`, with the number of remaining retries and the current delay in ms.


## Dependencies
For modern browsers, or React Native, __request.js__ has no dependencies.

If you're targeting older browsers, like Internet Explorer, you need to polyfill [fetch](https://github.com/github/fetch) and `Promise`.

If you use __request.js__ on the server, [node-fetch](https://github.com/bitinn/node-fetch) is a dependency.


### Query stringification
__request.js__ comes with a function that converts a query `params` object to a query string. If you want a fancier stringify function, feel free to use something like [qs](https://github.com/ljharb/qs) and write a wrapper around `request`.


## Development and tests
Clone the repo, then `npm install`, then `npm run test`.
