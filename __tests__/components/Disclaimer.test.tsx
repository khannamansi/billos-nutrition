/** @jest-environment jsdom */
import React from 'react'
import { render, screen } from '@testing-library/react'
import Disclaimer from '../../components/Disclaimer'

describe('Disclaimer', () => {
  it('renders AI-generated notice', () => {
    render(<Disclaimer />)
    expect(screen.getByText(/AI-generated/)).toBeInTheDocument()
  })

  it('mentions healthcare provider', () => {
    render(<Disclaimer />)
    expect(screen.getByText(/healthcare provider/)).toBeInTheDocument()
  })

  it('mentions Billo', () => {
    render(<Disclaimer />)
    expect(screen.getByText(/Billo/)).toBeInTheDocument()
  })
})
