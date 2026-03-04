const Setting = require('../models/Setting');

const getOrCreateSettings = async () => {
  let settings = await Setting.findOne();

  if (!settings) {
    settings = await Setting.create({});
  }

  return settings;
};

// GET /api/settings
const getSettings = async (req, res) => {
  const settings = await getOrCreateSettings();
  res.json(settings);
};

// PUT /api/settings  (Admin only)
const updateSettings = async (req, res) => {
  const settings = await getOrCreateSettings();

  const fields = [
    'lateFeeAmount',
    'gracePeriodDays',
    'earlySettlementDiscountPercent',
    'ecocashMerchantCode',
  ];

  fields.forEach((field) => {
    if (req.body[field] !== undefined) {
      settings[field] = req.body[field];
    }
  });

  await settings.save();

  res.json({ message: 'Settings updated successfully', settings });
};

module.exports = { getSettings, updateSettings };
