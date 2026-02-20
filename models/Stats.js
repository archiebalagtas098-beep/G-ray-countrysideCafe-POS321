import mongoose from "mongoose";

const statsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true,
    index: true,
    default: () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today;
    }
  },
  totalOrders: {
    type: Number,
    default: 0,
    min: 0
  },
  totalRevenue: {
    type: Number,
    default: 0,
    min: 0
  },
  totalProfit: {
    type: Number,
    default: 0
  },
  todayOrders: {
    type: Number,
    default: 0,
    min: 0
  },
  todayRevenue: {
    type: Number,
    default: 0,
    min: 0
  },
  todayProfit: {
    type: Number,
    default: 0
  },
  totalCustomers: {
    type: Number,
    default: 0,
    min: 0
  },
  averageOrderValue: {
    type: Number,
    default: 0,
    min: 0
  },
  topProduct: String,
  topProductQuantity: {
    type: Number,
    default: 0
  },
  paymentMethods: {
    cash: {
      type: Number,
      default: 0,
      min: 0
    },
    gcash: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  orderTypes: {
    dineIn: {
      type: Number,
      default: 0,
      min: 0
    },
    takeOut: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  status: {
    type: String,
    enum: ['active', 'archived'],
    default: 'active',
    index: true
  }
}, { 
  collection: 'stats',
  timestamps: true 
});

// Index for efficient queries
statsSchema.index({ date: 1 });
statsSchema.index({ status: 1, date: -1 });

export default mongoose.models.Stats || mongoose.model('Stats', statsSchema);