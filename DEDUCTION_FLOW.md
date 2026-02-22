# 🔄 COMPLETE INGREDIENT DEDUCTION FLOW

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ STAFF POS SYSTEM - Customer Places Order                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ currentOrder Array Structure (FIXED)                             │
│                                                                  │
│ {                                                                │
│   id: "product_id",                        ✅ ADDED             │
│   itemName: "Korean Spicy Bulgogi (Pork)", ✅ CRITICAL          │
│   name: "Korean Spicy Bulgogi (Pork)",                          │
│   price: 380,                                                    │
│   quantity: 1,                                                   │
│   image: "bulgogi.jpg",                    ✅ ADDED             │
│   vatable: true,                           ✅ ADDED             │
│   size: "Regular"                          ✅ ADDED             │
│ }                                                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Payment & Order Submission (staff.js)                            │
│ - Validates payment amount                                       │
│ - Creates orderPayload with proper itemName                      │
│ - Sends to /api/orders endpoint                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ SERVER: POST /api/orders (server.js line ~2180)                 │
│                                                                  │
│ ✅ STEP 1: Process Items                                        │
│    - Extract itemName from order                                 │
│    - Build processedItems array with proper names               │
│                                                                  │
│ ✅ STEP 2: Create Order in MongoDB                              │
│    - Save order with all items                                   │
│    - Generate receipt                                            │
│                                                                  │
│ ✅ STEP 3: Deduct Raw Ingredients (NEWLY ENABLED)               │
│    - For each processedItem:                                     │
│      a) Look up recipe: reverseRecipeMapping[itemName]           │
│      b) Case-insensitive matching if not found                   │
│      c) Get required ingredients list                            │
│      d) For each ingredient:                                     │
│         - Find in MongoDB InventoryItem collection               │
│         - Reduce currentStock by order quantity                  │
│         - Update status field                                    │
│         - Add to usageHistory                                    │
│         - Save to MongoDB                                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ MONGODB UPDATES                                                  │
│                                                                  │
│ Collection: orders                                               │
│ ├─ New order document created ✅                                 │
│ └─ Items array contains order details                            │
│                                                                  │
│ Collection: inventoryItems                                       │
│ ├─ Pork: 99 → 98 kg ✅                                           │
│ ├─ Garlic: 99 → 98 kg ✅                                         │
│ ├─ Onion: 99 → 98 kg ✅                                          │
│ ├─ usageHistory: [                                               │
│ │   {                                                            │
│ │     quantity: 1,                                               │
│ │     notes: "Deducted for order #ORD-20260222-0001...",        │
│ │     usedBy: "admin",                                           │
│ │     date: 2026-02-22T08:15:30Z                                 │
│ │   }                                                            │
│ │ ]                                                              │
│ └─ status: "in_stock" or "low_stock" or "out_of_stock"           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ RESULT: Inventory Page Shows Updated Stock                       │
│                                                                  │
│ Before Order:                    After Order:                    │
│ Pork: 99 kg          ──────→     Pork: 98 kg                     │
│ Status: In Stock                 Status: In Stock                │
│ Usage: 0 records                 Usage: 1 record (order #...)    │
└─────────────────────────────────────────────────────────────────┘
```

## Example: Placing Order for "Korean Spicy Bulgogi (Pork)"

### Recipe Mapping
```javascript
recipeMapping['Korean Spicy Bulgogi (Pork)'] = [
  'Pork',
  'Rice',
  'Garlic',
  'Onion',
  'Chili',
  'Soy sauce',
  'Gochujang',
  'Sesame oil',
  'Salt',
  'Black pepper',
  'Cooking oil',
  'Napkins',
  'Food containers'
]
```

### Reverse Mapping
```javascript
reverseRecipeMapping['Korean Spicy Bulgogi (Pork)'] = [
  'Pork',
  'Rice',
  'Garlic',
  ...
]
```

### Order Process
1. Customer orders 1x Korean Spicy Bulgogi (Pork)
2. Order saved to MongoDB
3. System loops through 13 required ingredients
4. Each ingredient in inventory is reduced by 1 unit:
   - Pork: 100 → 99 kg
   - Rice: 100 → 99 kg
   - Garlic: 100 → 99 kg
   - Onion: 100 → 99 kg
   - Chili: 100 → 99 kg
   - ... and so on
5. Each ingredient's `usageHistory` is updated with deduction details
6. Each ingredient's `status` is re-evaluated

---

## Key Points

### ✅ What Now Works
- Items sent from frontend include `itemName`
- Server properly matches menu items to recipes
- Ingredients are found even with naming variations
- Stock is reduced correctly in MongoDB
- Usage history is recorded with order number
- Status is updated based on new stock levels

### ⚠️ Important Notes
- **Menu items MUST be in recipeMapping** for deduction to work
- **Inventory items MUST match recipe names** (case-insensitive)
- **usageHistory tracks ALL deductions** with order details
- **MongoDB is the source of truth** for inventory data

### 🔍 How to Verify It's Working

**Check MongoDB:**
```javascript
// Check inventory item stock after order
db.inventoryItems.findOne({ itemName: "Pork" })
// Should show: currentStock: 98, usageHistory with latest order

// Check order was saved
db.orders.findOne({ orderNumber: "ORD-20260222-0001" })
// Should show items with proper names
```

**Check Browser Console:**
```
🧂 Processing raw ingredient deductions...
🧂 DEBUG: reverseRecipeMapping has 30 dishes
🔍 Looking for recipe for item: "Korean Spicy Bulgogi (Pork)"
🔗 Deducting ingredients for: Korean Spicy Bulgogi (Pork) (Qty: 1) | Required: [Pork, Rice, ...]
  ✓ Pork: 100 → 99 kg [in_stock]
  ✓ Rice: 100 → 99 kg [in_stock]
  ✓ Garlic: 100 → 99 kg [in_stock]
  ...
```

---

**Last Updated:** February 22, 2026  
**Status:** ✅ Production Ready
