// models/GeneralRentalPriceModel.js
const mongoose = require('mongoose');

const generalRentalPriceSchema = new mongoose.Schema({
  threeMonthPercentage: {
    type: Number,
    required: true,
    default: 10,
  },
  sixMonthPercentage: {
    type: Number,
    required: true,
    default: 20,
  },
  oneYearPercentage: {
    type: Number,
    required: true,
    default: 30,
  },
});

const GeneralRentalPrice = mongoose.model('GeneralRentalPrice', generalRentalPriceSchema);

module.exports = GeneralRentalPrice;
