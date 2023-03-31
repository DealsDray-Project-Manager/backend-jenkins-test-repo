const mongoose = require("mongoose");

const adminSchema = mongoose.Schema({
  user_name: {
    type: String,
  },
  password: {
    type: String,
  },
  name: {
    type: String,
  },
  user_type: {
    type: String,
  },
  email: {
    type: String,
  },
});

const admin = mongoose.model("admin", adminSchema);
module.exports = {
  admin: admin,
};
