'use client';

import axios, { AxiosError } from 'axios';

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1').replace(/\/$/, '');

const readCookie = (name: string): string | undefined =>
  document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
    ?.split('=')[1];

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Double-submit CSRF: echo the readable cookie back as a header.
api.interceptors.request.use((config) => {
  const token = readCookie('csrf_token');
  if (token && !['get', 'head', 'options'].includes((config.method ?? 'get').toLowerCase())) {
    config.headers.set('x-csrf-token', decodeURIComponent(token));
  }
  return config;
});

let refreshing: Promise<unknown> | null = null;

/**
 * On a 401 the access token has simply expired: rotate it once and replay the
 * original request. Concurrent 401s share a single refresh call.
 */
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as (typeof error.config & { _retried?: boolean }) | undefined;
    const isAuthCall = config?.url?.includes('/auth/');

    if (error.response?.status === 401 && config && !config._retried && !isAuthCall) {
      config._retried = true;
      try {
        refreshing ??= api.post('/auth/refresh').finally(() => {
          refreshing = null;
        });
        await refreshing;
        return api.request(config);
      } catch {
        if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
          window.location.href = `/admin/login?next=${encodeURIComponent(window.location.pathname)}`;
        }
      }
    }

    return Promise.reject(error);
  },
);

export function apiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as { message?: string | string[] } | undefined;
    const message = payload?.message;
    if (Array.isArray(message)) return message.join('. ');
    if (message) return message;
    return error.message;
  }
  return error instanceof Error ? error.message : 'Something went wrong';
}
