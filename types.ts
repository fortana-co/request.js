export interface Headers {
  [key: string]: string
}

export interface BaseResponse {
  status: number
  statusText: string
  url: string
  headers: Headers
}

export interface SuccessResponse<T = any> extends BaseResponse {
  data: T
  type: 'success'
}

export interface ErrorResponse<T = any> extends BaseResponse {
  data: T
  type: 'error'
}

export interface ExceptionResponse {
  data: Error
  type: 'exception'
}

export type Response<T = any, ET = any> = SuccessResponse<T> | ErrorResponse<ET> | ExceptionResponse

export interface Retry<T = any, ET = any> {
  retries: number
  delay: number
  multiplier?: number
  shouldRetry?: (response: Response<T, ET>, retryInfo: { retries: number; delay: number }) => boolean
}

export type Method =
  | 'delete'
  | 'get'
  | 'head'
  | 'options'
  | 'patch'
  | 'post'
  | 'put'
  | 'DELETE'
  | 'GET'
  | 'HEAD'
  | 'OPTIONS'
  | 'PATCH'
  | 'POST'
  | 'PUT'

export interface Options<T = any, ET = any> {
  method?: Method
  body?: any
  params?: {}
  headers?: Headers
  retry?: Retry<T, ET>
  stringify?: (obj?: {}) => string
  jsonOut?: boolean
  timeout?: number
  [others: string]: any
}

export interface RequestFn {
  <T = any, ET = any>(url: string, options?: Options<T, ET>): Promise<Response<T, ET>>
}

export interface RequestMod extends RequestFn {
  delete: RequestFn
  del: RequestFn
  get: RequestFn
  head: RequestFn
  options: RequestFn
  patch: RequestFn
  post: RequestFn
  put: RequestFn
}
