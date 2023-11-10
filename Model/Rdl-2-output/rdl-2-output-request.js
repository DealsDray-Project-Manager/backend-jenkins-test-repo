const mongoose = require("mongoose");

const Rdl2OutputRequestSchema = mongoose.Schema(
  {
    request_id: {
      type: String,
      index: true,
    },
    created_user: String,
    from_date: Date,
    to_date: Date,
    status: {
      type: String,
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

const rdl2OutputRequest = mongoose.model(
  "rdl2OutputRequest",
  Rdl2OutputRequestSchema
);

module.exports = {
    rdl2OutputRequest: rdl2OutputRequest,
};
