# request.js


[![NPM](https://img.shields.io/npm/v/request-dot-js.svg)](https://www.npmjs.com/package/request.js)
[![npm bundle size (minified + gzip)](https://img.shields.io/bundlephobia/minzip/request-dot-js.svg)](https://www.npmjs.com/package/request.js)

A ~1kB wrapper around `fetch`, with a convenient API for interacting with JSON APIs and support for exponential backoff.

It works in the browser, on the server (Node.js), and mobile apps (like React Native).


## Installation
`npm i request-dot-js` or `yarn add request-dot-js`.


## Dependencies
Peer deps are [__whatwg-fetch__](https://github.com/github/fetch) (not needed if you're targeting an environment that doesn't require the fetch polyfill) and [__qs__](https://github.com/ljharb/qs).


## Usage
API: `async request(url[, options])`

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

const { data, error, exception, ...rest } = await request(
  'https://httpbin.org/post',
  {
    method: 'POST', // default method is 'GET'
    body: { a: 'b', c: 'd' }, // body passed to JSON.stringify by default
  },
)
~~~

In the examples above, exactly one of `data`, `error` or `exception` will be truthy. If there is no connection error, and response status is less than 400, it's `data`, else it's `error`.

If there is a connection error or timeout, it's `exception`.

`rest` contains other attributes [returned by fetch](https://devhints.io/js-fetch), such as `headers`, `status`, `statusText`, `redirected`, `url`, and `type`.


### JSON by default
__request.js__ is built for easy interaction with JSON APIs, the de facto standard for data serialization over HTTP.

`request` adds `'Content-Type': 'application/json', Accept: 'application/json'` to request headers by default.

You can override this by passing your own `Content-Type` and `Accept` headers.

If __Content-Type__ is not overridden, `request` automatically stringifies `options.body`. If __Accept__ is not overridden, `request` returns parsed JSON for __data/error__, else it returns a string.


### Exponential backoff
API: `async requestBackoff(requester[, onResponse[, options]])`

~~~js
import request, { requestBackoff } from 'request-dot-js'

requestBackoff(
  () => request('https://httpbin.org/get'),
  ({ data, error, exception }, count) => { console.log(data, error, exception, count) },
  { retries: 5, initialDelay: 500, multiplier: 2 },
)
~~~

`requestBackoff` invokes `requester`, which can be async. If `requester` returns an object that has a truthy value for the `exception` key, it backs off and retries the request.

Each time it invokes `requester`, it also passes the return value of `requester` to `onResponse`, and the number of times (`count`) that `requester` has been invoked.

The return value of `request`, the default method in this package, combines nicely with the `requestBackoff` function, as you can see in the example above.


## Development and tests
Clone the repo, then `npm install`, then `npm run test`.
