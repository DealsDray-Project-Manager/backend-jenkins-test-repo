const mongoose = require("mongoose");

const userHistorySchema = mongoose.Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
  },
  contact: {
    type: String,
  },
  user_name: {
    type: String,
  },
  password: {
    type: String,
  },
  designation: {
    type: String,
  },
  cpc: {
    type: String,
  },
  warehouse: {
    type: String,
  },
  department: {
    type: String,
  },
  store: {
    type: String,
  },
  is_super_admin: {
    type: String,
  },
  reporting_manager: {
    type: String,
  },
  device_id: {
    type: String,
  },
  device_name: {
    type: String,
  },
  profile: {
    type: String,
  },
  user_type: {
    type: String,
  },
  status: {
    type: String,
    default: "Active",
  },
  creation_date: {
    type: Date,
  },
  last_update_date: {
    type: Date,
    default: null,
  },
  last_otp: {
    type: Number,
    default: null,
  },
});
const usersHistory = mongoose.model("usersHistory", userHistorySchema);
module.exports = {
  usersHistory: usersHistory,
};
