export type PantryCategory = {
  name: string
  emoji: string
  color: string
  items: string[]
}

export const PANTRY_CATEGORIES: PantryCategory[] = [
  {
    name: 'Proteins',
    emoji: '🥩',
    color: '#f87171',
    items: [
      'Chicken Breast', 'Ground Turkey', 'Salmon Fillet', 'Tuna (canned)',
      'Eggs', 'Greek Yogurt', 'Cottage Cheese', 'Tofu', 'Tempeh',
      'Black Beans', 'Lentils', 'Chickpeas', 'Shrimp', 'Tilapia',
      'Turkey Breast', 'Bison', 'Paneer',
    ],
  },
  {
    name: 'Vegetables',
    emoji: '🥦',
    color: '#4ade80',
    items: [
      'Spinach', 'Broccoli', 'Bell Peppers', 'Zucchini', 'Cauliflower',
      'Sweet Potato', 'Carrots', 'Cucumber', 'Tomatoes', 'Onion',
      'Garlic', 'Kale', 'Mushrooms', 'Green Beans', 'Asparagus',
    ],
  },
  {
    name: 'Grains & Carbs',
    emoji: '🌾',
    color: '#D4AF37',
    items: [
      'Brown Rice', 'White Rice', 'Quinoa', 'Oats', 'Whole Wheat Bread',
      'Pasta', 'Sweet Potato', 'Lentil Pasta', 'Rice Cakes', 'Corn Tortillas',
    ],
  },
  {
    name: 'Dairy & Alternatives',
    emoji: '🥛',
    color: '#60a5fa',
    items: [
      'Milk', 'Almond Milk', 'Oat Milk', 'Cheddar Cheese', 'Mozzarella',
      'Butter', 'Heavy Cream', 'Sour Cream', 'Cream Cheese', 'Whey Protein',
    ],
  },
  {
    name: 'Fruits',
    emoji: '🍎',
    color: '#f472b6',
    items: [
      'Banana', 'Apple', 'Berries (frozen)', 'Mango', 'Orange',
      'Avocado', 'Lemon', 'Lime', 'Grapes', 'Pineapple',
    ],
  },
  {
    name: 'Pantry Staples',
    emoji: '🫙',
    color: '#a78bfa',
    items: [
      'Olive Oil', 'Coconut Oil', 'Soy Sauce', 'Hot Sauce', 'Cumin',
      'Turmeric', 'Paprika', 'Garam Masala', 'Salt', 'Black Pepper',
      'Honey', 'Apple Cider Vinegar', 'Canned Tomatoes', 'Vegetable Broth', 'Nut Butter',
    ],
  },
]
