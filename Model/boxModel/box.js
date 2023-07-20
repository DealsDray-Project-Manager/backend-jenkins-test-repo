const mongoose = require("mongoose");

const boxSchema = mongoose.Schema({
  box_id: {
    type: String,
    index: true,
  },
  name: {
    type: String,
  },
  description: {
    type: String,
  },
  display: {
    type: String,
  },
  created_at: {
    type: Date,
  },
});
const box = mongoose.model("box", boxSchema);
module.exports = {
  box: box,
};
