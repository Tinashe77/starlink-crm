const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // linked if self-registered
    customerType: { type: String, enum: ['Household', 'Business', 'School'], required: true },

    // Section B — Applicant Info
    fullName: { type: String, required: true, trim: true },
    tradingName: { type: String, trim: true },
    idNumber: { type: String, trim: true },
    dateOfBirth: { type: Date },
    nationality: { type: String, trim: true },
    occupation: { type: String, trim: true },

    // Section C — Contact Details
    physicalAddress: { type: String, trim: true },
    city: { type: String, trim: true },
    province: { type: String, trim: true },
    phonePrimary: { type: String, trim: true, required: true },
    phoneAlternative: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    whatsappNumber: { type: String, trim: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Customer', CustomerSchema);
