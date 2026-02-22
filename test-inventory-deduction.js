/**
 * 🧪 TEST SCRIPT: Raw Ingredient Inventory Deduction
 * 
 * This script tests the automatic deduction of raw ingredients from inventory
 * when menu items are ordered through the POS system.
 * 
 * Usage: node test-inventory-deduction.js
 * 
 * Requirements:
 * - Server must be running: npm run dev
 * - MongoDB must be connected
 * - Test should be run AFTER server restart to load inventory data
 */

import mongoose from 'mongoose';
import InventoryItem from './models/InventoryItem.js';
import MenuItem from './models/Menuitem.js';
import Order from './models/Order.js';
import { connectDB } from './config/database.js';

console.log('\n📊 RAW INGREDIENT INVENTORY DEDUCTION TEST');
console.log('='.repeat(50));

async function testInventoryDeduction() {
    try {
        // Connect to database
        console.log('\n🔗 Connecting to MongoDB...');
        await connectDB();
        console.log('✅ Connected to MongoDB');

        // 1️⃣ CHECK INITIAL INGREDIENT STOCK
        console.log('\n📋 Step 1: Checking initial ingredient stock...');
        
        const testIngredients = ['Pork', 'Garlic', 'Onion', 'Cooking oil', 'Salt'];
        const ingredientsBefore = {};
        
        for (const ingredient of testIngredients) {
            const item = await InventoryItem.findOne({
                itemName: { $regex: new RegExp(`^${ingredient}$`, 'i') },
                itemType: 'raw',
                isActive: true
            });
            
            if (item) {
                ingredientsBefore[ingredient] = {
                    stock: item.currentStock,
                    unit: item.unit,
                    status: item.status,
                    minStock: item.minStock
                };
                console.log(`  ✓ ${ingredient}: ${item.currentStock} ${item.unit} [${item.status}]`);
            } else {
                console.log(`  ⚠️ ${ingredient}: NOT FOUND IN INVENTORY`);
            }
        }

        // 2️⃣ FIND A MENU ITEM THAT USES THESE INGREDIENTS
        console.log('\n📋 Step 2: Finding menu item with required ingredients...');
        
        const testDish = 'Sizzling Pork Sisig'; // Uses: Pork, Garlic, Onion, Egg, Mayonnaise, Soy sauce, Cooking oil, Salt, Calamansi
        const menuItem = await MenuItem.findOne({
            itemName: { $regex: new RegExp(`^${testDish}$`, 'i') }
        });
        
        if (!menuItem) {
            console.log(`  ❌ Menu item "${testDish}" not found in database`);
            console.log('     Available menu items:');
            const items = await MenuItem.find({ isActive: true }).select('itemName').limit(10);
            items.forEach(item => console.log(`       - ${item.itemName}`));
            return;
        }
        
        console.log(`  ✓ Found menu item: ${testDish}`);
        console.log(`    Price: ₱${menuItem.price}`);
        console.log(`    Category: ${menuItem.category}`);

        // 3️⃣ SIMULATE ORDER CREATION
        console.log('\n📋 Step 3: Simulating order creation...');
        console.log('  (In real scenario, this would be done through /api/orders endpoint)');
        
        // Note: In a real test, you would make a POST request to /api/orders
        // For now, we'll just show what SHOULD happen
        console.log(`  📦 Order Item: ${testDish} (Quantity: 1)`);
        console.log(`  💰 Price: ₱${menuItem.price}`);
        console.log(`  📍 Expected ingredients to deduct: Pork, Garlic, Onion, Egg, Mayonnaise, Soy sauce, Cooking oil, Salt, Calamansi`);

        // 4️⃣ CHECK RECENT ORDERS
        console.log('\n📋 Step 4: Checking recent orders...');
        
        const recentOrders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('orderNumber items createdAt');
        
        if (recentOrders.length > 0) {
            console.log(`  Found ${recentOrders.length} recent orders:`);
            recentOrders.forEach(order => {
                console.log(`    📄 Order #${order.orderNumber} (${order.items.length} items) - ${order.createdAt.toLocaleString('en-PH')}`);
                order.items.forEach(item => {
                    console.log(`       - ${item.name} × ${item.quantity}`);
                });
            });
        } else {
            console.log('  ℹ️ No orders found in database yet');
        }

        // 5️⃣ CHECK USAGE HISTORY
        console.log('\n📋 Step 5: Checking ingredient usage history...');
        
        for (const ingredient of testIngredients) {
            const item = await InventoryItem.findOne({
                itemName: { $regex: new RegExp(`^${ingredient}$`, 'i') },
                itemType: 'raw',
                isActive: true
            }).lean();
            
            if (item && item.usageHistory && item.usageHistory.length > 0) {
                console.log(`  📜 ${ingredient} Usage History (last 3 entries):`);
                item.usageHistory
                    .sort((a, b) => b.date - a.date)
                    .slice(0, 3)
                    .forEach(record => {
                        console.log(`     - Quantity: ${record.quantity}, Notes: ${record.notes}`);
                        console.log(`       Used by: ${record.usedBy}, Date: ${record.date.toLocaleString('en-PH')}`);
                    });
            }
        }

        // 6️⃣ TEST INSTRUCTIONS
        console.log('\n📋 Step 6: MANUAL TEST INSTRUCTIONS');
        console.log('='.repeat(50));
        console.log('\n1. Make sure the POS system is running: npm run dev');
        console.log('\n2. Open the staff dashboard and place an order with:');
        console.log(`   - Menu Item: ${testDish}`);
        console.log('   - Quantity: 1');
        console.log('   - Payment Method: Cash');
        console.log('\n3. Complete the order payment in the POS system');
        console.log('\n4. Run this test script again to verify ingredient deduction:');
        console.log('   node test-inventory-deduction.js');
        console.log('\n5. Expected result:');
        console.log('   ✅ All required ingredients should show reduced stock');
        console.log('   ✅ Usage history should show new entry for the order');
        console.log('   ✅ Low/out-of-stock status should update if needed');

        console.log('\n' + '='.repeat(50));
        console.log('✅ TEST SCRIPT COMPLETE\n');

    } catch (error) {
        console.error('❌ Error during test:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
    }
}

// Run the test
testInventoryDeduction();
