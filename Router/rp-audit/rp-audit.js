/*----------------------------------------EXPRESS--------------------------------------------------*/
const express = require("express");
// ROUTER
const router = express.Router();
const fs = require("fs");
// CONTROLLER
const rpAuditController = require("../../Controller/rp-audit-controller/rp-aduit-controller");
const BlanccoDataFetch = require("../../Utils/blancco-data-fetch");
const auditController = require("../../Controller/audit-controller/audit-controller");
/*--------------------------------------------------------------------------------------------------*/
// DASHBOARD
router.post("/dashboard/:username", async (req, res, next) => {
  try {
    const { username } = req.params;
    const data = await rpAuditController.dashboard(username);
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
    let blanccoData = await BlanccoDataFetch.fetchDataOfRpAuditScan(uic);
    if (blanccoData.status == 1 || blanccoData.status == 0) {
      let data = await rpAuditController.getDataforStartRPAudit(uic, username);
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
    }
  } catch (error) {
    next(error);
  }
});
// ADD RPBQC DATA
router.post("/add-rpAudit-data", async (req, res, next) => {
  try {
    let data;
    let createSubMuic;
    let {
      status,
      color,
      storage_verification,
      ram_verification,
      muic,
      username,
      currentSubMuicCount,
      subMuic,
    } = req.body;
    currentSubMuicCount = `${muic}-${currentSubMuicCount}`;
    if (status == "RP-Audit Passed" && subMuic == null) {
      createSubMuic = await auditController.createSubMuic(
        color,
        storage_verification,
        ram_verification,
        muic,
        username,
        currentSubMuicCount
      );
      if (createSubMuic.status == 1) {
        fs.readFile(
          "myjsonfile.json",
          "utf8",
          function readFileCallback(err, datafile) {
            if (err) {
            } else {
              obj = JSON.parse(datafile);
              let num = parseInt(obj.SUBMUIC.substring(0)) + 1;
              let updatedStr =
                obj.SUBMUIC.substring(0, 0) + num.toString().padStart(6, "0");
              obj.SUBMUIC = updatedStr;
              json = JSON.stringify(obj);
              fs.writeFile(
                "myjsonfile.json",
                json,
                "utf8",
                function readFileCallback(err, data) {
                  if (err) {
                  }
                }
              );
            }
          }
        );
        data = await rpAuditController.addRpAuditData(
          req.body,
          currentSubMuicCount
        );
      } else {
        res.status(202).json({
          message: "Failed please try again",
        });
      }
    } else {
      data = await rpAuditController.addRpAuditData(req.body, subMuic);
    }
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
