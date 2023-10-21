const mongoose = require("mongoose");

const bagTransferSchema = mongoose.Schema(
  {
    req_id:String,
    name_of_courier: String,
    date_of_courier: Date,
    tracking_url: { type: String},
    hand_name_of_the_person: String,
    date_of_delivery: String,
    received_by: String,
    bag_details: Array,
    awbn: String,
    cpc: String,
    delivery_type:String,
    warehouse: String,
    action_done_by: String,
    status: {
      type: String,
      default: "Transferd",
    },
    description:String
  },
  {
    timestamps: true,
  }
);
const bagTransfer = mongoose.model("bagTransfer", bagTransferSchema);
module.exports = {
  bagTransfer: bagTransfer,
};
