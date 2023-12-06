const mongoose = require("mongoose");

const tempOrdersSchema = mongoose.Schema({
  uic: String,
  tray_id:String,
  tray_status:String,
});

const tempOrdersReq = mongoose.model("tempOrdersReq", tempOrdersSchema);
module.exports = {
  tempOrdersReq: tempOrdersReq,
};
