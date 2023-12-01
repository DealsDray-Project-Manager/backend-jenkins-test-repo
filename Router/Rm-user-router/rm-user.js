/*------------------------------EXPRESS------------------------------------*/
const express = require("express");
const router = express.Router();
const rmuserController = require("../../Controller/rm-controller/rm-controller");
/*-----------------------------ROUTERS------------------------------------*/
//DASHBOARD
router.post("/dashboard/:location/:username", async (req, res, next) => {
  try {
    const { location, username } = req.params;
    let data = await rmuserController.dashboardData(location, username);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});

/*------------------------------------------PARTS AND SP TRAY ISSUE ---------------------------------*/
// SP TRAY REQUEST FOR PARTS ISSUE REQUEST
router.post("/spTray/:user_name", async (req, res, next) => {
  try {
    const { user_name } = req.params;
    let data = await rmuserController.getSpTrayForPartissue(user_name);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
// PARTS ISSUE PAGE
router.post("/spTrayPartIssue", async (req, res, next) => {
  try {
    const { trayId, username, status } = req.body;
    let data = await rmuserController.spTrayPartIssuePage(
      trayId,
      username,
      status
    );

    if (data.status == 2) {
      res.status(200).json({
        data: data.tray,
      });
    } else if (data.status == 1) {
      res.status(202).json({
        message: "Sorry you can't access",
      });
    } else {
      res.status(202).json({
        message: "tray not found",
      });
    }
  } catch (error) {
    next(error);
  }
});
// ADD THE PARTS
router.post("/spTray/addParts/:partId/:trayId", async (req, res, next) => {
  try {
    const { partId, trayId, boxId } = req.params;
    let data = await rmuserController.spTrayAddParts(partId, trayId, boxId);
    if (data.status == 1) {
      res.status(200).json({
        message: "Successfully added",
      });
    } else {
      res.status(202).json({
        message: "Failed please try again...",
      });
    }
  } catch (error) {
    next(error);
  }
});
// CLOSE THE SP TRAY
router.post("/spTrayClose", async (req, res, next) => {
  try {
    const { trayId, rackId } = req.body;
    let data = await rmuserController.spTrayClose(trayId, rackId);

    if (data.status == 1) {
      res.status(200).json({
        message: "Successfully Closed & Ready to RDL-2",
      });
    } else {
      res.status(202).json({
        message: "Failed please try again...",
      });
    }
  } catch (error) {
    next(error);
  }
});
// GET READY TO RDL-2 TRAY SP
router.post("/spTray/readyToRdlRepair/:user_name", async (req, res, next) => {
  try {
    const { user_name } = req.params;
    let data = await rmuserController.getSpTrayForRdlRepair(user_name);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
/*------------------------------------------------------SP TRAY ---------------------------------------------*/
router.post("/spTrayReturnFromRdlTwo/:location", async (req, res, next) => {
  try {
    const { location } = req.params;
    let data = await rmuserController.getSpTrayAfterRdlTwo(location);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
/*------------------------------------------------------SP TRAY ---------------------------------------------*/
router.post("/addIntoBox", async (req, res, next) => {
  try {
    const { partDetails, spTrayId, boxName, uniqueid, objId, username } =
      req.body;
    let data = await rmuserController.partAddIntoBox(
      partDetails,
      spTrayId,
      boxName,
      uniqueid,
      objId,
      username
    );
    if (data.status == 1) {
      res.status(200).json({
        message: "Successfully added",
      });
    } else {
      res.status(202).json({
        message: "Failed please try again",
      });
    }
  } catch (error) {
    next(error);
  }
});
/*----------------------------------CLOSED SP TRAY-----------------------------------------------------*/
router.post("/rdlTwoDoneCloseSP", async (req, res, next) => {
  try {
    const { spTrayId, actionUser } = req.body;
    let data = await rmuserController.rdlTwoDoneCloseSpTray(
      spTrayId,
      actionUser
    );
    if (data.status == 1) {
      res.status(200).json({
        message: "Successfully Closed",
      });
    } else {
      res.status(202).json({
        message: "Failed please try again",
      });
    }
  } catch (error) {
    next(error);
  }
});
/*----------------------------------GET BOX ID ------------------------------------------------------------*/
// GET ALL THE boxes
router.post("/boxesView/:partId", async (req, res, next) => {
  try {
    const { partId } = req.params;
    const boxesData = await rmuserController.getBoxData(partId);
    if (boxesData.status == 1) {
      res.status(200).json({
        data: boxesData.boxData,
      });
    } else {
      res.status(200).json({
        message: "Part data not found",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* ---------------------------------TOOLS AND CONSUMABLES--------------------------------------------*/
router.post("/getRequestOfToolsAndConsumables/:type", async (req, res, next) => {
  try {
    const {type}=req.params
    const data = await rmuserController.getRequestsOfToolsAndConsumablesIssue(type);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
// GET ONLY ONE REQUEST
router.post(
  "/getOneRequestOfToolsAndConsumables/:requestId/:type",
  async (req, res, next) => {
    try {
      const { requestId,type } = req.params;
      const data = await rmuserController.getOneRequestOfToolsAndConsumables(
        requestId,
        type
      );
      if (data.status === 1) {
        res.status(200).json({
          data: data.requestData,
        });
      } else if (data.status === 2) {
        res.status(202).json({
          message: "Sorry you can't access this data",
        });
      } else if (data.status === 3) {
        res.status(202).json({
          message: "Sorry no records",
        });
      } else {
        res.status(202).json({
          message: "Error please try again!",
        });
      }
    } catch (error) {
      next(error);
    }
  }
);
// TOOLS AND CONSUMABLES REQUEST APPROVE
router.post("/requestApproveForToolsAndConsumables", async (req, res, next) => {
  try {
    const data =
      await rmuserController.approveRequestForToolsAndConsumablesIssue(
        req.body
      );
    if (data.status === 1) {
      res.status(200).json({
        message: "Successfully Issued",
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
module.exports = router;
