import mongoose from 'mongoose';
import dotenv from 'dotenv';
import InventoryItem from './models/InventoryItem.js';

dotenv.config();

// Manually define what we just updated
const recipeMapping = {
    'Chicken': ['Fried Chicken'],
    'Fried chicken': ['Fried Chicken'],
    'Flour': ['Fried Chicken'],
    'Breadcrumbs': ['Fried Chicken'],
    'Egg': ['Fried Chicken'],
    'Cooking oil': ['Fried Chicken'],
    'Salt': ['Fried Chicken'],
    'Black pepper': ['Fried Chicken'],
    'Paprika': ['Fried Chicken'] // might have
};

async function testFriedChickenRecipe() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        console.log('\n🍗 ===== FRIED CHICKEN RECIPE =====\n');
        console.log('When an order for "Fried Chicken" is placed, these ingredients will be deducted:\n');
        
        const ingredients = Object.keys(recipeMapping).filter(ing => recipeMapping[ing].includes('Fried Chicken'));
        
        for (const ingredient of ingredients) {
            const item = await InventoryItem.findOne({ 
                itemName: { $regex: new RegExp(`^${ingredient}$`, 'i') },
                itemType: 'raw'
            });
            
            if (item) {
                console.log(`✅ ${ingredient}`);
                console.log(`   Current: ${item.currentStock} ${item.unit}`);
                console.log(`   Min: ${item.minStock} ${item.unit}\n`);
            } else {
                console.log(`⚠️  ${ingredient} (NOT FOUND IN INVENTORY)\n`);
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
    }
}

testFriedChickenRecipe();
