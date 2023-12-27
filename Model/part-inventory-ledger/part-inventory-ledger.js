const mongoose = require("mongoose");

const PartInventoryLedgerSchema = mongoose.Schema(
  {
    description: String,
    department: String,
    in_stock: String,
    out_stock: String,
    action: String,
    action_done_user: String,
    part_code: {
      type:String,
      ref:"partandcolors"
    },
    box_id:String,
    tray_id:String,
    avl_stock:Number
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
