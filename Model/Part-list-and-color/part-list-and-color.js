const mongoose = require("mongoose");

const partAndcolorSchema = mongoose.Schema({
  name: {
    type: String,
  },
  muic: {
    type: String,
  },
  part_code: {
    type: String,
  },
  type: {
    type: String,
  },
  description: {
    type: String,
  },
  color: {
    type: String,
  },
  technical_qc:{
    type:String
  },
  avl_stock:{
    type:Number,
    default:0
  },
  muic_association:{
     type:Array
  },
  status:{
      type:String,
      default:"Active"
  },
  created_at: {
    type: Date,
    default:Date.now()
  },
});

const partAndColor = mongoose.model("partAndColor", partAndcolorSchema);
module.exports = {
  partAndColor: partAndColor,
};
