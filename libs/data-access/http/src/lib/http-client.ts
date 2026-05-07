import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { getConfig } from '@mono/kernel/config';
import { captureError } from '@mono/kernel/telemetry';

function createHttpClient(baseURL?: string): AxiosInstance {
  const config = getConfig();

  const client = axios.create({
    baseURL: baseURL ?? config.apiUrl,
    timeout: 15_000,
    headers: { 'Content-Type': 'application/json' },
  });

  // Auth interceptor: attach token from sessionStorage
  client.interceptors.request.use((req) => {
    if (typeof window !== 'undefined') {
      const token = sessionStorage.getItem('auth_token');
      if (token) {
        req.headers.Authorization = `Bearer ${token}`;
      }
    }
    return req;
  });

  // Error interceptor: surface structured errors + telemetry
  client.interceptors.response.use(
    (res) => res,
    (error: unknown) => {
      if (axios.isAxiosError(error)) {
        captureError(new Error(error.message), {
          url: error.config?.url,
          status: error.response?.status,
        });
      }
      return Promise.reject(error);
    },
  );

  return client;
}

export const httpClient = createHttpClient();

export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res: AxiosResponse<T> = await httpClient.get(url, config);
  return res.data;
}

export async function post<T, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res: AxiosResponse<T> = await httpClient.post(url, data, config);
  return res.data;
}

export async function put<T, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res: AxiosResponse<T> = await httpClient.put(url, data, config);
  return res.data;
}

export async function patch<T, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res: AxiosResponse<T> = await httpClient.patch(url, data, config);
  return res.data;
}

export async function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res: AxiosResponse<T> = await httpClient.delete(url, config);
  return res.data;
}
