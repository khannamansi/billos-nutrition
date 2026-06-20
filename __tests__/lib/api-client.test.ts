/** @jest-environment node */

import { apiFetch } from '../../lib/api-client'

const MOCK_URL = 'http://localhost/api/test'

function mockFetch(status: number, body: unknown) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response)
}

function mockFetchNetworkError() {
  global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))
}

afterEach(() => {
  jest.restoreAllMocks()
})

describe('apiFetch — success', () => {
  it('returns parsed JSON on 200', async () => {
    mockFetch(200, { meals: [] })
    const data = await apiFetch(MOCK_URL)
    expect(data).toEqual({ meals: [] })
  })

  it('passes method and body through to fetch', async () => {
    mockFetch(200, { success: true })
    await apiFetch(MOCK_URL, { method: 'POST', body: JSON.stringify({ x: 1 }) })
    expect(global.fetch).toHaveBeenCalledWith(
      MOCK_URL,
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ x: 1 }) })
    )
  })

  it('sets Content-Type application/json by default', async () => {
    mockFetch(200, {})
    await apiFetch(MOCK_URL, { method: 'POST', body: '{}' })
    expect(global.fetch).toHaveBeenCalledWith(
      MOCK_URL,
      expect.objectContaining({
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      })
    )
  })
})

describe('apiFetch — error responses', () => {
  it('throws on 401 with Unauthorized message', async () => {
    mockFetch(401, { error: 'Unauthorized' })
    await expect(apiFetch(MOCK_URL)).rejects.toThrow('Unauthorized')
  })

  it('throws on 400 with the error message from body', async () => {
    mockFetch(400, { error: 'Invalid input' })
    await expect(apiFetch(MOCK_URL)).rejects.toThrow('Invalid input')
  })

  it('throws on 500 with the error message from body', async () => {
    mockFetch(500, { error: 'Database failure' })
    await expect(apiFetch(MOCK_URL)).rejects.toThrow('Database failure')
  })

  it('throws on 500 with fallback message when body has no error field', async () => {
    mockFetch(500, {})
    await expect(apiFetch(MOCK_URL)).rejects.toThrow('Request failed with status 500')
  })

  it('throws on 429 with rate limit message', async () => {
    mockFetch(429, { error: 'Rate limit exceeded' })
    await expect(apiFetch(MOCK_URL)).rejects.toThrow('Rate limit exceeded')
  })

  it('includes the status code in the error when no body message', async () => {
    mockFetch(503, {})
    await expect(apiFetch(MOCK_URL)).rejects.toThrow('503')
  })
})

describe('apiFetch — network failure', () => {
  it('rethrows network errors', async () => {
    mockFetchNetworkError()
    await expect(apiFetch(MOCK_URL)).rejects.toThrow('Network error')
  })
})
