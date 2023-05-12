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
  bag_wh_added_item_close_fv_1:{
    type:Date
  },
  bag_assign_to_bot:{
    type:Date
  },
  

});
const masters = mongoose.model("masters", mastersSchema);
module.exports = {
  masters: masters,
};
