/*------------------------------EXPRESS------------------------------------*/
const express = require("express");
const router = express.Router();
const reportingAgentRouter = require("../../Controller/reporting-controller/reporting");
const Elasticsearch = require("../../Elastic-search/elastic");
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
    if (unitsData.units.length !== 0) {
      res.status(200).json({
        data: unitsData.units,
        count: unitsData.forCount,
      });
    } else {
      res.status(202).json({
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
// FOR UNVERIFIED IMEI
router.post(
  "/unverifiedImeiReport/:location/:page/:size",
  async (req, res, next) => {
    try {
      let { location, page, size } = req.params;
      page++;
      const limit = parseInt(size);
      const skip = (page - 1) * size;
      let data = await reportingAgentRouter.getUnverifiedImeiReport(
        location,
        limit,
        skip
      );
      if (data) {
        res.status(200).json({
          data: data.unverifiedImei,
          count: data.count,
        });
      }
    } catch (error) {
      next(error);
    }
  }
);
// DELIVERY PAGE SORTING
router.post("/delivered/item/filter", async (req, res, next) => {
  try {
    let { brand, model, location, fromDate, toDate, page, size, totalCount } =
      req.body;
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
      skip,
      totalCount
    );
    if (filterData.getDelivery.length !== 0) {
      res.status(200).json({
        data: filterData.getDelivery,
        avgPrice: filterData.avgPrice,
        count: filterData.count,
        forXlsxDownload: filterData.forXlsxDownload,
      });
    } else {
      res.status(202).json({
        data: filterData.getDelivery,
        avgPrice: filterData.avgPrice,
        count: filterData.count,
        forXlsxDownload: filterData.forXlsxDownload,
      });
    }
  } catch (error) {
    next(error);
  }
});
// filter for all orders report
router.post("/orderDateReport/item/filter", async (req, res, next) => {
  try {
    let { location, fromDate, toDate, page, size, type } = req.body;
    page++;
    const limit = parseInt(size);
    const skip = (page - 1) * size;
    const filterData = await reportingAgentRouter.allOrdersReportItemFilter(
      location,
      fromDate,
      toDate,
      limit,
      skip,
      type
    );
    if (filterData.allOrdersReport.length !== 0) {
      res.status(200).json({
        data: filterData.allOrdersReport,
        forXlsx: filterData.forXlsxDownload,
        count: filterData.getCount,
      });
    } else {
      res.status(202).json({
        data: filterData.allOrdersReport,
        forXlsx: filterData.forXlsxDownload,
        count: filterData.getCount,
      });
    }
  } catch (error) {
    next(error);
  }
});

// filter for month wise purchise report
router.post("/monthWiseReport/item/filter", async (req, res, next) => {
  try {
    let { location, fromDate, toDate, page, size, type } = req.body;
    page++;
    const limit = parseInt(size);
    const skip = (page - 1) * size;
    const filterData = await reportingAgentRouter.monthWiseReportItemFilter(
      location,
      fromDate,
      toDate,
      limit,
      skip,
      type
    );
    if (filterData.monthWiseReport.length !== 0) {
      res.status(200).json({
        data: filterData.monthWiseReport,
        forXlsx: filterData.forXlsxDownload,
        count: filterData.getCount,
      });
    } else {
      res.status(202).json({
        data: filterData.monthWiseReport,
        forXlsx: filterData.forXlsxDownload,
        count: filterData.getCount,
      });
    }
  } catch (error) {
    next(error);
  }
});
// FILTER FOR UNVERIFIED IMEI
router.post("/unverifiedImei/item/filter", async (req, res, next) => {
  try {
    let { location, fromDate, toDate, page, size, type } = req.body;
    page++;
    const limit = parseInt(size);
    const skip = (page - 1) * size;
    const filterData = await reportingAgentRouter.unVerifiedReportItemFilter(
      location,
      fromDate,
      toDate,
      limit,
      skip,
      type
    );
    if (filterData.monthWiseReport.length !== 0) {
      res.status(200).json({
        data: filterData.monthWiseReport,
        forXlsx: filterData.forXlsxDownload,
        count: filterData.getCount,
      });
    } else {
      res.status(202).json({
        data: filterData.monthWiseReport,
        forXlsx: filterData.forXlsxDownload,
        count: filterData.getCount,
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
//find delivered orders
router.post(
  "/getDeliveredOrders/:location/:page/:size",
  async (req, res, next) => {
    try {
      let { location, page, size } = req.params;
      page++;
      const limit = parseInt(size);
      const skip = (page - 1) * size;
      let data = await reportingAgentRouter.getDeliveredOrders(
        location,
        limit,
        skip
      );
      if (data) {
        res.status(200).json({
          data: data.data,
          count: data.count,
        });
      }
    } catch (error) {
      next(error);
    }
  }
);
// not delivered orders
router.post(
  "/notDeliveredOrders/:location/:page/:size",
  async (req, res, next) => {
    try {
      let { location, page, size } = req.params;
      if (!page) {
        page = 1;
      }
      if (!size) {
        size = 10;
      }
      page++;
      const limit = parseInt(size);
      const skip = (page - 1) * size;
      let data = await reportingAgentRouter.notDeliveredOrders(
        location,
        limit,
        skip
      );
      if (data) {
        res.status(200).json({
          data: data.data,
          count: data.count,
        });
      }
    } catch (error) {
      next(error);
    }
  }
);
router.post("/search-delivery-item", async (req, res, next) => {
  try {
    let { searchData, location, rowsPerPage, page } = req.body;
    page++;
    const limit = parseInt(rowsPerPage);
    const skip = (page - 1) * rowsPerPage;
    let data = await Elasticsearch.searchDataOfDeliveryReporting(
      searchData,
      limit,
      skip,
      location
    );
    if (data.searchResult.length !== 0) {
      res.status(200).json({
        data: data.searchResult,
        count: data.count,
        allMatchedResult: data.dataForDownload,
      });
    } else {
      res.status(202).json({
        data: data.searchResult,
        count: data.count,
        allMatchedResult: data.dataForDownload,
      });
    }
  } catch (error) {
    next(error);
  }
});
// SEARCH UNVERIFIED IMEI
router.post("/search/unverifiedImei", async (req, res, next) => {
  try {
    let { searchData, location, rowsPerPage, page } = req.body;
    page++;
    const limit = parseInt(rowsPerPage);
    const skip = (page - 1) * rowsPerPage;
    let data = await Elasticsearch.searchUnverifiedImei(
      searchData,
      limit,
      skip,
      location
    );
    if (data.searchResult.length !== 0) {
      res.status(200).json({
        data: data.searchResult,
        count: data.count,
        allMatchedResult: data.dataForDownload,
      });
    } else {
      res.status(202).json({
        data: data.searchResult,
        count: data.count,
        allMatchedResult: data.dataForDownload,
      });
    }
  } catch (error) {
    next(error);
  }
});
router.post("/search/processing", async (req, res, next) => {
  try {
    let { type, searchData, location, rowsPerPage, page } = req.body;
    page++;
    const limit = parseInt(rowsPerPage);
    const skip = (page - 1) * rowsPerPage;
    let data = await reportingAgentRouter.searchProcessing(
      type,
      searchData,
      location,
      limit,
      skip
    );
    if (data.deliveryData.length !== 0) {
      res.status(200).json({
        data: data.deliveryData,
        count: data.count,
      });
    } else {
      res.status(202).json({
        data: data.deliveryData,
        count: 0,
      });
    }
  } catch (error) {
    next(error);
  }
});
router.post("/search/sales", async (req, res, next) => {
  try {
    let { type, searchData, location, rowsPerPage, page } = req.body;
    page++;
    const limit = parseInt(rowsPerPage);
    const skip = (page - 1) * rowsPerPage;
    let data = await reportingAgentRouter.SearchSales(
      type,
      searchData,
      location,
      limit,
      skip
    );
    if (data.deliveryData.length !== 0) {
      res.status(200).json({
        data: data.deliveryData,
        count: data.count,
      });
    } else {
      res.status(202).json({
        data: data.deliveryData,
        count: 0,
      });
    }
  } catch (error) {
    next(error);
  }
});
// MONTH WISE PURCHASE SORT
router.post("/report/sort", async (req, res, next) => {
  try {
    let { location, page, size, type, sortFormate } = req.body;
    page++;
    const limit = parseInt(size);
    const skip = (page - 1) * size;
    let data = await reportingAgentRouter.reportPageSort(
      location,
      limit,
      skip,
      type,
      sortFormate
    );
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
// RDL 1 DONE UNITS REPORT
router.post("/rdlOneDone/units", async (req, res, next) => {
  try {
    let { location, page, rowsPerPage } = req.body;
    page++;
    const limit = parseInt(rowsPerPage);
    const skip = (page - 1) * rowsPerPage;
    let data = await reportingAgentRouter.rdlOneDoneUnits(
      location,
      limit,
      skip
    );
    if (data) {
      res.status(200).json({
        data: data.units,
        count: data.count,
      });
    }
  } catch (error) {
    next(error);
  }
});
router.post("/search/rdlOneDoneUnits", async (req, res, next) => {
  try {
    let { searchData, location, rowsPerPage, page } = req.body;
    page++;
    const limit = parseInt(rowsPerPage);
    const skip = (page - 1) * rowsPerPage;
    let data = await Elasticsearch.searchRdlOneDoneUnits(
      searchData,
      limit,
      skip,
      location
    );
    if (data.searchResult.length !== 0) {
      res.status(200).json({
        data: data.searchResult,
        count: data.count,
      });
    } else {
      res.status(202).json({
        data: data.searchResult,
        count: data.count,
      });
    }
  } catch (error) {
    next(error);
  }
});
/* TRACK  ITEM BASED ON THE UIC / IMEI */
router.post("/track-item", async (req, res, next) => {
  try {
    const { inputData, location } = req.body;
    const searchResult = await reportingAgentRouter.findItemBasedOnInput(
      inputData,
      location
    );
    if (searchResult.status == 1) {
      res.status(200).json({
        data: searchResult.data,
      });
    } else {
      res.status(202).json({
        message: "Sorry no records",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* TRACK TRAY */
router.post("/track-tray", async (req, res, next) => {
  try {
    const { location, trayId } = req.body;
    const trayData = await reportingAgentRouter.trackTray(location, trayId);
   
    if (trayData.status == 1) {
      res.status(200).json({
        data: trayData.tray,
        otherDetails:trayData.otherDetails
      });
    } else {
      res.status(202).json({
        message: "Sorry no records",
      });
    }
  } catch (error) {
    next(error);
  }
});
module.exports = router;
