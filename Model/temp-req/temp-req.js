const mongoose = require("mongoose");

const tempOrdersSchema = mongoose.Schema({
  uic:String,
});

const tempOrdersReq = mongoose.model("tempOrdersReq", tempOrdersSchema);
module.exports = {
  tempOrdersReq: tempOrdersReq,
};
