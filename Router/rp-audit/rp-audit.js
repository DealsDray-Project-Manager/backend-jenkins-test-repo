/*----------------------------------------EXPRESS--------------------------------------------------*/
const express = require("express");
// ROUTER
const router = express.Router();
// CONTROLLER
const rpAuditController = require("../../Controller/rp-audit-controller/rp-aduit-controller");

/*--------------------------------------------------------------------------------------------------*/
// DASHBOARD
router.post("/dashboard/:username", async (req, res, next) => {
  try {
    const { username } = req.params;
    const data = await rpAuditController.dashboard(username);
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
// VIEW ISSUED TRAY
router.post("/issuedTrays/:username", async (req, res, next) => {
  try {
    const { username } = req.params;
    const data = await rpAuditController.getIssuedTrays(username);
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
// START RP-AUDIT SCREEN
router.post("/startRpAudit", async (req, res, next) => {
  try {
    const { uic, username } = req.body;
    let data = await rpAuditController.getDataforStartRPAudit(uic, username);
    console.log(data);
    if (data.status === 1) {
      res.status(200).json({
        data: data.allData,
      });
    } else if (data.status === 2) {
      res.status(202).json({
        message: "UIC does not exists",
      });
    } else {
      res.status(202).json({
        message: "Error please try again!",
      });
    }
  } catch (error) {
    next(error);
  }
});
// ADD RPBQC DATA
router.post("/add-rpAudit-data", async (req, res, next) => {
  try {
    const data = await rpAuditController.addRpAuditData(req.body);
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
// GET THE TRAY FOR CLOSE
router.post("/close-page/:username/:trayId", async (req, res, next) => {
  try {
    console.log(req.params);
    const { username, trayId } = req.params;
    const data = await rpAuditController.getTrayForClosepage(username, trayId);
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
// CLOSE RPAUDIT TRAY
router.post("/close-rpaudit-tray", async (req, res, next) => {
  try {
    const data = await rpAuditController.closeRpAuditTray(req.body);
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
module.exports = router;
