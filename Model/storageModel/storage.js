const mongoose = require("mongoose");

const storagemodelSchema = mongoose.Schema({
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
const storagemodel = mongoose.model("storagemodel", storagemodelSchema);
module.exports = {
  storagemodel: storagemodel,
};
