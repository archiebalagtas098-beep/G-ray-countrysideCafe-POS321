import mongoose from "mongoose";

const inventorySnapshotSchema = new mongoose.Schema({
  // Snapshot Date
  snapshotDate: {
    type: Date,
    default: Date.now,
    index: true,
    required: true
  },
  
  // Inventory Summary
  totalItems: {
    type: Number,
    required: true
  },
  
  // Stock Levels
  itemsInStock: {
    type: Number,
    default: 0
  },
  itemsLowStock: {
    type: Number,
    default: 0
  },
  itemsOutOfStock: {
    type: Number,
    default: 0
  },
  
  // Detailed Inventory
  items: [{
    itemName: String,
    itemId: mongoose.Schema.Types.ObjectId,
    category: String,
    currentStock: Number,
    unit: String,
    status: {
      type: String,
      enum: ['in_stock', 'low_stock', 'out_of_stock']
    }
  }],
  
  // Deductions Today
  deductionsToday: {
    type: Number,
    default: 0
  },
  
  // Total Value (if cost data available)
  totalValue: {
    type: Number,
    default: 0
  },
  
  // Notes
  notes: String
  
}, {
  timestamps: true,
  collection: 'inventorySnapshots'
});

// Index for date queries
inventorySnapshotSchema.index({ snapshotDate: -1 });

export default mongoose.models.InventorySnapshot || mongoose.model('InventorySnapshot', inventorySnapshotSchema);
