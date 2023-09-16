const mongoose = require("mongoose");

const mastersSchema = mongoose.Schema({
  name: {
    type: String,
  },
  code: {
    type: String,
    index: true,
  },
  type_taxanomy: {
    type: String,
  },
  parent_id: {
    type: String,
  },
  sort_id: {
    type: String,
  },

  prefix: {
    type: String,
    index: true,
  },
  display: {
    type: String,
  },
  created_at: {
    type: Date,
  },
  limit: {
    type: Number,
  },
  model: {
    type: String,
  },
  brand: {
    type: String,
  },
  items: {
    type: Array,
  },
  status_change_time: {
    type: Date,
  },
  actual_items: {
    type: Array,
  },
  issued_time: {
    type: String,
  },
  description: {
    type: String,
  },
  warehouse: {
    type: String,
  },
  uic: {
    type: String,
  },
  sleaves: {
    type: String,
  },
  closed_time_bot: {
    type: Date,
  },
  closed_time_sorting_agent: {
    type: Date,
  },
  closed_time_wharehouse: {
    type: Date,
  },
  closed_time_wharehouse_from_bot: {
    type: Date,
  },
  temp_array: {
    type: Array,
  },
  issued_user_name: {
    type: String,
    default: null,
  },
  assign: {
    type: String,
  },
  assigned_date: {
    type: Date,
  },
  cpc: {
    type: String,
  },
  wht_tray: {
    type: Array,
  },
  from_merge: {
    type: String,
  },
  to_merge: {
    type: String,
  },
  requested_date: {
    type: Date,
  },
  closed_date_agent: {
    type: Date,
  },
  to_tray_for_pickup: {
    type: String,
  },
  pickup_type: {
    type: String,
  },
  pickup_next_stage: {
    type: String,
  },
  recommend_location: {
    type: String,
  },
  tray_grade: {
    type: String,
  },
  sp_price: {
    type: Number,
  },
  mrp_price: {
    type: Number,
  },
  sp_tray: String,
  rdl_2_user_temp: String,
  rp_tray: String,
  track_tray: {
    bag_wh_added_item_close_fv_1: Date,
    bag_assign_to_bot: Date,
    bag_tray_issue_to_bot: Date,
    tray_close_by_bot: Date,
    tray_received_from_bot: Date,
    bot_done_tray_close_wh: Date,
    mis_assign_to_sorting: Date,
    wh_issue_to_sorting: Date,
    bot_release_by_wh: Date,
    sorting_agent_close_bot_wht: Date,
    sorting_done_received: Date,
    sorting_done_close_wh: Date,
    forcefull_recharge_sup: Date,
    issue_to_merging: Date,
    merging_done_close_sorting: Date,
    issued_to_recharging: Date,
    issued_to_charging: Date,
    charging_done_close_wh: Date,
    recharging_done_close_wh: Date,
    issued_to_bqc_wh: Date,
    bqc_done_close_by_wh: Date,
    issue_to_audit_wh: Date,
    audit_done_close_wh: Date,
    issued_rdl_1_wh: Date,
    rdl_1_done_close_by_wh: Date,
    ctx_transfer_to_sales: Date,
    ctx_transfer_to_processing: Date,
    ctx_issued_sorting: Date,
    ctx_sorting_done: Date,
    wht_to_rp_sorting_issued: Date,
    wht_to_rp_assigned_to_sorting: Date,
    wht_to_rp_sorting_done_sorting: Date,
    issued_to_rdl_two: Date,
    rdl_two_done_closed_by_agent: Date,
  },
  rack_id: {
    type: String,
  },
  temp_status: {
    type: String,
  },
  temp_rack: {
    type: String,
  },
  price_creation_date: {
    type: Date,
  },
  price_updation_date: {
    type: Date,
  },
});
const masters = mongoose.model("masters", mastersSchema);
module.exports = {
  masters: masters,
};
