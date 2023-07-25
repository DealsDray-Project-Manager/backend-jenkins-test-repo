const mongoose = require("mongoose");

const prOrderPlacedSchema = mongoose.Schema({
  poid: {
    type: String,
  },
  placed_date: {
    type: Date,
  },
  vendor_id: {
    type: String,
  },
  quanitity: {
    type: String,
  },
  total_price: {
    type: String,
  },
  per_unit: {
    type: Number,
  },
  status: {
    type: String,
    default: "Pending",
  },
  payment_terms:{
    type:String
  },
  warranty_terms:{
    type:String
  },
  updated_at: {
    type: Date,
  },
});

const purchaseOrder = mongoose.model("PrOrderPlaced", prOrderPlacedSchema);
module.exports = {
  prOrderPlacedSchema: prOrderPlacedSchema,
};
