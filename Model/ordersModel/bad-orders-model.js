const mongoose = require("mongoose");

const bardOrdersSchema = mongoose.Schema({
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
  order_id_replaced: {
    type: Number,
  },
  deliverd_with_otp: {
    type: String,
  },
  deliverd_with_bag_exception: {
    type: String,
  },
  gc_amount_redeemed: {
    type: Number,
  },
  gc_amount_refund: {
    type: Number,
  },
  gc_redeem_time: {
    type: Date,
  },
  gc_amount_refund_time: {
    type: Date,
  },
  diagnstic_status: {
    type: String,
  },
  vc_eligible: {
    type: String,
  },
  customer_declaration_physical_defect_present: {
    type: String,
  },
  customer_declaration_physical_defect_type: {
    type: String,
  },
  partner_price_no_defect: {
    type: String,
  },
  revised_partner_price: {
    type: String,
  },
  delivery_fee: {
    type: String,
  },
  exchange_facilitation_fee: {
    type: String,
  },
  delivery_status: {
    type: String,
    default: "Pending",
  },
  created_at: {
    type: Date,
  },
  reason:{
    type:Array
}
});

const badOrders = mongoose.model("badOrders", bardOrdersSchema);
module.exports = {
  badOrders: badOrders,
};
