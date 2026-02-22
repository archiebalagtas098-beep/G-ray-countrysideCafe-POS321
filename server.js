import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from 'url';
import http from 'http';
import mongoose from "mongoose";
import { connectDB } from "./config/database.js";
import { WebSocketServer } from "ws";

import User from "./models/User.js";
import Category from "./models/categoryModel.js";
import InventoryItem from "./models/InventoryItem.js";
import Product from "./models/Product.js";
import Order from "./models/Order.js";
import MenuItem from "./models/Menuitem.js";
import Customer from "./models/Customer.js";
import StockRequest from "./models/StockRequest.js";

import stockTransferRoute from "./routes/stockTransferroute.js";
import staffRoutes from "./routes/staffroute.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import mongoDBInventoryService from "./services/mongoDBInventoryService.js";
import revenueBreakdownService from "./services/revenueBreakdownService.js";
import notificationService from "./services/notificationService.js";

dotenv.config();

const BUSINESS_INFO = {
    name: "G'RAY COUNTRYSIDE CAFÉ",
    address: "IPO Road, Barangay Minuyan Proper",
    city: "City of San Jose Del Monte, Bulacan",
    receiptHeader: "BESTLINK COLLEGE OF THE PHILIPPINES",
    contact: "(+63) 123-456-7890",
    vatRegNo: "VAT-Reg-TIN: 123-456-789-000",
    permitNo: "BTRCP-2024-00123"
};

const verifyToken = (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        if (req.path.startsWith('/api/')) {
            return res.status(401).json({ 
                success: false, 
                message: "Access denied. No token provided." 
            });
        }
        return res.redirect('/login');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        if (req.path.startsWith('/api/')) {
            return res.status(401).json({ 
                success: false, 
                message: "Invalid token" 
            });
        }
        res.clearCookie("token");
        return res.redirect('/login');
    }
};

const verifyAdmin = (req, res, next) => {
    if (!req.user) {
        return res.redirect('/login');
    }
    
    if (req.user.role !== 'admin') {
        if (req.path.startsWith('/api/')) {
            return res.status(403).json({ 
                success: false, 
                message: "Access denied. Admin privileges required." 
            });
        }
        return res.redirect('/staffdashboard');
    }
    next();
};

const CONFIG = {
    LOW_STOCK_THRESHOLD: 5,
    JWT_EXPIRY: "365d",
    SERVER_PORT: process.env.PORT || 5050,
    REQUIRED_ENV_VARS: ['JWT_SECRET', 'MONGODB_URI']
};

CONFIG.REQUIRED_ENV_VARS.forEach(varName => {
    if (!process.env[varName]) {
        console.error(`❌ ERROR: ${varName} not defined in .env file`);
        process.exit(1);
    }
});

const recipeMapping = {
    'Pork': [
        'Korean Spicy Bulgogi (Pork)',
        'Korean Salt and Pepper (Pork)',
        'Crispy Pork Lechon Kawali',
        'Pork Shanghai',
        'Sinigang (Pork)',
        'Sizzling Pork Sisig',
        'Sizzling Liempo',
        'Sizzling Porkchop'
    ],
    'Pork belly': [
        'Crispy Pork Lechon Kawali',
        'Sizzling Liempo'
    ],
    'Chicken': [
        'Buttered Honey Chicken',
        'Buttered Spicy Chicken',
        'Chicken Adobo',
        'Fried Chicken',
        'Sizzling Fried Chicken',
        'Clubhouse Sandwich'
    ],
    'Fried chicken': [
        'Fried Chicken',
        'Budget Fried Chicken',
        'Fish and Fries'
    ],
    'Cream dory': [
        'Cream Dory Fish Fillet',
        'Fish and Fries'
    ],
    'Shrimp': [
        'Sinigang (Shrimp)',
        'Buttered Shrimp',
        'Special Bulalo'
    ],
    'Bagnet': [
        'Paknet (Pakbet w/ Bagnet)'
    ],
    'Tinapa': [
        'Tinapa Rice'
    ],
    'Tuyo': [
        'Tuyo Pesto'
    ],
    'Garlic': [
        'Korean Spicy Bulgogi (Pork)',
        'Korean Salt and Pepper (Pork)',
        'Crispy Pork Lechon Kawali',
        'Sizzling Pork Sisig',
        'Sizzling Liempo',
        'Sizzling Porkchop',
        'Sizzling Fried Chicken',
        'Pork Shanghai',
        'Chicken Adobo',
        'Sinigang (Pork)',
        'Sinigang (Shrimp)',
        'Paknet (Pakbet w/ Bagnet)',
        'Special Bulalo',
        'Pancit Bihon',
        'Pancit Canton + Bihon (Mixed)',
        'Spaghetti (Filipino Style)',
        'Fried Rice'
    ],
    'Onion': [
        'Korean Spicy Bulgogi (Pork)',
        'Korean Salt and Pepper (Pork)',
        'Crispy Pork Lechon Kawali',
        'Sizzling Pork Sisig',
        'Chicken Adobo',
        'Sinigang (Pork)',
        'Sinigang (Shrimp)',
        'Paknet (Pakbet w/ Bagnet)',
        'Special Bulalo',
        'Pancit Bihon',
        'Pancit Canton + Bihon (Mixed)',
        'Spaghetti (Filipino Style)',
        'Fried Rice',
        'Cheesy Nachos',
        'Nachos Supreme'
    ],
    'Chili': [
        'Korean Spicy Bulgogi (Pork)',
        'Korean Salt and Pepper (Pork)',
        'Sizzling Pork Sisig',
        'Sinigang (Pork)',
        'Sinigang (Shrimp)'
    ],
    'Calamansi': [
        'Sizzling Pork Sisig',
        'Sinigang (Pork)',
        'Sinigang (Shrimp)',
        'Buttered Shrimp',
        'Cucumber Lemonade',
        'Blue Lemonade'
    ],
    'Tomato': [
        'Chicken Adobo',
        'Sinigang (Pork)',
        'Sinigang (Shrimp)',
        'Paknet (Pakbet w/ Bagnet)',
        'Spaghetti (Filipino Style)'
    ],
    'Cucumber': [
        'Cucumber Lemonade',
        'Paknet (Pakbet w/ Bagnet)'
    ],
    'Corn': [
        'Special Bulalo',
        'Paknet (Pakbet w/ Bagnet)'
    ],
    'Potato': [
        'Special Bulalo',
        'Paknet (Pakbet w/ Bagnet)'
    ],
    'Carrots': [
        'Special Bulalo',
        'Paknet (Pakbet w/ Bagnet)',
        'Pancit Bihon',
        'Pancit Canton + Bihon (Mixed)'
    ],
    'Egg': [
        'Sizzling Pork Sisig',
        'Fried Rice',
        'Fried Chicken',
        'Budget Fried Chicken',
        'Cream Dory Fish Fillet'
    ],
    'Eggs': [
        'Sizzling Pork Sisig',
        'Fried Rice',
        'Fried Chicken',
        'Budget Fried Chicken',
        'Cream Dory Fish Fillet'
    ],
    'Butter': [
        'Buttered Honey Chicken',
        'Buttered Spicy Chicken',
        'Buttered Shrimp'
    ],
    'Mayonnaise': [
        'Sizzling Pork Sisig',
        'Clubhouse Sandwich'
    ],
    'Cream': [
        'Caramel Macchiato',
        'Cookies & Cream',
        'Strawberry & Cream',
        'Mango Cheesecake'
    ],
    'Cream cheese flavor': [
        'Mango Cheesecake'
    ],
    'Milk': [
        'Cafe Latte',
        'Caramel Macchiato',
        'Milk Tea',
        'Cookies & Cream',
        'Strawberry & Cream',
        'Mango Cheesecake',
        'Steamed milk'
    ],
    'Cheese': [
        'Cheesy Nachos',
        'Nachos Supreme',
        'Cheesy Dynamite Lumpia'
    ],
    'Gochujang': [
        'Korean Spicy Bulgogi (Pork)',
        'Korean Salt and Pepper (Pork)'
    ],
    'Sesame oil': [
        'Korean Spicy Bulgogi (Pork)',
        'Korean Salt and Pepper (Pork)',
        'Fried Rice'
    ],
    'Soy sauce': [
        'Korean Spicy Bulgogi (Pork)',
        'Korean Salt and Pepper (Pork)',
        'Chicken Adobo',
        'Sizzling Pork Sisig',
        'Pancit Bihon',
        'Pancit Canton + Bihon (Mixed)',
        'Spaghetti (Filipino Style)',
        'Fried Rice'
    ],
    'Oyster sauce': [
        'Sizzling Pork Sisig',
        'Pancit Bihon',
        'Pancit Canton + Bihon (Mixed)'
    ],
    'Shrimp paste': [
        'Sinigang (Pork)',
        'Sinigang (Shrimp)',
        'Tuyo Pesto'
    ],
    'Tamarind mix': [
        'Sinigang (Pork)',
        'Sinigang (Shrimp)'
    ],
    'Cooking oil': [
        'Korean Spicy Bulgogi (Pork)',
        'Korean Salt and Pepper (Pork)',
        'Crispy Pork Lechon Kawali',
        'Pork Shanghai',
        'Sizzling Pork Sisig',
        'Sizzling Liempo',
        'Sizzling Porkchop',
        'Sizzling Fried Chicken',
        'Fried Chicken',
        'Budget Fried Chicken',
        'Cream Dory Fish Fillet',
        'Fish and Fries',
        'French Fries',
        'Cheesy Dynamite Lumpia',
        'Lumpiang Shanghai',
        'Fried Rice',
        'Cheesy Nachos',
        'Nachos Supreme'
    ],
    'Salt': [
        'Korean Spicy Bulgogi (Pork)',
        'Korean Salt and Pepper (Pork)',
        'Crispy Pork Lechon Kawali',
        'Sizzling Pork Sisig',
        'Sizzling Liempo',
        'Sizzling Porkchop',
        'Sizzling Fried Chicken',
        'Fried Chicken',
        'Budget Fried Chicken',
        'Cream Dory Fish Fillet',
        'Fish and Fries',
        'French Fries',
        'Chicken Adobo',
        'Sinigang (Pork)',
        'Sinigang (Shrimp)',
        'Paknet (Pakbet w/ Bagnet)',
        'Buttered Shrimp',
        'Special Bulalo',
        'Fried Rice',
        'Plain Rice'
    ],
    'Black pepper': [
        'Korean Spicy Bulgogi (Pork)',
        'Korean Salt and Pepper (Pork)',
        'Sizzling Pork Sisig',
        'Sinigang (Pork)',
        'Sinigang (Shrimp)',
        'Paknet (Pakbet w/ Bagnet)',
        'Buttered Shrimp',
        'Fried Chicken',
        'Budget Fried Chicken'
    ],
    'Peppercorn': [
        'Korean Salt and Pepper (Pork)'
    ],
    'Cornstarch': [
        'Crispy Pork Lechon Kawali',
        'Pork Shanghai',
        'Lumpiang Shanghai',
        'Cheesy Dynamite Lumpia'
    ],
    'Bay leaves': [
        'Chicken Adobo',
        'Sinigang (Pork)',
        'Sinigang (Shrimp)',
        'Special Bulalo'
    ],
    'Honey': [
        'Buttered Honey Chicken',
        'Cucumber Lemonade',
        'Blue Lemonade',
        'Red Tea'
    ],
    'Sugar': [
        'Cucumber Lemonade',
        'Blue Lemonade',
        'Red Tea',
        'Cafe Latte',
        'Cafe Americano',
        'Caramel Macchiato',
        'Milk Tea',
        'Matcha Green Tea',
        'Cookies & Cream',
        'Strawberry & Cream',
        'Mango Cheesecake',
        'Fried Rice'
    ],
    'Breadcrumbs': [
        'Pork Shanghai',
        'Lumpiang Shanghai',
        'Fried Chicken',
        'Budget Fried Chicken',
        'Cream Dory Fish Fillet'
    ],
    'Flour': [
        'Pork Shanghai',
        'Lumpiang Shanghai',
        'Fried Chicken',
        'Budget Fried Chicken',
        'Cream Dory Fish Fillet',
        'French Fries',
        'Fish and Fries'
    ],
    'Gravy': [
        'Clubhouse Sandwich'
    ],
    'Cheese sauce': [
        'Cheesy Nachos',
        'Nachos Supreme',
        'Cheesy Dynamite Lumpia'
    ],
    'Sweet tomato sauce': [
        'Spaghetti (Filipino Style)'
    ],
    'Vegetables': [
        'Special Bulalo',
        'Paknet (Pakbet w/ Bagnet)'
    ],
    'Water': [
        'Special Bulalo',
        'Sinigang (Pork)',
        'Sinigang (Shrimp)',
        'Fried Rice'
    ],
    'Pancit canton': [
        'Pancit Canton + Bihon (Mixed)'
    ],
    'Rice noodles': [
        'Pancit Bihon',
        'Pancit Canton + Bihon (Mixed)'
    ],
    'Spaghetti pasta': [
        'Spaghetti (Filipino Style)'
    ],
    'Rice': [
        'Korean Spicy Bulgogi (Pork)',
        'Korean Salt and Pepper (Pork)',
        'Crispy Pork Lechon Kawali',
        'Cream Dory Fish Fillet',
        'Buttered Honey Chicken',
        'Buttered Spicy Chicken',
        'Chicken Adobo',
        'Pork Shanghai',
        'Sizzling Pork Sisig',
        'Sizzling Liempo',
        'Sizzling Porkchop',
        'Sizzling Fried Chicken',
        'Fried Chicken',
        'Budget Fried Chicken',
        'Tinapa Rice',
        'Tuyo Pesto',
        'Fried Rice',
        'Plain Rice',
        'Sinigang (Pork)',
        'Sinigang (Shrimp)',
        'Paknet (Pakbet w/ Bagnet)',
        'Buttered Shrimp',
        'Special Bulalo'
    ],
    'Lemon juice': [
        'Cucumber Lemonade',
        'Blue Lemonade'
    ],
    'Blue syrup': [
        'Blue Lemonade'
    ],
    'Tea': [
        'Red Tea',
        'Milk Tea',
        'Matcha Green Tea'
    ],
    'Black tea': [
        'Red Tea'
    ],
    'Espresso': [
        'Cafe Americano',
        'Cafe Latte',
        'Caramel Macchiato'
    ],
    'Hot water': [
        'Cafe Americano',
        'Red Tea'
    ],
    'Steamed milk': [
        'Cafe Latte',
        'Caramel Macchiato'
    ],
    'Carbonated soft drink': [
        'Soda'
    ],
    'Chicken broth': [
        'Special Bulalo'
    ],
    'Coffee beans': [
        'Cafe Americano',
        'Cafe Latte',
        'Caramel Macchiato'
    ],
    'Matcha powder': [
        'Matcha Green Tea'
    ],
    'Caramel syrup': [
        'Caramel Macchiato'
    ],
    'Vanilla syrup': [
        'Cafe Latte'
    ],
    'Strawberry syrup': [
        'Strawberry & Cream'
    ],
    'Mango flavor': [
        'Mango Cheesecake'
    ],
    'Tapioca pearls': [
        'Milk Tea',
        'Matcha Green Tea',
        'Cookies & Cream',
        'Strawberry & Cream',
        'Mango Cheesecake'
    ],
    'Cookie crumbs': [
        'Cookies & Cream'
    ],
    'Nacho chips': [
        'Cheesy Nachos',
        'Nachos Supreme'
    ],
    'Lumpiang wrapper': [
        'Lumpiang Shanghai',
        'Cheesy Dynamite Lumpia'
    ],
    'French fries': [
        'French Fries',
        'Fish and Fries'
    ],
    'Bread': [
        'Clubhouse Sandwich'
    ],
    'Paper cups': [
        'Cucumber Lemonade',
        'Blue Lemonade',
        'Red Tea',
        'Cafe Americano',
        'Cafe Latte',
        'Caramel Macchiato',
        'Milk Tea',
        'Matcha Green Tea',
        'Cookies & Cream',
        'Strawberry & Cream',
        'Mango Cheesecake',
        'Soda'
    ],
    'Straws': [
        'Cucumber Lemonade',
        'Blue Lemonade',
        'Red Tea',
        'Milk Tea',
        'Matcha Green Tea',
        'Cookies & Cream',
        'Strawberry & Cream',
        'Mango Cheesecake',
        'Soda'
    ],
    'Napkins': [
        'Korean Spicy Bulgogi (Pork)',
        'Korean Salt and Pepper (Pork)',
        'Crispy Pork Lechon Kawali',
        'Cream Dory Fish Fillet',
        'Buttered Honey Chicken',
        'Buttered Spicy Chicken',
        'Chicken Adobo',
        'Pork Shanghai',
        'Sizzling Pork Sisig',
        'Sizzling Liempo',
        'Sizzling Porkchop',
        'Sizzling Fried Chicken',
        'Fried Chicken',
        'Budget Fried Chicken',
        'Cheesy Nachos',
        'Nachos Supreme',
        'French Fries',
        'Clubhouse Sandwich',
        'Fish and Fries',
        'Cheesy Dynamite Lumpia',
        'Lumpiang Shanghai',
        'Tinapa Rice',
        'Tuyo Pesto',
        'Sinigang (Pork)',
        'Sinigang (Shrimp)',
        'Paknet (Pakbet w/ Bagnet)',
        'Buttered Shrimp',
        'Special Bulalo'
    ],
    'Food containers': [
        'Korean Spicy Bulgogi (Pork)',
        'Korean Salt and Pepper (Pork)',
        'Crispy Pork Lechon Kawali',
        'Cream Dory Fish Fillet',
        'Buttered Honey Chicken',
        'Buttered Spicy Chicken',
        'Chicken Adobo',
        'Pork Shanghai',
        'Sizzling Pork Sisig',
        'Sizzling Liempo',
        'Sizzling Porkchop',
        'Sizzling Fried Chicken',
        'Fried Chicken',
        'Budget Fried Chicken',
        'Pancit Bihon',
        'Pancit Canton + Bihon (Mixed)',
        'Spaghetti (Filipino Style)',
        'Cheesy Nachos',
        'Nachos Supreme',
        'French Fries',
        'Clubhouse Sandwich',
        'Fish and Fries',
        'Cheesy Dynamite Lumpia',
        'Lumpiang Shanghai',
        'Fried Rice',
        'Plain Rice',
        'Tinapa Rice',
        'Tuyo Pesto',
        'Sinigang (Pork)',
        'Sinigang (Shrimp)',
        'Paknet (Pakbet w/ Bagnet)',
        'Buttered Shrimp',
        'Special Bulalo'
    ],
    
    // 🆕 MENU ITEM ALIASES (for items with size/variant suffixes)
    'Blue Lemonade (Glass)': [
        'Lemon juice',
        'Blue syrup',
        'Paper cups',
        'Straws'
    ],
    'Pancit Bihon (L)': [
        'Garlic',
        'Onion',
        'Carrot',
        'Rice noodles',
        'Soy sauce',
        'Oyster sauce',
        'Cooking oil',
        'Salt',
        'Black pepper'
    ],
    'Matcha Green Tea HC': [
        'Matcha powder',
        'Tea',
        'Tapioca pearls',
        'Milk',
        'Sugar',
        'Paper cups',
        'Straws'
    ]
};

const reverseRecipeMapping = {};
for (const [ingredient, dishes] of Object.entries(recipeMapping)) {
    for (const dish of dishes) {
        if (!reverseRecipeMapping[dish]) {
            reverseRecipeMapping[dish] = [];
        }
        if (!reverseRecipeMapping[dish].includes(ingredient)) {
            reverseRecipeMapping[dish].push(ingredient);
        }
    }
}

class HelperFunctions {
    static generateCustomerId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let id = 'CUST-';
        for (let i = 0; i < 6; i++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return id;
    }

    static generateOrderNumber(orderCount) {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
        return `ORD-${dateStr}-${(orderCount + 1).toString().padStart(4, '0')}`;
    }

    static formatDate(date) {
        return new Date(date).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    static getTodayDateRange() {
        // Philippine Time is UTC+8
        // Get current UTC time, add 8 hours to get PHT
        const now = new Date();
        const phtOffset = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
        const phtNow = new Date(now.getTime() + phtOffset);
        
        // Get year, month, day in UTC (which represents PHT after offset)
        const year = phtNow.getUTCFullYear();
        const month = phtNow.getUTCMonth();
        const date = phtNow.getUTCDate();
        
        // Create date range in UTC representing PHT dates
        // 00:00 PHT = UTC-8 hours
        // 23:59 PHT = UTC-8 hours + 23:59
        const startOfDay = new Date(Date.UTC(year, month, date, 0, 0, 0, 0));
        const endOfDay = new Date(Date.UTC(year, month, date, 23, 59, 59, 999));
        
        const phtDisplay = startOfDay.toLocaleString('en-PH', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZone: 'Asia/Manila'
        });
        
        console.log(`⏰ Date Range (PHT): ${phtDisplay} to ${endOfDay.toLocaleString('en-PH', { 
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZone: 'Asia/Manila'
        })}`);
        console.log(`   UTC: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);
        
        return { startOfDay, endOfDay };
    }

    static generateReceipt(order, customer = null) {
        const orderTime = new Date(order.createdAt || new Date());
        const receiptId = order.orderNumber || `ORD-${Date.now()}`;
        
        return {
            businessName: BUSINESS_INFO.name,
            address: BUSINESS_INFO.address,
            city: BUSINESS_INFO.city,
            header: BUSINESS_INFO.receiptHeader,
            receiptNo: receiptId,
            date: orderTime.toLocaleDateString('en-PH'),
            time: orderTime.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
            customerId: customer ? customer.customerId : 'Walk-in',
            items: order.items || [],
            subtotal: order.subtotal || 0,
            tax: order.tax || 0,
            total: order.total || 0,
            paymentMethod: order.payment?.method || 'cash',
            amountPaid: order.payment?.amountPaid || 0,
            change: order.payment?.change || 0,
            cashier: order.cashier || 'System',
            footer: "Thank you for visiting G'RAY COUNTRYSIDE CAFÉ!",
            permitNo: BUSINESS_INFO.permitNo,
            vatRegNo: BUSINESS_INFO.vatRegNo
        };
    }

    static calculateVAT(subtotal) {
        const vatRate = 0.12;
        const vat = subtotal * vatRate;
        const net = subtotal - vat;
        return { vat, net };
    }
}

class RecipeManager {
    static async checkProductAvailability(productName) {
        try {
            const requiredIngredients = reverseRecipeMapping[productName];
            if (!requiredIngredients || requiredIngredients.length === 0) {
                return { 
                    available: true, 
                    reason: 'No recipe constraints',
                    requiredIngredients: [] 
                };
            }
            
            let allAvailable = true;
            const missingIngredients = [];
            const availableIngredients = [];
            
            for (const ingredient of requiredIngredients) {
                const inventoryItem = await InventoryItem.findOne({
                    itemName: { $regex: new RegExp(`^${ingredient}$`, 'i') },
                    itemType: 'raw',
                    isActive: true
                });
                
                if (!inventoryItem) {
                    allAvailable = false;
                    missingIngredients.push(`${ingredient} (not found in inventory)`);
                } else if (inventoryItem.currentStock <= 0) {
                    allAvailable = false;
                    missingIngredients.push(`${ingredient} (out of stock)`);
                } else {
                    availableIngredients.push({
                        ingredient,
                        currentStock: inventoryItem.currentStock,
                        minStock: inventoryItem.minStock
                    });
                }
            }
            
            return {
                available: allAvailable,
                missingIngredients,
                requiredIngredients,
                availableIngredients
            };
        } catch (error) {
            console.error('Error checking product availability:', error);
            return { 
                available: false, 
                error: error.message,
                requiredIngredients: [] 
            };
        }
    }

    static async updateRelatedMenuItems(rawIngredientName) {
        try {
            const possibleDishes = recipeMapping[rawIngredientName];
            if (!possibleDishes || possibleDishes.length === 0) return;
            
            for (const dish of possibleDishes) {
                const menuItem = await MenuItem.findOne({
                    itemName: { $regex: new RegExp(`^${dish}$`, 'i') }
                });
                
                if (menuItem) {
                    const availability = await this.checkProductAvailability(dish);
                    
                    if (availability.available && menuItem.status === 'out_of_stock') {
                        menuItem.status = 'available';
                        menuItem.updatedAt = new Date();
                        menuItem.requiredIngredients = availability.requiredIngredients || [];
                        await menuItem.save();
                        
                        const product = await Product.findOne({
                            itemName: { $regex: new RegExp(`^${dish}$`, 'i') }
                        });
                        
                        if (product) {
                            product.status = 'available';
                            await product.save();
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error updating related menu items:', error);
        }
    }

    static async checkAffectedMenuItems(rawIngredientName) {
        try {
            const possibleDishes = recipeMapping[rawIngredientName];
            if (!possibleDishes || possibleDishes.length === 0) return;
            
            const inventoryItem = await InventoryItem.findOne({
                itemName: { $regex: new RegExp(`^${rawIngredientName}$`, 'i') },
                itemType: 'raw'
            });
            
            if (!inventoryItem || inventoryItem.currentStock <= 0) {
                for (const dish of possibleDishes) {
                    const availability = await this.checkProductAvailability(dish);
                    
                    if (!availability.available) {
                        await MenuItem.findOneAndUpdate(
                            { itemName: { $regex: new RegExp(`^${dish}$`, 'i') } },
                            { 
                                status: 'out_of_stock',
                                updatedAt: new Date()
                            }
                        );
                        
                        await Product.findOneAndUpdate(
                            { itemName: { $regex: new RegExp(`^${dish}$`, 'i') } },
                            { status: 'out_of_stock' }
                        );
                    }
                }
            }
        } catch (error) {
            console.error('Error checking affected menu items:', error);
        }
    }

    static async getRecipeDetails(dishName) {
        try {
            const requiredIngredients = reverseRecipeMapping[dishName] || [];
            const ingredientDetails = [];
            
            for (const ingredient of requiredIngredients) {
                const inventoryItem = await InventoryItem.findOne({
                    itemName: { $regex: new RegExp(`^${ingredient}$`, 'i') },
                    itemType: 'raw'
                });
                
                ingredientDetails.push({
                    ingredient,
                    available: inventoryItem ? inventoryItem.currentStock > 0 : false,
                    currentStock: inventoryItem ? inventoryItem.currentStock : 0,
                    minStock: inventoryItem ? inventoryItem.minStock : 0,
                    unit: inventoryItem ? inventoryItem.unit : 'unit'
                });
            }
            
            return {
                dishName,
                requiredIngredients: ingredientDetails,
                totalIngredients: requiredIngredients.length,
                availableIngredients: ingredientDetails.filter(i => i.available).length
            };
        } catch (error) {
            console.error('Error getting recipe details:', error);
            return {
                dishName,
                requiredIngredients: [],
                totalIngredients: 0,
                availableIngredients: 0,
                error: error.message
            };
        }
    }
}

class DashboardStats {
    static async getStats() {
        try {
            console.log('📊 Calculating dashboard statistics...');
            const { startOfDay, endOfDay } = HelperFunctions.getTodayDateRange();
            
            const totalOrders = await Order.countDocuments({ status: 'completed' });
            console.log(`📦 Total Orders: ${totalOrders}`);
            
            const todaysOrders = await Order.countDocuments({ 
                status: 'completed',
                createdAt: { $gte: startOfDay, $lte: endOfDay }
            });
            console.log(`📦 Today's Orders: ${todaysOrders}`);
            
            const totalCustomers = await Customer.countDocuments();
            console.log(`👥 Total Customers: ${totalCustomers}`);
            
            const totalMenuItems = await MenuItem.countDocuments({ isActive: true });
            const availableMenuItems = await MenuItem.countDocuments({ 
                status: 'available', 
                isActive: true 
            });
            console.log(`🍽️ Total Menu Items: ${totalMenuItems}, Available: ${availableMenuItems}`);
            
            const totalInventoryItems = await InventoryItem.countDocuments();
            const inventoryLowStock = await InventoryItem.countDocuments({ 
                currentStock: { $gt: 0, $lt: CONFIG.LOW_STOCK_THRESHOLD }, 
                isActive: true 
            });
            const inventoryOutOfStock = await InventoryItem.countDocuments({ 
                currentStock: 0, 
                isActive: true 
            });
            console.log(`📦 Total Inventory: ${totalInventoryItems}, Low Stock: ${inventoryLowStock}, Out of Stock: ${inventoryOutOfStock}`);
            
            const topSellingProducts = await Order.aggregate([
                { $unwind: '$items' },
                { $group: { 
                    _id: { 
                        $cond: [
                            { $and: [
                                { $ne: ['$items.itemName', null] },
                                { $ne: ['$items.itemName', ''] }
                            ]},
                            '$items.itemName',
                            { $cond: [
                                { $and: [
                                    { $ne: ['$items.name', null] },
                                    { $ne: ['$items.name', ''] }
                                ]},
                                '$items.name',
                                null
                            ]}
                        ]
                    },
                    totalQuantity: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
                }},
                { 
                    $match: { 
                        _id: { 
                            $ne: null, 
                            $ne: ''
                        }
                    }
                },
                { $sort: { totalQuantity: -1 } },
                { $limit: 10 }
            ]);
            console.log(`🔝 Top Selling Products from MongoDB: ${topSellingProducts.length} items`);
            if (topSellingProducts.length === 0) {
                console.log('⚠️ NO PRODUCTS FOUND - checking raw orders...');
                const sampleOrders = await Order.find().select('items').limit(3).lean();
                console.log('📦 Sample orders:', JSON.stringify(sampleOrders, null, 2));
            }
            topSellingProducts.forEach((item, idx) => {
                console.log(`   [${idx + 1}] ${item._id}: ${item.totalQuantity} units = ₱${item.totalRevenue.toFixed(2)}`);
            });
            
            const totalRevenueResult = await Order.aggregate([
                { $match: { status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$total' } } }
            ]);
            const totalRevenue = totalRevenueResult[0]?.total || 0;
            console.log(`💰 Total Revenue: ₱${totalRevenue.toFixed(2)}`);
            
            const todaysRevenueResult = await Order.aggregate([
                { 
                    $match: { 
                        status: 'completed',
                        createdAt: { $gte: startOfDay, $lte: endOfDay }
                    } 
                },
                { $group: { _id: null, total: { $sum: '$total' } } }
            ]);
            const todaysRevenue = todaysRevenueResult[0]?.total || 0;
            console.log(`💰 Today's Revenue: ₱${todaysRevenue.toFixed(2)}`);
            
            const { vat: todaysVAT } = HelperFunctions.calculateVAT(todaysRevenue);
            const { vat: totalVAT } = HelperFunctions.calculateVAT(totalRevenue);
            
            const stats = {
                totalOrders,
                todaysOrders,
                totalCustomers,
                totalMenuItems,
                availableMenuItems,
                outOfStockMenuItems: totalMenuItems - availableMenuItems,
                totalInventoryItems,
                inventoryLowStock,
                inventoryOutOfStock,
                totalRevenue,
                todaysRevenue,
                totalVAT,
                todaysVAT,
                topSellingProducts,
                businessName: BUSINESS_INFO.name
            };
            
            console.log('✅ Statistics calculation complete:', {
                totalOrders,
                todaysOrders,
                totalCustomers,
                totalRevenue: `₱${totalRevenue.toFixed(2)}`,
                todaysRevenue: `₱${todaysRevenue.toFixed(2)}`
            });
            return stats;
            
        } catch (error) {
            console.error('❌ Error getting dashboard stats:', error);
            return this.getDefaultStats();
        }
    }

    static getDefaultStats() {
        return {
            totalOrders: 0,
            todaysOrders: 0,
            totalCustomers: 0,
            totalMenuItems: 0,
            availableMenuItems: 0,
            outOfStockMenuItems: 0,
            totalInventoryItems: 0,
            inventoryLowStock: 0,
            inventoryOutOfStock: 0,
            totalRevenue: 0,
            todaysRevenue: 0,
            totalVAT: 0,
            todaysVAT: 0,
            topSellingProducts: [],
            businessName: BUSINESS_INFO.name
        };
    }
}

class RealTimeManager {
    static adminClients = new Set();
    static staffClients = new Set();

    static addAdminClient(client) {
        this.adminClients.add(client);
    }

    static addStaffClient(client) {
        this.staffClients.add(client);
    }

    static removeAdminClient(client) {
        this.adminClients.delete(client);
    }

    static removeStaffClient(client) {
        this.staffClients.delete(client);
    }

    static broadcastToAdmins(data) {
        if (this.adminClients.size === 0) return;
        
        const eventData = `data: ${JSON.stringify(data)}\n\n`;
        
        this.adminClients.forEach(client => {
            try {
                client.res.write(eventData);
                if (client.res.flush) {
                    client.res.flush();
                }
            } catch (error) {
                this.adminClients.delete(client);
            }
        });
    }

    static broadcastToStaff(data) {
        if (this.staffClients.size === 0) return;
        
        const eventData = `data: ${JSON.stringify(data)}\n\n`;
        
        this.staffClients.forEach(client => {
            try {
                client.res.write(eventData);
                if (client.res.flush) {
                    client.res.flush();
                }
            } catch (error) {
                this.staffClients.delete(client);
            }
        });
    }

    static sendOrderNotification(order) {
        const notification = {
            type: 'new_order',
            data: {
                id: order._id.toString(),
                orderNumber: order.orderNumber || `ORD-${Date.now()}`,
                total: order.total || 0,
                type: order.type || 'Dine In',
                paymentMethod: order.payment?.method || 'cash',
                timestamp: new Date().toLocaleTimeString('en-PH'),
                items: order.items?.length || 0,
                createdAt: order.createdAt || new Date(),
                customerId: order.customerId || null
            },
            message: `New order #${order.orderNumber} received!`
        };
        
        this.broadcastToAdmins(notification);
        this.broadcastToStaff(notification);
    }

    static async sendLowStockAlert(inventoryItem) {
        const lowStockCount = await InventoryItem.countDocuments({
            currentStock: { $lt: CONFIG.LOW_STOCK_THRESHOLD, $gte: 1 },
            isActive: true
        });

        this.broadcastToAdmins({
            type: 'low_stock_alert',
            data: {
                inventoryItemId: inventoryItem._id,
                itemName: inventoryItem.itemName,
                currentStock: inventoryItem.currentStock,
                minStock: inventoryItem.minStock,
                lowStockCount
            },
            message: `Low stock alert: ${inventoryItem.itemName} has only ${inventoryItem.currentStock} left!`
        });
    }

    static sendOutOfStockAlert(productData) {
        this.broadcastToAdmins({
            type: 'out_of_stock_alert',
            data: {
                productId: productData.productId,
                productName: productData.productName,
                category: productData.category,
                previousStock: productData.previousStock,
                timestamp: productData.timestamp
            },
            message: `🚨 OUT OF STOCK: ${productData.productName} is now completely out of stock! Please restock immediately.`,
            severity: 'critical'
        });
    }

    static async sendStatsUpdate() {
        try {
            const stats = await DashboardStats.getStats();
            
            this.broadcastToAdmins({
                type: 'stats_update',
                data: stats,
                message: 'Dashboard stats updated'
            });
            
            return stats;
        } catch (error) {
            console.error('Error sending stats update:', error);
            return null;
        }
    }
}

const initializeDatabase = async () => {
    try {
        const adminExists = await User.findOne({ username: 'admin' });
        if (!adminExists) {
            const hashedPassword = bcrypt.hashSync('admin123', 10);
            await User.create({
                username: 'admin',
                password: hashedPassword,
                role: 'admin',
                status: 'active',
                name: 'Administrator',
                email: 'admin@graycafe.com',
                phone: '+631234567890'
            });
        }
        
        const categoryCount = await Category.countDocuments();
        if (categoryCount === 0) {
            const defaultCategories = [
                { name: 'Rice Bowl Meals' },
                { name: 'Hot Sizzlers' },
                { name: 'Party Tray' },
                { name: 'Drinks' },
                { name: 'Coffee' },
                { name: 'Milk Tea' },
                { name: 'Frappe' },
                { name: 'Snacks & Appetizer' },
                { name: 'Budget Meals Served with Rice' },
                { name: 'Specialties' }
            ];
            await Category.insertMany(defaultCategories);
        }
        
        await MenuItem.deleteMany({
            $or: [
                { itemName: null },
                { itemName: '' },
                { itemName: undefined },
                { name: null },
                { name: '' },
                { name: undefined }
            ]
        });

    } catch (error) {
        console.error('Database initialization error:', error);
    }
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

await connectDB();
await initializeDatabase();

await mongoDBInventoryService.initialize();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use('/images', express.static(path.join(__dirname, "images")));

// ==================== FAVICON HANDLER ====================
app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'favicon.ico'));
});

app.set("view engine", "ejs");
app.set('views', path.join(__dirname, 'views'));

app.use('/api/stock-transfers', stockTransferRoute);
app.use('/api/staff', staffRoutes);

app.use('/api/stock-transfers', verifyToken);
app.use('/api/staff', verifyToken);

app.get('/api/menu', verifyToken, async (req, res) => {
    try {
        console.log('📋 API: Fetching all menu items with inventory check...');
        const menuItems = await MenuItem.find({}).lean();
        
        const formattedItems = await Promise.all(menuItems.map(async (item) => {
            const availability = await RecipeManager.checkProductAvailability(item.itemName || item.name);
            const currentStock = item.currentStock || 0;
            
            return {
                _id: item._id,
                itemId: item._id.toString(),
                name: item.itemName || item.name,
                itemName: item.itemName || item.name,
                category: item.category,
                price: item.price,
                currentStock: currentStock,
                minStock: item.minStock || 0,
                maxStock: item.maxStock || 0,
                unit: item.unit,
                image: item.image,
                isActive: item.isActive !== false && availability.available && currentStock > 0,
                status: (availability.available && currentStock > 0) ? 'available' : 'out_of_stock',
                itemType: item.itemType || 'finished',
                requiredIngredients: availability.requiredIngredients || [],
                missingIngredients: availability.missingIngredients || [],
                availableIngredients: availability.availableIngredients || []
            };
        }));
        
        const availableCount = formattedItems.filter(i => i.status === 'available').length;
        const outOfStockCount = formattedItems.filter(i => i.status === 'out_of_stock').length;
        
        console.log(`✅ Menu items loaded: ${availableCount} available, ${outOfStockCount} out of stock`);
        
        res.json({
            success: true,
            data: formattedItems,
            stats: {
                total: formattedItems.length,
                available: availableCount,
                outOfStock: outOfStockCount
            }
        });
    } catch (error) {
        console.error('❌ Error fetching menu items:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching menu items',
            error: error.message
        });
    }
});

app.get('/api/menu/:itemId', verifyToken, async (req, res) => {
    try {
        console.log(`📋 API: Fetching menu item ${req.params.itemId}...`);
        const menuItem = await MenuItem.findById(req.params.itemId).lean();
        
        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found'
            });
        }
        
        const availability = await RecipeManager.checkProductAvailability(menuItem.itemName || menuItem.name);
        
        const formatted = {
            _id: menuItem._id,
            itemId: menuItem._id.toString(),
            name: menuItem.itemName || menuItem.name,
            itemName: menuItem.itemName || menuItem.name,
            category: menuItem.category,
            price: menuItem.price,
            currentStock: menuItem.currentStock || 0,
            minStock: menuItem.minStock || 0,
            maxStock: menuItem.maxStock || 0,
            unit: menuItem.unit,
            image: menuItem.image,
            isActive: menuItem.isActive !== false && availability.available,
            status: availability.available ? 'available' : 'out_of_stock',
            itemType: menuItem.itemType || 'finished',
            requiredIngredients: availability.requiredIngredients || [],
            missingIngredients: availability.missingIngredients || []
        };
        
        res.json({
            success: true,
            data: formatted
        });
    } catch (error) {
        console.error('❌ Error fetching menu item:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching menu item',
            error: error.message
        });
    }
});

app.get('/api/menu/:itemName/availability', verifyToken, async (req, res) => {
    try {
        const itemName = decodeURIComponent(req.params.itemName);
        console.log(`📋 API: Checking availability for "${itemName}"...`);
        
        const availability = await RecipeManager.checkProductAvailability(itemName);
        
        res.json({
            success: true,
            itemName: itemName,
            available: availability.available,
            requiredIngredients: availability.requiredIngredients || [],
            missingIngredients: availability.missingIngredients || [],
            availableIngredients: availability.availableIngredients || []
        });
    } catch (error) {
        console.error('❌ Error checking menu item availability:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking availability',
            error: error.message
        });
    }
});

app.post('/api/menu', verifyToken, verifyAdmin, async (req, res) => {
    try {
        console.log('✏️ API: Creating new menu item...', JSON.stringify(req.body, null, 2));
        
        const { name, itemName, category, price, unit, currentStock, minStock, maxStock, image, isActive, itemType } = req.body;
        
        if (!name && !itemName) {
            console.error('❌ Validation failed: Item name is required');
            return res.status(400).json({
                success: false,
                message: 'Item name is required'
            });
        }
        
        if (!category) {
            console.error('❌ Validation failed: Category is required');
            return res.status(400).json({
                success: false,
                message: 'Category is required'
            });
        }
        
        const parsedPrice = Number(price);
        if (isNaN(parsedPrice) || parsedPrice <= 0) {
            console.error('❌ Validation failed: Valid price is required, got:', price);
            return res.status(400).json({
                success: false,
                message: 'Valid price is required'
            });
        }
        
        const parsedCurrentStock = Number(currentStock) || 0;
        const parsedMinStock = Number(minStock) || 0;
        const parsedMaxStock = Number(maxStock) || 100;
        
        if (isNaN(parsedCurrentStock) || isNaN(parsedMinStock) || isNaN(parsedMaxStock)) {
            console.error('❌ Validation failed: Invalid stock numbers');
            return res.status(400).json({
                success: false,
                message: 'Invalid stock values'
            });
        }
        
        const menuItem = new MenuItem({
            itemName: name || itemName,
            name: name || itemName,
            category,
            price: parsedPrice,
            unit: unit || 'piece',
            currentStock: parsedCurrentStock,
            minStock: parsedMinStock,
            maxStock: parsedMaxStock,
            image: image || 'default_food.jpg',
            isActive: isActive !== false,
            itemType: itemType || 'finished'
        });
        
        console.log('📝 MenuItem object created, saving to database...');
        
        try {
            await menuItem.save();
            console.log(`✅ Menu item saved successfully: ${menuItem._id}`);
        } catch (saveError) {
            console.error('❌ Mongoose save error:', saveError.message);
            console.error('❌ Validation errors:', saveError.errors || 'No validation errors');
            throw saveError;
        }
        
        const formatted = {
            _id: menuItem._id,
            itemId: menuItem._id.toString(),
            name: menuItem.itemName,
            itemName: menuItem.itemName,
            category: menuItem.category,
            price: menuItem.price,
            currentStock: menuItem.currentStock,
            minStock: menuItem.minStock,
            maxStock: menuItem.maxStock,
            unit: menuItem.unit,
            image: menuItem.image,
            isActive: menuItem.isActive,
            itemType: menuItem.itemType
        };
        
        console.log(`✅ Menu item created: ${menuItem._id}`);
        
        RealTimeManager.broadcastToAdmins({
            type: 'menu_update',
            action: 'created',
            item: formatted
        });
        
        res.status(201).json({
            success: true,
            message: 'Menu item created successfully',
            data: formatted
        });
    } catch (error) {
        console.error('❌ Error creating menu item:', error.message);
        console.error('❌ Full error object:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
            errors: error.errors ? Object.keys(error.errors) : 'no validation errors'
        });
        res.status(500).json({
            success: false,
            message: 'Error creating menu item',
            error: error.message,
            errorName: error.name
        });
    }
});

app.put('/api/menu/:itemId', verifyToken, verifyAdmin, async (req, res) => {
    try {
        console.log(`✏️ API: Updating menu item ${req.params.itemId}...`, JSON.stringify(req.body, null, 2));
        
        const itemId = req.params.itemId;
        
        if (itemId.startsWith('fallback_')) {
            console.log(`⏭️ Skipping fallback item (not in MongoDB): ${itemId}`);
            return res.status(200).json({
                success: true,
                message: 'Fallback item - skipped',
                data: { _id: itemId }
            });
        }
        
        const { name, itemName, category, price, unit, currentStock, minStock, maxStock, image, isActive, itemType } = req.body;
        
        const parsedPrice = Number(price);
        if (isNaN(parsedPrice) || parsedPrice <= 0) {
            console.error('❌ Validation failed: Valid price is required');
            return res.status(400).json({
                success: false,
                message: 'Valid price is required'
            });
        }
        
        const parsedCurrentStock = Number(currentStock) || 0;
        const parsedMinStock = Number(minStock) || 0;
        const parsedMaxStock = Number(maxStock) || 100;
        
        if (!itemId.match(/^[0-9a-fA-F]{24}$/)) {
            console.error(`❌ Invalid MongoDB ID: ${itemId}`);
            return res.status(400).json({
                success: false,
                message: 'Invalid menu item ID'
            });
        }
        
        const menuItem = await MenuItem.findByIdAndUpdate(
            itemId,
            {
                itemName: name || itemName,
                name: name || itemName,
                category,
                price: parsedPrice,
                unit: unit || 'piece',
                currentStock: parsedCurrentStock,
                minStock: parsedMinStock,
                maxStock: parsedMaxStock,
                image: image || 'default_food.jpg',
                isActive: isActive !== false,
                itemType: itemType || 'finished'
            },
            { new: true, runValidators: true }
        );
        
        if (!menuItem) {
            console.warn(`⚠️ Menu item not found: ${itemId}`);
            return res.status(404).json({
                success: false,
                message: 'Menu item not found'
            });
        }
        
        console.log(`✅ Menu item updated successfully`);
        
        const formatted = {
            _id: menuItem._id,
            itemId: menuItem._id.toString(),
            name: menuItem.itemName,
            itemName: menuItem.itemName,
            category: menuItem.category,
            price: menuItem.price,
            currentStock: menuItem.currentStock,
            minStock: menuItem.minStock,
            maxStock: menuItem.maxStock,
            unit: menuItem.unit,
            image: menuItem.image,
            isActive: menuItem.isActive,
            itemType: menuItem.itemType
        };
        
        console.log(`✅ Menu item updated: ${menuItem._id}`);
        
        RealTimeManager.broadcastToAdmins({
            type: 'menu_update',
            action: 'updated',
            item: formatted
        });
        
        res.json({
            success: true,
            message: 'Menu item updated successfully',
            data: formatted
        });
    } catch (error) {
        console.error('❌ Error updating menu item:', error.message);
        console.error('❌ Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Error updating menu item',
            error: error.message
        });
    }
});

app.delete('/api/menu/:itemId', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const itemId = req.params.itemId;
        console.log(`🗑️ API: Deleting menu item ${itemId}...`);
        
        if (itemId.startsWith('fallback_')) {
            console.log(`⏭️ Skipping fallback item deletion (not in MongoDB): ${itemId}`);
            return res.status(200).json({
                success: true,
                message: 'Fallback item - skipped',
                data: { _id: itemId }
            });
        }
        
        if (!itemId.match(/^[0-9a-fA-F]{24}$/)) {
            console.error(`❌ Invalid MongoDB ID: ${itemId}`);
            return res.status(400).json({
                success: false,
                message: 'Invalid menu item ID'
            });
        }
        
        const menuItem = await MenuItem.findByIdAndDelete(itemId);
        
        if (!menuItem) {
            console.warn(`⚠️ Menu item not found: ${itemId}`);
            return res.status(404).json({
                success: false,
                message: 'Menu item not found'
            });
        }
        
        console.log(`✅ Menu item deleted: ${itemId}`);
        
        RealTimeManager.broadcastToAdmins({
            type: 'menu_update',
            action: 'deleted',
            itemId: itemId
        });
        
        res.json({
            success: true,
            message: 'Menu item deleted successfully'
        });
    } catch (error) {
        console.error('❌ Error deleting menu item:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting menu item',
            error: error.message
        });
    }
});

app.put('/api/menu/:itemId/stock', verifyToken, async (req, res) => {
    try {
        const itemId = req.params.itemId;
        const { currentStock } = req.body;
        
        console.log(`📦 Stock update request for ${itemId}: ${currentStock}`);
        
        const parsedStock = Number(currentStock);
        if (isNaN(parsedStock) || parsedStock < 0) {
            console.error('❌ Invalid stock value:', currentStock);
            return res.status(400).json({
                success: false,
                message: 'Stock must be a valid non-negative number'
            });
        }
        
        if (itemId.startsWith('fallback_') || itemId.startsWith('temp_')) {
            console.log(`⏭️ Skipping fallback/temp item (not in MongoDB): ${itemId}`);
            return res.status(200).json({
                success: true,
                message: 'Fallback item - no database update needed',
                data: { _id: itemId, currentStock: parsedStock }
            });
        }
        
        if (!itemId.match(/^[0-9a-fA-F]{24}$/)) {
            console.error(`❌ Invalid MongoDB ID: ${itemId}`);
            return res.status(400).json({
                success: false,
                message: 'Invalid menu item ID'
            });
        }
        
        const menuItem = await MenuItem.findByIdAndUpdate(
            itemId,
            { currentStock: parsedStock },
            { new: true, runValidators: false }
        );
        
        if (!menuItem) {
            console.warn(`⚠️ Menu item not found: ${itemId}`);
            return res.status(404).json({
                success: false,
                message: 'Menu item not found'
            });
        }
        
        console.log(`✅ Stock updated for ${itemId}: ${parsedStock} units`);
        
        res.status(200).json({
            success: true,
            message: 'Stock updated successfully',
            data: {
                _id: menuItem._id,
                name: menuItem.itemName,
                currentStock: menuItem.currentStock
            }
        });
    } catch (error) {
        console.error('❌ Error updating stock:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error updating stock',
            error: error.message
        });
    }
});

app.get('/api/admin/events', verifyToken, verifyAdmin, (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
    });

    res.write('data: {"type": "connected", "message": "Connected to admin real-time updates"}\n\n');

    const clientId = Date.now();
    const client = {
        id: clientId,
        res: res
    };
    
    RealTimeManager.addAdminClient(client);

    req.on('close', () => {
        RealTimeManager.removeAdminClient(client);
    });
});

app.get('/api/staff/events', verifyToken, (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
    });

    res.write('data: {"type": "connected", "message": "Connected to staff real-time updates"}\n\n');

    const clientId = Date.now();
    const client = {
        id: clientId,
        res: res,
        role: req.user.role
    };
    
    RealTimeManager.addStaffClient(client);

    req.on('close', () => {
        RealTimeManager.removeStaffClient(client);
    });
});

app.get("/api/dashboard/stats", verifyToken, verifyAdmin, async (req, res) => {
    try {
        console.log('📊 API: Fetching dashboard stats...');
        const stats = await DashboardStats.getStats();
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('❌ Error fetching dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard stats',
            error: error.message
        });
    }
});

app.get("/api/inventory/status", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        
        const inventoryItems = await InventoryItem.find({ 
            isActive: true 
        })
        .sort({ currentStock: 1 })
        .limit(limit)
        .lean();
        
        const formattedItems = inventoryItems.map(item => ({
            ...item,
            unit: item.unit || 'pieces',
            itemName: item.itemName || item.name,
            currentStock: item.currentStock || 0,
            minStock: item.minStock || 5,
            maxStock: item.maxStock || 50
        }));
        
        console.log('📦 Inventory Status API Query:');
        console.log(`  - Limit: ${limit}`);
        console.log(`  - Items found: ${formattedItems.length}`);
        formattedItems.forEach((item, idx) => {
            console.log(`  [${idx + 1}] ${item.itemName} - Stock: ${item.currentStock} ${item.unit} (Active: ${item.isActive})`);
        });
        
        res.json({
            success: true,
            data: formattedItems,
            count: formattedItems.length
        });
    } catch (error) {
        console.error('❌ Error fetching inventory status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch inventory status'
        });
    }
});

app.get("/api/products/out-of-stock", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const outOfStockProducts = await Product.find({ stock: 0 })
            .select('itemName category price image stock')
            .sort({ updatedAt: -1 })
            .lean();
        
        console.log(`🚨 Out of Stock Products: ${outOfStockProducts.length} items`);
        
        res.json({
            success: true,
            data: outOfStockProducts,
            count: outOfStockProducts.length,
            message: `${outOfStockProducts.length} product(s) out of stock`
        });
    } catch (error) {
        console.error('❌ Error fetching out of stock products:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch out of stock products',
            error: error.message
        });
    }
});

app.get("/api/inventory", verifyToken, async (req, res) => {
    try {
        console.log('📦 API: /api/inventory - Fetching ALL inventory items for availability check...');
        
        const inventoryItems = await InventoryItem.find()
            .sort({ itemName: 1 })
            .lean();
        
        console.log(`📦 Inventory API returning ${inventoryItems.length} items`);
        
        if (inventoryItems.length > 0) {
            console.log('   Sample items:');
            inventoryItems.slice(0, 3).forEach(item => {
                console.log(`   - ${item.itemName}: stock=${item.currentStock}`);
            });
        }
        
        res.json({
            success: true,
            data: inventoryItems,
            count: inventoryItems.length
        });
    } catch (error) {
        console.error('❌ Error fetching inventory:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch inventory',
            error: error.message
        });
    }
});

app.get("/api/orders/today", verifyToken, verifyAdmin, async (req, res) => {
    try {
        // ✅ Default to 20 orders, max 100 for performance
        let limit = parseInt(req.query.limit) || 20;
        limit = Math.min(limit, 100); // Cap at 100
        
        const { startOfDay, endOfDay } = HelperFunctions.getTodayDateRange();
        
        console.log(`📋 Fetching up to ${limit} orders for today...`);
        
        let orders = await Order.find({ 
            status: 'completed',
            createdAt: { $gte: startOfDay, $lte: endOfDay }
        })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
        
        console.log(`📊 Found ${orders.length} completed orders today`);
        
        if (orders.length === 0) {
            console.log('⚠️ No orders today, fetching from last 7 days...');
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            
            orders = await Order.find({ 
                status: 'completed',
                createdAt: { $gte: sevenDaysAgo, $lte: endOfDay }
            })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();
            
            console.log(`📊 Found ${orders.length} orders from last 7 days`);
        }
        
        res.json({
            success: true,
            data: orders,
            count: orders.length
        });
    } catch (error) {
        console.error('❌ Error fetching today\'s orders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch today\'s orders'
        });
    }
});

app.get("/api/orders/top-items", verifyToken, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const days = parseInt(req.query.days) || 30;
        
        const dateRange = new Date();
        dateRange.setDate(dateRange.getDate() - days);
        
        console.log(`📊 Fetching top items: limit=${limit}, days=${days}, dateRange=${dateRange}`);
        
        // First, check if there are ANY orders in the system
        const totalOrders = await Order.countDocuments();
        const completedOrders = await Order.countDocuments({ status: 'completed' });
        const recentOrders = await Order.countDocuments({ createdAt: { $gte: dateRange } });
        
        console.log(`📋 Order counts: total=${totalOrders}, completed=${completedOrders}, recent(${days}d)=${recentOrders}`);
        
        // Get all orders first (regardless of status) to ensure we get data
        const topItems = await Order.aggregate([
            { 
                $match: { 
                    createdAt: { $gte: dateRange }
                } 
            },
            { $unwind: '$items' },
            { 
                $group: { 
                    _id: '$items.name',
                    totalQuantity: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
                    count: { $sum: 1 }
                }
            },
            // Filter out null, empty strings, and "Unknown Item"
            { 
                $match: { 
                    _id: { 
                        $ne: null, 
                        $ne: '', 
                        $ne: 'Unknown Item'
                    }
                }
            },
            { $sort: { totalRevenue: -1 } },
            { $limit: limit }
        ]);
        
        console.log(`✅ Top items aggregation returned: ${topItems.length} items`);
        
        if (topItems.length > 0) {
            console.log('📋 Sample top items:', topItems.slice(0, 2).map(i => ({
                name: i._id,
                qty: i.totalQuantity,
                revenue: i.totalRevenue
            })));
        } else {
            console.warn('⚠️ No items found. Checking raw order structure...');
            const sampleOrder = await Order.findOne();
            console.log('Sample order structure:', sampleOrder ? {
                id: sampleOrder._id,
                status: sampleOrder.status,
                itemsCount: sampleOrder.items?.length,
                firstItem: sampleOrder.items?.[0]
            } : 'No orders in database');
        }
        
        res.json({
            success: true,
            data: topItems,
            count: topItems.length,
            debug: { totalOrders, completedOrders, recentOrders }
        });
    } catch (error) {
        console.error('❌ Error fetching top selling items:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch top selling items',
            error: error.message
        });
    }
});

app.get("/api/revenue/breakdown", verifyToken, verifyAdmin, async (req, res) => {
    try {
        console.log(`\n${'='.repeat(60)}`);
        console.log('📊 API: /api/revenue/breakdown REQUEST');
        console.log(`${'='.repeat(60)}`);
        
        const { startOfDay, endOfDay } = HelperFunctions.getTodayDateRange();
        
        console.log(`Date: ${startOfDay.toISOString().split('T')[0]}`);
        console.log(`Time Range: ${startOfDay.toLocaleString('en-PH')} to ${endOfDay.toLocaleString('en-PH')}`);
        
        const result = await revenueBreakdownService.calculateAndSaveToday({
            startOfDay,
            endOfDay
        });
        
        if (result.success) {
            console.log(`\n✅ API Response: SUCCESS`);
            console.log(`  Total Revenue: ₱${result.data.totalRevenue.toFixed(2)}`);
            console.log(`  Total Items: ${result.data.totalItems}`);
            console.log(`  Total Orders: ${result.data.totalOrders}`);
            console.log(`  Top Category: ${result.data.topCategory.name}`);
        } else {
            console.log(`\n❌ API Response: FAILED`);
            console.log(`  Error: ${result.message}`);
        }
        
        console.log(`${'='.repeat(60)}\n`);
        
        res.json(result);
        
    } catch (error) {
        console.error('❌ Error calculating revenue breakdown:', error);
        console.log(`${'='.repeat(60)}\n`);
        res.status(500).json({
            success: false,
            message: 'Failed to calculate revenue breakdown',
            error: error.message
        });
    }
});

app.get("/api/revenue/breakdown/date/:date", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const targetDate = new Date(req.params.date);
        const breakdown = await revenueBreakdownService.getBreakdownByDate(targetDate);
        
        if (!breakdown) {
            return res.status(404).json({
                success: false,
                message: 'No breakdown data found for this date'
            });
        }
        
        res.json({
            success: true,
            data: {
                breakdown: breakdown.breakdown,
                totalRevenue: breakdown.totalRevenue,
                totalOrders: breakdown.totalOrders,
                date: breakdown.dateString,
                lastUpdated: breakdown.lastUpdated
            }
        });
    } catch (error) {
        console.error('❌ Error fetching breakdown by date:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch breakdown'
        });
    }
});

app.get("/api/revenue/breakdown/history", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        const breakdowns = await revenueBreakdownService.getHistoricalBreakdown(startDate, endDate);
        
        res.json({
            success: true,
            data: breakdowns,
            count: breakdowns.length,
            period: {
                start: startDate.toISOString().split('T')[0],
                end: endDate.toISOString().split('T')[0]
            }
        });
    } catch (error) {
        console.error('❌ Error fetching historical breakdown:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch historical breakdown'
        });
    }
});

app.get("/api/revenue/breakdown/top-categories", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const { startOfDay, endOfDay } = HelperFunctions.getTodayDateRange();
        
        const topCategories = await revenueBreakdownService.getTopCategories(limit, startOfDay, endOfDay);
        
        res.json({
            success: true,
            data: topCategories,
            count: topCategories.length
        });
    } catch (error) {
        console.error('❌ Error fetching top categories:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch top categories'
        });
    }
});

app.get("/api/sales/chart", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        
        const dates = [];
        const now = new Date();
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            dates.push(date);
        }
        
        const salesData = [];
        
        for (const date of dates) {
            const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
            const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
            
            const daySales = await Order.aggregate([
                { 
                    $match: { 
                        status: 'completed',
                        createdAt: { $gte: startOfDay, $lte: endOfDay }
                    } 
                },
                { 
                    $group: { 
                        _id: null,
                        total: { $sum: '$total' },
                        count: { $sum: 1 }
                    }
                }
            ]);
            
            const dayName = date.toLocaleDateString('en-PH', { weekday: 'short' });
            salesData.push({
                label: dayName,
                value: daySales[0]?.total || 0,
                orders: daySales[0]?.count || 0,
                date: date.toISOString().split('T')[0]
            });
        }
        
        res.json({
            success: true,
            data: salesData,
            count: salesData.length
        });
    } catch (error) {
        console.error('❌ Error fetching sales chart data:', error);
        
        const fallbackData = generateFallbackSalesData();
        
        res.json({
            success: true,
            data: fallbackData,
            isFallback: true
        });
    }
});

function generateFallbackSalesData() {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const baseValue = 3000;
    
    return days.map((day, index) => {
        let multiplier = 1;
        switch (day) {
            case 'Mon': multiplier = 0.7; break;
            case 'Tue': multiplier = 0.8; break;
            case 'Wed': multiplier = 0.9; break;
            case 'Thu': multiplier = 1.0; break;
            case 'Fri': multiplier = 1.3; break;
            case 'Sat': multiplier = 1.5; break;
            case 'Sun': multiplier = 1.2; break;
        }
        
        const randomFactor = 0.8 + Math.random() * 0.4;
        const value = Math.round(baseValue * multiplier * randomFactor);
        
        return {
            label: day,
            value: value,
            orders: Math.round(value / 100),
            isFallback: true
        };
    });
}

app.post('/api/orders', verifyToken, async (req, res) => {
    try {
        const orderData = req.body;
        
        if (!orderData.items || !orderData.items.length) {
            return res.status(400).json({ 
                success: false, 
                message: "No items in order" 
            });
        }
        
        if (!orderData.total || orderData.total <= 0) {
            return res.status(400).json({ 
                success: false, 
                message: "Total amount is required and must be greater than 0" 
            });
        }
        
        if (!orderData.payment || !orderData.payment.amountPaid) {
            return res.status(400).json({ 
                success: false, 
                message: "Payment amount is required" 
            });
        }
        
        const amountPaid = orderData.payment.amountPaid || 0;
        const total = orderData.total || 0;
        const change = amountPaid - total;
        
        if (change < 0) {
            return res.status(400).json({ 
                success: false, 
                message: "Insufficient payment amount" 
            });
        }
        
        if (!orderData.type) {
            orderData.type = "Dine In";
        }
        
        const { startOfDay } = HelperFunctions.getTodayDateRange();
        const orderCount = await Order.countDocuments({
            createdAt: {
                $gte: startOfDay
            }
        });
        const orderNumber = HelperFunctions.generateOrderNumber(orderCount);
        
        console.log('🆕 Creating new order for G\'RAY COUNTRYSIDE CAFÉ:', {
            orderNumber: orderNumber,
            orderCountToday: orderCount,
            currentTime: new Date().toLocaleString('en-PH')
        });
        
        const processedItems = [];
        for (const item of orderData.items) {
            let finalItemName = item.itemName || item.name;
            let finalProductId = item.id || item.productId;
            let finalPrice = item.price;
            
            if (!finalItemName && finalProductId) {
                try {
                    const menuItem = await MenuItem.findById(finalProductId).lean();
                    if (menuItem) {
                        finalItemName = menuItem.itemName || menuItem.name;
                        finalPrice = menuItem.price || finalPrice;
                        console.log(`📌 Fetched item from MenuItem: ${finalItemName}`);
                    }
                } catch (err) {
                    console.warn(`⚠️ Could not fetch MenuItem ${finalProductId}: ${err.message}`);
                }
            }
            
            if (!finalItemName) {
                console.warn(`⚠️ Item has no name - using Unknown Item. Frontend data:`, item);
                finalItemName = "Unknown Item";
            }
            
            processedItems.push({
                name: finalItemName,
                price: finalPrice || 0,
                quantity: item.quantity || 1,
                size: item.size || "Regular",
                image: item.image || 'default_food.jpg',
                productId: finalProductId || null,
                vatable: item.vatable !== undefined ? item.vatable : true
            });
            
            console.log(`  ✓ Item: ${finalItemName} | Qty: ${item.quantity} | Price: ₱${finalPrice}`);
        }
        
        const subtotal = processedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const { vat, net } = HelperFunctions.calculateVAT(subtotal);
        
        let customerId = orderData.customerId;
        let customer = null;
        
        if (customerId) {
            customer = await Customer.findOne({ customerId: customerId });
        }
        
        if (!customer) {
            customerId = HelperFunctions.generateCustomerId();
            
            customer = new Customer({
                customerId: customerId,
                totalOrders: 1,
                totalSpent: orderData.total,
                lastOrderDate: new Date(),
                firstName: orderData.customerName?.split(' ')[0] || 'Customer',
                lastName: orderData.customerName?.split(' ')[1] || '',
                phone: orderData.customerPhone || ''
            });
            
            await customer.save();
        } else {
            customer.totalOrders += 1;
            customer.totalSpent += orderData.total;
            customer.lastOrderDate = new Date();
            await customer.save();
        }
        
        const order = new Order({
            orderNumber,
            items: processedItems,
            subtotal: subtotal,
            tax: vat,
            total: orderData.total,
            payment: {
                method: orderData.payment?.method || "cash",
                amountPaid: amountPaid,
                change: change,
                status: "completed"
            },
            type: orderData.type,
            status: "completed",
            notes: orderData.notes || "",
            customerId: customerId,
            cashier: req.user.username,
            createdAt: new Date()
        });
        
        const savedOrder = await order.save();
        
        console.log('✅ Order created successfully:', {
            orderId: savedOrder._id,
            orderNumber: savedOrder.orderNumber,
            customerId: customerId,
            itemCount: processedItems.length,
            total: savedOrder.total,
            vat: vat,
            createdAt: savedOrder.createdAt.toLocaleString('en-PH')
        });
        
        const receiptData = HelperFunctions.generateReceipt(savedOrder, customer);
        
        for (const item of processedItems) {
            try {
                const menuItem = await MenuItem.findOne({
                    $or: [
                        { itemName: { $regex: new RegExp(`^${item.name}$`, 'i') } },
                        { name: { $regex: new RegExp(`^${item.name}$`, 'i') } }
                    ]
                });
                
                if (menuItem) {
                    const quantitySold = item.quantity || 1;
                    const previousStock = menuItem.currentStock || 0;
                    
                    menuItem.currentStock = Math.max(0, previousStock - quantitySold);
                    
                    if (menuItem.currentStock <= 0) {
                        menuItem.status = 'out_of_stock';
                    } else if (menuItem.currentStock <= menuItem.minStock) {
                        menuItem.status = 'low_stock';
                    } else {
                        menuItem.status = 'in_stock';
                    }
                    
                    await menuItem.save();
                    
                    console.log(`📉 Updated inventory: ${item.name}`, {
                        quantitySold: quantitySold,
                        newStock: menuItem.currentStock,
                        status: menuItem.status
                    });
                } else {
                    console.warn(`⚠️ MenuItem not found for: ${item.name} (inventory not updated)`);
                }
            } catch (err) {
                console.error(`❌ Error updating inventory for ${item.name}:`, err.message);
            }
        }
        
        // 🆕 DEDUCT RAW INGREDIENTS FROM INVENTORY
        // ENABLED: Deductions happen when orders are placed
        console.log('🧂 Processing raw ingredient deductions...');
        console.log(`🧂 DEBUG: reverseRecipeMapping has ${Object.keys(reverseRecipeMapping).length} dishes:`, Object.keys(reverseRecipeMapping).slice(0, 10));
        
        for (const item of processedItems) {
            try {
                console.log(`🔍 Looking for recipe for item: "${item.name}"`);
                
                // Try exact match first, then case-insensitive match
                let requiredIngredients = reverseRecipeMapping[item.name];
                
                if (!requiredIngredients) {
                    // Try case-insensitive match
                    const matchedDish = Object.keys(reverseRecipeMapping).find(
                        dish => dish.toLowerCase() === item.name.toLowerCase()
                    );
                    console.log(`   Exact match failed, trying case-insensitive. Found: "${matchedDish}"`);
                    requiredIngredients = matchedDish ? reverseRecipeMapping[matchedDish] : null;
                }
                
                if (!requiredIngredients || requiredIngredients.length === 0) {
                    console.log(`ℹ️ No ingredients required for: ${item.name}`);
                    continue;
                }
                
                console.log(`🔗 Deducting ingredients for: ${item.name} (Qty: ${item.quantity}) | Required: [${requiredIngredients.join(', ')}]`);
                
                for (const ingredientName of requiredIngredients) {
                    try {
                        // Try exact match first
                        let inventoryItem = await InventoryItem.findOne({
                            itemName: { $regex: new RegExp(`^${ingredientName}$`, 'i') },
                            itemType: 'raw',
                            isActive: true
                        });
                        
                        // If not found, try partial match (in case of naming variations)
                        if (!inventoryItem) {
                            inventoryItem = await InventoryItem.findOne({
                                itemName: { $regex: new RegExp(ingredientName, 'i') },
                                itemType: 'raw',
                                isActive: true
                            });
                        }
                        
                        if (!inventoryItem) {
                            console.warn(`⚠️ Raw ingredient not found in inventory: ${ingredientName}`);
                            continue;
                        }
                        
                        const quantityToDeduct = item.quantity || 1;
                        const previousStock = inventoryItem.currentStock;
                        const newStock = Math.max(0, previousStock - quantityToDeduct);
                        
                        // Update stock
                        inventoryItem.currentStock = newStock;
                        
                        // Update status based on new stock level
                        if (newStock <= 0) {
                            inventoryItem.status = 'out_of_stock';
                        } else if (newStock <= inventoryItem.minStock) {
                            inventoryItem.status = 'low_stock';
                        } else {
                            inventoryItem.status = 'in_stock';
                        }
                        
                        // Record usage in history
                        inventoryItem.usageHistory.push({
                            quantity: quantityToDeduct,
                            notes: `Deducted for order #${savedOrder.orderNumber} - ${item.name}`,
                            usedBy: req.user.username,
                            date: new Date()
                        });
                        
                        await inventoryItem.save();
                        
                        console.log(`  ✓ ${inventoryItem.itemName}: ${previousStock} → ${newStock} ${inventoryItem.unit} [${inventoryItem.status}]`);
                    } catch (err) {
                        console.error(`❌ Error deducting ingredient ${ingredientName}:`, err.message);
                    }
                }
            } catch (err) {
                console.error(`❌ Error processing ingredients for ${item.name}:`, err.message);
            }
        }
        
        RealTimeManager.sendOrderNotification(savedOrder);
        RealTimeManager.sendStatsUpdate();
        
        res.json({
            success: true,
            message: "Order created successfully",
            data: {
                orderId: savedOrder._id,
                orderNumber: savedOrder.orderNumber,
                customerId: customerId,
                total: savedOrder.total,
                tax: vat,
                change: change,
                receipt: receiptData,
                itemsProcessed: processedItems.length,
                createdAt: savedOrder.createdAt
            }
        });
        
    } catch (error) {
        console.error('❌ Error creating order:', error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to create order"
        });
    }
});

// Get all orders
app.get('/api/orders', verifyToken, async (req, res) => {
    try {
        console.log('📦 API: Fetching all orders...');
        
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        
        // Build filter
        let filter = {};
        
        if (req.query.status) {
            filter.status = req.query.status;
        }
        
        if (req.query.customerId) {
            filter.customerId = req.query.customerId;
        }
        
        // Date range filtering
        if (req.query.startDate && req.query.endDate) {
            filter.createdAt = {
                $gte: new Date(req.query.startDate),
                $lte: new Date(req.query.endDate)
            };
        }
        
        // Get total count for pagination
        const total = await Order.countDocuments(filter);
        
        // Fetch orders
        const orders = await Order.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
        
        console.log(`✅ Orders fetched: ${orders.length} items (Page ${page}, Total: ${total})`);
        
        res.json({
            success: true,
            data: orders,
            pagination: {
                page: page,
                limit: limit,
                total: total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('❌ Error fetching orders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders',
            error: error.message
        });
    }
});

app.get('/api/orders/:orderId/receipt', verifyToken, async (req, res) => {
    try {
        const orderId = req.params.orderId;
        
        const order = await Order.findById(orderId).lean();
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }
        
        const customer = await Customer.findOne({ 
            customerId: order.customerId 
        }).lean();
        
        const receiptData = HelperFunctions.generateReceipt(order, customer);
        
        res.json({
            success: true,
            data: receiptData
        });
    } catch (error) {
        console.error('Error generating receipt:', error);
        res.status(500).json({
            success: false,
            message: "Failed to generate receipt"
        });
    }
});

app.get('/api/customers', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '' } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        let query = {};
        if (search) {
            query.$or = [
                { customerId: { $regex: search, $options: 'i' } },
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }
        
        const customers = await Customer.find(query)
            .sort({ lastOrderDate: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();
        
        const total = await Customer.countDocuments(query);
        
        res.json({
            success: true,
            data: customers,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

app.get('/api/inventory', verifyToken, async (req, res) => {
    try {
        console.log('📦 API: Fetching inventory items...');
        const inventoryItems = await InventoryItem.find({}).lean();
        
        const formattedItems = inventoryItems.map(item => ({
            _id: item._id,
            itemId: item._id.toString(),
            itemName: item.itemName || item.name,
            category: item.category,
            currentStock: item.currentStock || 0,
            minStock: item.minStock || 0,
            maxStock: item.maxStock || 0,
            unit: item.unit,
            status: item.currentStock === 0 ? 'out_of_stock' : item.currentStock <= item.minStock ? 'low_stock' : 'in_stock',
            itemType: item.itemType || 'raw_ingredient',
            lastUpdated: item.updatedAt || item.createdAt
        }));
        
        res.json({
            success: true,
            data: formattedItems,
            outOfStockCount: formattedItems.filter(i => i.status === 'out_of_stock').length,
            lowStockCount: formattedItems.filter(i => i.status === 'low_stock').length
        });
    } catch (error) {
        console.error('❌ Error fetching inventory:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching inventory',
            error: error.message
        });
    }
});

app.get('/api/inventory/name/:itemName', verifyToken, async (req, res) => {
    try {
        const itemName = decodeURIComponent(req.params.itemName);
        console.log(`🔍 API: Looking up inventory by name: "${itemName}"`);
        
        let item = null;
        let fromCollection = null;
        
        let inventoryItem = await InventoryItem.findOne({
            $expr: {
                $eq: [{ $toLower: '$itemName' }, itemName.toLowerCase().trim()]
            }
        }).lean();
        
        if (inventoryItem) {
            item = inventoryItem;
            fromCollection = 'InventoryItem (raw ingredient)';
        } else {
            console.log(`   ℹ️  Not found in raw ingredients, searching menu items...`);
            let menuItem = await MenuItem.findOne({
                $expr: {
                    $eq: [{ $toLower: '$itemName' }, itemName.toLowerCase().trim()]
                }
            }).lean();
            
            if (!menuItem) {
                menuItem = await MenuItem.findOne({
                    $expr: {
                        $eq: [{ $toLower: '$name' }, itemName.toLowerCase().trim()]
                    }
                }).lean();
            }
            
            if (menuItem) {
                item = menuItem;
                fromCollection = 'MenuItem (finished product)';
            }
        }
        
        if (!item) {
            console.warn(`⚠️ No item found for: "${itemName}" in any collection`);
            return res.status(404).json({
                success: false,
                message: `Item "${itemName}" not found in inventory or menu`
            });
        }
        
        const formatted = {
            _id: item._id,
            itemId: item._id.toString(),
            itemName: item.itemName || item.name,
            category: item.category,
            currentStock: item.currentStock || 0,
            minStock: item.minStock || 0,
            maxStock: item.maxStock || 0,
            unit: item.unit,
            status: item.currentStock === 0 ? 'out_of_stock' : item.currentStock <= item.minStock ? 'low_stock' : 'in_stock',
            itemType: item.itemType || 'finished',
            lastUpdated: item.updatedAt || item.createdAt,
            source: fromCollection
        };
        
        console.log(`✅ Found item: "${formatted.itemName}" from ${fromCollection}`);
        res.json({
            success: true,
            data: formatted
        });
    } catch (error) {
        console.error('❌ Error fetching item by name:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching item by name',
            error: error.message
        });
    }
});

app.get('/api/inventory/:itemId', verifyToken, async (req, res) => {
    try {
        console.log(`📦 API: Fetching inventory item ${req.params.itemId}...`);
        const inventoryItem = await InventoryItem.findById(req.params.itemId).lean();
        
        if (!inventoryItem) {
            return res.status(404).json({
                success: false,
                message: 'Inventory item not found'
            });
        }
        
        const formatted = {
            _id: inventoryItem._id,
            itemId: inventoryItem._id.toString(),
            itemName: inventoryItem.itemName || inventoryItem.name,
            category: inventoryItem.category,
            currentStock: inventoryItem.currentStock || 0,
            minStock: inventoryItem.minStock || 0,
            maxStock: inventoryItem.maxStock || 0,
            unit: inventoryItem.unit,
            status: inventoryItem.currentStock === 0 ? 'out_of_stock' : inventoryItem.currentStock <= inventoryItem.minStock ? 'low_stock' : 'in_stock',
            itemType: inventoryItem.itemType || 'raw_ingredient',
            lastUpdated: inventoryItem.updatedAt || inventoryItem.createdAt
        };
        
        res.json({
            success: true,
            data: formatted
        });
    } catch (error) {
        console.error('❌ Error fetching inventory item:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching inventory item',
            error: error.message
        });
    }
});

app.post('/api/inventory', verifyToken, verifyAdmin, async (req, res) => {
    try {
        console.log('📦 API: Creating new inventory item...', JSON.stringify(req.body, null, 2));
        
        const { itemName, category, unit, currentStock, minStock, maxStock, itemType } = req.body;
        
        if (!itemName) {
            return res.status(400).json({
                success: false,
                message: 'Item name is required'
            });
        }
        
        if (!category) {
            return res.status(400).json({
                success: false,
                message: 'Category is required'
            });
        }
        
        const existingItem = await InventoryItem.findOne({
            itemName: { $regex: `^${itemName.trim()}$`, $options: 'i' }
        });
        
        if (existingItem) {
            console.warn(`⚠️ Duplicate ingredient detected: "${itemName}"`);
            return res.status(409).json({
                success: false,
                message: `Ingredient "${itemName}" already exists in inventory`,
                duplicate: true
            });
        }
        
        const parsedCurrentStock = Number(currentStock) || 0;
        const parsedMinStock = Number(minStock) || 0;
        const parsedMaxStock = Number(maxStock) || 100;
        
        const inventoryItem = new InventoryItem({
            itemName,
            category,
            unit: unit || 'piece',
            currentStock: parsedCurrentStock,
            minStock: parsedMinStock,
            maxStock: parsedMaxStock,
            itemType: itemType || 'raw_ingredient',
            isActive: true
        });
        
        await inventoryItem.save();
        
        const formatted = {
            _id: inventoryItem._id,
            itemId: inventoryItem._id.toString(),
            itemName: inventoryItem.itemName,
            category: inventoryItem.category,
            currentStock: inventoryItem.currentStock,
            minStock: inventoryItem.minStock,
            maxStock: inventoryItem.maxStock,
            unit: inventoryItem.unit,
            status: inventoryItem.currentStock === 0 ? 'out_of_stock' : 'in_stock',
            itemType: inventoryItem.itemType
        };
        
        console.log(`✅ Inventory item created: ${inventoryItem._id}`);
        
        RealTimeManager.broadcastToAdmins({
            type: 'inventory_update',
            action: 'created',
            item: formatted
        });
        
        res.status(201).json({
            success: true,
            message: 'Inventory item created successfully',
            data: formatted
        });
    } catch (error) {
        console.error('❌ Error creating inventory item:', error.message);
        console.error('❌ Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Error creating inventory item',
            error: error.message
        });
    }
});

app.put('/api/inventory/:itemId', verifyToken, verifyAdmin, async (req, res) => {
    try {
        console.log(`📦 API: Updating inventory item ${req.params.itemId}...`, JSON.stringify(req.body, null, 2));
        
        const { itemName, category, unit, currentStock, minStock, maxStock, itemType } = req.body;
        const itemId = req.params.itemId;
        
        if (itemName) {
            const existingItem = await InventoryItem.findOne({
                _id: { $ne: itemId },
                itemName: { $regex: `^${itemName.trim()}$`, $options: 'i' }
            });
            
            if (existingItem) {
                console.warn(`⚠️ Duplicate ingredient detected during edit: "${itemName}"`);
                return res.status(409).json({
                    success: false,
                    message: `Another ingredient already has the name "${itemName}"`,
                    duplicate: true
                });
            }
        }
        
        const parsedCurrentStock = Number(currentStock) || 0;
        const parsedMinStock = Number(minStock) || 0;
        const parsedMaxStock = Number(maxStock) || 100;
        
        const inventoryItem = await InventoryItem.findByIdAndUpdate(
            itemId,
            {
                itemName,
                category,
                unit: unit || 'piece',
                currentStock: parsedCurrentStock,
                minStock: parsedMinStock,
                maxStock: parsedMaxStock,
                itemType: itemType || 'raw_ingredient',
                isActive: true
            },
            { new: true, runValidators: true }
        );
        
        if (!inventoryItem) {
            return res.status(404).json({
                success: false,
                message: 'Inventory item not found'
            });
        }
        
        const formatted = {
            _id: inventoryItem._id,
            itemId: inventoryItem._id.toString(),
            itemName: inventoryItem.itemName,
            category: inventoryItem.category,
            currentStock: inventoryItem.currentStock,
            minStock: inventoryItem.minStock,
            maxStock: inventoryItem.maxStock,
            unit: inventoryItem.unit,
            status: inventoryItem.currentStock === 0 ? 'out_of_stock' : inventoryItem.currentStock <= inventoryItem.minStock ? 'low_stock' : 'in_stock',
            itemType: inventoryItem.itemType
        };
        
        console.log(`✅ Inventory item updated: ${inventoryItem._id}`);
        
        RealTimeManager.broadcastToAdmins({
            type: 'inventory_update',
            action: 'updated',
            item: formatted
        });
        
        RealTimeManager.broadcastToStaff({
            type: 'inventory_update',
            action: 'stock_changed',
            itemName: itemName,
            currentStock: parsedCurrentStock,
            isOutOfStock: parsedCurrentStock === 0,
            isLowStock: parsedCurrentStock > 0 && parsedCurrentStock <= parsedMinStock
        });
        
        console.log(`🍽️ Checking affected menu items for "${itemName}"...`);
        await RecipeManager.updateRelatedMenuItems(itemName);
        
        res.json({
            success: true,
            message: 'Inventory item updated successfully',
            data: formatted
        });
    } catch (error) {
        console.error('❌ Error updating inventory item:', error.message);
        console.error('❌ Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Error updating inventory item',
            error: error.message
        });
    }
});

// 🧂 DEDUCT RAW INGREDIENTS WHEN MENU ITEM IS CREATED
app.post('/api/inventory/deduct-ingredients', verifyToken, async (req, res) => {
    try {
        const { itemName, quantity = 1, reason = 'Product created' } = req.body;
        
        if (!itemName) {
            return res.status(400).json({
                success: false,
                message: 'Item name is required'
            });
        }
        
        console.log(`🧂 API: Deducting ingredients for: ${itemName} (Qty: ${quantity})`);
        
        // Get required ingredients for this menu item
        const requiredIngredients = reverseRecipeMapping[itemName] || [];
        
        if (requiredIngredients.length === 0) {
            console.log(`ℹ️ No ingredients required for: ${itemName}`);
            return res.json({
                success: true,
                message: 'No ingredients to deduct',
                deductedIngredients: []
            });
        }
        
        const deductedIngredients = [];
        const failedIngredients = [];
        
        for (const ingredientName of requiredIngredients) {
            try {
                const inventoryItem = await InventoryItem.findOne({
                    itemName: { $regex: new RegExp(`^${ingredientName}$`, 'i') },
                    itemType: 'raw',
                    isActive: true
                });
                
                if (!inventoryItem) {
                    console.warn(`⚠️ Raw ingredient not found: ${ingredientName}`);
                    failedIngredients.push(`${ingredientName} (not in inventory)`);
                    continue;
                }
                
                const quantityToDeduct = quantity || 1;
                const previousStock = inventoryItem.currentStock;
                const newStock = Math.max(0, previousStock - quantityToDeduct);
                
                // Update stock
                inventoryItem.currentStock = newStock;
                
                // Update status
                if (newStock <= 0) {
                    inventoryItem.status = 'out_of_stock';
                } else if (newStock <= inventoryItem.minStock) {
                    inventoryItem.status = 'low_stock';
                } else {
                    inventoryItem.status = 'in_stock';
                }
                
                // Record usage
                inventoryItem.usageHistory.push({
                    quantity: quantityToDeduct,
                    notes: `${reason} - ${itemName}`,
                    usedBy: req.user?.username || 'Admin',
                    date: new Date()
                });
                
                await inventoryItem.save();
                
                deductedIngredients.push({
                    ingredient: ingredientName,
                    quantity: quantityToDeduct,
                    unit: inventoryItem.unit,
                    previousStock: previousStock,
                    newStock: newStock,
                    status: inventoryItem.status
                });
                
                console.log(`  ✓ ${ingredientName}: ${previousStock} → ${newStock} ${inventoryItem.unit} [${inventoryItem.status}]`);
                
            } catch (err) {
                console.error(`❌ Error deducting ingredient ${ingredientName}:`, err.message);
                failedIngredients.push(`${ingredientName} (error)`);
            }
        }
        
        res.json({
            success: true,
            message: `Deducted ingredients for ${itemName}`,
            deductedIngredients: deductedIngredients,
            failedIngredients: failedIngredients,
            totalDeducted: deductedIngredients.length
        });
        
    } catch (error) {
        console.error('❌ Error deducting ingredients:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error deducting ingredients',
            error: error.message
        });
    }
});

app.delete('/api/inventory/:itemId', verifyToken, verifyAdmin, async (req, res) => {
    try {
        console.log(`📦 API: Deleting inventory item ${req.params.itemId}...`);
        
        const inventoryItem = await InventoryItem.findByIdAndDelete(req.params.itemId);
        
        if (!inventoryItem) {
            return res.status(404).json({
                success: false,
                message: 'Inventory item not found'
            });
        }
        
        console.log(`✅ Inventory item deleted: ${req.params.itemId}`);
        
        RealTimeManager.broadcastToAdmins({
            type: 'inventory_update',
            action: 'deleted',
            itemId: req.params.itemId
        });
        
        res.json({
            success: true,
            message: 'Inventory item deleted successfully'
        });
    } catch (error) {
        console.error('❌ Error deleting inventory item:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting inventory item',
            error: error.message
        });
    }
});

app.get('/api/inventory/status/out-of-stock', verifyToken, async (req, res) => {
    try {
        console.log('🚨 API: Fetching out-of-stock items...');
        const outOfStockItems = await InventoryItem.find({ currentStock: { $lte: 0 } }).lean();
        
        const formatted = outOfStockItems.map(item => ({
            _id: item._id,
            itemName: item.itemName || item.name,
            category: item.category,
            currentStock: item.currentStock || 0,
            minStock: item.minStock || 0,
            unit: item.unit,
            status: 'out_of_stock'
        }));
        
        res.json({
            success: true,
            data: formatted,
            count: formatted.length
        });
    } catch (error) {
        console.error('❌ Error fetching out-of-stock items:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching out-of-stock items',
            error: error.message
        });
    }
});

app.get('/api/inventory/status/low-stock', verifyToken, async (req, res) => {
    try {
        console.log('⚠️ API: Fetching low-stock items...');
        const lowStockItems = await InventoryItem.find({
            $expr: { $and: [
                { $gt: ['$currentStock', 0] },
                { $lte: ['$currentStock', '$minStock'] }
            ]}
        }).lean();
        
        const formatted = lowStockItems.map(item => ({
            _id: item._id,
            itemName: item.itemName || item.name,
            category: item.category,
            currentStock: item.currentStock || 0,
            minStock: item.minStock || 0,
            unit: item.unit,
            status: 'low_stock'
        }));
        
        res.json({
            success: true,
            data: formatted,
            count: formatted.length
        });
    } catch (error) {
        console.error('❌ Error fetching low-stock items:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching low-stock items',
            error: error.message
        });
    }
});

app.get("/admindashboard", verifyToken, verifyAdmin, (req, res) => {
    res.redirect("/admindashboard/dashboard");
});

app.get("/admindashboard/dashboard", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const currentTime = new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
        const stats = await DashboardStats.getStats();
        
        res.render("dashboard", { 
            user: req.user,
            currentTime: currentTime,
            stats: stats,
            businessInfo: BUSINESS_INFO
        });
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
        res.render("dashboard", {
            user: req.user,
            currentTime: new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
            stats: DashboardStats.getDefaultStats(),
            businessInfo: BUSINESS_INFO,
            error: "Failed to load dashboard"
        });
    }
});

app.get("/admindashboard/inventory", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const [totalItems, lowStockCount, outOfStockCount] = await Promise.all([
            InventoryItem.countDocuments(),
            InventoryItem.countDocuments({ currentStock: { $gt: 0, $lt: CONFIG.LOW_STOCK_THRESHOLD }, isActive: true }),
            InventoryItem.countDocuments({ currentStock: 0, isActive: true })
        ]);
        
        const initialItems = await InventoryItem.find()
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();
        
        const allCategories = [
            'Meat & Poultry', 'Seafood', 'Dairy & Eggs', 'Vegetables & Fruits',
            'Dry Goods', 'Beverages', 'Packaging'
        ];
        
        res.render("Inventory", {
            user: req.user,
            stats: {
                totalItems,
                lowStockCount,
                outOfStockCount
            },
            initialItems: initialItems || [],
            allCategories,
            LOW_STOCK_THRESHOLD: CONFIG.LOW_STOCK_THRESHOLD,
            businessInfo: BUSINESS_INFO
        });
        
    } catch (error) {
        console.error('Error loading Inventory page:', error);
        res.render("Inventory", {
            user: req.user,
            stats: {
                totalItems: 0,
                lowStockCount: 0,
                outOfStockCount: 0
            },
            initialItems: [],
            allCategories: [],
            LOW_STOCK_THRESHOLD: CONFIG.LOW_STOCK_THRESHOLD,
            businessInfo: BUSINESS_INFO
        });
    }
});

app.get("/admindashboard/salesandreports", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const stats = await DashboardStats.getStats();
        res.render("salesandreports", {
            user: req.user,
            title: "Sales & Reports",
            stats: stats,
            businessInfo: BUSINESS_INFO
        });
    } catch (error) {
        console.error('Error loading sales and reports:', error);
        res.render("salesandreports", {
            user: req.user,
            title: "Sales & Reports",
            stats: DashboardStats.getDefaultStats(),
            businessInfo: BUSINESS_INFO
        });
    }
});

app.get("/admindashboard/orderhistory", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const stats = await DashboardStats.getStats();
        res.render("orderhistory", {
            user: req.user,
            stats: stats,
            businessInfo: BUSINESS_INFO
        });
    } catch (error) {
        console.error('Error loading order history:', error);
        res.render("orderhistory", {
            user: req.user,
            stats: DashboardStats.getDefaultStats(),
            businessInfo: BUSINESS_INFO
        });
    }
});

app.get("/admindashboard/addstaff", verifyToken, verifyAdmin, (req, res) => {
    res.render("addstaff", {
        user: req.user,
        businessInfo: BUSINESS_INFO
    });
});

app.get("/admindashboard/menumanagement", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const [menuItems, categories, stats] = await Promise.all([
            MenuItem.find().sort({ itemName: 1 }).limit(50),
            MenuItem.distinct("category", { isActive: true }),
            DashboardStats.getStats()
        ]);
        
        res.render("menumanagement", {
            user: req.user,
            initialMenuItems: menuItems || [],
            categories: categories || [],
            stats: stats,
            businessInfo: BUSINESS_INFO
        });
    } catch (error) {
        console.error('Error loading menu management:', error);
        res.render("menumanagement", {
            user: req.user,
            initialMenuItems: [],
            categories: [],
            stats: DashboardStats.getDefaultStats(),
            businessInfo: BUSINESS_INFO
        });
    }
});

app.get('/api/infosettings/user', verifyToken, async (req, res) => {
    try {
        console.log('📝 API: /api/infosettings/user - Fetching user data');
        console.log('Token decoded user:', req.user);
        
        // Get the user ID from the token (could be _id or id)
        const userId = req.user._id || req.user.id || req.user.userId;
        
        if (!userId) {
            console.error('❌ No user ID found in token:', req.user);
            return res.status(401).json({
                success: false,
                message: 'Invalid token: No user ID'
            });
        }
        
        const user = await User.findById(userId).select('-password');
        
        if (!user) {
            console.warn(`⚠️ User not found with ID: ${userId}`);
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        console.log(`✅ User found: ${user.username}`);
        
        res.json({
            success: true,
            data: {
                _id: user._id,
                username: user.username,
                email: user.email,
                fullName: user.fullName || user.name || user.username,
                phone: user.phone || '',
                name: user.name || user.username,
                role: user.role,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('❌ Error fetching user data:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user data',
            error: error.message
        });
    }
});

// Alternative user endpoints for compatibility
app.get('/api/user/profile', verifyToken, async (req, res) => {
    try {
        const userId = req.user._id || req.user.id || req.user.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Invalid token' });
        }
        
        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        res.json({
            success: true,
            data: {
                _id: user._id,
                username: user.username,
                email: user.email,
                fullName: user.fullName || user.name || user.username,
                phone: user.phone || '',
                role: user.role
            }
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ success: false, message: 'Error fetching profile' });
    }
});

// Update user profile
app.post('/api/infosettings/update', verifyToken, async (req, res) => {
    try {
        const userId = req.user._id || req.user.id || req.user.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Invalid token' });
        }
        
        const { fullName, email, phoneNumber } = req.body;
        
        if (!fullName || !email) {
            return res.status(400).json({
                success: false,
                message: 'Full name and email are required'
            });
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }
        
        const user = await User.findByIdAndUpdate(
            userId,
            {
                fullName: fullName,
                name: fullName,
                email: email,
                phone: phoneNumber || user.phone
            },
            { new: true, runValidators: false }
        ).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        console.log(`✅ User profile updated: ${user.username}`);
        
        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                _id: user._id,
                username: user.username,
                email: user.email,
                fullName: user.fullName || user.name,
                phoneNumber: user.phone,
                updatedAt: user.updatedAt
            }
        });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: error.message
        });
    }
});

// Change password
app.post('/api/infosettings/change-password', verifyToken, async (req, res) => {
    try {
        const userId = req.user._id || req.user.id || req.user.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Invalid token' });
        }
        
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }
        
        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 8 characters'
            });
        }
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }
        
        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Update password
        user.password = hashedPassword;
        await user.save();
        
        console.log(`✅ Password changed for user: ${user.username}`);
        
        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({
            success: false,
            message: 'Error changing password',
            error: error.message
        });
    }
});

app.get('/api/user', verifyToken, async (req, res) => {
    try {
        const userId = req.user._id || req.user.id || req.user.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Invalid token' });
        }
        
        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        res.json({
            success: true,
            data: {
                _id: user._id,
                username: user.username,
                email: user.email,
                fullName: user.fullName || user.name || user.username,
                phone: user.phone || '',
                role: user.role
            }
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ success: false, message: 'Error fetching user' });
    }
});

// Current user endpoint (alias for /api/user)
app.get('/api/user/me', verifyToken, async (req, res) => {
    try {
        const userId = req.user._id || req.user.id || req.user.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Invalid token' });
        }
        
        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        res.json({
            success: true,
            data: {
                _id: user._id,
                username: user.username,
                email: user.email,
                fullName: user.fullName || user.name || user.username,
                phone: user.phone || '',
                role: user.role
            }
        });
    } catch (error) {
        console.error('Error fetching current user:', error);
        res.status(500).json({ success: false, message: 'Error fetching current user' });
    }
});

app.get("/admindashboard/infosettings", verifyToken, verifyAdmin, (req, res) => {
    res.render("infosettings", {
        user: req.user,
        businessInfo: BUSINESS_INFO
    });
});

app.get("/admindashboard/settings", verifyToken, verifyAdmin, (req, res) => {
    res.redirect("/admindashboard/infosettings");
});

app.get("/admindashboard/stock", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const [lowStockItems, outOfStockItems, stats] = await Promise.all([
            InventoryItem.find({
                itemType: 'raw',
                currentStock: { $lt: CONFIG.LOW_STOCK_THRESHOLD, $gte: 1 },
                isActive: true
            }).sort({ currentStock: 1 }).lean(),
            InventoryItem.find({
                itemType: 'raw',
                currentStock: 0,
                isActive: true
            }).sort({ itemName: 1 }).lean(),
            DashboardStats.getStats()
        ]);
        
        res.render("stock", {
            user: req.user,
            lowStockItems: lowStockItems || [],
            outOfStockItems: outOfStockItems || [],
            stats: stats,
            lowStockThreshold: CONFIG.LOW_STOCK_THRESHOLD,
            businessInfo: BUSINESS_INFO
        });
    } catch (error) {
        console.error('Error loading stock page:', error);
        res.render("stock", {
            user: req.user,
            lowStockItems: [],
            outOfStockItems: [],
            stats: DashboardStats.getDefaultStats(),
            lowStockThreshold: CONFIG.LOW_STOCK_THRESHOLD,
            businessInfo: BUSINESS_INFO
        });
    }
});

app.get("/admindashboard/recipes", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const sampleIngredients = Object.keys(recipeMapping).slice(0, 20);
        const sampleDishes = Object.keys(reverseRecipeMapping).slice(0, 20);
        const menuItems = await MenuItem.find({ isActive: true }).limit(10).lean();
        
        res.render("recipes", {
            user: req.user,
            totalIngredients: Object.keys(recipeMapping).length,
            totalDishes: Object.keys(reverseRecipeMapping).length,
            sampleIngredients,
            sampleDishes,
            menuItemsWithRecipes: menuItems || [],
            businessInfo: BUSINESS_INFO
        });
    } catch (error) {
        console.error('Error loading recipes page:', error);
        res.render("recipes", {
            user: req.user,
            totalIngredients: 0,
            totalDishes: 0,
            sampleIngredients: [],
            sampleDishes: [],
            menuItemsWithRecipes: [],
            businessInfo: BUSINESS_INFO
        });
    }
});

app.get("/admindashboard/customers", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const [customers, stats] = await Promise.all([
            Customer.find().sort({ lastOrderDate: -1 }).limit(50).lean(),
            DashboardStats.getStats()
        ]);
        
        res.render("customers", {
            user: req.user,
            customers: customers || [],
            stats: stats,
            businessInfo: BUSINESS_INFO
        });
    } catch (error) {
        console.error('Error loading customers page:', error);
        res.render("customers", {
            user: req.user,
            customers: [],
            stats: DashboardStats.getDefaultStats(),
            businessInfo: BUSINESS_INFO
        });
    }
});

app.get("/staffdashboard", verifyToken, async (req, res) => {
    try {
        if (req.user.role === "admin") {
            return res.redirect("/admindashboard/dashboard");
        }

        const [menuItems, categories] = await Promise.all([
            MenuItem.find({ 
                status: 'available',
                isActive: true 
            }).sort({ itemName: 1 }).lean(),
            Category.find().lean()
        ]);
        
        res.render("staffdashboard", {
            user: req.user,
            products: menuItems || [],
            categories: categories || [],
            businessInfo: BUSINESS_INFO
        });
    } catch (err) {
        console.error('❌ Staff dashboard error:', err);
        res.render("staffdashboard", {
            user: req.user,
            products: [],
            categories: [],
            businessInfo: BUSINESS_INFO,
            error: "Failed to load menu items"
        });
    }
});

app.get("/requeststocks", verifyToken, async (req, res) => {
    try {
        if (req.user.role === "admin") {
            return res.redirect("/admindashboard/dashboard");
        }

        const menuItems = await MenuItem.find({ 
            isActive: true 
        }).sort({ itemName: 1 }).lean();
        
        res.render("requeststocks", {
            user: req.user,
            products: menuItems || [],
            businessInfo: BUSINESS_INFO
        });
    } catch (err) {
        console.error('❌ Request stocks page error:', err);
        res.render("requeststocks", {
            user: req.user,
            products: [],
            businessInfo: BUSINESS_INFO,
            error: "Failed to load products"
        });
    }
});

app.post("/register", async (req, res) => {
    try {
        const referer = req.headers.referer || req.headers.referrer;
        const isFormSubmission = referer && referer.includes('/admindashboard/addstaff');
        
        if (!isFormSubmission && req.headers['content-type'] && req.headers['content-type'].includes('application/x-www-form-urlencoded')) {
            return res.status(403).send(renderToast('Access denied. Use admin dashboard to register staff.', 'error', '/admindashboard'));
        }

        const { user, pass, role, name, email, phone } = req.body;
        
        if (!user || !pass) {
            return res.status(400).send(renderToast('Username and password are required', 'error'));
        }

        const existingUser = await User.findOne({ username: user });
        if (existingUser) {
            return res.status(409).send(renderToast('User already exists', 'error'));
        }

        const hashedPassword = bcrypt.hashSync(pass, 10);
        const newUser = new User({ 
            username: user, 
            password: hashedPassword, 
            role: role || "staff",
            status: "active",
            name: name || user,
            email: email || `${user}@graycafe.com`,
            phone: phone || ''
        });

        await newUser.save();
        
        res.status(201).send(renderToast('Staff Successfully Registered!', 'success', '/admindashboard/addstaff'));
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).send(renderToast(`Server error: ${err.message}`, 'error'));
    }
});

app.post("/login", async (req, res) => {
    try {
        const { user, pass } = req.body;

        const existingUser = await User.findOne({ username: user });
        if (!existingUser) {
            return res.render("login", {
                error: "User not found",
                businessInfo: BUSINESS_INFO
            });
        }

        if (existingUser.status === "inactive") {
            return res.render("login", {
                error: "Account is deactivated",
                businessInfo: BUSINESS_INFO
            });
        }

        const isMatch = bcrypt.compareSync(pass, existingUser.password);
        if (!isMatch) {
            return res.render("login", {
                error: "Invalid password",
                businessInfo: BUSINESS_INFO
            });
        }

        const token = jwt.sign(
            { 
                id: existingUser._id, 
                username: existingUser.username, 
                role: existingUser.role,
                name: existingUser.name
            },
            process.env.JWT_SECRET,
            { expiresIn: CONFIG.JWT_EXPIRY }
        );

        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "strict",
            maxAge: 1000 * 60 * 60 * 24 * 365
        });

        if (existingUser.role === "admin") {
            return res.redirect("/admindashboard/dashboard");
        } else {
            return res.redirect("/staffdashboard");
        }

    } catch (err) {
        console.error('Login error:', err);
        res.render("login", {
            error: "Login error",
            businessInfo: BUSINESS_INFO
        });
    }
});

const renderToast = (message, type = 'info', redirectUrl = null) => {
    const bgColor = type === 'error' ? '#f8d7da' : type === 'success' ? '#d4edda' : '#d1ecf1';
    const borderColor = type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#0c5460';
    const textColor = type === 'error' ? '#721c24' : type === 'success' ? '#155724' : '#0c5460';
    const icon = type === 'error' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>${type === 'error' ? 'Error' : type === 'success' ? 'Success' : 'Info'}</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .toast { padding: 16px 20px; border-radius: 8px; margin-bottom: 20px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.15); animation: slideInRight 0.5s ease;
                        display: flex; align-items: center; gap: 12px; 
                        background-color: ${bgColor}; color: ${textColor}; border-left: 4px solid ${borderColor}; }
                @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="toast">
                    <span>${icon}</span>
                    <span>${message}</span>
                </div>
            </div>
            <script>
                setTimeout(() => {
                    ${redirectUrl ? `window.location.href = '${redirectUrl}'` : 'history.back()'}
                }, 2500);
            </script>
        </body>
        </html>
    `;
};

app.post("/api/stock-requests", verifyToken, async (req, res) => {
    try {
        console.log('📡 Stock request received. Body:', JSON.stringify(req.body, null, 2));
        let { productId, productName, requestedQuantity, unit, priority, requestedBy, status } = req.body;
        
        console.log('🔍 Before parsing - requestedQuantity:', requestedQuantity, 'Type:', typeof requestedQuantity);
        
        if (requestedQuantity !== null && requestedQuantity !== undefined) {
            requestedQuantity = Number(requestedQuantity);
        }
        
        console.log('🔍 After parsing - requestedQuantity:', requestedQuantity, 'Type:', typeof requestedQuantity);
        console.log('✓ Extracted fields:', { productName, requestedQuantity, unit, priority, isNaN: isNaN(requestedQuantity) });
        
        if (!productName || productName.trim() === '') {
            console.error('❌ Missing productName:', productName);
            return res.status(400).json({ 
                success: false, 
                message: "Missing required field: productName",
                received: { productName, requestedQuantity }
            });
        }
        
        if (requestedQuantity === undefined || requestedQuantity === null || isNaN(requestedQuantity)) {
            console.error('❌ Invalid requestedQuantity:', requestedQuantity);
            return res.status(400).json({ 
                success: false, 
                message: "Missing or invalid required field: requestedQuantity must be a number",
                received: { productName, requestedQuantity }
            });
        }
        
        if (requestedQuantity <= 0) {
            console.error('❌ requestedQuantity must be greater than 0:', requestedQuantity);
            return res.status(400).json({ 
                success: false, 
                message: "requestedQuantity must be greater than 0",
                received: { productName, requestedQuantity }
            });
        }
        
        const existingPendingRequest = await StockRequest.findOne({
            productName: productName,
            status: 'pending'
        });
        
        if (existingPendingRequest) {
            const hoursOld = (Date.now() - new Date(existingPendingRequest.requestDate)) / (1000 * 60 * 60);
            
            if (hoursOld < 24) {
                console.log(`🔄 Updating existing pending request for: ${productName} (${hoursOld.toFixed(1)} hours old)`);
                console.log(`📝 Old quantity: ${existingPendingRequest.requestedQuantity}, New quantity: ${requestedQuantity}`);
                
                existingPendingRequest.requestedQuantity = requestedQuantity;
                existingPendingRequest.requestDate = new Date();
                await existingPendingRequest.save();
                
                return res.status(200).json({
                    success: true,
                    message: `Stock request for ${productName} updated with quantity: ${requestedQuantity}`,
                    updated: true,
                    data: existingPendingRequest,
                    hoursOld: hoursOld
                });
            } else {
                console.log(`🗑️ Removing stale stock request for: ${productName} (${hoursOld.toFixed(1)} hours old)`);
                await StockRequest.deleteOne({ _id: existingPendingRequest._id });
            }
        }
        
        console.log('📦 Creating StockRequest object with:', {
            productName,
            requestedQuantity,
            unit: unit || 'units',
            priority: priority || 'medium'
        });
        
        const requestObj = {
            productName: productName.trim(),
            requestedQuantity: requestedQuantity,
            unit: unit || 'units',
            priority: priority || 'medium',
            requestedBy: requestedBy || 'staff',
            status: status || 'pending',
            requestDate: new Date()
        };
        
        if (productId && productId.trim) {
            productId = productId.trim();
        }
        if (productId) {
            requestObj.productId = productId;
            console.log('📦 Using productId:', productId);
        } else {
            console.log('📦 No productId provided, using productName as identifier');
        }
        
        const stockRequest = new StockRequest(requestObj);
        
        console.log('💾 Attempting to save to MongoDB...');
        await stockRequest.save();
        console.log(`✅ Stock request SAVED to MongoDB: ${productName} x${requestedQuantity} - ID: ${stockRequest._id}`);
        
        const notification = {
            type: 'stock_request',
            title: `📦 Stock Request from Staff`,
            message: `Staff requested ${requestedQuantity} ${unit} of ${productName}`,
            productName: productName,
            requestedQuantity: requestedQuantity,
            unit: unit,
            priority: priority,
            status: 'pending',
            requestId: stockRequest._id,
            timestamp: new Date(),
            data: stockRequest
        };
        
        RealTimeManager.broadcastToAdmins(notification);
        console.log(`📢 Notification broadcasted: Stock request for ${productName}`);
        
        res.status(201).json({
            success: true,
            message: "Stock request submitted successfully",
            data: stockRequest
        });
    } catch (error) {
        console.error("❌ Error creating stock request:", error.message);
        console.error("Error type:", error.constructor.name);
        console.error("Stack trace:", error.stack);
        
        if (error.name === 'ValidationError') {
            const validationErrors = Object.entries(error.errors).map(([field, err]) => ({
                field,
                message: err.message
            }));
            console.error('🔴 Validation errors:', validationErrors);
            
            return res.status(400).json({
                success: false,
                message: "Validation error",
                validationErrors,
                error: error.message
            });
        }
        
        if (error.code === 11000) {
            console.error('🔴 Duplicate key error:', error.keyPattern);
            return res.status(400).json({
                success: false,
                message: "Duplicate request",
                error: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: "Failed to create stock request",
            error: error.message,
            details: error.toString()
        });
    }
});

app.post("/api/stock-requests/fulfill", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { notificationId, productId, productName, quantity, unit, newStock } = req.body;
        
        console.log(`\n📦 ========== FULFILLING STOCK REQUEST ==========`);
        console.log(`Product: ${productName}`);
        console.log(`Quantity: ${quantity} ${unit}`);
        console.log(`New Stock: ${newStock}`);
        console.log(`================================================\n`);
        
        if (!productName || !quantity || quantity <= 0) {
            console.error(`❌ Validation failed: Invalid productName or quantity`);
            return res.status(400).json({
                success: false,
                message: 'productName and quantity (>0) are required'
            });
        }
        
        const stockRequest = await StockRequest.findOne({
            productName: productName,
            status: 'pending'
        });
        
        if (!stockRequest) {
            console.error(`❌ Stock request not found for: ${productName}`);
            return res.status(404).json({
                success: false,
                message: `No pending stock request found for ${productName}`
            });
        }
        
        stockRequest.status = 'fulfilled';
        stockRequest.fulfilledDate = new Date();
        stockRequest.fulfilledQuantity = quantity;
        
        await stockRequest.save();
        console.log(`✅ Stock request marked as fulfilled`);
        
        try {
            const menuItem = await MenuItem.findOne({
                $or: [
                    { name: productName },
                    { itemName: productName },
                    { _id: productId }
                ]
            });
            
            if (menuItem) {
                const oldStock = menuItem.currentStock || 0;
                menuItem.currentStock = quantity;
                await menuItem.save();
                console.log(`✅ Updated menu item stock: ${oldStock} → ${menuItem.currentStock} (SET to requested quantity)`);
            } else {
                console.warn(`⚠️ Menu item not found for: ${productName}`);
            }
        } catch (menuUpdateError) {
            console.error(`❌ Error updating menu item stock:`, menuUpdateError.message);
        }
        
        const stockUpdateNotification = {
            type: 'stock_fulfilled',
            title: `📦 Stock Request Fulfilled`,
            message: `${quantity} ${unit} of ${productName} has been added to inventory`,
            productName: productName,
            quantity: quantity,
            unit: unit,
            newStock: newStock,
            status: 'fulfilled',
            timestamp: new Date(),
            data: stockRequest
        };
        
        RealTimeManager.broadcastToStaff(stockUpdateNotification);
        console.log(`📢 Stock fulfilled notification broadcasted to staff: ${productName}`);
        
        res.status(200).json({
            success: true,
            message: `Stock request fulfilled successfully`,
            data: {
                productName: productName,
                quantity: quantity,
                unit: unit,
                newStock: newStock,
                fulfilledDate: stockRequest.fulfilledDate
            }
        });
        
    } catch (error) {
        console.error("Error fulfilling stock request:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fulfill stock request",
            error: error.message
        });
    }
});

app.delete("/api/stock-requests/clear-old-pending", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const result = await StockRequest.deleteMany({
            status: 'pending',
            requestDate: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });
        
        res.status(200).json({
            success: true,
            message: `Cleared ${result.deletedCount} old pending stock requests`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error("Error clearing old pending requests:", error);
        res.status(500).json({
            success: false,
            message: "Failed to clear old pending requests",
            error: error.message
        });
    }
});

app.delete("/api/stock-requests/clear-all-pending", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const result = await StockRequest.deleteMany({
            status: 'pending'
        });
        
        console.log(`🗑️ Cleared all ${result.deletedCount} pending stock requests`);
        
        res.status(200).json({
            success: true,
            message: `Cleared all ${result.deletedCount} pending stock requests`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error("Error clearing all pending requests:", error);
        res.status(500).json({
            success: false,
            message: "Failed to clear all pending requests",
            error: error.message
        });
    }
});

app.get("/api/stock-requests/debug/pending-list", async (req, res) => {
    try {
        const pendingRequests = await StockRequest.find({ status: 'pending' }).sort({ requestDate: -1 });
        
        res.status(200).json({
            success: true,
            count: pendingRequests.length,
            requests: pendingRequests.map(req => ({
                id: req._id,
                productName: req.productName,
                quantity: req.requestedQuantity,
                requestedAt: req.requestDate,
                hoursOld: ((Date.now() - new Date(req.requestDate)) / (1000 * 60 * 60)).toFixed(1)
            }))
        });
    } catch (error) {
        console.error("Error fetching pending requests:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch pending requests",
            error: error.message
        });
    }
});

app.delete("/api/stock-requests/debug/pending/:productName", async (req, res) => {
    try {
        const result = await StockRequest.deleteOne({
            productName: req.params.productName,
            status: 'pending'
        });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: `No pending request found for ${req.params.productName}`
            });
        }
        
        console.log(`🗑️ Deleted pending request for: ${req.params.productName}`);
        
        res.status(200).json({
            success: true,
            message: `Deleted pending request for ${req.params.productName}`
        });
    } catch (error) {
        console.error("Error deleting pending request:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete pending request",
            error: error.message
        });
    }
});

app.get("/api/stock-requests/pending", verifyToken, async (req, res) => {
    try {
        const pendingRequests = await StockRequest.find({ status: 'pending' })
            .sort({ requestDate: -1 })
            .lean();
        
        res.status(200).json({
            success: true,
            data: pendingRequests
        });
    } catch (error) {
        console.error("Error fetching pending stock requests:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch stock requests",
            error: error.message
        });
    }
});

app.get("/api/stock-requests", verifyToken, async (req, res) => {
    try {
        const query = {};
        if (req.query.status) {
            query.status = req.query.status;
        }
        
        console.log(`📡 Fetching stock requests with query:`, query);
        
        const requests = await StockRequest.find(query)
            .sort({ requestDate: -1 })
            .lean();
        
        console.log(`✅ Found ${requests.length} stock requests`);
        
        res.status(200).json({
            success: true,
            data: requests
        });
    } catch (error) {
        console.error("Error fetching stock requests:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch stock requests",
            error: error.message
        });
    }
});

app.put("/api/stock-requests/:id", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, fulfilledQuantity, notes } = req.body;
        
        const stockRequest = await StockRequest.findByIdAndUpdate(
            id,
            {
                status,
                fulfilledQuantity: fulfilledQuantity || 0,
                fulfilledDate: status === 'fulfilled' ? new Date() : undefined,
                notes: notes || ''
            },
            { new: true }
        );
        
        if (!stockRequest) {
            return res.status(404).json({
                success: false,
                message: "Stock request not found"
            });
        }
        
        console.log(`✅ Stock request updated: ${stockRequest.productName} - Status: ${status}`);
        
        if (status === 'fulfilled') {
            const notification = {
                type: 'stock_request_fulfilled',
                title: `✅ Stock Request Fulfilled`,
                message: `Your request for ${stockRequest.productName} has been fulfilled!`,
                productName: stockRequest.productName,
                productId: stockRequest.productId,
                requestId: stockRequest._id,
                fulfilledQuantity: fulfilledQuantity || stockRequest.requestedQuantity,
                timestamp: new Date()
            };
            
            RealTimeManager.broadcastToStaff(notification);
            console.log(`📢 Fulfillment notification broadcasted: ${stockRequest.productName}`);
        }
        
        res.status(200).json({
            success: true,
            message: "Stock request updated successfully",
            data: stockRequest
        });
    } catch (error) {
        console.error("Error updating stock request:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update stock request",
            error: error.message
        });
    }
});

app.delete("/api/stock-requests/:id", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        const stockRequest = await StockRequest.findByIdAndDelete(id);
        
        if (!stockRequest) {
            return res.status(404).json({
                success: false,
                message: "Stock request not found"
            });
        }
        
        res.status(200).json({
            success: true,
            message: "Stock request deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting stock request:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete stock request",
            error: error.message
        });
    }
});

app.get('/images/default_food.jpg', (req, res) => {
    res.sendFile(path.join(__dirname, 'images', 'default_food.png'));
});

app.get("/logout", (req, res) => {
    res.clearCookie("token");
    res.redirect("/login?logout=true");
});

app.get('/login', (req, res) => {
    res.render('login', { businessInfo: BUSINESS_INFO });
});

app.get('/', (req, res) => {
    const token = req.cookies.token;
    
    if (!token) {
        return res.redirect('/login');
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded.role === 'admin') {
            return res.redirect('/admindashboard/dashboard');
        } else {
            return res.redirect('/staffdashboard');
        }
    } catch (error) {
        res.clearCookie("token");
        return res.redirect('/login');
    }
});

let staffClients = [];

app.post('/api/admin/notify-out-of-stock', verifyToken, async (req, res) => {
    try {
        const { productName, productId, timestamp, notifiedFrom } = req.body;
        
        console.log(`🚨 OUT OF STOCK NOTIFICATION: ${productName} (ID: ${productId})`);
        console.log(`   Notified by: ${notifiedFrom}`);
        console.log(`   Timestamp: ${timestamp}`);
        
        const notification = {
            type: 'out_of_stock_alert',
            severity: 'critical',
            productName: productName,
            productId: productId,
            message: `🚨 ${productName} is OUT OF STOCK!`,
            timestamp: timestamp,
            notifiedFrom: notifiedFrom
        };
        
        RealTimeManager.broadcastToAdmins(notification);
        
        res.json({
            success: true,
            message: `Notification sent to admins about ${productName}`,
            notification: notification
        });
    } catch (error) {
        console.error('❌ Error sending out of stock notification:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending notification',
            error: error.message
        });
    }
});

app.post('/api/staff/inventory/receive', async (req, res) => {
    try {
        const transferData = req.body;
        console.log('📦 Direct staff inventory update:', transferData);
        
        let sentCount = 0;
        staffClients.forEach(client => {
            try {
                client.res.write(`data: ${JSON.stringify(transferData)}\n\n`);
                sentCount++;
            } catch (e) {
                console.error(`❌ Error sending to client ${client.id}:`, e);
            }
        });
        
        res.json({ 
            success: true, 
            message: 'Staff inventory updated',
            clientsNotified: sentCount
        });
    } catch (error) {
        console.error('❌ Error updating staff inventory:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/admin/emit-stock-transfer', async (req, res) => {
    try {
        const transferData = req.body;
        console.log('📡 Emitting stock transfer event to staff:', transferData);
        
        const notification = {
            type: 'stock_transfer',
            action: 'stock_received',
            itemName: transferData.itemName,
            itemId: transferData.itemId,
            quantitySent: transferData.quantitySent,
            unit: transferData.unit,
            newStaffStock: transferData.newStaffStock,
            timestamp: transferData.timestamp,
            transferredBy: transferData.transferredBy
        };
        
        RealTimeManager.broadcastToStaff(notification);
        console.log(`✅ Stock transfer broadcasted to all staff: ${transferData.itemName} x${transferData.quantitySent}`);
        
        res.json({ success: true, message: 'Stock transfer event emitted successfully' });
    } catch (error) {
        console.error('❌ Error emitting stock transfer event:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

const server = http.createServer(app);

const wss = new WebSocketServer({ server, path: '/ws' });

const staffWebSocketConnections = new Set();

// ======================== NOTIFICATION ENDPOINTS ========================

// Send test email to verify Gmail configuration
app.post('/api/notify/test-email', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email address is required'
            });
        }
        
        console.log(`📧 Sending test email to ${email}...`);
        
        const sent = await notificationService.sendTestEmail(email);
        
        if (sent) {
            res.json({
                success: true,
                message: 'Test email sent successfully',
                email: email,
                timestamp: new Date().toLocaleString('en-PH')
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to send test email. Check server logs for details.'
            });
        }
    } catch (error) {
        console.error('❌ Error sending test email:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending test email',
            error: error.message
        });
    }
});

// Send profile update notification
app.post('/api/notify/profile-update', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const user = req.user;
        const { email, fullName, phone } = req.body;
        
        console.log(`📧 Sending profile update email to ${email}...`);
        
        const updatedData = {
            fullName: fullName || user.username,
            email: email,
            phone: phone
        };
        
        const emailSent = await notificationService.sendProfileUpdateEmail(email, updatedData);
        
        // Try to send SMS if phone number is provided
        let smsSent = false;
        if (phone) {
            smsSent = await notificationService.sendSMSToAdmin(
                phone,
                `Hello ${updatedData.fullName}, your profile was updated at ${new Date().toLocaleTimeString('en-PH')}. - G'RAY CAFÉ POS`
            );
        }
        
        res.json({
            success: true,
            message: 'Notifications sent',
            emailSent: emailSent,
            smsSent: smsSent,
            timestamp: new Date().toLocaleString('en-PH')
        });
    } catch (error) {
        console.error('❌ Error sending notification:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending notification',
            error: error.message
        });
    }
});

// Send password change notification
app.post('/api/notify/password-change', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const user = req.user;
        const { email, fullName, phone } = req.body;
        
        console.log(`📧 Sending password change email to ${email}...`);
        
        const emailSent = await notificationService.sendPasswordChangeEmail(email, fullName || user.username);
        
        // Try to send SMS if phone number is provided
        let smsSent = false;
        if (phone) {
            smsSent = await notificationService.sendSMSToAdmin(
                phone,
                `⚠️ Your password was changed at ${new Date().toLocaleTimeString('en-PH')}. If not you, contact admin immediately. - G'RAY CAFÉ POS`
            );
        }
        
        res.json({
            success: true,
            message: 'Password change notifications sent',
            emailSent: emailSent,
            smsSent: smsSent,
            timestamp: new Date().toLocaleString('en-PH')
        });
    } catch (error) {
        console.error('❌ Error sending password change notification:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending password change notification',
            error: error.message
        });
    }
});

// Generic email endpoint
app.post('/api/notify/send-email', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { email, subject, htmlContent } = req.body;
        
        if (!email || !subject || !htmlContent) {
            return res.status(400).json({
                success: false,
                message: 'Email, subject, and content are required'
            });
        }
        
        console.log(`📧 Sending custom email to ${email}...`);
        
        const sent = await notificationService.sendEmailToAdmin(email, subject, htmlContent);
        
        if (sent) {
            res.json({
                success: true,
                message: 'Email sent successfully',
                email: email
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to send email'
            });
        }
    } catch (error) {
        console.error('❌ Error sending custom email:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending email',
            error: error.message
        });
    }
});

// Generic SMS endpoint
app.post('/api/notify/send-sms', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { phone, message } = req.body;
        
        if (!phone || !message) {
            return res.status(400).json({
                success: false,
                message: 'Phone number and message are required'
            });
        }
        
        console.log(`📱 Sending SMS to ${phone}...`);
        
        const sent = await notificationService.sendSMSToAdmin(phone, message);
        
        res.json({
            success: true,
            message: 'SMS notification processed',
            phone: phone,
            sent: sent
        });
    } catch (error) {
        console.error('❌ Error sending SMS:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending SMS',
            error: error.message
        });
    }
});

wss.on('connection', (ws, req) => {
    const url = req.url;
    
    if (url.includes('/ws/staff')) {
        staffWebSocketConnections.add(ws);
        console.log(`✅ Staff WebSocket connected. Total: ${staffWebSocketConnections.size}`);
        
        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message);
                console.log('📨 WebSocket message from staff:', data);
            } catch (e) {
                console.error('Error parsing WebSocket message:', e);
            }
        });
        
        ws.on('close', () => {
            staffWebSocketConnections.delete(ws);
            console.log(`❌ Staff WebSocket disconnected. Total: ${staffWebSocketConnections.size}`);
        });
    }
    
    if (url.includes('/ws/admin')) {
        console.log('✅ Admin WebSocket connected');
        
        ws.on('close', () => {
            console.log('❌ Admin WebSocket disconnected');
        });
    }
});

server.listen(CONFIG.SERVER_PORT, () => {
    console.log(`✅ Server is running at http://localhost:${CONFIG.SERVER_PORT}`);
    console.log(`✅ WebSocket server running on ws://localhost:${CONFIG.SERVER_PORT}/ws`);
});