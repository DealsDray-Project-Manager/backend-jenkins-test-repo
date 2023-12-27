const mongoose = require("mongoose");

const tempOrdersSchema = mongoose.Schema({
  uic: String,
  final_grade:String,
  muic:String,
  sub_muic:String,
  brand:String,
  model:String,
  color:String,
  storage:String,
  ram:String,
  item_moved_to_billed_bin:String
});

const tempOrdersReq = mongoose.model("tempOrdersReq", tempOrdersSchema);
module.exports = {
  tempOrdersReq: tempOrdersReq,
};
