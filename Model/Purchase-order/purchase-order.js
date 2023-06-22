const mongoose = require("mongoose");

const purchaseOrderSchema = mongoose.Schema({
  request_id: {
    type: Array,
  },
  request_date: {
    type: Date,
  },
  spare_part_number: {
    type: String,
  },
  spare_part_name: {
    type: String,
  },
  muic: {
    type: String,
  },
  requred_qty: {
    type: Number,
  },
  status: {
    type: String,
    default: "Pending",
  },
  updated_at: {
    type: Date,
  },
});

const purchaseOrder = mongoose.model("purchaseOrder", purchaseOrderSchema);
module.exports = {
    purchaseOrder: purchaseOrder,
};
