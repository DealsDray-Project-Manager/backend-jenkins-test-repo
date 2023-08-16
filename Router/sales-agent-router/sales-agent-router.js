const express = require("express");
const router = express.Router();
// user controller
const salesController = require("../../Controller/sales-controller/sales-controller");
/*******************************************************************************************************************/

/* DASHBOARD sales */

router.post("/dashboard/:location/:username", async (req, res, next) => {
  try {
    const { location,username } = req.params;
    let data = await salesController.dashboardCount(location,username);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});

// VIEW THE PRICE
router.post("/viewPrice/:location", async (req, res, next) => {
  try {
    const { location } = req.params;
    let data = await salesController.viewPrice(location);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
//VIEW ITEMS 

router.post("/viewItemsForReadyForSales", async (req, res, next) => {
  try {
    console.log(req.body);
    const { location, brand, model,grade,date } = req.body;
    let data = await salesController.getItemsForReadyForSales(
      location,
      brand,
      model,
      grade,
      date
    );
    if (data) {
      res.status(200).json({
        data: data,
      });
    } else {
      res.status(202).json({
        message: "",
      });
    }
  } catch (error) {
    next(error);
  }
});

router.post("/ReadyForSalesUnits", async (req, res, next) => {
  const { location } = req.body;
  try { 
    let data = await salesController.ReadyForSalesUnits(location);
    console.log("data:", data)
    if (data) {
      res.status(200).json({
        data: data,
      });
    } else {
      res.status(202).json({
        message: "",
      });
    }
  } catch (error) {
    next(error);
  }
});

/************************************************************************************************************** */
module.exports = router;
