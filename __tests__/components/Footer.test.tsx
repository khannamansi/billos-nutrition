/** @jest-environment jsdom */
import React from 'react'
import { render, screen } from '@testing-library/react'
import Footer from '../../components/Footer'

describe('Footer', () => {
  it('renders as a footer element', () => {
    const { container } = render(<Footer />)
    expect(container.querySelector('footer')).toBeInTheDocument()
  })

  it('renders AI-generated disclaimer text', () => {
    render(<Footer />)
    expect(screen.getByText(/AI-generated/)).toBeInTheDocument()
  })

  it('mentions professional medical advice', () => {
    render(<Footer />)
    expect(screen.getByText(/medical or dietary advice/)).toBeInTheDocument()
  })
})
