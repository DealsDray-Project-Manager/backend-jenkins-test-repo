/*------------------------------EXPRESS------------------------------------*/
const express = require("express");
const router = express.Router();
const reportingAgentRouter = require("../../Controller/reporting-controller/reporting");
/*-----------------------------ROUTERS------------------------------------*/
// UNITS BASED FILTER
router.post("/units/:location/:page/:size", async (req, res, next) => {
  try {
    let { location, page, size } = req.params;
    page++;
    const limit = parseInt(size);
    const skip = (page - 1) * size;
    const unitsData = await reportingAgentRouter.getUnitsCond(
      location,
      limit,
      skip
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
module.exports = router;
