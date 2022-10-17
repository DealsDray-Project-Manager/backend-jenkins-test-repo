const mongoose = require("mongoose");

const brandSchema = mongoose.Schema({
  brand_id: {
    type: String,
  },
  brand_name: {
    type: String,
  },
  created_at: {
    type: Date,
    default: Date.now(),
  },
});

const brands = mongoose.model("brands", brandSchema);
module.exports = {
  brands: brands,
};
