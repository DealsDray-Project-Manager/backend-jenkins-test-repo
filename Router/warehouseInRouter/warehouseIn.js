/* Express */
const { Router } = require("express");
const express = require("express");
const router = express.Router();
// user controller
const warehouseInController = require("../../Controller/warehouseIn/warehouseInController");
/*******************************************************************************************************************/
/**************************************************Dashboard**************************************************************************/
router.get("/dashboard", async (req, res, next) => {
  try {
    let data = await warehouseInController.dashboard();
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
/******************************************************STOCK IN********************************************************************* */
/* Check Bag ID */
router.post("/checkBagId", async (req, res, next) => {
  try {
    const { bagId, location } = req.body;
    let data = await warehouseInController.checkBagId(bagId, location);
    if (data.status == 1) {
      res.status(202).json({
        message: "Bag ID Does Not Exist",
      });
    } else if (data.status == 2) {
      res.status(202).json({
        message: "Bag ID is not empty or close stage",
      });
    } else if (data.status == 3) {
      res.status(202).json({
        message: `Bag id does not exist in ${warehouse} warehouse`,
      });
    } else if (data.status == 0) {
      res.status(200).json({
        message: "Valid Bag",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* Get Bag Data */
router.post("/getBagItem/:bagId", async (req, res, next) => {
  try {
    let data = await warehouseInController.getBagOne(req.params.bagId);
    if (data.length != 0) {
      res.status(200).json({
        data: data,
        message: "Successfully Get All Data",
      });
    } else {
      res.status(201).json({
        data: data,
        message: "Bag is Empty",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* Get Bag Data */
router.post("/getBagItemRequest/:bagId/:sortId", async (req, res, next) => {
  try {
    const { bagId, sortId } = req.params;
    let data = await warehouseInController.getBagOneRequest(bagId, sortId);
    if (data.status == 1) {
      res.status(200).json({
        data: data.data,
        message: "Successfully Get All Data",
      });
    } else if (data.status == 2) {
      res.status(202).json({
        data: data.data,
        message: "Details not found",
      });
    } else {
      res.status(202).json({
        data: data,
        message: `${bagId} - present at ${data.data[0].sort_id}`,
      });
    }
  } catch (error) {
    next(error);
  }
});
/* CHECK BOT USER */
router.post("/checkBotUserStatus/:username", async (req, res, next) => {
  try {
    const { username, bagId } = req.params;
    let data = await warehouseInController.checkBotUserStatus(username, bagId);
    console.log(data);
    if (data.status === 1) {
      res.status(200).json({
        data: "User is free",
      });
    } else if (data.status === 2) {
      res.status(202).json({
        data: "User not active",
      });
    } else {
      res.status(200).json({
        data: "Agent already have a lot",
      });
    }
  } catch (error) {
    next(error);
  }
});

/* Awbn Number Checking */
router.post("/checkAwbn", async (req, res, next) => {
  try {
    const { awbn, bagId, location } = req.body;
    let data = await warehouseInController.checkAwbin(awbn, bagId, location);
    console.log(data);
    if (data.status == 1) {
      res.status(202).json({
        message: "AWBN Number does Not Exist",
      });
    } else if (data.status == 2) {
      res.status(200).json({
        data: data.data,
        message: "AWBN Number Is Invalid",
      });
    } else if (data.status == 3) {
      res.status(200).json({
        data: data.data,
        message: "AWBN Number Is Duplicate",
      });
    } else if (data.status == 0) {
      res.status(200).json({
        data: data.data,
        message: "AWBN Number Is valid",
      });
    } else if (data.status == 4) {
      res.status(202).json({
        message: "Not Delivered",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* Stock In to Warehouse */
router.post("/stockInToWarehouse", async (req, res, next) => {
  try {
    let data = await warehouseInController.stockInData(req.body);
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
/* Bag Closing */
router.post("/bagClosing", async (req, res, next) => {
  try {
    let data = await warehouseInController.closeBag(req.body);
    if (data) {
      res.status(200).json({
        message: "Successfully Closed",
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
/* Remove Stockin */
router.put("/stockin", async (req, res, next) => {
  try {
    let data = await warehouseInController.deleteStockin(req.body);
    if (data) {
      res.status(200).json({
        message: "Successfully Removed",
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
/****************************************************BAG ISSUE REQUEST****************************************************************** */
/* Get Requests */
router.post("/getRequests/:location", async (req, res, next) => {
  let data = await warehouseInController.getRequests(req.params.location);
  if (data) {
    res.status(200).json({
      data: data,
      message: "Success",
    });
  }
});
/* Check AWBN NUMBER */
router.post("/actualCheckAwbn", async (req, res, next) => {
  try {
    const { awbn, id } = req.body;
    let data = await warehouseInController.checkActualAwbn(awbn, id);
    if (data.status == 1) {
      res.status(200).json({
        message: "Valid AWBN",
        data: data.data,
      });
    } else if (data.status == 2) {
      res.status(202).json({
        message: "Already Added",
      });
    } else if (data.status == 3) {
      res.status(203).json({
        message: "This Item Does Not Exist",
      });
    } else if (data.status == 4) {
      res.status(202).json({
        message: "AWBN Does Not Exist",
      });
    } else if (data.status == 5) {
      res.status(202).json({
        message: "This Item Not Delivered",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* Add Actual Data */
router.post("/addActualitem", async (req, res, next) => {
  try {
    let data = await warehouseInController.addActualData(req.body);
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
router.put("/actualBagItem", async (req, res, next) => {
  try {
    let data = await warehouseInController.removeActualItem(req.body);
    if (data) {
      res.status(200).json({
        message: "Successfully Removed",
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
/* Bag Issue to agent */
router.post("/issueToBot", async (req, res, next) => {
  try {
    let data = await warehouseInController.issueToBot(req.body);
    if (data.status == 2) {
      res.status(200).json({
        message: "Successfully Issued",
      });
    } else if (data.status == 1) {
      res.status(200).json({
        message: "Successfully Saved",
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
/*********************************************************TRAY ASSIGNMENT***************************************************************/
/* CHECK MMT TRAY */
router.post("/checkMmtTray/:id/:location", async (req, res, next) => {
  try {
    let data = await warehouseInController.checkMmtTray(
      req.params.id,
      req.params.location
    );

    if (data.status == 1) {
      res.status(200).json({
        message: "Valid Tray ID",
        data: data.id,
        status: data.tray_status,
      });
    } else if (data.status == 2) {
      res.status(202).json({
        message: "Tray Already Assigned",
      });
    } else if (data.status == 3) {
      res.status(202).json({
        message: "Tray ID Does Not Exist",
      });
    } else if (data.status == 4) {
      res.status(202).json({
        message: "Not A MMT Tray",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* CHECK PMT TRAY */
router.post("/checkPmtTray/:id/:location", async (req, res, next) => {
  try {
    let data = await warehouseInController.checkPmtTray(
      req.params.id,
      req.params.location
    );

    if (data.status == 1) {
      res.status(200).json({
        message: "Valid Tray ID",
        data: data.id,
        status: data.tray_status,
      });
    } else if (data.status == 2) {
      res.status(202).json({
        message: "Tray Already Assigned",
      });
    } else if (data.status == 3) {
      res.status(202).json({
        message: "Tray ID Does Not Exist",
      });
    } else if (data.status == 4) {
      res.status(202).json({
        message: "Not A PMT Tray",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* CHECK BOT TRAY */
router.post("/checkBotTray/:id/:location", async (req, res, next) => {
  try {
    let data = await warehouseInController.checkBotTray(
      req.params.id,
      req.params.location
    );
    if (data.status == 1) {
      res.status(200).json({
        message: "Valid Tray ID",
        data: data.id,
        status: data.tray_status,
      });
    } else if (data.status == 2) {
      res.status(202).json({
        message: "Tray Already Assigned",
      });
    } else if (data.status == 3) {
      res.status(202).json({
        message: "Tray ID Does Not Exist",
      });
    } else if (data.status == 4) {
      res.status(202).json({
        message: "Not A BOT Tray",
      });
    }
  } catch (error) {
    next(error);
  }
});
/************************************TRAY CLOSE REQUEST********************************************************* */
router.post("/trayCloseRequest/:location", async (req, res, next) => {
  try {
    let data = await warehouseInController.trayCloseRequest(
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
/* GET INUSE PMT OR MMT TRAY */
router.post("/inuse-mmt-pmt/:location/:type", async (req, res, next) => {
  try {
    const { location, type } = req.params;
    let data = await warehouseInController.getInuseMmtPmt(location, type);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
/* ACCEPTE TRAY */
router.post("/receivedTray", async (req, res, next) => {
  try {
    let data = await warehouseInController.trayReceived(req.body);
    if (data.status === 1) {
      res.status(200).json({
        message: "Successfully Received",
      });
    } else if (data.status === 2) {
      res.status(202).json({
        message: "Failed",
      });
    } else if (data.status === 3) {
      res.status(202).json({
        message: "Please Enter Valid Count",
      });
    }
  } catch (error) {
    next(error);
  }
});
/************************************NEW TRAY ASSIGNEMENT**************************************** */
/* Get bot */
router.post("/botUsers/:location", async (req, res, next) => {
  try {
    const { location } = req.params;
    let data = await warehouseInController.getBotUsersNewTrayAssing(location);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
/* check bot user tray */
router.post("/checkBotUserTray", async (req, res, next) => {
  try {
    const { username, trayType } = req.body;
    let data = await warehouseInController.checkBotUserTray(username, trayType);
    if (data.status === 1) {
      res.status(200).json({
        message: "Success",
      });
    } else if (data.status === 0) {
      res.status(202).json({
        message: `${username + " have already  " + trayType + " Tray"}`,
      });
    }
  } catch (error) {
    next(error);
  }
});
/* ASSIGN NEW TRAY */
router.post("/assignNewTray", async (req, res, next) => {
  try {
    let data = await warehouseInController.assignNewTrayIndv(req.body);
    if (data) {
      res.status(200).json({
        message: "Successfully Assigned",
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
/* Tray Close */
router.post("/trayclose", async (req, res, next) => {
  try {
    let data = await warehouseInController.trayClose(req.body);
    if (data) {
      res.status(200).json({
        message: "Successfully Closed",
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
/* pmt / mmt / bot vs bag  count chcking after bot closed */
router.post("/bagValidation/:bagId", async (req, res, next) => {
  try {
    const { bagId } = req.params;
    let data = await warehouseInController.bagValidationPmtMmtBot(bagId);
    console.log(data);
    if (data.status === 1) {
      res.status(200).json({
        status: 1,
      });
    } else if (data.status === 2) {
      res.status(202).json({
        status: 2,
        message: "PMT / MMT / BOT VS BAG count is not matching",
      });
    } else {
      res.status(202).json({
        status: 2,
        message: "No Data found",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* Tray Close Bot */
router.post("/traycloseBot", async (req, res, next) => {
  try {
    let data = await warehouseInController.trayCloseBot(req.body);
    if (data) {
      res.status(200).json({
        message: "Successfully Closed",
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
/* GET BOT TRAY FOR RELEASE */
router.post("/release-bot-tray/:location/:type", async (req, res, next) => {
  try {
    const { location, type } = req.params;
    let data = await warehouseInController.getBotWarehouseClosed(
      location,
      type
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
/* TRAY RELEASE CONFIRMATION */
router.post("/approve-release-bot-tray/:trayId", async (req, res, next) => {
  try {
    let data = await warehouseInController.releaseBotTray(req.params.trayId);
    if (data) {
      res.status(200).json({
        message: "Successfully released",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* AUTO FETCH TRAY ID ALREADY ASSIGNED ONE */
router.post(
  "/autoFetchAlreadyAssignedTray/:username",
  async (req, res, next) => {
    try {
      let data = await warehouseInController.autoFetchTray(req.params.username);
      console.log(data);
      if (data) {
        res.status(200).json({
          pmtTray: data.pmtTray,
          mmtTray: data.mmtTray,
          botTray: data.botTray,
        });
      }
    } catch (error) {
      next(error);
    }
  }
);
/*************************************BAG CLOSE************************************************************** */
/* GET BOT TRAY CLOSE */
router.post("/closeBotTray/:location", async (req, res, next) => {
  try {
    let data = await warehouseInController.closeBotTrayGet(req.params.location);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
/* SUMMERY OF BOT BAG AND TRAY */
router.post("/summeryBotTrayBag/:bagId", async (req, res, next) => {
  try {
    let data = await warehouseInController.getSummeryBotTray(req.params.bagId);
    if (data) {
      res.status(200).json({
        data: data,
      });
    } else {
      res.status(202).json({
        message: "You Can't access this Data",
      });
    }
  } catch (error) {
    next(error);
  }
});
/**********************************PICKLIST********************************************** */
/* GET PICKLIST DATA */
router.post("/picklist/:location", async (req, res, next) => {
  try {
    let date = new Date(); // Today!
    date.setDate(date.getDate() - 1);
    let data = await warehouseInController.picklistRequest(
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
/* PICKLIST PAGE VIEW */
router.post("/viewModelClub", async (req, res, next) => {
  try {
    const { listId, vendor_sku_id } = req.body;
    let data = await warehouseInController.viewModelClubItem(
      listId,
      vendor_sku_id
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
/* ASSIGN NEW WHT TRAY GET TRAY */
router.post("/getWhtTray", async (req, res, next) => {
  try {
    const { type, brand_name, model_name, location } = req.body;
    let data = await warehouseInController.getWhtTray(
      type,
      brand_name,
      model_name,
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
/* ITEMS ASSIGNED TO WHT TRAY */
router.post("/itemAssignToWht", async (req, res, next) => {
  try {
    let data = await warehouseInController.assignToWht(req.body);
    if (data) {
      res.status(200).json({
        message: "Successfully Assigned",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* GET ASSIGNED TRAY */
router.post("/getAssignedTray", async (req, res, next) => {
  try {
    let data = await warehouseInController.getAssignedTray(req.body);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
/* PULL ITEM FROM WHT TRAY */
router.post("/removeItemWht", async (req, res, next) => {
  try {
    let data = await warehouseInController.removeWhtTrayItem(req.body);
    if (data) {
      res.status(200).json({
        message: "Successfully Removed",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* CREATE PICKLIST */
router.post("/createPickList", async (req, res, next) => {
  try {
    let data = await warehouseInController.createPickList(req.body);
    if (data) {
      res.status(200).json({
        message: "Successfully Created",
      });
    }
  } catch (error) {
    next(error);
  }
});
/**********************************WHT TRAY******************************* */
/* ALL WHT TRAY */
router.post("/whtTray/:location/:type", async (req, res, next) => {
  try {
    const { location, type } = req.params;
    let data = await warehouseInController.getWhtTrayWareHouse(location, type);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
/* IN USE WHT TRAY */
router.post("/wht-tray/:status/:location", async (req, res, next) => {
  try {
    console.log("working");
    console.log(req.params);
    let data = await warehouseInController.getInUseWhtTray(
      req.params.status,
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
/***************************************PICKLIST DATE WISE SORTING*************************************** */
router.post("/picklist-sort", async (req, res, next) => {
  try {
    const { date, location } = req.body;
    let data = await warehouseInController.sortPicklist(date, location);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
/*************************************GET WHT TRAY ITEM******************************************** */
router.post("/getWhtTrayItem/:trayId/:sortId", async (req, res, next) => {
  try {
    const { trayId, sortId } = req.params;
    let data = await warehouseInController.getWhtTrayitem(trayId, sortId);
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
        message: `${trayId} - present at ${data.data.sort_id}`,
      });
    }
  } catch (error) {
    next(error);
  }
});
/* Print picklist */
router.post("/getPickList/:pick_list_id", async (req, res, next) => {
  try {
    let data = await warehouseInController.getPickList(req.params.pick_list_id);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
/* PICKLIST CONFIRMATION */
router.post("/actualPickList", async (req, res, next) => {
  try {
    const { uic, pickListId } = req.body;
    let data = await warehouseInController.actualPickListUicCheck(
      uic,
      pickListId
    );
    if (data.status == 1) {
      res.status(200).json({
        data: uic,
      });
    } else if (data.status == 2) {
      res.status(202).json({
        message: "Invalid UIC",
      });
    } else if (data.status == 3) {
      res.status(202).json({
        message: "Already Added",
      });
    } else {
      res.status(202).json({
        message: "Not Exists",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* Add Picklist actual items */
router.post("/add-actual-picklist-item", async (req, res, next) => {
  try {
    let data = await warehouseInController.addActualPickListItem(req.body);
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
/* Remove Actual Item */
router.put("/remove-actual-picklist", async (req, res, next) => {
  try {
    let data = await warehouseInController.picklistActualRemoveItem(req.body);
    if (data) {
      res.status(200).json({
        message: "Successfully Removed",
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
/* CLOSE PICK LIST */
router.post("/close-pick-list/:pickListId", async (req, res, next) => {
  try {
    let data = await warehouseInController.closePicklist(req.params.pickListId);
    if (data) {
      res.status(200).json({
        message: "Successfully Closed",
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
/* GET ALL PICKLIST */
router.post("/get-all-pick-list", async (req, res, next) => {
  try {
    let data = await warehouseInController.getAllPicklist();
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
/********************************************WHT TRAY REQUEST TO CHARGING ASSIGN***************************************************** */
/* SEND WHT TRAY TO MIS CHARGING APPROVE */
router.post("/send-wh-mis-whtTray", async (req, res, next) => {
  try {
    let data = await warehouseInController.sendToMisWhtApproveCharging(
      req.body
    );
    if (data) {
      res.status(200).json({
        message: "Successfully Requested to MIS",
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
/* CHARGING REQUEST RECIEVED*/
router.post("/request-for-assign/:status/:location", async (req, res, next) => {
  try {
    let data = await warehouseInController.getChargingRequest(
      req.params.status,
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
/* CHECK UIC CODE */
router.post("/check-uic", async (req, res, next) => {
  try {
    const { trayId, uic } = req.body;
    let data = await warehouseInController.checkUicCode(uic, trayId);
    console.log(data);
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
    }
  } catch (error) {
    next(error);
  }
});
/* ADD ATUCAL ITEM TO WHT TRAY */
router.post("/wht-add-actual-item", async (req, res, next) => {
  try {
    let data = await warehouseInController.addWhtActual(req.body);
    if (data.status == 1) {
      res.status(200).json({
        message: "Successfully Added",
      });
    } else if (data.status == 2) {
      res.status(202).json({
        message: "Failed",
      });
    } else if (data.status == 3) {
      res.status(202).json({
        message: "Item Already Added",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* WHT TRAY ASSIGN TO CHARGING FROM WAREHOUSE */
router.post("/issue-to-agent-wht", async (req, res, next) => {
  try {
    let data = await warehouseInController.issueToagentWht(req.body);
    if (data) {
      res.status(200).json({
        message: "Successfully Issued",
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
/* TRAY RETURN FROM CHARGING*/
router.post("/wht-return-from-charging/:location", async (req, res, next) => {
  try {
    let data = await warehouseInController.returnFromChargingWht(
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
/* GET TRAY AFTER RECIEVED BY WAREHOUSE CHARGING DONE */
router.post(
  "/charging-done-recieved/:trayId/:sortId",
  async (req, res, next) => {
    try {
      const { trayId, sortId } = req.params;
      let data = await warehouseInController.chargingDoneRecieved(
        trayId,
        sortId
      );
      if (data.status == 1) {
        res.status(200).json({
          data: data.data,
        });
      } else if (data.status == 2) {
        res.status(202).json({
          message: "Details not found",
        });
      } else {
        res.status(202).json({
          message: `${trayId} - present at ${data.data.sort_id}`,
        });
      }
    } catch (error) {
      next(error);
    }
  }
);
/* UIC CHECKING */
/* CHECK UIC CODE */
router.post("/check-uic-charging-done", async (req, res, next) => {
  try {
    const { trayId, uic } = req.body;
    let data = await warehouseInController.checkUicCodeChargeDone(uic, trayId);
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
    }
  } catch (error) {
    next(error);
  }
});
/* CHECK UIC CODE */
router.post("/check-uic-sorting-done", async (req, res, next) => {
  try {
    const { trayId, uic } = req.body;
    let data = await warehouseInController.checkUicCodeSortingDone(uic, trayId);
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
    }
  } catch (error) {
    next(error);
  }
});
/* CHARGING DONE WAREHOUSE RECEIVED THE TRAY THEN EXTUAL AND EXPECTED */
/* Check AWBN NUMBER */
router.post("/charging-done-put-item", async (req, res, next) => {
  try {
    let data = await warehouseInController.chargingDoneActualItemPut(req.body);
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
/* Check AWBN NUMBER */
router.post("/sorting-done-put-item", async (req, res, next) => {
  try {
    let data = await warehouseInController.sortingDoneActualItemPut(req.body);
    if (data.status == 1) {
      res.status(200).json({
        message: "Successfully Added",
      });
    } else if (data.status == 2) {
      res.status(202).json({
        message: "Failed",
      });
    } else if (data.status == 3) {
      res.status(202).json({
        message: "Item Already Added",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* WHT TRAY CLOSE BY WAREHOSUE WHEN CHARGE IS DONE THEN RECEIVE AND CLOSE */
router.post("/close-wht-tray-ready-to-next", async (req, res, next) => {
  try {
    let data = await warehouseInController.readyToBqc(req.body);
    if (data) {
      res.status(200).json({
        message: "Successfully Closed",
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
/* TRAY RETURN FROM CHARGING*/
router.post("/return-from-bqc-wht/:location", async (req, res, next) => {
  try {
    let data = await warehouseInController.returnFromBqcWht(
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
/* TRAY RETURN FROM CHARGING*/
router.post("/return-from-sorting-wht/:location", async (req, res, next) => {
  try {
    let data = await warehouseInController.returnFromBSorting(
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
/* ACCEPTE AFTER BQC DONE */
router.post("/recieved-from-bqc", async (req, res, next) => {
  try {
    let data = await warehouseInController.bqcDoneRecieved(req.body);
    if (data) {
      res.status(200).json({
        message: "Successfully Received",
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
/* ACCEPTE AFTER BQC DONE */
router.post("/recieved-from-sorting", async (req, res, next) => {
  try {
    let data = await warehouseInController.sortingDoneRecieved(req.body);
    if (data) {
      res.status(200).json({
        message: "Successfully Received",
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
/*********************************************TRAY ISSUE TO SORTING AGENT*********************************************** */
/* GET WHT AND BOT TRAY SORTING REQUESTS */
router.post("/get-tray-sorting-requests/:username", async (req, res, next) => {
  try {
    const { username } = req.params;
    let data = await warehouseInController.getBotAndWhtSortingRequestTray(
      username
    );
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
/* GET TRAY */
router.post("/get-tray-sorting/:trayId", async (req, res, next) => {
  try {
    const { trayId } = req.params;
    let data = await warehouseInController.getTrayForSortingExVsAt(trayId);
    if (data.status === 1) {
      res.status(200).json({
        data: data.data,
      });
    } else if (data.status === 2) {
      res.status(202).json({
        message: `${trayId} - present at ${data.data.sort_id}`,
      });
    } else {
      res.status(202).json({
        message: `Details not found`,
      });
    }
  } catch (error) {
    next(error);
  }
});
/*BOT TRAY AND WHT TRAY ASSIGN TO AGENT */
router.post("/assign-to-sorting-confirm", async (req, res, next) => {
  try {
    let data = await warehouseInController.assignToSortingConfirm(req.body);
    if (data) {
      if (req.body.type == "Assigned to sorting agent") {
        res.status(200).json({
          message: "Successfully Assigned To Agent",
        });
      } else {
        res.status(200).json({
          message: "Successfully Handover To Agent",
        });
      }
    } else {
      res.status(202).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* WHT TRAY RETURN FROM SORTING AGENT IF TRAY IS FULL READY TO CHARGING */
router.post("/wht-tray-close-from-sorting", async (req, res, next) => {
  try {
    let data = await warehouseInController.whtTrayCloseAfterSorting(req.body);
    if (data.status == 1) {
      res.status(200).json({
        message: "Successfully Closed Ready To Charging",
      });
    } else {
      res.status(200).json({
        message: "Successfully Closed Not Ready For Charging",
      });
    }
  } catch (error) {
    next(error);
  }
});
/***************************************MMT AND PMT DAILY WAISE REPORT************************************************************ */
router.post("/mmt-pmt-report", async (req, res, next) => {
  try {
    let data = await warehouseInController.getReportMmtPmt(req.body);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
/* SORT REPORT */
router.post("/sort-mmt-pmt-report", async (req, res, next) => {
  try {
    let data = await warehouseInController.getReportMmtPmtSort(req.body);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
/* GET BOT TRAY READY / ASSIGNED MERGE WITH WHT*/
router.post("/getBotTrayReportScreen/:location", async (req, res, next) => {
  try {
    const { location } = req.params;
    let data = await warehouseInController.getBotTrayForReportScreen(location);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
/* BOT TRAY REPORT */
router.post("/bot-tray-report", async (req, res, next) => {
  try {
    const { location, botTray } = req.body;
    let data = await warehouseInController.getBotTrayReport(location, botTray);
    console.log(data);
    if (data.status == 1) {
      res.status(200).json({
        data: data.data,
      });
    } else if (data.status == 0) {
      res.status(202).json({
        message: `${botTray} - Tray in process`,
      });
    } else if (data.status == 2) {
      res.status(202).json({
        message: `You can't access this tray ${botTray} - report`,
      });
    } else {
      res.status(202).json({
        message: "Report Not Available",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* GET TRAY ITEM DETAILS BASED ON THE BRAND AND MODEL */
router.post(
  "/bot-tray-report-item-details/:location/:trayId/:muic",
  async (req, res, next) => {
    try {
      console.log(req.params);
      const { location, trayId, muic } = req.params;
      let data = await warehouseInController.getItemDetailsOfBotTrayReport(
        location,
        trayId,
        muic
      );
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
  }
);
/* MMT MERGE */
router.post("/mmtMergeRequest/:location", async (req, res, next) => {
  try {
    const { location } = req.params;
    let data = await warehouseInController.mmtMergerequest(location);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
/* VIEW FROM AND TO TRAY FOR MERGE */
router.post(
  "/viewTrayFromAndTo/:location/:fromTray",
  async (req, res, next) => {
    try {
      const { location, fromTray } = req.params;
      let data = await warehouseInController.getFromAndToTrayMerge(
        location,
        fromTray
      );
      console.log(data);
      if (data) {
        res.status(200).json({
          data: data,
        });
      } else {
        res.status(202).json({
          message: "You can't access this tray",
        });
      }
    } catch (error) {
      next(error);
    }
  }
);
/* MMT TRAY SEND TO SORTING AGENT CONFIRM */
router.post("/mmtTraySendToSorting", async (req, res, next) => {
  try {
    console.log(req.body);
    const { username, fromTray, toTray } = req.body;
    let data = await warehouseInController.assignToSortingAgent(
      username,
      fromTray,
      toTray
    );
    console.log(data);
    if (data.status === 1) {
      res.status(200).json({
        message: "Successfully Assigned",
      });
    } else if (data.status === 0) {
      res.status(202).json({
        message: "Failed Please Try Again",
      });
    } else if (data.status === 2) {
      res.status(202).json({
        message: `${username} - user have already mmt tray`,
      });
    }
  } catch (error) {
    next(error);
  }
});
/* RETURN FROM MERGING */
router.post("/returnFromMerging/:location", async (req, res, next) => {
  try {
    const { location } = req.params;
    let data = await warehouseInController.returnFromMerging(location);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
/* AFTER MERGE IS DONE CLOSE MMT TRAY */
router.post("/mergeDoneMmttrayClose", async (req, res, next) => {
  try {
    const { toTray, fromTray, type, length, limit } = req.body;
    let data = await warehouseInController.mergeDoneTrayClose(
      fromTray,
      toTray,
      type,
      length,
      limit
    );
    if (data.status == 1) {
      res.status(200).json({
        message: "Successfully Closed",
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
/* ASSIGNMENT OF MMT AND WHT AND BOT FOR SORTING USER_CHECKING */
router.post("/sortingAgnetStatus/:username", async (req, res, next) => {
  try {
    const { username } = req.params;
    let data = await warehouseInController.getSortingAgentStatus(username);
    if (data.status === 1) {
      res.status(200).json({
        data: "User is free",
      });
    } else if (data.status === 2) {
      res.status(200).json({
        data: "Agent already have a lot",
      });
    } else if (data.status === 3) {
      res.status(200).json({
        data: "User not active",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* CHECK CHARGING USER STATUS */
router.post("/chargingAgentStatus/:username",async(req,res,next)=>{
  try {
    const {username}=req.params
    let data=await warehouseInController.checkChargingAgentStatus(username)
    if (data.status === 1) {
      res.status(200).json({
        data: "User is free",
      });
    } else if (data.status === 2) {
      res.status(200).json({
        data: "Agent already have a lot",
      });
    } else if (data.status === 3) {
      res.status(200).json({
        data: "User not active",
      });
    }
  } catch (error) {
    next(error)
  }
})
/* CHECK CHARGING USER STATUS */
router.post("/bqcAgentStatus/:username",async(req,res,next)=>{
  try {
    const {username}=req.params
    let data=await warehouseInController.checkBqcAgentStatus(username)
    if (data.status === 1) {
      res.status(200).json({
        data: "User is free",
      });
    } else if (data.status === 2) {
      res.status(200).json({
        data: "Agent already have a lot",
      });
    } else if (data.status === 3) {
      res.status(200).json({
        data: "User not active",
      });
    }
  } catch (error) {
    next(error)
  }
})
module.exports = router;
