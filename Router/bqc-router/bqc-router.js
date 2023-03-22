/* Express */
const express = require("express");
const router = express.Router();
// user controller
const bqcController = require("../../Controller/bqc-controller/bqc-controller");
/****************************************************************************************** */
/* GET ALL ASSIGNED TRAY */
router.post("/assigned-tray/:userName", async (req, res, next) => {
  try {
    let data = await bqcController.getAssignedTray(req.params.userName);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});

/* BQC DASHBOARD */
router.post("/dashboard/:username", async (req, res, next) => {
  try {
    const { username } = req.params;
    let data = await bqcController.dashboardCount(username);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});

/* UIC CHECKING */
router.post("/bqc-uic-checking-first-time", async (req, res, next) => {
  try {
    const { uic, trayId } = req.body;
    let data = await bqcController.checkUicFirst(uic, trayId);
    if (data.status == 1) {
      res.status(202).json({
        message: "UIC Does Not Exists",
      });
    } else if (data.status == 2) {
      res.status(202).json({
        message: "UIC Not Exists In This Tray",
      });
    } else if (data.status == 3) {
      res.status(202).json({
        message: "Already Added",
      });
    } else if (data.status == 4) {
      res.status(200).json({
        message: "Valid UIC",
        data: data.data,
      });
    }
  } catch (error) {
    next(error);
  }
});
/* ADD DEVICE IN AND DEVICE NOT IN */
router.post("/add-wht-item", async (req, res, next) => {
  try {
    let data = await bqcController.addWhtitem(req.body);
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
/* AFTER BQC UIC CHECKING */
router.post("/bqc-done-uic-check", async (req, res, next) => {
  try {
    const { uic, trayId } = req.body;
    let data = await bqcController.uicCheckBqcDone(uic, trayId);
    if (data.status == 1) {
      res.status(202).json({
        message: "UIC Does Not Exists",
      });
    } else if (data.status == 2) {
      res.status(202).json({
        message: "Please scan Device in item",
      });
    } else if (data.status == 3) {
      res.status(202).json({
        message: "Already Added",
      });
    } else if (data.status == 4) {
      res.status(200).json({
        message: "Valid UIC",
        data: data.data,
      });
    }
  } catch (error) {
    next(error);
  }
});
/*************************************GET WHT TRAY ITEM******************************************** */
router.post(
  "/assigned-wht-item/:trayId/:username/:status/:page",
  async (req, res, next) => {
    try {
      const { trayId, username, status, page } = req.params;
      let data = await bqcController.getWhtTrayitem(
        trayId,
        username,
        status,
        page
      );

      if (data.status === 1) {
        res.status(200).json({
          data: data.data,
        });
      } else if (data.status === 2) {
        res.status(202).json({
          message: "You can't access this data",
        });
      } else if (data.status === 3) {
        res.status(202).json({
          message: "Details not found",
        });
      } else if (data.status === 5) {
        res.status(202).json({
          message: "Please category the item",
        });
      } else {
        res.status(202).json({
          message: `${trayId} - present at ${data.data.sort_id}`,
        });
      }
    } catch (error) {
      next(error);
    }
  }
);
/* TRAY BQC IN  */
router.post("/bqc-in", async (req, res, next) => {
  try {
    let data = await bqcController.bqcIn(req.body);
    if (data) {
      res.status(200).json({
        message: "Successfully BQC IN",
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
/* BQC DONE */
router.post("/bqc-done", async (req, res, next) => {
  try {
    let data = await bqcController.bqcOut(req.body);
    if (data) {
      res.status(200).json({
        message: "Successfully Send to Warehouse",
      });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
