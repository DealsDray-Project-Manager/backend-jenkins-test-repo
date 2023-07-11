const mongoose = require("mongoose");

const trayCategorySchema = mongoose.Schema({
  code: {
    type: String,
    index: true,
  },
  description: {
    type: String,
  },
  float: {
    type: Number, 
  },
  sereis_start: {
    type: Number,
  },
  series_end: {
    type: Number,
  },
  created_at: {
    type: Date,
  },
});
const trayCategory = mongoose.model("trayCategory", trayCategorySchema);
module.exports = {
  trayCategory: trayCategory,
};
