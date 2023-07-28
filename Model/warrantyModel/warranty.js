const mongoose = require("mongoose");

const warrantySchema = mongoose.Schema({
  name: {
    type: String,
  },
  description: {
    type: String,
  },
  created_at: {
    type: Date,
  },
});
const warranty = mongoose.model("warranty", warrantySchema);
module.exports = {
    warranty: warranty,
};
