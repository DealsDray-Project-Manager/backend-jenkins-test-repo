const mongoose = require("mongoose");

const pricingLogSchema = mongoose.Schema(
  {
    muic_sub: String,
    sp_price: Number,
    mrp_price: Number,
    units_count: String,
  },
  {
    timestamps: true,
  }
);

const pricingLog = mongoose.model("pricingLogs", pricingLogSchema);
module.exports = {
    pricingLog: pricingLog,
};