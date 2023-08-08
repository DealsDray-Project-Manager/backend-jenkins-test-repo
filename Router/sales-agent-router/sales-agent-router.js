const express = require("express");
const router = express.Router();
// user controller
const salesController = require("../../Controller/sales-controller/sales-controller");
/*******************************************************************************************************************/

/* DASHBOARD sales */

router.post("/dashboard/:location", async (req, res, next) => {
  try {
    const { location } = req.params;

    let data = await salesController.dashboardCount(location);
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

/************************************************************************************************************** */
module.exports = router;
