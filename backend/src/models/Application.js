const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema(
  {
    applicationNo: { type: String, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    package: { type: mongoose.Schema.Types.ObjectId, ref: 'Package', required: true },
    status: {
      type: String,
      enum: ['Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected'],
      default: 'Draft',
    },

    // Section D — Installation Site
    installationSite: {
      address: { type: String, trim: true },
      propertyType: { type: String, trim: true },
      gpsCoordinates: { type: String, trim: true },
      contactPerson: { type: String, trim: true },
      contactNumber: { type: String, trim: true },
      ownership: { type: String, enum: ['Owner', 'Tenant', 'Other'], default: 'Owner' },
      ownershipOther: { type: String, trim: true },
      landlordPermission: { type: Boolean, default: null },
    },

    // Section E — EcoCash
    ecocash: {
      number: { type: String, trim: true },
      registeredName: { type: String, trim: true },
      alternativeNumber: { type: String, trim: true },
      authorizeAutoDeductions: { type: Boolean, default: false },
    },

    // Section G — Diaspora Sponsor
    diasporaSponsor: {
      name: { type: String, trim: true },
      relationship: { type: String, trim: true },
      country: { type: String, trim: true },
      phone: { type: String, trim: true },
      email: { type: String, trim: true, lowercase: true },
    },

    // Section H — Marketing
    hearAboutUs: { type: String, enum: ['Facebook/Social Media', 'Radio', 'Referral', 'Website', 'Other'] },
    referralCode: { type: String, trim: true },

    // Office / review fields
    idVerified: { type: Boolean, default: false },
    ecocashVerified: { type: Boolean, default: false },
    depositReceived: { type: Boolean, default: false },
    depositAmount: { type: Number },
    notes: { type: String, trim: true },
    rejectionReason: { type: String, trim: true },

    submittedAt: { type: Date },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Auto-generate applicationNo before saving
ApplicationSchema.pre('save', async function () {
  if (this.applicationNo) return;
  const count = await mongoose.model('Application').countDocuments();
  const padded = String(count + 1).padStart(4, '0');
  this.applicationNo = `UT-APP-${padded}`;
});

module.exports = mongoose.model('Application', ApplicationSchema);
