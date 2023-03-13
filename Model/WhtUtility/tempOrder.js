const mongoose = require("mongoose");

const tempOrdersSchema = mongoose.Schema({
  order_id: {
    type: String,
  },
  order_date: {
    type: Date,
  },
  order_timestamp: {
    type: Date,
  },
  order_status: {
    type: String,
  },
  buyback_category: {
    type: String,
  },
  partner_id: {
    type: String,
  },
  partner_email: {
    type: String,
  },
  partner_shop: {
    type: String,
  },
  item_id: {
    type: String,
    index: true,
  },
  old_item_details: {
    type: String,
  },
  imei: {
    type: String,
  },
  gep_order: {
    type: String,
  },
  base_discount: {
    type: Number,
  },
  diagnostic: {
    type: String,
  },
  partner_purchase_price: {
    type: String,
  },
  tracking_id: {
    type: String,
  },
  delivery_date: {
    type: Date,
  },
  vedor_name:{
    type:String
  },
  
  delivery_status: {
    type: String,
    default: "Pending",
  },
  created_at: {
    type: Date,
  },
  type:{
    type:String
  }
});

const tempOrders = mongoose.model("tempOrders", tempOrdersSchema);
module.exports = {
    tempOrders: tempOrders,
};
