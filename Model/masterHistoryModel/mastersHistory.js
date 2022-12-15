const mongoose = require("mongoose");

const mastersEditHistorySchema = mongoose.Schema({
  name: {
    type: String,
  },
  code: {
    type: String,
    index: true,
  },
  type_taxanomy: {
    type: String,
  },
  parent_id: {
    type: String,
  },
  sort_id: {
    type: String,
  },
  prefix: {
    type: String,
  },
  display: {
    type: String,
  },
  created_at: {
    type: Date,
  },
  limit: {
    type: Number,
  },
  model: {
    type: String,
  },
  brand: {
    type: String,
  },
  warehouse: {
    type: String,
  },
  cpc: {
    type: String,
  },
});
const mastersEditHistory = mongoose.model(
  "mastersEditHistory",
  mastersEditHistorySchema
);
module.exports = {
  mastersEditHistory: mastersEditHistory,
};
