/*------------------------------EXPRESS------------------------------------*/
const express = require("express");
const router = express.Router();
const rmuserController = require("../../Controller/rm-controller/rm-controller");
/*-----------------------------ROUTERS------------------------------------*/
//DASHBOARD
router.post("/dashboard/:location", async (req, res, next) => {
  try {
    const { location } = req.params;
    let data = await rmuserController.dashboardData(location);
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
