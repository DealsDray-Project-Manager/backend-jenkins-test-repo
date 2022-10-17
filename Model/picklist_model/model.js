const mongoose = require("mongoose");
const picklistSchema = mongoose.Schema({
  created_user_name: {
    type: String,
  },
  items: {
    type: Array,
  },
  created_at: {
    type: Date,
  },
  pick_list_id: {
    type: String,
  },
  actual: {
    type: Array,
  },
  model_name:{
    type:String
  },
  brand_name:{
    type:String,
  },
  model_namee:{
    type:String
  },
  muic:{
    type:String
  },
  pick_list_status:{
    type:String,
    default:"Pending"
  },
  closed_time:{
    type:Date
  }
});

const pickList = mongoose.model("picklist", picklistSchema);
module.exports = {
  pickList: pickList,
};
