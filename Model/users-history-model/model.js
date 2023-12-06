const mongoose = require("mongoose");

const userHistorySchema = mongoose.Schema({
  name: {
    type: String,
  },
  email: {
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
  cpc: {
    type: String,
  },
  warehouse: {
    type: String,
  },
  sales_users:{
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
  creation_date: {
    type: Date,
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
  pincode: {
    type: String,
  },
  gstin:{
    type: String,
  },
  pan_card_number: {
    type: String,
  },
  last_update_date: {
    type: Date,
    default: null,
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
  },
  business_name:String,
  contact_person_name:String,
  billing_address:String,
  type:String
}
);
const usersHistory = mongoose.model("usersHistory", userHistorySchema);
module.exports = {
  usersHistory: usersHistory,
};
