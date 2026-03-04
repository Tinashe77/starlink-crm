const mongoose = require('mongoose');

const PackageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, trim: true },
    totalCost: { type: Number, required: true },
    deposit: { type: Number, required: true },
    depositPercent: { type: Number, required: true, min: 0, max: 100 },
    weeklyAmount: { type: Number, required: true },
    weeks: { type: Number, default: 8 },
    type: { type: String, enum: ['Household', 'Business', 'School'], required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Package', PackageSchema);
