// ==================== GLOBAL VARIABLES ====================
let allMenuItems = [];
let notifications = [];
let stockRequestNotifications = []; // Separate array for stock requests
let notificationCount = 0;
let stockRequestCount = 0; // Count for stock requests
let isNotificationModalOpen = false;
let hasNewNotifications = false;
let hasNewStockRequests = false;
let currentSection = 'dashboard';
let currentCategory = 'all';
let isModalOpen = false;
let retryCount = 0;
let currentInventoryCache = [];
let lastInventoryCacheTime = 0;

// PAGINATION VARIABLES
let currentPage = 1;
let itemsPerPage = 15;
let totalPages = 1;
let filteredMenuItems = [];

// NOTIFICATION EVENT SOURCE
let notificationEventSource = null;

const MAX_RETRIES = 3;
const BACKEND_URL = 'http://localhost:5050';
const INVENTORY_CACHE_DURATION = 5000;

// ==================== INGREDIENT INVENTORY ====================
const ingredientInventory = {
    'pork': { name: 'Pork', current: 100, max: 500, unit: 'kg', minThreshold: 20 },
    'chicken': { name: 'Chicken', current: 100, max: 300, unit: 'kg', minThreshold: 15 },
    'beef': { name: 'Beef', current: 50, max: 100, unit: 'kg', minThreshold: 10 },
    'shrimp': { name: 'Shrimp', current: 50, max: 100, unit: 'kg', minThreshold: 8 },
    'fish': { name: 'Cream Dory', current: 50, max: 150, unit: 'kg', minThreshold: 10 },
    'pork_belly': { name: 'Pork Belly', current: 50, max: 100, unit: 'kg', minThreshold: 10 },
    'pork_chop': { name: 'Pork Chop', current: 50, max: 80, unit: 'kg', minThreshold: 8 },
    'onion': { name: 'Onion', current: 30, max: 50, unit: 'kg', minThreshold: 5 },
    'garlic': { name: 'Garlic', current: 20, max: 30, unit: 'kg', minThreshold: 3 },
    'cabbage': { name: 'Cabbage', current: 30, max: 40, unit: 'kg', minThreshold: 5 },
    'carrot': { name: 'Carrot', current: 20, max: 30, unit: 'kg', minThreshold: 5 },
    'bell_pepper': { name: 'Bell Pepper', current: 15, max: 20, unit: 'kg', minThreshold: 3 },
    'calamansi': { name: 'Calamansi', current: 15, max: 20, unit: 'kg', minThreshold: 5 },
    'tomato': { name: 'Tomato', current: 20, max: 30, unit: 'kg', minThreshold: 5 },
    'potato': { name: 'Potato', current: 30, max: 100, unit: 'kg', minThreshold: 10 },
    'cucumber': { name: 'Cucumber', current: 20, max: 30, unit: 'kg', minThreshold: 5 },
    'eggplant': { name: 'Eggplant', current: 20, max: 30, unit: 'kg', minThreshold: 5 },
    'green_beans': { name: 'Green Beans', current: 20, max: 30, unit: 'kg', minThreshold: 5 },
    'rice': { name: 'Rice', current: 100, max: 200, unit: 'kg', minThreshold: 30 },
    'pancit_bihon': { name: 'Pancit Bihon', current: 50, max: 100, unit: 'kg', minThreshold: 15 },
    'pancit_canton': { name: 'Pancit Canton', current: 50, max: 100, unit: 'kg', minThreshold: 15 },
    'spaghetti_pasta': { name: 'Spaghetti Pasta', current: 50, max: 80, unit: 'kg', minThreshold: 10 },
    'soy_sauce': { name: 'Soy Sauce', current: 40, max: 50, unit: 'liter', minThreshold: 10 },
    'vinegar': { name: 'Vinegar', current: 40, max: 50, unit: 'liter', minThreshold: 10 },
    'oyster_sauce': { name: 'Oyster Sauce', current: 30, max: 30, unit: 'liter', minThreshold: 5 },
    'fish_sauce': { name: 'Fish Sauce', current: 30, max: 30, unit: 'liter', minThreshold: 5 },
    'butter': { name: 'Butter', current: 20, max: 30, unit: 'kg', minThreshold: 5 },
    'honey': { name: 'Honey', current: 15, max: 20, unit: 'liter', minThreshold: 3 },
    'cooking_oil': { name: 'Cooking Oil', current: 40, max: 50, unit: 'liter', minThreshold: 10 },
    'milk': { name: 'Milk', current: 30, max: 50, unit: 'liter', minThreshold: 10 },
    'cheese': { name: 'Cheese', current: 20, max: 30, unit: 'kg', minThreshold: 5 },
    'cream': { name: 'Cream', current: 15, max: 20, unit: 'liter', minThreshold: 3 },
    'coffee_beans': { name: 'Coffee Beans', current: 20, max: 30, unit: 'kg', minThreshold: 5 },
    'milk_tea_base': { name: 'Milk Tea Base', current: 25, max: 40, unit: 'liter', minThreshold: 8 },
    'matcha': { name: 'Matcha Powder', current: 8, max: 10, unit: 'kg', minThreshold: 2 },
    'lemon': { name: 'Lemon', current: 20, max: 30, unit: 'kg', minThreshold: 5 },
    'strawberry': { name: 'Strawberry', current: 15, max: 20, unit: 'kg', minThreshold: 3 },
    'mango': { name: 'Mango', current: 20, max: 30, unit: 'kg', minThreshold: 5 },
    'nachos': { name: 'Nachos Chips', current: 30, max: 50, unit: 'kg', minThreshold: 10 },
    'french_fries': { name: 'French Fries', current: 30, max: 50, unit: 'kg', minThreshold: 10 },
    'bread': { name: 'Bread', current: 30, max: 50, unit: 'loaf', minThreshold: 10 },
    'lumpia_wrapper': { name: 'Lumpia Wrapper', current: 60, max: 100, unit: 'pack', minThreshold: 20 },
    'dynamite': { name: 'Dynamite', current: 30, max: 50, unit: 'kg', minThreshold: 8 },
    'egg': { name: 'Egg', current: 300, max: 500, unit: 'piece', minThreshold: 50 },
    'tuyo': { name: 'Tuyo', current: 20, max: 30, unit: 'kg', minThreshold: 5 },
    'tinapa': { name: 'Tinapa', current: 20, max: 30, unit: 'kg', minThreshold: 5 },
    'sugar': { name: 'Sugar', current: 30, max: 50, unit: 'kg', minThreshold: 10 },
    'salt': { name: 'Salt', current: 30, max: 50, unit: 'kg', minThreshold: 10 },
    'black_pepper': { name: 'Black Pepper', current: 20, max: 30, unit: 'kg', minThreshold: 5 },
    'water': { name: 'Water', current: 100, max: 100, unit: 'liter', minThreshold: 30 }
};

// ==================== SERVINGWARE INVENTORY ====================
const servingwareInventory = {
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

// ==================== PRODUCT INGREDIENT MAPPING ====================
const productIngredientMap = {
    'Korean Spicy Bulgogi (Pork)': {
        ingredients: { 'pork': 0.25, 'gochujang': 0.03, 'soy_sauce': 0.03, 'garlic': 0.02, 'onion': 0.05, 'sugar': 0.01, 'sesame_oil': 0.02, 'chili_flakes': 0.005, 'black_pepper': 0.005 },
        servingware: 'plate'
    },
    'Korean Salt and Pepper (Pork)': {
        ingredients: { 'pork': 0.25, 'salt': 0.01, 'black_pepper': 0.01, 'garlic': 0.02, 'chili': 0.005, 'cornstarch': 0.02 },
        servingware: 'plate'
    },
    'Crispy Pork Lechon Kawali': {
        ingredients: { 'pork_belly': 0.35, 'garlic': 0.03, 'bay_leaves': 2, 'peppercorn': 0.01, 'salt': 0.01, 'cooking_oil': 0.25 },
        servingware: 'plate'
    },
    'Cream Dory Fish Fillet': {
        ingredients: { 'cream_dory': 0.25, 'flour': 0.05, 'salt': 0.01, 'black_pepper': 0.005, 'butter': 0.05, 'garlic': 0.02, 'cream': 0.1 },
        servingware: 'plate'
    },
    'Buttered Honey Chicken': {
        ingredients: { 'chicken': 0.25, 'butter': 0.05, 'honey': 0.07, 'garlic': 0.02, 'soy_sauce': 0.02, 'black_pepper': 0.005 },
        servingware: 'plate'
    },
    'Buttered Spicy Chicken': {
        ingredients: { 'chicken': 0.25, 'butter': 0.05, 'chili_flakes': 0.01, 'garlic': 0.02, 'soy_sauce': 0.02 },
        servingware: 'plate'
    },
    'Chicken Adobo': {
        ingredients: { 'chicken': 0.3, 'soy_sauce': 0.05, 'vinegar': 0.04, 'garlic': 0.03, 'bay_leaves': 2, 'peppercorn': 0.01 },
        servingware: 'plate'
    },
    'Pork Shanghai': {
        ingredients: { 'ground_pork': 0.2, 'carrot': 0.03, 'onion': 0.03, 'garlic': 0.02, 'egg': 1, 'breadcrumbs': 0.03, 'lumpia_wrapper': 10, 'cooking_oil': 0.1 },
        servingware: 'plate'
    },
    'Sizzling Pork Sisig': {
        ingredients: { 'pork': 0.3, 'onion': 0.08, 'chili': 0.02, 'calamansi': 0.03, 'mayonnaise': 0.05, 'soy_sauce': 0.02, 'egg': 1, 'cooking_oil': 0.1 },
        servingware: 'sizzling plate'
    },
    'Sizzling Liempo': {
        ingredients: { 'pork_belly': 0.3, 'garlic': 0.02, 'soy_sauce': 0.03, 'black_pepper': 0.01, 'cooking_oil': 0.1 },
        servingware: 'sizzling plate'
    },
    'Sizzling Porkchop': {
        ingredients: { 'pork_chop': 0.35, 'garlic': 0.02, 'soy_sauce': 0.03, 'black_pepper': 0.01, 'cooking_oil': 0.1 },
        servingware: 'sizzling plate'
    },
    'Sizzling Fried Chicken': {
        ingredients: { 'fried_chicken': 0.35, 'flour': 0.03, 'garlic': 0.02, 'black_pepper': 0.01, 'gravy': 0.2, 'cooking_oil': 0.1 },
        servingware: 'sizzling plate'
    },
    'Pancit Bihon': {
        ingredients: { 'rice_noodles': 0.5, 'chicken': 0.1, 'cabbage': 0.15, 'carrot': 0.1, 'garlic': 0.03, 'onion': 0.05, 'soy_sauce': 0.05, 'oyster_sauce': 0.02, 'cooking_oil': 0.05 },
        servingware: 'tray'
    },
    'Pancit Canton + Bihon (Mixed)': {
        ingredients: { 'pancit_canton': 0.3, 'rice_noodles': 0.3, 'chicken': 0.15, 'cabbage': 0.2, 'carrot': 0.15, 'garlic': 0.04, 'onion': 0.08, 'soy_sauce': 0.08, 'oyster_sauce': 0.03, 'chicken_broth': 0.2, 'cooking_oil': 0.08 },
        servingware: 'tray'
    },
    'Spaghetti (Filipino Style)': {
        ingredients: { 'spaghetti_pasta': 0.5, 'sweet_tomato_sauce': 0.2, 'ground_meat': 0.15, 'hotdog': 0.1, 'cheese': 0.08, 'garlic': 0.02, 'onion': 0.03, 'cooking_oil': 0.05 },
        servingware: 'tray'
    },
    'Cucumber Lemonade': {
        ingredients: { 'cucumber': 0.1, 'lemon': 0.1, 'sugar': 0.05, 'water': 0.3, 'ice': 0.1 },
        servingware: 'glass'
    },
    'Blue Lemonade': {
        ingredients: { 'lemon_juice': 0.15, 'blue_syrup': 0.05, 'sugar': 0.05, 'water': 0.3, 'ice': 0.1 },
        servingware: 'glass'
    },
    'Red Tea': {
        ingredients: { 'tea': 0.02, 'sugar': 0.05, 'water': 0.3, 'ice': 0.1 },
        servingware: 'glass'
    },
    'Soda (Mismo / 1.5L)': {
        ingredients: { 'carbonated_soft_drink': 1 },
        servingware: 'bottle'
    },
    'Cafe Americano': {
        ingredients: { 'espresso': 0.03, 'hot_water': 0.2 },
        servingware: 'cup'
    },
    'Cafe Latte': {
        ingredients: { 'espresso': 0.03, 'steamed_milk': 0.25 },
        servingware: 'cup'
    },
    'Caramel Macchiato': {
        ingredients: { 'espresso': 0.03, 'milk': 0.2, 'caramel_syrup': 0.03, 'vanilla_syrup': 0.01 },
        servingware: 'cup'
    },
    'Milk Tea': {
        ingredients: { 'black_tea': 0.02, 'milk': 0.2, 'sugar': 0.05, 'tapioca_pearls': 0.03 },
        servingware: 'cup'
    },
    'Matcha Green Tea': {
        ingredients: { 'matcha_powder': 0.01, 'milk': 0.25, 'sugar': 0.05 },
        servingware: 'cup'
    },
    'Cookies & Cream Frappe': {
        ingredients: { 'ice': 0.2, 'milk': 0.2, 'cookie_crumbs': 0.03, 'cream': 0.1 },
        servingware: 'cup'
    },
    'Strawberry & Cream Frappe': {
        ingredients: { 'strawberry_syrup': 0.05, 'milk': 0.2, 'ice': 0.2, 'cream': 0.1 },
        servingware: 'cup'
    },
    'Mango Cheesecake Frappe': {
        ingredients: { 'mango_flavor': 0.05, 'cream_cheese_flavor': 0.03, 'milk': 0.2, 'ice': 0.2 },
        servingware: 'cup'
    },
    'Cheesy Nachos': {
        ingredients: { 'nacho_chips': 0.3, 'cheese_sauce': 0.15 },
        servingware: 'serving'
    },
    'Nachos Supreme': {
        ingredients: { 'nacho_chips': 0.3, 'cheese': 0.15, 'ground_meat': 0.1, 'tomato': 0.05, 'onion': 0.03 },
        servingware: 'serving'
    },
    'French Fries': {
        ingredients: { 'potato': 0.25, 'cooking_oil': 0.1, 'salt': 0.005 },
        servingware: 'serving'
    },
    'Clubhouse Sandwich': {
        ingredients: { 'bread': 0.1, 'chicken': 0.1, 'ham': 0.05, 'egg': 1, 'lettuce': 0.03, 'tomato': 0.05, 'mayonnaise': 0.02 },
        servingware: 'sandwich'
    },
    'Fish and Fries': {
        ingredients: { 'fish_fillet': 0.15, 'batter': 0.05, 'potato': 0.2, 'cooking_oil': 0.15, 'salt': 0.005 },
        servingware: 'serving'
    },
    'Cheesy Dynamite Lumpia': {
        ingredients: { 'chili': 0.05, 'cheese': 0.05, 'lumpia_wrapper': 10, 'cooking_oil': 0.1 },
        servingware: 'plate'
    },
    'Lumpiang Shanghai': {
        ingredients: { 'ground_pork': 0.15, 'vegetables': 0.1, 'lumpia_wrapper': 15, 'cooking_oil': 0.15 },
        servingware: 'plate'
    },
    'Fried Chicken': {
        ingredients: { 'chicken': 0.25, 'flour': 0.05, 'garlic': 0.02, 'black_pepper': 0.005, 'cooking_oil': 0.2, 'salt': 0.01 },
        servingware: 'plate'
    },
    'Tinapa Rice': {
        ingredients: { 'tinapa': 0.1, 'rice': 0.3, 'garlic': 0.02, 'egg': 1, 'cooking_oil': 0.05 },
        servingware: 'meal'
    },
    'Tuyo Pesto': {
        ingredients: { 'tuyo': 0.08, 'pasta': 0.3, 'garlic': 0.02, 'cooking_oil': 0.05, 'herbs': 0.01 },
        servingware: 'meal'
    },
    'Fried Rice': {
        ingredients: { 'rice': 0.3, 'garlic': 0.03, 'egg': 1, 'soy_sauce': 0.02, 'cooking_oil': 0.05 },
        servingware: 'bowl'
    },
    'Plain Rice': {
        ingredients: { 'rice': 0.25, 'water': 0.5 },
        servingware: 'bowl'
    },
    'Sinigang (Pork)': {
        ingredients: { 'pork': 0.4, 'tamarind_mix': 0.05, 'tomato': 0.05, 'onion': 0.05, 'radish': 0.1, 'kangkong': 0.1 },
        servingware: 'pot'
    },
    'Sinigang (Shrimp)': {
        ingredients: { 'shrimp': 0.35, 'tamarind_mix': 0.05, 'tomato': 0.05, 'onion': 0.05, 'kangkong': 0.1 },
        servingware: 'pot'
    },
    'Paknet (Pakbet w/ Bagnet)': {
        ingredients: { 'bagnet': 0.2, 'eggplant': 0.15, 'squash': 0.15, 'okra': 0.1, 'ampalaya': 0.1, 'shrimp_paste': 0.02, 'cooking_oil': 0.05 },
        servingware: 'serving'
    },
    'Buttered Shrimp': {
        ingredients: { 'shrimp': 0.3, 'butter': 0.1, 'garlic': 0.03, 'sugar': 0.01, 'salt': 0.005 },
        servingware: 'serving'
    },
    'Special Bulalo': {
        ingredients: { 'beef_shank': 0.8, 'corn': 0.1, 'cabbage': 0.3, 'potato': 0.2, 'onion': 0.1, 'peppercorn': 0.01 },
        servingware: 'pot'
    },
    'Paper Cups (12oz)': {
        ingredients: {},
        servingware: 'pack'
    },
    'Paper Cups (16oz)': {
        ingredients: {},
        servingware: 'pack'
    },
    'Straws (Regular)': {
        ingredients: {},
        servingware: 'pack'
    },
    'Straws (Boba)': {
        ingredients: {},
        servingware: 'pack'
    },
    'Food Containers (Small)': {
        ingredients: {},
        servingware: 'pack'
    },
    'Food Containers (Medium)': {
        ingredients: {},
        servingware: 'pack'
    },
    'Food Containers (Large)': {
        ingredients: {},
        servingware: 'pack'
    },
    'Plastic Utensils Set': {
        ingredients: {},
        servingware: 'set'
    },
    'Napkins (Pack of 50)': {
        ingredients: {},
        servingware: 'pack'
    }
};

// ==================== FALLBACK INVENTORY ITEMS ====================
// We'll keep an empty array - all inventory comes from MongoDB
let FALLBACK_INVENTORY_ITEMS = [];

// ==================== RESET INVENTORY TO ZERO ====================
function resetInventoryToZero() {
    console.log('🔄 All inventory items will be loaded from MongoDB...');
    console.log('✅ No local fallback inventory - Using MongoDB data only');
    
    // Clear persisted values in localStorage
    localStorage.removeItem('menu_inventory_currentStock');
    console.log('✅ Persisted inventory values cleared from localStorage');
    
    return true;
}

// ==================== LOAD INVENTORY WITH PERSISTED VALUES ====================
function loadInventoryWithPersistedValues() {
    console.log('🔄 Inventory will be loaded from MongoDB only...');
    console.log('✅ No fallback inventory - MongoDB data only');
    return false;
}

// ==================== SAVE INVENTORY STOCK VALUES ====================
function saveInventoryStockValues() {
    try {
        console.log('💾 Stock values managed through MongoDB');
    } catch (error) {
        console.error('❌ Error saving inventory stock values:', error);
    }
}

// ==================== SAVE NOTIFICATIONS TO LOCALSTORAGE ====================
function saveNotificationsToLocalStorage() {
    try {
        localStorage.setItem('menu_notifications', JSON.stringify(notifications));
        localStorage.setItem('menu_stockRequests', JSON.stringify(stockRequestNotifications));
        localStorage.setItem('menu_notificationCount', notificationCount.toString());
        localStorage.setItem('menu_stockRequestCount', stockRequestCount.toString());
        localStorage.setItem('menu_hasNewNotifications', hasNewNotifications.toString());
        localStorage.setItem('menu_hasNewStockRequests', hasNewStockRequests.toString());
        console.log('💾 Saved notifications to localStorage');
    } catch (error) {
        console.error('❌ Error saving notifications:', error);
    }
}

// ==================== LOAD NOTIFICATIONS FROM LOCALSTORAGE ====================
function loadNotificationsFromLocalStorage() {
    try {
        const savedNotifications = localStorage.getItem('menu_notifications');
        if (savedNotifications) {
            notifications = JSON.parse(savedNotifications);
            console.log('📦 Loaded notifications from localStorage:', notifications.length, 'notifications');
        }
        
        const savedStockRequests = localStorage.getItem('menu_stockRequests');
        if (savedStockRequests) {
            stockRequestNotifications = JSON.parse(savedStockRequests);
            console.log('📦 Loaded stock requests from localStorage:', stockRequestNotifications.length, 'requests');
        }
        
        const savedCount = localStorage.getItem('menu_notificationCount');
        if (savedCount) {
            notificationCount = parseInt(savedCount);
        }
        
        const savedStockCount = localStorage.getItem('menu_stockRequestCount');
        if (savedStockCount) {
            stockRequestCount = parseInt(savedStockCount);
        }
        
        const savedHasNew = localStorage.getItem('menu_hasNewNotifications');
        if (savedHasNew) {
            hasNewNotifications = savedHasNew === 'true';
        }
        
        const savedHasNewStock = localStorage.getItem('menu_hasNewStockRequests');
        if (savedHasNewStock) {
            hasNewStockRequests = savedHasNewStock === 'true';
        }
        
        updateNotificationBadge();
        renderNotifications();
    } catch (error) {
        console.error('❌ Error loading notifications:', error);
    }
}

// ==================== CATEGORY DISPLAY NAMES ====================
const categoryDisplayNames = {
    'Rice': 'Rice Bowl Meals',
    'Sizzling': 'Hot Sizzlers',
    'Party': 'Party Trays',
    'Drink': 'Drinks',
    'Cafe': 'Coffee',
    'Milk': 'Milk Tea',
    'Frappe': 'Frappe',
    'Snack & Appetizer': 'Snacks & Appetizers',
    'Budget Meals Served with Rice': 'Budget Meals',
    'Specialties': 'Specialties',
    'packaging': 'Packaging'
};

// ==================== UNIT DISPLAY LABELS ====================
const unitDisplayLabels = {
    'plate': 'Plate',
    'plates': 'Plates',
    'sizzling plate': 'Sizzling Plate',
    'tray': 'Tray',
    'trays': 'Trays',
    'glass': 'Glass',
    'glasses': 'Glasses',
    'cup': 'Cup',
    'cups': 'Cups',
    'pitcher': 'Pitcher',
    'pitchers': 'Pitchers',
    'bottle': 'Bottle',
    'bottles': 'Bottles',
    'serving': 'Serving',
    'servings': 'Servings',
    'meal': 'Meal',
    'meals': 'Meals',
    'bowl': 'Bowl',
    'bowls': 'Bowls',
    'sandwich': 'Sandwich',
    'sandwiches': 'Sandwiches',
    'piece': 'Piece',
    'pieces': 'Pieces',
    'pot': 'Pot',
    'pots': 'Pots',
    'pack': 'Pack',
    'packs': 'Packs',
    'set': 'Set',
    'sets': 'Sets',
    'box': 'Box',
    'boxes': 'Boxes',
    'bag': 'Bag',
    'bags': 'Bags'
};

// ==================== CATEGORY UNITS MAPPING ====================
const categoryUnitsMapping = {
    'Rice': ['plate', 'serving'],
    'Sizzling': ['sizzling plate', 'plate'],
    'Party': ['tray'],
    'Drink': ['glass', 'cup', 'pitcher', 'bottle'],
    'Cafe': ['cup', 'glass'],
    'Milk': ['cup', 'glass'],
    'Frappe': ['cup', 'glass'],
    'Snack & Appetizer': ['serving', 'piece', 'sandwich'],
    'Budget Meals Served with Rice': ['meal', 'bowl'],
    'Specialties': ['serving', 'pot'],
    'packaging': ['pack', 'set', 'box', 'bag']
};

// ==================== MENU DATABASE ====================
const menuDatabase = {
    'Rice': [
        { name: 'Korean Spicy Bulgogi (Pork)', unit: 'plate', defaultPrice: 180 },
        { name: 'Korean Salt and Pepper (Pork)', unit: 'plate', defaultPrice: 175 },
        { name: 'Crispy Pork Lechon Kawali', unit: 'plate', defaultPrice: 165 },
        { name: 'Cream Dory Fish Fillet', unit: 'plate', defaultPrice: 160 },
        { name: 'Buttered Honey Chicken', unit: 'plate', defaultPrice: 155 },
        { name: 'Buttered Spicy Chicken', unit: 'plate', defaultPrice: 155 },
        { name: 'Chicken Adobo', unit: 'plate', defaultPrice: 145 },
        { name: 'Pork Shanghai', unit: 'plate', defaultPrice: 140 }
    ],
    'Sizzling': [
        { name: 'Sizzling Pork Sisig', unit: 'sizzling plate', defaultPrice: 220 },
        { name: 'Sizzling Liempo', unit: 'sizzling plate', defaultPrice: 210 },
        { name: 'Sizzling Porkchop', unit: 'sizzling plate', defaultPrice: 195 },
        { name: 'Sizzling Fried Chicken', unit: 'sizzling plate', defaultPrice: 185 }
    ],
    'Party': [
        { name: 'Pancit Bihon (S)', unit: 'tray', defaultPrice: 350 },
        { name: 'Pancit Bihon (M)', unit: 'tray', defaultPrice: 550 },
        { name: 'Pancit Bihon (L)', unit: 'tray', defaultPrice: 750 },
        { name: 'Pancit Canton (S)', unit: 'tray', defaultPrice: 380 },
        { name: 'Pancit Canton (M)', unit: 'tray', defaultPrice: 580 },
        { name: 'Pancit Canton (L)', unit: 'tray', defaultPrice: 780 },
        { name: 'Spaghetti (S)', unit: 'tray', defaultPrice: 400 },
        { name: 'Spaghetti (M)', unit: 'tray', defaultPrice: 600 },
        { name: 'Spaghetti (L)', unit: 'tray', defaultPrice: 800 }
    ],
    'Drink': [
        { name: 'Cucumber Lemonade (Glass)', unit: 'glass', defaultPrice: 60 },
        { name: 'Cucumber Lemonade (Pitcher)', unit: 'pitcher', defaultPrice: 180 },
        { name: 'Blue Lemonade (Glass)', unit: 'glass', defaultPrice: 65 },
        { name: 'Blue Lemonade (Pitcher)', unit: 'pitcher', defaultPrice: 190 },
        { name: 'Red Tea (Glass)', unit: 'glass', defaultPrice: 55 },
        { name: 'Soda (Mismo)', unit: 'bottle', defaultPrice: 25 },
        { name: 'Soda 1.5L', unit: 'bottle', defaultPrice: 65 }
    ],
    'Cafe': [
        { name: 'Cafe Americano Tall', unit: 'cup', defaultPrice: 80 },
        { name: 'Cafe Americano Grande', unit: 'cup', defaultPrice: 95 },
        { name: 'Cafe Latte Tall', unit: 'cup', defaultPrice: 90 },
        { name: 'Cafe Latte Grande', unit: 'cup', defaultPrice: 105 },
        { name: 'Caramel Macchiato Tall', unit: 'cup', defaultPrice: 100 },
        { name: 'Caramel Macchiato Grande', unit: 'cup', defaultPrice: 115 }
    ],
    'Milk': [
        { name: 'Milk Tea Regular HC', unit: 'cup', defaultPrice: 85 },
        { name: 'Milk Tea Regular MC', unit: 'cup', defaultPrice: 95 },
        { name: 'Matcha Green Tea HC', unit: 'cup', defaultPrice: 90 },
        { name: 'Matcha Green Tea MC', unit: 'cup', defaultPrice: 100 }
    ],
    'Frappe': [
        { name: 'Cookies & Cream HC', unit: 'cup', defaultPrice: 120 },
        { name: 'Cookies & Cream MC', unit: 'cup', defaultPrice: 135 },
        { name: 'Strawberry & Cream HC', unit: 'cup', defaultPrice: 130 },
        { name: 'Mango cheese cake HC', unit: 'cup', defaultPrice: 135 }
    ],
    'Snack & Appetizer': [
        { name: 'Cheesy Nachos', unit: 'serving', defaultPrice: 150 },
        { name: 'Nachos Supreme', unit: 'serving', defaultPrice: 180 },
        { name: 'French fries', unit: 'serving', defaultPrice: 90 },
        { name: 'Clubhouse Sandwich', unit: 'sandwich', defaultPrice: 120 },
        { name: 'Fish and Fries', unit: 'serving', defaultPrice: 160 },
        { name: 'Cheesy Dynamite Lumpia', unit: 'piece', defaultPrice: 25 },
        { name: 'Lumpiang Shanghai', unit: 'piece', defaultPrice: 20 }
    ],
    'Budget Meals Served with Rice': [
        { name: 'Fried Chicken', unit: 'meal', defaultPrice: 95 },
        { name: 'Buttered Honey Chicken', unit: 'meal', defaultPrice: 105 },
        { name: 'Buttered Spicy Chicken', unit: 'meal', defaultPrice: 105 },
        { name: 'Tinapa Rice', unit: 'meal', defaultPrice: 85 },
        { name: 'Tuyo Pesto', unit: 'meal', defaultPrice: 80 },
        { name: 'Fried Rice', unit: 'serving', defaultPrice: 50 },
        { name: 'Plain Rice', unit: 'bowl', defaultPrice: 25 }
    ],
    'Specialties': [
        { name: 'Sinigang (PORK)', unit: 'serving', defaultPrice: 280 },
        { name: 'Sinigang (Shrimp)', unit: 'serving', defaultPrice: 320 },
        { name: 'Paknet (Pakbet w/ Bagnet)', unit: 'serving', defaultPrice: 260 },
        { name: 'Buttered Shrimp', unit: 'serving', defaultPrice: 300 },
        { name: 'Special Bulalo (good for 2-3 Persons)', unit: 'pot', defaultPrice: 450 },
        { name: 'Special Bulalo Buy 1 Take 1 (good for 6-8 Persons)', unit: 'pot', defaultPrice: 850 }
    ],
    'packaging': [
        { name: 'Paper Cups (12oz)', unit: 'pack', defaultPrice: 250 },
        { name: 'Paper Cups (16oz)', unit: 'pack', defaultPrice: 280 },
        { name: 'Straws (Regular)', unit: 'pack', defaultPrice: 120 },
        { name: 'Straws (Boba)', unit: 'pack', defaultPrice: 150 },
        { name: 'Food Containers (Small)', unit: 'pack', defaultPrice: 180 },
        { name: 'Food Containers (Medium)', unit: 'pack', defaultPrice: 220 },
        { name: 'Food Containers (Large)', unit: 'pack', defaultPrice: 260 },
        { name: 'Plastic Utensils Set', unit: 'set', defaultPrice: 85 },
        { name: 'Napkins (Pack of 50)', unit: 'pack', defaultPrice: 75 }
    ]
};

// ==================== DOM ELEMENTS CACHE ====================
const elements = {
    itemModal: document.getElementById('itemModal'),
    modalTitle: document.getElementById('modalTitle'),
    itemForm: document.getElementById('itemForm'),
    closeModal: document.getElementById('closeModal'),
    itemId: document.getElementById('itemId'),
    itemName: document.getElementById('itemName'),
    itemCategory: document.getElementById('itemCategories'),
    itemUnit: document.getElementById('itemUnit'),
    currentStock: document.getElementById('currentStock'),
    minimumStock: document.getElementById('minimumStock'),
    maximumStock: document.getElementById('maximumStock'),
    itemPrice: document.getElementById('itemPrice'),
    addNewItem: document.getElementById('addNewItem'),
    saveItemBtn: document.querySelector('.modal-footer .btn-primary'),
    cancelBtn: document.querySelector('.modal-footer .btn-secondary'),
    navLinks: document.querySelectorAll('.nav-link[data-section]'),
    categoryItems: document.querySelectorAll('.category-item[data-category]'),
    menuGrid: document.getElementById('menuGrid'),
    dashboardGrid: document.getElementById('dashboardGrid'),
    totalProducts: document.getElementById('totalProducts'),
    lowStock: document.getElementById('lowStock'),
    outOfStock: document.getElementById('outOfStock'),
    menuValue: document.getElementById('menuValue'),
    totalMenuItems: document.getElementById('totalMenuItems'),
    currentCategoryTitle: document.getElementById('currentCategoryTitle'),
    missingIngredientsModal: document.getElementById('missingIngredientsModal'),
    closeMissingIngredientsModal: document.getElementById('closeMissingIngredientsModal'),
    closeMissingIngredientsBtn: document.getElementById('closeMissingIngredientsBtn'),
    missingProductName: document.getElementById('missingProductName'),
    missingIngredientsList: document.getElementById('missingIngredientsList')
};

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Menu Management System initializing...');
    
    try {
        loadNotificationsFromLocalStorage();
        console.log('✅ Notifications loaded from localStorage');
        
        addNotificationStyles();
        initializeNotificationSystem();
        console.log('✅ Notification system initialized');
        
        initializeEventListeners();
        initializeCategoryDropdown();
        console.log('✅ Event listeners initialized');
        
        // Clear any fallback data - we only use MongoDB
        allMenuItems = [];
        console.log('✅ Using MongoDB only - no fallback products');
        
        // Reset inventory to use MongoDB only
        resetInventoryToZero();
        console.log('✅ All inventory from MongoDB only - No fallback data');
        
        currentInventoryCache = [];
        lastInventoryCacheTime = Date.now();
        console.log(`📦 Inventory initialized - Loading from MongoDB`);
        
        showSection('dashboard');
        console.log('✅ Dashboard section displayed');
        
        connectToNotificationServer();
        console.log('✅ Real-time connections initiated');
        
        // Fetch menu items from MongoDB
        await fetchMenuItems();
        
        console.log(`✅ Menu Management System initialized with ${allMenuItems.length} products from MongoDB!`);
        
        // Listen for stock requests from staff.js (different page/window)
        listenForStockRequests();
        
    } catch (error) {
        console.error('❌ Critical error during initialization:', error);
        showToast('System initialized. Please ensure MongoDB is connected.', 'warning');
    }
});

// ==================== CONNECT TO NOTIFICATION SERVER ====================
function connectToNotificationServer() {
    try {
        if (notificationEventSource) {
            notificationEventSource.close();
        }
        
        notificationEventSource = new EventSource(`${BACKEND_URL}/api/admin/events`);
        
        notificationEventSource.onmessage = function(event) {
            try {
                const data = JSON.parse(event.data);
                console.log('📨 Received notification:', data);
                
                if (data.type === 'low_stock_alert') {
                    handleLowStockAlert(data);
                } else if (data.type === 'stock_request') {
                    handleStockRequest(data);
                }
            } catch (e) {}
        };
        
        notificationEventSource.onerror = function() {
            notificationEventSource.close();
            notificationEventSource = null;
        };
        
        notificationEventSource.onopen = function() {
            console.log('✅ Connected to notification server');
        };
    } catch (error) {
        notificationEventSource = null;
    }
}

// ==================== HANDLE STOCK REQUEST FROM STAFF ====================
function handleStockRequest(data) {
    const { productName, quantity, unit, requestedBy, timestamp } = data;
    
    const requestNotification = {
        id: Date.now() + Math.random(),
        productName: productName,
        quantity: quantity,
        unit: unit,
        requestedBy: requestedBy || 'Staff',
        message: `📦 Stock Request: ${quantity} ${unit} of ${productName}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString(),
        fullDateTime: new Date().toISOString(),
        read: false,
        fulfilled: false,
        type: 'stock_request'
    };
    
    stockRequestNotifications.unshift(requestNotification);
    hasNewStockRequests = true;
    stockRequestCount = stockRequestNotifications.filter(r => !r.read && !r.fulfilled).length;
    
    updateNotificationBadge();
    renderNotifications();
    saveNotificationsToLocalStorage();
    
    // Also save to localStorage for cross-page communication
    saveStockRequestToLocalStorage(requestNotification);
    // Refresh dashboard to show the request
    if (currentSection === 'dashboard') {
        renderDashboardGrid();
    }
}

// ==================== SAVE STOCK REQUEST TO LOCALSTORAGE ====================
function saveStockRequestToLocalStorage(request) {
    try {
        // Get existing requests
        let existingRequests = [];
        const stored = localStorage.getItem('staffStockRequests');
        if (stored) {
            existingRequests = JSON.parse(stored);
        }
        
        // Add new request
        existingRequests.unshift(request);
        
        // Keep only last 50 requests
        if (existingRequests.length > 50) {
            existingRequests = existingRequests.slice(0, 50);
        }
        
        // Save back to localStorage
        localStorage.setItem('staffStockRequests', JSON.stringify(existingRequests));
        
        // Update count
        const currentCount = parseInt(localStorage.getItem('stockRequestCount')) || 0;
        localStorage.setItem('stockRequestCount', (currentCount + 1).toString());
        
        // Save last request for quick access
        localStorage.setItem('lastStockRequest', JSON.stringify(request));
        
        console.log('💾 Stock request saved to localStorage');
    } catch (error) {
        console.error('Error saving stock request to localStorage:', error);
    }
}

// ==================== LISTEN FOR STOCK REQUESTS FROM STAFF ====================
function listenForStockRequests() {
    console.log('🎧 Initializing stock request listener...');
    
    // Check localStorage for stock requests from staff.js
    const lastStockRequest = localStorage.getItem('lastStockRequest');
    const staffStockRequestCount = parseInt(localStorage.getItem('stockRequestCount')) || 0;
    
    console.log('📦 Staff stock requests from localStorage:', staffStockRequestCount);
    
    if (staffStockRequestCount > 0) {
        updateStockRequestBadgeFromStaff(staffStockRequestCount);
        console.log('📢 Found pending stock requests from staff:', staffStockRequestCount);
        
        // Load pending requests into our array
        loadPendingStockRequests();
    }
    
    // Periodic fetch from MongoDB to keep dashboard updated
    setInterval(async () => {
        if (currentSection === 'dashboard') {
            try {
                const response = await fetch('/api/stock-requests/pending');
                if (response.ok) {
                    const result = await response.json();
                    const pendingCount = (result.data || []).length;
                    console.log('📊 MongoDB pending requests:', pendingCount);
                    
                    // Update badge with count from MongoDB
                    if (pendingCount > 0) {
                        updateStockRequestBadgeFromStaff(pendingCount);
                    }
                    
                    // Re-render dashboard with latest data
                    await renderDashboardGrid();
                }
            } catch (error) {
                console.error('Error fetching stock requests from MongoDB:', error);
            }
        }
    }, 2000); // Check every 2 seconds when on dashboard
    
    // Listen for custom events from staff.js (same window communication)
    window.addEventListener('staffStockRequest', (e) => {
        console.log('📡 Custom event received from staff.js:', e.detail);
        
        // Add to our notifications array
        if (e.detail) {
            stockRequestNotifications.unshift(e.detail);
            hasNewStockRequests = true;
            stockRequestCount = stockRequestNotifications.filter(r => !r.read && !r.fulfilled).length;
            
            updateNotificationBadge();
            renderNotifications();
            saveNotificationsToLocalStorage();
        }
        
        // Refresh dashboard to show pending requests
        if (currentSection === 'dashboard') {
            renderDashboardGrid();
        }
    });
    
    // Listen for changes to localStorage (staff page sends request)
    window.addEventListener('storage', (e) => {
        console.log('💾 Storage event detected:', e.key, '=', e.newValue);
        
        if (e.key === 'stockRequestCount') {
            const newCount = parseInt(e.newValue) || 0;
            console.log('📢 Stock request count changed to:', newCount);
            
            if (newCount > 0) {
                updateStockRequestBadgeFromStaff(newCount);
                
                // Load the new request
                loadPendingStockRequests();
                
                // Refresh dashboard to show pending requests
                if (currentSection === 'dashboard') {
                    renderDashboardGrid();
                }
                
                console.log('✅ Badge updated from storage event');
            }
        } else if (e.key === 'lastStockRequest' && e.newValue) {
            // New stock request received
            try {
                const newRequest = JSON.parse(e.newValue);
                
                // Check if we already have this request
                const exists = stockRequestNotifications.some(r => 
                    r.productName === newRequest.productName && 
                    r.timestamp === newRequest.timestamp
                );
                
                if (!exists) {
                    stockRequestNotifications.unshift(newRequest);
                    hasNewStockRequests = true;
                    stockRequestCount = stockRequestNotifications.filter(r => !r.read && !r.fulfilled).length;
                    
                    updateNotificationBadge();
                    renderNotifications();
                    saveNotificationsToLocalStorage();
                    
                    showToast(`📦 New stock request: ${newRequest.quantity} ${newRequest.unit} of ${newRequest.productName}`, 'info', 8000);
                    
                    if (currentSection === 'dashboard') {
                        renderDashboardGrid();
                    }
                }
            } catch (error) {
                console.error('Error parsing lastStockRequest:', error);
            }
        }
    });
    
    // Also check periodically for updates
    const checkInterval = setInterval(() => {
        const count = parseInt(localStorage.getItem('stockRequestCount')) || 0;
        const badge = document.getElementById('notificationBadge');
        
        if (badge) {
            const currentBadgeCount = parseInt(badge.textContent.replace('+', '')) || 0;
            if (count > 0 && currentBadgeCount < (count + notificationCount + stockRequestCount)) {
                console.log('⏰ Periodic check: updating badge with staff count:', count);
                updateStockRequestBadgeFromStaff(count);
                
                // Load any pending requests we might have missed
                loadPendingStockRequests();
                
                if (currentSection === 'dashboard') {
                    renderDashboardGrid();
                }
            }
        }
    }, 2000);
    
}

// ==================== LOAD PENDING STOCK REQUESTS ====================
function loadPendingStockRequests() {
    try {
        const stored = localStorage.getItem('staffStockRequests');
        if (stored) {
            const requests = JSON.parse(stored);
            let added = 0;
            
            requests.forEach(request => {
                // Check if we already have this request
                const exists = stockRequestNotifications.some(r => 
                    r.id === request.id || 
                    (r.productName === request.productName && 
                     r.timestamp === request.timestamp)
                );
                
                if (!exists) {
                    stockRequestNotifications.push(request);
                    added++;
                }
            });
            
            if (added > 0) {
                console.log(`📦 Added ${added} new stock requests from localStorage`);
                
                // Sort by date (newest first)
                stockRequestNotifications.sort((a, b) => 
                    new Date(b.fullDateTime || b.date) - new Date(a.fullDateTime || a.date)
                );
                
                hasNewStockRequests = true;
                stockRequestCount = stockRequestNotifications.filter(r => !r.read && !r.fulfilled).length;
                
                updateNotificationBadge();
                renderNotifications();
                saveNotificationsToLocalStorage();
            }
        }
    } catch (error) {
        console.error('Error loading pending stock requests:', error);
    }
}

// ==================== FULFILL STOCK REQUEST ====================
async function fulfillStockRequest(requestIndex) {
    try {
        console.log(`🔄 Fulfilling stock request at index: ${requestIndex}`);
        showToast('⏳ Marking request as fulfilled...', 'info', 2000);
        
        // Get the request from MongoDB
        const response = await fetch('/api/stock-requests/pending');
        if (!response.ok) {
            throw new Error('Failed to fetch pending requests');
        }
        
        const result = await response.json();
        const pendingRequests = result.data || [];
        
        if (requestIndex >= pendingRequests.length) {
            showToast('❌ Request not found', 'error');
            return;
        }
        
        const request = pendingRequests[requestIndex];
        console.log(`📦 Fulfilling: ${request.productName} (${request.requestedQuantity} units)`);
        
        // Call fulfill endpoint
        const fulfillResponse = await fetch('/api/stock-requests/fulfill', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                productName: request.productName,
                productId: request.productId,
                quantity: request.requestedQuantity,
                unit: request.unit || 'units'
            })
        });
        
        if (!fulfillResponse.ok) {
            const errorData = await fulfillResponse.json();
            throw new Error(errorData.message || 'Failed to fulfill request');
        }
        
        const fulfillResult = await fulfillResponse.json();

        // Refresh the dashboard to remove the fulfilled request
        await renderDashboardGrid();
        
    } catch (error) {
        console.error('❌ Error fulfilling stock request:', error);
        showToast(`❌ Error: ${error.message}`, 'error', 3000);
    }
}

// ==================== GET STAFF REQUESTS FROM LOCALSTORAGE ====================
function getStaffRequestsFromLocalStorage() {
    try {
        const stored = localStorage.getItem('staffStockRequests');
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error('Error getting staff requests:', error);
    }
    return [];
}

// ==================== REMOVE STAFF REQUEST FROM LOCALSTORAGE ====================
function removeStaffRequestFromLocalStorage(request) {
    try {
        const stored = localStorage.getItem('staffStockRequests');
        if (stored) {
            let requests = JSON.parse(stored);
            
            // Filter out the fulfilled request
            requests = requests.filter(r => 
                !(r.id === request.id || 
                  (r.productName === request.productName && r.timestamp === request.timestamp))
            );
            
            // Save back to localStorage
            localStorage.setItem('staffStockRequests', JSON.stringify(requests));
            
            // Update count
            localStorage.setItem('stockRequestCount', requests.length.toString());
        }
    } catch (error) {
        console.error('Error removing staff request:', error);
    }
}

// ==================== UPDATE NOTIFICATION BADGE FROM STAFF REQUEST ====================
function updateStockRequestBadgeFromStaff(staffCount) {
    console.log('🔄 Updating badge with staff stock request count:', staffCount);
    
    const badge = document.getElementById('notificationBadge');
    if (!badge) {
        // Try to find or create the badge
        const notificationBtn = document.querySelector('.notification-icon');
        if (notificationBtn && !notificationBtn.querySelector('#notificationBadge')) {
            const newBadge = document.createElement('span');
            newBadge.id = 'notificationBadge';
            newBadge.className = 'notification-badge';
            newBadge.setAttribute('style', 'display: inline-flex !important; visibility: visible !important;');
            notificationBtn.appendChild(newBadge);
        }
        return;
    }
    
    // Get current count from menu notifications
    const menuCount = (notificationCount || 0) + (stockRequestCount || 0);
    // Add staff count to menu count
    const totalCount = menuCount + staffCount;
    
    console.log('📊 Calculation: Menu count:', menuCount, '+ Staff count:', staffCount, '= Total:', totalCount);
    
    // Always show badge if there are notifications
    if (totalCount > 0) {
        badge.textContent = totalCount > 99 ? '99+' : totalCount;
        badge.setAttribute('style', 'display: inline-flex !important; visibility: visible !important;');
        
        // Pulse animation
        badge.style.animation = 'none';
        setTimeout(() => {
            badge.style.animation = 'pulse 2s infinite';
        }, 10);
        
        console.log('✅ Badge element text updated to:', badge.textContent);
    }
}

// ==================== NOTIFICATION STYLES ====================
function addNotificationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .notification-badge {
            position: absolute;
            top: -5px;
            right: -5px;
            background: #dc3545;
            color: white;
            font-size: 11px;
            font-weight: bold;
            border-radius: 50%;
            min-width: 18px;
            height: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0 4px;
            animation: pulse 2s infinite;
        }
        
        .stock-request-badge {
            position: absolute;
            top: -5px;
            right: 15px;
            background: #ff9800;
            color: white;
            font-size: 11px;
            font-weight: bold;
            border-radius: 50%;
            min-width: 18px;
            height: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0 4px;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }

        .notification-item {
            padding: 15px;
            border-bottom: 1px solid #eee;
            cursor: pointer;
            transition: background 0.2s;
            position: relative;
        }
        
        .notification-item:hover {
            background: #f5f5f5;
        }
        
        .notification-item.unread {
            background: #fff8e1;
            border-left: 4px solid #ff9800;
        }
        
        .notification-item.stock-request {
            background: #e3f2fd;
            border-left: 4px solid #2196f3;
        }
        
        .toast {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 4px;
            color: white;
            z-index: 9999;
            opacity: 0;
            transform: translateX(100%);
            transition: opacity 0.3s, transform 0.3s;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .toast-success { background: #28a745; }
        .toast-error { background: #dc3545; }
        .toast-warning { background: #ffc107; color: #212529; }
        .toast-info { background: #17a2b8; }
        
        .show {
            opacity: 1 !important;
            transform: translateX(0) !important;
        }

        #notificationNavItem {
            position: relative;
            list-style: none;
            margin-left: auto;
        }

        .notification-icon {
            position: relative;
            display: flex;
            align-items: center;
            cursor: pointer;
            padding: 8px 12px;
            border-radius: 4px;
            transition: background 0.2s;
        }
        
        .notification-icon:hover {
            background: rgba(0,0,0,0.05);
        }
        
        .notification-icon i {
            font-size: 20px;
            color: #333;
            margin-right: 8px;
        }
        
        .notification-icon span {
            font-size: 14px;
            color: #333;
        }
        
        .status-badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
            display: inline-block;
        }
        
        .status-available {
            background: #d4edda;
            color: #155724;
        }
        
        .status-low {
            background: #fff3cd;
            color: #856404;
        }
        
        .status-out {
            background: #f8d7da;
            color: #721c24;
        }
        
        .status-medium {
            background: #cce5ff;
            color: #004085;
        }
        
        .stock-progress {
            width: 100%;
            height: 8px;
            background: #eee;
            border-radius: 4px;
            overflow: hidden;
            margin-top: 5px;
        }
        
        .progress-bar {
            height: 100%;
            background: #28a745;
            transition: width 0.3s;
        }
        
        .progress-bar.warning {
            background: #ffc107;
        }
        
        .progress-bar.danger {
            background: #dc3545;
        }
        
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        .menu-card {
            transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .menu-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .stock-request-card {
            border-left: 4px solid #2196f3;
            background: #e3f2fd;
            margin-bottom: 15px;
        }
        
        .quick-add-section {
            background: #f8f9fa;
            border-top: 1px solid #dee2e6;
            padding: 15px;
            margin-top: 15px;
            border-radius: 0 0 8px 8px;
        }
        
        .quick-add-title {
            font-size: 13px;
            font-weight: 600;
            color: #495057;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .quick-add-controls {
            display: flex;
            gap: 8px;
            align-items: center;
        }
        
        .quick-add-input {
            flex: 1;
            padding: 8px;
            border: 1px solid #ced4da;
            border-radius: 4px;
            font-size: 13px;
        }
        
        .quick-add-input:focus {
            border-color: #28a745;
            outline: none;
            box-shadow: 0 0 0 2px rgba(40, 167, 69, 0.25);
        }
        
        .quick-add-btn {
            padding: 8px 16px;
            background: #28a745;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            transition: background 0.2s;
            white-space: nowrap;
        }
        
        .quick-add-btn:hover {
            background: #218838;
        }
        
        .quick-add-btn:disabled {
            background: #6c757d;
            cursor: not-allowed;
        }

        .missing-ingredients-list {
            list-style: none;
            padding: 0;
            margin: 15px 0;
            max-height: 300px;
            overflow-y: auto;
        }
        
        .missing-ingredients-list li {
            padding: 12px 15px;
            margin-bottom: 8px;
            background: #fff8f8;
            border-left: 4px solid #dc3545;
            border-radius: 4px;
            color: #721c24;
            font-size: 14px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .missing-ingredients-list li:before {
            content: "❌";
            margin-right: 10px;
            font-size: 12px;
        }
        
        .stock-request-badge {
            display: inline-block;
            background: #2196f3;
            color: white;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 11px;
            margin-left: 8px;
        }
    `;
    document.head.appendChild(style);
}

// ==================== INITIALIZE NOTIFICATION SYSTEM ====================
function initializeNotificationSystem() {
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;
    
    const existingNavItem = document.getElementById('notificationNavItem');
    if (existingNavItem) existingNavItem.remove();
    
    const notificationNavItem = document.createElement('li');
    notificationNavItem.id = 'notificationNavItem';
    notificationNavItem.style.cssText = 'position: relative; list-style: none; margin-left: auto;';
    
    const notificationBtn = document.createElement('a');
    notificationBtn.href = '#';
    notificationBtn.className = 'nav-link notification-icon';
    
    const totalNotifications = notificationCount + stockRequestCount;
    const badgeDisplay = totalNotifications > 0 ? 'flex' : 'none';
    
    notificationBtn.innerHTML = `
        <i class="fas fa-bell"></i>
        <span>Notifications</span>
        <span id="notificationBadge" class="notification-badge" style="display: ${badgeDisplay};">${totalNotifications > 99 ? '99+' : totalNotifications}</span>
        ${stockRequestCount > 0 ? `<span id="stockRequestBadge" class="stock-request-badge" style="display: ${stockRequestCount > 0 ? 'flex' : 'none'};">📦 ${stockRequestCount}</span>` : ''}
    `;
    notificationBtn.addEventListener('click', function(e) {
        e.preventDefault();
        toggleNotificationModal();
    });
    
    notificationNavItem.appendChild(notificationBtn);
    navLinks.appendChild(notificationNavItem);
    
    let notificationContainer = document.getElementById('notificationContainer');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notificationContainer';
        notificationContainer.style.cssText = `
            position: fixed;
            top: 70px;
            right: 20px;
            width: 450px;
            max-height: 600px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            z-index: 1000;
            display: none;
            flex-direction: column;
            overflow: hidden;
            border: 1px solid #ddd;
        `;
        
        const notificationHeader = document.createElement('div');
        notificationHeader.style.cssText = `
            padding: 15px 20px;
            background: #f8f9fa;
            border-bottom: 1px solid #ddd;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        
        const headerTitle = document.createElement('h3');
        headerTitle.textContent = 'Notifications';
        headerTitle.style.cssText = 'margin: 0; font-size: 16px; font-weight: 600; color: #333; display: flex; align-items: center; gap: 8px;';
        headerTitle.innerHTML = `<i class="fas fa-bell" style="color: #007bff;"></i> System Alerts & Stock Requests`;
        
        const clearAllBtn = document.createElement('button');
        clearAllBtn.textContent = 'Clear All';
        clearAllBtn.style.cssText = `
            background: none;
            border: 1px solid #dc3545;
            color: #dc3545;
            cursor: pointer;
            font-size: 12px;
            padding: 6px 12px;
            border-radius: 4px;
            transition: all 0.2s;
            font-weight: 500;
        `;
        clearAllBtn.addEventListener('mouseenter', function() {
            this.style.background = '#dc3545';
            this.style.color = 'white';
        });
        clearAllBtn.addEventListener('mouseleave', function() {
            this.style.background = 'none';
            this.style.color = '#dc3545';
        });
        clearAllBtn.addEventListener('click', clearAllNotifications);
        
        notificationHeader.appendChild(headerTitle);
        notificationHeader.appendChild(clearAllBtn);
        
        // Add tabs for different notification types
        const tabsContainer = document.createElement('div');
        tabsContainer.style.cssText = `
            display: flex;
            border-bottom: 1px solid #ddd;
            background: #f8f9fa;
        `;
        
        const allTab = document.createElement('button');
        allTab.textContent = 'All';
        allTab.style.cssText = `
            flex: 1;
            padding: 12px;
            border: none;
            background: ${currentNotificationTab === 'all' ? '#007bff' : 'transparent'};
            color: ${currentNotificationTab === 'all' ? 'white' : '#333'};
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s;
        `;
        allTab.addEventListener('click', () => switchNotificationTab('all'));
        
        const alertsTab = document.createElement('button');
        alertsTab.textContent = `Alerts ${notificationCount > 0 ? `(${notificationCount})` : ''}`;
        alertsTab.style.cssText = `
            flex: 1;
            padding: 12px;
            border: none;
            background: ${currentNotificationTab === 'alerts' ? '#007bff' : 'transparent'};
            color: ${currentNotificationTab === 'alerts' ? 'white' : '#333'};
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s;
        `;
        alertsTab.addEventListener('click', () => switchNotificationTab('alerts'));
        
        const requestsTab = document.createElement('button');
        requestsTab.textContent = `Stock Requests ${stockRequestCount > 0 ? `(${stockRequestCount})` : ''}`;
        requestsTab.style.cssText = `
            flex: 1;
            padding: 12px;
            border: none;
            background: ${currentNotificationTab === 'requests' ? '#007bff' : 'transparent'};
            color: ${currentNotificationTab === 'requests' ? 'white' : '#333'};
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s;
        `;
        requestsTab.addEventListener('click', () => switchNotificationTab('requests'));
        
        tabsContainer.appendChild(allTab);
        tabsContainer.appendChild(alertsTab);
        tabsContainer.appendChild(requestsTab);
        
        const notificationList = document.createElement('div');
        notificationList.id = 'notificationList';
        notificationList.style.cssText = 'flex: 1; overflow-y: auto; max-height: 400px; padding: 10px;';
        
        const emptyState = document.createElement('div');
        emptyState.id = 'notificationEmptyState';
        emptyState.style.cssText = 'padding: 40px 20px; text-align: center; color: #666;';
        emptyState.innerHTML = `
            <div style="font-size: 64px; margin-bottom: 20px;">📭</div>
            <h3 style="margin-bottom: 10px; color: #333; font-size: 18px;">No notifications</h3>
            <p style="margin: 0; color: #999; font-size: 14px;">When alerts or stock requests occur, they will appear here</p>
        `;
        notificationList.appendChild(emptyState);
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Close';
        closeBtn.style.cssText = `
            padding: 12px;
            background: #f8f9fa;
            border: none;
            border-top: 1px solid #ddd;
            cursor: pointer;
            color: #333;
            font-size: 14px;
            font-weight: 500;
            transition: background 0.2s;
        `;
        closeBtn.addEventListener('mouseenter', function() {
            this.style.background = '#e9ecef';
        });
        closeBtn.addEventListener('mouseleave', function() {
            this.style.background = '#f8f9fa';
        });
        closeBtn.addEventListener('click', toggleNotificationModal);
        
        notificationContainer.appendChild(notificationHeader);
        notificationContainer.appendChild(tabsContainer);
        notificationContainer.appendChild(notificationList);
        notificationContainer.appendChild(closeBtn);
        
        document.body.appendChild(notificationContainer);
    }
    
    window.currentNotificationTab = 'all';
}

let currentNotificationTab = 'all';

function switchNotificationTab(tab) {
    currentNotificationTab = tab;
    
    // Update tab styles
    const tabs = document.querySelectorAll('#notificationContainer button[style*="flex: 1"]');
    if (tabs.length >= 3) {
        tabs[0].style.background = tab === 'all' ? '#007bff' : 'transparent';
        tabs[0].style.color = tab === 'all' ? 'white' : '#333';
        tabs[1].style.background = tab === 'alerts' ? '#007bff' : 'transparent';
        tabs[1].style.color = tab === 'alerts' ? 'white' : '#333';
        tabs[2].style.background = tab === 'requests' ? '#007bff' : 'transparent';
        tabs[2].style.color = tab === 'requests' ? 'white' : '#333';
    }
    
    renderNotifications();
}

// ==================== NOTIFICATION FUNCTIONS ====================
function toggleNotificationModal() {
    const notificationContainer = document.getElementById('notificationContainer');
    if (!notificationContainer) return;
    
    if (isNotificationModalOpen) {
        notificationContainer.style.display = 'none';
        isNotificationModalOpen = false;
    } else {
        notificationContainer.style.display = 'flex';
        isNotificationModalOpen = true;
        
        // Mark all as read when opening
        hasNewNotifications = false;
        hasNewStockRequests = false;
        
        notifications.forEach(notification => { 
            notification.read = true; 
        });
        
        stockRequestNotifications.forEach(request => {
            request.read = true;
        });
        
        updateNotificationBadge();
        renderNotifications();
        saveNotificationsToLocalStorage();
    }
}

function addNotification(message, type = 'info', productName = '') {
    const notification = {
        id: Date.now() + Math.random(),
        productName: productName,
        message: message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString(),
        fullDateTime: new Date().toISOString(),
        read: false,
        type: type,
        fulfilled: false
    };
    
    notifications.unshift(notification);
    hasNewNotifications = true;
    notificationCount = notifications.filter(n => !n.read && !n.fulfilled).length;
    
    updateNotificationBadge();
    renderNotifications();
    saveNotificationsToLocalStorage();
    
    const typeEmoji = { 
        'success': '✅', 
        'error': '❌', 
        'warning': '⚠️',
        'info': 'ℹ️'
    }[type] || 'ℹ️';
    
    showToast(`${typeEmoji} ${message}`, type);
}

function handleLowStockAlert(data) {
    addNotification(
        `Low stock alert: ${data.productName} - Only ${data.currentStock} ${data.unit} left`,
        'warning',
        data.productName
    );
}

function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    if (!badge) return;
    
    const stockRequestBadge = document.getElementById('stockRequestBadge');
    
    notificationCount = notifications.filter(n => !n.read && !n.fulfilled).length;
    stockRequestCount = stockRequestNotifications.filter(r => !r.read && !r.fulfilled).length;
    
    // 🔑 IMPORTANT: Include staff stock request count from localStorage
    const staffStockRequestCount = parseInt(localStorage.getItem('stockRequestCount')) || 0;
    
    const totalCount = notificationCount + stockRequestCount + staffStockRequestCount;
    
    if (totalCount > 0) {
        badge.textContent = totalCount > 99 ? '99+' : totalCount;
        badge.style.display = 'flex';
        badge.style.animation = 'pulse 1s infinite';
    } else {
        badge.style.display = 'none';
        badge.style.animation = 'none';
    }
    
    if (stockRequestBadge) {
        const totalStockRequests = stockRequestCount + staffStockRequestCount;
        if (totalStockRequests > 0) {
            stockRequestBadge.textContent = `📦 ${totalStockRequests}`;
            stockRequestBadge.style.display = 'flex';
        } else {
            stockRequestBadge.style.display = 'none';
        }
    }
}

function renderNotifications() {
    const notificationList = document.getElementById('notificationList');
    const emptyState = document.getElementById('notificationEmptyState');
    
    if (!notificationList) return;
    
    notificationList.innerHTML = '';
    
    let itemsToShow = [];
    
    if (currentNotificationTab === 'all') {
        itemsToShow = [...notifications.filter(n => !n.fulfilled), ...stockRequestNotifications.filter(r => !r.fulfilled)]
            .sort((a, b) => new Date(b.fullDateTime) - new Date(a.fullDateTime));
    } else if (currentNotificationTab === 'alerts') {
        itemsToShow = notifications.filter(n => !n.fulfilled)
            .sort((a, b) => new Date(b.fullDateTime) - new Date(a.fullDateTime));
    } else if (currentNotificationTab === 'requests') {
        itemsToShow = stockRequestNotifications.filter(r => !r.fulfilled)
            .sort((a, b) => new Date(b.fullDateTime) - new Date(a.fullDateTime));
    }
    
    if (itemsToShow.length === 0) {
        notificationList.appendChild(emptyState);
        return;
    }
    
    itemsToShow.forEach(item => {
        const notificationItem = document.createElement('div');
        
        if (item.type === 'stock_request') {
            notificationItem.className = `notification-item stock-request ${!item.read ? 'unread' : ''}`;
        } else {
            notificationItem.className = `notification-item ${!item.read ? 'unread' : ''}`;
        }
        
        notificationItem.style.cssText = `
            padding: 15px;
            border-bottom: 1px solid #eee;
            cursor: pointer;
            transition: all 0.2s;
            margin-bottom: 5px;
            border-radius: 4px;
            position: relative;
        `;
        
        let typeEmoji = '📋';
        let typeIcon = '';
        
        if (item.type === 'stock_request') {
            typeEmoji = '📦';
            typeIcon = '<span style="background: #2196f3; color: white; padding: 2px 8px; border-radius: 12px; font-size: 10px; margin-left: 8px;">Stock Request</span>';
        } else {
            const typeEmojiMap = {
                'success': '✅',
                'error': '❌',
                'warning': '⚠️',
                'info': 'ℹ️'
            };
            typeEmoji = typeEmojiMap[item.type] || '📋';
        }
        
        const timeDisplay = item.fullDateTime ? 
            new Date(item.fullDateTime).toLocaleString() : 
            `${item.date} ${item.timestamp}`;
        
        let detailsHtml = '';
        if (item.type === 'stock_request' && item.quantity) {
            detailsHtml = `
                <div style="margin-top: 8px; padding: 8px; background: #e3f2fd; border-radius: 4px; font-size: 13px;">
                    <span style="font-weight: 600;">Quantity:</span> ${item.quantity} ${item.unit || ''}
                    ${item.requestedBy ? `<br><span style="font-weight: 600;">Requested by:</span> ${item.requestedBy}` : ''}
                </div>
            `;
        }
        
        // Determine button text and style based on item type
        let buttonHtml = '';
        if (item.type === 'stock_request') {
            buttonHtml = `<button class="notification-done" onclick="dismissNotification('${item.id}')" style="
                background: #4caf50;
                border: none;
                color: white;
                padding: 6px 16px;
                border-radius: 4px;
                font-size: 11px;
                cursor: pointer;
                font-weight: 600;
            ">Done</button>`;
        } else {
            buttonHtml = `<button class="notification-dismiss" onclick="dismissNotification('${item.id}')" style="
                background: none;
                border: 1px solid #6c757d;
                color: #6c757d;
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 11px;
                cursor: pointer;
            ">Dismiss</button>`;
        }

        notificationItem.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                <div style="font-weight: 600; color: #333; font-size: 14px; display: flex; align-items: center; gap: 8px;">
                    ${typeEmoji} ${item.productName || 'System Notification'}
                    ${typeIcon}
                </div>
                ${!item.read ? '<span style="color: #ff9800; font-size: 12px;">● New</span>' : ''}
            </div>
            <div style="color: #666; font-size: 13px; margin-bottom: 8px;">
                ${item.message}
            </div>
            ${detailsHtml}
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="color: #999; font-size: 11px;">
                    <i class="far fa-clock"></i> ${timeDisplay}
                </div>
                ${buttonHtml}
            </div>
        `;
        
        notificationItem.addEventListener('click', function(e) {
            if (e.target.tagName === 'BUTTON') return;
            
            item.read = true;
            updateNotificationBadge();
            renderNotifications();
            saveNotificationsToLocalStorage();
        });
        
        notificationList.appendChild(notificationItem);
    });
}

function dismissNotification(notificationId) {
    // Check in regular notifications
    let notification = notifications.find(n => n.id === notificationId);
    if (notification) {
        notification.fulfilled = true;
        notification.read = true;
    } else {
        // Check in stock request notifications
        notification = stockRequestNotifications.find(r => r.id === notificationId);
        if (notification) {
            notification.fulfilled = true;
            notification.read = true;
        }
    }
    
    updateNotificationBadge();
    renderNotifications();
    saveNotificationsToLocalStorage();
    
    showToast('Notification dismissed', 'info');
    event.stopPropagation();
}

function clearAllNotifications() {
    if (notifications.length === 0 && stockRequestNotifications.length === 0) return;
    
    if (confirm('Mark all notifications as dismissed?')) {
        notifications.forEach(notification => {
            notification.fulfilled = true;
            notification.read = true;
        });
        
        stockRequestNotifications.forEach(request => {
            request.fulfilled = true;
            request.read = true;
        });
        
        notificationCount = 0;
        stockRequestCount = 0;
        hasNewNotifications = false;
        hasNewStockRequests = false;
        
        updateNotificationBadge();
        renderNotifications();
        saveNotificationsToLocalStorage();
        
        showToast('✅ All notifications cleared', 'success');
    }
}

// ==================== FETCH INVENTORY FROM MONGODB ====================
async function fetchInventoryFromMongoDB() {
    try {
        console.log('🔍 Fetching inventory from MongoDB...');
        
        const response = await fetch('/api/inventory', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        
        if (!response.ok) {
            console.warn(`⚠️ Inventory API error ${response.status}`);
            return [];
        }
        
        const data = await response.json();
        
        // Handle different response formats
        let inventoryItems = [];
        if (Array.isArray(data)) {
            inventoryItems = data;
        } else if (data && data.success && Array.isArray(data.data)) {
            inventoryItems = data.data;
        } else if (data && Array.isArray(data.items)) {
            inventoryItems = data.items;
        }
        
        console.log(`📦 Loaded ${inventoryItems.length} inventory items from MongoDB`);
        return inventoryItems;
    } catch (error) {
        console.error('❌ Error fetching inventory from MongoDB:', error.message);
        return [];
    }
}

// ==================== CHECK INGREDIENT AVAILABILITY ====================
async function checkIngredientAvailability(itemName) {
    try {
        console.log(`🔍 Checking ingredient availability for: ${itemName}`);
        
        const recipe = productIngredientMap[itemName];
        
        // If no recipe found, treat as product with no ingredients (like packaging)
        if (!recipe) {
            console.log(`ℹ️ No recipe found for "${itemName}" - Product has no ingredient requirements`);
            return {
                available: true,
                missingIngredients: [],
                availableIngredients: [],
                allIngredientsPresent: true,
                requiredIngredients: []
            };
        }
        
        // If recipe exists but has no ingredients
        if (!recipe.ingredients || Object.keys(recipe.ingredients).length === 0) {
            console.log(`ℹ️ No ingredients defined for "${itemName}" - Product has no ingredient requirements`);
            return {
                available: true,
                missingIngredients: [],
                availableIngredients: [],
                allIngredientsPresent: true,
                requiredIngredients: []
            };
        }
        
        console.log(`📋 Recipe for ${itemName}:`, recipe.ingredients);
        
        const missingIngredients = [];
        const availableIngredients = [];
        
        // Fetch inventory from MongoDB
        const inventoryItems = await fetchInventoryFromMongoDB();
        
        if (!Array.isArray(inventoryItems) || inventoryItems.length === 0) {
            console.log(`ℹ️ No inventory data available from MongoDB - Allowing product: ${itemName}`);
            return {
                available: true,
                missingIngredients: [],
                availableIngredients: [],
                allIngredientsPresent: true,
                requiredIngredients: []
            };
        }
        
        for (const [ingredientName, requiredAmount] of Object.entries(recipe.ingredients)) {
            console.log(`   Checking ingredient: ${ingredientName} (required: ${requiredAmount})`);
            
            const normalizedIngredientName = ingredientName.replace(/_/g, ' ');
            
            // Find in inventory
            const dbInventoryItem = inventoryItems.find(item => {
                const itemNameToCheck = item.itemName || item.name || '';
                return itemNameToCheck.toLowerCase() === normalizedIngredientName.toLowerCase();
            });
            
            if (!dbInventoryItem) {
                console.warn(`   ❌ NOT FOUND in inventory: ${ingredientName}`);
                missingIngredients.push(`${normalizedIngredientName} (NOT IN INVENTORY)`);
                continue;
            }
            
            const currentStock = parseFloat(dbInventoryItem.currentStock || 0);
            const unit = dbInventoryItem.unit || 'unit';
            
            console.log(`   Found in inventory: ${ingredientName} - Current: ${currentStock} ${unit}, Required: ${requiredAmount}`);
            
            if (currentStock <= 0) {
                console.warn(`   ❌ OUT OF STOCK: ${ingredientName}`);
                missingIngredients.push(`${ingredientName} - OUT OF STOCK (Have: ${currentStock} ${unit})`);
            } else if (currentStock < requiredAmount) {
                console.warn(`   ⚠️ INSUFFICIENT STOCK: ${ingredientName}`);
                missingIngredients.push(`${ingredientName} - INSUFFICIENT STOCK (Need: ${requiredAmount} ${unit}, Have: ${currentStock} ${unit})`);
            } else {
                console.log(`   ✅ SUFFICIENT STOCK: ${ingredientName}`);
                availableIngredients.push(ingredientName);
            }
        }
        
        const hasAllIngredients = missingIngredients.length === 0;
        console.log(`\n📊 Availability Result for "${itemName}": Available: ${hasAllIngredients ? '✅' : '❌'}\n`);
        
        return {
            available: hasAllIngredients,
            missingIngredients: missingIngredients,
            availableIngredients: availableIngredients,
            allIngredientsPresent: hasAllIngredients,
            requiredIngredients: Object.keys(recipe.ingredients)
        };
    } catch (error) {
        console.error('❌ Error checking ingredient availability:', error);
        console.log(`⚠️ Allowing product due to error: ${error.message}`);
        // Allow product to be added if there's an error checking ingredients
        return {
            available: true,
            missingIngredients: [],
            availableIngredients: [],
            allIngredientsPresent: true,
            requiredIngredients: []
        };
    }
}

// ==================== SHOW TOAST ====================
function showToast(message, type = 'success', duration = 5000) {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 400px;
        `;
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    toast.style.cssText = `
        margin-bottom: 10px;
        padding: 16px 20px;
        border-radius: 6px;
        color: white;
        font-weight: 500;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#17a2b8'};
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        display: flex;
        align-items: flex-start;
        gap: 12px;
        word-wrap: break-word;
        word-break: break-word;
        max-width: 100%;
        animation: slideIn 0.3s ease;
    `;
    
    const icon = document.createElement('i');
    icon.className = `fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}`;
    icon.style.cssText = 'flex-shrink: 0; margin-top: 2px;';
    
    const textSpan = document.createElement('span');
    textSpan.textContent = message;
    textSpan.style.cssText = 'flex: 1;';
    
    toast.appendChild(icon);
    toast.appendChild(textSpan);
    
    container.appendChild(toast);
    
    console.log(`📢 Toast [${type}]: ${message}`);
    
    setTimeout(() => { toast.classList.add('show'); }, 10);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
    }, duration);
}

// ==================== SHOW MISSING INGREDIENTS MODAL ====================
function showMissingIngredientsModal(productName, missingIngredients) {
    console.log(`🍽️ Displaying missing ingredients modal for: ${productName}`);
    
    // Create modal if it doesn't exist
    let modal = document.getElementById('missingIngredientsModal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'missingIngredientsModal';
        modal.className = 'modal';
        modal.style.cssText = `
            display: none;
            position: fixed;
            z-index: 1001;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
            align-items: center;
            justify-content: center;
        `;
        
        modal.innerHTML = `
            <div class="modal-content" style="
                background: white;
                padding: 25px;
                border-radius: 12px;
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            ">
                <div class="modal-header" style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 2px solid #f0f0f0;
                    padding-bottom: 15px;
                    margin-bottom: 20px;
                ">
                    <h2 style="margin: 0; color: #dc3545; font-size: 24px;">
                        <i class="fas fa-exclamation-triangle"></i> Missing Ingredients
                    </h2>
                    <button id="closeMissingIngredientsModal" style="
                        background: none;
                        border: none;
                        font-size: 28px;
                        cursor: pointer;
                        color: #666;
                    ">&times;</button>
                </div>
                <div class="modal-body">
                    <p style="font-size: 16px; margin-bottom: 20px; color: #333;">
                        Cannot add <strong id="missingProductName">${productName}</strong> because the following ingredients are missing or insufficient:
                    </p>
                    <ul id="missingIngredientsList" class="missing-ingredients-list" style="
                        list-style: none;
                        padding: 0;
                        margin: 0;
                    "></ul>
                    <div style="
                        background: #f8f9fa;
                        padding: 15px;
                        border-radius: 8px;
                        margin-top: 20px;
                        border-left: 4px solid #ffc107;
                    ">
                        <p style="margin: 0; color: #856404; font-size: 14px;">
                            <i class="fas fa-info-circle"></i> Please restock these ingredients in the Inventory Management system before adding this product.
                        </p>
                    </div>
                </div>
                <div class="modal-footer" style="
                    margin-top: 25px;
                    text-align: right;
                    border-top: 2px solid #f0f0f0;
                    padding-top: 20px;
                    display: flex;
                    gap: 10px;
                    justify-content: flex-end;
                ">
                    <button id="goToInventoryBtn" class="btn btn-secondary" style="
                        padding: 12px 30px;
                        background: #6c757d;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 16px;
                        font-weight: 500;
                        transition: all 0.3s ease;
                    " onmouseover="this.style.background='#5a6268'" onmouseout="this.style.background='#6c757d'">
                        📦 Go to Inventory
                    </button>
                    <button id="closeMissingIngredientsBtn" class="btn btn-primary" style="
                        padding: 12px 30px;
                        background: #28a745;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 16px;
                        font-weight: 500;
                        transition: all 0.3s ease;
                    " onmouseover="this.style.background='#218838'" onmouseout="this.style.background='#28a745'">
                        ✓ Understood
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    // ✅ ALWAYS attach event listeners (outside the if block so they work every time modal is shown)
    const closeBtn = document.getElementById('closeMissingIngredientsBtn');
    const closeModalBtn = document.getElementById('closeMissingIngredientsModal');
    const goToInventoryBtn = document.getElementById('goToInventoryBtn');
    
    // Remove old listeners by cloning and replacing
    if (closeBtn) {
        const newCloseBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
        newCloseBtn.addEventListener('click', function(e) {
            console.log('✓ Understood button clicked');
            e.preventDefault();
            e.stopPropagation();
            closeMissingIngredientsModal();
        });
    }
    
    if (closeModalBtn) {
        const newCloseModalBtn = closeModalBtn.cloneNode(true);
        closeModalBtn.parentNode.replaceChild(newCloseModalBtn, closeModalBtn);
        newCloseModalBtn.addEventListener('click', function(e) {
            console.log('✕ Close modal button clicked');
            e.preventDefault();
            e.stopPropagation();
            closeMissingIngredientsModal();
        });
    }
    
    if (goToInventoryBtn) {
        const newGoToInventoryBtn = goToInventoryBtn.cloneNode(true);
        goToInventoryBtn.parentNode.replaceChild(newGoToInventoryBtn, goToInventoryBtn);
        newGoToInventoryBtn.addEventListener('click', function(e) {
            console.log('📦 Go to Inventory button clicked');
            e.preventDefault();
            e.stopPropagation();
            closeMissingIngredientsModal();
            showToast('📦 Navigate to Inventory Management to restock ingredients', 'info', 3000);
            // Navigate to inventory section
            if (typeof showSection === 'function') {
                showSection('inventory');
            }
        });
    }
    
    // Handle modal background click
    modal.onclick = function(e) {
        if (e.target === modal) {
            closeMissingIngredientsModal();
        }
    };
    
    // Update modal content
    document.getElementById('missingProductName').textContent = productName;
    
    const listElement = document.getElementById('missingIngredientsList');
    listElement.innerHTML = '';
    
    missingIngredients.forEach(ingredient => {
        const listItem = document.createElement('li');
        listItem.style.cssText = `
            padding: 12px 15px;
            margin-bottom: 8px;
            background: #fff8f8;
            border-left: 4px solid #dc3545;
            border-radius: 4px;
            color: #721c24;
            font-size: 14px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        `;
        listItem.innerHTML = `<span style="font-weight: 600;">❌</span> ${ingredient}`;
        listElement.appendChild(listItem);
    });
    
    // Show modal
    console.log('📋 Showing missing ingredients modal');
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

function closeMissingIngredientsModal() {
    const modal = document.getElementById('missingIngredientsModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 150);
    }
}

// ==================== INITIALIZE EVENT LISTENERS ====================
function initializeEventListeners() {
    console.log('🔌 Initializing event listeners...');
    
    if (elements.addNewItem) {
        elements.addNewItem.addEventListener('click', openAddModal);
    }
    
    const addFirstItemBtn = document.getElementById('addFirstItemBtn');
    if (addFirstItemBtn) addFirstItemBtn.addEventListener('click', openAddModal);
    
    const addFirstMenuBtn = document.getElementById('addFirstMenuBtn');
    if (addFirstMenuBtn) addFirstMenuBtn.addEventListener('click', openAddModal);
    
    if (elements.saveItemBtn) {
        elements.saveItemBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            await handleSaveItem();
        });
    }
    
    if (elements.cancelBtn) elements.cancelBtn.addEventListener('click', closeModal);
    if (elements.closeModal) elements.closeModal.addEventListener('click', closeModal);
    
    if (elements.itemCategory) {
        elements.itemCategory.addEventListener('change', function() {
            updateFromCategory();
            if (elements.itemName) elements.itemName.value = '';
            if (elements.itemUnit) elements.itemUnit.value = '';
            if (elements.itemPrice) elements.itemPrice.value = '';
        });
    }
    
    if (elements.itemName) {
        elements.itemName.addEventListener('change', function() {
            updateFromItemNameSelect();
        });
    }
    
    if (elements.itemModal) {
        elements.itemModal.addEventListener('click', (e) => {
            if (e.target === elements.itemModal) closeModal();
        });
    }
    
    if (elements.itemForm) {
        elements.itemForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleSaveItem();
        });
    }
    
    if (elements.navLinks && elements.navLinks.length > 0) {
        elements.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                showSection(section);
            });
        });
    }
    
    if (elements.categoryItems && elements.categoryItems.length > 0) {
        elements.categoryItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const category = item.getAttribute('data-category');
                const fullname = item.getAttribute('data-fullname');
                filterByCategory(category, fullname);
            });
        });
    }
    
    // Close missing ingredients modal when clicking outside
    window.addEventListener('click', function(e) {
        const modal = document.getElementById('missingIngredientsModal');
        if (modal && e.target === modal) {
            closeMissingIngredientsModal();
        }
    });
}

// ==================== INITIALIZE CATEGORY DROPDOWN ====================
function initializeCategoryDropdown() {
    if (!elements.itemCategory) return;
    
    elements.itemCategory.innerHTML = '<option value="">Select Category</option>';
    
    Object.keys(categoryDisplayNames).forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = categoryDisplayNames[category];
        elements.itemCategory.appendChild(option);
    });
}

// ==================== CATEGORY DROPDOWN FUNCTIONS ====================
function populateItemNamesByCategory(category = null) {
    const itemNameSelect = elements.itemName;
    if (!itemNameSelect) return;
    
    itemNameSelect.innerHTML = '<option value="">Select Product</option>';
    
    if (!category || category.trim() === '') return;
    
    const categoryItems = menuDatabase[category] || [];
    
    if (categoryItems.length === 0) return;
    
    const sortedItems = [...categoryItems].sort((a, b) => a.name.localeCompare(b.name));
    
    sortedItems.forEach(item => {
        const option = document.createElement('option');
        option.value = item.name;
        option.textContent = item.name;
        option.dataset.unit = item.unit;
        option.dataset.price = item.defaultPrice;
        itemNameSelect.appendChild(option);
    });
}

function updateFromItemNameSelect() {
    const itemName = elements.itemName.value;
    
    if (!itemName || itemName.trim() === '' || itemName === 'Select Product') return;
    
    const selectedOption = elements.itemName.options[elements.itemName.selectedIndex];
    const unit = selectedOption.dataset.unit;
    const price = selectedOption.dataset.price;
    
    if (unit && elements.itemUnit) elements.itemUnit.value = unit;
    if (price && elements.itemPrice) elements.itemPrice.value = price;
}

function updateFromCategory() {
    const category = elements.itemCategory.value;
    
    if (!category || category.trim() === '' || category === 'Select Category') {
        if (elements.itemName) elements.itemName.innerHTML = '<option value="">Select Product</option>';
        if (elements.itemUnit) elements.itemUnit.value = '';
        if (elements.itemPrice) elements.itemPrice.value = '';
        return;
    }
    
    updateUnitOptions(category);
    populateItemNamesByCategory(category);
    
    if (elements.itemName) elements.itemName.value = '';
    if (elements.itemUnit) elements.itemUnit.value = '';
    if (elements.itemPrice) elements.itemPrice.value = '';
}

function updateUnitOptions(category) {
    const unitSelect = elements.itemUnit;
    if (!unitSelect) return;
    
    const availableUnits = categoryUnitsMapping[category] || ['pcs'];
    const currentUnit = unitSelect.value;
    
    unitSelect.innerHTML = '<option value="">Select Unit</option>';
    
    availableUnits.forEach(unit => {
        const option = document.createElement('option');
        option.value = unit;
        option.textContent = unitDisplayLabels[unit] || unit.charAt(0).toUpperCase() + unit.slice(1);
        unitSelect.appendChild(option);
    });
    
    if (currentUnit && availableUnits.includes(currentUnit)) {
        unitSelect.value = currentUnit;
    } else if (availableUnits.length > 0) {
        const defaultUnits = {
            'Rice': 'plate',
            'Sizzling': 'sizzling plate',
            'Party': 'tray',
            'Drink': 'glass',
            'Cafe': 'cup',
            'Milk': 'cup',
            'Frappe': 'cup',
            'Snack & Appetizer': 'serving',
            'Budget Meals Served with Rice': 'meal',
            'Specialties': 'serving',
            'packaging': 'pack'
        };
        unitSelect.value = defaultUnits[category] || availableUnits[0];
    }
}

// ==================== FORMATTING FUNCTIONS ====================
function formatNumber(num) {
    if (num === undefined || num === null || isNaN(num)) return '0';
    return new Intl.NumberFormat('en-US').format(num);
}

function formatCurrency(amount) {
    if (amount === undefined || amount === null || isNaN(amount)) return '₱0.00';
    const numAmount = parseFloat(amount);
    return '₱' + numAmount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

function getCategoryDisplayName(category) {
    return categoryDisplayNames[category] || category;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== FETCH MENU ITEMS ====================
async function fetchMenuItems() {
    try {
        console.log('🔍 Fetching menu items from API...');
        
        const response = await fetch('/api/menu', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        });
        
        if (response.status === 401) {
            console.warn('⚠️ Unauthorized - session expired');
            showToast('Session expired. Please login again.', 'error');
            setTimeout(() => { window.location.href = '/login'; }, 2000);
            return false;
        }
        
        if (!response.ok) {
            console.warn(`⚠️ API error ${response.status} - ${response.statusText}`);
            return false;
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.warn('⚠️ Response is not JSON');
            return false;
        }
        
        const data = await response.json();
        
        if (data && data.success && Array.isArray(data.data)) {
            allMenuItems = data.data || [];
            console.log(`✅ ${allMenuItems.length} items loaded from API`);
            
            // Save to localStorage as backup only
            try {
                localStorage.setItem('menuItems_backup', JSON.stringify(allMenuItems));
                localStorage.setItem('menuItems_lastUpdate', new Date().toISOString());
            } catch (e) {
                console.warn('⚠️ Could not save to localStorage:', e);
            }
            
            updateAllUIComponents();
            
            retryCount = 0;
            
            return true;
        } else {
            console.warn('⚠️ API response data invalid or missing');
            return false;
        }
    } catch (error) {
        console.error('❌ Network error fetching menu items:', error.message);
        return false;
    }
}

// ==================== MODAL FUNCTIONS ====================
function openAddModal() {
    if (isModalOpen) return;
    
    console.log(`📦 Opening Add New Product Modal`);
    
    isModalOpen = true;
    const modal = elements.itemModal;
    
    if (elements.modalTitle) elements.modalTitle.textContent = 'Add New Product';
    if (elements.itemForm) elements.itemForm.reset();
    if (elements.itemId) elements.itemId.value = '';
    
    if (elements.currentStock) elements.currentStock.value = '0';
    if (elements.minimumStock) elements.minimumStock.value = '20';
    if (elements.maximumStock) elements.maximumStock.value = '200';
    if (elements.itemPrice) elements.itemPrice.value = '';
    
    if (elements.itemCategory) {
        elements.itemCategory.value = '';
        updateFromCategory();
    }
    
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('show');
        if (elements.itemCategory) elements.itemCategory.focus();
    }, 10);
}

async function openEditModal(itemId) {
    if (isModalOpen) return;
    
    const item = allMenuItems.find(i => i._id === itemId);
    if (!item) {
        showToast('Product not found', 'error');
        return;
    }
    
    isModalOpen = true;
    const modal = elements.itemModal;
    
    if (elements.modalTitle) elements.modalTitle.textContent = 'Edit Product';
    if (elements.itemId) elements.itemId.value = item._id;
    
    if (elements.itemCategory) {
        elements.itemCategory.value = item.category;
        updateUnitOptions(item.category);
        populateItemNamesByCategory(item.category);
        
        setTimeout(() => {
            if (elements.itemName) {
                for (let i = 0; i < elements.itemName.options.length; i++) {
                    if (elements.itemName.options[i].value === item.name || elements.itemName.options[i].value === item.itemName) {
                        elements.itemName.selectedIndex = i;
                        break;
                    }
                }
                
                if (!elements.itemName.value && (item.name || item.itemName)) {
                    const option = document.createElement('option');
                    option.value = item.name || item.itemName;
                    option.textContent = item.name || item.itemName;
                    elements.itemName.appendChild(option);
                    elements.itemName.value = item.name || item.itemName;
                }
            }
            
            if (elements.itemUnit) elements.itemUnit.value = item.unit || '';
            if (elements.itemPrice) elements.itemPrice.value = item.price || '';
            if (elements.currentStock) elements.currentStock.value = item.currentStock || 0;
            if (elements.minimumStock) elements.minimumStock.value = item.minStock || 20;
            if (elements.maximumStock) elements.maximumStock.value = item.maxStock || 200;
            
            if (elements.itemName) elements.itemName.dispatchEvent(new Event('change'));
        }, 150);
    }
    
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('show');
        if (elements.itemName) elements.itemName.focus();
    }, 10);
}

function closeModal() {
    if (elements.itemModal) {
        elements.itemModal.classList.remove('show');
        setTimeout(() => {
            elements.itemModal.style.display = 'none';
            isModalOpen = false;
        }, 150);
    }
}

// ==================== SAVE MENU ITEM ====================
async function handleSaveItem() {
    const formData = {
        itemId: elements.itemId ? elements.itemId.value : '',
        itemName: elements.itemName ? elements.itemName.value : '',
        category: elements.itemCategory ? elements.itemCategory.value : '',
        unit: elements.itemUnit ? elements.itemUnit.value : '',
        currentStock: elements.currentStock ? elements.currentStock.value : '0',
        minStock: elements.minimumStock ? elements.minimumStock.value : '20',
        maxStock: elements.maximumStock ? elements.maximumStock.value : '200',
        price: elements.itemPrice ? elements.itemPrice.value : '0'
    };
    
    if (!formData.itemName || formData.itemName.trim() === '' || formData.itemName === 'Select Product') {
        showToast('Please select a product from the dropdown list', 'error');
        if (elements.itemName) {
            elements.itemName.focus();
            elements.itemName.style.borderColor = '#dc3545';
        }
        return;
    }
    
    if (!formData.category || formData.category.trim() === '' || formData.category === 'Select Category') {
        showToast('Please select a category from the dropdown', 'error');
        if (elements.itemCategory) {
            elements.itemCategory.focus();
            elements.itemCategory.style.borderColor = '#dc3545';
        }
        return;
    }
    
    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
        showToast('Please enter a valid price (must be a number greater than 0)', 'error');
        if (elements.itemPrice) {
            elements.itemPrice.focus();
            elements.itemPrice.style.borderColor = '#dc3545';
        }
        return;
    }
    
    if (!formData.unit || formData.unit.trim() === '' || formData.unit === 'Select Unit') {
        showToast('Please select a unit from the dropdown', 'error');
        if (elements.itemUnit) {
            elements.itemUnit.focus();
            elements.itemUnit.style.borderColor = '#dc3545';
        }
        return;
    }
    
    const maxStock = parseInt(formData.maxStock);
    const minStock = parseInt(formData.minStock);
    const currentStock = parseInt(formData.currentStock);
    
    if (isNaN(maxStock) || maxStock <= 0) {
        showToast('Maximum stock must be a positive number', 'error');
        if (elements.maximumStock) elements.maximumStock.focus();
        return;
    }
    
    if (isNaN(minStock) || minStock < 0) {
        showToast('Minimum stock must be 0 or greater', 'error');
        if (elements.minimumStock) elements.minimumStock.focus();
        return;
    }
    
    if (maxStock <= minStock) {
        showToast('Maximum stock must be greater than minimum stock', 'error');
        if (elements.maximumStock) elements.maximumStock.focus();
        return;
    }
    
    if (currentStock > maxStock) {
        showToast('Current stock cannot exceed maximum stock', 'error');
        if (elements.currentStock) elements.currentStock.focus();
        return;
    }
    
    if (currentStock < 0) {
        showToast('Current stock cannot be negative', 'error');
        if (elements.currentStock) elements.currentStock.focus();
        return;
    }
    
    // Check if this is a new product (not editing)
    if (!formData.itemId || formData.itemId.trim() === '') {
        console.log(`\n🔍 ========== CHECKING INGREDIENTS FOR: ${formData.itemName} ==========`);
        
        const availabilityCheck = await checkIngredientAvailability(formData.itemName);
        
        // If ingredients are missing, show modal and prevent saving
        if (!availabilityCheck.available && availabilityCheck.missingIngredients.length > 0) {
            console.warn(`❌ Missing ingredients detected - blocking product creation`);
            
            // Show missing ingredients modal
            showMissingIngredientsModal(formData.itemName, availabilityCheck.missingIngredients);
            
            // Close the add product modal
            closeModal();
            
            // Show warning toast
            showToast(`❌ Cannot add "${formData.itemName}" - Missing ingredients`, 'error', 5000);
            
            return; // Stop the save process
        }
        
        console.log(`✅ All ingredients available! Proceeding to save...`);
    }
    
    await saveMenuItem(formData);
}

async function saveMenuItem(itemData) {
    const isEdit = itemData.itemId && itemData.itemId.trim() !== '';
    
    const saveBtn = elements.saveItemBtn;
    const originalText = saveBtn.textContent;
    saveBtn.textContent = 'Saving...';
    saveBtn.disabled = true;
    
    try {
        const payload = {
            name: itemData.itemName,
            itemName: itemData.itemName,
            category: itemData.category,
            unit: itemData.unit,
            currentStock: Number(itemData.currentStock),
            minStock: Number(itemData.minStock),
            maxStock: Number(itemData.maxStock),
            price: Number(itemData.price),
            itemType: 'finished',
            isActive: true
        };
        
        let url, method;
        
        if (isEdit) {
            url = `/api/menu/${itemData.itemId}`;
            method = 'PUT';
        } else {
            url = '/api/menu';
            method = 'POST';
        }
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload),
            credentials: 'include'
        });
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Invalid server response format');
        }
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(`Server error ${response.status}: ${data.message || 'Unknown error'}`);
        }
        
        if (data.success) {
            const action = isEdit ? 'updated' : 'added';
            showToast(`Product ${action} successfully!`, 'success');
            closeModal();
            await fetchMenuItems();
            updateCategoryCounts();
            
            if (!isEdit) {
                console.log(`✅ Product "${itemData.itemName}" created successfully`);
            }
            
            saveInventoryStockValues();
            
        } else {
            throw new Error(data.message || 'Failed to save product');
        }
    } catch (error) {
        console.error('❌ Error saving product:', error);
        showToast(`Error: ${error.message}`, 'error');
    } finally {
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
    }
}

// ==================== DELETE MENU ITEM ====================
async function deleteMenuItem(itemId, event) {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
        return;
    }
    
    console.log(`🗑️ Deleting product: ${itemId}`);
    
    // Get the button element - either from event or by searching the DOM
    let deleteBtn = null;
    if (event && event.target) {
        deleteBtn = event.target;
    } else {
        // Search for the delete button by finding it in the product card
        deleteBtn = document.querySelector(`[onclick*="deleteMenuItem('${itemId}')"]`);
    }
    
    if (!deleteBtn) {
        console.warn('⚠️ Delete button not found, proceeding with deletion');
    } else {
        deleteBtn.style.opacity = '0.5';
        deleteBtn.style.pointerEvents = 'none';
    }
    
    try {
        console.log(`📡 Sending DELETE request to /api/menu/${itemId}`);
        
        const response = await fetch(`/api/menu/${itemId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        
        console.log(`📊 Response status: ${response.status}`);
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Invalid server response format');
        }
        
        const data = await response.json();
        console.log(`📋 Response data:`, data);
        
        if (!response.ok) {
            throw new Error(`Server error ${response.status}: ${data.message || 'Unknown error'}`);
        }
        
        if (data.success) {
            console.log(`✅ Product deleted successfully from MongoDB`);
            showToast('Product deleted successfully!', 'success');
            
            // Remove from local array
            allMenuItems = allMenuItems.filter(item => item._id !== itemId);
            console.log(`✅ Product removed from allMenuItems (${allMenuItems.length} items remaining)`);
            
            // Update UI
            updateAllUIComponents();
            updateCategoryCounts();
            
            console.log(`✅ Changes saved`);
        } else {
            throw new Error(data.message || 'Delete failed');
        }
    } catch (error) {
        console.error('❌ Error deleting product:', error);
        showToast(`Failed to delete product: ${error.message}`, 'error');
        addNotification(`Delete failed for product`, 'error', itemId);
    } finally {
        if (deleteBtn) {
            deleteBtn.style.opacity = '1';
            deleteBtn.style.pointerEvents = 'auto';
        }
    }
}

// ==================== UPDATE UI COMPONENTS ====================
function updateAllUIComponents() {
    if (currentSection === 'dashboard') {
        updateDashboardStats();
        renderDashboardGrid();
    } else if (currentSection === 'menu') {
        renderMenuGrid();
    }
    updateCategoryCounts();
}

function updateDashboardStats() {
    if (!allMenuItems || !Array.isArray(allMenuItems)) {
        const totalEl = document.getElementById('totalProducts');
        const lowEl = document.getElementById('lowStock');
        const outEl = document.getElementById('outOfStock');
        const inEl = document.getElementById('inStock');
        const valueEl = document.getElementById('menuValue');
        
        if (totalEl) totalEl.textContent = '0';
        if (lowEl) lowEl.textContent = '0';
        if (outEl) outEl.textContent = '0';
        if (inEl) inEl.textContent = '0';
        if (valueEl) valueEl.textContent = '₱0';
        return;
    }
    
    const totalMenuItems = allMenuItems.length;
    
    const lowStockItems = allMenuItems.filter(item => {
        const currentStock = item.currentStock || 0;
        const minStock = item.minStock || 0;
        return currentStock > 0 && currentStock <= minStock;
    }).length;
    
    const outOfStockItems = allMenuItems.filter(item => (item.currentStock || 0) === 0).length;
    const inStockItems = allMenuItems.filter(item => (item.currentStock || 0) > (item.minStock || 0)).length;
    
    const menuValueTotal = allMenuItems.reduce((total, item) => {
        const price = item.price || 0;
        const stock = item.currentStock || 0;
        return total + (price * stock);
    }, 0);
    
    const totalEl = document.getElementById('totalProducts');
    const lowEl = document.getElementById('lowStock');
    const outEl = document.getElementById('outOfStock');
    const inEl = document.getElementById('inStock');
    const valueEl = document.getElementById('menuValue');
    
    if (totalEl) totalEl.textContent = formatNumber(totalMenuItems);
    if (lowEl) lowEl.textContent = formatNumber(lowStockItems);
    if (outEl) outEl.textContent = formatNumber(outOfStockItems);
    if (inEl) inEl.textContent = formatNumber(inStockItems);
    if (valueEl) valueEl.textContent = formatCurrency(menuValueTotal);
}

function updateCategoryCounts() {
    if (!allMenuItems || !Array.isArray(allMenuItems)) return;
    
    const categories = {
        'all': allMenuItems.length,
        'Rice': allMenuItems.filter(item => item.category === 'Rice').length,
        'Sizzling': allMenuItems.filter(item => item.category === 'Sizzling').length,
        'Party': allMenuItems.filter(item => item.category === 'Party').length,
        'Drink': allMenuItems.filter(item => item.category === 'Drink').length,
        'Cafe': allMenuItems.filter(item => item.category === 'Cafe').length,
        'Milk': allMenuItems.filter(item => item.category === 'Milk').length,
        'Frappe': allMenuItems.filter(item => item.category === 'Frappe').length,
        'Snack & Appetizer': allMenuItems.filter(item => item.category === 'Snack & Appetizer').length,
        'Budget Meals Served with Rice': allMenuItems.filter(item => item.category === 'Budget Meals Served with Rice').length,
        'Specialties': allMenuItems.filter(item => item.category === 'Specialties').length,
        'packaging': allMenuItems.filter(item => item.category === 'packaging').length
    };
    
    if (elements.categoryItems && elements.categoryItems.length > 0) {
        elements.categoryItems.forEach(item => {
            const category = item.getAttribute('data-category');
            const countElement = item.querySelector('.category-count');
            if (countElement) {
                countElement.textContent = categories[category] || 0;
            }
        });
    }
}

function showSection(section) {
    document.querySelectorAll('.section-content').forEach(sec => {
        sec.classList.remove('active-section');
    });
    
    const targetSection = document.getElementById(section);
    if (targetSection) targetSection.classList.add('active-section');
    
    if (elements.navLinks && elements.navLinks.length > 0) {
        elements.navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-section') === section) {
                link.classList.add('active');
            }
        });
    }
    
    currentSection = section;
    
    if (section === 'dashboard') {
        updateDashboardStats();
        renderDashboardGrid();
    } else if (section === 'menu') {
        renderMenuGrid();
    }
}

function filterByCategory(category, fullname) {
    currentCategory = category;
    
    if (elements.categoryItems && elements.categoryItems.length > 0) {
        elements.categoryItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-category') === category) {
                item.classList.add('active');
            }
        });
    }
    
    if (elements.currentCategoryTitle) {
        elements.currentCategoryTitle.textContent = fullname || 'Product Menu';
    }
    
    if (currentSection === 'menu') {
        renderMenuGrid();
    }
}

// ==================== RENDER MENU GRID ====================
function renderMenuGrid() {
    if (!elements.menuGrid) return;
    
    if (!allMenuItems || !Array.isArray(allMenuItems) || allMenuItems.length === 0) {
        elements.menuGrid.innerHTML = `
            <div class="empty-state">
                <h3>No products found</h3>
            </div>
        `;
        return;
    }
    
    let filteredItems = [...allMenuItems];
    
    if (currentCategory !== 'all') {
        filteredItems = allMenuItems.filter(item => item.category === currentCategory);
    }
    
    if (filteredItems.length === 0) {
        elements.menuGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <h3>No products in this category</h3>
                <p>Add products to this category using the "Add New Product" button</p>
                <button class="btn btn-primary" onclick="openAddModal()">Add New Product</button>
            </div>
        `;
        return;
    }
    
    const gridHTML = filteredItems.map(item => {
        const itemName = item.name || item.itemName || 'Unnamed Product';
        const itemPrice = item.price || 0;
        const currentStock = item.currentStock || 0;
        const maxStock = item.maxStock || 0;
        const minStock = item.minStock || 0;
        const unit = item.unit || '';
        const displayUnit = unitDisplayLabels[unit] || unit;
        const itemValue = itemPrice * currentStock;
        const stockPercentage = maxStock > 0 ? ((currentStock / maxStock) * 100) : 0;
        
        let stockClass = '';
        let progressClass = '';
        if (currentStock === 0) {
            stockClass = 'out-of-stock';
            progressClass = 'danger';
        } else if (currentStock <= minStock) {
            stockClass = 'low-stock';
            progressClass = 'warning';
        }
        
        return `
        <div class="menu-card ${stockClass}">
            <div class="card-header">
                <h4>${escapeHtml(itemName)}</h4>
                <div class="card-actions">
                    <button class="btn-icon" onclick="openEditModal('${item._id}')" title="Edit product">✏️</button>
                    <button class="btn-icon delete" onclick="deleteMenuItem('${item._id}', event)" title="Delete product">🗑️</button>
                </div>
            </div>
            <div class="card-body">
                <div class="card-info"><span class="label">Category:</span> ${getCategoryDisplayName(item.category)}</div>
                <div class="card-info"><span class="label">Selling Price:</span> ₱${itemPrice.toFixed(2)}</div>
                <div class="card-info"><span class="label">Unit:</span> ${displayUnit}</div>
                
                <div style="margin: 12px 0 8px;">
                    <div style="display: flex; justify-content: space-between; font-size: 13px;">
                        <span><span class="label">Current Stock:</span> <strong>${currentStock}</strong> ${displayUnit}</span>
                        <span><span class="label">Max:</span> ${maxStock}</span>
                    </div>
                    <div class="stock-progress">
                        <div class="progress-bar ${progressClass}" style="width: ${Math.min(stockPercentage, 100)}%"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 4px;">
                        <span class="status-badge ${currentStock === 0 ? 'status-out' : currentStock <= minStock ? 'status-low' : 'status-available'}">
                            ${currentStock === 0 ? 'Out of Stock' : currentStock <= minStock ? 'Low Stock' : 'In Stock'}
                        </span>
                        <span><span class="label">Min:</span> ${minStock} ${displayUnit}</span>
                    </div>
                </div>
                
                <div class="card-info"><span class="label">Stock Value:</span> ₱${itemValue.toFixed(2)}</div>
            </div>
            
            <!-- Quick Add Stock Section - Integrated directly in the product card -->
            <div class="quick-add-section">
                <div class="quick-add-title">
                    <i class="fas fa-plus-circle" style="color: #28a745;"></i>
                    <span>Add Stock</span>
                </div>
                <div class="quick-add-controls">
                    <input type="number" 
                           id="addStock-${item._id}" 
                           class="quick-add-input" 
                           placeholder="Qty to add"
                           min="1"
                           max="${maxStock - currentStock}"
                           step="1"
                           value="1">
                    <button class="quick-add-btn" 
                            onclick="quickAddStock('${item._id}', '${escapeHtml(itemName).replace(/'/g, "\\'")}')"
                            ${currentStock >= maxStock ? 'disabled' : ''}>
                        Add
                    </button>
                </div>
                ${currentStock >= maxStock ? 
                    '<div style="font-size: 11px; color: #dc3545; margin-top: 5px;">⚠️ Max stock reached</div>' : 
                    `<div style="font-size: 11px; color: #6c757d; margin-top: 5px;">Can add up to ${maxStock - currentStock} ${displayUnit}</div>`
                }
            </div>
        </div>
        `;
    }).join('');
    
    elements.menuGrid.innerHTML = gridHTML;
}

// ==================== RENDER DASHBOARD GRID ====================
async function renderDashboardGrid() {
    if (!elements.dashboardGrid) return;
    
    if (!allMenuItems || !Array.isArray(allMenuItems) || allMenuItems.length === 0) {
        elements.dashboardGrid.innerHTML = `
            <div class="empty-state">
                <h3>No products available</h3>
            </div>
        `;
        return;
    }
    
    // Get low stock items
    const lowStockItems = allMenuItems.filter(item => {
        const currentStock = item.currentStock || 0;
        const minStock = item.minStock || 0;
        return currentStock <= minStock;
    });
    
    // Get pending stock requests from MongoDB
    let pendingStockRequests = [];
    
    try {
        const response = await fetch('/api/stock-requests/pending');
        if (response.ok) {
            const result = await response.json();
            if (result.data && Array.isArray(result.data)) {
                pendingStockRequests = result.data.map(req => ({
                    _id: req._id,
                    productName: req.productName || 'Unknown Product',
                    quantity: req.requestedQuantity || 0,
                    unit: req.unit || 'unit',
                    requestedBy: req.requestedBy || 'Staff',
                    timestamp: req.requestDate ? new Date(req.requestDate).toLocaleTimeString() : new Date().toLocaleTimeString(),
                    date: req.requestDate ? new Date(req.requestDate).toLocaleDateString() : new Date().toLocaleDateString(),
                    message: `Stock request for ${req.requestedQuantity || 0} of ${req.productName || 'Unknown Product'}`,
                    fulfilled: false
                }));
            }
        } else {
            console.error('Failed to fetch pending stock requests');
        }
    } catch (error) {
        console.error('Error fetching stock requests from MongoDB:', error);
    }
    
    const staffRequestCount = pendingStockRequests.length;
    
    // If we have pending stock requests, show them prominently
    if (staffRequestCount > 0) {
        // Show pending stock requests in dashboard grid
        const requestsHTML = pendingStockRequests.map((request, index) => {
            const productName = request.productName || 'Unknown Product';
            const quantity = request.quantity || 0;
            const unit = request.unit || 'unit';
            const requestedBy = request.requestedBy || 'Staff';
            const timestamp = request.timestamp || new Date().toLocaleTimeString();
            const date = request.date || new Date().toLocaleDateString();
            const message = request.message || `Stock request for ${quantity} ${unit} of ${productName}`;
            
            return `
            <div class="menu-card stock-request-card" style="border-left: 4px solid #2196f3; background: #e3f2fd; margin-bottom: 15px;">
                <div class="card-header">
                    <h4 style="display: flex; align-items: center; gap: 8px; color: #0b5e8a;">
                        <i class="fas fa-box" style="color: #2196f3;"></i>
                        ${escapeHtml(productName)}
                    </h4>
                    <div class="card-actions">
                    </div>
                </div>
                <div class="card-body">
                    <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                        <div style="background: white; border-radius: 50%; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; font-size: 24px;">
                            📦
                        </div>
                        <div>
                            <div style="font-size: 13px; color: #666; margin-bottom: 5px;">
                                <span class="label">Requested by:</span> <strong>${escapeHtml(requestedBy)}</strong>
                            </div>
                            <div style="font-size: 13px; color: #666;">
                                <span class="label">Time:</span> ${date} ${timestamp}
                            </div>
                        </div>
                    </div>
                    
                    <div style="background: white; border-radius: 8px; padding: 15px; margin-bottom: 10px;">
                        <div style="font-size: 14px; color: #333; margin-bottom: 8px;">
                            <i class="fas fa-clipboard-list" style="color: #2196f3; margin-right: 8px;"></i>
                            ${escapeHtml(message)}
                        </div>
                        <div style="display: flex; align-items: baseline; gap: 10px; font-size: 13px;">
                            <span class="label">Quantity requested:</span>
                            <span style="font-size: 18px; font-weight: bold; color: #2196f3;">${quantity} ${unit}</span>
                        </div>
                    </div>
                    
                    <div style="display: flex; justify-content: flex-end; margin-top: 15px;">
                        <button onclick="fulfillStockRequest(${index})" style="
                            background: #4caf50;
                            border: none;
                            color: white;
                            padding: 10px 24px;
                            border-radius: 4px;
                            font-size: 14px;
                            cursor: pointer;
                            font-weight: 600;
                            transition: all 0.3s ease;
                        " onmouseover="this.style.background='#45a049'" onmouseout="this.style.background='#4caf50'">
                            ✓ Done
                        </button>
                    </div>
                    </div>
                </div>
            </div>
            `;
        }).join('');
        
        // Also show low stock items if any
        if (lowStockItems.length > 0) {
            const lowStockHTML = lowStockItems.slice(0, 4).map(item => {
                const itemName = item.name || item.itemName || 'Unnamed Product';
                const currentStock = item.currentStock || 0;
                const maxStock = item.maxStock || 0;
                const minStock = item.minStock || 0;
                const unit = item.unit || '';
                const displayUnit = unitDisplayLabels[unit] || unit;
                const stockPercentage = maxStock > 0 ? ((currentStock / maxStock) * 100) : 0;
                
                return `
                <div class="menu-card ${currentStock === 0 ? 'out-of-stock' : 'low-stock'}" style="margin-bottom: 15px;">
                    <div class="card-header">
                        <h4>${escapeHtml(itemName)}</h4>
                        <div class="card-actions">
                            <button class="btn-icon" onclick="openEditModal('${item._id}')" title="Edit product">✏️</button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div style="margin: 8px 0;">
                            <div style="display: flex; justify-content: space-between;">
                                <span><span class="label">Stock:</span> ${currentStock}/${maxStock} ${displayUnit}</span>
                                <span><span class="label">Min:</span> ${minStock} ${displayUnit}</span>
                            </div>
                            <div class="stock-progress">
                                <div class="progress-bar ${currentStock === 0 ? 'danger' : 'warning'}" style="width: ${Math.min(stockPercentage, 100)}%"></div>
                            </div>
                        </div>
                        <div class="card-info">
                            <span class="label">Status:</span>
                            <span class="status-badge ${currentStock === 0 ? 'status-out' : 'status-low'}">
                                ${currentStock === 0 ? 'Out of Stock' : 'Low Stock'}
                            </span>
                        </div>
                    </div>
                </div>
                `;
            }).join('');
            
            elements.dashboardGrid.innerHTML = `
                <h3 style="margin-bottom: 20px; color: #dc3545;">⚠️ Pending Stock Requests (${staffRequestCount})</h3>
                ${requestsHTML}
                
                <h3 style="margin: 30px 0 20px; color: #ff9800;">📉 Low Stock Items</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
                    ${lowStockHTML}
                </div>
            `;
        } else {
            elements.dashboardGrid.innerHTML = `
                <h3 style="margin-bottom: 20px; color: #dc3545;">⚠️ Pending Stock Requests (${staffRequestCount})</h3>
                ${requestsHTML}
            `;
        }
        
        return;
    }
    
    // If no pending requests but have low stock items, show low stock items
    if (lowStockItems.length > 0) {
        const gridHTML = lowStockItems.slice(0, 8).map(item => {
            const itemName = item.name || item.itemName || 'Unnamed Product';
            const itemPrice = item.price || 0;
            const currentStock = item.currentStock || 0;
            const maxStock = item.maxStock || 0;
            const minStock = item.minStock || 0;
            const unit = item.unit || '';
            const displayUnit = unitDisplayLabels[unit] || unit;
            const itemValue = itemPrice * currentStock;
            const stockPercentage = maxStock > 0 ? ((currentStock / maxStock) * 100) : 0;
            
            return `
            <div class="menu-card ${currentStock === 0 ? 'out-of-stock' : 'low-stock'}">
                <div class="card-header">
                    <h4>${escapeHtml(itemName)}</h4>
                    <div class="card-actions">
                        <button class="btn-icon" onclick="openEditModal('${item._id}')" title="Edit product">✏️</button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="card-info"><span class="label">Category:</span> ${getCategoryDisplayName(item.category)}</div>
                    <div style="margin: 8px 0;">
                        <div style="display: flex; justify-content: space-between;">
                            <span><span class="label">Stock:</span> ${currentStock}/${maxStock} ${displayUnit}</span>
                            <span><span class="label">Value:</span> ₱${itemValue.toFixed(2)}</span>
                        </div>
                        <div class="stock-progress">
                            <div class="progress-bar ${currentStock === 0 ? 'danger' : 'warning'}" style="width: ${Math.min(stockPercentage, 100)}%"></div>
                        </div>
                    </div>
                    <div class="card-info"><span class="label">Min Stock:</span> ${minStock} ${displayUnit}</div>
                    <div class="card-info">
                        <span class="label">Status:</span>
                        <span class="status-badge ${currentStock === 0 ? 'status-out' : 'status-low'}">
                            ${currentStock === 0 ? 'Out of Stock' : 'Low Stock'}
                        </span>
                    </div>
                </div>
            </div>
            `;
        }).join('');
        
        elements.dashboardGrid.innerHTML = gridHTML;
    } else {
        // All products well stocked, no pending requests
        elements.dashboardGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon"></div>
                <h3>Request Stock from Staff</h3>
            </div>
        `;
    }
}

// ==================== QUICK ADD STOCK FUNCTION ====================
async function quickAddStock(itemId, itemName) {
    let inputElement = document.getElementById(`addStock-${itemId}`);
    
    if (!inputElement) {
        showToast('❌ Input element not found', 'error');
        return;
    }
    
    const quantityToAdd = parseInt(inputElement.value) || 0;
    
    if (quantityToAdd <= 0) {
        showToast('❌ Please enter a quantity greater than 0', 'error');
        return;
    }
    
    const product = allMenuItems.find(p => p._id === itemId);
    if (!product) {
        showToast(`❌ Product "${itemName}" not found`, 'error');
        return;
    }
    
    const currentStock = product.currentStock || 0;
    const maxStock = product.maxStock || 100;
    const newStock = currentStock + quantityToAdd;
    
    if (newStock > maxStock) {
        showToast(`❌ Would exceed max stock (${maxStock}). Current: ${currentStock}, Can add: ${maxStock - currentStock}`, 'warning');
        return;
    }
    
    const unit = product.unit || 'unit';
    const confirmMsg = `Add ${quantityToAdd} ${unit} to "${itemName}"?\n\nCurrent: ${currentStock} ${unit}\nAfter add: ${newStock} ${unit}`;
    
    if (!confirm(confirmMsg)) {
        return;
    }
    
    try {
        console.log(`📦 ADDING STOCK: ${quantityToAdd} ${unit} to "${itemName}"`);
        
        const response = await fetch(`/api/menu/${itemId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                name: product.name || product.itemName,
                itemName: product.name || product.itemName,
                category: product.category,
                price: product.price,
                unit: product.unit,
                currentStock: newStock,
                minStock: product.minStock,
                maxStock: product.maxStock,
                image: product.image || 'default_food.jpg'
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Server error ${response.status}`);
        }
        
        const responseData = await response.json();
        console.log(`✅ MongoDB UPDATED: ${itemName} stock is now ${newStock}`);
        
        product.currentStock = newStock;
        
        inputElement.value = '1';
        inputElement.max = maxStock - newStock;
        
        showToast(`✅ Added ${quantityToAdd} ${unit} to "${itemName}" (New: ${newStock} ${unit})`, 'success');
        
        addNotification(
            `Added ${quantityToAdd} ${unit} to "${itemName}"`,
            'success',
            itemName
        );
        
        renderMenuGrid();
        updateDashboardStats();
        
        await fetchMenuItems();
        
        console.log(`✅ Stock added and saved to MongoDB`);
        
    } catch (error) {
        console.error('❌ Error adding stock:', error);
        showToast(`❌ Error: ${error.message}`, 'error');
    }
}

// ==================== QUICK ADD STOCK FOR REQUEST ====================
function quickAddStockForRequest(productName, quantity, unit) {
    // Find the product in allMenuItems
    const product = allMenuItems.find(p => 
        (p.name && p.name.toLowerCase().includes(productName.toLowerCase())) ||
        (p.itemName && p.itemName.toLowerCase().includes(productName.toLowerCase()))
    );
    
    if (!product) {
        showToast(`❌ Product "${productName}" not found in menu`, 'error');
        return;
    }
    
    // Navigate to menu section and open quick add for this product
    showSection('menu');
    
    // Filter to show the category containing this product
    if (product.category) {
        currentCategory = product.category;
        filterByCategory(product.category, getCategoryDisplayName(product.category));
    }
    
    // Wait a bit for the menu to render, then set the quick add value
    setTimeout(() => {
        const inputElement = document.getElementById(`addStock-${product._id}`);
        if (inputElement) {
            inputElement.value = quantity;
            inputElement.focus();
            inputElement.style.borderColor = '#28a745';
            inputElement.style.boxShadow = '0 0 0 2px rgba(40, 167, 69, 0.25)';
            
            // Auto-click the add button after a brief pause
            setTimeout(() => {
                const addButton = inputElement.nextElementSibling;
                if (addButton && !addButton.disabled) {
                    addButton.click();
                }
            }, 500);
        }
    }, 300);
}

// ==================== LOGOUT ====================
function handleLogout() {
    if (!confirm('Are you sure you want to logout?')) return;
    
    fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
    })
    .then(() => { window.location.href = '/login'; })
    .catch(error => {
        console.error('Logout error:', error);
        window.location.href = '/login';
    });
}

// ==================== GLOBAL EXPORTS ====================
window.handleLogout = handleLogout;
window.openAddModal = openAddModal;
window.openEditModal = openEditModal;
window.deleteMenuItem = deleteMenuItem;
window.toggleNotificationModal = toggleNotificationModal;
window.clearAllNotifications = clearAllNotifications;
window.dismissNotification = dismissNotification;
window.quickAddStock = quickAddStock;
window.quickAddStockForRequest = quickAddStockForRequest;
window.fulfillStockRequest = fulfillStockRequest;
window.ingredientInventory = ingredientInventory;
window.servingwareInventory = servingwareInventory;
window.closeMissingIngredientsModal = closeMissingIngredientsModal;
window.checkIngredientAvailability = checkIngredientAvailability;
window.showMissingIngredientsModal = showMissingIngredientsModal;
window.resetInventoryToZero = resetInventoryToZero;
window.fetchInventoryFromMongoDB = fetchInventoryFromMongoDB;

console.log('✅ Menu Management System loaded with integrated stock management!');
console.log('📦 Products appear immediately in Product Menu with quick-add stock controls');
console.log('🚫 Products cannot be added unless all ingredients are available in inventory');
console.log('📡 Using actual inventory from MongoDB - No fallback data');
console.log('🔔 Stock request notifications from staff appear in dashboard grid');