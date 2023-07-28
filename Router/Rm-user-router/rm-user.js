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
      console.log(data);
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
    console.log(req.body);
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
    const { partId, trayId } = req.params;
    let data = await rmuserController.spTrayAddParts(partId, trayId);
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
    console.log(req.body);
    const { trayId, rackId } = req.body;
    let data = await rmuserController.spTrayClose(trayId, rackId);
    console.log(data);
    if (data.status == 1) {
      res.status(200).json({
        message: "Successfully Closed & Ready to RDL-Repair",
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
// GET READY TO RDL-REPAIR TRAY SP
router.post("/spTray/readyToRdlRepair/:user_name", async (req, res, next) => {
  try {
    const { user_name } = req.params;
    let data = await rmuserController.getSpTrayForRdlRepair(user_name);
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
    console.log(req.body);
    const { partDetails, spTrayId, boxName,uniqueid,objId } = req.body;
    let data = await rmuserController.partAddIntoBox(
      partDetails,
      spTrayId,
      boxName,
      uniqueid,
      objId
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
    const { spTrayId } = req.body;
    let data = await rmuserController.rdlTwoDoneCloseSpTray(spTrayId);
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
    const {partId}=req.params
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
module.exports = router;
