const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
  },
  businessName:{
    type: String,
  },
  contact: {
    type: String,
  },
  user_name: {
    type: String,
  },
  password: {
    type: String,
  },
  designation: {
    type: String,
  },
  cpc: {
    type: String,
  },
  warehouse: {
    type: String,
  },
  sales_users:{
    type: String,
  },
  department: {
    type: String,
  },
  store: {
    type: String,
  },
  is_super_admin: {
    type: String,
  },
  reporting_manager: {
    type: String,
  },
  device_id: {
    type: String,
  },
  device_name: {
    type: String,
  },
  profile: {
    type: String,
  },
  user_type: {
    type: String,
  },
  status: {
    type: String,
    default: "Active",
  },
  creation_date: {
    type: Date,
  },
  last_update_date: {
    type: Date,
    default: null,
  },
  last_otp: {
    type: Number,
    default: null,
  },
  cpc_type: {
    type: String,
  },
  jwt_token:{
    type:String
  },
  buyer_name:{
    type: String,
  },
  billing_address:{
    type: String,
  },
  city: {
    type: String,
  },
  state: {
    type: String,
  },
  country: {
    type: String,
  },
  pincode: {
    type: String,
  },
  gstin:{
    type: String,
  },
  pan_card_number: {
    type: String,
  },
  mobile_verification_status: {
    type: String,
  },
  email_verification_status: {
    type: String,
  },
  pan_card_proof: {
    type: String,
  },
  aadhar_proof:{
    type: String,
  },
  business_address_proof:{
    type: String,
  }
  
});
const user = mongoose.model("users", userSchema);
module.exports = {
  user: user,
};
