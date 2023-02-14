/* Express */
const express = require("express");
const router = express.Router();
// user controller
const misUserController = require("../../Controller/misUser/misUserController");
// Multer
const upload = require("../../Utils/multer");
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
router.post("/getBadOrders/:location", async (req, res, next) => {
  try {
    let data = await misUserController.getBadOrders(req.params.location);
    if (data) {
      console.log(data);
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
/* SEARCH ORDERS */
router.post("/ordersSearch", async (req, res, next) => {
  try {
    const { type, searchData, location } = req.body;
    let data = await misUserController.searchOrders(type, searchData, location);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
/* SEARCH BAD ORDERS */
router.post("/badOrdersSearch", async (req, res, next) => {
  try {
    const { type, searchData, location } = req.body;
    let data = await misUserController.badOrdersSearch(
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
    if (!page) {
      page = 1;
    }
    if (!size) {
      size = 10;
    }
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
      if (!page) {
        page = 1;
      }
      if (!size) {
        size = 10;
      }
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
    const { type, searchData, location, status } = req.body;
    let data = await misUserController.searchDeliveredOrders(
      type,
      searchData,
      location,
      status
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
router.post("/getAllDelivery/:location/:page/:size", async (req, res, next) => {
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
router.post("/getBadDelivery/:location", async (req, res, next) => {
  try {
    let data = await misUserController.getBadDelivery(req.params.location);
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
/* SEARCH DELIVERY DATA */
router.post("/searchDelivery", async (req, res, next) => {
  try {
    const { type, searchData, location } = req.body;
    let data = await misUserController.searchDeliveryData(
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
/* SEARCH TRACK ITEM DATA */
router.post("/search-mis-track-item", async (req, res, next) => {
  try {
    const { type, searchData, location } = req.body;
    let data = await misUserController.searchMisTrackItem(
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
/* SEARCH BAD DELIVERY DATA */
router.post("/searchBadDelivery", async (req, res, next) => {
  try {
    const { type, searchData, location } = req.body;
    let data = await misUserController.searchBagDeliveryData(
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
    if (!page) {
      page = 1;
    }
    if (!size) {
      size = 10;
    }
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
    const { type, searchData, location, uic_status } = req.body;
    let data = await misUserController.searchUicPageAll(
      type,
      searchData,
      location,
      uic_status
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
router.post("/searchUicPageAllPage", async (req, res, next) => {
  try {
    const { type, searchData, location, uic_status } = req.body;
    let data = await misUserController.searchUicPageAllPage(
      type,
      searchData,
      location,
      uic_status
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
    console.log(req.body);
    let data = await misUserController.getUicRecon(req.body);
    console.log(data.data.length);
    if (data) {
      console.log(data);
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
    console.log(data);
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
      res.status(292).json({
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
    console.log(req.body);
    const { location, brand, model, fromTray, itemCount, status } = req.body;
    let data = await misUserController.toWhtTrayForMerging(
      location,
      brand,
      model,
      fromTray,
      itemCount,
      status
    );
    if (data.status === 1) {
      res.status(200).json({
        data: data.tray,
      });
    } else if (data.status === 0) {
      res.status(202).json({
        message: "Currently no wht tray in this brand and model",
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
    console.log(req.body);
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

router.post('/imeiDeliverySearch',async(req,res,next)=>{
  try{
    const { value } = req.body;
    let resultdata=await misUserController.imeiSearchDelivery(value)
  res.json({resultdata})
  }catch(error){
    next(error);
  }
});

router.post('/imeiOrderSearch',async(req,res,next)=>{
  try{
    const { value } = req.body;
    let resultdata=await misUserController.imeiSearchOrder(value)
    if(resultdata?.status){
        res.json({error:'invaid IMEI'})
    }
    res.json({resultdata})
  }catch(error){
    next(error);
  }
})


module.exports = router;
