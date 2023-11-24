const mongoose = require("mongoose");

const productSchema = mongoose.Schema({
  vendor_sku_id: {
    type: String,
    index: true,
  },
  brand_name: {
    type: String,
  },
  model_name: {
    type: String,
  },
  vendor_name: {
    type: String,
  },
  image: {
    type: String,
  },
  muic: {
    type: String,
  },
  created_at: {
    type: Date,
  },
  jack_type: {
    type: String,
  },
  variant: {
    type: String,
  },
  created_by: {
    type: String,
  },
});

const products = mongoose.model("product", productSchema);
module.exports = {
  products: products,
};
