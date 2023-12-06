const mongoose = require("mongoose");

const blancoReportLogSchema = mongoose.Schema(
  {
    action_type: {
      type: String,
    },
    report: {
      type: Object,
      index: true,
    },
    uic_code: {
      type: String,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);
const blancoReportLog = mongoose.model(
  "blancoReportLog",
  blancoReportLogSchema
);
module.exports = {
  blancoReportLog: blancoReportLog,
};
