const mongoose = require("mongoose");

const productSchema = mongoose.Schema({
  vendor_sku_id: {
    type: String,
    index:true
  },
  brand_name: {
    type: String,
  },
  model_name: {
    type: String,
  },
  vendor_name: {
    type: String,
  },
  image: {
    type: String,
  },
  muic: {
    type: String,
  },
  item: [
    {
      tracking_id: String,
      bot_agent: String,
      tray_id: String,
      uic: String,
      closed_time: Date,
      wht_tray: String,
      status:String
    },
  ],
  wht_tray: {
    type: Array,
  },
  pick_list_status: {
    type: String,
    default: "Pending",
  },
  count_assigned_tray: {
    type: Number,
    default: 0,
  },
  created_at: {
    type: Date,
    default: Date.now(),
  },
  pick_list_id: {
    type: String,
  },
  pick_list_items:{
    type:Number,
    default: 0,
  }
});

const products = mongoose.model("product", productSchema);
module.exports = {
  products: products,
};
