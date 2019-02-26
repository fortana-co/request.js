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

// in an async function...

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

In the examples above and all the ones that follow, only one of `data`, `error` or `exception` is defined.

If there is no connection error, and response status is less than 300, it's `data`, else it's `error`. If there is a connection error or timeout, it's `exception`.

`rest` consists of a few other attributes in the `Response` object returned by `fetch`:

- `headers`: object literal with headers, like axios
- `status`: 200, 204, etc...
- `statusText`: 'OK', 'CREATED', etc...
- `url`: url after redirect(s)

If there is an exception, these attributes are undefined.


### JSON by default
__request.js__ is built for easy interaction with JSON APIs, the de facto standard for data exchange on the web.

`request` adds `'Content-Type': 'application/json'` and `Accept: 'application/json'` request headers by default. You can override this by passing your own `Content-Type` and `Accept` headers.

If __Content-Type__ is not overridden, `request` automatically JSON stringifies `options.body`.

If __Accept__ is not overridden, `request` returns parsed JSON for __data/error__, else it returns the raw response string.


### Exponential backoff
~~~js
import request from 'request-dot-js'

// retry request up to 5 times, with 1s, 2s, 4s, 8s and 16s delays between retries
const { data, error, exception, ...rest } = await request(
  'https://httpbin.org/get',
  { params: { a: 'b', c: 'd' } },
  { retries: 5, delay: 1000 },
)

// shouldRetry function
const { data, error, exception, ...rest } = await request(
  'https://httpbin.org/get',
  {},
  {
    shouldRetry: (response, { retries, delay }) => {
      console.log(retries, delay) // do something with remaining retries and current delay
      return response.exception !== undefined || status === 500
    },
  },
)
~~~

`request` has a third argument, an object literal with __backoff options__ (listed here with their default values):

- `retries`, 4
- `delay`, 1000ms
- `multiplier`, 2
- `shouldRetry`, `response => response.exception !== undefined`

If you invoke `request` with this third argument, even an empty object literal, __request.js__ will retry your request up to `retries` times and [back off exponentially](https://en.wikipedia.org/wiki/Exponential_backoff) for as long as it's returning `exception`.

If on any retry you regain connectivity and your request returns `data` or `error` instead of `exception`, the `request` method stops retrying your request and returns the usual `{ data, error, exception, ...rest }`.

If you want to set a custom condition for when to retry a request, pass your own `shouldRetry` function. It receives the usual response, `{ data, error, exception, ...rest }`, and the current backoff vaules, `{ retries, delay }`. If it returns a falsy value the `request` method stops retrying your request.

The `shouldRetry` function also lets you react to individual retries before `request` is done executing all of them, if you want to do that. See the example above.


## Dependencies
For modern browsers, or React Native, __request.js__ has no dependencies.

If you're targeting older browsers, like Internet Explorer, you need to polyfill [fetch](https://github.com/github/fetch) and `Promise`, and use Babel to transpile your code.

If you use __request.js__ on the server, [node-fetch](https://github.com/bitinn/node-fetch) is the only dependency.


### Query stringification
__request.js__ comes with a function that converts a query `params` object to a query string. If you want a fancier stringify function, feel free to use something like [qs](https://github.com/ljharb/qs) and write a wrapper around `request`.


## Development and tests
Clone the repo, then `npm install`, then `npm run test`.
