/*------------------------------EXPRESS------------------------------------*/
const express = require("express");
const router = express.Router();
const reportingAgentRouter = require("../../Controller/reporting-controller/reporting");
/*-----------------------------ROUTERS------------------------------------*/
//DASHBOARD
router.post("/dashboard/:location", async (req, res, next) => {
  try {
    const { location } = req.params;
    let data = await reportingAgentRouter.dashboardData(location);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
// UNITS BASED FILTER
router.post("/units/:location/:page/:size/:screen", async (req, res, next) => {
  try {
    let { location, page, size, screen } = req.params;
    page++;
    const limit = parseInt(size);
    const skip = (page - 1) * size;
    const unitsData = await reportingAgentRouter.getUnitsCond(
      location,
      limit,
      skip,
      screen
    );
    if (unitsData) {
      res.status(200).json({
        data: unitsData.units,
        count: unitsData.forCount,
      });
    }
  } catch (error) {
    next(error);
  }
});
//GET CLOSED STATE BAG
router.post("/bag/closed/:location", async (req, res, next) => {
  try {
    const { location } = req.params;
    const bag = await reportingAgentRouter.closedBag(location);
    if (bag) {
      res.status(200).json({
        data: bag,
      });
    }
  } catch (error) {
    next(error);
  }
});
//TRAY BASED REPORTING
router.post("/tray/:sortId/:trayType/:location", async (req, res, next) => {
  try {
    const { location, sortId, trayType } = req.params;
    const tray = await reportingAgentRouter.trayBasedOnStatus(
      location,
      sortId,
      trayType
    );
    if (tray) {
      res.status(200).json({
        data: tray,
      });
    }
  } catch (error) {
    next(error);
  }
});
router.post("/getDelivery/:location/:page/:size", async (req, res, next) => {
  try {
    let { location, page, size } = req.params;

    page++;

    const limit = parseInt(size);
    const skip = (page - 1) * size;

    let data = await reportingAgentRouter.getDeliveryForReport(
      location,
      limit,
      skip
    );
    if (data) {
      res.status(200).json({
        data: data.deliveryData,
        count: data.count,
      });
    }
  } catch (error) {
    next(error);
  }
});
// DELIVERY PAGE SORTING
router.post("/delivered/item/filter", async (req, res, next) => {
  try {
    console.log(req.body);
    let { brand, model, location, fromDate, toDate, page, size } = req.body;
    page++;

    const limit = parseInt(size);
    const skip = (page - 1) * size;
    const filterData = await reportingAgentRouter.deliveredItemFilter(
      brand,
      model,
      location,
      fromDate,
      toDate,
      limit,
      skip
    );
    if (filterData.length !== 0) {
      res.status(200).json({
        data: filterData,
      });
    } else {
      res.status(202).json({
        data: filterData,
      });
    }
  } catch (error) {
    next(error);
  }
});
// GET ALL ORDERS ORDER DATE WISE
router.post(
  "/getOrders/orderDateWise/:location/:page/:size",
  async (req, res, next) => {
    try {
      let { location, page, size } = req.params;
      page++;
      const limit = parseInt(size);
      const skip = (page - 1) * size;
      let data = await reportingAgentRouter.getOrdersOrderDateWaise(
        location,
        limit,
        skip
      );
      if (data) {
        res.status(200).json({
          data: data,
          message: "Success",
        });
      } else {
        res.status(404).json({
          message: "Orders Get Failed",
        });
      }
    } catch (error) {
      next(error);
    }
  }
);
// find last order date
router.post("/order/lastOrderDate/:location", async (req, res, next) => {
  try {
    const { location } = req.params;
    const data = await reportingAgentRouter.allOrderlastOrderDate(location);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
module.exports = router;
