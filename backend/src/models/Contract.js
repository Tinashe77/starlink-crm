const mongoose = require('mongoose');

const ContractSchema = new mongoose.Schema(
  {
    contractRef: { type: String, unique: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true, unique: true },
    package: { type: mongoose.Schema.Types.ObjectId, ref: 'Package', required: true },
    totalContractValue: { type: Number, required: true, min: 0 },
    depositAmount: { type: Number, required: true, min: 0 },
    depositPercent: { type: Number, required: true, min: 0, max: 100 },
    weeklyInstallment: { type: Number, required: true, min: 0 },
    durationWeeks: { type: Number, required: true, min: 1, default: 8 },
    depositPaid: { type: Boolean, default: false },
    outstandingBalance: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['Pending Deposit', 'Active', 'In Arrears', 'Default', 'Completed'],
      default: 'Pending Deposit',
    },
    paymentPlanReady: { type: Boolean, default: false },
    activatedAt: { type: Date },
    completedAt: { type: Date },
    agreementDate: { type: Date },
    customerSigned: { type: Boolean, default: false },
    customerSignatureDataUrl: { type: String },
    customerSignatureName: { type: String, trim: true },
    customerSignedAt: { type: Date },
    witnessName: { type: String, trim: true },
    witnessIdNumber: { type: String, trim: true },
    witnessSignedAt: { type: Date },
    notes: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

ContractSchema.pre('save', async function () {
  if (this.contractRef) return;
  const count = await mongoose.model('Contract').countDocuments();
  this.contractRef = `UT-SAG-${String(count + 1).padStart(4, '0')}`;
});

module.exports = mongoose.model('Contract', ContractSchema);
