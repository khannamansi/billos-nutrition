export async function apiFetch<T = unknown>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!res.ok) {
    let message: string
    try {
      const body = await res.json()
      message = body?.error || `Request failed with status ${res.status}`
    } catch {
      message = `Request failed with status ${res.status}`
    }
    throw new Error(message)
  }

  return res.json() as Promise<T>
}
