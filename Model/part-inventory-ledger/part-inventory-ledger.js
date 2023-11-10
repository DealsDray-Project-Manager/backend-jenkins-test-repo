const mongoose = require("mongoose");

const PartInventoryLedgerSchema = mongoose.Schema(
  {
    description: String,
    department: String,
    in_stock: Number,
    out_stock: Number,
    action: String,
    action_done_user: String,
    part_code: String,
    tray_id:String,
  },
  {
    timestamps: true, // This option adds created_at and updated_at timestamps to your documents
  }
);

const partInventoryLedger = mongoose.model(
  "partInventoryLedgers",
  PartInventoryLedgerSchema
);

module.exports = {
  partInventoryLedger: partInventoryLedger,
};
