const mongoose = require("mongoose");

const trayRackSchema = mongoose.Schema(
  {
    rack_id: {
      type: String,
      index: true,
    },
    name: {
      type: String,
    },
    display: {
      type: String,
    },
    parent_id: {
      type: String,
    },
    limit: {
      type: Number,
    },
    bag_or_tray: {
      type: Array,
    },
    warehouse: {
      type: String,
    },
  },
  {
    timestamps: true, // This option adds created_at and updated_at timestamps to your documents
  }
);
const trayRack = mongoose.model("trayRack", trayRackSchema);
module.exports = {
  trayRack: trayRack,
};
