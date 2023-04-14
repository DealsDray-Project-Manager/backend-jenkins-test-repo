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
  created_at: {
    type: Date,
  },
});

const partAndColor = mongoose.model("partAndColor", partAndcolorSchema);
module.exports = {
  partAndColor: partAndColor,
};
