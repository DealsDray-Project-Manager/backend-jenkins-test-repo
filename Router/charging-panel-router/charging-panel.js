/* Express */
const express = require("express");
const router = express.Router();
// user controller
const chargingController = require("../../Controller/charging-panel-controller/charging-panel");
/*******************************************************************************************************************/
/***************************TRAY***************************************************** */
/* GET ASSIGNED TRAY */
router.post("/assigned-tray/:userName", async (req, res, next) => {
  try {
    let data = await chargingController.getAssignedTray(req.params.userName);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});

/* DASHBOARD CHARGING */
router.post("/dashboard/:username", async (req, res, next) => {
  try {
    const { username } = req.params;
    let data = await chargingController.dashboardCount(username);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});

/* VIEW TRAY ITEM DETAIL */
router.post("/view-tray-details/:trayId", async (req, res, next) => {
  try {
    let data = await chargingController.getTrayDetails(req.params.trayId);
    if (data) {
      res.status(200).json({
        data: data,
      });
    } else {
      res.status(202).json({
        message: "Tray is not present",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* TRAY CLOSE */
router.post("/charge-in", async (req, res, next) => {
  try {
    let data = await chargingController.chargingStationIN(req.body);
    if (data) {
      res.status(200).json({
        message: "Successfully Charge IN",
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
/* CHARGING DONE */
router.post("/charging-done", async (req, res, next) => {
  try {
    let data = await chargingController.chargeDone(req.body);
    if (data) {
      res.status(200).json({
        message: "Successfully Sent to Warehouse",
      });
    }
  } catch (error) {
    next(error);
  }
});


router.post("/check-uic", async (req, res, next) => {
  try {
    const { trayId, uic } = req.body;
    let data = await chargingController.checkUicCode(uic, trayId);
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
/************************************************************************************************************** */
module.exports = router;
