/*----------------------------------------------*/
//EXPRESS
const express = require("express");
//ROUTER
const router = express.Router();
//CONTROLER
const SpMisController = require("../../Controller/sp-mis/sp-mis-controller");
/*-----------------------------------------------*/


//DASHBOARD
router.post("/dashboard/:location", async (req, res, next) => {
  try {
    const { location } = req.params;
    let data = await SpMisController.dashboardData(location);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
/*------------------------------------PROCUREMENT CREATION---------------------------------------------*/

router.post("/procurment/creation", async (req, res, next) => {
  try {
    const { location, brand, model } = req.body;
    let data = await SpMisController.procureMentCreation(
      location,
      brand,
      model
    );
    if (data.status == 1) {
      res.status(200).json({
        data: data.findItem,
      });
    } else {
      res.status(202).json({
        message: "No data found",
      });
    }
  } catch (error) {
    next(error);
  }
});
// CREATE PROCUREMENT REQUEST
router.post("/procurment/request", async (req, res, next) => {
  try {
    const { spList, brand, model } = req.body;
    let data = await SpMisController.ProcurementRequestCreation(
      spList,
      model,
      brand
    );
    if (data.status == 1) {
      res.status(200).json({
        message: "Successfully created",
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
// ---


module.exports = router;
