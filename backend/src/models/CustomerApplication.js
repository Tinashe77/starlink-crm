const mongoose = require('mongoose');

const CustomerApplicationSchema = new mongoose.Schema(
  {
    applicationNumber: { type: String, unique: true, index: true },
    customerType: {
      type: String,
      enum: ['Individual/Household', 'Business/Company', 'School/Institution'],
      required: true,
    },
    fullName: { type: String, required: true, trim: true },
    tradingName: { type: String, trim: true },
    idNumber: { type: String, trim: true },
    dateOfBirthOrIncorporation: { type: Date },
    nationality: { type: String, trim: true },
    occupation: { type: String, trim: true },
    physicalAddress: { type: String, trim: true },
    city: { type: String, trim: true },
    province: { type: String, trim: true },
    mobilePrimary: { type: String, trim: true },
    mobileAlternative: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    whatsappNumber: { type: String, trim: true },
    installationAddress: { type: String, trim: true },
    propertyType: { type: String, trim: true },
    gpsCoordinates: { type: String, trim: true },
    siteContactPerson: { type: String, trim: true },
    siteContactNumber: { type: String, trim: true },
    propertyOwnership: {
      type: String,
      enum: ['Owner', 'Tenant', 'Other'],
      default: 'Owner',
    },
    propertyOwnershipOther: { type: String, trim: true },
    landlordPermission: { type: Boolean },
    ecocashRegisteredNumber: { type: String, trim: true },
    ecocashRegisteredName: { type: String, trim: true },
    alternativePaymentNumber: { type: String, trim: true },
    autoDeductionAuthorized: { type: Boolean, default: false },
    packageName: {
      type: String,
      enum: ['Diaspora Connect', 'Business Essential', 'EduConnect (Schools)', 'Business Premium'],
      required: true,
    },
    sponsorFullName: { type: String, trim: true },
    sponsorRelationship: { type: String, trim: true },
    sponsorCountry: { type: String, trim: true },
    sponsorPhone: { type: String, trim: true },
    sponsorEmail: { type: String, trim: true, lowercase: true },
    referralSource: {
      type: String,
      enum: ['Facebook/Social Media', 'Radio', 'Referral', 'Website', 'Other', ''],
      default: '',
    },
    referralSourceOther: { type: String, trim: true },
    referralCode: { type: String, trim: true },
    declarationAccepted: { type: Boolean, default: false },
    signatureName: { type: String, trim: true },
    signatureDate: { type: Date },
    signaturePlace: { type: String, trim: true },
    officeReceivedBy: { type: String, trim: true },
    officeDateReceived: { type: Date },
    officeIdVerified: { type: Boolean },
    officeEcocashVerified: { type: Boolean },
    officeDepositReceived: { type: Boolean },
    officeDepositAmount: { type: Number, min: 0 },
    status: {
      type: String,
      enum: ['Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected'],
      default: 'Submitted',
    },
    linkedCustomer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    linkedApplication: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Auto-generate applicationNumber before first save
CustomerApplicationSchema.pre('save', async function () {
  if (this.applicationNumber) return;
  const count = await mongoose.model('CustomerApplication').countDocuments();
  this.applicationNumber = `UT-APP-${String(count + 1).padStart(4, '0')}`;
});

module.exports = mongoose.model('CustomerApplication', CustomerApplicationSchema);
