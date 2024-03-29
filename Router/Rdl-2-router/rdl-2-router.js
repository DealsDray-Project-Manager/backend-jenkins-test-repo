/*----------------------------------------------*/
//EXPRESS
const express = require("express");
//ROUTER
const router = express.Router();
//CONTROLER
const Rdl2Controller = require("../../Controller/rdl-2-controller/Rdl-2-controller");
/*-----------------------------------------------*/

/* DASHBOARD CHARGING */
router.post("/dashboard/:username", async (req, res, next) => {
  try {
    const { username } = req.params;
    let data = await Rdl2Controller.dashboardCount(username);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
router.post("/assigned-tray/:userName", async (req, res, next) => {
  try {
    let data = await Rdl2Controller.getAssignedTray(req.params.userName);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
// GET ONE TRAY 
router.post("/getOneTrayForProcess/:trayId/:location/:username", async (req, res, next) => {
  try {
    const {trayId,location,username}=req.params
    let data = await Rdl2Controller.getOneTrayForRepairStart(trayId,location,username);
    if (data) {
      res.status(200).json({
        data: data?.trayData,
      });
    }
    else if(data?.status === 2){
      res.status(202).json({
        message:"Invalid Tray Id",
      });
    }
    else{
      res.status(202).json({
        message:"You can't access this data",
      });
    }
  } catch (error) {
    next(error);
  }
});
// RECEIVE SP TRAY
router.post("/recieved-sp-tray", async (req, res, next) => {
  try {
    let data = await Rdl2Controller.receiveSpTray(req.body);
    if (data.status == 1) {
      res.status(200).json({
        message: "Successfully Received",
      });
    } else if (data.status == 3) {
      res.status(202).json({
        message: "Please Enter Valid Count",
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

// RECEIVE RP TRAY
router.post("/recieved-sp-tray/:trayId", async (req, res, next) => {
  try {
    const { trayId } = req.params;
    let data = await Rdl2Controller.receiveRpTray(trayId);
    if (data.status == 1) {
      res.status(200).json({
        message: "Successfully Received",
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

// UIC SACN FOR DETAILS
router.post("/uicScan/:uic/:trayId", async (req, res, next) => {
  try {
    const { uic, trayId } = req.params;
    let data = await Rdl2Controller.getDataOfUic(uic, trayId);
    if (data.status === 1) {
      res.status(200).json({
        data: data.data,
      });
    } else if (data.status === 2) {
      res.status(202).json({
        message: "UIC does not exists",
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
// REPAIR DONE ACTION PAGE
router.post("/repairDone/action", async (req, res, next) => {
  try {
    let data = await Rdl2Controller.repairDoneAction(req.body);
    if (data.status === 1) {
      res.status(200).json({
        message: "Successfully submited",
      });
    } else if (data.status === 3) {
      res.status(202).json({
        message: "Already added",
      });
    } else if (data.status === 5) {
      res.status(202).json({
        message: "You can't access this data",
      });
    } else {
      res.status(202).json({
        message: "Submission failed",
      });
    }
  } catch (error) {
    next(error);
  }
});

// REPAIR DONE CLOSE THE TRAY
router.post("/traySummary", async (req, res, next) => {
  try {
    const { trayId, user_name } = req.body;
    let data = await Rdl2Controller.traySummary(trayId, user_name);

    if (data.status === 1) {
      res.status(200).json({
        data: data.tray,
        summary: data.summary,
      });
    } else if (data.status === 2) {
      res.status(202).json({
        message: "Sorry you can't access this data",
      });
    } else {
      res.status(202).json({
        message: "Tray not found",
      });
    }
  } catch (error) {
    next(error);
  }
});

//CLOSE SP TRAY AND RP TRAY
router.post("/closeSpAndRp", async (req, res, next) => {
  try {
    let data = await Rdl2Controller.closeSpAndRp(req.body);
    if (data.status === 1) {
      res.status(200).json({
        message: "Successfully sent to warehouse",
      });
    } else if (data.status === 5) {
      res.status(202).json({
        message: "Failed please tray again",
      });
    } else {
      res.status(202).json({
        message: "Already closed",
      });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
