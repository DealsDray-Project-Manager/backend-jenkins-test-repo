const mongoose = require("mongoose");

const Rdl2OutputReportSchema = mongoose.Schema({
  brand_and_model_name:String,
  all_data:Object,
  request_id:{
    type:String,
    ref:"rdl2outputrequests"
  }
},
{
  timestamps: true,
}
);

const Rdl2OutputReport = mongoose.model(
  "rdl2OutputReport",
  Rdl2OutputReportSchema
);

module.exports = {
  rdl2OutputReport: Rdl2OutputReport,
};
