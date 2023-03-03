const mongoose = require("mongoose");
const tempDeliverySchema = mongoose.Schema({
  tracking_id: {
    type: String,
  },
  order_id: {
    type: String,
    index: true,
  },
  order_date: {
    type: String,
  },
  item_id: {
    type: String,
  },
  gep_order: {
    type: String,
  },
  imei: {
    type: String,
  },
  partner_purchase_price: {
    type: String,
  },
  partner_shop: {
    type: String,
  },
  base_discount: {
    type: String,
  },
  diagnostics_discount: {
    type: String,
  },
  storage_discount: {
    type: String,
  },
  buyback_category: {
    type: String,
  },
  doorstep_diagnostics: {
    type: String,
  },
  delivery_date: {
    type: Date,
  },
  uic_status: {
    type: String,
    default: "Pending",
  },
  uic_code: {
    code: String,
    user: String,
    created_at: {
      type: Date,
    },
  },
  created_at: {
    type: Date,
  },
  download_time: {
    type: Date,
  },
  old_uic:{
    type:String
  }

});

const tempDelivery = mongoose.model("tempDelivery", tempDeliverySchema);
module.exports = {
    tempDelivery: tempDelivery,
};
