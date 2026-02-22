/**
 * 🧹 Clean up Test Data - Remove Test Deductions
 * Clears test_user deductions from Pork, Garlic, Onion
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import InventoryItem from './models/InventoryItem.js';
import { connectDB } from './config/database.js';

async function cleanupTestData() {
    try {
        await connectDB();
        console.log('✅ Connected to MongoDB\n');

        const ingredients = ['Pork', 'Garlic', 'Onion'];

        for (const ingredientName of ingredients) {
            const item = await InventoryItem.findOne({ itemName: ingredientName });
            
            if (item) {
                console.log(`\n🧹 Cleaning: ${ingredientName}`);
                console.log(`   Before: ${item.usageHistory.length} records`);
                
                // Remove test_user deductions
                const beforeCount = item.usageHistory.length;
                item.usageHistory = item.usageHistory.filter(record => record.usedBy !== 'test_user');
                const afterCount = item.usageHistory.length;
                const removed = beforeCount - afterCount;
                
                if (removed > 0) {
                    console.log(`   Removed: ${removed} test records`);
                    console.log(`   After: ${afterCount} records`);
                    await item.save();
                    console.log(`   ✅ Saved to database`);
                } else {
                    console.log(`   ℹ️ No test records found`);
                }
            }
        }

        console.log('\n\n✅ TEST DATA CLEANUP COMPLETE!\n');
        console.log('Now create REAL deductions by:');
        console.log('  1. Creating new menu items in Menu Management');
        console.log('  2. Placing orders in Staff Dashboard');
        console.log('  3. Watch ingredients reduce in Inventory Dashboard');

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

cleanupTestData();
