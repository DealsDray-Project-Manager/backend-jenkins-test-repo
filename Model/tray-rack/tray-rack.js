const mongoose = require("mongoose");

const trayRackSchema = mongoose.Schema({
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
  warehouse: {
    type: String,
  }
});
const trayRack = mongoose.model("trayRack", trayRackSchema);
module.exports = {
  trayRack: trayRack,
};
