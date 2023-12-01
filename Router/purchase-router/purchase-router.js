/*------------------------------EXPRESS------------------------------------*/
const express = require("express");
const router = express.Router();
const purchaseController = require("../../Controller/purchase-controller/purchase-controller");

/*-----------------------------ROUTERS------------------------------------*/

// DASBOARD
router.post("/dashboard/:location", async (req, res, next) => {
  try {
    const { location } = req.params;
    let data = await purchaseController.dashboardData(location);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});

// PROCUREMENT VIEW
router.post("/procurment/view/:status", async (req, res, next) => {
  try {
    const { status } = req.params;
    let data = await purchaseController.procurementRequestView(status);
    if (data) {
      res.status(200).json({
        data: data,
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
// ORDER SUMMARY
router.post("/procurementOrderSummary", async (req, res, next) => {
  try {
    const { status } = req.params;
    let data = await purchaseController.getProcurementOrderSummary();
    if (data) {
      res.status(200).json({
        data: data.data,
        totalAmount: data.totalAmount,
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
// PLACE ORDER PAGE
router.post("/placeOrderScreen/:spnNumber/:muic", async (req, res, next) => {
  try {
    let { spnNumber, muic } = req.params;
    let data = await purchaseController.placeOrderScreenDataFetch(
      spnNumber,
      muic
    );
    if (data.status == 1) {
      res.status(200).json({
        data: data.pageData,
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
// PLACE ORDER
router.post("/placeOrder", async (req, res, next) => {
  try {
    let data = await purchaseController.placeOrder(req.body);
    if (data.status == 1) {
      res.status(200).json({
        message: "successfully order placed",
      });
    } else {
      res.status(202).json({
        message: "Failed please try again..",
      });
    }
  } catch (error) {
    next(error);
  }
});
router.post("/placeOrderDateFilter", async (req, res, next) => {
  try {
    const { toDate, fromDate, type, vendors } = req.body;
    let data = await purchaseController.placeOrderDateFilter(
      fromDate,
      toDate,
      type,
      vendors
    );
    if (data) {
      res.status(200).json({
        data: data.filterData,
        totalPrice: data.totalAmount,
      });
    }
  } catch (error) {
    next(error);
  }
});
// GET WARRANTY TERMS AND PAYMENTS TERMS
router.post("/getWarrantyAndTerms", async (req, res, next) => {
  try {
    let data = await purchaseController.fetchWarrantyAndTerms(req.body);
    if (data) {
      res.status(200).json({
        data: data,
      });
    } else {
      res.status(202).json({
        message: "Failed please try again..",
      });
    }
  } catch (error) {
    next(error);
  }
});
// GET VENDOR FOR FILTER
router.post("/vendorMasterforDrp/view", async (req, res, next) => {
  try {
    const { toDate, fromDate } = req.body;
    const vendorData = await purchaseController.getVendorsForDrop(
      fromDate,
      toDate
    );
    if (vendorData) {
      res.status(200).json({
        data: vendorData,
      });
    }
  } catch (error) {
    next(error);
  }
});
/*-------------------------------------PURCHASE TOOLS AND CONSUMABLES------------------------------------------------------*/
router.post(
  "/procurmentToolsAndConsumables/view/:status",
  async (req, res, next) => {
    try {
      const { status } = req.params;
      let data =
        await purchaseController.procurementToolsAndConsumablesRequestView(
          status
        );
      if (data) {
        res.status(200).json({
          data: data,
        });
      } else {
        res.status(202).json({
          message: "Failed please try again...",
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

// PLACE ORDER PAGE
router.post(
  "/placeOrderScreenToolsAndConsumables/:requestId",
  async (req, res, next) => {
    try {
      let { requestId } = req.params;
      let data = await purchaseController.placeOrderScreenDataFetchToolsAndConsuamables(requestId);
      if (data.status == 1) {
        res.status(200).json({
          data: data.pageData,
        });
      } else {
        res.status(202).json({
          message: "No data found",
        });
      }
    } catch (error) {
      next(error);
    }
  }
);
// PLACE ORDER TOOL AND CONSUMABLES
router.post("/placeOrder", async (req, res, next) => {
  try {
    let data = await purchaseController.placeOrderToolsAndConsumables(req.body);
    if (data.status == 1) {
      res.status(200).json({
        message: "successfully order placed",
      });
    } else {
      res.status(202).json({
        message: "Failed please try again..",
      });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
