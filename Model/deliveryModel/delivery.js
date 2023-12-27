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
  old_item_details: {
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
    code: {
      type: String,
      index: true,
    },
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
  updated_at: { type: Date, default: Date.now },
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
  rp_bqc_software_report: {
    type: Object,
  },
  bqc_software_report_xml: {
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

  issued_to_agent_for_pickup: {
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
  rdl_fls_done_units_date:{
    type:Date
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
  temp_delivery_status: {
    type: String,
  },
  item_moved_to_billed_bin: {
    type: String,
  },
  item_moved_to_billed_bin_date: {
    type: Date,
  },
  item_moved_to_billed_bin_done_username: {
    type: String,
  },
  issued_to_wht_to_rp: {
    type: Date,
  },
  wht_to_rp_sorting_agent: {
    type: String,
  },
  rp_tray: {
    type: String,
  },
  wht_to_rp_sorting_done: {
    type: Date,
  },
  wht_to_rp_sorting_done_received: {
    type: Date,
  },
  wht_to_rp_sorting_done_wh_closed: {
    type: Date,
  },
  unverified_imei_status: {
    type: String,
  },
  rdl_two_user_name: {
    type: String,
  },
  issued_to_rdl_two_date: {
    type: Date,
  },
  rdl_two_closed_date_units: Date,
  rdl_two_closed_date: {
    type: Date,
  },
  rdl_two_report: {
    type: Object,
  },
  received_from_rdl_two: {
    type: Date,
  },
  rdl_two_done_close_by_warehouse: {
    type: Date,
  },
  price_from_pricing_agent: {
    type: String,
  },
  copy_grading_issued_to_agent: Date,
  copy_grading_report: Object,
  copy_grading_done_date: Date,
  for_copy_grade_username: String,
  copy_grading_done_received: Date,
  mrp_price: Number,
  sp_price: Number,
  final_grade: String,
  price_updation_date: Date,
  price_creation_date: Date,
  temp_flag: String,
  pickup_done_tray: String,
  merge_done_tray: String,
  pickup_done_date: Date,
  merge_done_date: Date,
  rack_id: String,
  rp_bqc_tray: String,
  rp_bqc_report: Object,
  rp_bqc_done_date: Date,
  rp_audit_report: Object,
  rp_audit_done_date: Date,
  rpa_done_received_by_wh: Date,
  rpa_to_stx_sorting_assigment_date: Date,
  rpa_to_stx_transferred_date: Date,
  add_to_can_bin_date: Date,
  add_to_can_bin_user: String,
  add_to_can_bin_description: String,
  image_one:String,
  image_two:String,
  image_three:String,
  image_five:String,
  image_six:String,
  image_four:String,
});

const delivery = mongoose.model("delivery", deliverySchema);
module.exports = {
  delivery: delivery,
};
