const express = require("express");
const router = express.Router();
// user controller
const PricingAgentController = require("../../Controller/pricing-controller/pricing-controller");
/*******************************************************************************************************************/
/***************************TRAY***************************************************** */
/* GET ASSIGNED TRAY */

/* DASHBOARD PRICING */
router.post("/dashboard/:location", async (req, res, next) => {
  try {
    const { location } = req.params;
    let data = await PricingAgentController.dashboardCount(location);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
/*------------------------------------PRICING -----------------------------------------------*/
// BASIS OF SUB MUIC
router.post("/readyForPricing/:location", async (req, res, next) => {
  try {
    const { location } = req.params;
    let data = await PricingAgentController.readyForPricingScreen(location);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
// BASIS OF MUIC
router.post("/readyForPricingMuicBasis/:location", async (req, res, next) => {
  try {
    const { location } = req.params;
    let data = await PricingAgentController.readyForPricingBasisMuicScreen(
      location
    );
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
/*--------------------------------ADD PRICING-------------------------------------------------*/
// SUB MUIC BASIS PRICING
router.post("/addPrice", async (req, res, next) => {
  try {
    const { muicDetails, location, screen } = req.body;
    let data = await PricingAgentController.addPrice(
      muicDetails,
      location,
      screen
    );
    if (data.status == true) {
      res.status(200).json({
        message: "Price sucessfully updated",
      });
    } else {
      res.status(202).json({
        message: "Updation failed please try again....",
      });
    }
  } catch (error) {
    next(error);
  }
});
// MUIC BASIS ADD PRICE
router.post("/addPriceMuicBasis", async (req, res, next) => {
  try {
    const { muicDetails, location, screen } = req.body;
    let data = await PricingAgentController.addPriceMuicBasis(
      muicDetails,
      location,
      screen
    );
    if (data.status == true) {
      res.status(200).json({
        message: "Price sucessfully updated",
      });
    } else {
      res.status(202).json({
        message: "Updation failed please try again....",
      });
    }
  } catch (error) {
    next(error);
  }
});
/************************************************************************************************************** */
module.exports = router;
