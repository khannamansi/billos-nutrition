import { apiFetch } from './api-client'

export const fetcher = <T = unknown>(url: string): Promise<T> => apiFetch<T>(url)
