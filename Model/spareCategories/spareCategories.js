const mongoose = require("mongoose");

const spcategoriesSchema = mongoose.Schema({
  spcategory_id: {
    type: String,
    index: true,
  },
  category_name: {
    type: String,
  },
  description: {
    type: String,
  },
  creation_date: {
    type: Date,
  },
  
});
const spareCategories = mongoose.model("spareCategories", spcategoriesSchema);
module.exports = {
  spareCategories: spareCategories,
};
