export interface IResponse {
  data: any
  type: 'success' | 'error' | 'exception'
  status?: number
  statusText?: string
  url?: string
  headers?: {}
}

export interface IRetry {
  retries?: number
  delay?: number
  multiplier?: number
  shouldRetry?: (response: IResponse, retryInfo: { retries: number, delay: number }) => boolean
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

export function del(url: string, options?: IOptions): Promise<IResponse>
export function get(url: string, options?: IOptions): Promise<IResponse>
export function head(url: string, options?: IOptions): Promise<IResponse>
export function options(url: string, options?: IOptions): Promise<IResponse>
export function patch(url: string, options?: IOptions): Promise<IResponse>
export function post(url: string, options?: IOptions): Promise<IResponse>
export function put(url: string, options?: IOptions): Promise<IResponse>
export default function request(url: string, options?: IOptions): Promise<IResponse>
