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
  quantity: {
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
  spn_number:{
    type:String
  },
  muic:{
    type:String
  },
  quanitity:{
    type:String
  }
});

const purchaseOrderPlaced = mongoose.model("PrOrderPlaced", prOrderPlacedSchema);
module.exports = {
    purchaseOrderPlaced: purchaseOrderPlaced
    
};
