export interface Response {
  data: any;
  type: 'success' | 'error' | 'exception';
  status?: number;
  statusText?: string;
  url?: string;
  headers?: {};
}

export interface Retry {
  retries?: number;
  delay?: number;
  multiplier?: number;
  shouldRetry?: (response: Response, retryInfo: { retries: number, delay: number }) => boolean;
}

export interface Options {
  method?: string;
  body?: {};
  params?: {};
  headers?: {};
  retry?: Retry;
  stringify?: (obj?: {}) => string;
  jsonIn?: boolean;
  jsonOut?: boolean;
}

export default function request(url: string, options?: Options): Promise<Response>;
export function del(url: string, options?: Options): Promise<Response>;
export function get(url: string, options?: Options): Promise<Response>;
export function head(url: string, options?: Options): Promise<Response>;
export function options(url: string, options?: Options): Promise<Response>;
export function patch(url: string, options?: Options): Promise<Response>;
export function post(url: string, options?: Options): Promise<Response>;
export function put(url: string, options?: Options): Promise<Response>;
