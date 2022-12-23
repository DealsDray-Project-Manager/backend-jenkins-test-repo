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
// /* NODE CRON */
// const corn = require("./utils/node-corn")();
// Routers
const superAdmin = require("./Router/superAdmin/superAdminRouter");
const mobileUserRouter = require("./Router/MobileRouters/Users/user");
const misUser = require("./Router/misUserRouters/misusers");
const warehouseIn = require("./Router/warehouseInRouter/warehouseIn");
const bot = require("./Router/bot-router/bot-router");
const chargingPanel = require("./Router/charging-panel-router/charging-panel");
const bqc = require("./Router/bqc-router/bqc-router");
const sortingAgent = require("./Router/sorting-agent-router/sorting-agent-router");
app.use(logger("dev"));
app.use(express.json({ limit: "25mb" }));
app.use(
  cors()
);
app.use(express.urlencoded({ limit: "25mb", extended: false }));
// API for web
app.use("/api/v1/superAdmin", superAdmin);
//API for Mobile
app.use("/api/mobile/v1/user", mobileUserRouter);
/* Api for Mis Users */
app.use("/api/v1/mis", misUser);
/* API for WarehouseIn */
app.use("/api/v1/warehouseIn", warehouseIn);
/* API for Bot Out */
app.use("/api/v1/bot", bot);
/* API for Charging panel */
app.use("/api/v1/charging", chargingPanel);
/* API for BQC panel */
app.use("/api/v1/bqc", bqc);
/* API for SORTING AGNET panel */
app.use("/api/v1/sorting-agnet", sortingAgent);
/* User-profile */
app.use("/user/profile", express.static(__dirname + "/public/user-profile"));
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
// Server Running at port 8000
const PORT = process.env.PORT || 8001;
app.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);
