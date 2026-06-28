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
      'Chicken Breast', 'Ground Turkey', 'Chicken Thighs', 'Turkey Breast', 'Bison',
      'Salmon Fillet', 'Tuna (canned)', 'Tilapia', 'Cod', 'Sardines', 'Mackerel', 'Shrimp', 'Scallops',
      'Eggs', 'Egg Whites',
      'Greek Yogurt', 'Cottage Cheese', 'Paneer', 'Whey Protein', 'Casein Protein',
      'Tofu', 'Tempeh', 'Edamame', 'Seitan',
      'Black Beans', 'Lentils', 'Chickpeas', 'White Beans', 'Kidney Beans', 'Pinto Beans',
      'Beef Mince', 'Lamb', 'Pork Tenderloin',
    ],
  },
  {
    name: 'Vegetables',
    emoji: '🥦',
    color: '#4ade80',
    items: [
      'Spinach', 'Baby Spinach', 'Kale', 'Arugula', 'Bok Choy', 'Swiss Chard',
      'Broccoli', 'Cauliflower', 'Brussels Sprouts', 'Cabbage',
      'Bell Peppers', 'Jalapeño', 'Zucchini', 'Eggplant', 'Cucumber',
      'Tomatoes', 'Cherry Tomatoes', 'Canned Tomatoes',
      'Sweet Potato', 'Pumpkin', 'Butternut Squash', 'Carrots', 'Beetroot',
      'Onion', 'Red Onion', 'Green Onions', 'Garlic', 'Ginger', 'Leek',
      'Mushrooms', 'Green Beans', 'Asparagus', 'Peas', 'Corn', 'Celery', 'Fennel',
    ],
  },
  {
    name: 'Grains & Carbs',
    emoji: '🌾',
    color: '#D4AF37',
    items: [
      'Brown Rice', 'White Rice', 'Basmati Rice', 'Jasmine Rice',
      'Quinoa', 'Oats', 'Poha', 'Semolina (Sooji)',
      'Whole Wheat Bread', 'Sourdough Bread', 'Rye Bread', 'Bread Rolls',
      'Chapati', 'Paratha', 'Naan', 'Pita Bread', 'Corn Tortillas', 'Wraps',
      'Pasta', 'Lentil Pasta', 'Chickpea Pasta', 'Rice Noodles',
      'Couscous', 'Bulgur Wheat', 'Barley', 'Millet',
      'Rice Cakes', 'Crackers', 'Oat Cookies',
    ],
  },
  {
    name: 'Dairy & Alternatives',
    emoji: '🥛',
    color: '#60a5fa',
    items: [
      'Milk', 'Whole Milk', 'Low-Fat Milk',
      'Almond Milk', 'Oat Milk', 'Soy Milk', 'Coconut Milk', 'Cashew Milk',
      'Greek Yogurt', 'Plain Yogurt', 'Skyr', 'Kefir',
      'Cheddar Cheese', 'Mozzarella', 'Parmesan', 'Feta', 'Goat Cheese', 'Ricotta',
      'Butter', 'Ghee', 'Heavy Cream', 'Sour Cream', 'Cream Cheese', 'Coconut Cream',
    ],
  },
  {
    name: 'Fruits',
    emoji: '🍎',
    color: '#f472b6',
    items: [
      'Banana', 'Apple', 'Pear', 'Peach', 'Plum', 'Cherries',
      'Mango', 'Papaya', 'Pineapple', 'Watermelon', 'Coconut',
      'Orange', 'Grapefruit', 'Lemon', 'Lime',
      'Strawberries', 'Blueberries', 'Raspberries', 'Blackberries', 'Berries (frozen)',
      'Grapes', 'Kiwi', 'Pomegranate', 'Avocado',
      'Dates', 'Figs', 'Dragon Fruit',
    ],
  },
  {
    name: 'Pantry Staples',
    emoji: '🫙',
    color: '#a78bfa',
    items: [
      'Olive Oil', 'Coconut Oil', 'Avocado Oil', 'Sesame Oil',
      'Salt', 'Black Pepper', 'Red Chili Powder', 'Cumin', 'Turmeric', 'Coriander',
      'Garam Masala', 'Paprika', 'Cardamom', 'Cinnamon', 'Cloves', 'Bay Leaves',
      'Mustard Seeds', 'Fennel Seeds', 'Red Chili Flakes', 'Oregano', 'Thyme',
      'Soy Sauce', 'Fish Sauce', 'Oyster Sauce', 'Hot Sauce', 'Chili Paste', 'Red Curry Paste',
      'Apple Cider Vinegar', 'Balsamic Vinegar', 'Rice Vinegar',
      'Honey', 'Maple Syrup', 'Coconut Sugar',
      'Nut Butter', 'Tahini', 'Nutritional Yeast',
      'Almonds', 'Walnuts', 'Cashews', 'Peanuts', 'Chia Seeds', 'Flax Seeds', 'Sesame Seeds',
      'Vegetable Broth', 'Chicken Broth', 'Tomato Paste',
      'All-Purpose Flour', 'Cornstarch', 'Baking Powder', 'Baking Soda',
    ],
  },
]
