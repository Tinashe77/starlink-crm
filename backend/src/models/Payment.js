const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema(
  {
    receiptNumber: { type: String, unique: true, index: true },
    contract: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract', required: true, index: true },
    scheduleItem: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentScheduleItem', required: true, index: true },
    amount: { type: Number, required: true, min: 0.01 },
    paymentDate: { type: Date, required: true, default: Date.now },
    paymentMethod: {
      type: String,
      enum: ['EcoCash', 'Cash', 'Bank Transfer', 'Card', 'Other'],
      default: 'EcoCash',
    },
    ecocashReference: { type: String, trim: true },
    notes: { type: String, trim: true },
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['Captured', 'Voided'],
      default: 'Captured',
      index: true,
    },
    voidReason: { type: String, trim: true },
    voidedAt: { type: Date },
    voidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

PaymentSchema.pre('save', async function () {
  if (this.receiptNumber) return;
  const count = await mongoose.model('Payment').countDocuments();
  this.receiptNumber = `UT-RCP-${String(count + 1).padStart(5, '0')}`;
});

module.exports = mongoose.model('Payment', PaymentSchema);
