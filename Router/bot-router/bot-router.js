const express = require("express");
const router = express.Router();
// user controller
const botController = require("../../Controller/bot-controller/bot-controller");
// Multer
const upload = require("../../utils/multer");
/**********************************************BOT BAG*********************************************** */
/* Get Assigned Bag */
router.post("/getAssignedBag/:userName", async (req, res, next) => {
  try {
    let data = await botController.getAssignedBag(req.params.userName);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
/* Get Bag Items */
router.post("/getAssignedBagItems", async (req, res, next) => {
  try {
    let data = await botController.getAssignedBagData(req.body);
    if (data.status == 1) {
      res.status(200).json({
        data: data.data,
        message: "Successfully Get All Data",
      });
    } else {
      res.status(201).json({
        data: data,
        message: "Bag is Empty",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* CLOSE BOT BAG */
router.post("/closeBag", async (req, res, next) => {
  try {
    let data = await botController.closeBags(req.body);
    if (data) {
      res.status(200).json({
        message: "Successfully Closed",
      });
    } else {
      res.status(202).json({
        message: "Please try again",
      });
    }
  } catch (error) {
    next(error);
  }
});
/*****************************************AWBN NUMBER SCANNING***************************************** */
router.post("/awbnScanning", async (req, res, next) => {
  try {
    const { bagId, awbn_number, username } = req.body;
    let data = await botController.scanAwbn(bagId, awbn_number, username);
    if (data.status == 1) {
      res.status(200).json({
        data: data.data,
        message: "Valid AWBN Number",
      });
    } else if (data.status == 0) {
      res.status(202).json({
        message: "Already Added",
      });
    } else if (data.status == 3) {
      res.status(202).json({
        message: "AWBN Number Dose Not Exist",
      });
    } else if (data.status == 4) {
      res.status(202).json({
        message: "Item Dose Not Exist In The Bag",
      });
    }
  } catch (error) {
    next(error);
  }
});
/***********************************************************************************************/
/* TRAY SEGGREGATION */
router.post("/traySegregation", async (req, res, next) => {
  try {
    let data = await botController.traySegrigation(req.body);
    if (data.status == 1) {
      res.status(200).json({
        message: "Successfully Added",
      });
    } else if (data.status == 3) {
      res.status(202).json({
        message: "Already Added",
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
/* Remove Tray Itme */
router.put("/trayItemRemove", async (req, res, next) => {
  try {
    let data = await botController.deleteTrayItem(req.body);
    if (data) {
      res.status(200).json({
        message: "Successfully Removed",
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
/* TRAY CLOSE */
router.post("/trayClose/:trayId", async (req, res, next) => {
  try {
    let data = await botController.trayClose(req.params.trayId);
    if (data.status == 1) {
      res.status(200).json({
        message: "Successfully Closed",
      });
    } else if (data.status == 2) {
      res.status(202).json({
        message: "Tray Already Closed",
      });
    } else if (data.status == 3) {
      res.status(202).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* ASSIGNED TRAY */
router.post("/assignedTray/:username", async (req, res, next) => {
  try {
    let data = await botController.getTray(req.params.username);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
/*VIEW TRAY ITME */
router.post("/trayItem/:trayid", async (req, res, next) => {
  try {
    let data = await botController.getTrayItmes(req.params.trayid);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
module.exports = router;
