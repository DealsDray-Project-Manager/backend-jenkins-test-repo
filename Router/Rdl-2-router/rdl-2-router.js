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
module.exports = router;
