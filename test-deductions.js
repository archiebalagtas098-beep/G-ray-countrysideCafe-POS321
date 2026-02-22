import mongoose from 'mongoose';
import dotenv from 'dotenv';
import MenuItem from './models/Menuitem.js';
import InventoryItem from './models/InventoryItem.js';
import Order from './models/Order.js';

dotenv.config();

async function testDeductions() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected\n');

        // 1. Get all menu items
        console.log('📋 ===== MENU ITEMS =====');
        const menuItems = await MenuItem.find({ isActive: true }).limit(10);
        menuItems.forEach((item, idx) => {
            console.log(`${idx + 1}. ${item.itemName} (${item.name})`);
        });

        // 2. Get all raw ingredients
        console.log('\n🧂 ===== RAW INGREDIENTS =====');
        const ingredients = await InventoryItem.find({ itemType: 'raw', isActive: true }).limit(25);
        ingredients.forEach((item, idx) => {
            console.log(`${idx + 1}. ${item.itemName}: ${item.currentStock} ${item.unit} (Min: ${item.minStock}, Max: ${item.maxStock})`);
        });

        // 3. Check recent orders
        console.log('\n📦 ===== RECENT ORDERS =====');
        const orders = await Order.find().sort({ createdAt: -1 }).limit(5);
        orders.forEach((order, idx) => {
            console.log(`\n${idx + 1}. Order #${order.orderNumber}`);
            console.log(`   Items: ${order.items.map(i => i.name).join(', ')}`);
            console.log(`   Total: ₱${order.total}`);
            console.log(`   Created: ${order.createdAt.toLocaleString('en-PH')}`);
        });

        // 4. Check usage history for a few ingredients
        console.log('\n📊 ===== USAGE HISTORY (Last 3 ingredients with history) =====');
        const ingredientsWithHistory = await InventoryItem.find({ 
            itemType: 'raw',
            'usageHistory.0': { $exists: true }
        }).limit(3);

        for (const ingredient of ingredientsWithHistory) {
            console.log(`\n${ingredient.itemName}:`);
            console.log(`  Current Stock: ${ingredient.currentStock} ${ingredient.unit}`);
            console.log(`  Total Usage Records: ${ingredient.usageHistory.length}`);
            
            // Show last 3 records
            const lastRecords = ingredient.usageHistory.slice(-3).reverse();
            lastRecords.forEach((record, idx) => {
                console.log(`    ${idx + 1}. -${record.quantity} ${ingredient.unit} | ${record.notes} | By: ${record.usedBy} | ${new Date(record.date).toLocaleString('en-PH')}`);
            });
        }

        console.log('\n✅ Diagnostic complete!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
    }
}

testDeductions();
