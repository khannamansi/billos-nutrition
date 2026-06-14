/** @jest-environment jsdom */
import { render, screen, fireEvent } from '@testing-library/react'
import ShoppingList from '../../components/ShoppingList'

const items = [
  { name: 'Chicken Breast', category: 'Proteins', checked: false },
  { name: 'Ground Turkey', category: 'Proteins', checked: true },
  { name: 'Broccoli', category: 'Vegetables', checked: false },
]

describe('ShoppingList', () => {
  it('renders category headers', () => {
    render(<ShoppingList items={items} onToggle={jest.fn()} />)
    expect(screen.getByText('Proteins')).toBeInTheDocument()
    expect(screen.getByText('Vegetables')).toBeInTheDocument()
  })

  it('renders all item names', () => {
    render(<ShoppingList items={items} onToggle={jest.fn()} />)
    expect(screen.getByText('Chicken Breast')).toBeInTheDocument()
    expect(screen.getByText('Ground Turkey')).toBeInTheDocument()
    expect(screen.getByText('Broccoli')).toBeInTheDocument()
  })

  it('shows checkmark for checked items', () => {
    render(<ShoppingList items={items} onToggle={jest.fn()} />)
    expect(screen.getByText('✓')).toBeInTheDocument()
  })

  it('calls onToggle with correct index when item clicked', () => {
    const onToggle = jest.fn()
    render(<ShoppingList items={items} onToggle={onToggle} />)
    fireEvent.click(screen.getByText('Chicken Breast').closest('div')!)
    expect(onToggle).toHaveBeenCalledWith(0)
  })

  it('applies line-through style to checked items', () => {
    render(<ShoppingList items={items} onToggle={jest.fn()} />)
    const checkedSpan = screen.getByText('Ground Turkey')
    expect(checkedSpan).toHaveStyle({ textDecoration: 'line-through' })
  })
})
