const express = require("express");
const router = express.Router();
const auditController = require("../../Controller/audit-controller/audit-controller");

/*-------------------------------AUDIT DASHBOARD------------------------------------------*/
router.post("/dashboard/:username", async (req, res, next) => {
  try {
    const { username } = req.params;
    let data = await auditController.dashboardData(username);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});

/*------------------------GET ASSIGNED OTHER TRAY--------------------------------------*/
router.post("/getAssignedOtherTray/:username", async (req, res, next) => {
  try {
    const { username } = req.params;
    let data = await auditController.getAssigendOtherTray(username);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});

/*-----------------------------VIEW TRAY ITEM-----------------------------------------*/
router.post("/view-items/:trayId", async (req, res, next) => {
  try {
    const { trayId } = req.params;
    let data = await auditController.getAssignedTrayItems(trayId);
    if (data) {
      res.status(200).json({
        data: data,
      });
    } else {
      res.status(202).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});

/*-------------------------------ASSIGNED WHT TRAY----------------------------------------------*/
router.post("/auditRequests/:username", async (req, res, next) => {
  try {
    const { username } = req.params;
    let data = await auditController.getAuditRequest(username);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});

/*---------------------------------SCREEN TRANSACTION------------------------------------------------------------- */

router.post("/transactionScreen/:trayId/:username", async (req, res, next) => {
  try {
    const { trayId, username } = req.params;
    let data = await auditController.getTransactionData(trayId, username);
    if (data.status == 1) {
      res.status(200).json({
        data: data.tray,
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

/*-----------------------------BQC REPORT--------------------------------------*/
router.post("/bqcReport/:uic/:trayId", async (req, res, next) => {
  try {
    const { uic, trayId } = req.params;
    let data = await auditController.getBqcReport(uic, trayId);
    if (data.status === 1) {
      res.status(200).json({
        data: data.data,
      });
    } else if (data.status === 2) {
      res.status(202).json({
        message: "UIC does not exists",
      });
    } else if (data.status === 3) {
      res.status(202).json({
        message: "BQC report not created yet",
      });
    } else if (data.status === 4) {
      res.status(202).json({
        message: "Item not present in the tray",
      });
    } else if (data.status === 5) {
      res.status(202).json({
        message: "Item Already Added",
      });
    }
  } catch (error) {
    next(error);
  }
});

/*---------------------------TRAY SEGRIGATION-------------------------------------*/
router.post("/traySegrigation", async (req, res, next) => {
  try {
    const { type, stage } = req.body;
    let data = await auditController.traySegrigation(req.body);
    if (data.status == 1) {
      if (stage == "BQC Not Done") {
        res.status(200).json({
          message: `BQC was not done for this UIC, leave it in the WHT Tray`,
        });
      } else if (stage == "Accept") {
        res.status(200).json({
          message: `UIC is accepted with no Grade Change. Please put it in Tray ${data.trayId}`,
        });
      }
      else if (stage == "Direct Downgrade" || stage == "Direct Upgrade") {
        res.status(200).json({
          message: `UIC is ${stage} with Grade Change. Please put it in Tray ${data.trayId}`,
        });
      }
       else if (stage == "Upgrade") {
        res.status(200).json({
          message: `UIC Planned for an Upgrade, leave it in the WHT Tray`,
        });
      } else if (stage == "Downgrade") {
        res.status(200).json({
          message: `UIC Flagged for a Downgrade, leave it in the WHT Tray`,
        });
      } else if (stage == "Repair") {
        res.status(200).json({
          message: `UIC Flagged for Repairs, leave it in the WHT Tray`,
        });
      }
    } else if (data.status == 2) {
      res.status(202).json({
        message: "Tray is full",
        status: 2,
        trayId: data.trayId,
      });
    } else if (data.status == 4) {
      res.status(202).json({
        message: `No Assigned ${type} tray `,
        status: 3,
        trayId: data.trayId,
      });
    } else if (data.status == 6) {
      res.status(202).json({
        message: `Tray is closed`,
        status: 4,
        trayId: data.trayId,
      });
    } else if (data.status == 7) {
      res.status(202).json({
        message: `Item Already Added`,
        status: 4,
      });
    } else {
      res.status(202).json({
        message: "Failed",
        status: 3,
        trayId: data.trayId,
      });
    }
  } catch (error) {
    next(error);
  }
});

/*-----------------------------------OTHER TRAY CLOSE-------------------------------------*/

router.post("/trayClose/:trayId", async (req, res, next) => {
  try {
    const { trayId } = req.params;
    let data = await auditController.trayClose(trayId);
    if (data) {
      res.status(200).json({
        message: "Tray Successfully Closed",
      });
    } else {
      res.status(202).json({
        message: "Failed tray again.",
      });
    }
  } catch (error) {
    next(error);
  }
});
module.exports = router;
