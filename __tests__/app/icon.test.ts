jest.mock('next/og', () => ({
  ImageResponse: jest.fn().mockImplementation(() => ({ type: 'image' })),
}))

import Icon, { size, contentType } from '../../app/icon'

describe('icon', () => {
  it('exports correct size', () => {
    expect(size).toEqual({ width: 32, height: 32 })
  })

  it('exports correct contentType', () => {
    expect(contentType).toBe('image/png')
  })

  it('returns an ImageResponse', () => {
    const result = Icon()
    expect(result).toBeDefined()
  })
})
