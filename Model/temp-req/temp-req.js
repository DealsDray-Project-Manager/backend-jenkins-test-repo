const mongoose = require("mongoose");

const tempOrdersSchema = mongoose.Schema({
    tray_id:String,
});

const tempOrdersReq = mongoose.model("tempOrdersReq", tempOrdersSchema);
module.exports = {
  tempOrdersReq: tempOrdersReq,
};
