let currentOrder = [];
let orderType = null;
let tableNumber = null;
let currentCategory = 'all';
let selectedPaymentMethod = null;
let paymentAmount = 0;
let productCatalog = [];
let staffInventory = [];
let pendingStockRequests = [];
let outOfStockItems = [];
let currentUser = null;

// Track active stock requests
let activeStockRequestModals = new Set();
let stockRequestTimestamps = {};

// Flag to prevent multiple submissions
let isSubmittingStockRequest = false;

// ==================== 🔴 ADMIN NOTIFICATION TRACKING ====================
let outOfStockNotifications = new Set();

// ==================== 🔴 EVENT SOURCE FOR REAL-TIME UPDATES ====================
let stockEventSource = null;

// ==================== 🔴 MAXIMUM STOCK LIMIT ====================
const MAX_STOCK_PER_ITEM = 100;

// ==================== 🍽️ SERVINGWARE INVENTORY ====================
let servingwareInventory = {
    'plate': { name: 'Plate', current: 100, max: 100, unit: 'piece', minThreshold: 20 },
    'tray': { name: 'Party Tray', current: 100, max: 100, unit: 'piece', minThreshold: 15 },
    'glass': { name: 'Glass', current: 100, max: 100, unit: 'piece', minThreshold: 25 },
    'sizzling plate': { name: 'Sizzling Plate', current: 100, max: 100, unit: 'piece', minThreshold: 20 },
    'cup': { name: 'Coffee Cup', current: 100, max: 100, unit: 'piece', minThreshold: 20 },
    'bowl': { name: 'Rice Bowl', current: 100, max: 100, unit: 'piece', minThreshold: 30 },
    'pitcher': { name: 'Pitcher', current: 50, max: 50, unit: 'piece', minThreshold: 10 },
    'bottle': { name: 'Bottle', current: 100, max: 100, unit: 'piece', minThreshold: 20 },
    'serving': { name: 'Serving Plate', current: 80, max: 80, unit: 'piece', minThreshold: 15 },
    'sandwich': { name: 'Sandwich Plate', current: 50, max: 50, unit: 'piece', minThreshold: 10 },
    'meal': { name: 'Meal Tray', current: 100, max: 100, unit: 'piece', minThreshold: 20 },
    'pot': { name: 'Cooking Pot', current: 30, max: 30, unit: 'piece', minThreshold: 5 }
};

// ==================== 🥩 INGREDIENT INVENTORY ====================
let ingredientInventory = {
    'pork': { name: 'Pork', current: 50, max: 500, unit: 'kg', minThreshold: 20 },
    'chicken': { name: 'Chicken', current: 40, max: 300, unit: 'kg', minThreshold: 15 },
    'beef': { name: 'Beef', current: 30, max: 200, unit: 'kg', minThreshold: 10 },
    'shrimp': { name: 'Shrimp', current: 20, max: 100, unit: 'kg', minThreshold: 8 },
    'fish': { name: 'Cream Dory', current: 25, max: 150, unit: 'kg', minThreshold: 10 },
    'pork_belly': { name: 'Pork Belly', current: 30, max: 100, unit: 'kg', minThreshold: 10 },
    'pork_chop': { name: 'Pork Chop', current: 25, max: 80, unit: 'kg', minThreshold: 8 },
    'onion': { name: 'Onion', current: 15, max: 50, unit: 'kg', minThreshold: 5 },
    'garlic': { name: 'Garlic', current: 10, max: 30, unit: 'kg', minThreshold: 3 },
    'cabbage': { name: 'Cabbage', current: 12, max: 40, unit: 'kg', minThreshold: 5 },
    'carrot': { name: 'Carrot', current: 10, max: 30, unit: 'kg', minThreshold: 5 },
    'bell_pepper': { name: 'Bell Pepper', current: 8, max: 20, unit: 'kg', minThreshold: 3 },
    'calamansi': { name: 'Calamansi', current: 8, max: 20, unit: 'kg', minThreshold: 5 },
    'tomato': { name: 'Tomato', current: 10, max: 30, unit: 'kg', minThreshold: 5 },
    'potato': { name: 'Potato', current: 25, max: 100, unit: 'kg', minThreshold: 10 },
    'cucumber': { name: 'Cucumber', current: 10, max: 30, unit: 'kg', minThreshold: 5 },
    'eggplant': { name: 'Eggplant', current: 10, max: 30, unit: 'kg', minThreshold: 5 },
    'green_beans': { name: 'Green Beans', current: 10, max: 30, unit: 'kg', minThreshold: 5 },
    'rice': { name: 'Rice', current: 80, max: 200, unit: 'kg', minThreshold: 30 }
};

// ==================== 🍽️ PRODUCT INGREDIENT MAPPING ====================
const productIngredientMap = {
    'Korean Spicy Bulgogi (Pork)': {
        ingredients: { 
            'pork': 0.2, 
            'onion': 0.05, 
            'garlic': 0.02, 
            'gochujang': 0.03,
            'sesame_oil': 0.01,
            'soy_sauce': 0.03, 
            'cooking_oil': 0.02,
            'salt': 0.01,
            'black_pepper': 0.01,
            'chili': 0.01
        },
        servingware: 'plate'
    },
    'Korean Salt and Pepper (Pork)': {
        ingredients: { 
            'pork': 0.2, 
            'onion': 0.05, 
            'garlic': 0.02, 
            'gochujang': 0.03,
            'sesame_oil': 0.01,
            'soy_sauce': 0.03, 
            'cooking_oil': 0.02,
            'salt': 0.01,
            'black_pepper': 0.01,
            'peppercorn': 0.01
        },
        servingware: 'plate'
    },
    'Crispy Pork Lechon Kawali': {
        ingredients: { 
            'pork_belly': 0.25, 
            'garlic': 0.02, 
            'onion': 0.03,
            'salt': 0.01,
            'cooking_oil': 0.1,
            'cornstarch': 0.02
        },
        servingware: 'plate'
    },
    'Pork Shanghai': {
        ingredients: { 
            'pork': 0.15, 
            'garlic': 0.02, 
            'onion': 0.03,
            'carrots': 0.02,
            'breadcrumbs': 0.03,
            'flour': 0.02,
            'cornstarch': 0.02,
            'cooking_oil': 0.05,
            'egg': 0.02
        },
        servingware: 'plate'
    },
    'Sinigang (Pork)': {
        ingredients: { 
            'pork': 0.25, 
            'onion': 0.05, 
            'garlic': 0.02,
            'tomato': 0.05,
            'calamansi': 0.02,
            'chili': 0.01,
            'shrimp_paste': 0.02,
            'tamarind_mix': 0.03,
            'salt': 0.01,
            'black_pepper': 0.01,
            'bay_leaves': 0.01,
            'water': 0.3
        },
        servingware: 'bowl'
    },
    'Sizzling Pork Sisig': {
        ingredients: { 
            'pork': 0.2, 
            'onion': 0.05, 
            'garlic': 0.02,
            'chili': 0.02,
            'calamansi': 0.02,
            'egg': 0.05,
            'mayonnaise': 0.03,
            'soy_sauce': 0.02,
            'oyster_sauce': 0.02,
            'cooking_oil': 0.02,
            'salt': 0.01,
            'black_pepper': 0.01
        },
        servingware: 'sizzling_plate'
    },
    'Sizzling Liempo': {
        ingredients: { 
            'pork_belly': 0.25, 
            'onion': 0.05, 
            'garlic': 0.02,
            'cooking_oil': 0.02,
            'salt': 0.01
        },
        servingware: 'sizzling_plate'
    },
    'Sizzling Porkchop': {
        ingredients: { 
            'pork': 0.25, 
            'onion': 0.05, 
            'garlic': 0.02,
            'cooking_oil': 0.02,
            'salt': 0.01
        },
        servingware: 'sizzling_plate'
    },
    'Buttered Honey Chicken': {
        ingredients: { 
            'chicken': 0.25, 
            'butter': 0.03,
            'honey': 0.03,
            'cooking_oil': 0.02
        },
        servingware: 'plate'
    },
    'Buttered Spicy Chicken': {
        ingredients: { 
            'chicken': 0.25, 
            'butter': 0.03,
            'cooking_oil': 0.02,
            'chili': 0.02
        },
        servingware: 'plate'
    },
    'Chicken Adobo': {
        ingredients: { 
            'chicken': 0.25, 
            'onion': 0.05, 
            'garlic': 0.02,
            'tomato': 0.05,
            'soy_sauce': 0.04,
            'bay_leaves': 0.01,
            'salt': 0.01,
            'cooking_oil': 0.02
        },
        servingware: 'plate'
    },
    'Fried Chicken': {
        ingredients: { 
            'chicken': 0.25, 
            'breadcrumbs': 0.03,
            'flour': 0.03,
            'cooking_oil': 0.1,
            'salt': 0.01
        },
        servingware: 'plate'
    },
    'Sizzling Fried Chicken': {
        ingredients: { 
            'chicken': 0.25, 
            'onion': 0.05, 
            'garlic': 0.02,
            'cooking_oil': 0.1,
            'salt': 0.01
        },
        servingware: 'sizzling_plate'
    },
    'Budget Fried Chicken': {
        ingredients: { 
            'chicken': 0.15, 
            'breadcrumbs': 0.02,
            'flour': 0.02,
            'cooking_oil': 0.08,
            'salt': 0.01
        },
        servingware: 'plate'
    },
    'Clubhouse Sandwich': {
        ingredients: { 
            'chicken': 0.1, 
            'bread': 0.1,
            'mayonnaise': 0.02,
            'gravy': 0.03
        },
        servingware: 'plate'
    },
    'Cream Dory Fish Fillet': {
        ingredients: { 
            'cream_dory': 0.2, 
            'breadcrumbs': 0.02,
            'flour': 0.02,
            'cooking_oil': 0.05,
            'salt': 0.01
        },
        servingware: 'plate'
    },
    'Fish and Fries': {
        ingredients: { 
            'cream_dory': 0.15, 
            'french_fries': 0.15,
            'breadcrumbs': 0.02,
            'flour': 0.02,
            'cooking_oil': 0.08,
            'salt': 0.01
        },
        servingware: 'plate'
    },
    'Sinigang (Shrimp)': {
        ingredients: { 
            'shrimp': 0.2, 
            'onion': 0.05, 
            'garlic': 0.02,
            'tomato': 0.05,
            'calamansi': 0.02,
            'chili': 0.01,
            'shrimp_paste': 0.02,
            'tamarind_mix': 0.03,
            'salt': 0.01,
            'black_pepper': 0.01,
            'bay_leaves': 0.01,
            'water': 0.3
        },
        servingware: 'bowl'
    },
    'Buttered Shrimp': {
        ingredients: { 
            'shrimp': 0.2, 
            'butter': 0.03,
            'calamansi': 0.02,
            'salt': 0.01,
            'black_pepper': 0.01
        },
        servingware: 'plate'
    },
    'Special Bulalo': {
        ingredients: { 
            'beef': 0.3,
            'corn': 0.1,
            'potato': 0.1,
            'carrots': 0.1,
            'onion': 0.05,
            'garlic': 0.02,
            'bay_leaves': 0.01,
            'salt': 0.01,
            'water': 0.3,
            'chicken_broth': 0.2
        },
        servingware: 'pot'
    },
    'Special Bulalo Buy 1 Take 1 (good for 6-8 Persons)': {
        ingredients: { 
            'beef': 0.6,
            'corn': 0.2,
            'potato': 0.2,
            'carrots': 0.2,
            'onion': 0.1,
            'garlic': 0.04,
            'bay_leaves': 0.02,
            'salt': 0.02,
            'water': 0.6,
            'chicken_broth': 0.4
        },
        servingware: 'pot'
    },
    'Paknet (Pakbet w/ Bagnet)': {
        ingredients: { 
            'bagnet': 0.15,
            'onion': 0.05, 
            'garlic': 0.02,
            'tomato': 0.05,
            'cucumber': 0.05,
            'corn': 0.05,
            'potato': 0.05,
            'carrots': 0.05,
            'salt': 0.01,
            'black_pepper': 0.01
        },
        servingware: 'plate'
    },
    'Pancit Bihon (S)': {
        ingredients: { 
            'rice_noodles': 0.15,
            'onion': 0.03, 
            'garlic': 0.02,
            'carrots': 0.05,
            'soy_sauce': 0.02,
            'oyster_sauce': 0.02,
            'cooking_oil': 0.02
        },
        servingware: 'tray'
    },
    'Pancit Bihon (M)': {
        ingredients: { 
            'rice_noodles': 0.25,
            'onion': 0.05, 
            'garlic': 0.03,
            'carrots': 0.08,
            'soy_sauce': 0.03,
            'oyster_sauce': 0.03,
            'cooking_oil': 0.03
        },
        servingware: 'tray'
    },
    'Pancit Bihon (L)': {
        ingredients: { 
            'rice_noodles': 0.4,
            'onion': 0.08, 
            'garlic': 0.05,
            'carrots': 0.12,
            'soy_sauce': 0.05,
            'oyster_sauce': 0.05,
            'cooking_oil': 0.05
        },
        servingware: 'tray'
    },
    'Pancit Canton (S)': {
        ingredients: { 
            'pancit_canton': 0.15,
            'onion': 0.03, 
            'garlic': 0.02,
            'carrots': 0.05,
            'soy_sauce': 0.02,
            'oyster_sauce': 0.02,
            'cooking_oil': 0.02
        },
        servingware: 'tray'
    },
    'Pancit Canton (M)': {
        ingredients: { 
            'pancit_canton': 0.25,
            'onion': 0.05, 
            'garlic': 0.03,
            'carrots': 0.08,
            'soy_sauce': 0.03,
            'oyster_sauce': 0.03,
            'cooking_oil': 0.03
        },
        servingware: 'tray'
    },
    'Pancit Canton (L)': {
        ingredients: { 
            'pancit_canton': 0.4,
            'onion': 0.08, 
            'garlic': 0.05,
            'carrots': 0.12,
            'soy_sauce': 0.05,
            'oyster_sauce': 0.05,
            'cooking_oil': 0.05
        },
        servingware: 'tray'
    },
    'Spaghetti (S)': {
        ingredients: { 
            'spaghetti_pasta': 0.15,
            'onion': 0.03, 
            'garlic': 0.02,
            'tomato': 0.05,
            'soy_sauce': 0.02,
            'sweet_tomato_sauce': 0.05,
            'cooking_oil': 0.02
        },
        servingware: 'tray'
    },
    'Spaghetti (M)': {
        ingredients: { 
            'spaghetti_pasta': 0.25,
            'onion': 0.05, 
            'garlic': 0.03,
            'tomato': 0.08,
            'soy_sauce': 0.03,
            'sweet_tomato_sauce': 0.08,
            'cooking_oil': 0.03
        },
        servingware: 'tray'
    },
    'Spaghetti (L)': {
        ingredients: { 
            'spaghetti_pasta': 0.4,
            'onion': 0.08, 
            'garlic': 0.05,
            'tomato': 0.12,
            'soy_sauce': 0.05,
            'sweet_tomato_sauce': 0.12,
            'cooking_oil': 0.05
        },
        servingware: 'tray'
    },
    'Tinapa Rice': {
        ingredients: { 
            'rice': 0.2,
            'tinapa': 0.05
        },
        servingware: 'plate'
    },
    'Tuyo Pesto': {
        ingredients: { 
            'rice': 0.2,
            'tuyo': 0.03,
            'shrimp_paste': 0.02
        },
        servingware: 'plate'
    },
    'Fried Rice': {
        ingredients: { 
            'rice': 0.2,
            'onion': 0.02, 
            'garlic': 0.02,
            'egg': 0.05,
            'soy_sauce': 0.01,
            'sesame_oil': 0.01,
            'sugar': 0.01,
            'salt': 0.01,
            'water': 0.02,
            'cooking_oil': 0.02
        },
        servingware: 'plate'
    },
    'Plain Rice': {
        ingredients: { 
            'rice': 0.2,
            'salt': 0.01,
            'water': 0.02
        },
        servingware: 'cup'
    },
    'Cheesy Nachos': {
        ingredients: { 
            'nacho_chips': 0.15,
            'onion': 0.02,
            'cheese_sauce': 0.05,
            'cheese': 0.03,
            'cooking_oil': 0.02
        },
        servingware: 'plate'
    },
    'Nachos Supreme': {
        ingredients: { 
            'nacho_chips': 0.15,
            'onion': 0.02,
            'cheese_sauce': 0.05,
            'cheese': 0.03,
            'cooking_oil': 0.02
        },
        servingware: 'plate'
    },
    'French Fries': {
        ingredients: { 
            'french_fries': 0.2,
            'flour': 0.02,
            'cooking_oil': 0.08,
            'salt': 0.01
        },
        servingware: 'plate'
    },
    'Cheesy Dynamite Lumpia': {
        ingredients: { 
            'lumpia_wrapper': 0.1,
            'cheese': 0.05,
            'cheese_sauce': 0.03,
            'cornstarch': 0.02,
            'cooking_oil': 0.05
        },
        servingware: 'plate'
    },
    'Lumpiang Shanghai': {
        ingredients: { 
            'lumpia_wrapper': 0.1,
            'pork': 0.1,
            'carrots': 0.03,
            'onion': 0.02,
            'garlic': 0.01,
            'breadcrumbs': 0.02,
            'flour': 0.02,
            'cornstarch': 0.02,
            'cooking_oil': 0.05
        },
        servingware: 'plate'
    },
    'Cucumber Lemonade (Glass)': {
        ingredients: { 
            'cucumber': 0.05,
            'lemon_juice': 0.03,
            'honey': 0.02,
            'sugar': 0.02,
            'calamansi': 0.02,
            'water': 0.25
        },
        servingware: 'glass'
    },
    'Cucumber Lemonade (Pitcher)': {
        ingredients: { 
            'cucumber': 0.15,
            'lemon_juice': 0.09,
            'honey': 0.06,
            'sugar': 0.06,
            'calamansi': 0.06,
            'water': 0.75
        },
        servingware: 'pitcher'
    },
    'Blue Lemonade (Glass)': {
        ingredients: { 
            'blue_syrup': 0.03,
            'lemon_juice': 0.03,
            'honey': 0.02,
            'sugar': 0.02,
            'calamansi': 0.02,
            'water': 0.25
        },
        servingware: 'glass'
    },
    'Blue Lemonade (Pitcher)': {
        ingredients: { 
            'blue_syrup': 0.09,
            'lemon_juice': 0.09,
            'honey': 0.06,
            'sugar': 0.06,
            'calamansi': 0.06,
            'water': 0.75
        },
        servingware: 'pitcher'
    },
    'Red Tea (Glass)': {
        ingredients: { 
            'black_tea': 0.02,
            'honey': 0.02,
            'sugar': 0.02,
            'hot_water': 0.25
        },
        servingware: 'glass'
    },
    'Soda (Mismo)': {
        ingredients: { 
            'carbonated_soft_drink': 0.33
        },
        servingware: 'bottle'
    },
    'Soda 1.5L': {
        ingredients: { 
            'carbonated_soft_drink': 1.5
        },
        servingware: 'bottle'
    },
    'Cafe Americano Tall': {
        ingredients: { 
            'coffee_beans': 0.02,
            'sugar': 0.02,
            'hot_water': 0.25
        },
        servingware: 'cup'
    },
    'Cafe Americano Grande': {
        ingredients: { 
            'coffee_beans': 0.03,
            'sugar': 0.03,
            'hot_water': 0.35
        },
        servingware: 'cup'
    },
    'Cafe Latte Tall': {
        ingredients: { 
            'espresso': 0.05,
            'milk': 0.15,
            'sugar': 0.02,
            'vanilla_syrup': 0.02,
            'steamed_milk': 0.1
        },
        servingware: 'cup'
    },
    'Cafe Latte Grande': {
        ingredients: { 
            'espresso': 0.07,
            'milk': 0.2,
            'sugar': 0.03,
            'vanilla_syrup': 0.03,
            'steamed_milk': 0.15
        },
        servingware: 'cup'
    },
    'Caramel Macchiato Tall': {
        ingredients: { 
            'espresso': 0.05,
            'milk': 0.15,
            'sugar': 0.02,
            'caramel_syrup': 0.03,
            'steamed_milk': 0.1,
            'cream': 0.02
        },
        servingware: 'cup'
    },
    'Caramel Macchiato Grande': {
        ingredients: { 
            'espresso': 0.07,
            'milk': 0.2,
            'sugar': 0.03,
            'caramel_syrup': 0.04,
            'steamed_milk': 0.15,
            'cream': 0.03
        },
        servingware: 'cup'
    },
    'Milk Tea Regular HC': {
        ingredients: { 
            'milk': 0.15,
            'tea': 0.05,
            'sugar': 0.02,
            'tapioca_pearls': 0.05
        },
        servingware: 'cup'
    },
    'Milk Tea Regular MC': {
        ingredients: { 
            'milk': 0.15,
            'tea': 0.05,
            'sugar': 0.02,
            'tapioca_pearls': 0.05,
            'ice': 0.1
        },
        servingware: 'cup'
    },
    'Matcha Green Tea HC': {
        ingredients: { 
            'matcha_powder': 0.02,
            'milk': 0.15,
            'tea': 0.05,
            'sugar': 0.02,
            'tapioca_pearls': 0.05
        },
        servingware: 'cup'
    },
    'Matcha Green Tea MC': {
        ingredients: { 
            'matcha_powder': 0.02,
            'milk': 0.15,
            'tea': 0.05,
            'sugar': 0.02,
            'tapioca_pearls': 0.05,
            'ice': 0.1
        },
        servingware: 'cup'
    },
    'Cookies & Cream HC': {
        ingredients: { 
            'milk': 0.15,
            'cream': 0.05,
            'sugar': 0.02,
            'tapioca_pearls': 0.05,
            'cookie_crumbs': 0.03
        },
        servingware: 'cup'
    },
    'Cookies & Cream MC': {
        ingredients: { 
            'milk': 0.15,
            'cream': 0.05,
            'sugar': 0.02,
            'tapioca_pearls': 0.05,
            'cookie_crumbs': 0.03,
            'ice': 0.1
        },
        servingware: 'cup'
    },
    'Strawberry & Cream HC': {
        ingredients: { 
            'milk': 0.15,
            'cream': 0.05,
            'sugar': 0.02,
            'strawberry_syrup': 0.03,
            'tapioca_pearls': 0.05
        },
        servingware: 'cup'
    },
    'Strawberry & Cream MC': {
        ingredients: { 
            'milk': 0.15,
            'cream': 0.05,
            'sugar': 0.02,
            'strawberry_syrup': 0.03,
            'tapioca_pearls': 0.05,
            'ice': 0.1
        },
        servingware: 'cup'
    },
    'Mango cheese cake HC': {
        ingredients: { 
            'milk': 0.15,
            'cream': 0.05,
            'cream_cheese_flavor': 0.03,
            'mango_flavor': 0.03,
            'sugar': 0.02,
            'tapioca_pearls': 0.05
        },
        servingware: 'cup'
    }
};

// ==================== 🏷️ CATEGORY DISPLAY NAMES ====================
const categoryDisplayNames = {
    'Rice Bowl Meals': 'Rice Bowl Meals',
    'Hot Sizzlers': 'Hot Sizzlers',
    'Party Tray': 'Party Tray',
    'Drinks': 'Drinks',
    'Coffee': 'Coffee',
    'Milk Tea': 'Milk Tea',
    'Frappe': 'Frappe',
    'Snacks & Appetizer': 'Snacks & Appetizer',
    'Budget Meals Served with Rice': 'Budget Meals Served with Rice',
    'Specialties': 'Specialties'
};

// ==================== 🖼️ PRODUCT IMAGE MAPPING ====================
const productImageMap = {
    'Korean Spicy Bulgogi (Pork)': 'rice/korean_spicy_bulgogi.png',
    'Korean Salt and Pepper (Pork)': 'rice/korean_salt_pepper_pork.png',
    'Crispy Pork Lechon Kawali': 'rice/lechon_kawali.png',
    'Pork Shanghai': 'rice/pork_shanghai.png',
    'Sinigang (Pork)': 'specialties/sinigang_pork.png',
    'Sizzling Pork Sisig': 'sizzling/pork_sisig.png',
    'Sizzling Liempo': 'sizzling/liempo.png',
    'Sizzling Porkchop': 'sizzling/porkchop.png',
    'Buttered Honey Chicken': 'rice/buttered_honey_chicken.png',
    'Buttered Spicy Chicken': 'rice/buttered_spicy_chicken.png',
    'Chicken Adobo': 'rice/chicken_adobo.png',
    'Fried Chicken': 'sizzling/fried_chicken.png',
    'Sizzling Fried Chicken': 'sizzling/fried_chicken.png',
    'Budget Fried Chicken': 'budget/fried_chicken_Meal.png',
    'Clubhouse Sandwich': 'snacks/club_house_sandwich.png',
    'Cream Dory Fish Fillet': 'rice/cream_dory.png',
    'Fish and Fries': 'snacks/fish_fries.png',
    'Sinigang (Shrimp)': 'specialties/sinigang_shrimp.png',
    'Buttered Shrimp': 'specialties/buttered_shrimp.png',
    'Special Bulalo': 'specialties/bulalo.png',
    'Special Bulalo Buy 1 Take 1 (good for 6-8 Persons)': 'specialties/bulalo.png',
    'Paknet (Pakbet w/ Bagnet)': 'specialties/paknet.png',
    'Pancit Bihon (S)': 'party/pancit_bihon_large.png',
    'Pancit Bihon (M)': 'party/pancit_bihon_large.png',
    'Pancit Bihon (L)': 'party/pancit_bihon_large.png',
    'Pancit Canton (S)': 'party/pancit_canton_large.png',
    'Pancit Canton (M)': 'party/pancit_canton_large.png',
    'Pancit Canton (L)': 'party/pancit_canton_large.png',
    'Spaghetti (S)': 'party/spaghetti_large.png',
    'Spaghetti (M)': 'party/spaghetti_large.png',
    'Spaghetti (L)': 'party/spaghetti_large.png',
    'Tinapa Rice': 'budget/Tinapa_fried_rice.png',
    'Tuyo Pesto': 'budget/Tuyo_pesto.png',
    'Fried Rice': 'budget/fried_rice.png',
    'Plain Rice': 'budget/plain_rice.png',
    'Cheesy Nachos': 'snacks/cheesy_nachos.png',
    'Nachos Supreme': 'snacks/nachos_supreme.png',
    'French Fries': 'snacks/french_fries.png',
    'Cheesy Dynamite Lumpia': 'snacks/Cheesy_dynamite.png',
    'Lumpiang Shanghai': 'snacks/lumpiang_shanghai.png',
    'Cucumber Lemonade (Glass)': 'drinks/cucumber_lemonade.png',
    'Cucumber Lemonade (Pitcher)': 'drinks/cucumber_lemonade.png',
    'Blue Lemonade (Glass)': 'drinks/blue_lemonade.png',
    'Blue Lemonade (Pitcher)': 'drinks/blue_lemonade.png',
    'Red Tea (Glass)': 'drinks/red_tea.png',
    'Soda (Mismo)': 'drinks/soda_mismo.png',
    'Soda 1.5L': 'drinks/soda_mismo.png',
    'Cafe Americano Tall': 'coffee/cafe_americano_grande.png',
    'Cafe Americano Grande': 'coffee/cafe_americano_grande.png',
    'Cafe Latte Tall': 'coffee/cafe_latte_grande.png',
    'Cafe Latte Grande': 'coffee/cafe_latte_grande.png',
    'Caramel Macchiato Tall': 'coffee/caramel_macchiato_grande.png',
    'Caramel Macchiato Grande': 'coffee/caramel_macchiato_grande.png',
    'Milk Tea Regular HC': 'milktea/Milktea_regular.png',
    'Milk Tea Regular MC': 'milktea/Milktea_regular.png',
    'Matcha Green Tea HC': 'milktea/Matcha_greentea_HC.png',
    'Matcha Green Tea MC': 'milktea/Matcha_greentea_HC.png',
    'Cookies & Cream HC': 'frappe/Cookies_&Cream_HC.png',
    'Cookies & Cream MC': 'frappe/Cookies_&Cream_HC.png',
    'Strawberry & Cream HC': 'frappe/Strawberry_Cream_frappe_HC.png',
    'Mango cheese cake HC': 'frappe/Mango_cheesecake_HC.png'
};

const BACKEND_URL = window.location.origin;

// ==================== 📸 GET PRODUCT IMAGE ====================
function getProductImage(productName) {
    return productImageMap[productName] || 'default_food.jpg';
}

// ==================== 🎯 TOAST NOTIFICATION ====================
function showToast(message, type = 'success', duration = 3000) {
    const existingToast = document.getElementById('activeToast');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.id = 'activeToast';
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : type === 'warning' ? '#ff9800' : '#17a2b8'};
        color: white;
        border-radius: 8px;
        z-index: 99999;
        font-weight: bold;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        animation: slideInRight 0.3s ease-in-out;
        max-width: 400px;
        word-wrap: break-word;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    if (duration > 0) {
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, duration);
    }
    
    return toast;
}

// ==================== 👤 GET CURRENT USER ====================
async function getCurrentUser() {
    try {
        const response = await fetch('/api/user/me', {
            credentials: 'include'
        });
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            console.log('👤 Current user:', currentUser);
            return currentUser;
        }
    } catch (error) {
        console.error('Error getting current user:', error);
    }
    return null;
}

// ==================== LOGOUT HANDLER ====================
function handleLogout() {
    console.log('🚪 Logging out staff user...');
    
    try {
        currentOrder = [];
        pendingStockRequests = [];
        currentUser = null;
        
        const itemsToClear = [
            'pendingStockRequests',
            'localStockRequests',
            'servingwareInventory',
            'stockRequestTimestamps',
            'offlineMode',
            'lastSyncTime'
        ];
        
        itemsToClear.forEach(item => {
            localStorage.removeItem(item);
        });
        
        showToast('Logging out... Please wait', 'info', 2000);
        
        setTimeout(() => {
            fetch('/logout', {
                method: 'GET',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            })
            .then(() => {
                window.location.href = '/login?logout=true';
            })
            .catch(() => {
                window.location.href = '/login?logout=true';
            });
        }, 500);
        
    } catch (error) {
        console.error('❌ Error during logout:', error);
        window.location.href = '/login?logout=true';
    }
}

// ==================== 📋 LOAD ALL MENU ITEMS FROM MONGODB ====================
async function loadAllMenuItems() {
    console.log('📋 Loading menu items from MongoDB...');
    
    try {
        const response = await fetch('/api/menu', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success && result.data && Array.isArray(result.data)) {
            productCatalog = [];
            outOfStockItems = [];
            
            result.data.forEach(item => {
                const currentStock = parseInt(item.currentStock) || 0;
                
                const product = {
                    name: item.name || item.itemName || 'Unknown',
                    price: item.price || 0,
                    category: item.category || 'Uncategorized',
                    image: getProductImage(item.name || item.itemName || ''),
                    stock: currentStock,
                    unit: item.unit || 'piece',
                    _id: item._id || `temp_${Date.now()}_${Math.random()}`,
                    maxStock: item.maxStock || MAX_STOCK_PER_ITEM,
                    status: currentStock > 0 ? 'in_stock' : 'out_of_stock'
                };
                
                productCatalog.push(product);
                console.log(`📦 Loaded product: ${product.name} (ID: ${product._id}) - Stock: ${currentStock}`);
                
                if (currentStock <= 0) {
                    outOfStockItems.push(product.name);
                }
            });
            
            console.log(`✅ Loaded ${productCatalog.length} products from MongoDB`);
            renderMenu();
            return true;
        }
        
        console.error('❌ Invalid response from MongoDB:', result);
        showToast('Failed to load menu from database', 'error');
        return false;
        
    } catch (error) {
        console.error('❌ Error loading menu from MongoDB:', error);
        showToast(`Database connection error: ${error.message}`, 'error');
        return false;
    }
}

// ==================== 🎯 RENDER MENU ====================
function renderMenu() {
    const container = document.getElementById('menuContainer');
    if (!container) return;
    
    container.innerHTML = '';

    const items = currentCategory === 'all'
        ? productCatalog
        : productCatalog.filter(p => p.category === currentCategory);

    if (items.length === 0) {
        container.innerHTML = `
            <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 40px 20px;
                text-align: center;
                min-height: 300px;
                color: #666;
            ">
                <div style="font-size: 48px; margin-bottom: 20px;">📦</div>
                <h3 style="margin: 10px 0; font-size: 20px; color: #333;">No Products Found</h3>
                <p style="margin: 10px 0; font-size: 14px; color: #999;">
                    No items available in this category at the moment.
                </p>
                <p style="margin: 10px 0; font-size: 13px; color: #bbb;">
                    Please try another category or check back later.
                </p>
            </div>
        `;
        return;
    }

    items.forEach(product => {
        const card = createProductCard(product);
        container.appendChild(card);
    });
}

// ==================== 🎯 PRODUCT CARD ====================
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'compact-product-card';
    
    card.dataset.productName = product.name;
    card.dataset.productId = product._id;
    card.dataset.stock = product.stock || 0;
    
    card.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (product.stock > 0) {
            addItemToOrder(product.name, product.price, product);
        } else {
            showToast(`❌ ${product.name} is out of stock`, 'error', 2000);
        }
    };
    
    const stockStatus = product.stock > 0 
        ? `✅ In Stock: ${product.stock}`
        : `🚫 OUT OF STOCK`;
    
    const stockColor = product.stock > 0 ? '#28a745' : '#dc3545';
    
    const hasPendingRequest = pendingStockRequests.includes(product.name);
    const pendingIndicator = hasPendingRequest ? '<span style="color: #ff9800; font-size: 12px; display: block;">⏳ Request Pending</span>' : '';
    
    card.innerHTML = `
        <img src="/images/${product.image}" 
             onerror="this.onerror=null; this.src='/images/default_food.jpg';" 
             alt="${product.name}"
             style="opacity: ${product.stock > 0 ? '1' : '0.7'};" />
        <div class="compact-product-name">${product.name}</div>
        <div class="compact-product-category">${product.category}</div>
        <div class="compact-product-price">₱${product.price}</div>
        <div class="compact-product-stock" style="color: ${stockColor}; font-weight: bold;">
            ${stockStatus}
            ${pendingIndicator}
        </div>
    `;
    
    return card;
}

// ==================== 🔴 ADD ITEM TO ORDER ====================
// ==================== UPDATE STOCK IN MONGODB ====================
async function updateStockInMongoDB(productId, newStock) {
    try {
        console.log(`🔄 Sending stock update: Product ${productId}, New Stock: ${newStock}`);
        
        const response = await fetch(`/api/menu/${productId}/stock`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ currentStock: newStock })
        });

        if (!response.ok) {
            console.error(`❌ Failed to update stock for product ${productId}: ${response.status}`);
            const errorData = await response.json();
            console.error('Error details:', errorData);
            return false;
        }

        const result = await response.json();
        console.log(`✅ Stock PERSISTED in MongoDB for ${productId}: ${newStock} units`);
        console.log('Server Response:', result);
        return true;
    } catch (error) {
        console.error(`❌ Error updating stock in MongoDB:`, error);
        return false;
    }
}

function addItemToOrder(name, price, product = null) {
    if (!product) {
        product = productCatalog.find(p => p.name === name);
    }
    
    if (!product || product.stock <= 0) {
        showToast(`❌ ${name} is out of stock`, 'error', 2000);
        return;
    }
    
    const existingItem = currentOrder.find(item => item.name === name);
    
    // Update stock locally
    product.stock--;
    
    // Update stock in MongoDB asynchronously
    updateStockInMongoDB(product._id, product.stock);
    
    if (existingItem) {
        existingItem.quantity++;
        existingItem.subtotal = existingItem.quantity * existingItem.price;
    } else {
        currentOrder.push({
            name: product.name,
            price: product.price,
            quantity: 1,
            subtotal: product.price,
            unit: product.unit,
            _id: product._id
        });
    }
    
    if (product.stock === 0) {
        product.status = 'out_of_stock';
        if (!outOfStockItems.includes(product.name)) {
            outOfStockItems.push(product.name);
        }
    }
    
    renderOrder();
    renderMenu();
    updatePayButtonState();
    updateChange();
}

// ==================== 🧾 ORDER FUNCTIONS ====================
function renderOrder() {
    const list = document.getElementById('productlist');
    const subtotalEl = document.getElementById('subtotal');
    const totalEl = document.getElementById('totals');

    if (!list) return;

    list.innerHTML = '';
    let subtotal = 0;

    currentOrder.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        list.innerHTML += `
            <li style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid #eee;">
                <span>${item.name} x${item.quantity}</span>
                <span>₱${itemTotal.toFixed(2)}</span>
                <button onclick="removeItemFromOrder(${index})" style="background: #dc3545; color: white; border: none; border-radius: 3px; cursor: pointer; padding: 2px 8px;">✕</button>
            </li>`;
    });

    if (subtotalEl) subtotalEl.textContent = `₱${subtotal.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `${subtotal.toFixed(2)}`;
}

function removeItemFromOrder(index) {
    const item = currentOrder[index];
    const product = productCatalog.find(p => p.name === item.name);
    
    if (product) {
        product.stock += item.quantity;
        
        // Update stock in MongoDB asynchronously
        updateStockInMongoDB(product._id, product.stock);
        
        if (product.stock > 0) {
            product.status = 'in_stock';
            outOfStockItems = outOfStockItems.filter(name => name !== product.name);
        }
    }
    
    currentOrder.splice(index, 1);
    renderOrder();
    renderMenu();
    updatePayButtonState();
    updateChange();
}

function clearCurrentOrder() {
    if (currentOrder.length === 0) return;
    
    if (!confirm('Clear current order? This will return items to inventory.')) return;
    
    currentOrder.forEach(item => {
        const product = productCatalog.find(p => p.name === item.name);
        if (product) {
            product.stock += item.quantity;
            
            // Update stock in MongoDB asynchronously
            updateStockInMongoDB(product._id, product.stock);
            
            if (product.stock > 0) {
                product.status = 'in_stock';
                outOfStockItems = outOfStockItems.filter(name => name !== product.name);
            }
        }
    });
    
    currentOrder = [];
    renderOrder();
    renderMenu();
    updatePayButtonState();
    updateChange();
}

// ==================== 💰 ORDER TYPE FUNCTIONS ====================
function setDineIn() {
    orderType = "Dine In";
    const display = document.getElementById("orderTypeDisplay");
    if (display) display.textContent = orderType;
    
    // Enable table number input for dine in
    const tableInput = document.getElementById('tableNumber');
    if (tableInput) {
        tableInput.disabled = false;
        tableInput.style.backgroundColor = 'white';
        tableInput.style.opacity = '1';
        tableInput.style.pointerEvents = 'auto';
        tableInput.placeholder = 'Enter table number';
    }
    
    updatePayButtonState();
}

function setTakeout() {
    orderType = "Take Out";
    tableNumber = null;
    const display = document.getElementById("orderTypeDisplay");
    if (display) display.textContent = orderType;
    
    // Disable and clear table number input for takeout
    const tableInput = document.getElementById('tableNumber');
    if (tableInput) {
        tableInput.disabled = true;
        tableInput.value = '';
        tableInput.style.backgroundColor = '#f0f0f0';
        tableInput.style.opacity = '0.7';
        tableInput.style.pointerEvents = 'none';
        tableInput.placeholder = 'Table number not required';
    }
    
    updatePayButtonState();
}

function setTableNumber() {
    const input = document.getElementById('tableNumber');
    tableNumber = input.value.trim();
    if (tableNumber) {
        showToast(`Table #${tableNumber} selected`, 'success', 2000);
    }
    updatePayButtonState();
}

// ==================== 💰 PAYMENT FUNCTIONS ====================
function selectPaymentMethod(method) {
    selectedPaymentMethod = method;
    const display = document.getElementById("paymentMethodDisplay");
    if (display) {
        display.textContent = method === 'cash' ? 'Cash' : 'GCash';
    }
    
    // Highlight selected button
    document.querySelectorAll('.payment-method-btn').forEach(btn => {
        if (method === 'cash' && btn.id === 'cash-btn') {
            btn.style.background = '#007bff';
        } else if (method === 'gcash' && btn.id === 'gcash-btn') {
            btn.style.background = '#007bff';
        } else {
            btn.style.background = '#6c757d';
        }
    });
    
    // Handle payment input based on method
    const paymentInput = document.getElementById('inputPayment');
    
    if (paymentInput) {
        if (method === 'cash') {
            // Enable payment input for cash
            paymentInput.disabled = false;
            paymentInput.style.backgroundColor = 'white';
            paymentInput.style.opacity = '1';
            paymentInput.style.pointerEvents = 'auto';
            paymentInput.placeholder = 'Enter payment amount';
            paymentInput.value = '';
            paymentAmount = 0;
        } else {
            // Disable payment input for GCash
            paymentInput.disabled = true;
            paymentInput.style.backgroundColor = '#f0f0f0';
            paymentInput.style.opacity = '0.7';
            paymentInput.style.pointerEvents = 'none';
            paymentInput.placeholder = 'GCash payment (click Pay)';
            paymentInput.value = '';
            paymentAmount = 0;
        }
    }
    
    updatePayButtonState();
    updateChange();
}

function updatePaymentAmount() {
    const paymentInput = document.getElementById('inputPayment');
    if (!paymentInput) return;
    
    // Only update from input if method is cash
    if (selectedPaymentMethod === 'cash') {
        paymentAmount = parseFloat(paymentInput.value) || 0;
    }
    updateChange();
    updatePayButtonState();
}

function updateChange() {
    const total = currentOrder.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const changeEl = document.getElementById('changeAmount');
    
    if (!changeEl) return;
    
    if (selectedPaymentMethod === 'gcash') {
        changeEl.textContent = '0.00';
        changeEl.style.color = '#17a2b8';
    } else if (selectedPaymentMethod === 'cash') {
        if (paymentAmount >= total) {
            const change = paymentAmount - total;
            changeEl.textContent = change.toFixed(2);
            changeEl.style.color = '#28a745';
        } else {
            changeEl.textContent = '0.00';
            changeEl.style.color = '#dc3545';
        }
    } else {
        changeEl.textContent = '0.00';
        changeEl.style.color = '#666';
    }
}

// ==================== 💰 UPDATE PAY BUTTON STATE ====================
function updatePayButtonState() {
    const payButton = document.getElementById('payment-btn');
    if (!payButton) return;
    
    const total = currentOrder.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const hasItems = currentOrder.length > 0;
    const hasOrderType = orderType && orderType !== "None";
    const hasPaymentMethod = selectedPaymentMethod;
    
    // For GCash: always valid for payment (no amount needed)
    // For Cash: need payment amount >= total
    let canPay = false;
    
    if (selectedPaymentMethod === 'gcash') {
        canPay = true; // GCash can always pay immediately
    } else if (selectedPaymentMethod === 'cash') {
        canPay = paymentAmount >= total && paymentAmount > 0; // Cash needs sufficient amount
    }
    
    // Special case: Dine In requires table number
    let tableValid = true;
    if (orderType === "Dine In") {
        const tableInput = document.getElementById('tableNumber');
        tableNumber = tableInput ? tableInput.value : null;
        tableValid = tableNumber && tableNumber.trim() !== '';
    }
    
    // Enable pay button only if all conditions are met
    payButton.disabled = !(hasItems && hasOrderType && hasPaymentMethod && canPay && tableValid);
    
    // Visual feedback
    payButton.style.opacity = payButton.disabled ? '0.5' : '1';
    payButton.style.backgroundColor = payButton.disabled ? '#6c757d' : '#28a745';
    payButton.style.cursor = payButton.disabled ? 'not-allowed' : 'pointer';
    payButton.style.pointerEvents = payButton.disabled ? 'none' : 'auto';
}

// ==================== 💰 PROCESS PAYMENT ====================
async function Payment() {
    if (!currentOrder.length) {
        alert("Please add items to order");
        return;
    }
    
    if (!orderType || orderType === "None") {
        alert("Please select order type (Dine In or Take Out)");
        return;
    }
    
    if (orderType === "Dine In") {
        const tableInput = document.getElementById('tableNumber');
        tableNumber = tableInput ? tableInput.value : null;
        if (!tableNumber || tableNumber.trim() === '') {
            alert("Please enter table number for Dine In orders");
            return;
        }
    }
    
    if (!selectedPaymentMethod) {
        alert("Please select payment method (Cash or GCash)");
        return;
    }
    
    const total = currentOrder.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // For Cash, validate payment amount
    if (selectedPaymentMethod === 'cash' && paymentAmount < total) {
        alert(`Insufficient payment. Please enter at least ₱${total.toFixed(2)}`);
        return;
    }
    
    const change = selectedPaymentMethod === 'cash' ? paymentAmount - total : 0;
    
    // Show payment confirmation pop-up
    const paymentSummary = selectedPaymentMethod === 'gcash' 
        ? `GCASH PAYMENT\n\nOrder: ${orderType}${orderType === 'Dine In' ? `\nTable #${tableNumber}` : ''}\nTotal: ₱${total.toFixed(2)}\n\nProceed with GCash payment?`
        : `CASH PAYMENT\n\nOrder: ${orderType}${orderType === 'Dine In' ? `\nTable #${tableNumber}` : ''}\nTotal: ₱${total.toFixed(2)}\nPayment: ₱${paymentAmount.toFixed(2)}\nChange: ₱${change.toFixed(2)}\n\nProceed with payment?`;
    
    if (!confirm(paymentSummary)) {
        return;
    }
    
    try {
        // 1️⃣ SAVE ORDER TO DATABASE
        const orderPayload = {
            items: currentOrder.map(item => ({
                id: item.id,
                itemName: item.itemName,
                name: item.itemName,
                price: item.price,
                quantity: item.quantity,
                size: item.size || 'Regular',
                image: item.image || 'default_food.jpg',
                vatable: item.vatable !== undefined ? item.vatable : true
            })),
            total: total,
            type: orderType,
            tableNumber: orderType === 'Dine In' ? tableNumber : null,
            payment: {
                method: selectedPaymentMethod,
                amountPaid: selectedPaymentMethod === 'cash' ? paymentAmount : total
            },
            notes: ''
        };
        
        console.log('💾 Saving order to database:', orderPayload);
        
        const saveResponse = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderPayload)
        });
        
        if (!saveResponse.ok) {
            const errorData = await saveResponse.json();
            throw new Error(errorData.message || 'Failed to save order');
        }
        
        const savedOrder = await saveResponse.json();
        console.log('✅ Order saved successfully:', savedOrder);
        
        // 2️⃣ Generate and print receipt
        const receiptNumber = `RCP-${Date.now().toString().slice(-8)}`;
        const gcashRef = selectedPaymentMethod === 'gcash' ? `GCASH-${Date.now().toString().slice(-8)}` : '';
        
        // Create receipt HTML
        const receiptHTML = generateReceiptHTML(receiptNumber, total, change, gcashRef);
        
        // Print receipt
        printReceipt(receiptHTML);
        
        // 3️⃣ Clear order completely
        clearOrderAfterPayment();
               
    } catch (error) {
        console.error('❌ Error processing payment:', error);
        alert(`❌ Failed to process payment: ${error.message}`);
    }
}

// ==================== 🧹 CLEAR ORDER AFTER PAYMENT ====================
function clearOrderAfterPayment() {
    // Clear current order
    currentOrder = [];
    paymentAmount = 0;
    
    // Reset payment input
    const paymentInput = document.getElementById('inputPayment');
    if (paymentInput) {
        paymentInput.value = '';
        paymentInput.disabled = true;
        paymentInput.style.backgroundColor = '#f0f0f0';
        paymentInput.style.opacity = '0.7';
        paymentInput.style.pointerEvents = 'none';
        paymentInput.placeholder = 'Select Cash first';
    }
    
    // Reset table number input
    const tableInput = document.getElementById('tableNumber');
    if (tableInput) {
        tableInput.value = '';
        tableInput.disabled = true;
        tableInput.style.backgroundColor = '#f0f0f0';
        tableInput.style.opacity = '0.7';
        tableInput.style.pointerEvents = 'none';
        tableInput.placeholder = 'Select Dine In first';
    }
    
    // Reset payment method
    selectedPaymentMethod = null;
    document.querySelectorAll('.payment-method-btn').forEach(btn => {
        btn.style.background = '#6c757d';
    });
    
    // Reset displays
    const paymentMethodDisplay = document.getElementById("paymentMethodDisplay");
    if (paymentMethodDisplay) paymentMethodDisplay.textContent = "None";
    
    const orderTypeDisplay = document.getElementById("orderTypeDisplay");
    if (orderTypeDisplay) orderTypeDisplay.textContent = "None";
    
    const changeEl = document.getElementById('changeAmount');
    if (changeEl) {
        changeEl.textContent = '0.00';
        changeEl.style.color = '#666';
    }
    
    // Reset order type
    orderType = null;
    tableNumber = null;
    
    // Update UI
    renderOrder();
    updatePayButtonState();
}

// ==================== 🧾 GENERATE RECEIPT HTML ====================
// ==================== 🧾 GENERATE RECEIPT HTML ====================
function generateReceiptHTML(receiptNumber, total, change, gcashRef = '') {
    const timestamp = new Date().toLocaleString('en-PH', { 
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    let itemsHTML = '';
    
    currentOrder.forEach(item => {
        const itemTotal = item.price * item.quantity;
        const itemName = item.name.length > 28 ? item.name.substring(0, 25) + '...' : item.name;
        
        itemsHTML += `
            <div class="receipt-item">
                <div class="item-name">${itemName}</div>
                <div class="item-details">
                    <span>x${item.quantity}</span>
                    <span>₱${itemTotal.toFixed(2)}</span>
                </div>
            </div>
        `;
    });
    
    const paymentMethodDisplay = selectedPaymentMethod === 'cash' ? 'CASH' : 'GCASH';
    const gcashInfo = selectedPaymentMethod === 'gcash' ? `
        <div class="gcash-ref">Ref: ${gcashRef}</div>
    ` : '';
    
    const changeDisplay = selectedPaymentMethod === 'cash' ? `
        <div class="summary-row">
            <span>PAYMENT RECEIVED:</span>
            <span>₱${(total + change).toFixed(2)}</span>
        </div>
        <div class="summary-row change-row">
            <span>CHANGE:</span>
            <span>₱${change.toFixed(2)}</span>
        </div>
    ` : '';
    
    const tableInfo = orderType === 'Dine In' ? `
        <div class="table-info">TABLE #${tableNumber}</div>
    ` : `
        <div class="table-info">TAKE OUT</div>
    `;
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Receipt ${receiptNumber}</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Courier New', monospace;
                    background: white;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    margin: 0;
                    padding: 20px;
                }
                
                .receipt-container {
                    width: 80mm;
                    max-width: 80mm;
                    background: white;
                    padding: 15px 10px;
                    margin: 0 auto;
                    box-shadow: 0 0 10px rgba(0,0,0,0.1);
                }
                
                /* Header Section */
                .header {
                    text-align: center;
                    margin-bottom: 15px;
                }
                
                .restaurant-name {
                    font-size: 20px;
                    font-weight: bold;
                    letter-spacing: 1px;
                    margin-bottom: 3px;
                    text-align: center;
                }
                
                .restaurant-sub {
                    font-size: 14px;
                    text-align: center;
                    margin-bottom: 10px;
                }
                
                /* Info Section */
                .receipt-info {
                    text-align: center;
                    border-top: 1px dashed #000;
                    border-bottom: 1px dashed #000;
                    padding: 8px 0;
                    margin: 10px 0;
                }
                
                .receipt-info div {
                    text-align: center;
                    margin: 2px 0;
                }
                
                .table-info {
                    text-align: center;
                    font-weight: bold;
                    font-size: 16px;
                    padding: 8px 0;
                    border-bottom: 1px solid #000;
                    border-top: 1px solid #000;
                    margin: 10px 0;
                }
                
                /* Items Section */
                .items-section {
                    margin: 15px 0;
                }
                
                .receipt-item {
                    text-align: center;
                    padding: 5px 0;
                    border-bottom: 1px dotted #000;
                }
                
                .item-name {
                    text-align: center;
                    font-weight: bold;
                    margin-bottom: 3px;
                }
                
                .item-details {
                    display: flex;
                    justify-content: center;
                    gap: 30px;
                    font-size: 11px;
                }
                
                /* Summary Section */
                .summary-section {
                    margin: 15px 0;
                    border-top: 2px solid #000;
                    border-bottom: 2px solid #000;
                    padding: 10px 0;
                }
                
                .summary-row {
                    display: flex;
                    justify-content: center;
                    gap: 30px;
                    padding: 3px 0;
                    text-align: center;
                }
                
                .summary-row.total {
                    font-weight: bold;
                    font-size: 16px;
                    border-top: 1px solid #000;
                    border-bottom: 1px solid #000;
                    padding: 8px 0;
                    margin: 5px 0;
                }
                
                .change-row {
                    font-weight: bold;
                }
                
                /* Payment Section */
                .payment-section {
                    text-align: center;
                    margin: 15px 0;
                    padding: 10px 0;
                    border-top: 1px dashed #000;
                    border-bottom: 1px dashed #000;
                }
                
                .payment-method {
                    font-weight: bold;
                    font-size: 14px;
                    margin-bottom: 5px;
                }
                
                .gcash-ref {
                    font-size: 11px;
                    margin-top: 5px;
                }
                
                /* Footer Section */
                .footer {
                    text-align: center;
                    margin-top: 20px;
                    padding-top: 10px;
                    border-top: 2px solid #000;
                }
                
                .thank-you {
                    font-size: 18px;
                    font-weight: bold;
                    margin-bottom: 8px;
                }
                
                .footer-text {
                    font-size: 12px;
                    margin: 3px 0;
                }
                
                .footer-small {
                    font-size: 10px;
                    margin-top: 8px;
                }
                
                /* Center all text */
                div, p, span, h1, h2, h3 {
                    text-align: center !important;
                }
                
                @media print {
                    @page {
                        size: 80mm auto;
                        margin: 0;
                        padding: 0;
                    }
                    
                    html, body {
                        width: 80mm;
                        margin: 0;
                        padding: 0;
                        display: block;
                    }
                    
                    body {
                        padding: 0;
                        background: white;
                        display: block;
                        margin: 0;
                    }
                    
                    .receipt-container {
                        box-shadow: none;
                        padding: 10px 5px;
                        width: 80mm;
                        margin: 0;
                    }
                }
            </style>
        </head>
        <body>
            <div class="receipt-container">
                <!-- HEADER -->
                <div class="header">
                    <div class="restaurant-name">G-RAY COUNTRYSIDE</div>
                    <div class="restaurant-sub">CAFE & RESTAURANT</div>
                </div>
                
                <!-- RECEIPT INFO -->
                <div class="receipt-info">
                    <div>Receipt: ${receiptNumber}</div>
                    <div>${timestamp}</div>
                </div>
                
                <!-- TABLE/ORDER INFO -->
                ${tableInfo}
                
                <!-- ORDER ITEMS -->
                <div class="items-section">
                    ${itemsHTML}
                </div>
                
                <!-- SUMMARY -->
                <div class="summary-section">
                    <div class="summary-row">
                        <span>SUBTOTAL</span>
                        <span>₱${total.toFixed(2)}</span>
                    </div>
                    
                    ${changeDisplay}
                    
                    <div class="summary-row total">
                        <span>TOTAL</span>
                        <span>₱${total.toFixed(2)}</span>
                    </div>
                </div>
                
                <!-- PAYMENT INFO -->
                <div class="payment-section">
                    <div class="payment-method">Payment: ${paymentMethodDisplay}</div>
                    ${gcashInfo}
                </div>
                
                <!-- FOOTER -->
                <div class="footer">
                    <div class="thank-you">THANK YOU!</div>
                    <div class="footer-text">G-Ray Countryside Cafe</div>
                    <div class="footer-small">Please come again!</div>
                    <div class="footer-small">${new Date().toLocaleDateString()}, ${new Date().toLocaleTimeString()} Receipt ${receiptNumber}</div>
                </div>
            </div>
            
            <script>
                window.onload = function() {
                    window.print();
                };
                
                window.onafterprint = function() {
                    window.close();
                };
            </script>
        </body>
        </html>
    `;
}

// ==================== 🖨️ PRINT RECEIPT ====================
function printReceipt(receiptHTML) {
    const printWindow = window.open('', 'receipt', 'width=400,height=600');
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    
    // Close window after print completes
    printWindow.onbeforeprint = function() {
        console.log('📄 Print started...');
    };
    
    printWindow.onafterprint = function() {
        console.log('📄 Print completed, closing window...');
        setTimeout(() => {
            printWindow.close();
        }, 300);
    };
}

// ==================== 📦 STOCK REQUEST FUNCTIONS ====================
function requestStock(productId) {
    console.log('🛒 Requesting stock for ID:', productId);
    
    // Get the product name from the page (from the table row)
    // The productId is a numeric ID, we need to find the actual product name
    const stocksData = [
        // Rice Bowl Meals
        { id: 1, name: "Korean Spicy Bulgogi (Pork)" },
        { id: 2, name: "Korean Salt and Pepper (Pork)" },
        { id: 3, name: "Crispy Pork Lechon Kawali" },
        { id: 4, name: "Cream Dory Fish Fillet" },
        { id: 5, name: "Buttered Honey Chicken" },
        { id: 6, name: "Buttered Spicy Chicken" },
        { id: 7, name: "Chicken Adobo" },
        { id: 8, name: "Pork Shanghai" },
        { id: 9, name: "Sizzling Pork Sisig" },
        { id: 10, name: "Sizzling Liempo" },
        { id: 11, name: "Sizzling Porkchop" },
        { id: 12, name: "Sizzling Fried Chicken" },
        { id: 13, name: "Pancit Bihon (L)" },
        { id: 14, name: "Pancit Canton (L)" },
        { id: 15, name: "Spaghetti (L)" },
        { id: 16, name: "Tinapa Rice" },
        { id: 17, name: "Tuyo Pesto" },
        { id: 18, name: "Fried Rice" },
        { id: 19, name: "Plain Rice" },
        { id: 20, name: "Budget Fried Chicken" },
        { id: 21, name: "Cheesy Nachos" },
        { id: 22, name: "Nachos Supreme" },
        { id: 23, name: "French Fries" },
        { id: 24, name: "Cheesy Dynamite Lumpia" },
        { id: 25, name: "Lumpiang Shanghai" },
        { id: 26, name: "Clubhouse Sandwich" },
        { id: 27, name: "Fish and Fries" },
        { id: 28, name: "Cucumber Lemonade (Glass)" },
        { id: 29, name: "Cucumber Lemonade (Pitcher)" },
        { id: 30, name: "Blue Lemonade (Glass)" },
        { id: 31, name: "Blue Lemonade (Pitcher)" },
        { id: 32, name: "Red Tea (Glass)" },
        { id: 33, name: "Soda (Mismo)" },
        { id: 34, name: "Soda 1.5L" },
        { id: 35, name: "Cafe Americano Tall" },
        { id: 36, name: "Cafe Americano Grande" },
        { id: 37, name: "Cafe Latte Tall" },
        { id: 38, name: "Cafe Latte Grande" },
        { id: 39, name: "Caramel Macchiato Tall" },
        { id: 40, name: "Caramel Macchiato Grande" },
        { id: 41, name: "Milk Tea Regular HC" },
        { id: 42, name: "Milk Tea Regular MC" },
        { id: 43, name: "Matcha Green Tea HC" },
        { id: 44, name: "Matcha Green Tea MC" },
        { id: 45, name: "Cookies & Cream HC" },
        { id: 46, name: "Cookies & Cream MC" },
        { id: 47, name: "Strawberry & Cream HC" },
        { id: 48, name: "Strawberry & Cream MC" },
        { id: 49, name: "Mango cheese cake HC" },
        { id: 50, name: "Special Bulalo" },
        { id: 51, name: "Special Bulalo Buy 1 Take 1 (good for 6-8 Persons)" },
        { id: 52, name: "Paknet (Pakbet w/ Bagnet)" },
        { id: 53, name: "Sinigang (Pork)" },
        { id: 54, name: "Sinigang (Shrimp)" },
        { id: 55, name: "Buttered Shrimp" }
    ];
    
    // Find product name by ID
    const stockItem = stocksData.find(item => item.id === productId);
    const productName = stockItem ? stockItem.name : null;
    
    if (!productName) {
        console.error('❌ Product not found with ID:', productId);
        showToast('❌ Product not found', 'error', 3000);
        return;
    }
    
    console.log('✅ Found product:', productName);
    
    // Now request the stock
    const quantity = prompt(`Enter quantity to request for ${productName}:`, "10");
    if (quantity && quantity.trim()) {
        const quantityNum = parseInt(quantity);
        
        // Save to MongoDB via API
        fetch('/api/stock-requests', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                productName: productName,
                requestedQuantity: quantityNum,
                requestedBy: 'Staff',
                status: 'pending'
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                console.log('✅ Stock request saved to MongoDB:', data);
                if (data.updated) {
                    showToast(`🔄 Updated stock request for ${quantityNum} of ${productName}!`, 'success', 4000);
                } else {
                    showToast(`✅ Stock request for ${quantityNum} of ${productName} sent to admin!`, 'success', 4000);
                }
                
                // Increment request count for badge
                const count = (parseInt(localStorage.getItem('stockRequestCount')) || 0) + 1;
                localStorage.setItem('stockRequestCount', count);
                updateStockRequestNotification();
            } else {
                throw new Error(data.message || 'Failed to save request');
            }
        })
        .catch(err => {
            console.error('❌ Error saving stock request:', err);
            showToast('❌ Failed to save stock request: ' + err.message, 'error', 3000);
        });
        
        if (!pendingStockRequests.includes(productName)) {
            pendingStockRequests.push(productName);
        }
    }
}

// ==================== � NOTIFICATION BADGE UPDATE ====================
function updateStockRequestNotification() {
    try {
        // Update badge in menu.js if it exists
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            const currentCount = parseInt(badge.textContent) || 0;
            const newCount = currentCount + 1;
            badge.textContent = newCount > 99 ? '99+' : newCount;
            badge.style.display = 'inline-flex';
            badge.style.animation = 'pulse 0.5s ease-in-out';
            
            console.log('📢 Stock request notification badge updated!');
        }
        
        // Also save to localStorage to notify menu.js if on different page/window
        const stockRequestCount = (parseInt(localStorage.getItem('stockRequestCount')) || 0) + 1;
        localStorage.setItem('stockRequestCount', stockRequestCount);
        localStorage.setItem('lastStockRequest', new Date().toISOString());
        
        console.log('� Stock request saved to localStorage. Count:', stockRequestCount);
        
    } catch (error) {
        console.log('ℹ️ Badge update error:', error.message);
    }
}

// ==================== �📋 CATEGORY FUNCTIONS ====================
function filterCategory(category) {
    currentCategory = category;
    
    const buttons = document.querySelectorAll('.category-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === category) {
            btn.classList.add('active');
        }
    });
    
    renderMenu();
}

function searchFood(searchTerm) {
    const container = document.getElementById('menuContainer');
    if (!container) return;
    
    if (!searchTerm.trim()) {
        renderMenu();
        return;
    }
    
    const term = searchTerm.toLowerCase().trim();
    const filtered = productCatalog.filter(product => {
        if (currentCategory !== 'all' && product.category !== currentCategory) return false;
        return product.name.toLowerCase().includes(term);
    });
    
    container.innerHTML = '';
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 40px 20px;
                text-align: center;
                min-height: 300px;
                color: #666;
            ">
                <div style="font-size: 48px; margin-bottom: 20px;">🔍</div>
                <h3 style="margin: 10px 0;">No Results Found</h3>
                <p style="margin: 10px 0;">No products match your search for "<strong>${term}</strong>"</p>
            </div>
        `;
        return;
    }
    
    filtered.forEach(product => {
        container.appendChild(createProductCard(product));
    });
}

// ==================== 💾 STORAGE FUNCTIONS ====================
function saveInventoryToStorage() {
    localStorage.setItem('servingwareInventory', JSON.stringify(servingwareInventory));
    localStorage.setItem('ingredientInventory', JSON.stringify(ingredientInventory));
}

function loadInventoryFromStorage() {
    const saved = localStorage.getItem('servingwareInventory');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            Object.keys(parsed).forEach(key => {
                if (servingwareInventory[key]) {
                    servingwareInventory[key].current = parsed[key].current;
                }
            });
        } catch (e) {}
    }
}

// ==================== 🚀 INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Initializing POS System...');
    
    loadInventoryFromStorage();
    await getCurrentUser();
    
    console.log('📋 Loading menu items from MongoDB...');
    const menuLoaded = await loadAllMenuItems();
    
    if (!menuLoaded) {
        alert('Cannot connect to database. Please check your connection.');
    }
    
    // Setup event listeners
    const searchInput = document.querySelector('input[placeholder*="Search"]');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => searchFood(e.target.value));
    }
    
    const categoryButtons = document.querySelectorAll('.category-btn');
    categoryButtons.forEach(btn => {
        if (btn.id !== 'stockManagementBtn') {
            btn.addEventListener('click', () => {
                filterCategory(btn.dataset.category);
            });
        }
    });
    
    // Order type buttons
    const dineInBtn = document.querySelector('.dineinandtakeout-btn:nth-child(1)');
    const takeoutBtn = document.querySelector('.dineinandtakeout-btn:nth-child(2)');
    
    if (dineInBtn) dineInBtn.addEventListener('click', setDineIn);
    if (takeoutBtn) takeoutBtn.addEventListener('click', setTakeout);
    
    // Table number input
    const tableInput = document.getElementById('tableNumber');
    if (tableInput) {
        tableInput.addEventListener('input', setTableNumber);
        // Initially disabled
        tableInput.disabled = true;
        tableInput.style.backgroundColor = '#f0f0f0';
        tableInput.style.opacity = '0.7';
        tableInput.style.pointerEvents = 'none';
        tableInput.placeholder = 'Select Dine In first';
    }
    
    // Payment method buttons
    const cashBtn = document.getElementById('cash-btn');
    const gcashBtn = document.getElementById('gcash-btn');
    
    if (cashBtn) cashBtn.addEventListener('click', () => selectPaymentMethod('cash'));
    if (gcashBtn) gcashBtn.addEventListener('click', () => selectPaymentMethod('gcash'));
    
    // Payment amount input
    const paymentInput = document.getElementById('inputPayment');
    if (paymentInput) {
        paymentInput.addEventListener('input', updatePaymentAmount);
        // Initially disabled
        paymentInput.disabled = true;
        paymentInput.style.backgroundColor = '#f0f0f0';
        paymentInput.style.opacity = '0.7';
        paymentInput.style.pointerEvents = 'none';
        paymentInput.placeholder = 'Select Cash first';
    }
    
    // Pay button
    const payButton = document.getElementById('payment-btn');
    if (payButton) {
        payButton.addEventListener('click', Payment);
    }
    
    renderMenu();
    updatePayButtonState();
    
    console.log('✅ POS System initialized');
});

setInterval(saveInventoryToStorage, 30000);

// ==================== 🎯 EXPORT GLOBAL FUNCTIONS ====================
window.requestStock = requestStock;
window.setDineIn = setDineIn;
window.setTakeout = setTakeout;
window.selectPaymentMethod = selectPaymentMethod;
window.Payment = Payment;
window.clearCurrentOrder = clearCurrentOrder;
window.removeItemFromOrder = removeItemFromOrder;
window.filterCategory = filterCategory;
window.searchFood = searchFood;
window.handleLogout = handleLogout;
window.productCatalog = productCatalog;
window.pendingStockRequests = pendingStockRequests;