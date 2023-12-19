const mongoose = require("mongoose");

const tempOrdersSchema = mongoose.Schema({
  uic: String,
  tray_id:String,
  sub_muic:String,
  audit_report:Object
});

const tempOrdersReq = mongoose.model("tempOrdersReq", tempOrdersSchema);
module.exports = {
  tempOrdersReq: tempOrdersReq,
};
