const mongoose = require("mongoose");

const vendorShcema = mongoose.Schema({
  vendor_id: {
    type: String,
  },
  name: {
    type: String,
  },
  address: {
    type: String,
  },
  city: {
    type: String,
  },
  state: {
    type: String,
  },
  mobile_one: {
    type: String,
  },
  mobile_two: {
    type: String,
  },
  deals: {
    type: String,
  },
  reference: {
    type: String,
  },
  location: {
    type: Array,
  },
  created_at: {
    type: Date,
  },
  pincode:{
    type:String
  },
  status: {
    type: String,
    default: "Active",
  },
});

const vendorMaster = mongoose.model("verndormaster", vendorShcema);
module.exports = {
  vendorMaster: vendorMaster,
};
