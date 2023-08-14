/* Express */
const express = require("express");
const router = express.Router();
// user controller
const misUserController = require("../../Controller/misUser/misUserController");
// Multer
const Elasticsearch = require("../../Elastic-search/elastic");
/*******************************************************************************************************************/
/********************************************ORDERS*****************************************************************/
/* Bulk Orders Validation */
router.post("/bulkOrdersValidation", async (req, res, next) => {
  try {
    let data = await misUserController.bulkOrdersValidation(req.body);
    if (data.status == true) {
      res.status(200).json({
        message: "Successfully Validated",
      });
    } else {
      res.status(202).json({
        data: data.data,
        message: "Please Check Errors",
      });
    }
  } catch (error) {
    next(error);
  }
});

/* MIS DASHBOARD DATA */
router.post("/dashboardData/:location", async (req, res, next) => {
  try {
    const { location } = req.params;
    let data = await misUserController.dashboardData(location);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});

/*Import Order*/
router.post("/ordersImport", async (req, res, next) => {
  try {
    let data = await misUserController.importOrdersData(req.body);
    if (data) {
      res.status(200).json({
        message: "Successfully Added",
      });
    } else {
      res.status(404).json({
        message: "Orders Import Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* Get Bad Orders */
router.post("/getBadOrders", async (req, res, next) => {
  try {
    let { location, page, size } = req.body;
    page++;
    const limit = parseInt(size);
    const skip = (page - 1) * size;
    let data = await misUserController.getBadOrders(location, limit, skip);
    if (data.badOrdersData.length !== 0) {
      res.status(200).json({
        data: data.badOrdersData,
        count: data.count,
        dataForDownload: data.dataForDownload,
      });
    } else {
      res.status(202).json({
        data: data.badOrdersData,
        count: data.count,
      });
    }
  } catch (error) {
    next(error);
  }
});
/* SEARCH ORDERS */
router.post("/ordersSearch", async (req, res, next) => {
  try {
    let { type, searchData, location, rowsPerPage, page } = req.body;
    page++;
    const limit = parseInt(rowsPerPage);
    const skip = (page - 1) * rowsPerPage;
    let data = await misUserController.searchOrders(
      type,
      searchData,
      location,
      limit,
      skip
    );
    if (data.orders.length !== 0) {
      res.status(200).json({
        data: data.orders,
        count: data.count,
      });
    } else {
      res.status(202).json({
        data: data.orders,
        count: 0,
      });
    }
  } catch (error) {
    next(error);
  }
});
/* SEARCH BAD ORDERS */
router.post("/badOrdersSearch", async (req, res, next) => {
  try {
    let { type, searchData, location, rowsPerPage, page } = req.body;
    page++;
    const limit = parseInt(rowsPerPage);
    const skip = (page - 1) * rowsPerPage;
    let data = await misUserController.badOrdersSearch(
      type,
      searchData,
      location,
      limit,
      skip
    );
    if (data.orders.length !== 0) {
      res.status(200).json({
        data: data.orders,
        count: data.count,
      });
    } else {
      res.status(202).json({
        data: data.orders,
        count: 0,
      });
    }
  } catch (error) {
    next(error);
  }
});
/*********************************************Recon sheet******************************************************** */
/*Get Orders*/
router.post("/getOrdersCount/:location", async (req, res, next) => {
  try {
    let data = await misUserController.getOrdersCount(req.params.location);
    if (data) {
      res.status(200).json({
        data,
      });
    }
  } catch (error) {
    next(error);
  }
});
router.post("/getOrders/:location/:page/:size", async (req, res, next) => {
  try {
    let { location, page, size } = req.params;

    page++;
    const limit = parseInt(size);
    const skip = (page - 1) * size;
    let data = await misUserController.getOrders(location, limit, skip);
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
});
/* New Orders */
router.post("/newOrders/:location", async (req, res, next) => {
  try {
    let data = await misUserController.getNewOrders(req.params.location);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
/* Get Delivered Orders */
router.post(
  "/getDeliveredOrders/:location/:page/:size",
  async (req, res, next) => {
    try {
      let { location, page, size } = req.params;
      page++;
      const limit = parseInt(size);
      const skip = (page - 1) * size;
      let data = await misUserController.getDeliveredOrders(
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
/* Not Delivered Orders */
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
      let data = await misUserController.notDeliveredOrders(
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
/* SEARCH BAD ORDERS */
router.post("/searchDeliveredOrders", async (req, res, next) => {
  try {
    let { type, searchData, location, status, rowsPerPage, page } = req.body;
    page++;
    const limit = parseInt(rowsPerPage);
    const skip = (page - 1) * rowsPerPage;
    let data = await misUserController.searchDeliveredOrders(
      type,
      searchData,
      location,
      status,
      limit,
      skip
    );
    if (data.orders.length !== 0) {
      res.status(200).json({
        data: data.orders,
        count: data.count,
      });
    } else {
      res.status(202).json({
        data: data.orders,
        count: 0,
      });
    }
  } catch (error) {
    next(error);
  }
});

/* Delivered But Not order Id */
router.post("/deliveredNoOrderId/:location", async (req, res, next) => {
  try {
    let data = await misUserController.getdeliveredNoOrderId(
      req.params.location
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
/**********************************************************************************************************************************************/
/* Bulk Delivery Validation */
router.post("/bulkValidationDelivery", async (req, res, next) => {
  try {
    let data = await misUserController.bulkValidationDelivery(req.body);
    if (data.status == true) {
      res.status(200).json({
        message: "Successfully Validated",
      });
    } else {
      res.status(202).json({
        data: data.err,
      });
    }
  } catch (error) {
    next(error);
  }
});
/* Import Delivery */
router.post("/importDelivery", async (req, res, next) => {
  try {
    let data = await misUserController.importDelivery(req.body);
    if (data) {
      res.status(200).json({
        message: "Successfully Added",
      });
    } else {
      res.status(202).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* Get Delivery */
router.post("/getDeliveryCount/:location", async (req, res, next) => {
  try {
    let data = await misUserController.getDeliveryCount(req.params.location);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
router.post("/getAllDelivery/:location/:page/:size", async (req, res, next) => {
  try {
    let { location, page, size } = req.params;

    page++;
    const limit = parseInt(size);
    const skip = (page - 1) * size;
    let data = await misUserController.getDelivery(location, limit, skip);
    if (data) {
      res.status(200).json({
        data: data,
        message: "Success",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* Get BAD Delivery */
router.post("/getBadDelivery", async (req, res, next) => {
  try {
    let { location, page, size } = req.body;
    page++;
    const limit = parseInt(size);
    const skip = (page - 1) * size;
    let data = await misUserController.getBadDelivery(location, limit, skip);
    if (data.badDeliverydata.length !== 0) {
      res.status(200).json({
        data: data.badDeliverydata,
        count: data.count,
      });
    } else {
      res.status(202).json({
        data: data.badDeliverydata,
        count: 0,
      });
    }
  } catch (error) {
    next(error);
  }
});
/* SEARCH DELIVERY DATA */
router.post("/searchDelivery", async (req, res, next) => {
  try {
    let { type, searchData, location, rowsPerPage, page } = req.body;
    page++;
    const limit = parseInt(rowsPerPage);
    const skip = (page - 1) * rowsPerPage;
    let data = await misUserController.searchDeliveryData(
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
/* SEARCH TRACK ITEM DATA */
router.post("/search-mis-track-item", async (req, res, next) => {
  try {
    let { searchData, location, rowsPerPage, page, type } = req.body;
    page++;
    const limit = parseInt(rowsPerPage);
    const skip = (page - 1) * rowsPerPage;
    let data = await Elasticsearch.superMisItemSearchData(
      searchData,
      limit,
      skip,
      location,
      type
    );
    if (data.limitedResult.length !== 0) {
      res.status(200).json({
        data: data.limitedResult,
        allMatchedResult: data.allMatchedResult,
        count: data.count,
      });
    } else {
      res.status(202).json({
        data: data.limitedResult,
        allMatchedResult: data.allMatchedResult,
        count: data.count,
      });
    }
  } catch (error) {
    next(error);
  }
});
/* SEARCH BAD DELIVERY DATA */
router.post("/searchBadDelivery", async (req, res, next) => {
  try {
    const { type, searchData, location } = req.body;
    let data = await misUserController.searchBagDeliveryData(
      type,
      searchData,
      location
    );
    if (data.length !== 0) {
      res.status(200).json({
        data: data,
      });
    } else {
      res.status(202).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
/**************************************************Dashboard*********************************************************************************/
router.get("/dashboard", async (req, res, next) => {
  try {
    let data = await misUserController.dashboard();
    if (data) {
      res.status(200).json({
        data: data,
        message: "Success",
      });
    }
  } catch (error) {
    next(error);
  }
});
/*********************************************UIC**************************************************************************************************** */
/* GET UIC DOWNLOAD PAGE */
router.post("/uicPageData/:location/:page/:size", async (req, res, next) => {
  try {
    let { location, page, size } = req.params;

    page++;
    const limit = parseInt(size);
    const skip = (page - 1) * size;
    let data = await misUserController.getUicPage(location, limit, skip);
    if (data) {
      res.status(200).json({
        data: data.data,
        count: data.count,
      });
    }
  } catch (error) {
    next(error);
  }
});
/* UIC PAGE ALL DATA SEARCH */
/* SEARCH BAD DELIVERY DATA */
router.post("/searchUicPage", async (req, res, next) => {
  try {
    let { type, searchData, location, uic_status, rowsPerPage, page } =
      req.body;
    page++;
    const limit = parseInt(rowsPerPage);
    const skip = (page - 1) * rowsPerPage;
    let data = await misUserController.searchUicPageAll(
      type,
      searchData,
      location,
      uic_status,
      limit,
      skip
    );
    if (data.orders.length !== 0) {
      res.status(200).json({
        data: data.orders,
        count: data.count,
      });
    } else {
      res.status(202).json({
        data: data.orders,
        count: 0,
      });
    }
  } catch (error) {
    next(error);
  }
});
router.post("/searchUicPageAllPage", async (req, res, next) => {
  try {
    let { type, searchData, location, uic_status, rowsPerPage, page } =
      req.body;
    page++;
    const limit = parseInt(rowsPerPage);
    const skip = (page - 1) * rowsPerPage;
    let data = await misUserController.searchUicPageAllPage(
      type,
      searchData,
      location,

      limit,
      skip
    );
    if (data.orders.length !== 0) {
      res.status(200).json({
        data: data.orders,
        count: data.count,
      });
    } else {
      res.status(202).json({
        data: data.orders,
        count: 0,
      });
    }
  } catch (error) {
    next(error);
  }
});
/* Add UIC */
router.post("/addUicCode", async (req, res, next) => {
  try {
    let data = await misUserController.addUicCode(req.body);
    if (data) {
      res.status(200).json({
        message: "Successfully Added",
      });
    } else {
      res.status(202).json({
        message: "Creation Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* Get uic genrated */
router.post("/uicGeneratedRecon", async (req, res, next) => {
  try {
    let data = await misUserController.getUicRecon(req.body);

    if (data) {
      res.status(200).json({
        data: data.data,
        count: data.count,
      });
    }
  } catch (error) {
    next(error);
  }
});
/* Get uic genrated */
router.post("/SearchUicGeneratedReconPage", async (req, res, next) => {
  try {
    const { type, searchData, location, stage } = req.body;
    let data = await misUserController.searchUicReconPage(
      type,
      searchData,
      location
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
/* Change uic Status */
router.post("/changeUicStatus/:id", async (req, res, next) => {
  try {
    let data = await misUserController.changeUicStatus(req.params.id);
    if (data.status) {
      res.status(200).json({
        message: "Successfully Updated",
      });
    } else {
      res.status(202).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
/******************************************************BAG ASSIGN*********************************************************************** */
/* Bag Assign */
router.post("/getStockin/:location", async (req, res, next) => {
  try {
    let data = await misUserController.getStockin(req.params.location);
    if (data) {
      res.status(200).json({
        data: data,
        message: "Success",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* GET BOT TEAM */
router.post("/getBot/:location", async (req, res, next) => {
  try {
    let data = await misUserController.getBot(req.params.location);
    if (data) {
      res.status(200).json({
        data: data,
        message: "Success",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* Bag issued Request send to Warehouse dept */
router.post("/issueRequestSend", async (req, res, next) => {
  try {
    let data = await misUserController.sendIssueRequest(req.body);
    if (data.status == 1) {
      res.status(200).json({
        message: "Requested",
      });
    } else if (data.status == 0) {
      res.status(202).json({
        message: "Please confirm UIC",
        bagId: req.body.bagId,
      });
    }
  } catch (error) {
    next(error);
  }
});
/******************************REMOVE BAD ORDERS************************************************ */
router.post("/deleteBadOrders", async (req, res, next) => {
  try {
    let data = await misUserController.deleteBadOrders(req.body);
    if (data) {
      res.status(200).json({
        message: "Successfully Deleted",
      });
    } else {
      res.status(202).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
/********************************REMOVE BAD DELIVERY******************************************************* */
router.post("/deleteBadDelivery", async (req, res, next) => {
  try {
    let data = await misUserController.deleteBadDelivery(req.body);
    if (data) {
      res.status(200).json({
        message: "Successfully Deleted",
      });
    } else {
      res.status(202).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
/****************************************BAG WISE UIC GENERATE************************************************************************* */
router.post("/getBagItemWithUic/:bagId", async (req, res, next) => {
  try {
    let data = await misUserController.getBagItemForUic(req.params.bagId);

    if (data.status == 1) {
      res.status(200).json({
        data: data.data,
      });
    } else if (data.status == 2) {
      res.status(202).json({
        message: "Details not found",
      });
    } else if (data.status == 3) {
      res.status(202).json({
        message: `${req.params.bagId} - present at ${data.data[0].sort_id}`,
      });
    }
  } catch (error) {
    next(error);
  }
});
/************************************MIS BOT TO WHT LIST****************************************************** */
/* GET CLOSED BOT TRAY BASED ON THE DAY WISE DATA */
router.post("/wh-closed-bot-tray/:location", async (req, res, next) => {
  try {
    let date = new Date(); // Today!
    date.setDate(date.getDate() - 1);
    let data = await misUserController.getWhClosedBotTrayTillLastDay(
      date,
      req.params.location
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
/* ASSIGN FOR SORTING PAGE DATA  */
router.post("/assign-for-sorting", async (req, res, next) => {
  try {
    let data = await misUserController.assignForSortingData(req.body);
    if (data) {
      res.status(200).json({
        data: data,
      });
    } else {
      res.status(202).json({
        message: "Tray is not exists or not in closed satge",
      });
    }
  } catch (error) {
    next(error);
  }
});
/***************************************BOT TO WHT *************************************** */
router.post("/wht-bot-sort", async (req, res, next) => {
  try {
    const { date, location } = req.body;
    let data = await misUserController.sortWhClosedBotTray(date, location);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
/* GET Sorting Agent */
router.post("/getSortingAgent/:location", async (req, res, next) => {
  try {
    let data = await misUserController.getSortingAgent(req.params.location);
    if (data) {
      res.status(200).json({
        data: data,
        message: "Success",
      });
    }
  } catch (error) {
    next(error);
  }
});
// ASSIGN FOR SORTING VIEW CLUBED DATA
router.post("/view-bot-clubed-data-model", async (req, res, next) => {
  try {
    let data = await misUserController.getModelBasedDataFromBot(req.body);
    if (data) {
      res.status(200).json({
        data: data,
      });
    } else {
      res.status(202).json({
        message: "No data found",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* WHT TRAY ASSIGNEMENT */
router.post("/wht-tray-assigne-screen", async (req, res, next) => {
  try {
    let data = await misUserController.whtTrayAssignScreen(req.body);
    if (data) {
    }
  } catch (error) {
    next(error);
  }
});
/* CHECK READY FOR SORTING */
router.post("/check-all-wht-inuse-for-sorting", async (req, res, next) => {
  try {
    let data = await misUserController.checkAllWhtInUseForSorting(req.body);
    if (data.length == 0) {
      res.status(200).json({
        message: "Ready For Sorting",
      });
    } else if (data.length !== 0) {
      let arr = data.toString();
      res.status(202).json({
        message: `${arr} - This Tray's Are Already In Sorting`,
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
/* BOT TRAY ASSIGNED TO SORTING AGENT */
router.post("/assign-to-sorting-agent", async (req, res, next) => {
  try {
    let data = await misUserController.botTrayAssignedToSortingAgent(req.body);
    if (data) {
      res.status(200).json({
        message: "Request Send To wareshouse",
      });
    } else {
      res.status(202).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* VIEW SORTING REQUESTS */
router.post(
  "/view-sorting-item/:location/:pageType",
  async (req, res, next) => {
    try {
      let data = await misUserController.viewSortingRequests(
        req.params.location,
        req.params.pageType
      );
      if (data) {
        res.status(200).json({
          data: data,
        });
      } else {
        res.status(202).json({
          message: "Failed",
        });
      }
    } catch (error) {
      next(error);
    }
  }
);
/********************************************ASSIGN TO CHARGING***************************************************************************************** */
/* GET READY FOR CHARGING WHT TRAY */
router.post("/ready-for-charging-wht", async (req, res, next) => {
  try {
    let data = await misUserController.getReadyForChargingWhtTray();
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
/* SORT TRAY BASED ON THE BRAND AND MODEL */
router.post("/toWhtTrayForMerge", async (req, res, next) => {
  try {
    const {
      location,
      brand,
      model,
      fromTray,
      itemCount,
      status,
      type,
      sortId,
      grade,
    } = req.body;
    console.log(req.body);
    let data = await misUserController.toWhtTrayForMerging(
      location,
      brand,
      model,
      fromTray,
      itemCount,
      status,
      type,
      sortId,
      grade
    );
    if (data.status === 1) {
      res.status(200).json({
        data: data.tray,
      });
    } else if (data.status === 0) {
      res.status(202).json({
        message: `Currently no ${type} tray in this brand and model`,
      });
    }
  } catch (error) {
    next(error);
  }
});

/* GET CHARGING USERS FOR ASSIGN WHT TRAY */
router.post(
  "/get-charging-users/:user_type/:location",
  async (req, res, next) => {
    try {
      let data = await misUserController.getChargingUsers(
        req.params.user_type,
        req.params.location
      );
      if (data) {
        res.status(200).json({
          data: data,
        });
      }
    } catch (error) {
      next(error);
    }
  }
);
/* AFTER SELECT THE CHARGING USER WHT TRAY WILL GO TO WH PANEL */
router.post("/wht-sendTo-wharehouse", async (req, res, next) => {
  try {
    let data = await misUserController.whtSendToWh(req.body);
    if (data) {
      res.status(200).json({
        message: "Successfully Requested to Warehouse",
      });
    } else {
      res.status(202).json({
        message: "Failed Tray Again..",
      });
    }
  } catch (error) {
    next(error);
  }
});
/********************************WHT TRAY MERGE****************************************************** */
/* SORT TRAY BASED ON THE BRAND AND MODEL */
router.post("/sort-wht-tray-brand-model", async (req, res, next) => {
  try {
    const { location, brand, model } = req.body;
    let data = await misUserController.sortWhtTrayBrandAndModel(
      location,
      brand,
      model
    );
    if (data) {
      res.status(200).json({
        data: data,
      });
    } else {
      res.status(202).json({
        message: "No wht tray found",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* TWO TRAY CHECK READY FOR MERGING */
router.post("/check-ready-for-merge", async (req, res, next) => {
  try {
    let data = await misUserController.checkWhtreadyForMerge(req.body);
    if (data.status) {
      res.status(200).json({
        message: "Ready for merge",
      });
    } else {
      res.status(202).json({
        message: "Sorry You can't Send to Sorting",
      });
    }
  } catch (error) {
    next(error);
  }
});

/* MERGE REQUEST SENT TO WAREHOUSE */
router.post("/merge-request-sent-to-wh", async (req, res, next) => {
  try {
    let data = await misUserController.mergRegquestSendToWh(req.body);
    if (data) {
      res.status(200).json({
        message: "Request Sent to Warehouse",
      });
    } else {
      res.status(202).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});

/********************************BAG TRANSACTION********************************* */
/* GET BAG FOR TRANSACTION */
router.post("/getBag-for-transaction/:location", async (req, res, next) => {
  try {
    const { location } = req.params;
    let data = await misUserController.getBagForTransfer(location);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
/* View Item */
router.post("/view-bag-item/:location/:bagId", async (req, res, next) => {
  try {
    const { location, bagId } = req.params;
    let data = await misUserController.viewBagitem(location, bagId);
    if (data) {
      res.status(200).json({
        data: data,
      });
    } else {
      res.status(202).json({
        message: "No Data Found",
      });
    }
  } catch (error) {
    next(error);
  }
});
/************************************MMT MERGE***************************************************** */
/* GET MMT TRAY IN CLOSED STATE */
router.post("/getClosedMmtTray/:location", async (req, res, next) => {
  try {
    const { location } = req.params;
    let data = await misUserController.getClosedMmttray(location);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
/* GET SORTING AGENT FOR ASSIGN MMT TRAY FOR MERGE */
router.post("/getSortingAgentMergeMmt/:location", async (req, res, next) => {
  try {
    const { location } = req.params;
    let data = await misUserController.getSortingAgentForMergeMmt(location);

    if (data) {
      res.status(200).json({
        data: data,
      });
    } else {
      res.status(202).json({
        message: "No sorting-agent avilable for now",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* GET TO MMT TRAY FOR MERGE*/
router.post(
  "/toMmtTrayForMerge/:fromTray/:location/:itemsCount",
  async (req, res, next) => {
    try {
      console.log(req.params);
      const { fromTray, location, itemsCount } = req.params;
      let mmtTray = await misUserController.getToTrayMmtMerge(
        fromTray,
        location,
        itemsCount
      );
      if (mmtTray.status === 1) {
        res.status(200).json({
          data: mmtTray.tray,
        });
      } else {
        res.status(202).json({
          message: "Currently no mmt tray for merge",
        });
      }
    } catch (error) {
      next(error);
    }
  }
);
/* MMT TRAY MERGE REQUEST SEND TO WAREHOUSE */
router.post("/TrayMergeRequestSend", async (req, res, next) => {
  try {
    const { sort_agent, fromTray, toTray } = req.body;
    let data = await misUserController.mmtMergeRequestSendToWh(
      sort_agent,
      fromTray,
      toTray
    );
    if (data.status === 1) {
      res.status(200).json({
        message: "Request Successfully Sent to Warehouse",
      });
    } else {
      res.status(202).json({
        message: "Failed Please tray again..",
      });
    }
  } catch (error) {
    next(error);
  }
});
/*---------------------------------IMEI SEARCH--------------------------------------------*/
//THIS TWO API'S ARE NOT NEED IN V7.2 IMEI SEARCH CONVERTED TO UIC SEARCH FROM TEMP TABLE
// router.post("/imeiDeliverySearch", async (req, res, next) => {
//   try {
//     const { value } = req.body;
//     let resultdata = await misUserController.imeiSearchDelivery(value);
//     res.json({ resultdata });
//   } catch (error) {
//     next(error);
//   }
// });

// router.post("/imeiOrderSearch", async (req, res, next) => {
//   try {
//     const { value } = req.body;
//     let resultdata = await misUserController.imeiSearchOrder(value);
//     if (resultdata?.status) {
//       res.json({ error: "invaid IMEI" });
//     }
//     res.json({ resultdata });
//   } catch (error) {
//     next(error);
//   }
// });
/*------------------------------------PICKUP MODULE-----------------------------------------------*/
//GET ITEM BASED ON THE TABS
router.post("/pickup/items/:type/:location", async (req, res, next) => {
  try {
    let { type, page, location } = req.params;
    const data = await misUserController.pickupPageItemView(type, location);
    if (data.items.length !== 0) {
      res.status(200).json({
        data: data.items,
        type: type,
      });
    } else {
      res.status(202).json({
        data: data.items,
        type: type,
        message: "No data found",
      });
    }
  } catch (error) {
    next(error);
  }
});
// GET DATA BASED ON THE FROM DATE AND TO DATE
router.post("/pickup/dateFilter", async (req, res, next) => {
  try {
    let { type, location, selectedStatus } = req.body;
    const data = await misUserController.pickUpDateWiseFilter(
      type,
      location,
      selectedStatus
    );

    if (data.items.length !== 0) {
      res.status(200).json({
        data: data.items,
        type: type,
      });
    } else {
      res.status(202).json({
        data: data.items,
        type: type,
        message: "No data found",
      });
    }
  } catch (error) {
    next(error);
  }
});
//GET ITEM BASED ON THE TABS SEE ALL
router.post("/pickup/seeAll/:type/:location", async (req, res, next) => {
  try {
    let { type, page, location } = req.params;
    const data = await misUserController.pickupPageItemViewSeeAll(
      type,
      location
    );
    if (data.items.length !== 0) {
      res.status(200).json({
        data: data.items,
        type: type,
      });
    } else {
      res.status(202).json({
        data: data.items,
        type: type,
        message: "No data found",
      });
    }
  } catch (error) {
    next(error);
  }
});

// SORT ITEM BASED ON THE BRAND AND MODEL
router.post("/pickup/sortItem", async (req, res, next) => {
  try {
    let { brand, model, type, location } = req.body;
    let data = await misUserController.pickUpSortBrandModel(
      brand,
      model,
      type,
      location
    );

    if (data.items.length !== 0) {
      res.status(200).json({
        data: data.items,
      });
    } else {
      res.status(202).json({
        data: data.items,

        message: "No records found",
      });
    }
  } catch (error) {
    next(error);
  }
});
// UIC SEARCH
router.post("/pickup/uicSearch/:uic/:type", async (req, res, next) => {
  try {
    const { uic, type } = req.params;
    const data = await misUserController.pickupPageUicSearch(uic, type);

    if (data.items.length !== 0) {
      res.status(200).json({
        data: data.items,
        count: data.count,
      });
    } else {
      res.status(202).json({
        data: data.items,
        count: data.count,
        message: "No records found",
      });
    }
  } catch (error) {
    next(error);
  }
});
// GET SORTING AGENT AND CHECK ITEMS BRAND AND MODEL ALSO FETCH WHT TRAY
router.post("/pickup/whtTray", async (req, res, next) => {
  try {
    let data = await misUserController.pickupPageGetWhtTray(req.body);

    if (data.status == 1) {
      res.status(200).json({
        data: data.whtTray,
      });
    } else if (data.status == 2) {
      res.status(202).json({
        message: `${data.item} - Mismatch Brand or Model Not Possible to Assign or inprogress`,
      });
    }
  } catch (error) {
    next(error);
  }
});

// SEND ITEM TO PICKUP
router.post("/pickup/requestSendToWh", async (req, res, next) => {
  try {
    let data = await misUserController.pickupRequestSendToWh(req.body);
    if (data) {
      res.status(200).json({
        message: "Request sent to warehouse",
      });
    } else {
      res.status(202).json({
        message: "Failed tray again...",
      });
    }
  } catch (error) {
    next(error);
  }
});
/*-------------------------------------------WHT UTILITY MODULE 7.2----------------------------------------*/
// IMPORT XLSX DATA TO TEMP ORDER AND DELIVERY TABLE
router.post("/whtUtility/importFile", async (req, res, next) => {
  try {
    let data = await misUserController.whtUtilityImportFile(req.body);
    if (data.status == 1) {
      res.status(200).json({
        message: "Successfully Imported",
      });
    } else {
      res.status(202).json({
        message: "Import file failed",
      });
    }
  } catch (error) {
    next(error);
  }
});

//GET DATA for wht utility
router.post("/whtutility/search/:oldUic", async (req, res, next) => {
  try {
    const { oldUic } = req.params;
    let data = await misUserController.whtutilitySearch(oldUic);

    if (data.status == 1) {
      res.status(200).json({
        tempOrder: data.tempOrderData,
        tempDelivery: data.tempDeliveryData,
        orgOrder: data.orgOrder,
        orgDelivery: data.orgDelivery,
      });
    } else {
      res.status(202).json({
        message: "No data found",
      });
    }
  } catch (error) {
    next(error);
  }
});
//WHT UTILITY IMPORT ORDER
router.post("/whtutility/importOrder", async (req, res, next) => {
  try {
    let data = await misUserController.whtUtilityImportOrder(req.body);
    if (data.status == 1) {
      res.status(200).json({
        message: "Successfully Added",
      });
    } else if (data.status == 2) {
      res.status(202).json({
        message: `${data.arr} - not exists`,
      });
    } else if (data.status == 4) {
      res.status(202).json({
        message: `Already Added`,
      });
    } else {
      res.status(200).json({
        message: "Failed please try again",
      });
    }
  } catch (error) {
    next(error);
  }
});
//WHT UTILITY GET BAG ID and BOT TRAY
router.post("/whtUtility/bagAndBotTray/:location", async (req, res, next) => {
  try {
    const { location } = req.params;
    let data = await misUserController.whtUtilityBagAndBot(location);

    if (data) {
      res.status(200).json({
        tray: data.tray,
        bag: data.bag,
        botUsers: data.botUsers,
      });
    }
  } catch (error) {
    next(error);
  }
});
// WHT UTILITY BOT TRAY FOR INUSE
router.post("/whtUtility/botTray", async (req, res, next) => {
  try {
    let data = await misUserController.whtUtilityGetBotTrayInuse();
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
router.post("/whtUtility/addDelivery", async (req, res, next) => {
  try {
    let data = await misUserController.whtutilityAddDelivery(req.body);
    if (data.status == 1) {
      res.status(200).json({
        message: "Successfully Imported",
      });
    } else if (data.status == 2) {
      res.status(202).json({
        message: `${data.arr} - not exists`,
      });
    } else if (data.status == 5) {
      res.status(202).json({
        message: `Already Added`,
      });
    } else {
      res.status(202).json({
        message: "Failed please try again",
      });
    }
  } catch (error) {
    next(error);
  }
});
//BOT TRAY CLOSE PAGE
router.post(
  "/whtUtility/botTray/closePage/:trayId/:status",
  async (req, res, next) => {
    try {
      const { trayId, status } = req.params;
      let data = await misUserController.whtUtilityBotTrayGetOne(
        trayId,
        status
      );
      if (data.status == 1) {
        res.status(200).json({
          data: data.tray,
        });
      } else if (data.status == 2) {
        res.status(202).json({
          message: "Tray is not exists",
        });
      } else if (data.status == 3) {
        res.status(202).json({
          message: "You can't access this data",
        });
      }
    } catch (error) {
      next(error);
    }
  }
);
//OLD UIC SCAN FOR BOT TRAY CLOSE
router.post("/whtUtility/botTray/oldUic", async (req, res, next) => {
  try {
    const { trayId, uic } = req.body;
    let data = await misUserController.checkUicFroWhtUtility(trayId, uic);

    if (data.status == 1) {
      res.status(202).json({
        message: "UIC Does Not Exists",
      });
    } else if (data.status == 2) {
      res.status(202).json({
        message: "UIC Not Exists In This Tray",
      });
    } else if (data.status == 3) {
      res.status(202).json({
        message: "Already Added",
      });
    } else if (data.status == 4) {
      res.status(200).json({
        message: "Valid UIC",
        data: data.data,
      });
    } else if (data.status == 6) {
      res.status(202).json({
        message: "Not Delivered",
        data: data.data,
      });
    } else if (data.status == 7) {
      res.status(202).json({
        message: "UIC not printed Yet",
        data: data.data,
      });
    }
  } catch (error) {
    next(error);
  }
});
// WHT UTILITY OLD UIC TO NEW UIC SAVE
router.post("/whtUtility/resticker/save/:trayId", async (req, res, next) => {
  try {
    const { trayId } = req.params;
    let data = await misUserController.whtUtilityRestickerSave(trayId);
    if (data.status == 1) {
      res.status(200).json({
        message: "Data Saved",
      });
    } else {
      res.status(202).json({
        message: "Failed Please tray again...",
      });
    }
  } catch (error) {
    next(error);
  }
});
router.post("/auditDoneWht/:location", async (req, res, next) => {
  try {
    const { location } = req.params;
    let data = await misUserController.getAuditDone(location);
    if (data) {
      res.status(200).json({
        data: data,
      });
    } else {
      res.status(202).json();
    }
  } catch (error) {
    next(error);
  }
});

router.post(
  "/assignToAgent/rdl-fls/sentToWarehouse",
  async (req, res, next) => {
    try {
      const { tray, user_name, sortId } = req.body;
      let data = await misUserController.assignToAgentRequestToWhRdlFls(
        tray,
        user_name,
        sortId
      );
      if (data.status == true) {
        res.status(200).json({
          message: "Request sent to Warehouse",
        });
      } else {
        res.status(202).json({
          message: "Request failed please try again...",
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/assignToAgent/rdl-fls/users/:user_type/:location",
  async (req, res, next) => {
    try {
      let data = await misUserController.getRdlFlsUser(
        req.params.user_type,
        req.params.location
      );
      if (data) {
        res.status(200).json({
          data: data,
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

router.post("/RDLoneDoneTray/:location", async (req, res, next) => {
  try {
    const { location } = req.params;
    let data = await misUserController.getRdlDonetray(location);
    if (data) {
      res.status(200).json({
        data: data,
      });
    } else {
      res.status(202).json();
    }
  } catch (error) {
    next(error);
  }
});
/*------------------------------------CTX TRAY TRANSFER--------------------------------*/
// GET SALES LOCATION
router.post("/ctx/getTransferLocation/:userCpcType", async (req, res, next) => {
  try {
    const { userCpcType } = req.params;
    let data = await misUserController.getSalesLocation(userCpcType);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
//ctx tray transfer request sent to warehouse
router.post("/ctx/transferRequestSend", async (req, res, next) => {
  try {
    const data = await misUserController.ctxTrayTransferRequestSend(req.body);
    if (data.status == 1) {
      res.status(200).json({
        message: "Request Sent to Warehouse",
      });
    } else if (data.status == 2) {
      res.status(202).json({
        message: "Failed Please try again...",
      });
    }
  } catch (error) {
    next(error);
  }
});
/*----------------------------------------CTX TO STX TRANSFER----------------------------------------------*/
// GET STX TRAY
router.post("/sorting/ctxToStx/stxTray", async (req, res, next) => {
  try {
    const { location, brand, model, fromTray, itemCount, status, type } =
      req.body;
    let data = await misUserController.sortingCtxToStxStxTrayGet(
      location,
      brand,
      model,
      fromTray,
      itemCount,
      status,
      type
    );
    if (data.status === 1) {
      res.status(200).json({
        data: data.tray,
      });
    } else if (data.status === 0) {
      res.status(202).json({
        message: `Currently no STX tray in this brand and model or Grade`,
      });
    } else if (data.status == 3) {
      res.status(202).json({
        message: `${type} Not found in category`,
      });
    }
  } catch (error) {
    next(error);
  }
});
//CTX AND STX TRAY SEND TO WAREHOUSE FOR SORTING APPOROVEL
router.post("/sorting/ctxToStx/request/sendToWh", async (req, res, next) => {
  try {
    const { sort_agent, fromTray, toTray } = req.body;
    let data = await misUserController.sortingCtxtoStxRequestSendToWh(
      sort_agent,
      fromTray,
      toTray
    );
    if (data.status === 1) {
      res.status(200).json({
        message: "Request Successfully Sent to Warehouse",
      });
    } else {
      res.status(202).json({
        message: "Failed Please tray again..",
      });
    }
  } catch (error) {
    next(error);
  }
});
/*-----------------------------------ASSING TO RDL 2 AND WHT TO RP SORTING ------------------------*/
// SCREEN LIST OF MUIC TO REPIRS
router.post("/whToRp/muicList/repair/:location", async (req, res, next) => {
  try {
    const { location } = req.params;
    let data = await misUserController.whtToRpMuicListToRepair(location);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
// ASSIGN FOR REPAIR AND SORTING
router.post("/whToRpAssignForRepair", async (req, res, next) => {
  try {
    const { location, brand, model } = req.body;
    let data = await misUserController.whtToRpMuicListToRepairAssignForRepair(
      location,
      brand,
      model
    );
    if (data.status == 1) {
      res.status(200).json({
        data: data.findItem,
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
//ASSIGN FOR REPAIR AND CHECK THE STOCK AVAILABILTY
router.post("/assignForRepiar/stockCheck", async (req, res, next) => {
  try {
    const { partList, uic, isCheck, checked, selectedQtySp } = req.body;
    let data = await misUserController.assignForRepairStockCheck(
      partList,
      uic,
      isCheck,
      checked,
      selectedQtySp
    );
    if (data.status == 1) {
      res.status(200).json({
        data: data.isCheck,
        countofStock: data.countofStock,
      });
    } else if (data.status == 0) {
      res.status(202).json({
        message: `${data.partid} - out of stock`,
      });
    } else if (data.status == 5) {
      res.status(202).json({
        message: "Part is not active state or not exists",
      });
    } else if (data.status == 6) {
      res.status(202).json({
        message: "Part is not connected to box",
      });
    }
  } catch (error) {
    next(error);
  }
});

// PLANNER PAGE
router.post("/plannerPage/charging", async (req, res, next) => {
  try {
    const { location, type, type1 } = req.body;
    let data = await misUserController.plannerPageCharging(
      location,
      type,
      type1
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

// ASSIGNE TO CHARGING PAGE
router.post("/assignToChargingScreen", async (req, res, next) => {
  try {
    const { type, type1, location, brand, model, jack } = req.body;
    let data = await misUserController.assigneToChargingScreen(
      location,
      brand,
      model,
      jack,
      type,
      type1
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
// ASSIGN TO SORTING WHT TO RP
router.post("/assignForRepiar/getTheRequrements", async (req, res, next) => {
  try {
    const { location, uicLength, brand, model, isCheck, selectedQtySp } =
      req.body;
    let data = await misUserController.assignForRepairSortingGetTheRequrements(
      location,
      uicLength,
      brand,
      model,
      isCheck,
      selectedQtySp
    );
    if (data) {
      res.status(200).json({
        getSortingAgent: data.getSortingAgent,
        getSpTray: data.getSpTray,
        getRpTray: data.getRpTray,
        spWhUser: data.spWhUser,
      });
    }
  } catch (error) {
    next(error);
  }
});
// WHT TO RP SORTING ASSIGN
router.post("/whtToRpSorting/assign", async (req, res, next) => {
  try {
    const { spDetails, spTray, rpTray, spwhuser, sortingUser, selectedUic } =
      req.body;
    let data = await misUserController.whtToRpSortingAssign(
      spDetails,
      spTray,
      rpTray,
      spwhuser,
      sortingUser,
      selectedUic
    );
    if (data.status == 1) {
      res.status(200).json({
        message: "Successfully Assigned",
      });
    } else {
      res.status(202).json({
        message: "Not able to assign please try again...",
      });
    }
  } catch (error) {
    next(error);
  }
});
/*------------------------------------STX UTILITY----------------------------------------------*/
//IMPORT XLSX
router.post("/stxUtilityImportXlsx", async (req, res, next) => {
  try {
    let data = await misUserController.stxUtilityImportXlsx();
    if (data.status == 1) {
      res.status(200).json({
        message: "Successfully added",
        data:data.data
      });
    } else {
      res.status(202).json({
        message: "Failed please try again",
      });
    }
  } catch (error) {
    next(error);
  }
});
// SEARCH UIC
router.post("/stxUtilityScanUic/:uic", async (req, res, next) => {
  try {
    // PARAMS
    const { uic } = req.params;
    // FUNCTION FROM CONTROLLER
    let data = await misUserController.stxUtilityScanUic(uic);
    if (data.status == 1) {
      res.status(200).json({
        data: data.uicData,
      });
    } else if (data.status == 2) {
      res.status(202).json({
        message: `Already added to ${data.trayId}`,
      });
    } else {
      res.status(202).json({
        message: "Invalid UIC please check",
      });
    }
  } catch (error) {
    next(error);
  }
});
// GET STX TRAY
router.post("/stxUtilityGetStx", async (req, res, next) => {
  try {
    // PARAMS
    const { uic, location, grade } = req.body;
    // FUNCTION FROM CONTROLLER
    let data = await misUserController.stxUtilityGetStx(uic, location, grade);
    if (data.status == 2) {
      res.status(200).json({
        data: data.trayData,
        muiDetails: data.muiDetails,
      });
    } else if (data.status == 1) {
      res.status(202).json({
        message: "Product not exists",
      });
    } else {
      res.status(202).json({
        message: "Item not delivered",
      });
    }
  } catch (error) {
    next(error);
  }
});
// ADD TO STX
router.post("/stxUtilityAddToStx", async (req, res, next) => {
  try {
    // PARAMS
    const { uic, stXTrayId, ctxTrayId, brand, model, muic } = req.body;
    // FUNCTION FROM CONTROLLER
    let data = await misUserController.stxUtilityAddItems(
      uic,
      stXTrayId,
      ctxTrayId,
      brand,
      model,
      muic
    );
    if (data.status == 1) {
      res.status(200).json({
        message: "Successfully Added",
      });
    } else {
      res.status(202).json({
        message: "Failed please try again",
      });
    }
  } catch (error) {
    next(error);
  }
});
// GET STX UTILITY IN-PROGRESS TRAY
router.post("/getStxUtilityInProgress/:location", async (req, res, next) => {
  try {
    // PARAMS
    const { location } = req.params;
    // FUNCTION FROM CONTROLLER
    let data = await misUserController.stxUtilityTrayInproGress(location);
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
