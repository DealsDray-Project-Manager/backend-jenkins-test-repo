const mongoose = require("mongoose");

const procurmentOfToolsAndConsumablesSchema = mongoose.Schema({
  request_id: {
    type: String
  },
  request_date: {
    type: Date,
  },
  part_number: {
    type: String,
  },
  part_name: {
    type: String,
  },
  requred_qty: {
    type: Number,
  },
  category:String,
  status: {
    type: String,
    default: "Pending",
  },
  updated_at: {
    type: Date,
  },
});

const procurmentToolsAndConsumables = mongoose.model(
  "procurmentToolsAndConsumables",
  procurmentOfToolsAndConsumablesSchema
);
module.exports = {
  procurmentToolsAndConsumables: procurmentToolsAndConsumables,
};
