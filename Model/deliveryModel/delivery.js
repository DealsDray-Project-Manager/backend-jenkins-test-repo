const mongoose = require("mongoose");
const deliverySchema = mongoose.Schema({
  tracking_id: {
    type: String,
  },
  order_id: {
    type: String,
    index: true,
  },
  order_date: {
    type: Date,
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
    type: Number,
  },
  partner_shop: {
    type: String,
  },
  base_disscount: {
    type: Number,
  },
  diagnostics_discount: {
    type: Number,
  },
  storage_discount: {
    type: Number,
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
  stockin_date: {
    type: Date,
  },
  bag_id: {
    type: String,
  },
  agent_name: {
    type: String,
  },
  agent_name_charging: {
    type: String,
  },
  agent_name_bqc: {
    type: String,
  },
  tray_id: {
    type: String,
  },
  assign_to_agent: {
    type: Date,
  },
  assign_to_agent_charging: {
    type: Date,
  },
  assign_to_agent_bqc: {
    type: Date,
  },
  stock_in_status: {
    type: String,
  },
  bag_close_date: {
    type: Date,
  },
  warehouse_close_date: {
    type: Date,
  },
  tray_status: {
    type: String,
  },
  tray_type: {
    type: String,
  },
  tray_location: {
    type: String,
  },
  tray_closed_by_bot: {
    type: Date,
  },
  // pick_list_status: {
  //   type: String,
  //   default: "Pending",
  // },
  handover_sorting_date: {
    type: Date,
  },
  sorting_agent_name: {
    type: String,
  },
  wht_tray: {
    type: String,
  },
  wht_tray_assigned_date: {
    type: Date,
  },
  tray_close_wh_date: {
    type: Date,
  },
  charging_in_date: {
    type: Date,
  },
  charging_done_date: {
    type: Date,
  },
  bqc_in_date: {
    type: Date,
  },
  bqc_out_date: {
    type: Date,
  },
  bot_done_received:{
    type:Date
  },
  charging_done_received:{
    type:Date
  },
  bqc_done_received:{
    type:Date
  },
  charging_done_close:{
    type:Date
  },
  bqc_done_close:{
    type:Date
  }
});

const delivery = mongoose.model("delivery", deliverySchema);
module.exports = {
  delivery: delivery,
};
