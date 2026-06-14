/** @jest-environment jsdom */
import { render, screen, fireEvent } from '@testing-library/react'
import RecipeCard from '../../components/RecipeCard'

const recipe = {
  name: 'Grilled Chicken',
  calories: 450,
  protein: 35,
  prepTime: '20 minutes',
  ingredients: 'chicken, lemon, olive oil',
  instructions: 'Grill for 20 minutes.',
}

describe('RecipeCard', () => {
  it('renders recipe name, calories, and protein', () => {
    render(<RecipeCard recipe={recipe} />)
    expect(screen.getByText('Grilled Chicken')).toBeInTheDocument()
    expect(screen.getByText('🔥 450 kcal')).toBeInTheDocument()
    expect(screen.getByText('💪 35g protein')).toBeInTheDocument()
  })

  it('renders prep time', () => {
    render(<RecipeCard recipe={recipe} />)
    expect(screen.getByText('⏱️ 20 minutes')).toBeInTheDocument()
  })

  it('renders ingredients and instructions', () => {
    render(<RecipeCard recipe={recipe} />)
    expect(screen.getByText('chicken, lemon, olive oil')).toBeInTheDocument()
    expect(screen.getByText('Grill for 20 minutes.')).toBeInTheDocument()
  })

  it('does not render Save button when onSave is not provided', () => {
    render(<RecipeCard recipe={recipe} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders Save button and calls onSave', () => {
    const onSave = jest.fn()
    render(<RecipeCard recipe={recipe} onSave={onSave} />)
    fireEvent.click(screen.getByText('❤️ Save'))
    expect(onSave).toHaveBeenCalledWith(recipe)
  })

  it('shows Saving... when saving prop is true', () => {
    render(<RecipeCard recipe={recipe} onSave={jest.fn()} saving={true} />)
    expect(screen.getByText('Saving...')).toBeInTheDocument()
  })

  it('shows ✅ Saved when saved prop is true', () => {
    render(<RecipeCard recipe={recipe} onSave={jest.fn()} saved={true} />)
    expect(screen.getByText('✅ Saved')).toBeInTheDocument()
  })

  it('disables Save button while saving', () => {
    render(<RecipeCard recipe={recipe} onSave={jest.fn()} saving={true} />)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
