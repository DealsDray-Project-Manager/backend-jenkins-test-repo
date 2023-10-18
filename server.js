//express
const express = require("express");
// Dot env
const dotenv = require("dotenv");
dotenv.config();
const app = express();
// Morgan
const logger = require("morgan");
// Mongodb Connection
const connectDb = require("./config/db");
// cors
const cors = require("cors");
connectDb();
/* NODE CRON */
const corn = require("./Utils/node-cron")();
/* SENTRY.IO */
const Sentry = require('@sentry/node');
Sentry.init({
  dsn: process.env.SENTRYDSN,
});
app.use(Sentry.Handlers.requestHandler());
// Routers
const superAdmin = require("./Router/superAdmin/superAdminRouter");
const mobileUserRouter = require("./Router/MobileRouters/Users/user");
const misUser = require("./Router/misUserRouters/misusers");
const warehouseIn = require("./Router/warehouseInRouter/warehouseIn");
const bot = require("./Router/bot-router/bot-router");
const chargingPanel = require("./Router/charging-panel-router/charging-panel");
const bqc = require("./Router/bqc-router/bqc-router");
const sortingAgent = require("./Router/sorting-agent-router/sorting-agent-router");
const auditPanel = require("./Router/audit-router/audit-router");
const RDL_onePanel = require("./Router/RDL_one-router/RDL_one-router");
const salesPanel = require("./Router/sales-agent-router/sales-agent-router");
const pricingpanel = require("./Router/pricing-router/pricing-router");
const ReportingPanel = require("./Router/reporting-router/reporting");
const Rdl2Panel = require("./Router/Rdl-2-router/rdl-2-router");
const RmUserPanel = require("./Router/Rm-user-router/rm-user");
const SpMispanel = require("./Router/sp-mis/sp-mis-router");
const SpPurchasePanel = require("./Router/purchase-router/purchase-router");

app.use(logger("dev"));
app.use(express.json({ limit: "25mb" }));
app.use(cors());
app.use(express.urlencoded({ limit: "25mb", extended: false }));
// API for web
app.use("/api/v7/superAdmin", superAdmin);
//API for Mobile
app.use("/api/mobile/v8/user", mobileUserRouter);
/* Api for Mis Users */
app.use("/api/v7/mis", misUser);
/* API for WarehouseIn */
app.use("/api/v7/warehouseIn", warehouseIn);
/* API for Bot Out */
app.use("/api/v7/bot", bot);
/* API for Charging panel */
app.use("/api/v7/charging", chargingPanel);
/* API for BQC panel */
app.use("/api/v7/bqc", bqc);
/* API for SORTING AGNET panel */
app.use("/api/v7/sorting-agnet", sortingAgent);
/* API for AUDIT AGNET panel */
app.use("/api/v7/audit-agent", auditPanel);
/* API for RDL_one AGNET panel */
app.use("/api/v7/RDL_onePanel", RDL_onePanel);
/*API for Reporting panle */
app.use("/api/v7/sales-agent", salesPanel);
/* API for sales AGNET panel */
app.use("/api/v7/reporting-agent", ReportingPanel);
/* API for pricing AGNET panel */
app.use("/api/v7/pricing-agent", pricingpanel);
/* API FOR RDL 2 PANEL */
app.use("/api/v7/rdl-2", Rdl2Panel);
/* API FOR RM USER PANEL */
app.use("/api/v7/rm-user", RmUserPanel);
/* API FOR RM PANEL */
app.use("/api/v7/sp-mis", SpMispanel);
/* API FOR RM PANEL */
app.use("/api/v7/purchase-user", SpPurchasePanel);
/* User-profile */
app.use("/user/profile", express.static(__dirname + "/public/user-profile"));

app.use("/user/document", express.static(__dirname + "/public/buyer-docs"));
/* Product Image */
app.use("/product/image", express.static(__dirname + "/public/product-image"));
// Error Handling Middlware
app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.status || 500).json({
    status: 0,
    data: {
      message: err.message,
    },
  });
});
app.use(Sentry.Handlers.errorHandler());
// Server Running at port 8000
const PORT = process.env.PORT || 8001;
app.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);
