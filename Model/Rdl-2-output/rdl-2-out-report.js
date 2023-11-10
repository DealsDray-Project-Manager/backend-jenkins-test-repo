const mongoose = require("mongoose");

const Rdl2OutputReportSchema = mongoose.Schema({});

const Rdl2OutputReport = mongoose.model(
  "rdl2OutputReport",
  Rdl2OutputReportSchema
);

module.exports = {
  Rdl2OutputReport: Rdl2OutputReport,
};
