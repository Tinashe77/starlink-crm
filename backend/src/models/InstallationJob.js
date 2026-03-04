const mongoose = require('mongoose');

const InstallationJobSchema = new mongoose.Schema(
  {
    jobNumber: { type: String, unique: true, index: true },
    contract: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract', required: true, unique: true, index: true },
    assignedTechnician: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['Pending', 'Scheduled', 'In Progress', 'Installed', 'Revisit Required', 'Failed'],
      default: 'Pending',
    },
    scheduledFor: { type: Date },
    startedAt: { type: Date },
    completedAt: { type: Date },
    revisitCount: { type: Number, default: 0, min: 0 },
    revisitReason: { type: String, trim: true },
    failureReason: { type: String, trim: true },
    dishInstalled: { type: Boolean, default: false },
    routerInstalled: { type: Boolean, default: false },
    signalOptimized: { type: Boolean, default: false },
    connectivityTestPassed: { type: Boolean, default: false },
    customerTrainingCompleted: { type: Boolean, default: false },
    installationNotes: { type: String, trim: true },
    proofOfInstallationUrl: { type: String, trim: true },
    customerHandoverConfirmed: { type: Boolean, default: false },
    customerHandoverAt: { type: Date },
    closureNotes: { type: String, trim: true },
    certificateIssued: { type: Boolean, default: false },
    certificateIssuedAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

InstallationJobSchema.pre('save', async function () {
  if (this.jobNumber) return;
  const count = await mongoose.model('InstallationJob').countDocuments();
  this.jobNumber = `UT-INST-${String(count + 1).padStart(4, '0')}`;
});

module.exports = mongoose.model('InstallationJob', InstallationJobSchema);
