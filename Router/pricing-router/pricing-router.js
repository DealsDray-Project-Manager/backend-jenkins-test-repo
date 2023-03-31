const express = require("express");
const router = express.Router();
// user controller
const RDL_0neController = require("../../Controller/RDL_one-controller/RDL_one-controller");
/*******************************************************************************************************************/
/***************************TRAY***************************************************** */
/* GET ASSIGNED TRAY */

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

/************************************************************************************************************** */
module.exports = router;
