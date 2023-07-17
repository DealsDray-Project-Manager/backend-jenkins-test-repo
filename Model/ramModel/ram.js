const mongoose = require("mongoose");

const rammodelSchema = mongoose.Schema({
  name: {
    type: String,
    index: true,
  },
  description: {
    type: String,
  },
  created_at: {
    type: Date,
  },
  
});
const rammodel = mongoose.model("rammodel", rammodelSchema);
module.exports = {
    rammodel: rammodel,
};
