const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema(
  {
    lateFeeAmount: { type: Number, default: 0, min: 0 },
    gracePeriodDays: { type: Number, default: 0, min: 0 },
    earlySettlementDiscountPercent: { type: Number, default: 0, min: 0, max: 100 },
    ecocashMerchantCode: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Setting', SettingSchema);
