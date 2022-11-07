const mongoose = require("mongoose");
const clubSchema = mongoose.Schema({
  vendor_sku_id: {
    type: String,
    index:true
  },
  cpc:{
    type:String
  },
  item: [
    {
      tracking_id: String,
      bot_agent: String,
      tray_id: String,
      uic: String,
      closed_time: Date,
      wht_tray: String,
      status:String,
      imei:String
    },
  ],
  wht_tray: {
    type: Array,
  },
  pick_list_status: {
    type: String,
    default: "Pending",
  },
  count_assigned_tray: {
    type: Number,
    default: 0,
  },
  created_at: {
    type: Date,
    default: Date.now(),
  },
  pick_list_id: {
    type: String,
  },
  pick_list_items:{
    type:Number,
    default: 0,
  },
});
const itemClub = mongoose.model("itemClub", clubSchema);
module.exports = {
    itemClub: itemClub,
};
