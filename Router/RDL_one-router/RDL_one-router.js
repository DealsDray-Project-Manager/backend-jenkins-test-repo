const express = require("express");
const router = express.Router();
// user controller
const RDL_0neController = require("../../Controller/RDL_one-controller/RDL_one-controller");
/**************************************************************************************************************/
/***************************TRAY***************************************************** */
/* GET ASSIGNED TRAY */

router.post("/assigned-tray/:userName", async (req, res, next) => {
  try {
    let data = await RDL_0neController.getAssignedTray(req.params.userName);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});

/* DASHBOARD CHARGING */
router.post("/dashboard/:username", async (req, res, next) => {
  try {
    const { username } = req.params;
    let data = await RDL_0neController.dashboardCount(username);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});

router.post(
  "/request-for-RDL_one/:status/:location",
  async (req, res, next) => {
    try {
      let data = await RDL_0neController.getRDLoneRequest(
        req.params.status,
        req.params.location
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

router.post("/wht-add-actual-item", async (req, res, next) => {
  try {
    let data = await RDL_0neController.addWhtActual(req.body);
    if (data.status == 1) {
      res.status(200).json({
        message: "Successfully Added",
      });
    } else if (data.status == 2) {
      res.status(202).json({
        message: "Failed",
      });
    } else if (data.status == 3) {
      res.status(202).json({
        message: "Item Already Added",
      });
    }
  } catch (error) {
    next(error);
  }
});

router.post("/rdl-1/closeRdlFlsWhtTray", async (req, res, next) => {
  try {
    let data = await RDL_0neController.rdlFlsDoneClose(req.body);
    if (data) {
      res.status(200).json({
        message: "Successfully sent to Warehouse",
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

/*----------------------------------------FETCH MUIC BASED PART LIST FROM MASTER -------------------------------*/
// PART LIST FETCH
router.post("/rdl-1/fetchPart/:muic", async (req, res, next) => {
  try {
    const { muic } = req.params;
    let data = await RDL_0neController.rdlFlsFetchPartList(muic);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
/************************************************************************************************************** */
module.exports = router;
