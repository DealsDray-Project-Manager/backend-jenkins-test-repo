/*------------------------------EXPRESS------------------------------------*/
const express = require("express");
const router = express.Router();
const purchaseController = require("../../Controller/purchase-controller/purchase-controller");

/*-----------------------------ROUTERS------------------------------------*/
// DASBOARD
router.post("/dashboard/:location", async (req, res, next) => {
  try {
    const { location } = req.params;
    let data = await purchaseController.dashboardData(location);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});

// PROCUREMENT VIEW
router.post("/procurment/view", async (req, res, next) => {
  try {
    let data = await purchaseController.procurementRequestView();
    if (data) {
      res.status(200).json({
        data: data,
      });
    } else {
      res.status(202).json({
        message: "Failed please try again...",
      });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
