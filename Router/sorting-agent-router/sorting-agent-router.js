const express = require("express");
const router = express.Router();
const sortingAgentController = require("../../Controller/sorting-agent/sorting-agent-controller");
/******************************************** */

/* DASHBOARD */
router.post("/dashboard/:username", async (req, res, next) => {
  try {
    const { username } = req.params;
    let data = await sortingAgentController.dashboard(username);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
/* API FOR GET ASSIGNED TRAY */
router.post("/get-assigned-sorting-tray/:username", async (req, res, next) => {
  try {
    const { username } = req.params;
    let data = await sortingAgentController.getAssignedSortingTray(username);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
/* GET DATA FOR START SORTING */
router.post(
  "/get-data-for-start-sorting/:username/:trayId",
  async (req, res, next) => {
    try {
      const { username, trayId } = req.params;
      let data = await sortingAgentController.getDataForStartSorting(
        username,
        trayId
      );

      if (data.status == 1) {
        res.status(200).json({
          data: data.tray,
        });
      } else {
        res.status(202).json({
          message: "No data found",
        });
      }
    } catch (error) {
      next(error);
    }
  }
);
/* SCAN UIC IN SORT STARTING PAGE */
router.post("/cheack-uic-for-sorting", async (req, res, next) => {
  try {
    let data = await sortingAgentController.checkUic(req.body);
    if (data.status === 1) {
      res.status(200).json({
        data: data.data,
        message: "Valid UIC",
      });
    } else if (data.status === 2) {
      res.status(202).json({
        message: "Invalid UIC",
      });
    } else if (data.status == 3) {
      res.status(202).json({
        message: "Item does not exists in the tray",
      });
    } else if (data.status == 4) {
      res.status(202).json({
        message: "Item Already added",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* ITEM MOVE TO WHT TRAY */
router.post("/item-move-to-wht", async (req, res, next) => {
  try {
    let data = await sortingAgentController.itemShiftToWht(req.body);
    if (data.status == 3) {
      res.status(200).json({
        message: "Successfully Added",
      });
    } else if (data.status == 1) {
      res.status(202).json({
        message: "Failed",
      });
    } else if (data.status == 2) {
      res.status(202).json({
        message: "Already Added",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* BOT TRAY AND WHT TRAY SEND TO WAREHOUSE */
router.post("/bot-and-wht-send-to-warehouse", async (req, res, next) => {
  try {
    let data = await sortingAgentController.sendToWarehouse(req.body);
    if (data.status == 1) {
      res.status(200).json({
        message: "Tray Successfully Sent to warehouse",
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
/* VIEW ASSIGNED WHT TRAY */
router.post("/view-assigned-wht-tray/:username", async (req, res, next) => {
  try {
    let data = await sortingAgentController.getAssignedWht(req.params.username);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
/* WHT TRAY CLOSE */
router.post("/wht-tray-close/:trayId", async (req, res, next) => {
  try {
    const { trayId } = req.params;
    let data = await sortingAgentController.trayCloseWht(trayId);
    if (data) {
      res.status(200).json({
        message: "Tray Successfully Sent to warehouse",
      });
    }
  } catch (error) {
    next(error);
  }
});
/*****************************************MMT MERGE**************************************** */
/* GET ASSIGNED MMT TRAY */
router.post("/getAssignedFromTray/:username", async (req, res, next) => {
  try {
    const { username } = req.params;
    let data = await sortingAgentController.getAssignedMmtTray(username);

    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
/* MMT MERGE ITEM SHIFTED FROM TO */
router.post("/itemShifteToMmtTray", async (req, res, next) => {
  try {
    let data = await sortingAgentController.itemShiftToMmt(req.body);
    if (data.status === 1) {
      res.status(200).json({
        message: "Item transfered",
      });
    } else if (data.status == 3) {
      res.status(202).json({
        message: "Tray is Full",
      });
    } else if (data.status == 4) {
      res.status(202).json({
        message: "Item Already Added",
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
/* MMT TRAY SEND TO WAREHOUSE */
router.post("/mergeDoneTraySendToWarehouse", async (req, res, next) => {
  try {
    let data = await sortingAgentController.mergeDoneSendToWh(req.body);
    if (data.status === 1) {
      res.status(200).json({
        message: "Successfully Sent to Warehouse",
      });
    } else {
      res.status(202).json({
        message: "Failed Please tray again",
      });
    }
  } catch (error) {
    next(error);
  }
});
/*--------------------------------PICKUP MODULE-------------------------------------*/
// GET ASSIGNED TRAY FOR PICKUP
router.post("/pickup/assigendTray/:username/:type", async (req, res, next) => {
  try {
    const { username, type } = req.params;
    let data = await sortingAgentController.getAssignedPickupTray(
      username,
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
//GET ONE TRAY
router.post("/pickup/getTray/:fromTray", async (req, res, next) => {
  try {
    const { fromTray } = req.params;
    let data = await sortingAgentController.pickupGetOntrayStartPage(fromTray);

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
});
// Pickup item transferpage uic scan
router.post("/pickup/itemTransferUicScan", async (req, res, next) => {
  try {
    let data = await sortingAgentController.pickupItemTransferUicScan(req.body);
    if (data.status === 1) {
      res.status(200).json({
        data: data.data,
        message: "Valid UIC",
      });
    } else if (data.status === 2) {
      res.status(202).json({
        message: "Invalid UIC",
      });
    } else if (data.status == 3) {
      res.status(202).json({
        message: "Item does not exists in the tray",
      });
    } else if (data.status == 4) {
      res.status(202).json({
        message: "Item Already added",
      });
    }
  } catch (error) {
    next(error);
  }
});
//Pickup module transfer to from tray to TO tray
router.post("/pickup/itemTransfer", async (req, res, next) => {
  try {
    const { toTray, fromTray } = req.body;
    let data = await sortingAgentController.pickupItemTrasfer(req.body);
    if (data.status == 1) {
      res.status(200).json({
        message: `Item successfully transfer to - ${toTray}`,
      });
    } else if (data.status == 2) {
      res.status(200).json({
        message: `Do not move this unit,keep in Same tray (${fromTray}) `,
      });
    } else if (data.status == 3) {
      res.status(200).json({
        message: `This item  Already Added`,
      });
    } else {
      res.status(202).json({
        message: "Item Transfer failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
// PICKUP DONE CLOSE BY WAREHOUSE
router.post("/pickup/closeTray", async (req, res, next) => {
  try {
    let data = await sortingAgentController.pickupDoneClose(req.body);

    if (data.status === 1) {
      res.status(200).json({
        message: "Successfully Sent to Warehouse",
      });
    } else {
      res.status(202).json({
        message: "Failed Please tray again",
      });
    }
  } catch (error) {
    next(error);
  }
});
router.post("/pickup/edoCloseTray/:trayId", async (req, res, next) => {
  try {
    const { trayId } = req.params;
    let data = await sortingAgentController.pickupDoneEodClose(trayId);

    if (data.status === 1) {
      res.status(200).json({
        message: "Successfully Sent to Warehouse",
      });
    } else {
      res.status(202).json({
        message: "Failed Please tray again",
      });
    }
  } catch (error) {
    next(error);
  }
});
/*-------------------------------------CTX TO STX SORTING-------------------------------*/
// get assigned ctx tray
router.post("/sorting/ctx/assignedTray/:username", async (req, res, next) => {
  try {
    const { username } = req.params;
    let data = await sortingAgentController.sortingGetAssignedCtxTray(username);

    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});

/*-----------------------------------WHT TO RP SORTING -----------------------------------*/
router.post(
  "/sorting/wht-to-rp/assignedTray/:username/:trayType",
  async (req, res, next) => {
    try {
      const { username, trayType } = req.params;
      let data = await sortingAgentController.sortingGetAssignedTrayForWhtToRp(
        username,
        trayType,
        trayType
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
// START SORTING PAGE
router.post("/sorting/wht-to-rp/:trayId/:username", async (req, res, next) => {
  try {
    const { trayId, username } = req.params;
    let data = await sortingAgentController.sortingForWhtToRpStartPage(
      trayId,
      username
    );
    if (data.status == 1) {
      res.status(200).json({
        data: data.tray,
        rpTray: data.rpTray,
      });
    } else if (data.status == 2) {
      res.status(202).json({
        message: "Sorry you can't access this data",
      });
    } else {
      res.status(202).json({
        message: "Tray not found",
      });
    }
  } catch (error) {
    next(error);
  }
});

// UIC SCAN FOR WHT TO RP
router.post("/whtToRp/itemTransferUicScan", async (req, res, next) => {
  try {
    let data = await sortingAgentController.whtToRpItemScan(req.body);
    if (data.status === 1) {
      res.status(200).json({
        data: data.data,
        message: "Valid UIC",
      });
    } else if (data.status === 2) {
      res.status(202).json({
        message: "Invalid UIC",
      });
    } else if (data.status == 3) {
      res.status(202).json({
        message: "Item does not exists in the tray",
      });
    } else if (data.status == 4) {
      res.status(202).json({
        message: "Item Already added",
      });
    }
  } catch (error) {
    next(error);
  }
});
// WHT TO RP ITEM SEGGRIGATION

router.post("/whtToRp/itemTransfer", async (req, res, next) => {
  try {
    const { rpTray, whtTray } = req.body;
    let data = await sortingAgentController.whtToRpItemTransfer(req.body);
    if (data.status == 1) {
      res.status(200).json({
        message: `Item successfully transfer to - ${rpTray}`,
      });
    } else if (data.status == 2) {
      res.status(200).json({
        message: `Do not move this unit,keep in Same tray (${whtTray}) `,
      });
    } else if (data.status == 3) {
      res.status(200).json({
        message: `This item  Already Added`,
      });
    } else {
      res.status(202).json({
        message: "Item Transfer failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
// WHT TO RP SORTING DONE CLOSE THE TRAY
router.post("/whtToRp/closeTray", async (req, res, next) => {
  try {
    let data = await sortingAgentController.whtToTRpSortingDoneCloseTray(
      req.body
    );

    if (data.status === 1) {
      res.status(200).json({
        message: "Successfully Sent to Warehouse",
      });
    } else {
      res.status(202).json({
        message: "Updation not completed please try again...",
      });
    }
  } catch (error) {
    next(error);
  }
});
/*----------------------------------------------COPY GRADING -------------------------------------------------------*/
router.post("/copyGradingRequests/:username", async (req, res, next) => {
  try {
    const { username } = req.params;
    let data = await sortingAgentController.getDisplayGradingRequests(username);

    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
// FOR START Display GRADING PAGE
router.post(
  "/copyGradingStartWork/:trayId/:username",
  async (req, res, next) => {
    try {
      const { username, trayId } = req.params;
      let data = await sortingAgentController.getDisplayGradingStartWork(
        trayId,
        username
      );

      if (data.status == 1) {
        res.status(200).json({
          data: data.trayData,
        });
      } else if (data.status == 2) {
        res.status(202).json({
          message: "Sorry You can't access this data",
        });
      } else {
        res.status(202).json({
          message: "Tray Not found",
        });
      }
    } catch (error) {
      next(error);
    }
  }
);
// ADD GRADE
router.post("/copyGradingAddItems", async (req, res, next) => {
  try {
    let data = await sortingAgentController.addItemsForDisplayGrading(req.body);
    if (data.status == 1) {
      res.status(200).json({
        message: "Successfully Added",
      });
    } else {
      res.status(202).json({
        message: "Updation Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
// CLOSE THE TRAY AFTER Display GRADING
router.post("/copyGradingCloseTray/:trayId", async (req, res, next) => {
  try {
    const { trayId } = req.params;
    let data = await sortingAgentController.DisplayGradeCloseTray(trayId);
    if (data.status == 1) {
      res.status(200).json({
        message: "Successfully Closed",
      });
    } else {
      res.status(202).json({
        message: "Updation Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
// CHECK UIC FOR COPY GRADING
router.post("/copyGradingCheckUic", async (req, res, next) => {
  try {
    const { trayId, uic } = req.body;
    let data = await sortingAgentController.copyGradingCheckUic(uic, trayId);
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
        copyGradeReport: data.copyGradeReport,
      });
    }
  } catch (error) {
    next(error);
  }
});
module.exports = router;
