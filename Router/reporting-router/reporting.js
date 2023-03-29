/*------------------------------EXPRESS------------------------------------*/
const express = require("express");
const router = express.Router();
const reportingAgentRouter = require("../../Controller/reporting-controller/reporting");
/*-----------------------------ROUTERS------------------------------------*/
//DASHBOARD 
router.post("/dashboard/:location", async (req, res, next) => {
    try {
      const { location } = req.params;
      let data = await reportingAgentRouter.dashboardData(location);
      if (data) {
        res.status(200).json({
          data: data,
        });
      }
    } catch (error) {
      next(error);
    }
  });
// UNITS BASED FILTER
router.post("/units/:location/:page/:size/:screen", async (req, res, next) => {
  try {
    let { location, page, size,screen } = req.params;
    page++;
    const limit = parseInt(size);
    const skip = (page - 1) * size;
    const unitsData = await reportingAgentRouter.getUnitsCond(
      location,
      limit,
      skip,
      screen
    );
    if (unitsData) {
      res.status(200).json({
        data: unitsData.units,
        count:unitsData.forCount
      });
    }
  } catch (error) {
    next(error);
  }
});
//GET CLOSED STATE BAG
router.post("/bag/closed/:location",async(req,res,next)=>{
  try {
    const {location}=req.params
    const bag=await reportingAgentRouter.closedBag(location)
    if(bag){
      res.status(200).json({
        data:bag
      })
    }
  } catch (error) {
    next(error)
  }
})
module.exports = router;
