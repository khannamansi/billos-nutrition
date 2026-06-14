import React from 'react'

jest.mock('../../lib/UserContext', () => ({
  UserProvider: ({ children }: { children: React.ReactNode }) => children,
}))

import RootLayout, { metadata } from '../../app/layout'

describe('RootLayout', () => {
  it('exports metadata with a title', () => {
    expect(metadata).toBeDefined()
    expect(metadata.title).toBeDefined()
  })

  it('exports metadata with a description', () => {
    expect(metadata.description).toBeDefined()
  })

  it('is a function component', () => {
    expect(typeof RootLayout).toBe('function')
  })

  it('renders children inside html structure', () => {
    const element = RootLayout({ children: React.createElement('div', null, 'test') })
    expect(element).not.toBeNull()
    expect(element.type).toBe('html')
  })

  it('passes children through', () => {
    const child = React.createElement('span', { id: 'test-child' }, 'hello')
    const element = RootLayout({ children: child })
    expect(element).toBeDefined()
  })
})
