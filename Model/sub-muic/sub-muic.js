const mongoose = require("mongoose");

const subMuicSchema = mongoose.Schema(
  {
    muic: {
      type: String,
    },
    action_user: {
      type: String,
    },
    color: {
      type: String,
    },
    ram: {
      type: String,
    },
    storage: {
      type: String,
    },
    sub_muic: {
      type: String,
    },
  },
  {
    timestamps: true, // This option adds created_at and updated_at timestamps to your documents
  }
);
const subMuic = mongoose.model("subMuic", subMuicSchema);
module.exports = {
  subMuic: subMuic,
};
