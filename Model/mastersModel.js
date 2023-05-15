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
  from_time: {
    type: String,
  },
  to_time: {
    type: String,
  },
  prefix: {
    type: String,
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
  track_tray:{
    bag_wh_added_item_close_fv_1:Date,
    bag_assign_to_bot:Date,
    bag_tray_issue_to_bot:Date,
    tray_close_by_bot:Date,
    tray_received_from_bot:Date,
    bot_done_tray_close_wh:Date,
    mis_assign_to_sorting:Date,
    wh_issue_to_sorting:Date,
    bot_release_by_wh:Date,
    sorting_agent_close_bot_wht:Date,
    sorting_done_received:Date,
    sorting_done_close_wh:Date,
    forcefull_recharge_sup:Date
  }
  

});
const masters = mongoose.model("masters", mastersSchema);
module.exports = {
  masters: masters,
};
