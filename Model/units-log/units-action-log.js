const mongoose = require("mongoose");

const unitsActionLogSchema = mongoose.Schema({
  action_type: {
    type: String,
  },
  tray_id:{
     type:String
  },
  bag_id:{
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
    type: Object,
  },
  uic: {
    type: String,
    index: true,
  },
  created_at: {
    type: Date,
  },
  awbn_number:{
    type:String,
    index: true,
  },
  description:{
    type:String
  },
  track_tray:{
    type:String
  }
});
const unitsActionLog = mongoose.model("unitsActionLog", unitsActionLogSchema);
module.exports = {
    unitsActionLog: unitsActionLog,
};
