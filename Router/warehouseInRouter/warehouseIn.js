/********************************************************************************************************* */

/* Express */
const express = require("express");
const router = express.Router();
// user controller
const warehouseInController = require("../../Controller/warehouseIn/warehouseInController");
const { masters } = require("../../Model/mastersModel");
/*******************************************************************************************************************/
/**************************************************Dashboard**************************************************************************/
router.post("/dashboard/:location", async (req, res, next) => {
  try {
    const { location } = req.params;
    let data = await warehouseInController.dashboard(location);
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

/*-----------------------------CHECK BAG ID--------------------------------------*/

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

/*-----------------------------GET BAG ITEMS--------------------------------------*/

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

/*-----------------------------GET BAG ITEMS Request--------------------------------------*/

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

/*-----------------------------CHECK BOT USERS STATUS--------------------------------------*/

router.post("/checkBotUserStatus/:username", async (req, res, next) => {
  try {
    const { username, bagId } = req.params;
    let data = await warehouseInController.checkBotUserStatus(username, bagId);
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

/*-----------------------------CHECK AWBN--------------------------------------*/

router.post("/checkAwbn", async (req, res, next) => {
  try {
    const { awbn, bagId, location } = req.body;
    let data = await warehouseInController.checkAwbin(awbn, bagId, location);
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

/*-----------------------------STOCKING TO WAREHOUSE--------------------------------------*/

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

/*-----------------------------BAG CLOSING BY WAREHOUSE PERSON--------------------------------------*/
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

/*----------------------------REMOVE DUPLICATE ITEMS FROM BAG--------------------------------------*/

router.post("/stockin", async (req, res, next) => {
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

/*--------------------------BAG ISSUE REQUESTS----------------------------------------*/
router.post("/getRequests/:location", async (req, res, next) => {
  let data = await warehouseInController.getRequests(req.params.location);
  if (data) {
    res.status(200).json({
      data: data,
      message: "Success",
    });
  }
});
/*--------------------------ACTUAL AND EXECTED PAGE IN WAREHOUSE AWBN NUMBER SCANING FOR BAG ISSUE----------------------------------------*/

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

/*--------------------------ADD ACTUAL ITEM----------------------------------------*/

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

/*--------------------------ACTULA BAG ITEM----------------------------------------*/

router.post("/actualBagItem", async (req, res, next) => {
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

/*--------------------------BAG ISSUE TO BOT AGENT----------------------------------------*/

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

/*--------------------------CHECK MMT TRAY----------------------------------------*/

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

/*--------------------------CHECK PMT TRAY FOR ISSUE TO BOT AGENT----------------------------------------*/

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

/*--------------------------CHECK BOT TRAY FOR ISSUE TO BOT AGENT---------------------------------------*/

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

/*--------------------------TRAY RETURN FROM BOT---------------------------------------*/
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

/*--------------------------INUSE MMT AND PMT---------------------------------------*/

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

/*--------------------------RECEIVED TRAY FROM BOT---------------------------------------*/

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

/*--------------------------BOT USERS FOR NEW TRAY ASSIGNMENT---------------------------------------*/
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

/*--------------------------CHECK BOT USER IS FREE OR NOT---------------------------------------*/

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

/*--------------------------ASSIGN NEW TRAY TO BOT---------------------------------------*/

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

/*--------------------------BOT DONE TRAY CLOSE---------------------------------------*/

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

/*--------------------------PMT AND MMT AND BOT EQUAL TO BAG--------------------------*/

router.post("/bagValidation/:bagId", async (req, res, next) => {
  try {
    const { bagId } = req.params;
    let data = await warehouseInController.bagValidationPmtMmtBot(bagId);
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
/*--------------------------BOT TRAY CLOSE BY WAREHOUSE--------------------------*/

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

/*--------------------------FIND THE  BOT TRAY FOR RELEASE --------------------------*/

router.post(
  "/tray-for-release/:location/:type/:taxanomy",
  async (req, res, next) => {
    try {
      const { location, type, taxanomy } = req.params;
      let data = await warehouseInController.getBotWarehouseClosed(
        location,
        type,
        taxanomy
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

/*--------------------------TRAY REALEASE CONFIRMATION --------------------------*/

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

/*--------------------------AUTO FETCH ALREADY  ASSIGNED TRAY FROM BOT--------------------------*/
router.post(
  "/autoFetchAlreadyAssignedTray/:username",
  async (req, res, next) => {
    try {
      let data = await warehouseInController.autoFetchTray(req.params.username);

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

/*--------------------------CLOSE BOT TRAY--------------------------*/

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

/*--------------------------SUMMERY OF BAG AFTER BOT DONE--------------------------*/

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

/*--------------------------GET WHT TRAY--------------------------*/

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

/*--------------------------ITEM ASSIGNED TO WHT TRAY--------------------------*/

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

/*--------------------------FIND ASSIGNED TRAY--------------------------*/

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

/*--------------------------REMOVE FROM ITEM WHT FROM BOT TO WHT PAGE SCREEEN--------------------------*/

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

/*--------------------------ALL WHT TRAY--------------------------*/

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

/*--------------------------IN USE WHT TRAY--------------------------*/

router.post("/wht-tray/:status/:location", async (req, res, next) => {
  try {
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

/*--------------------------FIND WHT TRAY ITEM--------------------------*/
router.post(
  "/getWhtTrayItem/:trayId/:sortId/:location",
  async (req, res, next) => {
    try {
      const { trayId, sortId, location } = req.params;
      let data = await warehouseInController.getWhtTrayitem(
        trayId,
        sortId,
        location
      );
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
  }
);

/*--------------------------SEND WHT TRAY TO MIS CHARGING APPROVE--------------------------*/

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

/*--------------------------CHARGING REQUEST RECEIVED--------------------------*/

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

/*--------------------------CHECK UIC--------------------------*/

router.post("/check-uic", async (req, res, next) => {
  try {
    const { trayId, uic } = req.body;
    let data = await warehouseInController.checkUicCode(uic, trayId);
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

/*--------------------------WHT ADD ACTUAL ITEM--------------------------*/

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

/*--------------------------WHT TRAY ASSIGN TO CHARGING FROM WAREHOUSE--------------------------*/

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

/*--------------------------TRAY RETURN FROM CHARGING--------------------------*/

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

/*--------------------------GET TRAY AFTER RECIEVED BY WAREHOUSE CHARGING DONE--------------------------*/

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

/*--------------------------CHECK UIC CODE CHARGING DONE--------------------------*/
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

/*--------------------------CHECK UIC CODE SORTING DONE--------------------------*/
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

/*--------------------------CHARGING DONE WAREHOUSE RECEIVED THE TRAY THEN EXTUAL AND EXPECTED--------------------------*/

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

/*--------------------------Check UIC NUMBER --------------------------*/

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

/*--------------------------WHT TRAY CLOSE BY WAREHOSUE  SEND TO NEXT SECTION--------------------------*/

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

/*--------------------------AUDIT DONE CLOSE --------------------------*/
router.post("/auditDoneClose", async (req, res, next) => {
  try {
    let data = await warehouseInController.auditDoneClose(req.body);
    if (data.status == 1) {
      res.status(200).json({
        message: "Successfully Closed Ready to RDL",
      });
    } else if (data.status == 2) {
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

/*--------------------------RETURN FROM AGENT --------------------------*/

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

/*---------------------OTHER TRAY RETURN FROM AUDIT--------------------------------*/
router.post("/retunrFromAudit/:location", async (req, res, next) => {
  try {
    const { location } = req.params;
    const data = await warehouseInController.returnFromAuditOtherTray(location);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});

/*---------------------RETURN FROM SORTING--------------------------------*/

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

/*---------------------REDCIEVED FROM BQCK--------------------------------*/

router.post("/recieved-from-bqc", async (req, res, next) => {
  try {
    let data = await warehouseInController.bqcDoneRecieved(req.body);
    if (data.status == 1) {
      res.status(200).json({
        message: "Successfully Received",
      });
    }
   else if (data.status == 3) {
      res.status(202).json({
        message: "Please Enter Valid Count",
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

/*---------------------------OTHER TRAY RECIEVED FROM AUDIT----------------------------------------------*/
router.post("/recievedFromOtherTray", async (req, res, next) => {
  try {
    let data = await warehouseInController.recievedFromAudit(req.body);
    if (data.status == 1) {
      res.status(200).json({
        message: "Successfully Received",
      });
    } else if (data.status == 2) {
      res.status(202).json({
        message: "Please Enter Valid Count",
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

/*---------------------REDCIEVED FROM SORTING--------------------------------*/

router.post("/recieved-from-sorting", async (req, res, next) => {
  try {
    let data = await warehouseInController.sortingDoneRecieved(req.body);
    if (data.status == 1) {
      res.status(200).json({
        message: "Successfully Received",
      });
    } else if (data.status == 2) {
      res.status(202).json({
        message: "Please Enter Valid Count",
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

/*---------------------GET WHT AND BOT TRAY SORTING REQUESTS --------------------------------*/

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

/*---------------------GET TRAY--------------------------------*/
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

/*---------------------BOT TRAY AND WHT TRAY ASSIGN TO AGENT--------------------------------*/

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

/*--------------------- WHT TRAY RETURN FROM SORTING AGENT IF TRAY IS FULL READY TO CHARGING --------------------------------*/

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

/*--------------------- MMT AND PMT DAILY WAISE REPORT --------------------------------*/

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

/*--------------------- SORT REPORT--------------------------------*/
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

/*--------------------- GET BOT TRAY READY / ASSIGNED MERGE WITH WHT--------------------------------*/
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

/*--------------------- BOT TRAY REPORT--------------------------------*/

router.post("/bot-tray-report", async (req, res, next) => {
  try {
    const { location, botTray } = req.body;
    let data = await warehouseInController.getBotTrayReport(location, botTray);
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

/*---------------------GET TRAY ITEM DETAILS BASED ON THE BRAND AND MODEL--------------------------------*/
router.post(
  "/bot-tray-report-item-details/:location/:trayId/:muic",
  async (req, res, next) => {
    try {
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

/*---------------------MMT MERGE--------------------------------*/

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

/*---------------------MMT TRAY SEND TO SORTING AGENT CONFIRM--------------------------------*/
router.post("/mmtTraySendToSorting", async (req, res, next) => {
  try {
    const { username, fromTray, toTray } = req.body;
    let data = await warehouseInController.assignToSortingAgent(
      username,
      fromTray,
      toTray
    );
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
        message: `Agent already have a lot `,
      });
    }
  } catch (error) {
    next(error);
  }
});

/*---------------------RETURN FROM MERGING--------------------------------*/
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

/*--------------------- AFTER MERGE IS DONE CLOSE MMT TRAY--------------------------------*/
router.post("/mergeDoneMmttrayClose", async (req, res, next) => {
  try {
    const { toTray, fromTray, type, length, limit, status } = req.body;
    let data = await warehouseInController.mergeDoneTrayClose(
      fromTray,
      toTray,
      type,
      length,
      limit,
      status
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

/*--------------------- ASSIGNMENT OF MMT AND WHT AND BOT FOR SORTING USER_CHECKING--------------------------------*/
router.post("/sortingAgnetStatus/:username/:toTray", async (req, res, next) => {
  try {
    const { username, toTray } = req.params;
    let data = await warehouseInController.getSortingAgentStatus(
      username,
      toTray
    );
    if (data.status === 1) {
      res.status(200).json({
        data: "User is free",
      });
    } else if (data.status === 2) {
      res.status(202).json({
        data: "Agent already have a lot",
      });
    } else if (data.status === 3) {
      res.status(202).json({
        data: "User not active",
      });
    }
  } catch (error) {
    next(error);
  }
});

/* CHECK CHARGING USER STATUS */
router.post("/chargingAgentStatus/:username", async (req, res, next) => {
  try {
    const { username } = req.params;
    let data = await warehouseInController.checkChargingAgentStatus(username);
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
router.post("/bqcAgentStatus/:username", async (req, res, next) => {
  try {
    const { username } = req.params;
    let data = await warehouseInController.checkBqcAgentStatus(username);
    if (data.status === 1) {
      res.status(200).json({
        message: "Valid",
        trayStatus: data.tray_status,
      });
    } else if (data.status === 2) {
      res.status(202).json({
        message: `User have already ${tray_type} - tray`,
        trayStatus: data.tray_status,
      });
    } else if (data.status == 3) {
      res.status(202).json({
        message: `Not a  ${tray_type} tray`,
        trayStatus: data.tray_status,
      });
    } else if (data.status == 4) {
      res.status(202).json({
        message: `Tray id does not exists`,
        trayStatus: "",
      });
    } else if (data.status == 5) {
      res.status(202).json({
        message: `Tray is in process`,
        trayStatus: data.tray_status,
      });
    } else if (data.status == 6) {
      res.status(202).json({
        message: `User have no issued WHT`,
        trayStatus: "",
      });
    } else if (data.status == 7) {
      res.status(202).json({
        message: `Mismatch Model or Brand`,
        trayStatus: "",
      });
    }
  } catch (error) {
    next(error);
  }
});

/* -------------------------TRAY ASSIGN TO AUDIT------------------------------*/
router.post("/oneTrayAssigToAudit", async (req, res, next) => {
  try {
    let data = await warehouseInController.oneTrayAssignToAudit(req.body);
    if (data) {
      res.status(200).json({
        message: "Successfully Assigned",
      });
    } else {
      res.status(200).json({
        message: "Failed tray again",
      });
    }
  } catch (error) {
    next(error);
  }
});

/*--------------------------------------READY FOR AUDIT --------------------------*/
// view the tray item
router.post("/readyForAuditView/:trayId/:status", async (req, res, next) => {
  try {
    const { trayId, status } = req.params;
    let data = await warehouseInController.getReadyForAuditView(trayId, status);
    if (data.status == 1) {
      res.status(200).json({
        message: "",
        data: data.tray,
      });
    } else if (data.status == 2) {
      res.status(202).json({
        message: `Tray present at ${data.tray.sort_id}`,
      });
    } else {
      res.status(202).json({
        message: `Tray not present`,
      });
    }
  } catch (error) {
    next(error);
  }
});
/* ---------------------ITEM SEGRIDATION -------------------------*/
// item add
router.post("/readyForAudit/itemSegrigation", async (req, res, next) => {
  try {
    let data = await warehouseInController.readyForRdlItemSegrigation(req.body);
    if (data.status == 1) {
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
/* CHECK UIC CODE for READY FOR AUDIT */
router.post("/check-uic-ready-for-audit", async (req, res, next) => {
  try {
    const { trayId, uic } = req.body;
    let data = await warehouseInController.checkUicCodeReadyForAudit(
      uic,
      trayId
    );
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
/* ---------------------CLOSE WHT TRAY -------------------*/
router.post("/readyForAudit/closeTray", async (req, res, next) => {
  try {
    let data = await warehouseInController.getReadyForAuditClose(req.body);
    if (data.status == 1) {
      res.status(200).json({
        message: "Successfully Closed",
      });
    } else if (data.status == 2) {
      res.status(200).json({
        message: "Successfully Sent to merging",
      });
    } else {
      res.status(202).json({
        message: "Failed please tray again",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* GET SALES BIN ITEM */
router.post("/salesBinItem/:location", async (req, res, next) => {
  try {
    const { location } = req.params;
    let data = await warehouseInController.getSalesBinItem(location);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});

// SEARCH FUNCATIONALITY IN SALES BIN
router.post("/salesBinItem/search/:uic", async (req, res, next) => {
  try {
    const { uic } = req.params;
    let data = await warehouseInController.getSalesBinSearchData(uic);
    if (data.status == 1) {
      res.status(200).json({
        data: data.item,
      });
    } else {
      res.status(202).json({
        message: "Sorry no records found",
      });
    }
  } catch (error) {
    next(error);
  }
});

/*-------------------------------------AUDIT USER STATUS CHECKING------------------------------------------------------------*/
router.post("/auditUserStatusChecking", async (req, res, next) => {
  try {
    const { username, brand, model } = req.body;
    let data = await warehouseInController.checkAuditUserFreeOrNot(
      username,
      brand,
      model
    );
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

/*----------------------------AUDIT TRAY ASSIGN WITH OTHER TRAY CHECKING------------------------------------------------------*/

router.post("/trayIdCheckAuditApprovePage", async (req, res, next) => {
  try {
    const { trayId, trayType, location, brand, model } = req.body;

    let data = await warehouseInController.checkTrayStatusAuditApprovePage(
      trayId,
      trayType,
      location,
      brand,
      model
    );
    if (data.status == 1) {
      res.status(200).json({
        message: "Valid Tray",
        trayId: trayId,
      });
    } else if (data.status == 2) {
      res.status(202).json({
        message: `Not a ${trayType} tray`,
      });
    } else if (data.status == 4) {
      res.status(202).json({
        message: "Tray id does not exists",
      });
    } else if (data.status == 5) {
      res.status(202).json({
        message: "Mismatch Brand and Model",
      });
    } else {
      res.status(202).json({
        message: "Tray already in process",
      });
    }
  } catch (error) {}
});

/*----------------------------------------AUDIT TRAY ISSUE TO AGENT----------------------------------------------- */

router.post("/auditTrayIssueToAgent", async (req, res, next) => {
  try {
    const data = await warehouseInController.auditTrayAssign(req.body);
    if (data.status == 1) {
      res.status(200).json({
        message: "Successfully Assigned to Agent",
      });
    } else {
      res.status(202).json({
        message: "Request Failed please tray again",
      });
    }
  } catch (error) {
    next(error);
  }
});

/*-------------------------------------FETCH ASSIGNED OTHER TRAY--------------------------------------------*/

router.post("/fetchAssignedTrayForAudit", async (req, res, next) => {
  try {
    const { username, brand, model } = req.body;
    let data = await warehouseInController.getAssignedTrayForAudit(
      username,
      brand,
      model
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

/*-----------------------------------------RETURN FROM AUDIT WHT RELEASE----------------------------------------------------*/
router.post("/wht-relase/:trayId", async (req, res, next) => {
  try {
    const { trayId } = req.params;
    let data = await warehouseInController.whtTrayRelease(trayId);
    if (data) {
      res.status(200).json({
        message: "Successfully Released",
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

/*----------------------------------------------------AUDIT USER TRAY FOR ASSIGN------------------------------------------------*/

router.post("/auditUserTrayForAssign", async (req, res, next) => {
  try {
    const { username, tray_type, tray_id, location } = req.body;
    let data = await warehouseInController.auditUserTray(
      username,
      tray_type,
      tray_id,
      location
    );

    if (data.status === 1) {
      res.status(200).json({
        message: "Valid",
        trayStatus: data.tray_status,
      });
    } else if (data.status === 2) {
      res.status(202).json({
        message: `User have already ${tray_type} - tray`,
        trayStatus: data.tray_status,
      });
    } else if (data.status == 3) {
      res.status(202).json({
        message: `Not a  ${tray_type} tray`,
        trayStatus: data.tray_status,
      });
    } else if (data.status == 4) {
      res.status(202).json({
        message: `Tray id does not exists`,
        trayStatus: "",
      });
    } else if (data.status == 5) {
      res.status(202).json({
        message: `Tray is in process`,
        trayStatus: data.tray_status,
      });
    } else if (data.status == 6) {
      res.status(202).json({
        message: `User have no issued WHT`,
        trayStatus: "",
      });
    } else if (data.status == 7) {
      res.status(202).json({
        message: `Mismatch Model or Brand`,
        trayStatus: "",
      });
    }
  } catch (error) {
    next(error);
  }
});

/* -------------------------TRAY ASSIGN TO AUDIT------------------------------*/
router.post("/oneTrayAssigToAudit", async (req, res, next) => {
  try {
    let data = await warehouseInController.oneTrayAssignToAudit(req.body);
    if (data) {
      res.status(200).json({
        message: "Successfully Assigned",
      });
    } else {
      res.status(200).json({
        message: "Failed tray again",
      });
    }
  } catch (error) {
    next(error);
  }
});

/*------------------------------------------------CTX TRAY -----------------------------------*/
// VIEW TRAY
router.post("/ctxTray/:type/:location", async (req, res, next) => {
  try {
    const { type, location } = req.params;
    const trayData = await warehouseInController.ctxTray(type, location);
    if (trayData.status == 1) {
      res.status(200).json({
        data: trayData.tray,
        message: "Success",
      });
    }
  } catch (error) {
    next(error);
  }
});

/*--------------------------PICKUP---------------------------------------*/
// PICKUP REQUEST
router.post("/pickup/request/:location/:type", async (req, res, next) => {
  try {
    const { location, type } = req.params;
    let data = await warehouseInController.pickupRequest(location, type);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
//APPROVE PAGE
router.post(
  "/pickup/request/approve/:location/:fromTray",
  async (req, res, next) => {
    try {
      const { location, fromTray } = req.params;

      let data = await warehouseInController.pickupePageRequestApprove(
        location,
        fromTray
      );

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
// EX VS ACT PAGE DATA ACCESS
router.post("/pickup/approve/ex-vs-act/:trayId", async (req, res, next) => {
  try {
    const { trayId } = req.params;
    let data = await warehouseInController.pickupApproveExvsAct(trayId);
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
// PICKUP REQUEST APPROVE ISSUE TO SORTING AGENET
router.post("/pickup/issueToAgent", async (req, res, next) => {
  try {
    const { username, fromTray, toTray } = req.body;
    let data = await warehouseInController.assigntoSoringForPickUp(
      username,
      fromTray,
      toTray
    );
    if (data.status === 1) {
      res.status(200).json({
        message: "Successfully Issued",
      });
    } else if (data.status === 0) {
      res.status(202).json({
        message: "Failed Please Try Again",
      });
    }
  } catch (error) {
    next(error);
  }
});
//PICKUP DONE CLOSED BY SORTING AGENT
router.post("/pickup/returnFromSorting/:location", async (req, res, next) => {
  try {
    const { location } = req.params;
    let data = await warehouseInController.getPickDoneClosedBySorting(location);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
// PICKUP DONE RECIEVE
router.post("/pickup/recieve", async (req, res, next) => {
  try {
    let data = await warehouseInController.pickupDoneRecieve(req.body);
    if (data.status == 1) {
      res.status(200).json({
        message: "Successfully Received",
      });
    } else if (data.status == 2) {
      res.status(202).json({
        message: "Failed",
      });
    } else {
      res.status(202).json({
        message: "Please Enter Valid Count",
      });
    }
  } catch (error) {
    next(error);
  }
});
// PICKUP DONE CLOSE
router.post("/pickupDone/close", async (req, res, next) => {
  try {
    let data = await warehouseInController.pickupdoneClose(req.body);
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

/*-----------------------------------------RDL WORK--------------------------------------*/
//CHECK RDL-FLS USER FREE OR NOT
router.post("/checkRdl-flsUserStatus/:username", async (req, res, next) => {
  try {
    const { username } = req.params;
    let data = await warehouseInController.checkRdlFlsUserStatus(username);
    if (data.status === 1) {
      res.status(200).json({
        data: "User is free",
      });
    } else if (data.status === 2) {
      res.status(202).json({
        data: "Agent already have a lot",
      });
    } else if (data.status === 3) {
      res.status(202).json({
        data: "User not active",
      });
    }
  } catch (error) {
    next(error);
  }
});
//CHECK RDL-2 USER FREE OR NOT
router.post("/checkRdl-2/status/:username", async (req, res, next) => {
  try {
    const { username } = req.params;
    let data = await warehouseInController.checkRdl2UserStatus(username);
    if (data.status === 1) {
      res.status(200).json({
        data: "User is free",
      });
    } else if (data.status === 2) {
      res.status(202).json({
        data: "Agent already have a lot",
      });
    } else if (data.status === 3) {
      res.status(202).json({
        data: "User not active",
      });
    }
  } catch (error) {
    next(error);
  }
});
router.post(
  "/request-for-RDL-fls/:status/:location",
  async (req, res, next) => {
    try {
      let data = await warehouseInController.getRDLoneRequest(
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
  }
);

router.post("/wht-add-actual-item-rdl-return", async (req, res, next) => {
  try {
    let data = await warehouseInController.addWhtActualReturnRdl(req.body);
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
        setLoading,
      });
    }
  } catch (error) {
    next(error);
  }
});

router.post("/issue-to-agent-wht-recived-rdl-one", async (req, res, next) => {
  try {
    let data = await warehouseInController.issueToagentWhtReciveRdOne(req.body);
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

router.post("/recieved-from-RDL_one", async (req, res, next) => {
  try {
    let data = await warehouseInController.RDLoneDoneRecieved(req.body);
    if (data.status == 1) {
      res.status(200).json({
        message: "Successfully Received",
      });
    }
    if (data.status == 3) {
      res.status(202).json({
        message: "Please Enter Valid Count",
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

router.post(
  "/getWhtTrayItemRdlreturn/:trayId/:sortId",
  async (req, res, next) => {
    try {
      const { trayId, sortId } = req.params;
      let data = await warehouseInController.getWhtTrayitemRdlreturn(
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
      } else if (data.status == 3) {
        res.status(202).json({
          message: `${trayId} - present at ${data.data.sort_id}`,
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/request-for-RDL_one_returnrdl-fls/:status/:location",
  async (req, res, next) => {
    try {
      let data = await warehouseInController.getRDLonereturn(
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
  }
);

router.post("/trayItem/:trayid", async (req, res, next) => {
  try {
    let data = await warehouseInController.getTrayItmes(req.params.trayid);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});

router.post("/check-uic-RDL-done", async (req, res, next) => {
  try {
    const { trayId, uic } = req.body;
    let data = await warehouseInController.checkUicCodeRDLDone(uic, trayId);
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

router.post("/rdl-fls/closedByWh", async (req, res, next) => {
  try {
    let data = await warehouseInController.rdlFlsDoneClose(req.body);
    if (data) {
      res.status(200).json({
        message: "Tray Closed Succcessfully",
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
/*-------------------------------------------------CTX TRAY -------------------------------------------*/
router.post("/ctx/transferRequest/approve", async (req, res, next) => {
  try {
    const { sales_location } = req.body;
    const data = await warehouseInController.ctxTrayTransferApprove(req.body);
    if (data.status == 1) {
      res.status(200).json({
        message: `Successfully Transfer to ${sales_location}`,
      });
    } else if (data.status == 3) {
      res.status(200).json({
        message: `Successfully Accepted and Sent to Warehouse`,
      });
    } else if (data.status == 4) {
      res.status(200).json({
        message: `Successfully Closed`,
      });
    } else if (data.status == 5) {
      res.status(200).json({
        message: `Successfully Closed `,
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
router.post("/ctx-transfer/receive", async (req, res, next) => {
  try {
    let data = await warehouseInController.ctxTransferReceive(req.body);
    if (data.status == 1) {
      res.status(200).json({
        message: "Successfully Received",
      });
    }
    if (data.status == 3) {
      res.status(202).json({
        message: "Please Enter Valid Count",
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
/*---------------------------------CTX TO STX-------------------------*/
// return from sorting
router.post(
  "/returnFromsorting/ctxToStx/tray/:location",
  async (req, res, next) => {
    try {
      let data = await warehouseInController.sortingCtxToStxTray(
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
// SORTING DONE TRAY CLOSE
router.post(
  "/sorting/returnFromSortingCtxStx/close",
  async (req, res, next) => {
    try {
      let data = await warehouseInController.sortingDoneCtxStxClose(req.body);
      if (data.status == 1) {
        res.status(200).json({
          message: "Successfully Closed and Ready for Pricing",
        });
      } else if (data.status == 2) {
        res.status(200).json({
          message: "Successfully Closed and Ready to Transfer to Processing",
        });
      } else if (data.status == 3) {
        res.status(200).json({
          message: "Successfully Closed",
        });
      } else {
        res.status(202).json({
          message: "Failed....",
        });
      }
    } catch (error) {
      next(error);
    }
  }
);
/*-------------------------------------------STX-TRAY-------------------------------------------*/
// VIEW TRAY
router.post("/stxTray/:type/:location", async (req, res, next) => {
  try {
    const { type, location } = req.params;
    const trayData = await warehouseInController.stxTray(type, location);
    if (trayData.status == 1) {
      res.status(200).json({
        data: trayData.tray,
        message: "Success",
      });
    }
  } catch (error) {
    next(error);
  }
});
/*-------------------------------------------BILLED BIN-------------------------------------------*/
// VIEW TRAY
router.post("/billedBin/:location", async (req, res, next) => {
  try {
    const { location } = req.params;
    const data = await warehouseInController.billedBinPageData(location);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
// ACTIO MOVED TO BILLED BIN
router.post("/movedToBilledBin", async (req, res, next) => {
  try {
    const { uic, trayId, username } = req.body;
    const data = await warehouseInController.itemMoviedToBillBin(
      uic,
      trayId,
      username
    );
    if (data.status == 1) {
      res.status(200).json({
        message: "Item Successfully Moved to Billed Bin",
      });
    } else {
      res.status(202).json({
        message: "Failed Please Tray again...",
      });
    }
  } catch (error) {
    next(error);
  }
});
/*-----------------------------------------BILLED BIN REPORT-------------------------------*/

router.post("/billedBin/report/:location", async (req, res, next) => {
  try {
    const { location } = req.params;
    const data = await warehouseInController.billedBinReport(location);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});

/*-----------------------------------------WHT TO RP SORTING ----------------------------------------*/

// GET RP TRAY
router.post("/whtToRp/requests/:location", async (req, res, next) => {
  try {
    const { location } = req.params;
    const data = await warehouseInController.whtToRpRequests(location);
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

// GET WHT TRAY
router.post("/whtToRp/whtTray", async (req, res, next) => {
  try {
    const { whtTray, location } = req.body;
    const data = await warehouseInController.whtToRpWhtTrayScan(
      location,
      whtTray
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
// ISSUED TO SORTING
router.post("/whtToRp/issueToAgent", async (req, res, next) => {
  try {
    const { rpTray, whtTray } = req.body;
    const data = await warehouseInController.whtToRpIssueToAgent(
      rpTray,
      whtTray
    );
    if (data.status == 1) {
      res.status(200).json({
        message: "Successfully Issued",
      });
    } else {
      res.status(202).json({
        message: "Failed please tray again...",
      });
    }
  } catch (error) {
    next(error);
  }
});
// RETURN FROM SORTING WHT TO RP
router.post("/returnFromWhtToRpSorting/:location", async (req, res, next) => {
  try {
    let data = await warehouseInController.getReturnFromSortingWhtToRp(
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
// RECEIVED FROM SORTING WHT TO RP
router.post("/recieved-from-sortingWhtToRp", async (req, res, next) => {
  try {
    let data = await warehouseInController.receivedFromWhtToRpSorting(req.body);
    if (data.status == 1) {
      res.status(200).json({
        message: "Successfully Received",
      });
    }
    if (data.status == 3) {
      res.status(202).json({
        message: "Please Enter Valid Count",
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
module.exports = router;
