const mongoose = require("mongoose");

const toolsAndConsumablesIssueSchema = mongoose.Schema({
  issued_user_name: {
    type: String,
    default: null,
  },
  status: String,
  tools_and_consumables_list: Array,
  assigned_date: Date,
  issued_date: Date,
  mis_description: String,
  warehouse_description: String,
  request_id: String,
});
const toolsAndConsumablesIssueRequests = mongoose.model(
  "toolsAndConsumablesIssueRequests",
  toolsAndConsumablesIssueSchema
);

module.exports = {
  toolsAndConsumablesIssueRequests: toolsAndConsumablesIssueRequests,
};
