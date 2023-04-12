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
  bot_done_received: {
    type: Date,
  },
  charging_done_received: {
    type: Date,
  },
  bqc_done_received: {
    type: Date,
  },
  charging_done_close: {
    type: Date,
  },
  bqc_done_close: {
    type: Date,
  },
  received_from_sorting: {
    type: Date,
  },
  closed_from_sorting: {
    type: Date,
  },
  charging: {
    type: Object,
  },
  bot_report: {
    type: Object,
  },
  bqc_report: {
    type: Object,
  },
  bqc_software_report: {
    type: Object,
  },
  issued_to_audit: {
    type: Date,
  },
  audit_user_name: {
    type: String,
  },
  audit_report: {
    type: Object,
  },
  audit_done_date: {
    type: Date,
  },
  audit_done_recieved: {
    type: Date,
  },
  audit_done_close: {
    type: Date,
  },
  sales_bin_date: {
    type: Date,
  },
  sales_bin_status: {
    type: String,
  },
  sales_bin_grade: {
    type: String,
  },
  sales_bin_wh_agent_name: {
    type: String,
  },
  sales_bin_desctiption: {
    type: String,
  },

  issued_to_rdl_fls_one_date: {
    type: Date,
  },
  pickup_request_sent_to_wh_date: {
    type: Date,
  },
  audit_done_close: {
    type: Date,
  },
  rdl_fls_one_user_name: {
    type: String,
  },
  rdl_fls_issued_date: {
    type: Date,
  },
  rdl_fls_closed_date: {
    type: Date,
  },
  rdl_fls_done_recieved_date: {
    type: Date,
  },
  rdl_fls_done_closed_wh: {
    type: Date,
  },
  rdl_fls_one_report: {
    type: Object,
  },
  ctx_tray_id: {
    type: String,
  },
  ctx_tray_transferTo_sales_date: {
    type: Date,
  },
  ctx_tray_receive: {
    type: Date,
  },
  ctx_tray_receive_and_close_wh: {
    type: Date,
  },
  stx_tray_id: {
    type: String,
  },
  temp_delivery_status:{
    type:String
  }

});

const delivery = mongoose.model("delivery", deliverySchema);
module.exports = {
  delivery: delivery,
};
