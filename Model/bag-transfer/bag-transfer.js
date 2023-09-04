const mongoose = require("mongoose");

const bagTransferSchema = mongoose.Schema({
  name_or_courier: String,
  req_id: { type: String, unique: true },
  date_of_courier: Date,
  tracking_url: { type: String, unique: true },
  hand_name_of_the_person: String,
  date_of_delivery: String,
  received_by: String,
  bag_details: Array,
  created_at: Date,
});
const bagTransfer = mongoose.model("bagTransfer", bagTransferSchema);
module.exports = {
  bagTransfer: bagTransfer,
};
