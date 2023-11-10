/*-------------------------------EXPRESS-------------------------------------------------*/
const express = require("express");
// ROUTER
const router = express.Router();
// CONTROLLER
const rebqcController = require("../../Controller/rebqc-controller/rebqc-controller");

/*-------------------------------------------------------------------------*/
// DASHBOARD
router.post("/dashboard/:username", async (req, res, next) => {
  try {
    const { username } = req.params;
    const data = await rebqcController.dashboard(username);
    if (data) {
      console.log(data);
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
//GET ISSUED TRAYS
router.post("/issued-trays/:username", async (req, res, next) => {
  try {
    const { username } = req.params;
    const data = await rebqcController.getIssuedTrays(username);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
// GET THE TRAY FOR CLOSE
router.post("/close-page/:username/:trayId", async (req, res, next) => {
  try {
    console.log(req.params);
    const { username, trayId } = req.params;
    const data = await rebqcController.getTrayForClosepage(username, trayId);
    if (data.status == 1) {
      res.status(200).json({
        data: data.trayData,
      });
    } else {
      res.status(202).json({
        message: "You can't access this data",
      });
    }
  } catch (error) {
    next(error);
  }
});
// GET PENDING ITEMS
router.post("/pedning-item", async (req, res, next) => {
  const { uic, username } = req.body;
  console.log(req.body);
  const data = await rebqcController.getDataofPendingItems(username, uic);
  console.log(data);
  if (data.status == 1) {
    res.status(200).json({
      data: data.findData,
    });
  } else {
    res.status(202).json({
      message: "Invalid UIC",
    });
  }
});
// ADD REBQC DATA
router.post("/add-rebqc-data", async (req, res, next) => {
  try {
    console.log(req.body);
    const data = await rebqcController.addReBqcData(req.body);
    console.log(data);
    if (data.status === 1) {
      res.status(200).json({
        message: `Successfully Added into ${data.trayId}`,
      });
    } else if (data.status == 2) {
      res.status(202).json({
        message: `Item Return to RDL-2 tray ${data.trayId}`,
      });
    } else {
      res.status(202).json({
        message: `Updation failed please try again!`,
      });
    }
  } catch (error) {
    next(error);
  }
});
// CLOSE REBQC TRAY
router.post("/close-rebqc-tray", async (req, res, next) => {
  try {
    const data = await rebqcController.closeRebqcTray(req.body);
    if (data.status == 1) {
      res.status(200).json({
        message: "Successfully closed",
      });
    } else {
      res.status(202).json({
        message: "Failed please try again!",
      });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
