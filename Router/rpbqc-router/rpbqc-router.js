/*-------------------------------EXPRESS-------------------------------------------------*/
const express = require("express");
// ROUTER
const router = express.Router();
// CONTROLLER
const rpbqcController = require("../../Controller/rpbqc-controller/rpbqc-controller");

/*-------------------------------------------------------------------------*/
// DASHBOARD
router.post("/dashboard/:username", async (req, res, next) => {
  try {
    const { username } = req.params;
    const data = await rpbqcController.dashboard(username);
    if (data) {
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
    const data = await rpbqcController.getIssuedTrays(username);
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
    const { username, trayId } = req.params;
    const data = await rpbqcController.getTrayForClosepage(username, trayId);
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
  const { uic, username, type } = req.body;
  const data = await rpbqcController.getDataofPendingItems(username, uic, type);
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
// ADD RPBQC DATA
router.post("/add-rpbqc-data", async (req, res, next) => {
  try {
    const data = await rpbqcController.addRpBqcData(req.body);
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
// CLOSE RPBQC TRAY
router.post("/close-rpbqc-tray", async (req, res, next) => {
  try {
    const data = await rpbqcController.closeRpbqcTray(req.body);
    console.log(data);
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
// GET RPBQC TRAY FOR RDL-2 SELECTION
router.post(
  "/getRpbqcTrayRdlTwoSelection/:username",
  async (req, res, next) => {
    try {
      const { username } = req.params;
      const data = await rpbqcController.getRpbqcTrayForRdlSelection(username);
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
// GET RPBQC TRAY FOR RDL-2 SELECTION
router.post(
  "/getRpAuditTrayRpBqcSelection/:username",
  async (req, res, next) => {
    try {
      const { username } = req.params;
      const data = await rpbqcController.getRpAuditTrayForRpBqcelection(
        username
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
module.exports = router;
