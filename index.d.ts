interface BaseResponse {
  status: number
  statusText: string
  url: string
  headers: { [key: string]: string }
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
  retries?: number
  delay?: number
  multiplier?: number
  shouldRetry?: (response: Response<T, ET>, retryInfo: { retries: number; delay: number }) => boolean
}

export interface Options<T = any, ET = any> {
  method?:
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
  body?: any
  params?: {}
  headers?: {}
  retry?: Retry<T, ET>
  stringify?: (obj?: {}) => string
  jsonOut?: boolean
  [others: string]: any
}

export function del<T = any, ET = any>(url: string, options?: Options<T, ET>): Promise<Response<T, ET>>
export function get<T = any, ET = any>(url: string, options?: Options<T, ET>): Promise<Response<T, ET>>
export function head<T = any, ET = any>(url: string, options?: Options<T, ET>): Promise<Response<T, ET>>
export function options<T = any, ET = any>(url: string, options?: Options<T, ET>): Promise<Response<T, ET>>
export function patch<T = any, ET = any>(url: string, options?: Options<T, ET>): Promise<Response<T, ET>>
export function post<T = any, ET = any>(url: string, options?: Options<T, ET>): Promise<Response<T, ET>>
export function put<T = any, ET = any>(url: string, options?: Options<T, ET>): Promise<Response<T, ET>>
export default function request<T = any, ET = any>(url: string, options?: Options<T, ET>): Promise<Response<T, ET>>
