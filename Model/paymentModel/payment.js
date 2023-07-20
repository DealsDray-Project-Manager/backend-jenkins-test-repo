const mongoose = require("mongoose");

const paymentSchema = mongoose.Schema({
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
const payment = mongoose.model("payment", paymentSchema);
module.exports = {
  payment: payment,
};
