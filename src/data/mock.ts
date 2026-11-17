import type {
  CategoryKey, Courier, Dispute, FeeConfig, MenuItem, ModifierGroup,
  OnboardingApplication, Order, Restaurant,
} from '../types'
import { MARKET } from '../config/market'
import { shortDate } from '../lib/format'

// Mock catalogue for the Seychelles market. All prices in SCR (Seychelles Rupee).

const now = Date.now()
const min = 60_000

export const CATEGORIES: { key: CategoryKey; label: string; emoji: string }[] = [
  { key: 'deals', label: 'Deals', emoji: '🏷️' },
  { key: 'creole', label: 'Creole', emoji: '🐙' },
  { key: 'seafood', label: 'Seafood', emoji: '🐟' },
  { key: 'burgers', label: 'Burgers', emoji: '🍔' },
  { key: 'pizza', label: 'Pizza', emoji: '🍕' },
  { key: 'sushi', label: 'Sushi', emoji: '🍣' },
  { key: 'indian', label: 'Indian', emoji: '🍛' },
  { key: 'healthy', label: 'Healthy', emoji: '🥗' },
  { key: 'grocery', label: 'Grocery', emoji: '🛒' },
  { key: 'pharmacy', label: 'Pharmacy', emoji: '💊' },
  { key: 'coffee', label: 'Coffee', emoji: '☕' },
  { key: 'desserts', label: 'Desserts', emoji: '🍨' },
]

export const PROMO_BANNERS: { id: string; title: string; subtitle: string; cta: string; className: string; emoji: string; image?: string }[] = [
  { id: 'b1', title: '20% off your next 3 orders', subtitle: 'Use code EATS20 · max SCR 100 off', cta: 'Order now', className: 'from-emerald-500 to-emerald-700', emoji: '🎉', image: 'images/hero-la-digue.jpg' },
  { id: 'b2', title: 'Taste of Kreol', subtitle: 'Octopus curry, ladob & grilled fish near you', cta: 'Explore Creole', className: 'from-amber-400 to-orange-500', emoji: '🐙', image: 'images/r9-market.jpg' },
  { id: 'b3', title: 'Free delivery all weekend', subtitle: 'Code FREEDEL on orders over SCR 200', cta: 'Browse stores', className: 'from-slate-900 to-slate-700', emoji: '🛵', image: 'images/beau-vallon.jpg' },
  { id: 'b4', title: 'New here? SCR 50 off', subtitle: 'WELCOME50 on your first order over SCR 250', cta: 'Claim offer', className: 'from-sky-500 to-indigo-600', emoji: '🏝️', image: 'images/victoria-clock-tower.jpg' },
]

export const SAVED_ADDRESSES = [
  { id: 'a1', label: 'Home', line1: 'Ma Constance, House 14', line2: 'Mont Fleuri, Mahé' },
  { id: 'a2', label: 'Work', line1: 'Unity House, Albert Street', line2: 'Victoria, Mahé' },
  { id: 'a3', label: 'Gym', line1: 'Eden Island, Marina Village', line2: 'Eden Island, Mahé' },
]

export const ADDRESS_SUGGESTIONS = [
  { line1: 'Beau Vallon Beach Road', line2: 'Beau Vallon, Mahé' },
  { line1: 'Anse Royale, Coastal Road', line2: 'Anse Royale, Mahé' },
  { line1: 'Providence Industrial Estate', line2: 'Providence, Mahé' },
  { line1: 'Bel Ombre, Rue La Gare', line2: 'Bel Ombre, Mahé' },
  { line1: 'Grand Anse, Main Road', line2: 'Grand Anse, Praslin' },
  { line1: 'La Passe Jetty', line2: 'La Passe, La Digue' },
]

/** Cover photos in public/images (sources and licences in data/credits.ts). */
const COVER: Record<string, string> = {
  r1: 'images/r1-creole.jpg', r2: 'images/r2-grilled-fish.jpg', r3: 'images/r3-burger.jpg', r4: 'images/r4-pizza.jpg',
  r5: 'images/r5-indian.jpg', r6: 'images/r6-bowl.jpg', r7: 'images/r7-sushi.jpg', r8: 'images/r8-cafe.jpg',
  r9: 'images/r9-market.jpg', r10: 'images/r10-pharmacy.jpg', r11: 'images/r11-ice-cream.jpg',
}

const day = 86_400_000
/** Seeded listing plans: most stores are paid up; Coco Glacé is overdue to demo the reminder. */
const PAID_DAYS_LEFT: Record<string, number> = { r1: 21, r2: 9, r3: 27, r4: 14, r5: 3, r6: 18, r7: 25, r8: 11, r9: 6, r10: 29, r11: -4 }
const seedSubscription = (id: string) => {
  const paidUntil = now + PAID_DAYS_LEFT[id] * day
  return {
    monthlyFee: 200,
    paidUntil,
    payments: [{ id: `pay-${id}-1`, amount: 200, method: 'bank_transfer' as const, at: paidUntil - 30 * day, reference: `SUB-${id.toUpperCase()}-01`, period: `${shortDate(paidUntil - 30 * day)} – ${shortDate(paidUntil)}` }],
  }
}

const BASE_RESTAURANTS: Restaurant[] = [
  { id: 'r1', name: 'Kaz Kreol', cuisine: 'Creole · Seychellois', categories: ['creole', 'seafood', 'deals'], rating: 4.8, ratingCount: 2100, etaMin: 25, etaMax: 35, deliveryFee: 0, priceLevel: 2, distanceKm: 1.6, emoji: '🐙', gradient: 'from-amber-300 via-orange-400 to-red-500', promo: 'Free ladob over SCR 400', online: true, busyMode: false, dietary: [], address: 'Market Street, Victoria', menuCategories: ['Popular', 'Curries', 'Grills', 'Sides', 'Drinks'], tier: 'premium' },
  { id: 'r2', name: 'Lagoon Fish Grill', cuisine: 'Seafood · Grill', categories: ['seafood'], rating: 4.7, ratingCount: 1240, etaMin: 25, etaMax: 40, deliveryFee: 30, priceLevel: 3, distanceKm: 4.8, emoji: '🐟', gradient: 'from-sky-300 via-cyan-400 to-blue-600', online: true, busyMode: false, dietary: ['gluten-free'], address: 'Beau Vallon, Mahé', menuCategories: ['Popular', 'Grills', 'Platters', 'Sides'], tier: 'plus' },
  { id: 'r3', name: 'Smash Bros Burgers', cuisine: 'Burgers · American', categories: ['burgers', 'deals'], rating: 4.6, ratingCount: 1680, etaMin: 15, etaMax: 25, deliveryFee: 0, priceLevel: 2, distanceKm: 2.2, emoji: '🍔', gradient: 'from-yellow-300 via-amber-400 to-orange-600', promo: 'Buy 1 get 1 free', online: true, busyMode: false, dietary: [], address: 'Eden Island Plaza', menuCategories: ['Popular', 'Burgers', 'Sides', 'Drinks'], tier: 'standard' },
  { id: 'r4', name: 'Forno Napoli', cuisine: 'Italian · Pizza', categories: ['pizza', 'deals'], rating: 4.6, ratingCount: 1410, etaMin: 20, etaMax: 30, deliveryFee: 20, priceLevel: 2, distanceKm: 5.1, emoji: '🍕', gradient: 'from-red-300 via-red-400 to-rose-600', promo: '30% off pizzas', online: true, busyMode: false, dietary: ['vegetarian'], address: 'Beau Vallon, Mahé', menuCategories: ['Popular', 'Pizzas', 'Pasta', 'Desserts'], tier: 'standard' },
  { id: 'r5', name: 'Masala Victoria', cuisine: 'Indian · Curry', categories: ['indian'], rating: 4.5, ratingCount: 1900, etaMin: 30, etaMax: 40, deliveryFee: 25, priceLevel: 1, distanceKm: 1.1, emoji: '🍛', gradient: 'from-yellow-300 via-amber-500 to-orange-600', promo: 'Free naan over SCR 300', online: true, busyMode: false, dietary: ['vegetarian'], address: 'Albert Street, Victoria', menuCategories: ['Popular', 'Curries', 'Biryani', 'Breads'], tier: 'standard' },
  { id: 'r6', name: 'Green Bowl Co.', cuisine: 'Healthy · Salads', categories: ['healthy'], rating: 4.9, ratingCount: 640, etaMin: 15, etaMax: 25, deliveryFee: 0, priceLevel: 2, distanceKm: 3.0, emoji: '🥗', gradient: 'from-lime-300 via-emerald-400 to-teal-500', online: true, busyMode: false, dietary: ['vegan', 'vegetarian', 'gluten-free'], address: 'Providence, Mahé', menuCategories: ['Popular', 'Bowls', 'Juices'], tier: 'plus' },
  { id: 'r7', name: 'Takamaka Sushi', cuisine: 'Japanese · Sushi', categories: ['sushi', 'seafood'], rating: 4.7, ratingCount: 820, etaMin: 25, etaMax: 35, deliveryFee: 30, priceLevel: 3, distanceKm: 2.6, emoji: '🍣', gradient: 'from-rose-300 via-pink-400 to-fuchsia-500', online: true, busyMode: false, dietary: ['gluten-free'], address: 'Eden Island Marina', menuCategories: ['Popular', 'Rolls', 'Nigiri', 'Bowls'], tier: 'plus' },
  { id: 'r8', name: 'Clock Tower Café', cuisine: 'Coffee · Bakery', categories: ['coffee', 'desserts'], rating: 4.8, ratingCount: 970, etaMin: 10, etaMax: 20, deliveryFee: 15, priceLevel: 2, distanceKm: 0.8, emoji: '☕', gradient: 'from-stone-300 via-amber-600 to-stone-700', online: true, busyMode: false, dietary: ['vegetarian'], address: 'Independence Ave, Victoria', menuCategories: ['Popular', 'Coffee', 'Pastries'], tier: 'standard' },
  { id: 'r9', name: 'FreshMart Express', cuisine: 'Grocery · Convenience', categories: ['grocery', 'deals'], rating: 4.5, ratingCount: 3100, etaMin: 25, etaMax: 40, deliveryFee: 0, priceLevel: 1, distanceKm: 3.4, emoji: '🛒', gradient: 'from-emerald-300 via-green-500 to-green-700', promo: 'SCR 75 off SCR 750+', online: true, busyMode: false, dietary: ['vegan', 'vegetarian', 'gluten-free'], address: 'Providence Industrial Estate', menuCategories: ['Popular', 'Produce', 'Pantry', 'Household'], tier: 'premium' },
  { id: 'r10', name: 'IslandCare Pharmacy', cuisine: 'Pharmacy · Health', categories: ['pharmacy'], rating: 4.7, ratingCount: 410, etaMin: 20, etaMax: 35, deliveryFee: 25, priceLevel: 1, distanceKm: 1.3, emoji: '💊', gradient: 'from-teal-300 via-cyan-400 to-sky-500', online: true, busyMode: false, dietary: [], address: 'Revolution Ave, Victoria', menuCategories: ['Popular', 'Wellness', 'Personal care'], tier: 'standard' },
  { id: 'r11', name: 'Coco Glacé', cuisine: 'Desserts · Ice cream', categories: ['desserts'], rating: 4.4, ratingCount: 380, etaMin: 15, etaMax: 25, deliveryFee: 20, priceLevel: 1, distanceKm: 6.2, emoji: '🍨', gradient: 'from-pink-300 via-fuchsia-400 to-purple-500', promo: '2 scoops free', online: false, busyMode: false, dietary: ['vegetarian'], address: 'Anse Royale, Mahé', menuCategories: ['Popular', 'Ice cream', 'Shakes'], tier: 'standard' },
]

export const RESTAURANTS: Restaurant[] = BASE_RESTAURANTS.map((r) => ({ ...r, image: COVER[r.id], subscription: seedSubscription(r.id) }))

export const MODIFIER_GROUPS: ModifierGroup[] = [
  // Kaz Kreol
  { id: 'g-portion', restaurantId: 'r1', name: 'Portion', type: 'single', required: true, options: [
    { id: 'o-reg-p', name: 'Regular', price: 0 }, { id: 'o-large-p', name: 'Large', price: 60 }] },
  { id: 'g-chilli', restaurantId: 'r1', name: 'Chilli level', type: 'single', required: true, options: [
    { id: 'o-nochilli', name: 'No chilli', price: 0 }, { id: 'o-mildc', name: 'Mild', price: 0 }, { id: 'o-hotc', name: 'Piman 🔥', price: 0 }] },
  { id: 'g-kreol-sides', restaurantId: 'r1', name: 'Add a side', type: 'multi', required: false, max: 3, options: [
    { id: 'o-rice', name: 'Extra rice', price: 25 }, { id: 'o-lentils', name: 'Lentils', price: 30 }, { id: 'o-chutney', name: 'Papaya chutney', price: 25 },
    { id: 'o-breadfruit', name: 'Breadfruit chips', price: 45 }] },
  // Lagoon Fish Grill
  { id: 'g-fish', restaurantId: 'r2', name: 'Catch of the day', type: 'single', required: true, options: [
    { id: 'o-job', name: 'Job fish', price: 0 }, { id: 'o-bourzwa', name: 'Red snapper (Bourzwa)', price: 50 }, { id: 'o-tuna', name: 'Yellowfin tuna', price: 40 }] },
  { id: 'g-sauce', restaurantId: 'r2', name: 'Sauce', type: 'single', required: true, options: [
    { id: 'o-garlic', name: 'Garlic butter', price: 0 }, { id: 'o-creole', name: 'Creole sauce', price: 0 }, { id: 'o-lemon', name: 'Lemon & herb', price: 0 }] },
  { id: 'g-fish-extra', restaurantId: 'r2', name: 'Extras', type: 'multi', required: false, max: 2, options: [
    { id: 'o-salad', name: 'Green salad', price: 35 }, { id: 'o-fries', name: 'Fries', price: 40 }] },
  // Smash Bros
  { id: 'g-size', restaurantId: 'r3', name: 'Choose your patty', type: 'single', required: true, options: [
    { id: 'o-single', name: 'Single', price: 0 }, { id: 'o-double', name: 'Double', price: 45 }, { id: 'o-triple', name: 'Triple', price: 80 }] },
  { id: 'g-addons', restaurantId: 'r3', name: 'Add-ons', type: 'multi', required: false, max: 4, options: [
    { id: 'o-cheese', name: 'Extra cheese', price: 15 }, { id: 'o-bacon', name: 'Beef bacon', price: 25 }, { id: 'o-egg', name: 'Fried egg', price: 20 },
    { id: 'o-jal', name: 'Jalapeños', price: 10 }] },
  // Forno
  { id: 'g-crust', restaurantId: 'r4', name: 'Size', type: 'single', required: true, options: [
    { id: 'o-10', name: '10" Classic', price: 0 }, { id: 'o-14', name: '14" Large', price: 90 }] },
  { id: 'g-toppings', restaurantId: 'r4', name: 'Extra toppings', type: 'multi', required: false, max: 5, options: [
    { id: 'o-burrata', name: 'Burrata', price: 60 }, { id: 'o-mush', name: 'Mushrooms', price: 20 }, { id: 'o-olive', name: 'Olives', price: 15 }, { id: 'o-chili', name: 'Chilli oil', price: 10 }] },
  // Masala
  { id: 'g-heat', restaurantId: 'r5', name: 'Heat level', type: 'single', required: true, options: [
    { id: 'o-h1', name: 'Mild', price: 0 }, { id: 'o-h2', name: 'Medium', price: 0 }, { id: 'o-h3', name: 'Indian hot', price: 0 }] },
  // Green bowl
  { id: 'g-base', restaurantId: 'r6', name: 'Choose a base', type: 'single', required: true, options: [
    { id: 'o-quinoa', name: 'Quinoa', price: 0 }, { id: 'o-greens', name: 'Mixed greens', price: 0 }, { id: 'o-rice2', name: 'Brown rice', price: 0 }] },
  { id: 'g-protein', restaurantId: 'r6', name: 'Add protein', type: 'multi', required: false, max: 2, options: [
    { id: 'o-tofu', name: 'Crispy tofu', price: 35 }, { id: 'o-chicken', name: 'Grilled chicken', price: 45 }, { id: 'o-tuna2', name: 'Seared tuna', price: 70 }] },
  // Takamaka Sushi
  { id: 'g-pcs', restaurantId: 'r7', name: 'Pieces', type: 'single', required: true, options: [
    { id: 'o-6', name: '6 pieces', price: 0 }, { id: 'o-12', name: '12 pieces', price: 140 }] },
  // Clock Tower
  { id: 'g-milk', restaurantId: 'r8', name: 'Milk', type: 'single', required: true, options: [
    { id: 'o-full', name: 'Full cream', price: 0 }, { id: 'o-oat', name: 'Oat', price: 15 }, { id: 'o-coconut', name: 'Coconut', price: 15 }] },
  { id: 'g-shots', restaurantId: 'r8', name: 'Extras', type: 'multi', required: false, max: 3, options: [
    { id: 'o-shot', name: 'Extra shot', price: 20 }, { id: 'o-vanilla', name: 'Vanilla syrup', price: 10 }, { id: 'o-caramel', name: 'Caramel', price: 10 }] },
]

const item = (
  id: string, restaurantId: string, category: string, name: string, description: string,
  price: number, emoji: string, modifierGroupIds: string[] = [], extra: Partial<MenuItem> = {},
): MenuItem => ({ id, restaurantId, category, name, description, price, emoji, modifierGroupIds, ...extra })

export const MENU_ITEMS: MenuItem[] = [
  // r1 Kaz Kreol
  item('m1', 'r1', 'Curries', 'Octopus Curry (Kari Zourit)', 'Slow-cooked octopus in coconut milk, masala and fresh turmeric. Served with rice.', 245, '🐙', ['g-portion', 'g-chilli', 'g-kreol-sides'], { popular: true, calories: 640 }),
  item('m2', 'r1', 'Curries', 'Fish Curry (Kari Pwason)', 'Catch-of-the-day curry with eggplant, tamarind and creole spices.', 210, '🍲', ['g-portion', 'g-chilli', 'g-kreol-sides'], { popular: true, calories: 590 }),
  item('m3', 'r1', 'Curries', 'Chicken Curry Kreol', 'Bone-in chicken, curry leaves, ginger, coconut cream.', 190, '🍛', ['g-portion', 'g-chilli', 'g-kreol-sides'], { calories: 610 }),
  item('m4', 'r1', 'Curries', 'Lentil & Pumpkin Curry', 'Red lentils, pumpkin, coconut and mustard seeds.', 160, '🎃', ['g-portion', 'g-chilli'], { dietary: ['vegan'], calories: 480 }),
  item('m5', 'r1', 'Grills', 'Grilled Job Fish', 'Whole-fillet job fish, creole sauce, rice and salad.', 275, '🐟', ['g-chilli', 'g-kreol-sides'], { popular: true }),
  item('m6', 'r1', 'Sides', 'Breadfruit Chips (Friti Lafouyapen)', 'Crispy fried breadfruit with sea salt.', 65, '🍟', [], { dietary: ['vegan'] }),
  item('m7', 'r1', 'Sides', 'Shark Chutney (Satini Reken)', 'Traditional flaked shark with bilimbi and lime.', 95, '🦈', [], { soldOut: true }),
  item('m8', 'r1', 'Drinks', 'Ladob Banana', 'Plantain simmered in coconut milk, nutmeg and vanilla.', 85, '🍌', [], { dietary: ['vegetarian'] }),
  item('m9', 'r1', 'Drinks', 'Fresh Passion Juice', 'Freshly pressed local passion fruit.', 60, '🥤', [], { dietary: ['vegan'] }),
  // r2 Lagoon
  item('m20', 'r2', 'Grills', 'Grilled Fish of the Day', 'Charcoal-grilled whole fillet, rice and creole salad.', 295, '🐟', ['g-fish', 'g-sauce', 'g-fish-extra'], { popular: true }),
  item('m21', 'r2', 'Grills', 'Garlic Prawns', 'Jumbo prawns, garlic butter, parsley, lime.', 345, '🦐', ['g-sauce', 'g-fish-extra'], { popular: true }),
  item('m22', 'r2', 'Platters', 'Seafood Platter for Two', 'Fish, prawns, calamari, octopus salad, rice and fries.', 790, '🦞', [], { popular: true }),
  item('m23', 'r2', 'Sides', 'Octopus Salad', 'Lime, onion, chilli and coriander.', 165, '🥗'),
  item('m24', 'r2', 'Sides', 'Grilled Breadfruit', 'With salted butter.', 55, '🍞', [], { dietary: ['vegetarian'] }),
  // r3 Smash Bros
  item('m30', 'r3', 'Burgers', 'Classic Smash', 'Two crispy-edged patties, cheese, pickles, onions, smash sauce.', 175, '🍔', ['g-size', 'g-addons'], { popular: true, calories: 780 }),
  item('m31', 'r3', 'Burgers', 'Island Fish Burger', 'Crispy local fish, mango slaw, tartare sauce.', 185, '🐠', ['g-addons'], { popular: true }),
  item('m32', 'r3', 'Burgers', 'Garden Smash (V)', 'Plant-based patty, vegan cheese, lettuce, tomato.', 190, '🌱', ['g-addons'], { dietary: ['vegan'] }),
  item('m33', 'r3', 'Sides', 'Loaded Fries', 'Cheese sauce, crispy onions, chives.', 95, '🍟'),
  item('m34', 'r3', 'Drinks', 'Vanilla Shake', 'Thick, hand-spun vanilla.', 85, '🥤'),
  // r4 Forno
  item('m40', 'r4', 'Pizzas', 'Margherita', 'Tomato, fior di latte, basil, olive oil.', 210, '🍕', ['g-crust', 'g-toppings'], { popular: true, dietary: ['vegetarian'] }),
  item('m41', 'r4', 'Pizzas', 'Tuna & Red Onion', 'Local yellowfin tuna, red onion, capers.', 260, '🐟', ['g-crust', 'g-toppings'], { popular: true }),
  item('m42', 'r4', 'Pizzas', 'Diavola', 'Spicy beef salami, chilli, mozzarella.', 250, '🌶️', ['g-crust', 'g-toppings']),
  item('m43', 'r4', 'Pasta', 'Seafood Linguine', 'Prawns, calamari, cherry tomato, garlic.', 285, '🍝'),
  item('m44', 'r4', 'Desserts', 'Tiramisu', 'Classic mascarpone & espresso.', 120, '🍰'),
  // r5 Masala
  item('m50', 'r5', 'Curries', 'Butter Chicken', 'Tandoori chicken in creamy tomato makhani.', 195, '🍛', ['g-heat'], { popular: true }),
  item('m51', 'r5', 'Curries', 'Paneer Tikka Masala', 'Char-grilled paneer, onion-tomato masala.', 175, '🧀', ['g-heat'], { dietary: ['vegetarian'] }),
  item('m52', 'r5', 'Biryani', 'Fish Biryani', 'Local fish dum biryani, raita.', 225, '🍚', ['g-heat'], { popular: true }),
  item('m53', 'r5', 'Breads', 'Garlic Naan', 'Tandoor-baked, butter & garlic.', 40, '🫓'),
  // r6 Green bowl
  item('m60', 'r6', 'Bowls', 'Tropical Harvest Bowl', 'Roast sweet potato, kale, mango, chickpeas, tahini.', 185, '🥗', ['g-base', 'g-protein'], { popular: true, dietary: ['vegan', 'gluten-free'] }),
  item('m61', 'r6', 'Bowls', 'Poke Tuna Bowl', 'Yellowfin tuna, avocado, edamame, sesame.', 245, '🐟', ['g-base'], { popular: true }),
  item('m62', 'r6', 'Juices', 'Green Coconut', 'Fresh young coconut water.', 55, '🥥', [], { dietary: ['vegan'] }),
  // r7 Takamaka sushi
  item('m70', 'r7', 'Rolls', 'Dragon Roll', 'Prawn tempura, avocado, eel glaze.', 260, '🐉', ['g-pcs'], { popular: true }),
  item('m71', 'r7', 'Rolls', 'Spicy Tuna Roll', 'Local tuna, sriracha mayo, cucumber.', 220, '🍣', ['g-pcs'], { popular: true }),
  item('m72', 'r7', 'Nigiri', 'Tuna Nigiri (2pc)', 'Yellowfin tuna, fresh wasabi.', 110, '🍙'),
  item('m73', 'r7', 'Bowls', 'Chirashi Bowl', 'Assorted sashimi over sushi rice.', 320, '🥢'),
  // r8 Clock Tower
  item('m80', 'r8', 'Coffee', 'Flat White', 'Double espresso, steamed milk.', 75, '☕', ['g-milk', 'g-shots'], { popular: true }),
  item('m81', 'r8', 'Coffee', 'Iced Vanilla Latte', 'Over ice with Seychelles vanilla.', 90, '🧋', ['g-milk', 'g-shots']),
  item('m82', 'r8', 'Pastries', 'Coconut Tart (Napolitaine)', 'Local coconut & jam pastry.', 45, '🥧', [], { popular: true }),
  // r9 FreshMart
  item('m90', 'r9', 'Produce', 'Local Bananas (1kg)', 'Grown on Mahé.', 45, '🍌', [], { popular: true }),
  item('m91', 'r9', 'Produce', 'Fresh Coconuts (3)', 'Ready to drink.', 60, '🥥'),
  item('m92', 'r9', 'Pantry', 'Fresh Baguette', 'Baked this morning.', 25, '🥖', [], { popular: true }),
  item('m93', 'r9', 'Pantry', 'Eggs (12)', 'Local farm.', 75, '🥚'),
  item('m94', 'r9', 'Household', 'Paper Towels (6 rolls)', 'Extra absorbent.', 110, '🧻'),
  // r10 IslandCare
  item('m100', 'r10', 'Wellness', 'Vitamin D3 1000IU', '90 softgels.', 220, '💊', [], { popular: true }),
  item('m101', 'r10', 'Personal care', 'Reef-safe SPF 50', 'Mineral sunscreen, 100ml.', 340, '🧴', [], { popular: true }),
  item('m102', 'r10', 'Wellness', 'Insect Repellent', 'DEET-free, 100ml.', 165, '🦟'),
  // r11 Coco Glacé
  item('m110', 'r11', 'Ice cream', 'Coconut & Vanilla Scoop', 'Made with Seychelles vanilla.', 60, '🍨', [], { popular: true }),
  item('m111', 'r11', 'Shakes', 'Mango Shake', 'Fresh mango, whipped top.', 95, '🥭'),
]

export const COURIERS: Courier[] = [
  { id: 'c1', name: 'Jean-Paul L.', vehicle: 'Yamaha NMAX · Scooter', plate: 'S 24813', rating: 4.95, online: true },
  { id: 'c2', name: 'Marie-Claire H.', vehicle: 'Suzuki Swift · Car', plate: 'S 10922', rating: 4.9, online: true },
  { id: 'c3', name: 'Ravi P.', vehicle: 'E-scooter', plate: '—', rating: 4.87, online: true },
]

/** The courier identity used in the Courier Partner view */
export const ME_COURIER = COURIERS[0]

export const DEFAULT_FEE_CONFIG: FeeConfig = {
  serviceFeePct: 5,
  serviceFeeMin: 10,
  serviceFeeMax: 60,
  smallOrderThreshold: 150,
  smallOrderFee: 25,
  priorityFee: 30,
  deliveryFeeMultiplier: 1,
  taxPct: MARKET.vatPct,
  commission: { standard: 30, plus: 25, premium: 20 },
  subscriptionFee: 200,
  perTripCommission: 15,
}

const line = (id: string, itemId: string, restaurantId: string, name: string, emoji: string, quantity: number, unitPrice: number, selectionLabels: string[] = [], instructions = '') =>
  ({ id, itemId, restaurantId, name, emoji, quantity, unitPrice, selections: {}, selectionLabels, instructions })

const fees = (subtotal: number, deliveryFee = 0, tip = 25) => {
  const serviceFee = Math.min(DEFAULT_FEE_CONFIG.serviceFeeMax, Math.max(DEFAULT_FEE_CONFIG.serviceFeeMin, subtotal * 0.05))
  const tax = (subtotal + serviceFee + deliveryFee) * (MARKET.vatPct / 100)
  return { subtotal, deliveryFee, serviceFee, smallOrderFee: 0, priorityFee: 0, tax, tip, discount: 0, total: subtotal + deliveryFee + serviceFee + tax + tip }
}

/** Seeded live orders so the KDS / admin views aren't empty on first load */
export const SEED_ORDERS: Order[] = [
  {
    id: 'EAT-4821', restaurantId: 'r1', restaurantName: 'Kaz Kreol', restaurantEmoji: '🐙', customerName: 'Nadia M.',
    address: 'Bel Air, House 7, Victoria',
    lines: [line('l1', 'm1', 'r1', 'Octopus Curry (Kari Zourit)', '🐙', 2, 245, ['Regular', 'Mild']), line('l2', 'm6', 'r1', 'Breadfruit Chips (Friti Lafouyapen)', '🍟', 1, 65)],
    fees: fees(555), status: 'placed', placedAt: now - 0.3 * min, acceptDeadline: now + 1.6 * min, prepMinutes: 15,
    dropoff: 'door', instructions: 'Blue gate, ring twice', speed: 'standard', mode: 'delivery', timeline: { placed: now - 0.3 * min },
  },
  {
    id: 'EAT-4817', restaurantId: 'r1', restaurantName: 'Kaz Kreol', restaurantEmoji: '🐙', customerName: 'Patrick D.',
    address: 'Mont Fleuri, Rue Mahé, Apt 3',
    lines: [line('l3', 'm5', 'r1', 'Grilled Job Fish', '🐟', 1, 275, ['Piman 🔥']), line('l4', 'm9', 'r1', 'Fresh Passion Juice', '🥤', 1, 60)],
    fees: fees(335), status: 'preparing', placedAt: now - 6 * min, acceptedAt: now - 5 * min, acceptDeadline: now, prepMinutes: 18,
    courierId: 'c2', courierName: 'Marie-Claire H.', courierEtaToStore: 6,
    dropoff: 'meet', instructions: '', speed: 'priority', mode: 'delivery', timeline: { placed: now - 6 * min, preparing: now - 5 * min },
  },
  {
    id: 'EAT-4809', restaurantId: 'r1', restaurantName: 'Kaz Kreol', restaurantEmoji: '🐙', customerName: 'Sophie L.',
    address: 'Eden Island, Villa 112',
    lines: [line('l5', 'm2', 'r1', 'Fish Curry (Kari Pwason)', '🍲', 1, 270, ['Large', 'No chilli']), line('l6', 'm8', 'r1', 'Ladob Banana', '🍌', 1, 85)],
    fees: fees(355), status: 'ready', placedAt: now - 15 * min, acceptedAt: now - 14 * min, acceptDeadline: now, prepMinutes: 12,
    courierId: 'c3', courierName: 'Ravi P.', courierEtaToStore: 2,
    dropoff: 'door', instructions: 'Leave with security at gate', speed: 'standard', mode: 'delivery', timeline: { placed: now - 15 * min, preparing: now - 14 * min, ready: now - 1 * min },
  },
  {
    id: 'EAT-4795', restaurantId: 'r4', restaurantName: 'Forno Napoli', restaurantEmoji: '🍕', customerName: 'Daniel P.',
    address: 'Beau Vallon, Coral Strand Rd', lines: [line('l7', 'm40', 'r4', 'Margherita', '🍕', 2, 210, ['10" Classic'])],
    fees: fees(420, 20), status: 'on_the_way', placedAt: now - 24 * min, acceptedAt: now - 23 * min, acceptDeadline: now, prepMinutes: 15,
    courierId: 'c1', courierName: 'Jean-Paul L.', dropoff: 'door', instructions: '', speed: 'standard', mode: 'delivery',
    timeline: { placed: now - 24 * min, preparing: now - 23 * min, ready: now - 9 * min, courier_at_store: now - 8 * min, on_the_way: now - 6 * min },
  },
]

export const SEED_APPLICATIONS: OnboardingApplication[] = [
  { id: 'app1', businessName: 'Chez Batista', cuisine: 'Creole · Beach grill', owner: 'Marc Batista', area: 'Takamaka, Mahé', submittedAt: now - 2 * 3600_000, emoji: '🦐', documents: { tradeLicense: true, foodSafety: true, bankDetails: true, menuUploaded: true }, status: 'pending', tier: 'standard' },
  { id: 'app2', businessName: 'Praslin Pizza Co.', cuisine: 'Italian · Pizza', owner: 'Elena Rossi', area: 'Grand Anse, Praslin', submittedAt: now - 7 * 3600_000, emoji: '🍕', documents: { tradeLicense: true, foodSafety: false, bankDetails: true, menuUploaded: true }, status: 'pending', tier: 'plus' },
  { id: 'app3', businessName: 'Lakaz Takeaway', cuisine: 'Creole · Takeaway boxes', owner: 'Josette Hoareau', area: 'Anse aux Pins, Mahé', submittedAt: now - 26 * 3600_000, emoji: '🍱', documents: { tradeLicense: true, foodSafety: true, bankDetails: false, menuUploaded: false }, status: 'pending', tier: 'standard' },
  { id: 'app4', businessName: 'La Digue Smoothie Shack', cuisine: 'Juices · Smoothies', owner: 'Kevin Laporte', area: 'La Passe, La Digue', submittedAt: now - 48 * 3600_000, emoji: '🥭', documents: { tradeLicense: true, foodSafety: true, bankDetails: true, menuUploaded: true }, status: 'pending', tier: 'premium' },
]

export const SEED_DISPUTES: Dispute[] = [
  { id: 'D-1042', orderId: 'EAT-4711', customer: 'Hannah W.', restaurant: 'Takamaka Sushi', type: 'Missing item', amount: 220, status: 'open', createdAt: now - 35 * min, note: 'Spicy Tuna Roll missing from the bag. Photo attached by customer.' },
  { id: 'D-1041', orderId: 'EAT-4698', customer: 'Gilbert A.', restaurant: 'Masala Victoria', type: 'Late delivery', amount: 90, status: 'investigating', createdAt: now - 80 * min, note: 'Delivered 38 min after ETA. Courier GPS shows traffic on the Providence Highway.' },
  { id: 'D-1040', orderId: 'EAT-4655', customer: 'Priya N.', restaurant: 'Forno Napoli', type: 'Damaged / spilled', amount: 260, status: 'open', createdAt: now - 3 * 3600_000, note: 'Pizza box crushed, toppings displaced.' },
  { id: 'D-1039', orderId: 'EAT-4620', customer: 'Marco T.', restaurant: 'Smash Bros Burgers', type: 'Wrong order', amount: 175, status: 'refunded', createdAt: now - 5 * 3600_000, note: 'Received fish burger instead of beef.', refundAmount: 175 },
  { id: 'D-1038', orderId: 'EAT-4588', customer: 'Yuki A.', restaurant: 'Green Bowl Co.', type: 'Never arrived', amount: 300, status: 'rejected', createdAt: now - 9 * 3600_000, note: 'Proof-of-delivery photo shows correct door. Customer later confirmed found with neighbour.' },
]
