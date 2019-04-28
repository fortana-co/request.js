export interface IResponse {
  data: any
  type: 'success' | 'error'
  status: number
  statusText: string
  url: string
  headers: { [key: string]: string }
}

export interface IExceptionResponse {
  data: Error
  type: 'exception'
}

export type IAnyResponse = IResponse | IExceptionResponse

export interface IRetry {
  retries?: number
  delay?: number
  multiplier?: number
  shouldRetry?: (response: IAnyResponse, retryInfo: { retries: number, delay: number }) => boolean
}

export interface IOptions {
  method?: 'delete' | 'get' | 'head' | 'options' | 'patch' | 'post' | 'put' | 'DELETE' | 'GET' | 'HEAD' | 'OPTIONS' | 'PATCH' | 'POST' | 'PUT'
  body?: any
  params?: {}
  headers?: {}
  retry?: IRetry
  stringify?: (obj?: {}) => string
  jsonOut?: boolean
  [others: string]: any
}

export function del(url: string, options?: IOptions): Promise<IAnyResponse>
export function get(url: string, options?: IOptions): Promise<IAnyResponse>
export function head(url: string, options?: IOptions): Promise<IAnyResponse>
export function options(url: string, options?: IOptions): Promise<IAnyResponse>
export function patch(url: string, options?: IOptions): Promise<IAnyResponse>
export function post(url: string, options?: IOptions): Promise<IAnyResponse>
export function put(url: string, options?: IOptions): Promise<IAnyResponse>
export default function request(url: string, options?: IOptions): Promise<IAnyResponse>
