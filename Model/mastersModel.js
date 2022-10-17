const mongoose = require("mongoose");

const mastersSchema = mongoose.Schema({
  name: {
    type: String,
  },
  code: {
    type: String,
    index:true
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
  closed_time_wharehouse:{
    type: Date
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
});
const masters = mongoose.model("masters", mastersSchema);
module.exports = {
  masters: masters,
};
