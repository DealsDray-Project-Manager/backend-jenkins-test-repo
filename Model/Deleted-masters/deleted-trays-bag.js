const mongoose = require("mongoose");

const deletedMasterSchema = mongoose.Schema(
  {
    name: String,
    code: {
      type: String,
      index: true,
    },
    type_taxanomy: String,
    display: String,
    cpc: String,
    warehouse: String,
    tray_grade: String,
    brand: String,
    model: String,
    created_at: Date,
    prefix:String,
    limit:Number,
    status:{
      type:String,
      default:"Pending"
    },
   
  },
  {
    timestamps: true, // This option adds created_at and updated_at timestamps to your documents
  }
);

const deletedMaster = mongoose.model("deletedMasters", deletedMasterSchema);
module.exports = {
  deletedMaster: deletedMaster,
};
