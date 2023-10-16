const mongoose = require("mongoose");

const tempOrdersSchema = mongoose.Schema({
    tray_id:String,
    model_name:String,
    auditor_feedback:String,
    auditor_remarks:String,
    audit_date:Date,
    description:String,
    uic:String,
    auditor_name:String,
    rdl_1_status:String,
    rdl_1_spn:Array,
    rdl_1_agent:String,
    rdl_1_done_date:Date,
    rdl_2_status:String,
    rdl_2_remark:String,
    rdl_2_done_date:Date,
    rdl_2_agent:String
});

const tempOrdersReq = mongoose.model("tempOrdersReq", tempOrdersSchema);
module.exports = {
  tempOrdersReq: tempOrdersReq,
};
