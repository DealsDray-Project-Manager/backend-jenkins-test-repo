const mongoose = require("mongoose");

const unitsActionLogSchema = mongoose.Schema({
  action_type: {
    type: String,
  },
  action_date: {
    type: String,
  
  },
  bag_id:{
    type:String
  },
  tray_id:{
     type:String
  },
  agent_name: {
    type: String,
  },
  user_name_of_action:{
    type:String,
  },
  user_type: {
    type: String,
  },
  agent_location: {
    type: String,
  },
  report: {
    type: String,
  },
  uic: {
    type: String,
    index: true,
  },
  created_at: {
    type: Date,
  },
  awbn_numner:{
    type:String,
    index: true,
  }
});
const unitsActionLog = mongoose.model("unitsActionLog", unitsActionLogSchema);
module.exports = {
    unitsActionLog: unitsActionLog,
};
