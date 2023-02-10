const mongoose = require("mongoose");

const categorySchema = mongoose.Schema({
  category_name: {
    type: String,
  },
  category_code: {
    type: String,
    index:true
  },
  category_description: {
    type: String,
  },
});

const category = mongoose.model("categoryMaster", categorySchema);
module.exports = {
  category: category,
};
