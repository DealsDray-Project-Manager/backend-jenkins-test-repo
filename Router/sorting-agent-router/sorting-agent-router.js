const express = require("express");
const router = express.Router();
const sortingAgentController = require("../../Controller/sorting-agent/sorting-agent-controller");
/******************************************** */

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
      if (data) {
        res.status(200).json({
          data: data,
        });
      } else {
        res.status(403).json({
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
      res.status(403).json({
        message: "Invalid UIC",
      });
    } else if (data.status == 3) {
      res.status(403).json({
        message: "Item does not exists in the tray",
      });
    } else if (data.status == 4) {
      res.status(403).json({
        message: "Item Aleady added",
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
/* BOT TRAY AND WHT TRAY SEND TO WAREHOUSE */
router.post("/bot-and-wht-send-to-warehouse", async (req, res, next) => {
  try {
    let data = await sortingAgentController.sendToWarehouse(req.body);
    if (data) {
      res.status(200).json({
        message: "Tray Successfully Sent to warehouse",
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
/* VIEW ASSIGNED WHT TRAY */
router.post("/view-assigned-wht-tray/:username", async (req, res, next) => {
  try {
    let data = await sortingAgentController.getAssignedWht(req.params.username);
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
module.exports = router;
