/* Express */
const express = require("express");
const router = express.Router();
// user controller
const misUserController = require("../../Controller/misUser/misUserController");
// Multer
const upload = require("../../utils/multer");
/*******************************************************************************************************************/
/********************************************ORDERS*****************************************************************/
/* Bulk Orders Validation */
router.post("/bulkOrdersValidation", async (req, res, next) => {
  try {
    let data = await misUserController.bulkOrdersValidation(req.body);
    console.log(data);
    if (data.status == true) {
      res.status(200).json({
        message: "Successfully Validated",
      });
    } else {
      res.status(400).json({
        data: data.data,
        message: "Please Check Errors",
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
    console.log(req.body);
    const { type, searchData, location } = req.body;
    let data = await misUserController.searchOrders(type, searchData, location);
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
/* SEARCH BAD ORDERS */
router.post("/badOrdersSearch", async (req, res, next) => {
  try {
    console.log(req.body);
    const { type, searchData, location } = req.body;
    let data = await misUserController.badOrdersSearch(
      type,
      searchData,
      location
    );
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
/*********************************************Recon sheet******************************************************** */
/*Get Orders*/
router.post("/getOrders/:location", async (req, res, next) => {
  try {
    let data = await misUserController.getOrders(req.params.location);
    console.log(data);
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
router.post("/getDeliveredOrders/:location", async (req, res, next) => {
  try {
    let data = await misUserController.getDeliveredOrders(req.params.location);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
/* Not Delivered Orders */
router.post("/notDeliveredOrders/:location", async (req, res, next) => {
  try {
    let data = await misUserController.notDeliveredOrders(req.params.location);
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
router.post("/searchDeliveredOrders", async (req, res, next) => {
  try {
    console.log(req.body);
    const { type, searchData, location } = req.body;
    let data = await misUserController.searchDeliveredOrders(
      type,
      searchData,
      location
    );
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
    console.log(req.body);
    let data = await misUserController.bulkValidationDelivery(req.body);
    console.log(data);
    if (data.status == true) {
      res.status(200).json({
        message: "Successfully Validated",
      });
    } else {
      res.status(400).json({
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
      res.status(403).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* Get Delivery */
router.post("/getAllDelivery/:location", async (req, res, next) => {
  try {
    let data = await misUserController.getDelivery(req.params.location);
    console.log(data);
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
    console.log(data);
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
    console.log(req.body);
    const { type, searchData, location } = req.body;
    let data = await misUserController.searchDeliveryData(
      type,
      searchData,
      location
    );
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
/* SEARCH BAD DELIVERY DATA */
router.post("/searchBadDelivery", async (req, res, next) => {
  try {
    console.log(req.body);
    const { type, searchData, location } = req.body;
    let data = await misUserController.searchBagDeliveryData(
      type,
      searchData,
      location
    );
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
router.post("/uicPageData/:location", async (req, res, next) => {
  try {
    let data = await misUserController.getUicPage(req.params.location);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
/* UIC PAGE ALL DATA SEARCH */
/* SEARCH BAD DELIVERY DATA */
router.post("/searchUicPageAll", async (req, res, next) => {
  try {
    console.log(req.body);
    const { type, searchData, location, uic_status } = req.body;
    let data = await misUserController.searchUicPageAll(
      type,
      searchData,
      location,
      uic_status
    );
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
/* Add UIC */
router.post("/addUicCode", async (req, res, next) => {
  try {
    let data = await misUserController.addUicCode(req.body);
    if (data) {
      res.status(200).json({
        message: "Successfully Added",
      });
    } else {
      res.status(400).json({
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
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
/* Get uic genrated */
router.post("/SearchUicGeneratedReconPage", async (req, res, next) => {
  try {
    console.log(req.body);
    const { type, searchData, location, stage } = req.body;
    let data = await misUserController.searchUicReconPage(
      type,
      searchData,
      location
    );
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
/* Change uic Status */
router.put("/changeUicStatus/:id", async (req, res, next) => {
  try {
    console.log("called");
    let data = await misUserController.changeUicStatus(req.params.id);
    if (data.status) {
      res.status(200).json({
        message: "Successfully Updated",
      });
    } else {
      res.status(400).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
/******************************************************BAG ASSIGN*********************************************************************** */
/* Bag Assign */
router.post("/getStockin", async (req, res, next) => {
  try {
    let data = await misUserController.getStockin();
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
router.post("/getBot", async (req, res, next) => {
  try {
    let data = await misUserController.getBot();
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
      res.status(403).json({
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
    console.log(req.body);
    let data = await misUserController.deleteBadOrders(req.body);
    if (data) {
      res.status(200).json({
        message: "Successfully Deleted",
      });
    } else {
      res.status(403).json({
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
      res.status(403).json({
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
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
/************************************PICKUP LIST****************************************************** */
/* PIKCUPLIST DATA */
router.post("/pickupListData", async (req, res, next) => {
  try {
    let data = await misUserController.getPickUpListData();
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
/* PICKLIST CREATE */
router.post("/createPickList", async (req, res, next) => {
  try {
    let data = await misUserController.createPickList(req.body);
    if (data) {
      res.status(200).json({
        message: "Successfully Created",
      });
    }
  } catch (error) {
    next(error);
  }
});
/*********************************************PICKLIST DATE WISE SORTING************************************************************** */
/* Date wise sorting */
router.post("/sort-date-wise/:date", async (req, res, next) => {
  try {
    let data = await misUserController.sortPickList(req.params.date);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
/********************************************ASSIGN TO CHARGING***************************************************************************************** */
/* GET READY FOR CHARGING WHT TRAY */
router.post("/ready-for-charging-wht",async(req,res,next)=>{
  try {
    let data=await misUserController.getReadyForChargingWhtTray()
    if(data){
      res.status(200).json({
        data:data
      })
    }
  } catch (error) {
    next(error)
  }
})
/* GET CHARGING USERS FOR ASSIGN WHT TRAY */
router.post("/get-charging-users",async(req,res,next)=>{
  try {
    let data=await misUserController.getChargingUsers()
    if(data){
      res.status(200).json({
        data:data
      })
    }
  } catch (error) {
    next(error)
  }
})
/* AFTER SELECT THE CHARGING USER WHT TRAY WILL GO TO WH PANEL */
router.post("/wht-sendTo-wharehouse",async(req,res,next)=>{
  try {
    let data=await misUserController.whtSendToWh(req.body)
    if(data){
      res.status(200).json({
        message:"Successfully Requested"
      })
    }
  } catch (error) {
    next(error)
  }
})
module.exports = router;
