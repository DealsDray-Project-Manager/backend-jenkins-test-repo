/* Express */
const express = require("express");
const router = express.Router();
// user controller
const bqcController = require("../../Controller/bqc-controller/bqc-controller");
/****************************************************************************************** */
/* GET ALL ASSIGNED TRAY */
router.post("/assigned-tray/:userName", async (req, res, next) => {
  try {
    let data = await bqcController.getAssignedTray(req.params.userName);
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
router.post(
  "/assigned-wht-item/:trayId/:username/:status",
  async (req, res, next) => {
    try {
      const { trayId, username, status } = req.params;
      let data = await bqcController.getWhtTrayitem(trayId, username, status);
      if (data.status === 1) {
        res.status(200).json({
          data: data.data,
        });
      } else if (data.status === 2) {
        res.status(403).json({
          message: "You can't access this data",
        });
      } else if (data.status === 3) {
        res.status(403).json({
          message: "Details not found",
        });
      } else {
        res.status(403).json({
          message: `${trayId} - present at ${data.data.sort_id}`,
        });
      }
    } catch (error) {
      next(error);
    }
  }
);
/* TRAY BQC IN  */
router.post("/bqc-in", async (req, res, next) => {
  try {
    let data = await bqcController.bqcIn(req.body);
    if (data) {
      res.status(200).json({
        message: "Successfully BQC IN",
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
/* BQC DONE */
router.post("/bqc-done", async (req, res, next) => {
  try {
    let data = await bqcController.bqcOut(req.body);
    if (data) {
      res.status(200).json({
        message: "Successfully Send to Warehouse",
      });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
