const express = require("express");
const router = express.Router();
// user controller
const salesController = require("../../Controller/sales-controller/sales-controller");
/*******************************************************************************************************************/

/* DASHBOARD sales */

router.post("/dashboard/:location/:username", async (req, res, next) => {
  try {
    const { location, username } = req.params;
    let data = await salesController.dashboardCount(location, username);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});

// VIEW THE PRICE BASIS OF SUB-MUIC
router.post("/viewPrice/:location", async (req, res, next) => {
  try {
    const { location } = req.params;
    let data = await salesController.viewPrice(location);
    console.log(data);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
// VIEW PRICE BASIS OF SUB MUIC AND FILTER
router.post("/viewPriceFilter", async (req, res, next) => {
  try {
    const { location,brand,model } = req.body;
    let data = await salesController.viewPriceFilter(location,brand,model);
    console.log(data);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
//VIEW THE PRICE BASIS OF MUIC
router.post("/viewPriceBasisMuic/:location", async (req, res, next) => {
  try {
    const { location } = req.params;
    let data = await salesController.viewPriceBasisMuic(location);
    console.log(data);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
// FILTER ON MUIC PRICE PAGE BRAND / MODEL
router.post("/viewPriceBasisMuicFilter", async (req, res, next) => {
  try {
    const { location,brand,model } = req.body;
    let data = await salesController.viewPriceBasisMuicFilter(location,brand,model);
    console.log(data);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
router.post("/viewItemsForReadyForSales", async (req, res, next) => {
  try {
   
    const { location, brand, model, grade, date } = req.body;
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
