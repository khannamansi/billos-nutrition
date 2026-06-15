/** @jest-environment jsdom */
import { render, screen, fireEvent } from '@testing-library/react'
import MealHistoryCard from '../../components/MealHistoryCard'

const meal = {
  id: 'm1',
  meal_name: 'Oatmeal with Berries',
  calories: 320,
  protein: 12,
  logged_at: new Date().toISOString(),
}

describe('MealHistoryCard', () => {
  it('renders meal name', () => {
    render(<MealHistoryCard meal={meal} onDelete={jest.fn()} />)
    expect(screen.getByText('Oatmeal with Berries')).toBeInTheDocument()
  })

  it('renders calories and protein', () => {
    render(<MealHistoryCard meal={meal} onDelete={jest.fn()} />)
    expect(screen.getByText('320 kcal')).toBeInTheDocument()
    expect(screen.getByText('12g protein')).toBeInTheDocument()
  })

  it('calls onDelete with meal id when delete button clicked', () => {
    const onDelete = jest.fn()
    render(<MealHistoryCard meal={meal} onDelete={onDelete} />)
    fireEvent.click(screen.getByLabelText('Delete meal'))
    expect(onDelete).toHaveBeenCalledWith('m1')
  })

  it('renders time of log entry', () => {
    render(<MealHistoryCard meal={meal} onDelete={jest.fn()} />)
    const timeStr = new Date(meal.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    expect(screen.getByText(timeStr)).toBeInTheDocument()
  })
})
