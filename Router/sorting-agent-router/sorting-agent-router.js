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
        message: "Tray Successfully Sent to Warehouse",
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
    const { username,type } = req.params;
    let data = await sortingAgentController.getAssignedPickupTray(username,type);
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
        message: `This item not move keep it in the ${fromTray} `,
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
    const {trayId}=req.params
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
module.exports = router;
