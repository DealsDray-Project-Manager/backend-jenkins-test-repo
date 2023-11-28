/*----------------------------------------EXPRESS--------------------------------------------------*/
const express = require("express");
// ROUTER
const router = express.Router();
// CONTROLLER
const rpAuditController = require("../../Controller/rp-audit-controller/rp-aduit-controller");

/*--------------------------------------------------------------------------------------------------*/
// DASHBOARD
router.post("/dashboard/:username", async (req, res, next) => {
  try {
    const { username } = req.params;
    const data = await rpAuditController.dashboard(username);
    console.log(data);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
// VIEW ISSUED TRAY
router.post("/issuedTrays/:username", async (req, res, next) => {
  try {
    const { username } = req.params;
    const data = await rpAuditController.getIssuedTrays(username);
    console.log(data);
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
