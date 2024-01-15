/********************************************************************/
const { orders } = require("../../Model/ordersModel/ordersModel");
const { masters } = require("../../Model/mastersModel");
const { delivery } = require("../../Model/deliveryModel/delivery");
const { user } = require("../../Model/userModel");
var mongoose = require("mongoose");
const { products } = require("../../Model/productModel/product");
const moment = require("moment");
const elasticsearch = require("../../Elastic-search/elastic");
const { trayRack } = require("../../Model/tray-rack/tray-rack");
const { unitsActionLog } = require("../../Model/units-log/units-action-log");
const { trayCategory } = require("../../Model/tray-category/tray-category");
const { stxUtility } = require("../../Model/Stx-utility/stx-utility");
const {
  partInventoryLedger,
} = require("../../Model/part-inventory-ledger/part-inventory-ledger");
const { subMuic } = require("../../Model/sub-muic/sub-muic");

/********************************************************************/
/* 


@ DATA FETCH AND EDIT EVERTHING WILL HAPPEN HERE 


*/

module.exports = {
  /*------------------------DASHBOARD FOR WAREHOUSE----------------------------*/
  dashboard: (location, username) => {
    return new Promise(async (resolve, reject) => {
      let count = {
        bagIssueRequest: 0,
        bagCloseRequest: 0,
        issuedPmtAndMMt: 0,
        trayCloseRequest: 0,
        botToRelease: 0,
        whtTray: 0,
        inusetWht: 0,
        chargingRequest: 0,
        inChargingWht: 0,
        returnFromCharging: 0,
        bqcRequest: 0,
        returnFromBqc: 0,
        sortingRequest: 0,
        inSortingWht: 0,
        returnFromSorting: 0,
        mergeRequest: 0,
        returnFromMerge: 0,
        auditRequest: 0,
        otherTrayAuditDone: 0,
        pickupRequest: 0,
        returnFromPickup: 0,
        rdlFlsRequest: 0,
        rdl2Request: 0,
        returnFromRdlFls: 0,
        allCtxTray: 0,
        ctxTransferRequest: 0,
        ctxReceiveRequest: 0,
        allStxtray: 0,
        ctxToStxSortRequest: 0,
        sortingDoneCtxToStx: 0,
        whtToRpSortingRequest: 0,
        returnFromWhtToRpSorting: 0,
        rdlTwoRequests: 0,
        returnFromRdlTwo: 0,
        allRpTray: 0,
        rackChangeStockin: 0,
        rackChangeStockOut: 0,
        displayGradingRequest: 0,
        returnFromDisplayGrading: 0,
        allRpaTray: 0,
        allRpbTray: 0,
        returnFromRpaOrRpb: 0,
        assignedTraysRpaToStx: 0,
        rpaToStxWorkInProgressTrays: 0,
      };
      count.rpaToStxWorkInProgressTrays = await masters.count({
        sort_id: "RPA to STX Work In Progress",
        type_taxanomy: "ST",
        cpc: location,
      });
      count.assignedTraysRpaToStx = await masters.count({
        issued_user_name: username,
        sort_id: "Assigned to Warehouse for Stx Sorting",
        type_taxanomy: "RPA",
        cpc: location,
      });
      count.rackChangeStockin = await masters.count({
        $or: [
          {
            issued_user_name: username,
            sort_id: "Issued to scan in for rack change",
          },
          {
            issued_user_name: username,
            sort_id: "Received for rack change",
          },
        ],
      });
      count.rackChangeStockOut = await masters.count({
        issued_user_name: username,
        sort_id: "Assigned to warehouae for rack change",
        temp_rack: { $ne: null },
      });
      count.displayGradingRequest = await masters.count({
        sort_id: "Assigned for Display Grading",
        cpc: location,
        type_taxanomy: "ST",
      });
      count.returnFromDisplayGrading = await masters.count({
        $or: [
          {
            prefix: "tray-master",
            type_taxanomy: "ST",
            sort_id: "Display Grading Done Closed By Sorting",
            cpc: location,
          },
          {
            prefix: "tray-master",
            type_taxanomy: "ST",
            sort_id: "Received From Sorting After Display Grading",
            cpc: location,
          },
        ],
      });
      count.allRpTray = await masters.count({
        prefix: "tray-master",
        cpc: location,
        type_taxanomy: "RPT",
      });
      count.returnFromRdlTwo = await masters.count({
        $or: [
          {
            type_taxanomy: "RPT",
            cpc: location,
            sort_id: "Closed by RDL-2",
          },
          {
            type_taxanomy: "RPT",
            cpc: location,
            sort_id: "Received from RDL-2",
          },
        ],
      });
      count.rdlTwoRequests = await masters.count({
        prefix: "tray-master",
        type_taxanomy: "RPT",
        sort_id: "Send for RDL-2",
        cpc: location,
      });
      count.returnFromWhtToRpSorting = await masters.count({
        $or: [
          {
            prefix: "tray-master",
            sort_id: "Sorting done (Wht to rp)",
            cpc: location,
          },
          {
            prefix: "tray-master",
            sort_id: "Received from sorting (Wht to rp)",
            cpc: location,
          },
        ],
      });
      count.whtToRpSortingRequest = await masters.count({
        prefix: "tray-master",
        type_taxanomy: "RPT",
        cpc: location,
        sort_id: "Assigned to sorting (Wht to rp)",
      });
      count.bagIssueRequest = await masters.count({
        $or: [
          {
            sort_id: "Requested to Warehouse",
            cpc: location,
          },
          {
            sort_id: "Ready For Issue",
            cpc: location,
          },
        ],
      });
      count.sortingDoneCtxToStx = await masters.count({
        $or: [
          {
            prefix: "tray-master",
            sort_id: "Ctx to Stx Sorting Done",
            cpc: location,
          },
          {
            prefix: "tray-master",
            sort_id: "Received From Sorting Agent After Ctx to Stx",
            cpc: location,
          },
        ],
      });
      count.issuedPmtAndMMt = await masters.count({
        $or: [
          {
            sort_id: "Issued",
            prefix: "tray-master",
            type_taxanomy: "MMT",
            cpc: location,
          },
          {
            sort_id: "Issued",
            prefix: "tray-master",
            type_taxanomy: "PMT",
            cpc: location,
          },
        ],
      });
      count.bagCloseRequest = await masters.count({
        $or: [
          {
            prefix: "tray-master",
            sort_id: "Closed By Bot",
            type_taxanomy: "BOT",
            cpc: location,
          },
          {
            prefix: "tray-master",
            sort_id: "Received From BOT",
            type_taxanomy: "BOT",
            cpc: location,
          },
        ],
      });
      count.trayCloseRequest = await masters.count({
        $or: [
          {
            prefix: "tray-master",
            sort_id: "Closed By Bot",
            type_taxanomy: { $ne: "WHT" },
            type_taxanomy: { $ne: "BOT" },
            cpc: location,
          },
          {
            prefix: "tray-master",
            sort_id: "Received From BOT",
            type_taxanomy: { $ne: "WHT" },
            type_taxanomy: { $ne: "BOT" },
            cpc: location,
          },
        ],
      });
      count.readyForAudit = await masters.count({
        prefix: "tray-master",
        type_taxanomy: "WHT",
        sort_id: "Ready to Audit",
        cpc: location,
      });
      count.allRpaTray = await masters.count({
        prefix: "tray-master",
        type_taxanomy: "RPA",
        cpc: location,
      });
      count.allRpbTray = await masters.count({
        prefix: "tray-master",
        type_taxanomy: "RPB",
        cpc: location,
      });
      count.returnFromRpaOrRpb = await masters.count({
        $or: [
          { cpc: location, sort_id: "Closed by RP-BQC" },
          { cpc: location, sort_id: "Closed by RP-Audit" },
          { cpc: location, sort_id: "Received From RP-Audit" },
          { cpc: location, sort_id: "Received From RP-BQC" },
        ],
      });
      count.ctxToStxSortRequest = await masters.count({
        prefix: "tray-master",
        cpc: location,
        sort_id: "Ctx to Stx Send for Sorting",
        to_merge: { $ne: null },
        type_taxanomy: { $in: ["CT"] },
      });
      count.ctxReceiveRequest = await masters.count({
        $or: [
          {
            prefix: "tray-master",
            type_taxanomy: { $in: ["CT", "RPA"] },
            sort_id: "Accepted from Processing WH",
            cpc: location,
          },
          {
            prefix: "tray-master",
            cpc: location,
            sort_id: "Accepted From Sales WH",
            type_taxanomy: { $in: ["CT", "RPA"] },
          },
          {
            prefix: "tray-master",
            cpc: location,
            sort_id: "Received From Processing",
            type_taxanomy: { $in: ["CT", "RPA"] },
          },
          {
            prefix: "tray-master",
            cpc: location,
            sort_id: "Received From Sales",
            type_taxanomy: { $in: ["CT", "RPA"] },
          },
        ],
      });
      count.ctxTransferRequest = await masters.count({
        prefix: "tray-master",
        sort_id: "Transfer Request sent to Warehouse",
        type_taxanomy: {
          $in: ["CT", "RPA"],
        },
        cpc: location,
      });
      count.pickupRequest = await masters.count({
        prefix: "tray-master",
        type_taxanomy: { $in: ["WHT", "RPT"] },
        sort_id: "Pickup Request sent to Warehouse",
        cpc: location,
        to_tray_for_pickup: { $ne: null },
      });
      count.returnFromPickup = await masters.count({
        $or: [
          {
            cpc: location,
            type_taxanomy: { $in: ["WHT", "RPT"] },
            sort_id: "Pickup Done Closed by Sorting Agent",
          },
          {
            cpc: location,
            type_taxanomy: { $in: ["WHT", "RPT"] },
            sort_id: "Pickup Done Received",
          },
        ],
      });
      count.botToRelease = await masters.count({
        type_taxanomy: "BOT",
        prefix: "tray-master",
        sort_id: "Closed By Sorting Agent",
        cpc: location,
      });
      count.whtTray = await masters.count({
        prefix: "tray-master",
        type_taxanomy: "WHT",
        cpc: location,
      });
      count.inusetWht = await masters.count({
        prefix: "tray-master",
        type_taxanomy: "WHT",
        sort_id: "Inuse",
        cpc: location,
      });
      count.chargingRequest = await masters.count({
        $or: [
          {
            prefix: "tray-master",
            type_taxanomy: "WHT",
            sort_id: "Send for charging",
            cpc: location,
          },
          {
            prefix: "tray-master",
            type_taxanomy: "WHT",
            sort_id: "Send for Recharging",
            cpc: location,
          },
        ],
      });
      count.inChargingWht = await masters.count({
        $or: [
          {
            prefix: "tray-master",
            type_taxanomy: "WHT",
            sort_id: "Issued to Charging",
            cpc: location,
          },
          {
            prefix: "tray-master",
            type_taxanomy: "WHT",
            sort_id: "Charging Station IN",
            cpc: location,
          },
          {
            prefix: "tray-master",
            type_taxanomy: "WHT",
            sort_id: "Issued to Recharging",
            cpc: location,
          },
          {
            prefix: "tray-master",
            type_taxanomy: "WHT",
            sort_id: "Recharging Station IN",
            cpc: location,
          },
        ],
      });
      count.returnFromCharging = await masters.count({
        $or: [
          {
            prefix: "tray-master",
            type_taxanomy: "WHT",
            sort_id: "Charge Done",
            cpc: location,
          },
          {
            prefix: "tray-master",
            type_taxanomy: "WHT",
            sort_id: "Received From Charging",
            cpc: location,
          },
        ],
      });
      count.bqcRequest = await masters.count({
        prefix: "tray-master",
        type_taxanomy: "WHT",
        sort_id: "Send for BQC",
        cpc: location,
      });
      count.allCtxTray = await masters.count({
        prefix: "tray-master",
        cpc: location,
        type_taxanomy: {
          $nin: ["BOT", "PMT", "MMT", "WHT", "ST", "SPT", "RPT"],
        },
      });
      count.allStxtray = await masters.count({
        prefix: "tray-master",
        cpc: location,
        type_taxanomy: "ST",
      });
      count.returnFromBqc = await masters.count({
        $or: [
          {
            prefix: "tray-master",
            type_taxanomy: "WHT",
            sort_id: "BQC Done",
            cpc: location,
          },
          {
            prefix: "tray-master",
            type_taxanomy: "WHT",
            sort_id: "Received From BQC",
            cpc: location,
          },
        ],
      });
      count.sortingRequest = await masters.count({
        $or: [
          {
            sort_id: "Sorting Request Sent To Warehouse",
            cpc: location,
            type_taxanomy: "BOT",
          },
          {
            sort_id: "Assigned to sorting agent",
            cpc: location,
            type_taxanomy: "BOT",
          },
        ],
      });
      count.inSortingWht = await masters.count({
        prefix: "tray-master",
        type_taxanomy: "WHT",
        sort_id: "Issued to sorting agent",
        cpc: location,
      });
      count.rdlFlsRequest = await masters.count({
        prefix: "tray-master",
        type_taxanomy: "WHT",
        sort_id: "Send for RDL-1",
        cpc: location,
      });
      count.rdl2Request = await masters.count({
        prefix: "tray-master",
        type_taxanomy: "WHT",
        sort_id: "Send for RDL-2",
        cpc: location,
      });
      count.returnFromRdlFls = await masters.count({
        $or: [
          {
            prefix: "tray-master",
            type_taxanomy: "WHT",
            sort_id: "Closed by RDL-1",
            cpc: location,
          },
          {
            prefix: "tray-master",
            type_taxanomy: "WHT",
            sort_id: "Received From RDL-1",
            cpc: location,
          },
        ],
      });
      count.returnFromSorting = await masters.count({
        $or: [
          {
            prefix: "tray-master",
            type_taxanomy: "WHT",
            sort_id: "Closed By Sorting Agent",
            cpc: location,
          },
          {
            prefix: "tray-master",
            type_taxanomy: "WHT",
            sort_id: "Received From Sorting",
            cpc: location,
          },
        ],
      });
      count.mergeRequest = await masters.count({
        $or: [
          {
            sort_id: "Merge Request Sent To Wharehouse",
            cpc: location,
            to_merge: { $ne: null },
          },
          {
            sort_id: "Audit Done Merge Request Sent To Wharehouse",
            cpc: location,
            to_merge: { $ne: null },
          },
          {
            sort_id: "Ready to RDL-2 Merge Request Sent To Wharehouse",
            cpc: location,
            to_merge: { $ne: null },
          },
          {
            sort_id: "Ready to BQC Merge Request Sent To Wharehouse",
            cpc: location,
            to_merge: { $ne: null },
          },
          {
            sort_id: "Ready to Audit Merge Request Sent To Wharehouse",
            cpc: location,
            to_merge: { $ne: null },
          },
        ],
      });
      count.auditRequest = await masters.count({
        prefix: "tray-master",
        type_taxanomy: "WHT",
        sort_id: "Send for Audit",
        cpc: location,
      });

      count.otherTrayAuditDone = await masters.count({
        $or: [
          {
            prefix: "tray-master",

            sort_id: "Audit Done",
            cpc: location,
          },
          {
            prefix: "tray-master",

            sort_id: "Received From Audit",
            cpc: location,
          },
        ],
      });
      count.returnFromMerge = await masters.count({
        $or: [
          {
            cpc: location,
            prefix: "tray-master",
            sort_id: "Merging Done",
            items: { $ne: [] },
            type_taxanomy: "MMT",
          },
          {
            cpc: location,
            prefix: "tray-master",
            sort_id: "Merging Done",
            type_taxanomy: { $nin: ["MMT", "WHT"] },
          },
          {
            cpc: location,
            prefix: "tray-master",
            sort_id: "Merging Done",
            type_taxanomy: "WHT",
          },
          {
            cpc: location,
            refix: "tray-master",
            sort_id: "Received From Merging",
            items: { $ne: [] },
          },
          {
            cpc: location,
            refix: "tray-master",
            sort_id: "Received From Merging",
            type_taxanomy: { $nin: ["MMT", "WHT"] },
          },
          {
            cpc: location,
            refix: "tray-master",
            sort_id: "Received From Merging",
            type_taxanomy: "WHT",
          },
          {
            cpc: location,
            refix: "tray-master",
            sort_id: "Audit Done Return from Merging",
          },
          {
            cpc: location,
            refix: "tray-master",
            sort_id: "Audit Done Received From Merging",
          },
          {
            cpc: location,
            refix: "tray-master",
            sort_id: "Ready to RDL-2 Merging Done",
          },
          {
            cpc: location,
            refix: "tray-master",
            sort_id: "Ready to RDL-2 Received From Merging",
          },
          {
            cpc: location,
            refix: "tray-master",
            sort_id: "Ready to BQC Merging Done",
          },
          {
            cpc: location,
            refix: "tray-master",
            sort_id: "Ready to BQC Received From Merging",
          },
          {
            cpc: location,
            refix: "tray-master",
            sort_id: "Ready to Audit Merging Done",
          },
          {
            cpc: location,
            refix: "tray-master",
            sort_id: "Ready to Audit Received From Merging",
          },
        ],
      });
      if (count) {
        resolve(count);
      }
    });
  },
  /*------------------------CHECK BAG ID----------------------------*/

  checkBagId: (bagId, location) => {
    return new Promise(async (resolve, reject) => {
      let bagExist = await masters.findOne({
        prefix: "bag-master",
        code: bagId,
        cpc: location,
      });
      if (bagExist == null) {
        resolve({ status: 1 });
      } else {
        let emptyBag = await masters.findOne({ code: bagId });
        if (
          emptyBag.sort_id != "No Status" &&
          emptyBag.sort_id != "In Progress"
        ) {
          resolve({ status: 2 });
        } else {
          resolve({ status: 0 });
        }
      }
    });
  },

  /*------------------------FIND ONE BAGE----------------------------*/

  getBagOne: (bagId) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        $or: [
          { $and: [{ code: bagId }, { sort_id: "No Status" }] },
          { $and: [{ code: bagId }, { sort_id: "In Progress" }] },
        ],
      });
      if (data.length != 0 && data?.items?.length != 0) {
        resolve(data);
      } else {
        resolve(data);
      }
    });
  },
  /*------------------------FIND ONE BAG or TRAY----------------------------*/

  getBagOneRequest: (masterId, status) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        code: masterId,
      });
      if (data.length !== 0) {
        if (
          data[0].sort_id == status ||
          data[0].sort_id == "Audit Done Received From Merging" ||
          data[0].sort_id == "Ready to RDL-2 Received From Merging" ||
          data[0].sort_id == "Ready to BQC Received From Merging" ||
          data[0].sort_id == "Ready to Audit Received From Merging"
        ) {
          resolve({ data: data, status: 1 });
        } else if (
          status == "Requested to Warehouse" &&
          data[0].sort_id == "Ready For Issue"
        ) {
          resolve({ data: data, status: 1 });
        } else {
          resolve({ status: 3, data: data });
        }
      } else {
        resolve({ status: 2 });
      }
    });
  },

  /*------------------------CHECK BOT USERS STATUS---------------------------*/

  checkBotUserStatus: (username, bagId) => {
    return new Promise(async (resolve, reject) => {
      let data = await user.findOne({ user_name: username, status: "Active" });
      if (data) {
        let bag = await masters.findOne({
          $or: [
            {
              sort_id: "Issued",
              issued_user_name: username,
            },
            {
              prefix: { $ne: "bag-master" },
              sort_id: "Closed By Bot",
              issued_user_name: username,
            },
          ],
        });
        if (bag) {
          resolve({ status: 3 });
        } else {
          resolve({ status: 1 });
        }
      } else {
        resolve({ status: 2 });
      }
    });
  },

  /*------------------------CHECK AWBN NUMBER---------------------------*/

  checkAwbin: (awbn, bagId, location) => {
    return new Promise(async (resolve, reject) => {
      let data = await delivery.findOne({
        tracking_id: { $regex: ".*" + awbn + ".*", $options: "i" },
        partner_shop: location,
      });
      if (data == null) {
        resolve({ status: 1, data: data });
      } else {
        let deliveredOrNot = await orders.findOne({
          order_id: data.order_id,
          delivery_status: "Delivered",
        });
        if (deliveredOrNot) {
          if (deliveredOrNot.delivery_date == null) {
            deliveredOrNot.order_date = data?.delivery_date;
          }
          deliveredOrNot.tracking_id = data.tracking_id;
          let dup = await masters.findOne({
            "items.awbn_number": { $regex: ".*" + awbn + ".*", $options: "i" },
            code: bagId,
          });
          if (dup) {
            resolve({ status: 3, data: deliveredOrNot });
          } else {
            let valid = await masters.findOne({
              $or: [
                {
                  "items.tracking_id": {
                    $regex: ".*" + awbn + ".*",
                    $options: "i",
                  },
                  code: { $ne: bagId },
                },
                {
                  "items.awbn_number": {
                    $regex: ".*" + awbn + ".*",
                    $options: "i",
                  },
                  code: { $ne: bagId },
                },
              ],
            });
            if (valid) {
              resolve({ status: 2, data: deliveredOrNot });
            } else {
              resolve({ status: 0, data: deliveredOrNot });
            }
          }
        } else {
          resolve({ status: 4, data: deliveredOrNot });
        }
      }
    });
  },

  /*------------------------STOCK IN DATA---------------------------*/

  stockInData: (data) => {
    data._id = mongoose.Types.ObjectId();
    return new Promise(async (resolve, reject) => {
      let res = await masters.updateOne(
        {
          code: data.bag_id,
        },
        {
          $push: {
            items: data,
          },
          $set: {
            sort_id: "In Progress",
          },
        }
      );
      if (data.status !== "Duplicate" && data.status !== "Invalid") {
        if (data.order_date !== null && data.order_date !== undefined) {
          let updateDelivery = await delivery.updateOne(
            { tracking_id: data.awbn_number },
            {
              $set: {
                bag_id: data.bag_id,
                stockin_date: Date.now(),
                stock_in_status: data.status,
                updated_at: Date.now(),
                old_item_details: data.old_item_details,
              },
            }
          );
        } else {
          let updateDelivery = await delivery.updateOne(
            { tracking_id: data.awbn_number },
            {
              $set: {
                bag_id: data.bag_id,
                stockin_date: Date.now(),
                stock_in_status: data.status,
                updated_at: Date.now(),
                old_item_details: data.old_item_details,
              },
            }
          );
        }
      }
      if (res) {
        resolve(res);
      } else {
        resolve();
      }
    });
  },

  /*------------------------ADD ACTUAL DATA---------------------------*/

  addActualData: (actualBagItem) => {
    actualBagItem._id = mongoose.Types.ObjectId();
    return new Promise(async (resolve, reject) => {
      let res = await masters.updateOne(
        {
          code: actualBagItem.bag_id,
        },
        {
          $push: {
            actual_items: actualBagItem,
          },
        }
      );
      if (res) {
        resolve(res);
      } else {
        resolve();
      }
    });
  },

  /*------------------------CLOSE BAG---------------------------*/

  closeBag: (bagData) => {
    return new Promise(async (resolve, reject) => {
      // UPDATE BAG
      let data = await masters.findOneAndUpdate(
        { code: bagData.bagId },
        {
          $set: {
            sort_id: bagData.stage,
            uic: bagData.uic,
            sleaves: bagData.sleaves,
            status_change_time: Date.now(),
            wh_added_item_close_fv_1: Date.now(),
          },
        }
      );
      if (data) {
        // UPDATE DELIVERY DATA
        for (let x of data.items) {
          let updateDelivery = await delivery.updateOne(
            { tracking_id: x.awbn_number },
            {
              $set: {
                bag_close_date: Date.now(),
                updated_at: Date.now(),
              },
            }
          );
          // ADD ACTION LOG
          await unitsActionLog
            .create({
              created_at: Date.now(),
              awbn_number: x.awbn_number,
              user_name_of_action: bagData.username,
              action_type: "Bagging",
              user_type: "PRC Warehouse",
              description: `Bagging done by:${bagData.username}`,
              bag_id: bagData.bagId,
            })
            .catch((err) => reject(err));
        }
        resolve(data);
      } else {
        resolve();
      }
    });
  },

  /*------------------------DELETE STOCK IN---------------------------*/

  deleteStockin: (bgData) => {
    bgData.id = mongoose.Types.ObjectId(bgData.id);
    return new Promise(async (resolve, reject) => {
      let data = await masters.updateOne(
        { code: bgData.bagId },
        {
          $pull: {
            items: {
              _id: bgData.id,
            },
          },
        },
        { new: true }
      );
      if (data.modifiedCount != 0 && bgData.state !== "Duplicate") {
        updateDelivery = await delivery.updateOne(
          { tracking_id: bgData.awbn },
          {
            $set: {
              bag_id: "",
              stockin_date: "",
              stock_in_status: "",
            },
          }
        );
      }
      if (data.modifiedCount !== 0) {
        resolve(data);
      }
    });
  },

  /*------------------------REMOVE ACTUAL ITEM---------------------------*/

  removeActualItem: (bgData) => {
    bgData.id = mongoose.Types.ObjectId(bgData.id);
    return new Promise(async (resolve, reject) => {
      let data = await masters.updateOne(
        { code: bgData.bagId },
        {
          $pull: {
            actual_items: {
              _id: bgData.id,
            },
          },
        }
      );
      if (data.modifiedCount != 0) {
        resolve(data);
      } else {
        resolve();
      }
    });
  },
  /*------------------------ISSUE TO BOT---------------------------*/

  issueToBot: (issueData) => {
    return new Promise(async (resolve, reject) => {
      if (issueData.status == "Issued") {
        let data = await masters.findOneAndUpdate(
          { code: issueData.bagId },
          {
            sort_id: issueData.status,
            description: issueData.description,
            assigned_date: Date.now(),
            "track_tray.bag_tray_issue_to_bot": Date.now(),
          }
        );
        if (data) {
          for (let x of data.items) {
            let updateDelivery = await delivery.findOneAndUpdate(
              { tracking_id: x.awbn_number },
              {
                $set: {
                  assign_to_agent: Date.now(),
                  agent_name: data.issued_user_name,
                  updated_at: Date.now(),
                },
              },
              {
                new: true,
                projection: { _id: 0 },
              }
            );
            const addLogsofUnits = await unitsActionLog.create({
              action_type: "Issued to BOT",
              created_at: Date.now(),
              awbn_number: x.awbn_number,
              agent_name: data.issued_user_name,
              user_name_of_action: issueData.username,
              bag_id: issueData.bagId,
              user_type: "PRC Warehouse",
              description: `Issued to bot agent:${data.issued_user_name} by WH : ${issueData.username}`,
            });
          }
          for (let i = 0; i < issueData.try.length; i++) {
            let assignTray = await masters.findOneAndUpdate(
              { code: issueData.try[i] },
              {
                $set: {
                  issued_user_name: data.issued_user_name,
                  sort_id: "Issued",
                  status_change_time: Date.now(),
                  assign: "New Assign",
                  "track_tray.bag_tray_issue_to_bot": Date.now(),
                },
              }
            );
          }
          let newAssing = await masters.updateMany(
            {
              $or: [
                {
                  prefix: "tray-master",
                  issued_user_name: data.issued_user_name,
                  sort_id: "Received",
                },
                {
                  prefix: "tray-master",
                  issued_user_name: data.issued_user_name,
                  sort_id: "Closed",
                },
                {
                  prefix: "tray-master",
                  issued_user_name: data.issued_user_name,
                  sort_id: "Closed By Warehouse",
                },
              ],
            },
            {
              $set: {
                assign: "Old Assign",
              },
            }
          );
          if (newAssing) {
            resolve({ data: data, status: 2 });
          }
        } else {
          resolve({ status: 0 });
        }
      } else {
        let data = await masters.updateOne(
          { code: issueData.bagId },
          {
            sort_id: issueData.status,
            uic: issueData.uic,
            sleaves: issueData.sleaves,
          }
        );
        if (data.modifiedCount !== 0) {
          resolve({ data: data, status: 1 });
        } else {
          resolve({ status: 0 });
        }
      }
    });
  },

  /*------------------------FIND THE ISSUE REQUEST---------------------------*/

  getRequests: (location) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        $or: [
          {
            sort_id: "Requested to Warehouse",
            cpc: location,
          },
          {
            sort_id: "Ready For Issue",
            cpc: location,
          },
        ],
      });
      resolve(data);
    });
  },

  /*------------------------CHECK ACTUAL AWBN---------------------------*/

  checkActualAwbn: (awbn, id) => {
    return new Promise(async (resolve, reject) => {
      let data = await delivery.findOne({
        tracking_id: { $regex: ".*" + awbn + ".*", $options: "i" },
      });
      if (data == null) {
        resolve({ status: 4 });
      } else {
        let delivered = await orders.findOne({
          order_id: data.order_id,
          delivery_status: "Delivered",
        });
        if (delivered == null) {
          resolve({ status: 5 });
        } else {
          if (delivered.order_date == null) {
            delivered.order_date = data?.order_date;
          }
          delivered.tracking_id = data.tracking_id;
          let checkItemThisBag = await masters.findOne({
            code: id,
            "items.awbn_number": { $regex: ".*" + awbn + ".*", $options: "i" },
          });
          if (checkItemThisBag == null) {
            resolve({ status: 3 });
          } else {
            let alreadyAdded = await masters.findOne({
              code: id,
              "actual_items.awbn_number": {
                $regex: ".*" + awbn + ".*",
                $options: "i",
              },
            });
            if (alreadyAdded) {
              resolve({ status: 2 });
            } else {
              resolve({ status: 1, data: delivered });
            }
          }
        }
      }
    });
  },

  /*------------------------CHECK MMT TRAY---------------------------*/

  checkMmtTray: (trayId, location) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.findOne({
        prefix: "tray-master",
        code: trayId,
        cpc: location,
      });
      if (data) {
        let botTray = await masters.findOne({
          type_taxanomy: "MMT",
          prefix: "tray-master",
          code: trayId,
        });
        if (botTray) {
          let assignedOrNot = await masters.findOne({
            type_taxanomy: "MMT",
            code: trayId,
            sort_id: "Open",
          });
          if (assignedOrNot) {
            resolve({ status: 1, id: trayId, tray_status: data.sort_id });
          } else {
            resolve({ status: 2 });
          }
        } else {
          resolve({ status: 4 });
        }
      } else {
        resolve({ status: 3 });
      }
    });
  },
  /*------------------------CHECK PMT TRAY---------------------------*/

  checkPmtTray: (trayId, location) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.findOne({
        prefix: "tray-master",
        code: trayId,
        cpc: location,
      });
      if (data) {
        let botTray = await masters.findOne({
          type_taxanomy: "PMT",
          prefix: "tray-master",
          code: trayId,
        });
        if (botTray) {
          let assignedOrNot = await masters.findOne({
            type_taxanomy: "PMT",
            sort_id: "Open",
            code: trayId,
          });
          if (assignedOrNot) {
            resolve({ status: 1, id: trayId, tray_status: data.sort_id });
          } else {
            resolve({ status: 2 });
          }
        } else {
          resolve({ status: 4 });
        }
      } else {
        resolve({ status: 3 });
      }
    });
  },

  /*------------------------CHECK BOT TRAY---------------------------*/

  checkBotTray: (trayId, location) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.findOne({
        prefix: "tray-master",
        code: trayId,
        cpc: location,
      });
      if (data) {
        let botTray = await masters.findOne({
          type_taxanomy: "BOT",
          prefix: "tray-master",
          code: trayId,
        });
        if (botTray) {
          let assignedOrNot = await masters.findOne({
            type_taxanomy: "BOT",
            code: trayId,
            sort_id: "Open",
          });
          if (assignedOrNot) {
            resolve({ status: 1, id: trayId, tray_status: data.sort_id });
          } else {
            resolve({ status: 2 });
          }
        } else {
          resolve({ status: 4 });
        }
      } else {
        resolve({ status: 3 });
      }
    });
  },

  /*------------------------TRAY CLOSE REQUEST---------------------------*/

  trayCloseRequest: (location) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        $or: [
          {
            prefix: "tray-master",
            sort_id: "Closed By Bot",
            type_taxanomy: { $ne: "WHT" },
            type_taxanomy: { $ne: "BOT" },
            cpc: location,
          },
          {
            prefix: "tray-master",
            sort_id: "Received From BOT",
            type_taxanomy: { $ne: "WHT" },
            type_taxanomy: { $ne: "BOT" },
            cpc: location,
          },
        ],
      });
      if (data) {
        resolve(data);
      }
    });
  },

  /*------------------------FIND INUSE PMT AND MMT TRAY---------------------------*/

  getInuseMmtPmt: (location, type) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        $or: [
          {
            sort_id: type,
            prefix: "tray-master",
            type_taxanomy: "MMT",
            cpc: location,
          },
          {
            sort_id: type,
            prefix: "tray-master",
            type_taxanomy: "PMT",
            cpc: location,
          },
        ],
      });
      resolve(data);
    });
  },

  /*------------------------CLOSED AND RECIEVED TRAY FROM BOT---------------------------*/

  closeBotTrayGet: (location) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        $or: [
          {
            prefix: "tray-master",
            sort_id: "Closed By Bot",
            type_taxanomy: "BOT",
            cpc: location,
          },
          {
            prefix: "tray-master",
            sort_id: "Received From BOT",
            type_taxanomy: "BOT",
            cpc: location,
          },
        ],
      });
      if (data) {
        resolve(data);
      }
    });
  },

  /*------------------------CLOSED AND RECIEVED TRAY FROM BOT---------------------------*/

  trayReceived: (trayData) => {
    return new Promise(async (resolve, reject) => {
      if (trayData.type == "Closed by RDL-2-sp") {
        let data;
        let tray = await masters.findOne({ code: trayData.trayId });
        if (tray.temp_array?.length == trayData.counts) {
          if (tray.sort_id == "Closed by RDL-2") {
            data = await masters.findOneAndUpdate(
              { code: trayData.trayId },
              {
                $set: {
                  sort_id: "Received from RDL-2",
                },
              }
            );
            if (data) {
              await unitsActionLog.create({
                action_type: "Received from RDL-2",
                created_at: Date.now(),
                user_name_of_action: trayData.actioUser,
                user_type: "SP Warehouse",
                agent_name: data.issued_user_name,
                tray_id: trayData.trayId,
                track_tray: "Tray",
                description: `Received from RDL-2 to agent:${data.issued_user_name} by WH :${trayData.actioUser}`,
              });
              resolve({ status: 1 });
            }
          }
        } else {
          resolve({ status: 3 });
        }
      } else if (trayData.type === "charging") {
        let data;
        let tray = await masters.findOne({ code: trayData.trayId });
        if (tray.actual_items?.length == trayData.counts) {
          if (tray.sort_id == "Recharge Done") {
            data = await masters.findOneAndUpdate(
              { code: trayData.trayId },
              {
                $set: {
                  sort_id: "Received From Recharging",
                },
              }
            );
          } else {
            data = await masters.findOneAndUpdate(
              { code: trayData.trayId },
              {
                $set: {
                  sort_id: "Received From Charging",
                },
              }
            );
          }
          if (data) {
            let state = "Tray";
            for (let x of data.actual_items) {
              let unitsLogCreation = await unitsActionLog.create({
                action_type: "Received From Charging",
                created_at: Date.now(),
                user_name_of_action: trayData.actioUser,
                user_type: "PRC Warehouse",
                agent_name: data.issued_user_name,
                uic: x.uic,
                tray_id: trayData.trayId,
                track_tray: state,
                description: `Received From Charging to agent:${data.issued_user_name} by WH :${trayData.actioUser}`,
              });
              state = "Units";
              let deliveryTrack = await delivery.findOneAndUpdate(
                { tracking_id: x.tracking_id },
                {
                  $set: {
                    tray_status: "Received From Charging",
                    tray_location: "Warehouse",
                    charging_done_received: Date.now(),
                    updated_at: Date.now(),
                  },
                },
                {
                  new: true,
                  projection: { _id: 0 },
                }
              );
            }
            resolve({ status: 1 });
          } else {
            resolve({ status: 2 });
          }
        } else {
          resolve({ status: 3 });
        }
      } else if (trayData.type == "Merging Done") {
        let checktray = await masters.findOne({ code: trayData.trayId });
        let stage;
        let data;
        if (checktray?.items?.length == trayData.counts) {
          if (checktray.sort_id == "Audit Done Return from Merging") {
            data = await masters.findOneAndUpdate(
              { code: trayData.trayId },
              {
                $set: {
                  sort_id: "Audit Done Received From Merging",
                },
              }
            );
            stage = "Audit Done Received From Merging";
          } else if (checktray.sort_id == "Ready to Audit Merging Done") {
            data = await masters.findOneAndUpdate(
              { code: trayData.trayId },
              {
                $set: {
                  sort_id: "Ready to Audit Received From Merging",
                },
              }
            );
            stage = "Ready to Audit Received From Merging";
          } else if (checktray.sort_id == "Ready to BQC Merging Done") {
            data = await masters.findOneAndUpdate(
              { code: trayData.trayId },
              {
                $set: {
                  sort_id: "Ready to BQC Received From Merging",
                },
              }
            );
            stage = "Ready to BQC Received From Merging";
          } else if (checktray.sort_id == "Ready to RDL-2 Merging Done") {
            data = await masters.findOneAndUpdate(
              { code: trayData.trayId },
              {
                $set: {
                  sort_id: "Ready to RDL-2 Received From Merging",
                },
              }
            );
            stage = "Ready to RDL-2 Received From Merging";
          } else {
            data = await masters.findOneAndUpdate(
              { code: trayData.trayId },
              {
                $set: {
                  sort_id: "Received From Merging",
                },
              }
            );
            stage = "Received From Merging";
          }
          let state = "Tray";
          let whType = "PRC";
          if (data.type_taxanomy == "ST") {
            whType = "Sales";
          }
          if (data.items.length == 0) {
            await unitsActionLog.create({
              action_type: stage,
              created_at: Date.now(),
              user_name_of_action: trayData.actioUser,
              user_type: `${whType} Warehouse`,
              agent_name: data.issued_user_name,
              tray_id: trayData.trayId,
              track_tray: state,
              description: `${stage} to agent:${data.issued_user_name} by WH :${trayData.actioUser}`,
            });
          }
          for (let x of data.items) {
            let unitsLogCreation = await unitsActionLog.create({
              action_type: stage,
              created_at: Date.now(),
              user_name_of_action: trayData.actioUser,
              user_type: `${whType} Warehouse`,
              agent_name: data.issued_user_name,
              uic: x.uic,
              tray_id: trayData.trayId,
              track_tray: state,
              description: `${stage} to agent:${data.issued_user_name} by WH :${trayData.actioUser}`,
            });
            state = "Units";
            let deliveryTrack = await delivery.findOneAndUpdate(
              { tracking_id: x.awbn_number },
              {
                $set: {
                  tray_status: stage,
                  tray_location: "Warehouse",
                  updated_at: Date.now(),
                },
              },
              {
                new: true,
                projection: { _id: 0 },
              }
            );
          }
          resolve({ status: 1 });
        } else {
          resolve({ status: 3 });
        }
      } else if (trayData.type == "Closed by RDL-2") {
        let checkCount = await masters.findOne({ code: trayData.trayId });
        if (checkCount.items.length == trayData.counts) {
          let data = await masters.findOneAndUpdate(
            { code: trayData.trayId },
            {
              $set: {
                sort_id: "Received from RDL-2",
                "track_tray.tray_received_from_bot": Date.now(),
              },
            }
          );
          if (data) {
            let state = "Tray";
            for (let x of data.items) {
              const addLogsofUnits = await unitsActionLog.create({
                action_type: "Received from RDL-2",
                created_at: Date.now(),
                uic: x.uic,
                tray_id: trayData.trayId,
                agent_name: data.issued_user_name,
                user_name_of_action: trayData.username,
                track_tray: state,
                user_type: "PRC WAREHOUSE",
                description: `Received from RDL-2 to agent:${data.issued_user_name} by WH :${trayData.actioUser}`,
              });
              state = "Units";
              let deliveryTrack = await delivery.findOneAndUpdate(
                { "uic_code.code": x.uic },
                {
                  $set: {
                    tray_status: "Received from RDL-2",
                    tray_location: "Warehouse",
                    received_from_rdl_two: Date.now(),
                    updated_at: Date.now(),
                  },
                },
                {
                  new: true,
                  projection: { _id: 0 },
                }
              );
            }
            resolve({ status: 1 });
          } else {
            resolve({ status: 2 });
          }
        } else {
          resolve({ status: 3 });
        }
      } else {
        let checkCount = await masters.findOne({ code: trayData.trayId });
        if (checkCount.items.length == trayData.count) {
          let data = await masters.findOneAndUpdate(
            { code: trayData.trayId },
            {
              $set: {
                sort_id: "Received From BOT",
                "track_tray.tray_received_from_bot": Date.now(),
              },
            }
          );
          if (data) {
            let state = "Tray";
            for (let x of data.items) {
              const addLogsofUnits = await unitsActionLog.create({
                action_type: "Received From BOT",
                created_at: Date.now(),
                uic: x.uic,
                tray_id: trayData.trayId,
                agent_name: data.issued_user_name,
                user_name_of_action: trayData.username,
                user_type: "PRC Warehouse",
                track_tray: state,
                description: `Received From BOT agent:${data.issued_user_name} WH : ${trayData.username}`,
              });
              let deliveryTrack = await delivery.findOneAndUpdate(
                { tracking_id: x.awbn_number },
                {
                  $set: {
                    tray_status: "Received From BOT",
                    tray_location: "Warehouse",
                    bot_done_received: Date.now(),
                    updated_at: Date.now(),
                  },
                },
                {
                  new: true,
                  projection: { _id: 0 },
                }
              );
              state = "Units";
            }
            resolve({ status: 1 });
          } else {
            resolve({ status: 2 });
          }
        } else {
          resolve({ status: 3 });
        }
      }
    });
  },

  /*------------------------FIND BOT USERS FOR NEW TRAY ASSIGN---------------------------*/

  getBotUsersNewTrayAssing: (location) => {
    return new Promise(async (resolve, reject) => {
      let data = await user
        .find({
          status: "Active",
          user_type: "Bag Opening",
          cpc: location,
        })
        .sort({ user_name: 1 });
      if (data) {
        resolve(data);
      }
    });
  },

  /*------------------------CHECK USER IS FREE OR NOT---------------------------*/

  checkBotUserTray: (username, trayType) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.findOne({
        $or: [
          {
            type_taxanomy: trayType,
            issued_user_name: username,
            sort_id: "Issued",
          },
          {
            type_taxanomy: trayType,
            issued_user_name: username,
            sort_id: "Closed By Bot",
          },
        ],
      });
      if (data) {
        resolve({ status: 0 });
      } else {
        resolve({ status: 1 });
      }
    });
  },

  /*------------------------ASSIGN NEW TRAY TO BOT AGENT---------------------------*/

  assignNewTrayIndv: (trayData) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.updateOne(
        { code: trayData.tray_Id },
        {
          issued_user_name: trayData.user_name,
          sort_id: "Issued",
          status_change_time: Date.now(),
          assign: "New Assign",
        }
      );
      if (data.modifiedCount != 0) {
        resolve(data);
      } else {
        resolve();
      }
    });
  },

  /*-----------------------BOT AND PMT AND MMT TRAY CLOSE AFTER BOT WORK DONE---------------------------*/

  trayClose: (trayData) => {
    return new Promise(async (resolve, reject) => {
      let getTray = await masters.findOne({ code: trayData.trayId });
      let data;
      if (getTray?.items?.length !== 0) {
        data = await masters.findOneAndUpdate(
          { code: trayData.trayId },
          {
            $set: {
              sort_id: "Closed By Warehouse",
              rack_id: trayData.rackId,
              closed_time_wharehouse: Date.now(),
              issued_user_name: null,
              "track_tray.bot_done_tray_close_wh": Date.now(),
            },
          }
        );
      } else {
        data = await masters.findOneAndUpdate(
          { code: trayData.trayId },
          {
            $set: {
              sort_id: "Open",
              track_tray: {},
              closed_time_wharehouse: Date.now(),
              issued_user_name: null,
            },
          }
        );
      }
      if (data) {
        let state = "Tray";
        for (let x of data?.items) {
          let unitsLogCreation = await unitsActionLog.create({
            action_type: "Closed By Warehouse",
            created_at: Date.now(),
            user_name_of_action: trayData.username,
            user_type: "PRC Warehouse",
            uic: x.uic,
            tray_id: trayData.trayId,
            track_tray: state,
            rack_id: trayData.rackId,
            description: `Bot done closed by warehouse agent :${trayData.username}`,
          });
          let deliveryTrack = await delivery.findOneAndUpdate(
            { tracking_id: x.awbn_number },
            {
              $set: {
                warehouse_close_date: Date.now(),
                tray_status: "Closed By Warehouse",
                tray_location: "Warehouse",
                updated_at: Date.now(),
              },
            },
            {
              new: true,
              projection: { _id: 0 },
            }
          );
          state = "Units";
        }
        resolve(data);
      } else {
        resolve();
      }
    });
  },

  /*------------------------CLOSE BOT TRAY AFTER BOT AGENT WORK IS DONE---------------------------*/

  trayCloseBot: (trayData) => {
    return new Promise(async (resolve, reject) => {
      let getTray = await masters.findOne({ code: trayData.trayId });
      let data;
      if (getTray?.items?.length !== 0) {
        data = await masters.findOneAndUpdate(
          { code: trayData.trayId },
          {
            $set: {
              sort_id: "Closed By Warehouse",
              closed_time_wharehouse_from_bot: new Date(
                new Date().toISOString().split("T")[0]
              ),
              actual_items: [],
              issued_user_name: null,
              rack_id: trayData.rackId,
              "track_tray.bot_done_tray_close_wh": Date.now(),
            },
          }
        );
      } else {
        data = await masters.findOneAndUpdate(
          { code: trayData.trayId },
          {
            $set: {
              sort_id: "Open",
              track_tray: {},
              rack_id: trayData.rackId,
              closed_time_wharehouse: Date.now(),
              issued_user_name: null,
            },
          }
        );
      }
      if (data) {
        let state = "Tray";
        for (let x of data.items) {
          let unitsLogCreation = await unitsActionLog.create({
            action_type: "Closed By Warehouse",
            created_at: Date.now(),
            user_name_of_action: trayData.username,
            user_type: "PRC Warehouse",
            uic: x.uic,
            track_tray: state,
            tray_id: trayData.trayId,
            rack_id: trayData.rackId,
            description: `Bot done closed by warehouse agent :${trayData.username}`,
          });
          state = "Units";
          let getItemId = await delivery.findOneAndUpdate(
            {
              tracking_id: x.awbn_number,
            },
            {
              $set: {
                tray_close_wh_date: Date.now(),
                tray_status: "Closed By Warehouse",
                tray_location: "Warehouse",
                updated_at: Date.now(),
              },
            },
            {
              new: true,
              projection: { _id: 0 },
            }
          );

          let findProduct = await products.findOne({
            vendor_sku_id: getItemId.item_id,
          });
          let obj = {
            item: [],
            muic: findProduct.muic,
            model: findProduct.model_name,
            brand: findProduct.brand_name,
            vendor_sku_id: findProduct.vendor_sku_id,
            assigned_count: 0,
            close_date: Date.now(),
          };
          obj.item.push(x);
          let updateToMuic = await masters.updateOne(
            {
              code: trayData.trayId,
              items: {
                $elemMatch: {
                  awbn_number: x.awbn_number,
                },
              },
            },
            {
              $set: {
                "items.$.muic": findProduct.muic,
                "items.$.model": findProduct.model_name,
                "items.$.brand": findProduct.brand_name,
                "items.$.wht_tray": null,
              },
            }
          );
          let checkAlreadyClub = await masters.findOne({
            code: trayData.trayId,
            "temp_array.vendor_sku_id": findProduct.vendor_sku_id,
          });
          x.wht_tray = null;
          if (checkAlreadyClub) {
            let updateTempArrayClub = await masters.updateOne(
              {
                code: trayData.trayId,
                "temp_array.vendor_sku_id": findProduct.vendor_sku_id,
              },
              {
                $push: {
                  "temp_array.$.item": x,
                },
              }
            );
          } else {
            let updateTempArrayClub = await masters.updateOne(
              {
                code: trayData.trayId,
              },
              {
                $push: {
                  temp_array: obj,
                },
              }
            );
          }
        }
        let bag = await masters.updateOne(
          {
            code: trayData.bagId,
          },
          {
            $set: {
              sort_id: "No Status",
              issued_user_name: null,
              status_change_time: Date.now(),
              items: [],
              actual_items: [],
            },
          }
        );
        resolve(data);
      } else {
        resolve();
      }
    });
  },

  /*------------------------CHECK BAG ITEMS ARE SHIFTED TO TRAYS CONFIRMATION---------------------------*/

  bagValidationPmtMmtBot: (bagId) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.aggregate([
        { $match: { code: bagId } },
        {
          $lookup: {
            from: "deliveries",
            localField: "items.awbn_number",
            foreignField: "tracking_id",
            as: "delivery",
          },
        },
      ]);
      if (data[0].delivery.length !== 0) {
        for (let x of data[0].delivery) {
          if (x.tray_id == undefined) {
            resolve({ status: 2 });
            break;
          }
        }
        resolve({ status: 1 });
      } else {
        resolve({ status: 3 });
      }
    });
  },

  /*------------------------FIND WAREHOUSE CLOSED TRAY'S---------------------------*/

  getBotWarehouseClosed: (location, type, taxanomy) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        type_taxanomy: taxanomy,
        prefix: "tray-master",
        sort_id: type,
        cpc: location,
      });
      if (data) {
        resolve(data);
      }
    });
  },

  /*------------------------RELEASE BOT TRAY---------------------------*/

  releaseBotTray: (trayId) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.updateOne(
        { code: trayId },
        {
          $set: {
            issued_user_name: null,
            sort_id: "Open",
            items: [],
            actual_items: [],
            temp_array: [],
            wht_tray: [],
            track_tray: {},
          },
        }
      );
      if (data.matchedCount != 0) {
        resolve(data);
      } else {
        resolve();
      }
    });
  },

  /*------------------------USER INHAND TRAY AUTO FETCH---------------------------*/

  autoFetchTray: (userName) => {
    return new Promise(async (resolve, reject) => {
      let mmtTrayCode = null;
      let pmtTrayCode = null;
      let botTrayCode = null;
      let mmt = await masters.findOne({
        $or: [
          {
            type_taxanomy: "MMT",
            prefix: "tray-master",
            issued_user_name: userName,
            sort_id: "Issued",
          },
          {
            type_taxanomy: "MMT",
            prefix: "tray-master",
            issued_user_name: userName,
            sort_id: "Closed By Bot",
          },
        ],
      });
      let pmt = await masters.findOne({
        $or: [
          {
            type_taxanomy: "PMT",
            prefix: "tray-master",
            issued_user_name: userName,
            sort_id: "Issued",
          },
          {
            type_taxanomy: "PMT",
            prefix: "tray-master",
            issued_user_name: userName,
            sort_id: "Closed By Bot",
          },
        ],
      });
      let BOT = await masters.findOne({
        $or: [
          {
            type_taxanomy: "BOT",
            prefix: "tray-master",
            issued_user_name: userName,
            sort_id: "Issued",
          },
          {
            type_taxanomy: "BOT",
            prefix: "tray-master",
            issued_user_name: userName,
            sort_id: "Closed By Bot",
          },
        ],
      });
      if (mmt) {
        mmtTrayCode = mmt.code;
      }
      if (pmt) {
        pmtTrayCode = pmt.code;
      }
      if (BOT) {
        botTrayCode = BOT.code;
      }
      resolve({
        mmtTray: mmtTrayCode,
        pmtTray: pmtTrayCode,
        botTray: botTrayCode,
      });
    });
  },

  /*------------------------FETCH BAG SUMMERY---------------------------*/

  getSummeryBotTray: (bagId) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.aggregate([
        { $match: { code: bagId } },
        {
          $lookup: {
            from: "deliveries",
            localField: "items.awbn_number",
            foreignField: "tracking_id",
            as: "delivery",
          },
        },
      ]);
      if (data.length !== 0) {
        let bot = await masters.findOne({
          "items.bag_id": bagId,
          sort_id: "Closed By Bot",
          prefix: "tray-master",
          type_taxanomy: "BOT",
        });

        if (bot) {
          resolve();
        } else {
          resolve(data);
        }
      } else {
        resolve();
      }
    });
  },

  /*------------------------INUSE  AND FREE WHT TRAY'S---------------------------*/

  getWhtTray: (trayType, brand, model, location) => {
    return new Promise(async (resolve, reject) => {
      let data;
      if (trayType == "use_new_tray") {
        data = await masters.find({
          prefix: "tray-master",
          type_taxanomy: "WHT",
          brand: brand,
          model: model,
          cpc: location,
          sort_id: "Open",
        });
      } else {
        data = await masters.find({
          prefix: "tray-master",
          type_taxanomy: "WHT",
          brand: brand,
          model: model,
          sort_id: "Inuse",
          cpc: location,
        });
      }
      resolve(data);
    });
  },

  /*------------------------BOT TO WHT ASSIGNMENT---------------------------*/

  assignToWht: (dataOfItem) => {
    return new Promise(async (resolve, reject) => {
      let data;
      for (let x of dataOfItem.item) {
        x.wht_tray = dataOfItem.wht_tray;
        data = await masters.updateOne(
          { code: dataOfItem.wht_tray },
          {
            $push: {
              temp_array: x,
            },
            $set: {
              sort_id: "Inuse",
            },
          }
        );
        if (data.modifiedCount !== 0) {
          let updateBotTraySecond = await masters.updateOne(
            {
              code: x.tray_id,
              items: {
                $elemMatch: {
                  awbn_number: x.awbn_number,
                },
              },
            },
            {
              $set: {
                "items.$.wht_tray": dataOfItem.wht_tray,
              },
            }
          );
        }
      }
      for (let x of dataOfItem.botTray) {
        let updateBotTray = await masters.updateOne(
          {
            code: x,
            temp_array: {
              $elemMatch: {
                muic: dataOfItem.muic,
              },
            },
          },
          {
            $push: {
              wht_tray: dataOfItem.wht_tray,
            },
          }
        );
      }
      resolve(data);
    });
  },

  /*------------------------BOT TO WHT GET ASSIGNED TRAY---------------------------*/

  getAssignedTray: (details) => {
    return new Promise(async (resolve, reject) => {
      let arr = [];
      let arr1 = [];
      if (details?.whtTrayId !== undefined) {
        for (let x of details?.whtTrayId) {
          if (arr1.includes(x.wht_tray) == false && x.wht_tray !== null) {
            let data = await masters.findOne({
              code: x.wht_tray,
              type_taxanomy: "WHT",
              cpc: details.location,
              brand: details.brand,
              model: details.model,
            });
            if (data) {
              arr.push(data);
            }
          }
          arr1.push(x.wht_tray);
        }
      }
      if (arr) {
        resolve(arr);
      }
    });
  },

  /*------------------------REMOVE WHT TRAY ITEM---------------------------*/

  removeWhtTrayItem: (whtTrayDetails) => {
    return new Promise(async (resolve, reject) => {
      let data;
      let arr = [];
      for (let x of whtTrayDetails.botTray) {
        let allItem = await masters.findOne({ code: x });
        arr.push(...allItem.items);
        data = await masters.findOneAndUpdate(
          { code: whtTrayDetails.code },
          {
            $pull: {
              temp_array: {
                tray_id: x,
                muic: whtTrayDetails.muic,
              },
            },
          },
          { new: true }
        );
      }
      if (data?.items?.length == 0 && data?.temp_array?.length == 0) {
        let updateStatus = await masters.updateOne(
          { code: whtTrayDetails.code },
          {
            $set: {
              sort_id: "Open",
            },
          }
        );
      }
      if (data) {
        for (let x of arr) {
          if (
            x.wht_tray == whtTrayDetails.code &&
            x.muic == whtTrayDetails.muic
          ) {
            let pullItemTray = await masters.updateOne(
              {
                items: { $elemMatch: { awbn_number: x.awbn_number } },
                code: x.tray_id,
              },
              {
                $set: {
                  "items.$.wht_tray": null,
                },
                $pull: {
                  wht_tray: whtTrayDetails.code,
                },
              }
            );
          }
        }
        resolve(data);
      }
    });
  },

  /*------------------------WHT TRAY---------------------------*/

  getWhtTrayWareHouse: (location, type) => {
    return new Promise(async (resolve, reject) => {
      if (type == "all-wht-tray") {
        let data = await masters.aggregate([
          {
            $match: {
              prefix: "tray-master",
              type_taxanomy: "WHT",
              cpc: location,
            },
          },
          {
            $lookup: {
              from: "trayracks",
              localField: "rack_id",
              foreignField: "rack_id",
              as: "rackDetails",
            },
          },
          {
            $project: {
              code: 1,
              rack_id: 1,
              brand: 1,
              model: 1,
              sort_id: 1,
              created_at: 1,
              rackDetails: 1,
              limit: 1,
              items_length: {
                $cond: {
                  if: { $isArray: "$items" },
                  then: { $size: "$items" },
                  else: 0,
                },
              },
              actual_items: {
                $cond: {
                  if: { $isArray: "$actual_items" },
                  then: { $size: "$actual_items" },
                  else: 0,
                },
              },
            },
          },
        ]);

        resolve(data);
      } else {
        let data = await masters.find({
          prefix: "tray-master",
          type_taxanomy: "WHT",
          sort_id: "Issued to sorting agent",
          cpc: location,
        });
        resolve(data);
      }
    });
  },
  getBotPmtMmtTray: (location, taxanomy) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.aggregate([
        {
          $match: {
            prefix: "tray-master",
            type_taxanomy: taxanomy,
            cpc: location,
          },
        },
        {
          $lookup: {
            from: "trayracks",
            localField: "rack_id",
            foreignField: "rack_id",
            as: "rackDetails",
          },
        },
        {
          $project: {
            rackDetails: 1,
            code: 1,
            rack_id: 1,
            brand: 1,
            model: 1,
            sort_id: 1,
            created_at: 1,
            limit: 1,
            items_length: {
              $cond: {
                if: { $isArray: "$items" },
                then: { $size: "$items" },
                else: 0,
              },
            },
            actual_items: {
              $cond: {
                if: { $isArray: "$actual_items" },
                then: { $size: "$actual_items" },
                else: 0,
              },
            },
          },
        },
      ]);

      resolve(data);
    });
  },
  /*-------------------------GET RPT TRAY ----------------------------------------------*/
  getRptTrayBasedOnStatus: (location, type, status) => {
    return new Promise(async (resolve, reject) => {
      if (status == "All") {
        let data = await masters.aggregate([
          {
            $match: {
              cpc: location,
              type_taxanomy: "RPT",
            },
          },
          {
            $lookup: {
              from: "trayracks",
              localField: "rack_id",
              foreignField: "rack_id",
              as: "rackDetails",
            },
          },
        ]);
        resolve(data);
      }
    });
  },
  /*--------------------FIND WHT TRAY BASED ON THE STATUS----------------------------*/

  getInUseWhtTray: (status, location) => {
    return new Promise(async (resolve, reject) => {
      let data;
      if (
        status == "Ready to BQC" ||
        status == "Ready to Audit" ||
        status == "Inuse" ||
        status == "Issued to sorting agent" ||
        status == "Inuse" ||
        status == "Ready to RDL-1"
      ) {
        data = await masters.aggregate([
          {
            $match: {
              prefix: "tray-master",
              type_taxanomy: "WHT",
              sort_id: status,
              cpc: location,
            },
          },
          {
            $lookup: {
              from: "trayracks",
              localField: "rack_id",
              foreignField: "rack_id",
              as: "rackData",
            },
          },
          {
            $lookup: {
              from: "products",
              localField: "items.muic",
              foreignField: "muic",
              as: "products",
            },
          },
          {
            $unwind: {
              path: "$rackData",
              preserveNullAndEmptyArrays: true, // This option preserves documents that do not have a matching element in the array
            },
          },
        ]);
      } else if (status == "Closed") {
        data = await masters.find({
          $or: [
            {
              cpc: location,
              prefix: "tray-master",
              type_taxanomy: "WHT",
              sort_id: "Closed",
            },
            {
              cpc: location,
              prefix: "tray-master",
              type_taxanomy: "WHT",
              sort_id: "Recharging",
            },
          ],
        });
      } else if (status == "wht-merge") {
        data = await masters.aggregate([
          {
            $match: {
              $or: [
                {
                  cpc: location,
                  prefix: "tray-master",
                  type_taxanomy: "WHT",
                  sort_id: "Inuse",
                  items: {
                    $ne: [],
                    $exists: true,
                  },
                },
                {
                  cpc: location,
                  prefix: "tray-master",
                  type_taxanomy: "WHT",
                  sort_id: "Audit Done Closed By Warehouse",
                  $expr: {
                    $and: [
                      { $ne: [{ $ifNull: ["$items", null] }, null] },
                      { $ne: [{ $size: "$items" }, { $toInt: "$limit" }] },
                    ],
                  },
                },
                {
                  cpc: location,
                  prefix: "tray-master",
                  type_taxanomy: "WHT",
                  $expr: {
                    $and: [
                      { $ne: [{ $ifNull: ["$items", null] }, null] },
                      { $ne: [{ $size: "$items" }, { $toInt: "$limit" }] },
                    ],
                  },
                  sort_id: "Ready to RDL-2",
                },
                {
                  cpc: location,
                  prefix: "tray-master",
                  type_taxanomy: "WHT",
                  $expr: {
                    $and: [
                      { $ne: [{ $ifNull: ["$items", null] }, null] },
                      { $ne: [{ $size: "$items" }, { $toInt: "$limit" }] },
                    ],
                  },
                  sort_id: "Ready to BQC",
                },
                {
                  cpc: location,
                  prefix: "tray-master",
                  type_taxanomy: "WHT",
                  $expr: {
                    $and: [
                      { $ne: [{ $ifNull: ["$items", null] }, null] },
                      { $ne: [{ $size: "$items" }, { $toInt: "$limit" }] },
                    ],
                  },
                  sort_id: "Ready to Audit",
                },
              ],
            },
          },
          {
            $lookup: {
              from: "trayracks",
              localField: "rack_id",
              foreignField: "rack_id",
              as: "rackData",
            },
          },
          {
            $project: {
              rackData: 1,
              code: 1,
              rack_id: 1,
              brand: 1,
              model: 1,
              sort_id: 1,
              created_at: 1,
              limit: 1,
              tray_grade: 1,
              type_taxanomy: 1,
              items_length: {
                $cond: {
                  if: { $isArray: "$items" },
                  then: { $size: "$items" },
                  else: 0,
                },
              },
              actual_items: {
                $cond: {
                  if: { $isArray: "$actual_items" },
                  then: { $size: "$actual_items" },
                  else: 0,
                },
              },
            },
          },
        ]);
      } else {
        data = await masters.find({
          $or: [
            {
              prefix: "tray-master",
              type_taxanomy: "WHT",
              sort_id: "Issued to Charging",
              cpc: location,
            },
            {
              prefix: "tray-master",
              type_taxanomy: "WHT",
              sort_id: "Charging Station IN",
              cpc: location,
            },
            {
              prefix: "tray-master",
              type_taxanomy: "WHT",
              sort_id: "Issued to Recharging",
              cpc: location,
            },
            {
              prefix: "tray-master",
              type_taxanomy: "WHT",
              sort_id: "Recharging Station IN",
              cpc: location,
            },
          ],
        });
      }
      resolve(data);
    });
  },
  /*-----------------------PLANNER FOR CHARGING AND BQC-------------------------------*/
  plannerPageDataFetch: (status, location) => {
    return new Promise(async (resolve, reject) => {
      let data;
      if (status == "Closed") {
        data = await masters.aggregate([
          {
            $match: {
              $or: [
                {
                  sort_id: status,
                  cpc: location,
                  prefix: "tray-master",
                  type_taxanomy: "WHT",
                },
                {
                  sort_id: "Recharging",
                  cpc: location,
                  prefix: "tray-master",
                  type_taxanomy: "WHT",
                },
              ],
            },
          },
          {
            $lookup: {
              from: "products",
              localField: "items.muic",
              foreignField: "muic",
              as: "products",
            },
          },
          {
            $lookup: {
              from: "trayracks",
              localField: "rack_id",
              foreignField: "rack_id",
              as: "rackData",
            },
          },
          {
            $unwind: {
              path: "$rackData",
              preserveNullAndEmptyArrays: true, // This option preserves documents that do not have a matching element in the array
            },
          },
        ]);
      } else {
        data = await masters.aggregate([
          {
            $match: {
              sort_id: status,
              cpc: location,
              prefix: "tray-master",
              type_taxanomy: "WHT",
            },
          },
          {
            $lookup: {
              from: "products",
              localField: "items.muic",
              foreignField: "muic",
              as: "products",
            },
          },
          {
            $lookup: {
              from: "trayracks",
              localField: "rack_id",
              foreignField: "rack_id",
              as: "rackData",
            },
          },
          {
            $unwind: {
              path: "$rackData",
              preserveNullAndEmptyArrays: true, // This option preserves documents that do not have a matching element in the array
            },
          },
        ]);
      }
      let trayData = [];
      if (data.length !== 0) {
        for (let x of data) {
          x["rack_display"] = x?.rackData?.display;
          x["jack_type"] = "";
          if (x?.products?.length !== 0) {
            x["jack_type"] = x?.products?.[0]?.jack_type;
            x["out_of_stock"] = x?.products?.[0]?.out_of_stock;
            x["variant"] = x?.products?.[0]?.variant;
          }
          var today = new Date(Date.now());
          if (status == "Ready to BQC") {
            if (
              new Date(x.closed_time_bot) <=
              new Date(today.setDate(today.getDate() - 4))
            ) {
            } else {
              trayData.push(x);
            }
          } else {
            trayData.push(x);
          }
        }
      }
      resolve(trayData);
    });
  },

  /*-------------------- FETCH WHT ITEM BASED ON THE STATUS---------------------------*/

  getWhtTrayitem: (trayId, sortId, location) => {
    return new Promise(async (resolve, reject) => {
      if (sortId == "all-wht-tray") {
        let data = await masters.findOne({ code: trayId, cpc: location });
        if (data) {
          resolve({ data: data, status: 1 });
        } else {
          resolve({ data: data, status: 2 });
        }
      } else if (sortId == "super-admin") {
        let data = await masters.findOne({ code: trayId });
        if (data) {
          resolve({ data: data, status: 1 });
        } else {
          resolve({ data: data, status: 2 });
        }
      } else if (sortId == "Received From RP-Audit") {
        let data = await masters.findOne({
          $or: [
            { code: trayId, sort_id: "Received From RP-Audit" },
            { code: trayId, sort_id: "Received From RP-BQC" },
          ],
        });
        if (data) {
          resolve({ data: data, status: 1 });
        } else {
          resolve({ data: data, status: 2 });
        }
      } else if (sortId === "Send for charging") {
        let data = await masters.findOne({ code: trayId, cpc: location });
        if (data) {
          if (
            data.sort_id == "Send for BQC" ||
            data.sort_id == "Send for charging" ||
            data.sort_id == "Send for Recharging"
          ) {
            resolve({ data: data, status: 1 });
          } else if (data.sort_id == sortId) {
            resolve({ data: data, status: 1 });
          } else {
            resolve({ data: data, status: 3 });
          }
        } else {
          resolve({ data: data, status: 2 });
        }
      } else if (sortId === "Issued to Charging") {
        let data = await masters.findOne({ code: trayId, cpc: location });
        if (data) {
          if (
            data.sort_id == "Issued to Charging" ||
            data.sort_id == "Issued to Recharging"
          ) {
            resolve({ data: data, status: 1 });
          } else {
            resolve({ data: data, status: 3 });
          }
        } else {
          resolve({ data: data, status: 2 });
        }
      } else if (sortId === "Charging Station IN") {
        let data = await masters.findOne({ code: trayId, cpc: location });
        if (data) {
          if (
            data.sort_id == "Charging Station IN" ||
            data.sort_id == "Recharging Station IN"
          ) {
            resolve({ data: data, status: 1 });
          } else {
            resolve({ data: data, status: 3 });
          }
        } else {
          resolve({ data: data, status: 2 });
        }
      } else if (sortId === "Send for RDL-1") {
        let data = await masters.findOne({ code: trayId, cpc: location });
        if (data) {
          if (data?.sort_id == "Send for RDL-1") {
            resolve({ data: data, status: 1 });
          } else {
            resolve({ data: data, status: 3 });
          }
        }
      } else if (sortId === "Closed by RDL-1") {
        let data = await masters.findOne({ code: trayId, cpc: location });
        if (data) {
          if (data?.sort_id == "Closed by RDL-1") {
            resolve({ data: data, status: 1 });
          } else {
            resolve({ data: data, status: 3 });
          }
        } else {
          resolve({ data: data, status: 2 });
        }
      } else if (sortId === "Received from RDL-1") {
        let data = await masters.findOne({ code: trayId, cpc: location });
        if (data) {
          if (data?.sort_id == "Received From RDL-1") {
            resolve({ data: data, status: 1 });
          } else {
            resolve({ data: data, status: 3 });
          }
        } else {
          resolve({ data: data, status: 2 });
        }
      } else if (sortId === "Received From Processing") {
        let data = await masters.findOne({ code: trayId, cpc: location });
        if (data) {
          if (
            data?.sort_id == "Received From Processing" ||
            data?.sort_id == "Received From Sales"
          ) {
            resolve({ data: data, status: 1 });
          } else {
            resolve({ data: data, status: 3 });
          }
        } else {
          resolve({ data: data, status: 2 });
        }
      } else {
        let data = await masters.findOne({ code: trayId, cpc: location });
        if (data) {
          if (data.sort_id == sortId) {
            resolve({ data: data, status: 1 });
          } else {
            resolve({ data: data, status: 3 });
          }
        } else {
          resolve({ data: data, status: 2 });
        }
      }
    });
  },

  /*------------------GET REQUESTS---------------------------*/

  sendToMisWhtApproveCharging: (allTrayId) => {
    return new Promise(async (resolve, reject) => {
      let data;
      for (let x of allTrayId) {
        data = await masters.updateOne(
          { code: x },
          {
            $set: {
              sort_id: "Requested to mis",
            },
          }
        );
      }
      if (data.modifiedCount != 0) {
        resolve(data);
      } else {
        resolve();
      }
    });
  },

  /*------------------GET CHARGING REQUESTS---------------------------*/

  getChargingRequest: (status, location) => {
    if (status == "Send_for_charging") {
      return new Promise(async (resolve, reject) => {
        let data = await masters.aggregate([
          {
            $match: {
              $or: [
                {
                  prefix: "tray-master",
                  type_taxanomy: "WHT",
                  sort_id: "Send for charging",
                  cpc: location,
                },
                {
                  prefix: "tray-master",
                  type_taxanomy: "WHT",
                  sort_id: "Send for Recharging",
                  cpc: location,
                },
              ],
            },
          },
          {
            $lookup: {
              from: "trayracks",
              localField: "rack_id",
              foreignField: "rack_id",
              as: "rackData",
            },
          },
        ]);
        if (data) {
          resolve(data);
        }
      });
    } else if (status == "Send_for_audit") {
      return new Promise(async (resolve, reject) => {
        let data = await masters.aggregate([
          {
            $match: {
              prefix: "tray-master",
              type_taxanomy: "WHT",
              sort_id: "Send for Audit",
              cpc: location,
            },
          },
          {
            $lookup: {
              from: "trayracks",
              localField: "rack_id",
              foreignField: "rack_id",
              as: "rackData",
            },
          },
        ]);

        if (data) {
          resolve(data);
        }
      });
    } else {
      return new Promise(async (resolve, reject) => {
        let data = await masters.aggregate([
          {
            $match: {
              prefix: "tray-master",
              type_taxanomy: "WHT",
              sort_id: "Send for BQC",
            },
          },
          {
            $lookup: {
              from: "trayracks",
              localField: "rack_id",
              foreignField: "rack_id",
              as: "rackData",
            },
          },
        ]);
        if (data) {
          resolve(data);
        }
      });
    }
  },

  /*------------------CHECK UIC CODE---------------------------*/

  checkUicCode: async (uic, trayId) => {
    try {
      let deliveryData = await delivery.findOne({ "uic_code.code": uic });
      if (!deliveryData) {
        return { status: 1 }; // UIC not found in delivery collection
      }

      let trayData = await masters.findOne({
        code: trayId,
        items: { $elemMatch: { uic: uic } },
      });
      if (!trayData) {
        return { status: 2 }; // UIC not found in tray items
      }

      let alreadyAdded = await masters.findOne({
        code: trayId,
        "actual_items.uic": uic,
      });
      if (alreadyAdded) {
        return { status: 3 }; // UIC already added to the tray
      }

      let obj = trayData.items.find((item) => item.uic === uic);

      let updateResult = await masters.updateOne(
        { code: trayId },
        {
          $push: {
            actual_items: obj,
          },
        }
      );
      if (updateResult.modifiedCount !== 1) {
        throw new Error("Failed to update tray with UIC");
      }

      return { status: 4, data: obj }; // UIC found in tray items
    } catch (error) {
      throw new Error(error);
    }
  },
  /*------------------ADD ACTUAL ITEM CONFIRMATION---------------------------*/

  addWhtActual: (trayItemData) => {
    return new Promise(async (resolve, reject) => {
      if (trayItemData?.page == "bqc") {
        let checkAlreadyAdded = await masters.findOne({
          code: trayItemData.trayId,
          "items.uic": trayItemData.item.uic,
        });
        if (checkAlreadyAdded) {
          resolve({ status: 3 });
        } else {
          trayItemData.item._id = mongoose.Types.ObjectId();
          let data = await masters.updateOne(
            { code: trayItemData.trayId },
            {
              $set: {
                sort_id: "BQC work inprogress",
              },
              $addToSet: {
                items: trayItemData.item,
              },
            }
          );
          if (data.matchedCount != 0) {
            resolve({ status: 1 });
          } else {
            resolve({ status: 2 });
          }
        }
      } else {
        let checkAlreadyAdded = await masters.findOne({
          code: trayItemData.trayId,
          "actual_items.uic": trayItemData.item.uic,
        });
        if (checkAlreadyAdded) {
          resolve({ status: 3 });
        } else {
          let data = await masters.updateOne(
            { code: trayItemData.trayId },
            {
              $push: {
                actual_items: trayItemData.item,
              },
            }
          );
          if (data.matchedCount != 0) {
            resolve({ status: 1 });
          } else {
            resolve({ status: 2 });
          }
        }
      }
    });
  },

  /*------------------WHT TRAY ISSUE TO AGENT---------------------------*/

  issueToagentWht: (trayData) => {
    return new Promise(async (resolve, reject) => {
      let data;
      if (trayData.sortId == "Ready to RDL-2") {
        data = await masters.findOneAndUpdate(
          { code: trayData.trayId },
          {
            $set: {
              actual_items: [],
              issued_user_name: trayData.username,
              temp_array: [],
              rack_id: null,
              sort_id: "Issued to RDL-2",
              wht_tray: [],
              assigned_date: Date.now(),
              "track_tray.issued_to_rdl_two": Date.now(),
            },
          },
          {
            new: true,
          }
        );
        await unitsActionLog.create({
          action_type: "Issued to RDL-2",
          created_at: Date.now(),
          agent_name: data.issued_user_name,
          user_name_of_action: trayData.actionUser,
          tray_id: trayData.trayId,
          user_type: "SP Warehouse",
          track_tray: "Tray",
          description: `Issued to RDL-2 to agent :${data.issued_user_name} by WH :${trayData.actionUser}`,
        });
        for (let x of data.items) {
          await partInventoryLedger.create({
            department: "SPWH",
            action: "Part Issue",
            action_done_user: trayData.actionUser,
            description: `Part issued by SPWH:${trayData.actionUser},to RDL-2 agent:${trayData.username}`,
            part_code: x.partId,
            tray_id: trayData.trayId,
          });
        }
      } else if (trayData.sortId == "Send for BQC") {
        data = await masters.findOneAndUpdate(
          { code: trayData.trayId },
          {
            $set: {
              actual_items: [],
              description: trayData.description,
              temp_array: [],
              rack_id: null,
              sort_id: "Issued to BQC",
              assigned_date: Date.now(),
              "track_tray.issued_to_bqc_wh": Date.now(),
            },
          }
        );
        if (data) {
          let state = "Tray";
          for (let x of data.items) {
            const addLogsofUnits = await unitsActionLog.create({
              action_type: "Issued for BQC",
              created_at: Date.now(),
              uic: x.uic,
              agent_name: data.issued_user_name,
              user_name_of_action: trayData.actionUser,
              tray_id: trayData.trayId,
              user_type: "PRC Warehouse",
              track_tray: state,
              description: `Issued for BQC to agent :${data.issued_user_name} by WH :${trayData.actionUser}`,
            });
            state = "Units";
            let deliveryUpdate = await delivery.findOneAndUpdate(
              { tracking_id: x.tracking_id },
              {
                $set: {
                  tray_status: "Issued to BQC",
                  tray_location: "BQC Agent",
                  agent_name_bqc: data.issued_user_name,
                  assign_to_agent_bqc: Date.now(),
                  updated_at: Date.now(),
                },
              },
              {
                new: true,
                projection: { _id: 0 },
              }
            );
          }
        }
      } else if (trayData.sortId == "Send for Recharging") {
        data = await masters.findOneAndUpdate(
          { code: trayData.trayId },
          {
            $set: {
              actual_items: [],
              description: trayData.description,
              sort_id: "Issued to Recharging",
              assigned_date: Date.now(),
              rack_id: null,
              "track_tray.issued_to_recharging": Date.now(),
              temp_array: [],
            },
          }
        );
        if (data) {
          let state = "Tray";
          for (let x of data.items) {
            const addLogsofUnits = await unitsActionLog.create({
              action_type: "Issued to Recharging",
              created_at: Date.now(),
              uic: x.uic,
              agent_name: data.issued_user_name,
              user_name_of_action: trayData.actionUser,
              tray_id: trayData.trayId,
              user_type: "PRC Warehouse",
              track_tray: state,
              description: `Issued to Recharging agent :${data.issued_user_name} by Wh:${trayData.actionUser}`,
            });
            state = "Units";
            let deliveryUpdate = await delivery.findOneAndUpdate(
              { tracking_id: x.tracking_id },
              {
                $set: {
                  tray_status: "Issued to Recharging",
                  agent_name_charging: data.issued_user_name,
                  assign_to_agent_charging: Date.now(),
                  "track_tray.issued_to_recharging": Date.now(),
                  tray_location: "Charging",
                  rack_id: null,
                  updated_at: Date.now(),
                },
              },
              {
                new: true,
                projection: { _id: 0 },
              }
            );
          }
        }
      } else if (trayData.sortId == "Send for RDL-1") {
        data = await masters.findOneAndUpdate(
          { code: trayData.trayId },
          {
            $set: {
              actual_items: [],
              description: trayData.description,
              sort_id: "Issued to RDL-1",
              requested_date: Date.now(),
              "track_tray.issued_rdl_1_wh": Date.now(),
              assigned_date: Date.now(),
              rack_id: null,
              temp_array: [],
            },
          }
        );
        if (data) {
          let state = "Tray";
          for (let x of data.items) {
            const addLogsofUnits = await unitsActionLog.create({
              action_type: "Issued to RDL-1",
              created_at: Date.now(),
              uic: x.uic,
              agent_name: data.issued_user_name,
              user_name_of_action: trayData.actionUser,
              tray_id: trayData.trayId,
              user_type: "PRC Warehouse",
              track_tray: state,
              description: `Issued to RDL-1 to agent :${data.issued_user_name} by WH :${trayData.actionUser}`,
            });
            state = "Units";
            let deliveryUpdate = await delivery.findOneAndUpdate(
              { tracking_id: x.tracking_id },
              {
                $set: {
                  tray_status: "Issued to RDL-1",
                  rdl_fls_one_user_name: data?.issued_user_name,
                  rdl_fls_issued_date: Date.now(),
                  tray_location: "RDL-1",
                  updated_at: Date.now(),
                },
              },
              {
                new: true,
                projection: { _id: 0 },
              }
            );

            if (deliveryUpdate) {
              resolve(data);
            } else {
              resolve();
            }
          }
        }
      } else if (trayData.sortId == "Send for RDL-2") {
        data = await masters.findOneAndUpdate(
          { code: trayData.trayId },
          {
            $set: {
              actual_items: [],
              description: trayData.description,
              sort_id: "Issued to RDL-2",
              rack_id: null,
              requested_date: Date.now(),
              assigned_date: Date.now(),
              "track_tray.issued_to_rdl_two": Date.now(),
              temp_array: [],
            },
          }
        );
        if (data) {
          let state = "Tray";
          for (let x of data.items) {
            const addLogsofUnits = await unitsActionLog.create({
              action_type: "Issued to RDL-2",
              created_at: Date.now(),
              uic: x.uic,
              agent_name: data.issued_user_name,
              user_name_of_action: trayData.actionUser,
              tray_id: trayData.trayId,
              user_type: "PRC Warehouse",
              track_tray: state,
              description: `Issued to RDL-2 :${data.issued_user_name} by WH :${trayData.actionUser}`,
            });
            state = "Units";
            let deliveryUpdate = await delivery.findOneAndUpdate(
              { tracking_id: x.tracking_id },
              {
                $set: {
                  tray_status: "Issued to RDL-2",
                  rdl_two_user_name: data?.issued_user_name,
                  issued_to_rdl_two_date: Date.now(),
                  tray_location: "RDL-2",
                  updated_at: Date.now(),
                },
              },
              {
                new: true,
                projection: { _id: 0 },
              }
            );

            if (deliveryUpdate) {
              resolve(data);
            } else {
              resolve();
            }
          }
        }
      } else if (trayData.sortId == "Assigned for Display Grading") {
        data = await masters.findOneAndUpdate(
          { code: trayData.trayId },
          {
            $set: {
              actual_items: [],
              description: trayData.description,
              sort_id: "Issued to Sorting Agent For Display Grading",
              rack_id: null,
              assigned_date: Date.now(),
              temp_array: [],
            },
          }
        );
        if (data) {
          let state = "Tray";
          for (let x of data.items) {
            const addLogsofUnits = await unitsActionLog.create({
              action_type: "Issued to Sorting Agent For Display Grading",
              created_at: Date.now(),
              uic: x.uic,
              agent_name: data.issued_user_name,
              user_name_of_action: trayData.actionUser,
              tray_id: trayData.trayId,
              user_type: "Sales Warehouse",
              track_tray: state,
              description: `Issued to Sorting Agent For Display Grading to agent:${data.issued_user_name} by WH :${trayData.actionUser}`,
            });
            state = "Units";
            let deliveryUpdate = await delivery.findOneAndUpdate(
              { tracking_id: x.tracking_id },
              {
                $set: {
                  tray_status: "Issued to Sorting Agent For Display Grading",
                  tray_location: "Sorting",
                  updated_at: Date.now(),
                  copy_grading_issued_to_agent: Date.now(),
                  for_copy_grade_username: data.issued_user_name,
                },
              },
              {
                new: true,
                projection: { _id: 0 },
              }
            );

            if (deliveryUpdate) {
              resolve(data);
            } else {
              resolve();
            }
          }
        }
      } else {
        data = await masters.findOneAndUpdate(
          { code: trayData.trayId },
          {
            $set: {
              actual_items: [],
              description: trayData.description,
              sort_id: "Issued to Charging",
              assigned_date: Date.now(),
              rack_id: null,
              "track_tray.issued_to_charging": Date.now(),
            },
          }
        );
        if (data) {
          let state = "Tray";
          for (let x of data.items) {
            const addLogsofUnits = await unitsActionLog.create({
              action_type: "Issued to Charging",
              created_at: Date.now(),
              uic: x.uic,
              agent_name: data.issued_user_name,
              user_name_of_action: trayData.actionUser,
              tray_id: trayData.trayId,
              user_type: "PRC Warehouse",
              track_tray: state,
              description: `Issued to Charging agent :${data.issued_user_name} by Wh :${trayData.actionUser}`,
            });
            state = "Units";
            let deliveryUpdate = await delivery.findOneAndUpdate(
              { tracking_id: x.tracking_id },
              {
                $set: {
                  tray_status: "Issued to Charging",
                  agent_name_charging: data.issued_user_name,
                  assign_to_agent_charging: Date.now(),
                  tray_location: "Charging",
                  updated_at: Date.now(),
                },
              },
              {
                new: true,
                projection: { _id: 0 },
              }
            );
          }
        }
      }
      if (data) {
        resolve(data);
      } else {
        resolve();
      }
    });
  },

  /*-----------------WHT TRAY RETURN FROM CHARGING--------------------------*/

  returnFromChargingWht: (location) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        $or: [
          {
            prefix: "tray-master",
            type_taxanomy: "WHT",
            sort_id: "Charge Done",
            cpc: location,
          },
          {
            prefix: "tray-master",
            type_taxanomy: "WHT",
            sort_id: "Received From Charging",
            cpc: location,
          },
          {
            prefix: "tray-master",
            type_taxanomy: "WHT",
            sort_id: "Received From Recharging",
            cpc: location,
          },
          {
            prefix: "tray-master",
            type_taxanomy: "WHT",
            sort_id: "Recharge Done",
            cpc: location,
          },
        ],
      });
      if (data) {
        resolve(data);
      }
    });
  },
  /*----------------------------RPT TRAY RETURN FROM RDL-2---------------------*/
  getRpTrayRetunrFromRdlTwo: (location) => {
    return new Promise(async (resolve, reject) => {
      const data = await masters.find({
        $or: [
          {
            type_taxanomy: "RPT",
            cpc: location,
            sort_id: "Closed by RDL-2",
          },
          {
            type_taxanomy: "RPT",
            cpc: location,
            sort_id: "Received from RDL-2",
          },
        ],
      });
      resolve(data);
    });
  },

  /*-----------------WHT TRAY  CHARGING DONE RECEIVED --------------------------*/

  chargingDoneRecieved: (trayId, sortId) => {
    return new Promise(async (resolve, reject) => {
      if (sortId == "Received From Charging") {
        let data = await masters.findOne({ code: trayId });
        if (data) {
          if (
            data.sort_id == "Received From Charging" ||
            data.sort_id == "Received From Recharging"
          ) {
            resolve({ data: data, status: 1 });
          } else {
            resolve({ data: data, status: 3 });
          }
        } else {
          resolve({ data: data, status: 2 });
        }
      } else if (sortId == "STX-Utility In-progress") {
        let data = await masters.findOne({ code: trayId });
        if (data) {
          if (
            data.sort_id == "STX-Utility In-progress" ||
            data.sort_id == "RPA to STX Work In Progress"
          ) {
            resolve({ data: data, status: 1 });
          } else {
            resolve({ data: data, status: 3 });
          }
        } else {
          resolve({ data: data, status: 2 });
        }
      } else {
        let data = await masters.findOne({ code: trayId });
        if (data) {
          if (data.sort_id == sortId) {
            resolve({ data: data, status: 1 });
          } else {
            resolve({ data: data, status: 3 });
          }
        } else {
          resolve({ data: data, status: 2 });
        }
      }
    });
  },

  /*-----------------RETURN FROM CHARGING WAREHOUSE WILL CHECK UIC CODE --------------------------*/

  checkUicCodeChargeDone: (uic, trayId) => {
    return new Promise(async (resolve, reject) => {
      let data = await delivery.findOne({ "uic_code.code": uic });
      if (data) {
        let checkExitThisTray = await masters.findOne({
          code: trayId,
          actual_items: { $elemMatch: { uic: uic } },
        });
        if (checkExitThisTray) {
          let alreadyAdded = await masters.findOne({
            code: trayId,
            "items.uic": uic,
          });
          if (alreadyAdded) {
            resolve({ status: 3 });
          } else {
            let obj;
            for (let x of checkExitThisTray.actual_items) {
              if (x.uic == uic) {
                obj = x;
              }
            }
            resolve({ status: 4, data: obj });
          }
        } else {
          resolve({ status: 2 });
        }
      } else {
        resolve({ status: 1 });
      }
    });
  },

  /*-----------------RETURN FROM SORTING WAREHOUSE WILL CHECK UIC CODE --------------------------*/

  checkUicCodeSortingDone: async (uic, trayId) => {
    try {
      const deliveryData = await delivery.findOne({ "uic_code.code": uic });
      if (!deliveryData) {
        return { status: 1 }; // UIC not found in delivery collection
      }

      const trayData = await masters.findOne({
        code: trayId,
        items: { $elemMatch: { uic: uic } },
      });
      if (!trayData) {
        return { status: 2 }; // UIC not found in tray items
      }

      const alreadyAdded = await masters.exists({
        code: trayId,
        "actual_items.uic": uic,
      });
      if (alreadyAdded) {
        return { status: 3 }; // UIC already added to the tray
      }

      const obj = trayData.items.find((item) => item.uic === uic);
      if (!obj) {
        return { status: 2 }; // UIC not found in tray items
      }

      return { status: 4, data: obj };
    } catch (error) {
      throw new Error(error);
    }
  },
  /*-----------------CHARGE DONE VERIFY ACTUAL ITEM--------------------------*/

  chargingDoneActualItemPut: (trayItemData) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.updateOne(
        { code: trayItemData.trayId },
        {
          $push: {
            items: trayItemData.item,
          },
        }
      );
      if (data.matchedCount != 0) {
        resolve(data);
      } else {
        resolve();
      }
    });
  },

  /*-----------------SORTING DONE VERIFY ACTUAL ITEM--------------------------*/

  sortingDoneActualItemPut: (trayItemData) => {
    return new Promise(async (resolve, reject) => {
      let checkItemPutedOrNot = await masters.findOne({
        code: trayItemData.trayId,
        "actual_items.uic": trayItemData.item.uic,
      });
      if (checkItemPutedOrNot == null) {
        let data = await masters.updateOne(
          { code: trayItemData.trayId },
          {
            $push: {
              actual_items: trayItemData.item,
            },
          }
        );
        if (data.matchedCount != 0) {
          resolve({ status: 1 });
        } else {
          resolve({ status: 2 });
        }
      } else {
        resolve({ status: 3 });
      }
    });
  },

  /*-----------------WHT TRAY READY TO BQC--------------------------*/

  readyToBqc: (trayData) => {
    return new Promise(async (resolve, reject) => {
      let data;
      if (trayData.type == "Ready to audit") {
        data = await masters.findOneAndUpdate(
          { code: trayData.trayId },
          {
            $set: {
              description: trayData.description,
              sort_id: "Ready to Audit",
              rack_id: trayData.rackId,
              closed_time_wharehouse: Date.now(),
              issued_user_name: null,
              "track_tray.bqc_done_close_by_wh": Date.now(),
              actual_items: [],
            },
          }
        );
        if (data) {
          let state = "Tray";
          for (let x of data.items) {
            let unitsLogCreation = await unitsActionLog.create({
              action_type: "Ready to Audit",
              created_at: Date.now(),
              user_name_of_action: trayData.actioUser,
              user_type: "PRC Warehouse",
              uic: x.uic,
              tray_id: trayData.trayId,
              track_tray: state,
              rack_id: trayData.rackId,
              description: `Bqc done closed by Wh :${trayData.actioUser}`,
            });
            state = "Units";
            let deliveryUpdate = await delivery.findOneAndUpdate(
              {
                tracking_id: x.tracking_id,
              },
              {
                $set: {
                  tray_status: "Ready to Audit",
                  tray_location: "Warehouse",
                  bqc_done_close: Date.now(),
                  updated_at: Date.now(),
                },
              },
              {
                new: true,
                projection: { _id: 0 },
              }
            );
          }
          resolve(data);
        } else {
          resolve();
        }
      } else {
        if (trayData.sort_id == "Received From Recharging") {
          data = await masters.findOneAndUpdate(
            { code: trayData.trayId },
            {
              $set: {
                description: trayData.description,
                sort_id: "Ready to BQC",
                rack_id: trayData.rackId,
                closed_time_wharehouse: Date.now(),
                issued_user_name: null,
                "track_tray.recharging_done_close_wh": Date.now(),
                actual_items: [],
              },
            }
          );
        } else {
          data = await masters.findOneAndUpdate(
            { code: trayData.trayId },
            {
              $set: {
                description: trayData.description,
                sort_id: "Ready to BQC",
                rack_id: trayData.rackId,
                closed_time_wharehouse: Date.now(),
                issued_user_name: null,
                "track_tray.charging_done_close_wh": Date.now(),
                actual_items: [],
              },
            }
          );
        }
        if (data) {
          let state = "Tray";
          for (let x of data.items) {
            let unitsLogCreation = await unitsActionLog.create({
              action_type: "Ready to BQC",
              created_at: Date.now(),
              user_name_of_action: trayData.actioUser,
              user_type: "PRC Warehouse",
              uic: x.uic,
              rack_id: trayData.rackId,
              tray_id: trayData.trayId,
              description: `Charging done closed by WH :${trayData.actioUser}`,
              track_tray: state,
            });
            state = "Units";
            let deliveryUpdate = await delivery.findOneAndUpdate(
              {
                tracking_id: x.tracking_id,
              },
              {
                $set: {
                  tray_status: "Ready to BQC",
                  tray_location: "Warehouse",
                  charging_done_close: Date.now(),
                  updated_at: Date.now(),
                },
              },
              {
                new: true,
                projection: { _id: 0 },
              }
            );
          }
          resolve(data);
        } else {
          resolve();
        }
      }
    });
  },

  /*-----------------AUDIT WORK IS DONE CLOSE THE TRAY--------------------------*/

  auditDoneClose: (trayData) => {
    return new Promise(async (resolve, reject) => {
      let data;
      let falg = false;
      let stage;
      if (trayData?.length == trayData?.limit && trayData.trayType == "WHT") {
        falg = true;
        stage = "Ready to RDL-1";
        data = await masters.findOneAndUpdate(
          { code: trayData.trayId },
          {
            $set: {
              rack_id: trayData.rackId,
              sort_id: "Ready to RDL-1",
              closed_time_wharehouse: Date.now(),
              actual_items: [],
              issued_user_name: null,
              "track_tray.audit_done_close_wh": Date.now(),
              from_merge: null,
              to_merge: null,
            },
          }
        );
      } else {
        if (trayData.length == 0) {
          stage = "Open";
          data = await masters.findOneAndUpdate(
            { code: trayData.trayId },
            {
              $set: {
                sort_id: "Open",
                actual_items: [],
                items: [],
                temp_array: [],
                track_tray: {},
                rack_id: trayData.rackId,
                issued_user_name: null,
              },
            }
          );
        } else if (
          trayData?.length == trayData?.limit &&
          trayData?.length !== 0
        ) {
          stage = "Ready to Transfer to Sales";
          data = await masters.findOneAndUpdate(
            { code: trayData.trayId },
            {
              $set: {
                sort_id: "Ready to Transfer to Sales",
                actual_items: [],
                issued_user_name: null,
                rack_id: trayData.rackId,
                "track_tray.audit_done_close_wh": Date.now(),
                from_merge: null,
                to_merge: null,
              },
            }
          );
        } else {
          stage = trayData.type;
          data = await masters.findOneAndUpdate(
            { code: trayData.trayId },
            {
              $set: {
                description: trayData.description,
                sort_id: trayData.type,
                rack_id: trayData.rackId,
                "track_tray.audit_done_close_wh": Date.now(),
                actual_items: [],
                issued_user_name: null,
              },
            }
          );
        }
      }
      if (data) {
        let state = "Tray";
        if (data?.items?.length == 0) {
          await unitsActionLog.create({
            action_type: stage,
            created_at: Date.now(),
            user_name_of_action: trayData.actioUser,
            user_type: "PRC Warehouse",
            tray_id: trayData.trayId,
            track_tray: state,
            rack_id: trayData.rackId,
            description: `${stage} closed by Wh:${trayData.actioUser}`,
          });
        }
        for (let x of data.items) {
          await unitsActionLog.create({
            action_type: stage,
            created_at: Date.now(),
            user_name_of_action: trayData.actioUser,
            user_type: "PRC Warehouse",
            uic: x.uic,
            tray_id: trayData.trayId,
            track_tray: state,
            rack_id: trayData.rackId,
            description: `${stage} closed by Wh:${trayData.actioUser}`,
          });
          state = "Units";
          let deliveryUpdate = await delivery.findOneAndUpdate(
            {
              tracking_id: x.tracking_id,
            },
            {
              $set: {
                tray_status: stage,
                tray_location: "Warehouse",
                audit_done_close: Date.now(),
                updated_at: Date.now(),
              },
            },
            {
              new: true,
              projection: { _id: 0 },
            }
          );
        }
        if (falg == true) {
          resolve({ status: 1 });
        } else {
          resolve({ status: 2 });
        }
      }
    });
  },

  /*-----------------WHT TRAY RETURN FROM BQC--------------------------*/

  returnFromBqcWht: (location) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        $or: [
          {
            prefix: "tray-master",
            type_taxanomy: "WHT",
            sort_id: "BQC Done",
            cpc: location,
          },
          {
            prefix: "tray-master",
            type_taxanomy: "WHT",
            sort_id: "Received From BQC",
            cpc: location,
          },
        ],
      });
      if (data) {
        resolve(data);
      }
    });
  },

  /*-----------------AUDIT DONE OTHER TRAY--------------------------*/

  returnFromAuditOtherTray: (location) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        $or: [
          {
            prefix: "tray-master",

            sort_id: "Audit Done",
            cpc: location,
          },
          {
            prefix: "tray-master",

            sort_id: "Received From Audit",
            cpc: location,
          },
        ],
      });
      if (data) {
        resolve(data);
      }
    });
  },
  /*-----------------RETURN FROM SORTING--------------------------*/

  returnFromBSorting: (location) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        $or: [
          {
            prefix: "tray-master",
            type_taxanomy: "WHT",
            sort_id: "Closed By Sorting Agent",
            cpc: location,
          },
          {
            prefix: "tray-master",
            type_taxanomy: "WHT",
            sort_id: "Received From Sorting",
            cpc: location,
          },
        ],
      });
      if (data) {
        resolve(data);
      }
    });
  },

  /*-----------------BQC DONE RECIEVED--------------------------*/

  bqcDoneRecieved: (trayData) => {
    return new Promise(async (resolve, reject) => {
      let tray = await masters.findOne({ code: trayData.trayId });
      if (tray?.actual_items?.length == trayData.counts) {
        let data = await masters.findOneAndUpdate(
          { code: trayData.trayId },
          {
            $set: {
              sort_id: "Received From BQC",
            },
          }
        );
        if (data) {
          let state = "Tray";
          for (let x of data.actual_items) {
            let unitsLogCreation = await unitsActionLog.create({
              action_type: "Received From BQC",
              created_at: Date.now(),
              user_name_of_action: trayData.actioUser,
              user_type: "PRC Warehouse",
              uic: x.uic,
              agent_name: data.issued_user_name,
              tray_id: trayData.trayId,
              track_tray: state,
              description: `Received From BQC agent :${data.issued_user_name} by Wh:${trayData.actioUser}`,
            });
            state = "Units";
            let deliveryTrack = await delivery.findOneAndUpdate(
              { tracking_id: x.tracking_id },
              {
                $set: {
                  tray_status: "Received From BQC",
                  tray_location: "Warehouse",
                  bqc_done_received: Date.now(),
                  updated_at: Date.now(),
                },
              },
              {
                new: true,
                projection: { _id: 0 },
              }
            );
          }
          resolve({ status: 1 });
        } else {
          resolve({ status: 2 });
        }
      } else {
        resolve({ status: 3 });
      }
    });
  },

  /*-------------------RECEIVED FROM AUDIT------------------------*/

  recievedFromAudit: (trayData) => {
    return new Promise(async (resolve, reject) => {
      let tray = await masters.findOne({ code: trayData.trayId });
      if (tray.items?.length == trayData.counts) {
        let data = await masters.findOneAndUpdate(
          { code: trayData.trayId },
          {
            $set: {
              sort_id: "Received From Audit",
            },
          }
        );
        if (data) {
          let state = "Tray";
          if (data?.items?.length == 0) {
            await unitsActionLog.create({
              action_type: "Received From Audit",
              created_at: Date.now(),
              user_name_of_action: trayData.actioUser,
              user_type: "PRC Warehouse",
              agent_name: data.issued_user_name,
              tray_id: trayData.trayId,
              track_tray: state,
              description: `Received From Audit agent :${data.issued_user_name} by Wh: ${trayData.actioUser}`,
            });
          }
          for (let x of data?.items) {
            await unitsActionLog.create({
              action_type: "Received From Audit",
              created_at: Date.now(),
              user_name_of_action: trayData.actioUser,
              user_type: "PRC Warehouse",
              uic: x.uic,
              agent_name: data.issued_user_name,
              tray_id: trayData.trayId,
              track_tray: state,
              description: `Received From Audit agent :${data.issued_user_name} by Wh: ${trayData.actioUser}`,
            });
            state = "Units";
            let deliveryTrack = await delivery.findOneAndUpdate(
              { tracking_id: x.tracking_id },
              {
                $set: {
                  tray_status: "Received From Audit",
                  tray_location: "Warehouse",
                  audit_done_recieved: Date.now(),
                  updated_at: Date.now(),
                },
              },
              {
                new: true,
                projection: { _id: 0 },
              }
            );
          }
          resolve({ status: 1 });
        } else {
          resolve({ status: 3 });
        }
      } else {
        resolve({ status: 2 });
      }
    });
  },

  /*-------------------RECEIVED FROM SORTING------------------------*/

  sortingDoneRecieved: (trayData) => {
    return new Promise(async (resolve, reject) => {
      let tray = await masters.findOne({ code: trayData.trayId });
      if (tray?.items?.length == trayData.counts) {
        if (tray.sort_id == "Ctx to Stx Sorting Done") {
          let data = await masters.findOneAndUpdate(
            { code: trayData.trayId },
            {
              $set: {
                sort_id: "Received From Sorting Agent After Ctx to Stx",
              },
            }
          );
          if (data) {
            let state = "Tray";
            if (data?.items?.length == 0) {
              await unitsActionLog.create({
                action_type: "Received From Sorting Agent After Ctx to Stx",
                created_at: Date.now(),
                agent_name: data.issued_user_name,
                user_type: "Sales Warehouse",
                tray_id: trayData.trayId,
                user_name_of_action: trayData.username,
                track_tray: state,
                description: `Received From Sorting Agent After Ctx to Stx agent: ${data.issued_user_name} By Wh:${trayData.username}`,
              });
            }
            for (let x of data.items) {
              let unitsLogCreation = await unitsActionLog.create({
                action_type: "Received From Sorting Agent After Ctx to Stx",
                created_at: Date.now(),
                agent_name: data.issued_user_name,
                user_type: "Sales Warehouse",
                uic: x.uic,
                tray_id: trayData.trayId,
                track_tray: state,
                user_name_of_action: trayData.username,
                description: `Received From Sorting Agent After Ctx to Stx agent: ${data.issued_user_name} By Wh:${trayData.username}`,
              });
              state = "Units";
              let updateDelivery = await delivery.findOneAndUpdate(
                {
                  tracking_id: x.tracking_id,
                },
                {
                  $set: {
                    tray_status: "Received From Sorting Agent After Ctx to Stx",
                    tray_location: "Sales Warehouse",
                    received_from_sorting: Date.now(),
                    updated_at: Date.now(),
                  },
                },
                {
                  new: true,
                  projection: { _id: 0 },
                }
              );
            }
            resolve({ status: 1 });
          }
        } else if (tray.type_taxanomy == "WHT") {
          let data = await masters.findOneAndUpdate(
            { code: trayData.trayId },
            {
              $set: {
                sort_id: "Received From Sorting",
                "track_tray.sorting_done_received": Date.now(),
              },
            }
          );
          if (data) {
            let state = "Tray";
            for (let x of data.items) {
              let unitsLogCreation = await unitsActionLog.create({
                action_type: "Received From Sorting (BOT TO WHT)",
                created_at: Date.now(),
                user_name_of_action: trayData.username,
                agent_name: data.issued_user_name,
                user_type: "PRC Warehouse",
                uic: x.uic,
                tray_id: trayData.trayId,
                track_tray: state,
                description: `Received From Sorting (BOT TO WHT) agent :${data.issued_user_name} By Wh:${trayData.username}`,
              });
              state = "Units";
              let updateDelivery = await delivery.findOneAndUpdate(
                {
                  tracking_id: x.tracking_id,
                },
                {
                  $set: {
                    tray_status: "Received From Sorting",
                    tray_location: "Warehouse",
                    received_from_sorting: Date.now(),
                    updated_at: Date.now(),
                  },
                },
                {
                  new: true,
                  projection: { _id: 0 },
                }
              );
            }
            resolve({ status: 1 });
          }
        }
      } else {
        resolve({ status: 2 });
      }
    });
  },

  /*-------------------SORTING REQUESTS------------------------*/

  getBotAndWhtSortingRequestTray: (username) => {
    return new Promise(async (resolve, reject) => {
      let data = [];
      let botTray = await masters.aggregate([
        {
          $match: {
            $or: [
              {
                sort_id: "Sorting Request Sent To Warehouse",
                issued_user_name: username,
              },
              {
                sort_id: "Assigned to sorting agent",
                issued_user_name: username,
              },
            ],
          },
        },
        {
          $lookup: {
            from: "trayracks",
            localField: "rack_id",
            foreignField: "rack_id",
            as: "rackData",
          },
        },
      ]);

      if (botTray) {
        resolve(botTray);
      }
    });
  },

  /*-------------------ACTUAL VS EXPECTED SCREEN------------------------*/

  getTrayForSortingExVsAt: (trayId) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.findOne({
        code: trayId,
      });
      if (data) {
        if (
          data.sort_id === "Merge Request Sent To Wharehouse" ||
          data.sort_id === "Sorting Request Sent To Warehouse" ||
          data.sort_id === "Audit Done Merge Request Sent To Wharehouse" ||
          data.sort_id == "Ready to BQC Merge Request Sent To Wharehouse" ||
          data.sort_id == "Ready to RDL-2 Merge Request Sent To Wharehouse" ||
          data.sort_id == "Ready to Audit Merge Request Sent To Wharehouse" ||
          data.sort_id == "Ctx to Stx Send for Sorting"
        ) {
          resolve({ data: data, status: 1 });
        } else {
          resolve({ data: data, status: 2 });
        }
      } else {
        resolve({ data: data, status: 3 });
      }
    });
  },

  /*---------------------SORTING CONFIRMATION----------------------*/

  assignToSortingConfirm: (trayData) => {
    return new Promise(async (resolve, reject) => {
      let data;
      for (let x of trayData.allTray) {
        data = await masters.findOneAndUpdate(
          { code: x.code },
          {
            $set: {
              sort_id: trayData.type,
              status_change_time: Date.now(),
              rack_id: null,
              issued_user_name: trayData.username,
              "track_tray.wh_issue_to_sorting": Date.now(),
            },
          }
        );

        if (
          trayData.type == "Issued to sorting agent" &&
          x.type_taxanomy == "BOT"
        ) {
          let state = "Tray";
          for (let y of data.items) {
            let unitsLogCreation = await unitsActionLog.create({
              action_type: "Issued to Sorting (BOT TO WHT)",
              created_at: Date.now(),
              user_name_of_action: trayData.actionUser,
              agent_name: data.issued_user_name,
              user_type: "PRC Warehouse",
              uic: y.uic,
              tray_id: x.code,
              track_tray: state,
              description: `Issued to Sorting (BOT TO WHT) agent : ${data.issued_user_name} By Wh: ${trayData.actionUser}`,
            });
            state = "Units";
            let deliveryUpdate = await delivery.findOneAndUpdate(
              { tracking_id: y.awbn_number },
              {
                $set: {
                  tray_location: "Sorting Agent",
                  tray_status: "Issued to Sorting",
                  sorting_agent_name: trayData.username,
                  handover_sorting_date: Date.now(),

                  updated_at: Date.now(),
                },
              },
              {
                new: true,
                projection: { _id: 0 },
              }
            );
          }
        }
      }
      if (data) {
        resolve(data);
      } else {
        resolve();
      }
    });
  },

  /*--------------------SORTING DONE CLOSE WHT TRAY----------------------*/

  whtTrayCloseAfterSorting: (trayData) => {
    return new Promise(async (resolve, reject) => {
      let data;
      if (trayData.items.length == trayData.limit) {
        data = await masters.findOneAndUpdate(
          { code: trayData.code },
          {
            $set: {
              sort_id: "Closed",
              closed_time_wharehouse: Date.now(),
              actual_items: [],
              rack_id: trayData.rackId,
              issued_user_name: null,
              sorting_done_close_wh: Date.now(),
            },
          }
        );
        if (data) {
          let state = "Tray";
          for (let x of data.items) {
            let unitsLogCreation = await unitsActionLog.create({
              action_type: "Ready for Charging",
              created_at: Date.now(),
              user_name_of_action: trayData.username,
              user_type: "PRC Warehouse",
              uic: x.uic,
              tray_id: trayData.code,
              track_tray: state,
              rack_id: trayData.rackId,
              description: `Ready for Charging Closed by Wh :${trayData.username}`,
            });
            state = "Units";
            let updateDelivery = await delivery.findOneAndUpdate(
              {
                tracking_id: x.tracking_id,
              },
              {
                $set: {
                  tray_status: "Closed",
                  tray_location: "Warehouse",
                  closed_from_sorting: Date.now(),

                  updated_at: Date.now(),
                },
              },
              {
                new: true,
                projection: { _id: 0 },
              }
            );
          }
          resolve({ status: 1 });
        }
      } else {
        data = await masters.findOneAndUpdate(
          { code: trayData.code },
          {
            $set: {
              sort_id: "Inuse",
              rack_id: trayData.rackId,
              closed_time_wharehouse: Date.now(),
              actual_items: [],
              issued_user_name: null,
              sorting_done_close_wh: Date.now(),
            },
          }
        );
        if (data) {
          for (let x of data.items) {
            let unitsLogCreation = await unitsActionLog.create({
              action_type: "Bot to wht sorting done",
              created_at: Date.now(),
              user_name_of_action: trayData.username,
              user_type: "PRC Warehouse",
              uic: x.uic,
              tray_id: trayData.code,
              description: `Bot to wht sorting done Closed by Wh :${trayData.username}`,
            });
            let updateDelivery = await delivery.findOneAndUpdate(
              {
                tracking_id: x.tracking_id,
              },
              {
                $set: {
                  tray_status: "Inuse",
                  tray_location: "Warehouse",
                  closed_from_sorting: Date.now(),
                  updated_at: Date.now(),
                },
              },
              {
                new: true,
                projection: { _id: 0 },
              }
            );
          }
          resolve({ status: 2 });
        }
      }
    });
  },

  /*--------------------FETCH MMT AND PMT REPORT----------------------*/

  getReportMmtPmt: (reportBasis) => {
    let date2 = moment
      .utc(new Date(new Date().toISOString().split("T")[0]), "DD-MM-YYYY")
      .toDate();
    let date1 = moment
      .utc(new Date(new Date().toISOString().split("T")[0]), "DD-MM-YYYY")
      .add(1, "days")
      .toDate();
    return new Promise(async (resolve, reject) => {
      let data = await delivery.aggregate([
        {
          $match: {
            tray_type: reportBasis.trayType,
            partner_shop: reportBasis.location,
            warehouse_close_date: {
              $lte: date1,
              $gte: date2,
            },
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "item_id",
            foreignField: "vendor_sku_id",
            as: "product",
          },
        },
        {
          $lookup: {
            from: "orders",
            localField: "order_id",
            foreignField: "order_id",
            as: "order",
          },
        },
      ]);
      resolve(data);
    });
  },

  /*----------------------BOT TRAY REPORT--------------------*/

  getBotTrayForReportScreen: (location) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        $and: [
          {
            cpc: location,
            type_taxanomy: "BOT",
            prefix: "tray-master",
            sort_id: { $ne: "Open" },
            temp_array: { $ne: [] },
            temp_array: { $exists: true },
          },
          {
            cpc: location,
            type_taxanomy: "BOT",
            prefix: "tray-master",
            sort_id: { $ne: "Issued" },
            temp_array: { $ne: [] },
            temp_array: { $exists: true },
          },
          {
            cpc: location,
            type_taxanomy: "BOT",
            prefix: "tray-master",
            sort_id: { $ne: "Received From BOT" },
            temp_array: { $ne: [] },
            temp_array: { $exists: true },
          },
          {
            cpc: location,
            type_taxanomy: "BOT",
            prefix: "tray-master",
            sort_id: { $ne: "Closed By Bot" },
            temp_array: { $ne: [] },
            temp_array: { $exists: true },
          },
        ],
      });
      if (data) {
        let arr = [];
        arr = data;
        for (let x of arr) {
          let i = 1;
          x.actual_items = [];
          for (let y of x.temp_array) {
            let getWht = await masters.find(
              {
                type_taxanomy: "WHT",
                prefix: "tray-master",
                "temp_array.tray_id": x.code,
                "temp_array.muic": y.muic,
              },
              {
                _id: 0,
                code: 1,
                temp_array: {
                  $elemMatch: {
                    tray_id: x.code,
                    muic: y.muic,
                  },
                },
              }
            );
            if (getWht.length !== 0) {
              let arr = [];
              for (let k of getWht) {
                let str = `${k.code}-(${k.temp_array.length})`;
                arr.push(str);
              }
              x.actual_items.push(
                `${y.brand} ${y.model}- units(${y.item.length}) -${arr.join(
                  ", "
                )} `
              );
            } else {
              x.actual_items.push(
                `${y.brand} ${y.model}- units(${y.item.length}) - No wht tray available`
              );
            }
            i++;
          }
        }
        resolve(arr);
      }
    });
  },

  /*-----------------MMT AND PMT REPORT DATE WAISE-------------------------*/

  getReportMmtPmtSort: (reportBasis) => {
    let date2 = moment.utc(new Date(reportBasis.date), "DD-MM-YYYY").toDate();
    let date1 = moment
      .utc(new Date(reportBasis.date), "DD-MM-YYYY")
      .add(1, "days")
      .toDate();

    return new Promise(async (resolve, reject) => {
      let data = await delivery.aggregate([
        {
          $match: {
            tray_type: reportBasis.trayType,
            partner_shop: reportBasis.location,
            warehouse_close_date: {
              $lt: date1,
              $gt: date2,
            },
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "item_id",
            foreignField: "vendor_sku_id",
            as: "product",
          },
        },
        {
          $lookup: {
            from: "orders",
            localField: "order_id",
            foreignField: "order_id",
            as: "order",
          },
        },
      ]);
      resolve(data);
    });
  },

  /*-----------------BOT TRAY REPORT RELATED DATA-------------------------*/

  getBotTrayReport: (location, trayId) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.findOne({
        $or: [
          {
            code: trayId,
            cpc: location,
            temp_array: { $ne: [] },
          },
        ],
      });

      if (data) {
        if (data.cpc == location) {
          for (let x of data.items) {
            for (let y of data.temp_array) {
              if (y.wht_tray == undefined) {
                y.wht_tray = [];
              }
              if (y.muic === x.muic) {
                let getCount = await masters.findOne({ code: x.wht_tray });
                if (x.wht_tray !== null) {
                  if (getCount?.items !== undefined) {
                    // let string = `${x.wht_tray} -(${getCount.items.length})`;
                    if (y.wht_tray.includes(x.wht_tray) === false) {
                      y.wht_tray.push(x.wht_tray);
                    }
                  } else {
                    let string = `${x.wht_tray} -0`;
                    if (y.wht_tray.includes(string) === false) {
                      y.wht_tray.push(string);
                    }
                  }
                }
              }
            }
          }

          resolve({ status: 1, data: data });
        } else if (data.cpc == location) {
          resolve({ status: 2 });
        }
      } else {
        resolve({ status: 3 });
      }
    });
  },
  /*-----------------BOT TRAY REPORT ITEM DETAILS-------------------------*/

  getItemDetailsOfBotTrayReport: (location, trayId, muic) => {
    return new Promise(async (resolve, reject) => {
      let trayItem = await masters.findOne(
        { code: trayId, cpc: location },
        {
          _id: 0,
          temp_array: { $elemMatch: { muic: muic } },
        }
      );
      if (trayItem) {
        resolve(trayItem);
      } else {
        resolve();
      }
    });
  },
  mmtMergerequest: (location) => {
    return new Promise(async (resolve, reject) => {
      let getMmttray = await masters
        .aggregate([
          {
            $match: {
              $or: [
                {
                  sort_id: "Merge Request Sent To Wharehouse",
                  cpc: location,
                  to_merge: { $ne: null },
                },
                {
                  sort_id: "Audit Done Merge Request Sent To Wharehouse",
                  cpc: location,
                  to_merge: { $ne: null },
                },
                {
                  sort_id: "Ready to BQC Merge Request Sent To Wharehouse",
                  cpc: location,
                  to_merge: { $ne: null },
                },
                {
                  sort_id: "Ready to RDL-2 Merge Request Sent To Wharehouse",
                  cpc: location,
                  to_merge: { $ne: null },
                },
                {
                  sort_id: "Ready to Audit Merge Request Sent To Wharehouse",
                  cpc: location,
                  to_merge: { $ne: null },
                },
              ],
            },
          },
          {
            $lookup: {
              from: "trayracks",
              localField: "rack_id",
              foreignField: "rack_id",
              as: "rackData",
            },
          },
        ])
        .catch((err) => reject(err));
      if (getMmttray) {
        resolve(getMmttray);
      }
    });
  },
  getFromAndToTrayMerge: (location, fromTray) => {
    return new Promise(async (resolve, reject) => {
      let arr = [];
      let data = await masters.aggregate([
        { $match: { cpc: location, code: fromTray } },
        {
          $lookup: {
            from: "trayracks",
            localField: "rack_id",
            foreignField: "rack_id",
            as: "rackData",
          },
        },
      ]);
      if (data.length !== 0) {
        let toTray = await masters.aggregate([
          {
            $match: {
              cpc: location,
              code: data?.[0].to_merge,
            },
          },
          {
            $lookup: {
              from: "trayracks",
              localField: "rack_id",
              foreignField: "rack_id",
              as: "rackData",
            },
          },
        ]);
        arr.push(data?.[0]);
        arr.push(toTray?.[0]);
        resolve(arr);
      } else {
        resolve();
      }
    });
  },

  /*-----------------ASSIGN TO SORTING AGENT-------------------------*/

  assignToSortingAgent: (user_name, fromTray, toTray, actionUser) => {
    return new Promise(async (resolve, reject) => {
      let checkFromTray = await masters.findOne({ code: fromTray });
      let updaFromTray, updaToTray;
      if (
        checkFromTray.sort_id == "Audit Done Merge Request Sent To Wharehouse"
      ) {
        updaFromTray = await masters.findOneAndUpdate(
          { code: fromTray },
          {
            $set: {
              assigned_date: Date.now(),
              rack_id: null,
              sort_id: "Audit Done Issued to Merging",
              "track_tray.issue_to_merging": Date.now(),
            },
          }
        );

        if (updaFromTray) {
          updaToTray = await masters.findOneAndUpdate(
            { code: toTray },
            {
              $set: {
                assigned_date: Date.now(),
                rack_id: null,
                sort_id: "Audit Done Issued to Merging",
                "track_tray.issue_to_merging": Date.now(),
              },
            }
          );
        } else {
          resolve({ status: 0 });
        }
      } else if (
        checkFromTray.sort_id == "Ready to BQC Merge Request Sent To Wharehouse"
      ) {
        updaFromTray = await masters.findOneAndUpdate(
          { code: fromTray },
          {
            $set: {
              assigned_date: Date.now(),
              rack_id: null,
              sort_id: "Ready to BQC Issued to Merging",
              "track_tray.issue_to_merging": Date.now(),
            },
          }
        );
        if (updaFromTray) {
          updaToTray = await masters.findOneAndUpdate(
            { code: toTray },
            {
              $set: {
                assigned_date: Date.now(),
                rack_id: null,
                sort_id: "Ready to BQC Issued to Merging",
                "track_tray.issue_to_merging": Date.now(),
              },
            }
          );
        } else {
          resolve({ status: 0 });
        }
      } else if (
        checkFromTray.sort_id ==
        "Ready to Audit Merge Request Sent To Wharehouse"
      ) {
        updaFromTray = await masters.findOneAndUpdate(
          { code: fromTray },
          {
            $set: {
              assigned_date: Date.now(),
              rack_id: null,
              sort_id: "Ready to Audit Issued to Merging",
              "track_tray.issue_to_merging": Date.now(),
            },
          }
        );
        if (updaFromTray) {
          updaToTray = await masters.findOneAndUpdate(
            { code: toTray },
            {
              $set: {
                assigned_date: Date.now(),
                rack_id: null,
                sort_id: "Ready to Audit Issued to Merging",
                "track_tray.issue_to_merging": Date.now(),
              },
            }
          );
        } else {
          resolve({ status: 0 });
        }
      } else if (
        checkFromTray.sort_id ==
        "Ready to RDL-2 Merge Request Sent To Wharehouse"
      ) {
        updaFromTray = await masters.findOneAndUpdate(
          { code: fromTray },
          {
            $set: {
              assigned_date: Date.now(),
              rack_id: null,
              sort_id: "Ready to RDL-2 Issued to Merging",
              "track_tray.issue_to_merging": Date.now(),
            },
          }
        );
        if (updaFromTray) {
          updaToTray = await masters.findOneAndUpdate(
            { code: toTray },
            {
              $set: {
                assigned_date: Date.now(),
                rack_id: null,
                sort_id: "Ready to RDL-2 Issued to Merging",
                "track_tray.issue_to_merging": Date.now(),
              },
            }
          );
        } else {
          resolve({ status: 0 });
        }
      } else if (checkFromTray.sort_id == "Ctx to Stx Send for Sorting") {
        updaFromTray = await masters.findOneAndUpdate(
          { code: fromTray },
          {
            $set: {
              assigned_date: Date.now(),
              rack_id: null,
              sort_id: "Issued to Sorting for Ctx to Stx",
              "track_tray.ctx_issued_sorting": Date.now(),
            },
          }
        );
        if (updaFromTray) {
          updaToTray = await masters.findOneAndUpdate(
            { code: toTray },
            {
              $set: {
                assigned_date: Date.now(),
                rack_id: null,
                sort_id: "Issued to Sorting for Ctx to Stx",
                "track_tray.ctx_issued_sorting": Date.now(),
              },
            }
          );
        } else {
          resolve({ status: 0 });
        }
      } else {
        updaFromTray = await masters.findOneAndUpdate(
          { code: fromTray },
          {
            $set: {
              assigned_date: Date.now(),
              rack_id: null,
              sort_id: "Issued to Merging",
              "track_tray.issue_to_merging": Date.now(),
            },
          }
        );
        if (updaFromTray) {
          updaToTray = await masters.findOneAndUpdate(
            { code: toTray },
            {
              $set: {
                assigned_date: Date.now(),
                rack_id: null,
                sort_id: "Issued to Merging",
                "track_tray.issue_to_merging": Date.now(),
              },
            }
          );
        } else {
          resolve({ status: 0 });
        }
      }
      let actUser = "PRC Warehouse";
      if (updaToTray.type_taxanomy == "ST") {
        actUser = "Sales Warehouse";
      }
      if (updaToTray) {
        let state = "Tray";
        for (let x of updaFromTray.items) {
          let deliveryUpdate = await delivery.findOneAndUpdate(
            { tracking_id: x.tracking_id },
            {
              $set: {
                tray_status: "Issued to merging",
                tray_location: "Sorting Agent",
                updated_at: Date.now(),
              },
            },
            {
              new: true,
              projection: { _id: 0 },
            }
          );
          const addLogsofUnits = await unitsActionLog.create({
            action_type: "Issued to merging",
            created_at: Date.now(),
            uic: x.uic,
            agent_name: updaFromTray.issued_user_name,
            user_name_of_action: actionUser,
            tray_id: updaFromTray.code,
            user_type: actUser,
            track_tray: state,
            description: `Issued for merging to agent :${updaFromTray.issued_user_name} by WH :${actionUser}`,
          });
          state = "Units";
        }
        let state1 = "Tray";
        for (let x of updaToTray.items) {
          let deliveryUpdate = await delivery.findOneAndUpdate(
            { tracking_id: x.tracking_id },
            {
              $set: {
                tray_status: "Issued to merging",
                tray_location: "Sorting Agent",
                updated_at: Date.now(),
              },
            },
            {
              new: true,
              projection: { _id: 0 },
            }
          );
          const addLogsofUnits = await unitsActionLog.create({
            action_type: "Issued to merging",
            created_at: Date.now(),
            uic: x.uic,
            agent_name: updaFromTray.issued_user_name,
            user_name_of_action: actionUser,
            tray_id: updaToTray.code,
            user_type: actUser,
            track_tray: state1,
            description: `Issued for merging to agent :${updaFromTray.issued_user_name} by WH :${actionUser}`,
          });
          state1 = "Units";
        }
        resolve({ status: 1 });
      } else {
        resolve({ status: 0 });
      }
    });
  },
  /*-----------------RETURN FROM MERGING-------------------------*/

  returnFromMerging: (location) => {
    return new Promise(async (resolve, reject) => {
      let getMmtTray = await masters.find({
        $or: [
          {
            cpc: location,
            prefix: "tray-master",
            sort_id: "Merging Done",
            items: { $ne: [] },
            type_taxanomy: "MMT",
          },
          {
            cpc: location,
            prefix: "tray-master",
            sort_id: "Merging Done",
            type_taxanomy: { $nin: ["MMT", "WHT"] },
          },
          {
            cpc: location,
            prefix: "tray-master",
            sort_id: "Merging Done",
            type_taxanomy: "WHT",
          },
          {
            cpc: location,
            refix: "tray-master",
            sort_id: "Received From Merging",
            items: { $ne: [] },
          },
          {
            cpc: location,
            refix: "tray-master",
            sort_id: "Received From Merging",
            type_taxanomy: { $nin: ["MMT", "WHT"] },
          },
          {
            cpc: location,
            refix: "tray-master",
            sort_id: "Received From Merging",
            type_taxanomy: "WHT",
          },
          {
            cpc: location,
            refix: "tray-master",
            sort_id: "Audit Done Return from Merging",
          },
          {
            cpc: location,
            refix: "tray-master",
            sort_id: "Audit Done Received From Merging",
          },
          {
            cpc: location,
            refix: "tray-master",
            sort_id: "Ready to RDL-2 Merging Done",
          },
          {
            cpc: location,
            refix: "tray-master",
            sort_id: "Ready to RDL-2 Received From Merging",
          },
          {
            cpc: location,
            refix: "tray-master",
            sort_id: "Ready to BQC Merging Done",
          },
          {
            cpc: location,
            refix: "tray-master",
            sort_id: "Ready to BQC Received From Merging",
          },
          {
            cpc: location,
            refix: "tray-master",
            sort_id: "Ready to Audit Merging Done",
          },
          {
            cpc: location,
            refix: "tray-master",
            sort_id: "Ready to Audit Received From Merging",
          },
        ],
      });

      if (getMmtTray) {
        resolve(getMmtTray);
      }
    });
  },
  mergeDoneTrayClose: (
    fromTray,
    toTray,
    type,
    length,
    limit,
    status,
    rackId,
    actioUser
  ) => {
    let data;
    let stage;
    return new Promise(async (resolve, reject) => {
      if (type !== "MMT" && type !== "WHT") {
        if (
          Number(length) == Number(limit) &&
          length !== undefined &&
          limit !== undefined &&
          type == "CT"
        ) {
          stage = "Ready to Transfer to Sales";
          data = await masters.findOneAndUpdate(
            { code: toTray },
            {
              $set: {
                rack_id: rackId,
                sort_id: "Ready to Transfer to Sales",
                actual_items: [],
                issued_user_name: null,
                from_merge: null,
                to_merge: null,
                closed_time_wharehouse: Date.now(),
              },
            }
          );
        } else if (length == 0) {
          stage = "Open";
          let updateFromTray = await masters.findOneAndUpdate(
            { code: toTray },
            {
              $set: {
                rack_id: rackId,
                sort_id: "Open",
                actual_items: [],
                track_tray: {},
                temp_array: [],
                items: [],
                count_of_c_display: 0,
                count_of_g_display: 0,
                issued_user_name: null,
                from_merge: null,
                to_merge: null,
                mrp_price: null,
                sp_price: null,
              },
            }
          );
          if (updateFromTray.modifiedCount !== 0) {
            resolve({ status: 1 });
          } else {
            resolve({ status: 0 });
          }
        } else if (type == "ST") {
          stage = "Inuse";
          data = await masters.findOneAndUpdate(
            { code: toTray },
            {
              $set: {
                rack_id: rackId,
                sort_id: "Inuse",
                actual_items: [],
                issued_user_name: null,
                from_merge: null,
                to_merge: null,
                closed_time_wharehouse: Date.now(),
              },
            }
          );
        } else {
          stage = "Audit Done Closed By Warehouse";
          data = await masters.findOneAndUpdate(
            { code: toTray },
            {
              $set: {
                rack_id: rackId,
                sort_id: "Audit Done Closed By Warehouse",
                actual_items: [],
                issued_user_name: null,
                from_merge: null,
                to_merge: null,
                closed_time_wharehouse: Date.now(),
              },
            }
          );
        }
      } else {
        if (length == 0 && type !== "MMT") {
          stage = "Open";
          let updateFromTray = await masters.updateOne(
            { code: toTray },
            {
              $set: {
                rack_id: rackId,
                sort_id: "Open",
                actual_items: [],
                temp_array: [],
                items: [],
                track_tray: {},
                issued_user_name: null,
                from_merge: null,
                to_merge: null,
              },
            }
          );
          if (updateFromTray.modifiedCount !== 0) {
            resolve({ status: 1 });
          }
        } else {
          if (status == "Audit Done Received From Merging") {
            if (limit == length) {
              stage = "Ready to RD-1";
              data = await masters.findOneAndUpdate(
                { code: toTray },
                {
                  $set: {
                    rack_id: rackId,
                    sort_id: "Ready to RDL-1",
                    actual_items: [],
                    issued_user_name: null,
                    from_merge: null,
                    to_merge: null,
                    closed_time_wharehouse: Date.now(),
                  },
                }
              );
            } else {
              stage = "Audit Done Closed By Warehouse";
              data = await masters.findOneAndUpdate(
                { code: toTray },
                {
                  $set: {
                    rack_id: rackId,
                    sort_id: "Audit Done Closed By Warehouse",
                    actual_items: [],
                    issued_user_name: null,
                    from_merge: null,
                    to_merge: null,
                    closed_time_wharehouse: Date.now(),
                  },
                }
              );
            }
          } else if (status == "Ready to RDL-2 Received From Merging") {
            stage = "Ready to RDL-2";
            data = await masters.findOneAndUpdate(
              { code: toTray },
              {
                $set: {
                  rack_id: rackId,
                  sort_id: "Ready to RDL-2",
                  actual_items: [],
                  issued_user_name: null,
                  from_merge: null,
                  to_merge: null,
                  closed_time_wharehouse: Date.now(),
                },
              }
            );
          } else if (status == "Ready to Audit Received From Merging") {
            stage = "Ready to Audit";
            data = await masters.findOneAndUpdate(
              { code: toTray },
              {
                $set: {
                  rack_id: rackId,
                  sort_id: "Ready to Audit",
                  actual_items: [],
                  issued_user_name: null,
                  from_merge: null,
                  to_merge: null,
                  closed_time_wharehouse: Date.now(),
                },
              }
            );
          } else if (status == "Ready to BQC Received From Merging") {
            stage = "Ready to BQC";
            data = await masters.findOneAndUpdate(
              { code: toTray },
              {
                $set: {
                  rack_id: rackId,
                  sort_id: "Ready to BQC",
                  actual_items: [],
                  issued_user_name: null,
                  from_merge: null,
                  to_merge: null,
                  closed_time_wharehouse: Date.now(),
                },
              }
            );
          } else {
            if (type == "WHT") {
              if (length == limit) {
                stage = "Closed";
                data = await masters.findOneAndUpdate(
                  { code: toTray },
                  {
                    $set: {
                      rack_id: rackId,
                      sort_id: "Closed",
                      actual_items: [],
                      issued_user_name: null,
                      from_merge: null,
                      to_merge: null,
                      closed_time_wharehouse: Date.now(),
                    },
                  }
                );
              } else {
                stage = "Inuse";
                data = await masters.findOneAndUpdate(
                  { code: toTray },
                  {
                    $set: {
                      rack_id: rackId,
                      sort_id: "Inuse",
                      actual_items: [],
                      issued_user_name: null,
                      from_merge: null,
                      to_merge: null,
                      closed_time_wharehouse: Date.now(),
                    },
                  }
                );
              }
            } else {
              stage = "Closed By Warehouse";
              data = await masters.findOneAndUpdate(
                { code: toTray },
                {
                  $set: {
                    rack_id: rackId,
                    sort_id: "Closed By Warehouse",
                    from_merge: null,
                    to_merge: null,
                    issued_user_name: null,
                    closed_time_wharehouse: Date.now(),
                  },
                }
              );
            }
          }
        }
      }
      let userType = "PRC Warehouse";
      if (data.type_taxanomy == "ST") {
        userType = "Sales Warehouse";
      }
      if (data) {
        let state = "Tray";
        for (let x of data.items) {
          let unitsLogCreation = await unitsActionLog.create({
            action_type: stage,
            created_at: Date.now(),
            user_name_of_action: actioUser,
            user_type: userType,
            uic: x.uic,
            tray_id: toTray,
            track_tray: state,
            rack_id: rackId,
            description: `${stage}  by WH :${actioUser}`,
          });
          state = "Units";
          let update = await delivery.findOneAndUpdate(
            {
              $or: [
                { tracking_id: x.awbn_number },
                { tracking_id: x.tracking_id },
              ],
            },
            {
              $set: {
                tray_close_wh_date: Date.now(),
                tray_location: "Warehouse",
                tray_status: stage,
                updated_at: Date.now(),
              },
            },
            {
              new: true,
              projection: { _id: 0 },
            }
          );
          // let updateElastic = await elasticsearch.uicCodeGen(update);
        }
        if (type == "MMT") {
          let updateFromTray = await masters.updateOne(
            { code: fromTray },
            {
              $set: {
                sort_id: "Open",
                actual_items: [],
                temp_array: [],
                items: [],
                track_tray: {},
                issued_user_name: null,
                from_merge: null,
                to_merge: null,
              },
            }
          );

          if (updateFromTray) {
            resolve({ status: 1 });
          } else {
            resolve({ status: 0 });
          }
        } else {
          resolve({ status: 1 });
        }
      } else {
        resolve({ status: 0 });
      }
    });
  },

  /*-----------------CHECK SORTING AGENT IS FREE OR NOT-------------------------*/

  getSortingAgentStatus: (username, toTray) => {
    return new Promise(async (resolve, reject) => {
      let userActive = await user.findOne({ user_name: username });
      if (userActive?.status == "Active") {
        let data = await masters.findOne({
          $or: [
            { issued_user_name: username, sort_id: "Issued to sorting agent" },
            { issued_user_name: username, sort_id: "Closed By Sorting Agent" },
            { issued_user_name: username, sort_id: "Issued to Merging" },
            { issued_user_name: username, sort_id: "Merging Done" },
            {
              issued_user_name: username,
              sort_id: "Issued to Sorting Agent For Display Grading",
            },
            {
              issued_user_name: username,
              sort_id: "Display Grading Done Closed By Sorting",
            },
            {
              issued_user_name: username,
              sort_id: "Issued to sorting (Wht to rp)",
              type_taxanomy: "WHT",
            },
            {
              issued_user_name: username,
              sort_id: "Sorting done (Wht to rp)",
            },
            {
              issued_user_name: username,
              sort_id: "Ready to Audit Issued to Merging",
            },
            {
              issued_user_name: username,
              sort_id: "Ready to RDL-2 Issued to Merging",
            },
            {
              issued_user_name: username,
              sort_id: "Ready to Audit Merging Done",
            },

            {
              issued_user_name: username,
              sort_id: "Ready to RDL-2 Merging Done",
            },
            {
              issued_user_name: username,
              sort_id: "Ready to BQC Merging Done",
            },
            {
              issued_user_name: username,
              sort_id: "Audit Done Issued to Merging",
            },
            {
              issued_user_name: username,
              sort_id: "Issued to Sorting for Ctx to Stx",
            },
            { issued_user_name: username, sort_id: "Ctx to Stx Sorting Done" },
            {
              issued_user_name: username,
              sort_id: "Issued to Sorting for Pickup",
              to_tray_for_pickup: { $ne: null },
            },
            {
              issued_user_name: username,
              sort_id: "Pickup Done Closed by Sorting Agent",
              to_tray_for_pickup: { $ne: null },
            },
            {
              issued_user_name: username,
              sort_id: "Issued to Sorting for Pickup",
              to_tray_for_pickup: null,
              code: { $ne: toTray },
            },
            {
              issued_user_name: username,
              sort_id: "Pickup Done Closed by Sorting Agent",
              to_tray_for_pickup: null,
              code: { $ne: toTray },
            },
          ],
        });
        if (data) {
          resolve({ status: 2 });
        } else {
          resolve({ status: 1 });
        }
      } else {
        resolve({ status: 3 });
      }
    });
  },
  /*-----------------CHECK AUDIT USER IS FREE OR NOT-------------------------*/

  checkAuditUserFreeOrNot: (username, brand, model) => {
    return new Promise(async (resolve, reject) => {
      let userActive = await user.findOne({ user_name: username });
      if (userActive.status == "Active") {
        let data = await masters.find({
          $or: [
            {
              issued_user_name: username,
              sort_id: "Issued to Audit",
            },
            {
              issued_user_name: username,
              sort_id: "Audit Done",
            },
          ],
        });

        if (data.length != 0) {
          for (let x of data) {
            if (x.type_taxanomy == "WHT") {
              resolve({ status: 2 });
            } else if (x.brand !== brand || x.model !== model) {
              resolve({ status: 2 });
            }
          }
          resolve({ status: 1 });
        } else {
          resolve({ status: 1 });
        }
      } else {
        resolve({ status: 3 });
      }
    });
  },

  checkTrayStatusAuditApprovePage: (trayId, location, brand, model) => {
    return new Promise(async (resolve, reject) => {
      for (let x of trayId) {
        for (let y in x) {
          let checkId = await masters.findOne({
            code: x[y],
            prefix: "tray-master",
            cpc: location,
          });

          if (checkId == null) {
            resolve({ status: 4, trayId: x[y] });
          } else if (checkId?.brand !== brand || checkId?.model !== model) {
            resolve({ status: 5, trayId: x[y] });
          } else if (checkId.tray_grade == y && checkId.type_taxanomy == "CT") {
            if (checkId.sort_id !== "Open") {
              resolve({ status: 3, trayId: x[y] });
            }
          } else {
            resolve({ status: 2, trayId: x[y], grade: y });
          }
        }
      }
      resolve({ status: 1 });
    });
  },
  auditTrayAssign: (trayData) => {
    return new Promise(async (resolve, reject) => {
      let issue;
      let obj = {
        WHT: trayData.whtTray,
      };
      trayData.trayId.push(obj);
      for (let x of trayData.trayId) {
        for (let code in x) {
          issue = await masters.findOneAndUpdate(
            { code: x[code] },
            {
              $set: {
                sort_id: "Issued to Audit",
                assigned_date: Date.now(),
                rack_id: null,
                description: trayData.description,
                issued_user_name: trayData.username,
                "track_tray.issue_to_audit_wh": Date.now(),
                actual_items: [],
                temp_array: [],
              },
            }
          );

          if (issue.type_taxanomy == "WHT") {
            let state = "Tray";
            for (let y of issue.items) {
              let unitsLogCreation = await unitsActionLog.create({
                action_type: "Issued to Audit",
                created_at: Date.now(),
                user_name_of_action: trayData.actioUser,
                user_type: "PRC Warehouse",
                uic: y.uic,
                tray_id: x[code],
                description: `Issued for Audit to agent :${issue.issued_user_name} by Wh:${trayData.actioUser}`,
                track_tray: state,
              });
              state = "Units";
              let updateTrack = await delivery.findOneAndUpdate(
                { tracking_id: y.tracking_id },
                {
                  $set: {
                    tray_location: "Audit",
                    issued_to_audit: Date.now(),
                    audit_user_name: issue.issued_user_name,
                    tray_status: "Issued to Audit",
                    "bqc_report.bqc_status": y?.bqc_status,
                    updated_at: Date.now(),
                  },
                },
                {
                  new: true,
                  projection: { _id: 0 },
                }
              );
            }
          }
        }
      }
      if (issue) {
        resolve({ status: 1 });
      } else {
        resolve({ status: 0 });
      }
    });
  },
  getAssignedTrayForAudit: (username, brand, model) => {
    return new Promise(async (resolve, reject) => {
      let arr = [];
      let grade = [];
      let data = await masters.find({
        type_taxanomy: { $ne: "WHT" },
        issued_user_name: username,
        sort_id: "Issued to Audit",
      });

      if (data.length != 0) {
        for (let x of data) {
          if (x.brand == brand && x.model == model) {
            arr.push(x.code);
            grade.push(x.tray_grade);
          }
        }
        resolve({ grade: grade, tray: arr });
      } else {
        resolve({ grade: grade, tray: arr });
      }
    });
  },
  getCtxCategorysForIssue: (grades) => {
    return new Promise(async (resolve, reject) => {
      const fetchData = await trayCategory.find({ code: { $nin: grades } });
      resolve(fetchData);
    });
  },
  whtTrayRelease: (trayId) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.updateOne(
        { code: trayId },
        {
          $set: {
            items: [],
            actual_items: [],
            temp_array: [],
            sort_id: "Open",
            track_tray: {},
            issued_user_name: null,
            description: "",
            from_merge: "",
            to_merge: "",
          },
        }
      );
      if (data.modifiedCount !== 0) {
        resolve(data);
      } else {
        resolve();
      }
    });
  },
  auditUserTray: (username, trayType, trayId, location) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.findOne({ code: trayId, cpc: location });
      let whtTray = await masters.findOne({
        prefix: "tray-master",
        type_taxanomy: "WHT",
        issued_user_name: username,
        sort_id: "Issued to Audit",
      });
      if (whtTray) {
        if (whtTray?.model == data.model && whtTray.brand == data.brand) {
          if (data) {
            if (data.tray_grade == trayType) {
              if (data.sort_id === "Open") {
                let checkUserStatus = await masters.findOne({
                  $or: [
                    {
                      tray_grade: trayType,
                      type_taxanomy: "CT",
                      issued_user_name: username,
                      sort_id: "Issued to Audit",
                    },
                    {
                      tray_grade: trayType,
                      type_taxanomy: "CT",
                      issued_user_name: username,
                      sort_id: "Audit Done",
                    },
                  ],
                });
                if (checkUserStatus) {
                  resolve({ status: 2, tray_status: data.sort_id });
                } else {
                  resolve({ status: 1, tray_status: data.sort_id });
                }
              } else {
                resolve({ status: 5, tray_status: data.sort_id });
              }
            } else {
              resolve({ status: 3, tray_status: data.sort_id });
            }
          } else {
            resolve({ status: 4, tray_status: data.sort_id });
          }
        } else {
          resolve({ status: 7 });
        }
      } else {
        resolve({ status: 6 });
      }
    });
  },
  oneTrayAssignToAudit: (userData) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.updateOne(
        { code: userData.tray_id },
        {
          $set: {
            issued_user_name: userData.username,
            actual_items: [],
            temp_array: [],
            assigned_date: Date.now(),
            sort_id: "Issued to Audit",
          },
        }
      );
      if (data.modifiedCount !== 0) {
        resolve(data);
      } else {
        resolve();
      }
    });
  },
  getReadyForAuditView: (trayId, status) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.findOne({ code: trayId });
      if (data) {
        if (data.sort_id == status) {
          resolve({ status: 1, tray: data });
        } else {
          resolve({ status: 2, tray: data });
        }
      } else {
        resolve({ status: 3 });
      }
    });
  },
  readyForRdlItemSegrigation: (itemData) => {
    return new Promise(async (resolve, reject) => {
      itemData.item.stage = itemData.stage;
      if (itemData.stage == "Shift to Sales Bin") {
        let udpateTray = await masters.updateOne(
          { code: itemData.trayId },
          {
            $push: {
              temp_array: itemData.item,
            },
          }
        );
        let update = await delivery.findOneAndUpdate(
          { "uic_code.code": itemData.uic },
          {
            $set: {
              tray_location: "Warehouse",
              sales_bin_status: "Sales Bin",
              sales_bin_date: Date.now(),
              sales_bin_grade: itemData.grade,
              sales_bin_wh_agent_name: itemData.username,
              sales_bin_desctiption: itemData.description,
            },
          }
        );
        if (udpateTray.modifiedCount != 0) {
          resolve({ status: 1 });
        }
      } else {
        let udpateTray = await masters.updateOne(
          { code: itemData.trayId },
          {
            $push: {
              actual_items: itemData.item,
            },
          }
        );
        if (udpateTray.modifiedCount != 0) {
          resolve({ status: 1 });
        }
      }
    });
  },
  checkUicCodeReadyForAudit: (uic, trayId) => {
    return new Promise(async (resolve, reject) => {
      let data = await delivery.findOne({ "uic_code.code": uic });
      if (data) {
        let checkExitThisTray = await masters.findOne({
          code: trayId,
          items: { $elemMatch: { uic: uic } },
        });
        if (checkExitThisTray) {
          let alreadyAdded = await masters.findOne({
            $or: [
              {
                code: trayId,
                "actual_items.uic": uic,
              },
              {
                code: trayId,
                "temp_array.uic": uic,
              },
            ],
          });
          if (alreadyAdded) {
            resolve({ status: 3 });
          } else {
            let obj;
            for (let x of checkExitThisTray.items) {
              if (x.uic == uic) {
                obj = x;
              }
            }
            resolve({ status: 4, data: obj });
          }
        } else {
          resolve({ status: 2 });
        }
      } else {
        resolve({ status: 1 });
      }
    });
  },
  getReadyForAuditClose: (trayData) => {
    return new Promise(async (reslove, reject) => {
      if (trayData.temp_array == 0) {
        let updateTray = await masters.updateOne(
          { code: trayData.trayId },
          {
            $set: {
              actual_items: [],
              temp_array: [],
              items: [],
              from_merge: null,
              to_merge: null,
              issued_user_name: null,
              sort_id: "Open",
              track_tray: {},
            },
          }
        );
        if (updateTray.modifiedCount != 0) {
          reslove({ status: 1 });
        } else {
          reslove({ status: 3 });
        }
      } else {
        let findTray = await masters.findOne({ code: trayData.trayId });
        if (findTray) {
          let updateTray = await masters.updateOne(
            { code: trayData.trayId },
            {
              $set: {
                sort_id: "Audit Done Closed By Warehouse",
                actual_items: [],
                temp_array: [],
                items: findTray.actual_items,
                issued_user_name: null,
                from_merge: null,
                to_merge: null,
                closed_time_wharehouse: Date.now(),
                description: trayData.description,
              },
            }
          );
          if (updateTray.modifiedCount != 0) {
            reslove({ status: 2 });
          }
        }
      }
    });
  },
  getSalesBinItem: (location) => {
    return new Promise(async (reslove, reject) => {
      let data = await delivery.find(
        {
          sales_bin_status: "Sales Bin",
        },
        {
          "uic_code.code": 1,
          sales_bin_date: 1,
          sales_bin_status: 1,
          sales_bin_grade: 1,
          sales_bin_wh_agent_name: 1,
          sales_bin_desctiption: 1,
          wht_tray: 1,
          _id: 0,
        }
      );
      let arr = [];
      if (data.length != 0) {
        for (let x of data) {
          let obj = {
            sales_bin_date: x.sales_bin_date,
            uic_code: x.uic_code.code,
            sales_bin_grade: x.sales_bin_grade,
            sales_bin_wh_agent_name: x.sales_bin_wh_agent_name,
            sales_bin_desctiption: x.sales_bin_desctiption,
            wht_tray: x.wht_tray,
          };

          arr.push(obj);
        }
      }
      if (data) {
        reslove(arr);
      }
    });
  },
  getSalesBinSearchData: (uic) => {
    return new Promise(async (reslove, reject) => {
      let data = await delivery
        .find({
          sales_bin_status: "Sales Bin",
          "uic_code.code": {
            $regex: ".*" + uic + ".*",
            $options: "i",
          },
        })
        .limit(10);
      let arr = [];
      if (data.length !== 0) {
        for (let x of data) {
          let obj = {
            sales_bin_date: x.sales_bin_date,
            uic_code: x.uic_code.code,
            sales_bin_grade: x.sales_bin_grade,
            sales_bin_wh_agent_name: x.sales_bin_wh_agent_name,
            sales_bin_desctiption: x.sales_bin_desctiption,
            wht_tray: x.wht_tray,
          };
          arr.push(obj);
        }
        reslove({ status: 1, item: arr });
      } else {
        reslove({ status: 2 });
      }
    });
  },
  ctxTray: (type, location) => {
    return new Promise(async (reslove, reject) => {
      if (type == "all") {
        let tray = await masters.aggregate([
          {
            $match: {
              prefix: "tray-master",
              cpc: location,
              type_taxanomy: {
                $in: ["CT"],
              },
            },
          },
          {
            $lookup: {
              from: "trayracks",
              localField: "rack_id",
              foreignField: "rack_id",
              as: "rackDetails",
            },
          },
        ]);
        if (tray) {
          reslove({ status: 1, tray: tray });
        }
      } else if (type == "Audit Done Closed By Warehouse") {
        let tray = await masters.aggregate([
          {
            $match: {
              $or: [
                {
                  prefix: "tray-master",
                  cpc: location,
                  sort_id: "Audit Done Closed By Warehouse",
                  type_taxanomy: {
                    $in: ["ST", "CT"],
                  },
                },
              ],
            },
          },
          {
            $lookup: {
              from: "trayracks",
              localField: "rack_id",
              foreignField: "rack_id",
              as: "rackData",
            },
          },
        ]);
        if (tray) {
          reslove({ status: 1, tray: tray });
        }
      } else if (type === "Ctx to Stx Send for Sorting") {
        let tray = await masters.find({
          prefix: "tray-master",
          cpc: location,
          sort_id: type,
          to_merge: { $ne: null },
          type_taxanomy: { $in: ["CT", "ST"] },
        });
        if (tray) {
          reslove({ status: 1, tray: tray });
        }
      } else if (type === "Transferred to Sales") {
        let tray = await masters.aggregate([
          {
            $match: {
              $or: [
                {
                  prefix: "tray-master",
                  cpc: location,
                  sort_id: "Transferred to Sales",

                  type_taxanomy: {
                    $in: ["CT", "RPA"],
                  },
                },
                {
                  prefix: "tray-master",
                  cpc: location,
                  sort_id: "Transferred to Processing",

                  type_taxanomy: {
                    $in: ["CT", "RPA"],
                  },
                },
              ],
            },
          },
          {
            $lookup: {
              from: "trayracks",
              localField: "rack_id",
              foreignField: "rack_id",
              as: "rackData",
            },
          },
        ]);
        if (tray) {
          reslove({ status: 1, tray: tray });
        }
      } else if (type === "Ready to Transfer") {
        let tray = await masters.aggregate([
          {
            $match: {
              $or: [
                {
                  prefix: "tray-master",
                  cpc: location,
                  sort_id: "Ready to Transfer to Sales",
                  type_taxanomy: {
                    $in: ["CT", "RPA"],
                  },
                },
                {
                  prefix: "tray-master",
                  cpc: location,
                  sort_id: "Ready to Transfer to Processing",
                  type_taxanomy: {
                    $in: ["CT", "RPA"],
                  },
                },
              ],
            },
          },
          {
            $lookup: {
              from: "trayracks",
              localField: "rack_id",
              foreignField: "rack_id",
              as: "rackData",
            },
          },
        ]);
        if (tray) {
          reslove({ status: 1, tray: tray });
        }
      } else if (type === "Accepted from Processing WH") {
        let tray = await masters.find({
          $or: [
            {
              prefix: "tray-master",
              type_taxanomy: {
                $in: ["CT", "RPA"],
              },
              sort_id: "Accepted from Processing WH",
              cpc: location,
            },
            {
              prefix: "tray-master",
              cpc: location,
              sort_id: "Accepted From Sales WH",
              type_taxanomy: {
                $in: ["CT", "RPA"],
              },
            },
            {
              prefix: "tray-master",
              cpc: location,
              sort_id: "Received From Processing",
              type_taxanomy: {
                $in: ["CT", "RPA"],
              },
            },
            {
              prefix: "tray-master",
              cpc: location,
              sort_id: "Received From Sales",
              type_taxanomy: {
                $in: ["CT", "RPA"],
              },
            },
          ],
        });
        if (tray) {
          reslove({ status: 1, tray: tray });
        }
      } else if (type == "Ready to Transfer to STX") {
        let tray = await masters.aggregate([
          {
            $match: {
              prefix: "tray-master",
              cpc: location,
              sort_id: type,
              type_taxanomy: {
                $in: ["CT"],
              },
            },
          },
          {
            $lookup: {
              from: "trayracks",
              localField: "rack_id",
              foreignField: "rack_id",
              as: "rackData",
            },
          },
        ]);
        if (tray) {
          reslove({ status: 1, tray: tray });
        }
      } else {
        let tray = await masters.aggregate([
          {
            $match: {
              prefix: "tray-master",
              cpc: location,
              sort_id: type,
              type_taxanomy: {
                $in: ["CT", "ST", "RPA"],
              },
            },
          },
          {
            $lookup: {
              from: "trayracks",
              localField: "rack_id",
              foreignField: "rack_id",
              as: "rackData",
            },
          },
        ]);
        if (tray) {
          reslove({ status: 1, tray: tray });
        }
      }
    });
  },
  pickupRequest: (location, type) => {
    return new Promise(async (resolve, reject) => {
      let tray = await masters.aggregate([
        {
          $match: {
            cpc: location,
            prefix: "tray-master",
            sort_id: type,
            to_tray_for_pickup: { $ne: null },
          },
        },
        {
          $lookup: {
            from: "trayracks",
            localField: "rack_id",
            foreignField: "rack_id",
            as: "rackData",
          },
        },
      ]);
      if (tray) {
        resolve(tray);
      }
    });
  },
  pickupePageRequestApprove: (location, fromTray) => {
    return new Promise(async (resolve, reject) => {
      let arr = [];
      let data = await masters.aggregate([
        {
          $match: {
            cpc: location,
            code: fromTray,
            sort_id: "Pickup Request sent to Warehouse",
          },
        },
        {
          $lookup: {
            from: "trayracks",
            localField: "rack_id",
            foreignField: "rack_id",
            as: "rackData",
          },
        },
      ]);
      if (data) {
        let toTray = await masters.aggregate([
          {
            $match: {
              cpc: location,
              code: data.to_tray_for_pickup,
            },
          },
          {
            $lookup: {
              from: "trayracks",
              localField: "rack_id",
              foreignField: "rack_id",
              as: "rackData",
            },
          },
        ]);
        arr.push(data);
        arr.push(toTray);
        resolve(arr);
      } else {
        resolve();
      }
    });
  },
  pickupApproveExvsAct: (trayId) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.findOne({
        code: trayId,
      });
      if (data) {
        if (data.sort_id === "Pickup Request sent to Warehouse") {
          resolve({ data: data, status: 1 });
        } else {
          resolve({ data: data, status: 2 });
        }
      } else {
        resolve({ data: data, status: 3 });
      }
    });
  },
  assigntoSoringForPickUp: (username, fromTray, toTray, actUser) => {
    return new Promise(async (resolve, reject) => {
      let updateToTray;
      let updateFromTray;
      updateToTray = await masters.findOneAndUpdate(
        {
          code: toTray,
          sort_id: "Pickup Request sent to Warehouse",
        },
        {
          $set: {
            issued_user_name: username,
            requested_date: Date.now(),
            actual_items: [],
            sort_id: "Issued to Sorting for Pickup",
          },
        }
      );
      if (updateToTray) {
        updateFromTray = await masters.findOneAndUpdate(
          {
            code: fromTray,
          },
          {
            $set: {
              issued_user_name: username,
              requested_date: Date.now(),
              actual_items: [],
              temp_array: [],
              rack_id: null,
              sort_id: "Issued to Sorting for Pickup",
            },
          }
        );
        if (updateFromTray && updateToTray) {
          let state = "Tray";
          for (let x of updateFromTray?.items) {
            let unitsLogCreation = await unitsActionLog.create({
              action_type: "Issued to Sorting for Pickup",
              created_at: Date.now(),
              user_name_of_action: actUser,
              agent_name: updateFromTray.issued_user_name,
              user_type: "PRC Warehouse",
              uic: x.uic,
              tray_id: fromTray,
              track_tray: state,
              description: `Issued to Sorting for Pickup to agent :${updateFromTray.issued_user_name} by Wh :${actUser}`,
            });
            state = "Units";
            let deliveryUpdate = await delivery.findOneAndUpdate(
              { tracking_id: x.tracking_id },
              {
                $set: {
                  tray_status: "Issued to Sorting for Pickup",
                  issued_to_agent_for_pickup: Date.now(),
                  tray_location: "Issued To Pickup",
                  updated_at: Date.now(),
                },
              },
              {
                new: true,
                projection: { _id: 0 },
              }
            );
          }
          resolve({ status: 1 });
        } else {
          resolve({ status: 2 });
        }
      } else {
        resolve({ status: 2 });
      }
    });
  },
  getPickDoneClosedBySorting: (location) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        $or: [
          {
            cpc: location,
            sort_id: "Pickup Done Closed by Sorting Agent",
          },
          {
            cpc: location,
            sort_id: "Pickup Done Received",
          },
        ],
      });
      if (data) {
        resolve(data);
      }
    });
  },
  pickupDoneRecieve: (trayData) => {
    return new Promise(async (resolve, reject) => {
      let tray = await masters.findOne({ code: trayData.trayId });
      if (tray.items.length == trayData.counts) {
        let update = await masters.findOneAndUpdate(
          { code: trayData.trayId },
          {
            $set: {
              sort_id: "Pickup Done Received",
            },
          }
        );
        if (update) {
          let state = "Tray";
          if (update?.items.length == 0) {
            let unitsLogCreation = await unitsActionLog.create({
              action_type: "Pickup Done Received",
              created_at: Date.now(),
              agent_name: update.issued_user_name,
              user_type: "PRC Warehouse",
              user_name_of_action: trayData.actUser,
              tray_id: update.code,
              track_tray: state,
              description: `Pickup Done Received to agent :${update.issued_user_name} by Wh :${trayData.actUser}`,
            });
          }
          for (let x of update?.items) {
            let unitsLogCreation = await unitsActionLog.create({
              action_type: "Pickup Done Received",
              created_at: Date.now(),
              agent_name: update.issued_user_name,
              user_type: "PRC Warehouse",
              uic: x.uic,
              tray_id: update.code,
              track_tray: state,
              user_name_of_action: trayData.actUser,
              description: `Pickup Done Received to agent :${update.issued_user_name} by Wh :${trayData.actUser}`,
            });
            state = "Units";
            let deliveryUpdate = await delivery.findOneAndUpdate(
              { tracking_id: x.tracking_id },
              {
                $set: {
                  tray_status: "Pickup Done Received",
                  tray_location: "Warehouse",
                  updated_at: Date.now(),
                },
              },
              {
                new: true,
                projection: { _id: 0 },
              }
            );
          }
          resolve({ status: 1 });
        } else {
          resolve({ status: 2 });
        }
      } else {
        resolve({ status: 3 });
      }
    });
  },
  pickupdoneClose: (trayData) => {
    return new Promise(async (resolve, reject) => {
      let data;
      let status;
      if (trayData.length == 0) {
        status = "Open";
        data = await masters.findOneAndUpdate(
          { code: trayData.trayId },
          {
            $set: {
              rack_id: trayData.rackId,
              sort_id: "Open",
              issued_user_name: null,
              actual_items: [],
              temp_array: [],
              pickup_type: null,
              items: [],
              track_tray: {},
              to_tray_for_pickup: null,
            },
          }
        );
      } else {
        status = "Ready to BQC";
        if (trayData.stage == "Charge Done") {
          data = await masters.findOneAndUpdate(
            { code: trayData.trayId },
            {
              $set: {
                rack_id: trayData.rackId,
                sort_id: "Ready to BQC",
                closed_time_wharehouse: Date.now(),
                issued_user_name: null,
                actual_items: [],
                temp_array: [],
                pickup_type: null,
                to_tray_for_pickup: null,
              },
            }
          );
        } else if (trayData.stage == "BQC Done") {
          status = "Ready to Audit";
          data = await masters.findOneAndUpdate(
            { code: trayData.trayId },
            {
              $set: {
                rack_id: trayData.rackId,
                sort_id: "Ready to Audit",
                issued_user_name: null,
                closed_time_wharehouse: Date.now(),
                actual_items: [],
                temp_array: [],
                pickup_type: null,
                to_tray_for_pickup: null,
              },
            }
          );
        } else if (trayData.stage == "Recharge") {
          status = "Closed";
          data = await masters.findOneAndUpdate(
            { code: trayData.trayId },
            {
              $set: {
                rack_id: trayData.rackId,
                sort_id: "Closed",
                issued_user_name: null,
                actual_items: [],
                temp_array: [],
                pickup_type: null,
                to_tray_for_pickup: null,
              },
            }
          );
        } else if (trayData.stage == "Inuse") {
          status = "Inuse";
          data = await masters.findOneAndUpdate(
            { code: trayData.trayId },
            {
              $set: {
                rack_id: trayData.rackId,
                sort_id: "Inuse",
                issued_user_name: null,
                actual_items: [],
                temp_array: [],
                pickup_type: null,
                to_tray_for_pickup: null,
              },
            }
          );
        } else if (trayData.stage == "Ready to RDL-2") {
          status = "Ready to RDL-2";
          data = await masters.findOneAndUpdate(
            { code: trayData.trayId },
            {
              $set: {
                rack_id: trayData.rackId,
                sort_id: "Ready to RDL-2",
                issued_user_name: null,
                actual_items: [],
                temp_array: [],
                pickup_type: null,
                to_tray_for_pickup: null,
              },
            }
          );
        } else if (trayData.stage == "RDL-2 done closed by warehouse") {
          status = "RDL-2 done closed by warehouse";
          data = await masters.findOneAndUpdate(
            { code: trayData.trayId },
            {
              $set: {
                rack_id: trayData.rackId,
                sort_id: "RDL-2 done closed by warehouse",
                closed_time_wharehouse: Date.now(),
                issued_user_name: null,
                actual_items: [],
                temp_array: [],
                pickup_type: null,
                to_tray_for_pickup: null,
              },
            }
          );
        } else {
          status = "Ready to RDL-1";
          data = await masters.findOneAndUpdate(
            { code: trayData.trayId },
            {
              $set: {
                rack_id: trayData.rackId,
                sort_id: "Ready to RDL-1",
                closed_time_wharehouse: Date.now(),
                issued_user_name: null,
                actual_items: [],
                temp_array: [],
                pickup_type: null,
                to_tray_for_pickup: null,
              },
            }
          );
        }
      }
      if (data) {
        let state = "Tray";
        if (data?.items.length == 0) {
          await unitsActionLog.create({
            action_type: status,
            created_at: Date.now(),
            agent_name: data.issued_user_name,
            user_type: "PRC Warehouse",
            tray_id: data.code,
            user_name_of_action: trayData.actUser,
            track_tray: state,
            description: `${status} Closed by warehoue by Wh :${trayData.actUser}`,
          });
        }
        for (let x of data?.items) {
          await unitsActionLog.create({
            action_type: status,
            created_at: Date.now(),
            agent_name: data.issued_user_name,
            user_type: "PRC Warehouse",
            uic: x.uic,
            tray_id: data.code,
            track_tray: state,
            user_name_of_action: trayData.actUser,
            description: `${status} Closed by warehoue by Wh :${trayData.actUser}`,
          });
          state = "Units";
          let deliveryTrack = await delivery.findOneAndUpdate(
            { tracking_id: x.tracking_id },
            {
              $set: {
                tray_status: status,
                tray_location: "Warehouse",
                updated_at: Date.now(),
              },
            },
            {
              new: true,
              projection: { _id: 0 },
            }
          );
        }

        resolve({ status: 1 });
      } else {
        resolve({ status: 0 });
      }
    });
  },
  checkRdlFlsUserStatus: (username) => {
    return new Promise(async (resolve, reject) => {
      let userActive = await user.findOne({ user_name: username });
      if (userActive.status == "Active") {
        let data = await masters.findOne({
          $or: [
            { issued_user_name: username, sort_id: "Issued to RDL-1" },
            { issued_user_name: username, sort_id: "Closed By RDL-1" },
          ],
        });

        if (data) {
          resolve({ status: 2 });
        } else {
          resolve({ status: 1 });
        }
      } else {
        resolve({ status: 3 });
      }
    });
  },
  checkRdl2UserStatus: (username) => {
    return new Promise(async (resolve, reject) => {
      let userActive = await user.findOne({ user_name: username });
      if (userActive.status == "Active") {
        let data = await masters.findOne({
          $or: [
            {
              issued_user_name: username,
              sort_id: "Issued to RDL-2",
              type_taxanomy: "RPT",
            },
            {
              issued_user_name: username,
              sort_id: "Closed By RDL-2",
              type_taxanomy: "RPT",
            },
            {
              issued_user_name: username,
              sort_id: "Rdl-2 in-progress",
              type_taxanomy: "RPT",
            },
          ],
        });

        if (data) {
          resolve({ status: 2 });
        } else {
          resolve({ status: 1 });
        }
      } else {
        resolve({ status: 3 });
      }
    });
  },
  getRequestForApproval: (status, location, type) => {
    return new Promise(async (resolve, reject) => {
      let data;
      if (status == "Display Grading Done Closed By Sorting") {
        data = await masters.aggregate([
          {
            $match: {
              $or: [
                {
                  prefix: "tray-master",
                  type_taxanomy: type,
                  sort_id: status,
                  cpc: location,
                },
                {
                  prefix: "tray-master",
                  type_taxanomy: type,
                  sort_id: "Received From Sorting After Display Grading",
                  cpc: location,
                },
              ],
            },
          },
          {
            $lookup: {
              from: "trayracks",
              localField: "rack_id",
              foreignField: "rack_id",
              as: "rackData",
            },
          },
        ]);
      } else {
        data = await masters.aggregate([
          {
            $match: {
              $or: [
                {
                  prefix: "tray-master",
                  type_taxanomy: type,
                  sort_id: status,
                  cpc: location,
                },
              ],
            },
          },
          {
            $lookup: {
              from: "trayracks",
              localField: "rack_id",
              foreignField: "rack_id",
              as: "rackData",
            },
          },
        ]);
      }
      if (data) {
        resolve(data);
      }
    });
  },

  addWhtActualReturnRdl: (trayItemData) => {
    return new Promise(async (resolve, reject) => {
      let checkAlreadyAdded = await masters.findOne({
        code: trayItemData.trayId,
        "actual_items.uic": trayItemData.item.uic,
      });
      if (checkAlreadyAdded) {
        resolve({ status: 3 });
      } else {
        let data = await masters.updateOne(
          { code: trayItemData.trayId },
          {
            $push: {
              actual_items: trayItemData.item,
            },
          }
        );
        if (data.matchedCount != 0) {
          resolve({ status: 1 });
        } else {
          resolve({ status: 2 });
        }
      }
    });
  },
  getRDLonereturn: (status, location) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        $or: [
          {
            prefix: "tray-master",
            type_taxanomy: "WHT",
            sort_id: status,
            cpc: location,
          },
          {
            prefix: "tray-master",
            type_taxanomy: "WHT",
            sort_id: "Received From RDL-1",
            cpc: location,
          },
        ],
      });
      if (data) {
        resolve(data);
      }
    });
  },

  issueToagentWhtReciveRdOne: (trayData) => {
    return new Promise(async (resolve, reject) => {
      if (trayData.sortId == "Closed by RDL-1") {
        data = await masters.findOneAndUpdate(
          { code: trayData?.trayId },
          {
            $set: {
              actual_items: [],
              description: trayData?.description,
              temp_array: [],
              sort_id: "Recived from RDL-1",
              assigned_date: Date.now(),
            },
          }
        );
        if (data) {
          resolve(data);
        } else {
          resolve();
        }
      }
    });
  },

  RDLoneDoneRecieved: (trayData) => {
    return new Promise(async (resolve, reject) => {
      let tray = await masters.findOne({ code: trayData.trayId });
      if (tray?.items?.length == trayData.counts) {
        let data = await masters.findOneAndUpdate(
          { code: trayData.trayId },
          {
            $set: {
              sort_id: "Received From RDL-1",
            },
          }
        );
        if (data) {
          let state = "Tray";
          for (let x of data.items) {
            let unitsLogCreation = await unitsActionLog.create({
              action_type: "Recevied From RDL-1",
              created_at: Date.now(),
              user_name_of_action: trayData.actioUser,
              agent_name: data.issued_user_name,
              user_type: "PRC Warehouse",
              uic: x.uic,
              tray_id: trayData.trayId,
              track_tray: state,
              description: `Recevied From RDL-1 to agent :${data.issued_user_name} by Wh :${trayData.actioUser}`,
            });
            state = "Units";
            let deliveryTrack = await delivery.findOneAndUpdate(
              { tracking_id: x.tracking_id },
              {
                $set: {
                  tray_status: "Recevied From RDL-1",
                  tray_location: "Warehouse",
                  rdl_fls_done_recieved_date: Date.now(),
                  updated_at: Date.now(),
                },
              },
              {
                new: true,
                projection: { _id: 0 },
              }
            );
          }
          resolve({ status: 1 });
        } else {
          resolve({ status: 2 });
        }
      } else {
        resolve({ status: 3 });
      }
    });
  },

  getWhtTrayitemRdlreturn: (trayId, sortId) => {
    return new Promise(async (resolve, reject) => {
      if (sortId == "Received From RDL_one") {
        let data = await masters.findOne({ code: trayId });
        if (data) {
          resolve({ data: data, status: 1 });
        } else {
          resolve({ data: data, status: 2 });
        }
      } else {
        let data = await masters.findOne({ code: trayId });
        if (data) {
          if (data.sort_id == sortId) {
            resolve({ data: data, status: 1 });
          } else {
            resolve({ data: data, status: 3 });
          }
        } else {
          resolve({ data: data, status: 2 });
        }
      }
    });
  },
  getTrayItmes: (trayId) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.findOne({ code: trayId });
      if (data) {
        resolve(data);
      }
    });
  },
  checkUicCodeRDLDone: (uic, trayId) => {
    return new Promise(async (resolve, reject) => {
      let data = await delivery.findOne({ "uic_code.code": uic });
      if (data) {
        let checkExitThisTray = await masters.findOne({
          code: trayId,
          items: { $elemMatch: { uic: uic } },
        });
        if (checkExitThisTray) {
          let alreadyAdded = await masters.findOne({
            code: trayId,
            "actual_item.uic": uic,
          });
          if (alreadyAdded) {
            resolve({ status: 3 });
          } else {
            let obj;
            for (let x of checkExitThisTray.actual_items) {
              if (x.uic == uic) {
                obj = x;
              }
            }
            resolve({ status: 4, data: obj });
          }
        } else {
          resolve({ status: 2 });
        }
      } else {
        resolve({ status: 1 });
      }
    });
  },
  rdlFlsDoneClose: (trayData) => {
    return new Promise(async (resolve, reject) => {
      let data;
      if (trayData.length == 0) {
        data = await masters.updateOne(
          { code: trayData.trayId },
          {
            $set: {
              rack_id: trayData.rackId,
              actual_items: [],
              description: trayData.description,
              temp_array: [],
              sort_id: "Open",
              items: [],
              closed_time_wharehouse: Date.now(),
              assigned_date: Date.now(),
              issued_user_name: null,
              "track_tray.rdl_1_done_close_by_wh": Date.now(),
            },
          }
        );
        if (data.modifiedCount !== 0) {
          const addLogsofUnits = await unitsActionLog.create({
            action_type: "Open",
            created_at: Date.now(),
            tray_id: data.code,
            rack_id: trayData.rackId,
            user_name_of_action: trayData.actUser,
            description: `Open state closed by agent :${trayData.actUser}`,
            track_tray: state,
            user_type: "PRC Warehouse",
          });
          resolve(data);
        } else {
          resolve();
        }
      } else {
        data = await masters.findOneAndUpdate(
          { code: trayData.trayId },
          {
            $set: {
              rack_id: trayData.rackId,
              actual_items: [],
              description: trayData.description,
              temp_array: [],
              sort_id: "Ready to RDL-2",
              closed_time_wharehouse: Date.now(),
              assigned_date: Date.now(),
              issued_user_name: null,
              "track_tray.rdl_1_done_close_by_wh": Date.now(),
            },
          }
        );
      }
      if (data) {
        let state = "Tray";
        if (data?.items.length == 0) {
          const addLogsofUnits = await unitsActionLog.create({
            action_type: "Ready to RDL-2",
            created_at: Date.now(),
            tray_id: data.code,
            rack_id: trayData.rackId,
            user_name_of_action: trayData.actUser,
            description: `Ready to RDL-2 closed by agent :${trayData.actUser}`,
            track_tray: state,
            user_type: "PRC Warehouse",
          });
        }
        for (let x of data.items) {
          if (trayData.screen == "return-from-wht-to-rp-sorting") {
            let deliveryUpdate = await delivery.findOneAndUpdate(
              { tracking_id: x.tracking_id },
              {
                $set: {
                  tray_status: "Ready to RDL-2",
                  wht_to_rp_sorting_done_wh_closed: Date.now(),
                  tray_location: "Warehouse",
                  tray_status: "Ready to RDL-2",
                  updated_at: Date.now(),
                },
              },
              {
                new: true,
                projection: { _id: 0 },
              }
            );
          } else {
            let deliveryUpdate = await delivery.findOneAndUpdate(
              { tracking_id: x.tracking_id },
              {
                $set: {
                  tray_status: "Ready to RDL-2",
                  rdl_fls_done_closed_wh: Date.now(),
                  updated_at: Date.now(),
                },
              },
              {
                new: true,
                projection: { _id: 0 },
              }
            );
          }
          const addLogsofUnits = await unitsActionLog.create({
            action_type: "Ready to RDL-2",
            created_at: Date.now(),
            uic: x.uic,
            tray_id: data.code,
            rack_id: trayData.rackId,
            user_name_of_action: trayData.actUser,
            description: `Ready to RDL-2 closed by agent :${trayData.actUser}`,
            track_tray: state,
            user_type: "PRC Warehouse",
          });
          state = "Units";
        }
      }

      if (data) {
        resolve(data);
      } else {
        resolve();
      }
    });
  },
  rdlTwoDoneClose: (trayData) => {
    return new Promise(async (resolve, reject) => {
      let data;
      data = await masters.findOneAndUpdate(
        { code: trayData.trayId },
        {
          $set: {
            actual_items: [],
            description: trayData.description,
            temp_array: [],
            rack_id: trayData.rackId,
            issued_user_name: null,
            sort_id: "RDL-2 done closed by warehouse",
          },
        }
      );
      if (data) {
        let state = "Tray";
        for (let x of data.items) {
          await unitsActionLog.create({
            action_type: "RDL-2 done closed by warehouse",
            created_at: Date.now(),
            uic: x.uic,
            user_name_of_action: trayData.actionUser,
            tray_id: trayData.trayId,
            user_type: "PRC Warehouse",
            track_tray: state,
            rack_id: trayData.rackId,
            user_name_of_action: trayData.actionUser,
            description: `RDL-2 done closed by warehouse by WH :${trayData.actionUser}`,
          });
          state = "Units";
          let deliveryUpdate = await delivery.findOneAndUpdate(
            { tracking_id: x.tracking_id },
            {
              $set: {
                tray_status: "RDL-2 done closed by warehouse",
                rdl_two_done_close_by_warehouse: Date.now(),
                tray_location: "Warehouse",
                updated_at: Date.now(),
              },
            },
            {
              new: true,
              projection: { _id: 0 },
            }
          );
        }
      }
      if (data) {
        resolve(data);
      } else {
        resolve();
      }
    });
  },
  ctxTrayTransferApprove: (trayData) => {
    return new Promise(async (resolve, reject) => {
      if (trayData.page == "Mis-ctx-receive") {
        let data;
        for (let x of trayData.ischeck) {
          data = await masters.updateOne(
            { code: x },
            {
              $set: {
                sort_id: trayData.sortId,
                recommend_location: null,
                actual_items: [],
                temp_array: [],
                "track_tray.ctx_transfer_to_sales": Date.now(),
              },
            }
          );
        }
        if (data.modifiedCount != 0) {
          resolve({ status: 3 });
        } else {
          resolve({ status: 0 });
        }
      } else if (trayData.page == "Sales-Warehouse-approve") {
        let data;
        if (trayData.length != "0") {
          data = await masters.findOneAndUpdate(
            { code: trayData.trayId },
            {
              $set: {
                sort_id: trayData.sortId,
                recommend_location: null,
                rack_id: trayData.rackId,
                actual_items: [],
                temp_array: [],
              },
            }
          );
          if (data) {
            let state = "Tray";
            for (let x of data.items) {
              const addLogsofUnits = await unitsActionLog.create({
                action_type:
                  "Tray Received from processing and closed by sales warehouse",
                created_at: Date.now(),
                uic: x.uic,
                tray_id: trayData.trayId,
                description: `Ready to Transfer to STX closed by agent :${trayData.actUser}`,
                track_tray: state,
                rack_id: trayData.rackId,
                user_type: `Sales Warehouse`,
                user_name_of_action: trayData.actUser,
              });
              state = "Units";
              let updateTrack = await delivery.findOneAndUpdate(
                { tracking_id: x.tracking_id },
                {
                  $set: {
                    ctx_tray_receive_and_close_wh: Date.now(),
                    tray_location: "Sales-warehouse",
                    updated_at: Date.now(),
                  },
                },
                {
                  new: true,
                  projection: { _id: 0 },
                }
              );
            }
            resolve({ status: 4 });
          } else {
            resolve({ status: 0 });
          }
        } else {
          data = await masters.findOneAndUpdate(
            { code: trayData.trayId },
            {
              $set: {
                sort_id: "Open",
                recommend_location: null,
                issued_user_name: null,
                rack_id: trayData.rackId,
                actual_items: [],
                temp_array: [],
                track_tray: {},
                to_merge: null,
                from_merge: null,
              },
            }
          );

          if (data) {
            await unitsActionLog.create({
              action_type: "Received from sales and closed by warehouse",
              created_at: Date.now(),
              tray_id: data.trayId,
              description: `Received from sales and closed by warehouse by agent :${trayData.actUser}`,
              track_tray: "Tray",
              rack_id: trayData.rackId,
              user_name_of_action: trayData.actUser,
              user_type: `Processing Warehouse`,
            });
            resolve({ status: 5 });
          }
        }
        if (data.modifiedCount != 0) {
          resolve({ status: 5 });
        } else {
          resolve({ status: 0 });
        }
      } else {
        let data;
        if (trayData.sortId == "Transferred to Sales") {
          data = await masters.findOneAndUpdate(
            { code: trayData.trayId },
            {
              $set: {
                cpc: trayData.sales_location,
                description: trayData.description,
                sort_id: trayData.sortId,
                recommend_location: null,
                actual_items: [],
                rack_id: null,
                "track_tray.ctx_transfer_to_sales": Date.now(),
                temp_array: [],
              },
            }
          );
        } else {
          data = await masters.findOneAndUpdate(
            { code: trayData.trayId },
            {
              $set: {
                cpc: trayData.sales_location,
                description: trayData.description,
                sort_id: trayData.sortId,
                recommend_location: null,
                actual_items: [],
                rack_id: null,
                "track_tray.ctx_transfer_to_processing": Date.now(),
                temp_array: [],
              },
            }
          );
        }
        if (data) {
          let state = "Tray";
          if (data.items.length == 0) {
            const addLogsofUnits = await unitsActionLog.create({
              action_type: "Tray Transffer",
              created_at: Date.now(),
              tray_id: trayData.trayId,
              description: `${trayData.sortId} by agent :${trayData.actUser}`,
              track_tray: state,
              user_type: `${trayData.userCpcType} Warehouse`,
              user_name_of_action: trayData.actUser,
            });
          }
          for (let x of data.items) {
            const addLogsofUnits = await unitsActionLog.create({
              action_type: "Tray Transffer",
              created_at: Date.now(),
              uic: x.uic,
              tray_id: trayData.trayId,
              user_name_of_action: trayData.actUser,
              description: `${trayData.sortId} by agent :${trayData.actUser}`,
              track_tray: state,
              user_type: `${trayData.userCpcType} Warehouse`,
            });
            state = "Units";
            let updateTrack = await delivery.findOneAndUpdate(
              { tracking_id: x.tracking_id },
              {
                $set: {
                  ctx_tray_transferTo_sales_date: Date.now(),
                  tray_Id: x.tray_id,
                  updated_at: Date.now(),
                },
              },
              {
                new: true,
                projection: { _id: 0 },
              }
            );
          }
          resolve({ status: 1 });
        } else {
          resolve({ status: 0 });
        }
      }
    });
  },
  ctxTransferReceive: (trayData) => {
    return new Promise(async (resolve, reject) => {
      let tray = await masters.findOne({ code: trayData.trayId });
      let data;
      if (tray?.items?.length == trayData.counts) {
        if (tray.sort_id == "Accepted from Processing WH") {
          data = await masters.findOneAndUpdate(
            { code: trayData.trayId },
            {
              $set: {
                sort_id: "Received From Processing",
              },
            }
          );
        } else {
          data = await masters.findOneAndUpdate(
            { code: trayData.trayId },
            {
              $set: {
                sort_id: "Received From Sales",
              },
            }
          );
        }
        if (data) {
          if (tray.sort_id == "Accepted from Processing WH") {
            for (let i = 0; i < data.actual_items.length; i++) {
              let deliveryTrack = await delivery.findOneAndUpdate(
                { tracking_id: data.actual_items[i].tracking_id },
                {
                  $set: {
                    tray_status: "Received From Processing",
                    ctx_tray_receive: Date.now(),
                    tray_location: "Sales-warehouse",
                    updated_at: Date.now(),
                  },
                },
                {
                  new: true,
                  projection: { _id: 0 },
                }
              );
              // let updateElasticSearch = await elasticsearch.uicCodeGen(
              //   deliveryTrack
              // );
            }
            resolve({ status: 1 });
          } else {
            for (let i = 0; i < data.actual_items.length; i++) {
              let deliveryTrack = await delivery.findOneAndUpdate(
                { tracking_id: data.actual_items[i].tracking_id },
                {
                  $set: {
                    tray_status: "Received From Sales",
                    ctx_tray_receive: Date.now(),
                    tray_location: "Processing-warehouse",
                    updated_at: Date.now(),
                  },
                },
                {
                  new: true,
                  projection: { _id: 0 },
                }
              );
              // let updateElasticSearch = await elasticsearch.uicCodeGen(
              //   deliveryTrack
              // );
            }
            resolve({ status: 1 });
          }
        } else {
          resolve({ status: 2 });
        }
      } else {
        resolve({ status: 3 });
      }
    });
  },
  /*------------------------------CTX TO STX---------------------------*/
  sortingCtxToStxTray: (location) => {
    return new Promise(async (resolve, reject) => {
      let tray = await masters.find({
        $or: [
          {
            prefix: "tray-master",
            sort_id: "Ctx to Stx Sorting Done",
            cpc: location,
          },
          {
            prefix: "tray-master",
            sort_id: "Received From Sorting Agent After Ctx to Stx",
            cpc: location,
          },
        ],
      });
      resolve(tray);
    });
  },
  sortingDonectxTostxCloseLogData: (items, trayId, stage, username, rackId) => {
    return new Promise(async (resolve, reject) => {
      let state = "Tray";
      if (items.length == 0) {
        const addLogsofUnits = await unitsActionLog.create({
          action_type: stage,
          created_at: Date.now(),
          tray_id: trayId,
          rack_id: rackId,
          user_name_of_action: username,
          description: `${stage} closed by agent :${username}`,
          track_tray: state,
          user_type: "Sales Warehouse",
        });
      }
      for (let x of items) {
        let findDelivery = await delivery.findOne(
          {
            "uic_code.code": x?.uic,
            sp_price: { $exists: false }, // Filter out documents with null or missing sp_price
            mrp_price: { $exists: false },
          },
          { audit_report: 1, final_grade: 1, item_id: 1 }
        );
        let findPrice = null;
        if (findDelivery) {
          if (findDelivery?.audit_report?.sub_muic !== undefined) {
            findPrice = await delivery.findOne({
              item_moved_to_billed_bin: { $exists: false },
              stx_tray_id: { $exists: true },
              tray_type: "ST",
              sp_price: { $exists: true }, // Filter out documents with null or missing sp_price
              mrp_price: { $exists: true },
              final_grade: findDelivery.final_grade,
              "audit_report.sub_muic": findDelivery?.audit_report?.sub_muic,
            });
          } else {
            findPrice = await delivery.findOne({
              item_moved_to_billed_bin: { $exists: false },
              stx_tray_id: { $exists: true },
              tray_type: "ST",
              sp_price: { $exists: true }, // Filter out documents with null or missing sp_price
              mrp_price: { $exists: true },
              final_grade: x.grade,
              "audit_report.sub_muic": { $exists: false },
              item_id: findDelivery.item_id,
            });
          }
          if (findPrice) {
            let updatePrice = await delivery.updateOne(
              {
                "uic_code.code": x?.uic,
              },
              {
                $set: {
                  sp_price: findPrice?.sp_price,
                  mrp_price: findPrice?.mrp_price,
                },
              }
            );
          }
        }
        const addLogsofUnits = await unitsActionLog.create({
          action_type: stage,
          created_at: Date.now(),
          uic: x.uic,
          tray_id: trayId,
          rack_id: rackId,
          user_name_of_action: username,
          description: `${stage} closed by agent :${username}`,
          track_tray: state,
          user_type: "Sales Warehouse",
        });
        state = "Units";
      }
      resolve();
    });
  },
  sortingDoneCtxStxClose: (trayData) => {
    return new Promise(async (resolve, reject) => {
      let dataUpdate;
      if (trayData.type == "ST") {
        let findMrpSp = await masters.findOne(
          {
            brand: trayData?.brand,
            model: trayData?.model,
            tray_grade: trayData?.grade,
            sp_price: { $exists: true, $ne: null },
            mrp_price: { $exists: true, $ne: null },
          },
          { sp_price: 1, mrp_price: 1 }
        );
        if (trayData.itemCount == "0") {
          dataUpdate = await masters.findOneAndUpdate(
            { code: trayData.trayId },
            {
              $set: {
                rack_id: trayData.rackId,
                issued_user_name: null,
                actual_items: [],
                temp_array: [],
                from_merge: null,
                to_merge: null,
                sort_id: "Open",
                "track_tray.ctx_sorting_done": Date.now(),
                track_tray: {},
                description: trayData.description,
              },
            }
          );
          if (dataUpdate) {
            resolve({ status: 3 });
          } else {
            resolve({ status: 0 });
          }
        } else {
          if (findMrpSp) {
            dataUpdate = await masters.findOneAndUpdate(
              { code: trayData.trayId },
              {
                $set: {
                  rack_id: trayData.rackId,
                  issued_user_name: null,
                  actual_items: [],
                  temp_array: [],
                  from_merge: null,
                  to_merge: null,
                  sort_id: "Inuse",
                  sp_price: findMrpSp?.sp_price,
                  mrp_price: findMrpSp?.mrp_price,
                  rack_id: trayData.rackId,
                  "track_tray.ctx_sorting_done": Date.now(),
                  closed_time_wharehouse: Date.now(),
                  description: trayData.description,
                },
              }
            );
          } else {
            dataUpdate = await masters.findOneAndUpdate(
              { code: trayData.trayId },
              {
                $set: {
                  rack_id: trayData.rackId,
                  issued_user_name: null,
                  actual_items: [],
                  temp_array: [],
                  from_merge: null,
                  to_merge: null,
                  sort_id: "Inuse",
                  rack_id: trayData.rackId,
                  "track_tray.ctx_sorting_done": Date.now(),
                  closed_time_wharehouse: Date.now(),
                  description: trayData.description,
                },
              }
            );
          }
        }
        if (dataUpdate) {
          resolve({ status: 6, tray: dataUpdate });
        } else {
          resolve({ status: 0 });
        }
      } else {
        if (trayData.itemCount == "0") {
          dataUpdate = await masters.findOneAndUpdate(
            { code: trayData.trayId },
            {
              $set: {
                rack_id: trayData.rackId,
                issued_user_name: null,
                actual_items: [],
                temp_array: [],
                from_merge: null,
                to_merge: null,
                "track_tray.ctx_sorting_done": Date.now(),
                sort_id: "Ready to Transfer to Processing",
                description: trayData.description,
              },
            }
          );
          if (dataUpdate) {
            resolve({ status: 2, tray: dataUpdate });
          } else {
            resolve({ status: 0 });
          }
        } else {
          dataUpdate = await masters.findOneAndUpdate(
            { code: trayData.trayId },
            {
              $set: {
                rack_id: trayData.rackId,
                issued_user_name: null,
                actual_items: [],
                temp_array: [],
                from_merge: null,
                to_merge: null,
                "track_tray.ctx_sorting_done": Date.now(),
                sort_id: "Ready to Transfer to STX",
                description: trayData.description,
              },
            }
          );
          if (dataUpdate) {
            resolve({ status: 3, tray: dataUpdate });
          } else {
            resolve({ status: 0 });
          }
        }
      }
    });
  },
  /*------------------------------STX TRAY --------------------------------------*/
  stxTray: (type, location) => {
    return new Promise(async (reslove, reject) => {
      if (type == "all") {
        let tray = await masters.aggregate([
          {
            $match: {
              prefix: "tray-master",
              cpc: location,
              type_taxanomy: "ST",
            },
          },
          {
            $lookup: {
              from: "trayracks",
              localField: "rack_id",
              foreignField: "rack_id",
              as: "rackDetails",
            },
          },
          {
            $project: {
              rackDetails: 1,
              code: 1,
              rack_id: 1,
              brand: 1,
              model: 1,
              sort_id: 1,
              created_at: 1,
              limit: 1,
              tray_grade: 1,
              name: 1,
              type_taxanomy: 1,
              issued_user_name: 1,
              items_length: {
                $cond: {
                  if: { $isArray: "$items" },
                  then: { $size: "$items" },
                  else: 0,
                },
              },
              actual_items: {
                $cond: {
                  if: { $isArray: "$actual_items" },
                  then: { $size: "$actual_items" },
                  else: 0,
                },
              },
            },
          },
        ]);
        if (tray) {
          reslove({ status: 1, tray: tray });
        }
      } else if (type == "Audit Done Closed By Warehouse") {
        let tray = await masters.find({
          $or: [
            {
              prefix: "tray-master",
              cpc: location,
              sort_id: "Audit Done Closed By Warehouse",
              type_taxanomy: "ST",
            },
          ],
        });
        if (tray) {
          reslove({ status: 1, tray: tray });
        }
      } else if (type == "Merge") {
        let tray = await masters.aggregate([
          {
            $match: {
              $or: [
                {
                  prefix: "tray-master",
                  cpc: location,
                  sort_id: "Inuse",
                  type_taxanomy: "ST",
                  $expr: {
                    $and: [
                      { $ne: [{ $ifNull: ["$items", null] }, null] },
                      { $ne: [{ $size: "$items" }, { $toInt: "$limit" }] },
                    ],
                  },
                },
              ],
            },
          },
          {
            $lookup: {
              from: "trayracks",
              localField: "rack_id",
              foreignField: "rack_id",
              as: "rackData",
            },
          },
        ]);
        if (tray) {
          reslove({ status: 1, tray: tray });
        }
      } else {
        let tray = await masters.aggregate([
          {
            $match: {
              $or: [
                {
                  prefix: "tray-master",
                  cpc: location,
                  sort_id: type,
                  type_taxanomy: "ST",
                },
              ],
            },
          },
          {
            $lookup: {
              from: "trayracks",
              localField: "rack_id",
              foreignField: "rack_id",
              as: "rackData",
            },
          },
        ]);
        if (tray) {
          reslove({ status: 1, tray: tray });
        }
      }
    });
  },
  billedBinPageData: (location) => {
    return new Promise(async (resolve, reject) => {
      let tray = await masters.aggregate([
        {
          $match: {
            $or: [{ cpc: location, type_taxanomy: "ST", sort_id: "Inuse" }],
          },
        },
        {
          $unwind: "$items",
        },
      ]);
      resolve(tray);
    });
  },
  itemMoviedToBillBin: (uic, trayId, username) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.findOneAndUpdate(
        {
          code: trayId,
        },
        {
          $pull: {
            items: {
              uic: uic,
            },
          },
        },
        { new: true }
      );
      let updateDelivery = await delivery.findOneAndUpdate(
        { "uic_code.code": uic },
        {
          $set: {
            item_moved_to_billed_bin_done_username: username,
            item_moved_to_billed_bin_date: Date.now(),
            item_moved_to_billed_bin: "Yes",
          },
        }
      );
      if (data.items.length == 0) {
        let trayUpdate = await masters.findOneAndUpdate(
          {
            code: trayId,
          },
          {
            $set: {
              sort_id: "Open",
              actual_items: [],
              track_tray: {},
              issued_user_name: null,
              temp_array: [],
            },
          },
          { new: true }
        );
        if (trayUpdate) {
          resolve({ status: 1 });
        }
      } else if (data) {
        resolve({ status: 1 });
      } else {
        resolve({ status: 2 });
      }
    });
  },
  billedBinReport: () => {
    return new Promise(async (resolve, reject) => {
      let getData = await delivery.aggregate([
        {
          $match: {
            item_moved_to_billed_bin: "Yes",
          },
        },
        {
          $lookup: {
            from: "products",
            localField: `item_id`,
            foreignField: "vendor_sku_id",
            as: "products",
          },
        },
      ]);
      resolve(getData);
    });
  },
  whtToRpRequests: (location) => {
    return new Promise(async (resolve, reject) => {
      const getTray = await masters.find({
        prefix: "tray-master",
        type_taxanomy: "RPT",
        cpc: location,
        sort_id: "Assigned to sorting (Wht to rp)",
      });

      resolve(getTray);
    });
  },
  whtToRpWhtTrayScan: (location, whtTray) => {
    return new Promise(async (resolve, reject) => {
      let trayData = [];
      for (let tray of whtTray) {
        const data = await masters.aggregate([
          { $match: { cpc: location, code: tray } },
          {
            $lookup: {
              from: "trayracks",
              localField: "rack_id",
              foreignField: "rack_id",
              as: "rackData",
            },
          },
        ]);
        if (data) {
          trayData.push(data[0]);
        }
      }
      resolve(trayData);
    });
  },
  whtToRpIssueToAgent: (rpTray, whtTray, actUser) => {
    return new Promise(async (resolve, reject) => {
      whtTray.push(rpTray);
      let rptTrayUpdate;
      for (let tray of whtTray) {
        rptTrayUpdate = await masters.findOneAndUpdate(
          { code: tray },
          {
            $set: {
              sort_id: "Issued to sorting (Wht to rp)",
              assigned_date: Date.now(),
              rack_id: null,
              "track_tray.wht_to_rp_sorting_issued": Date.now(),
              actual_items: [],
            },
          }
        );
        if (rptTrayUpdate) {
          let state = "Tray";
          for (let x of rptTrayUpdate?.items) {
            let unitsLogCreation = await unitsActionLog.create({
              action_type: "Issued to sorting (Wht to rp)",
              created_at: Date.now(),
              user_name_of_action: actUser,
              agent_name: rptTrayUpdate.issued_user_name,
              user_type: "PRC Warehouse",
              uic: x.uic,
              tray_id: tray,
              track_tray: state,
              description: `Issued to sorting (Wht to rp) to agent :${rptTrayUpdate.issued_user_name} by Wh :${actUser}`,
            });
            state = "Units";
            const updateDelivery = await delivery.findOneAndUpdate(
              { "uic_code.code": x.uic },
              {
                $set: {
                  tray_location: "Sorting agent",
                  tray_status: "Issued to sorting (Wht to rp)",
                  issued_to_wht_to_rp: Date.now(),
                  wht_to_rp_sorting_agent: rptTrayUpdate.issued_user_name,
                },
              }
            );
          }
        }
      }
      if (rptTrayUpdate) {
        resolve({ status: 1 });
      } else {
        resolve({ status: 0 });
      }
    });
  },
  getReturnFromSortingWhtToRp: (location) => {
    return new Promise(async (resolve, reject) => {
      const data = await masters.find({
        $or: [
          {
            prefix: "tray-master",
            sort_id: "Sorting done (Wht to rp)",
            cpc: location,
          },
          {
            prefix: "tray-master",
            sort_id: "Received from sorting (Wht to rp)",
            cpc: location,
          },
        ],
      });
      resolve(data);
    });
  },
  receivedFromWhtToRpSorting: (trayData) => {
    return new Promise(async (resolve, reject) => {
      let tray = await masters.findOne({ code: trayData.trayId });
      if (tray?.items?.length == trayData.counts) {
        let data = await masters.findOneAndUpdate(
          { code: trayData.trayId },
          {
            $set: {
              sort_id: "Received from sorting (Wht to rp)",
              "track_tray.wht_to_rp_sorting_done_recived_wh": Date.now(),
            },
          }
        );
        if (data) {
          let state = "Tray";
          if (data?.items.length == 0) {
            await unitsActionLog.create({
              action_type: "Received from sorting (Wht to rp)",
              created_at: Date.now(),
              user_name_of_action: trayData.actUser,
              agent_name: data.issued_user_name,
              user_type: "PRC Warehouse",
              tray_id: trayData.trayId,
              track_tray: state,
              description: `Received from sorting (Wht to rp) to agent :${data.issued_user_name} by Wh :${trayData.actUser}`,
            });
          }
          for (let x of data.items) {
            await unitsActionLog.create({
              action_type: "Received from sorting (Wht to rp)",
              created_at: Date.now(),
              user_name_of_action: trayData.actUser,
              agent_name: data.issued_user_name,
              user_type: "PRC Warehouse",
              uic: x.uic,
              tray_id: trayData.trayId,
              track_tray: state,
              description: `Received from sorting (Wht to rp) to agent :${data.issued_user_name} by Wh :${trayData.actUser}`,
            });
            state = "Units";
            let deliveryTrack = await delivery.findOneAndUpdate(
              { tracking_id: x.tracking_id },
              {
                $set: {
                  tray_status: "Received from sorting (Wht to rp)",
                  tray_location: "Warehouse",
                  wht_to_rp_sorting_done_received: Date.now(),
                  updated_at: Date.now(),
                },
              },
              {
                new: true,
                projection: { _id: 0 },
              }
            );
          }
          resolve({ status: 1 });
        } else {
          resolve({ status: 2 });
        }
      } else {
        resolve({ status: 3 });
      }
    });
  },
  getUpgradeUnistData: (location) => {
    return new Promise(async (resolve, reject) => {
      const findUpgardeUnits = await delivery.find({
        partner_shop: location,
        "audit_report.stage": "Upgrade",
      });
      resolve({ upgaradeReport: findUpgardeUnits });
    });
  },
  upgardeUnitsFilter: (location, fromDate, toDate, type) => {
    return new Promise(async (resolve, reject) => {
      let monthWiseReport, getCount;
      const fromDateTimestamp = new Date(fromDate);
      fromDateTimestamp.setHours(0, 0, 0, 0); // Set time to the beginning of the day
      const toDateTimestamp = new Date(toDate);
      toDateTimestamp.setHours(23, 59, 59, 999);
      monthWiseReport = await delivery.find({
        partner_shop: location,
        "audit_report.stage": "Upgrade",
        audit_done_date: { $gte: fromDateTimestamp, $lte: toDateTimestamp },
      });

      resolve({
        monthWiseReport: monthWiseReport,
      });
    });
  },
  rackIdUpdateGetTrayData: (trayId, location, username) => {
    return new Promise(async (resolve, reject) => {
      const data = await masters.findOne({ code: trayId, cpc: location });
      if (data) {
        if (username !== data.issued_user_name) {
          resolve({ tray: data, status: 1 });
        } else {
          resolve({ status: 2 });
        }
      } else {
        resolve({ status: 3 });
      }
    });
  },
  updateTheRackId: (
    trayId,
    rackid,
    description,
    sortId,
    agentName,
    actionUser,
    prevStatus
  ) => {
    return new Promise(async (resolve, reject) => {
      let updateRackId;
      let stage;
      if (sortId == "Assigned to warehouae for rack change") {
        stage = "Issued to scan in for rack change";
        updateRackId = await masters.findOneAndUpdate(
          { code: trayId },
          {
            $set: {
              sort_id: "Issued to scan in for rack change",
              issued_user_name: agentName,
              description: description,
              actual_items: [],
              rack_id: null,
            },
          }
        );
      } else {
        stage = prevStatus;
        updateRackId = await masters.findOneAndUpdate(
          { code: trayId },
          {
            $set: {
              rack_id: rackid,
              description: description,
              actual_items: [],
              issued_user_name: null,
              rdl_2_user_temp: null,
              sort_id: prevStatus,
              temp_rack: null,
            },
          }
        );
      }
      if (updateRackId) {
        let state = "Tray";
        if (updateRackId?.items.length == 0) {
          await unitsActionLog.create({
            action_type: stage,
            created_at: Date.now(),
            tray_id: updateRackId.code,
            track_tray: state,
            rack_id: rackid,
            user_type: "Warehouse",
            user_name_of_action: actionUser,
            description: `${sortId} closed by the agent :${actionUser}`,
          });
        }
        for (let x of updateRackId.items) {
          await unitsActionLog.create({
            action_type: stage,
            created_at: Date.now(),
            uic: x.uic,
            tray_id: updateRackId.code,
            track_tray: state,
            rack_id: rackid,
            user_type: "Warehouse",
            description: `${sortId} closed by the agent :${actionUser}`,
          });
          state = "Units";
        }
        resolve({ status: 1 });
      } else {
        resolve({ status: 0 });
      }
    });
  },
  getRackChangeRequest: (username, sortId, location) => {
    let data = [];
    return new Promise(async (resolve, reject) => {
      if (sortId == "MIS") {
        data = await masters.aggregate([
          {
            $match: {
              cpc: location,
              sort_id: "Assigned to warehouae for rack change",
              temp_rack: null,
            },
          },
          {
            $lookup: {
              from: "trayracks",
              localField: "rack_id",
              foreignField: "rack_id",
              as: "rackData",
            },
          },
        ]);
      } else if (sortId == "Issued to scan in for rack change") {
        data = await masters.aggregate([
          {
            $match: {
              $or: [
                {
                  issued_user_name: username,
                  sort_id: sortId,
                },
                {
                  issued_user_name: username,
                  sort_id: "Received for rack change",
                },
              ],
            },
          },
          {
            $lookup: {
              from: "trayracks",
              localField: "rack_id",
              foreignField: "rack_id",
              as: "rackData",
            },
          },
        ]);
      } else {
        data = await masters.aggregate([
          {
            $match: {
              issued_user_name: username,
              sort_id: sortId,
              temp_rack: { $ne: null },
            },
          },
          {
            $lookup: {
              from: "trayracks",
              localField: "rack_id",
              foreignField: "rack_id",
              as: "rackData",
            },
          },
        ]);
      }
      if (data) {
        resolve(data);
      }
    });
  },
  receiVeTheTrayForRackChange: (trayData) => {
    return new Promise(async (resolve, reject) => {
      const tray = await masters.findOne(
        { code: trayData.trayId },
        { items: 1, issued_user_name: 1 }
      );
      if (tray?.items?.length == trayData.counts) {
        let update = await masters.findOneAndUpdate(
          { code: trayData.trayId },
          {
            $set: {
              sort_id: "Received for rack change",
            },
          }
        );
        if (update) {
          let state = "Tray";
          for (let x of update.items) {
            let unitsLogCreation = await unitsActionLog.create({
              action_type: "Received for rack change",
              created_at: Date.now(),
              user_type: "PRC Warehouse",
              uic: x.uic,
              tray_id: trayData.trayId,
              user_name_of_action: update.issued_user_name,
              track_tray: state,
              description: `Received for rack change by Wh :${update.issued_user_name}`,
            });
            state = "Units";
          }
          resolve({ status: 1 });
        } else {
          resolve({ status: 2 });
        }
      } else {
        resolve({ status: 3 });
      }
    });
  },
  stxToStxUtilityScanUic: (uic) => {
    return new Promise(async (resolve, reject) => {
      const data = await stxUtility
        .find({
          uic: uic,
          added_status: { $ne: "Added" },
        })
        .sort({ _id: -1 });
      if (data.length !== 0) {
        const checkIntrayOrnot = await masters.findOne({ "items.uic": uic });
        if (checkIntrayOrnot) {
          if (checkIntrayOrnot.type_taxanomy == "ST") {
            for (let statusSet of data) {
              statusSet["system_status"] = "IN STX";
              statusSet["current_system_tray"] = checkIntrayOrnot.code;
            }
            resolve({ status: 1, uicData: data });
          } else if (checkIntrayOrnot.type_taxanomy == "CT") {
            for (let statusSet of data) {
              statusSet["system_status"] = "IN CTX";
              statusSet["current_system_tray"] = checkIntrayOrnot.code;
            }
            resolve({ status: 1, uicData: data });
          } else {
            resolve({ status: 2, trayId: checkIntrayOrnot.code });
          }
        } else {
          let checkDelivery = await delivery.findOne(
            { "uic_code.code": uic },
            { sales_bin_status: 1, item_moved_to_billed_bin: 1 }
          );
          if (checkDelivery) {
            if (checkDelivery.sales_bin_status !== undefined) {
              for (let statusSet of data) {
                statusSet["system_status"] = "IN SALES BIN";
              }
              resolve({ status: 1, uicData: data });
            } else if (checkDelivery.item_moved_to_billed_bin !== undefined) {
              for (let statusSet of data) {
                statusSet["system_status"] = "IN BILLED BIN";
              }
              resolve({ status: 1, uicData: data });
            }
          } else {
            resolve({ status: 4 });
          }
        }
      } else {
        resolve({ status: 0 });
      }
    });
  },
  receivedFromSortingAfterDisplayGrade: async (trayData) => {
    try {
      let tray = await masters.findOne({ code: trayData.trayId });
      if (tray?.items?.length == trayData.counts) {
        let data = await masters.findOneAndUpdate(
          { code: trayData.trayId },
          {
            $set: {
              sort_id: "Received From Sorting After Display Grading",
            },
          }
        );
        if (data) {
          let state = "Tray";
          for (let x of data.items) {
            let unitsLogCreation = await unitsActionLog.create({
              action_type: "Received From Sorting After Display Grading",
              created_at: Date.now(),
              user_name_of_action: trayData.actioUser,
              user_type: "Sales Warehouse",
              uic: x.uic,
              agent_name: data.issued_user_name,
              tray_id: trayData.trayId,
              track_tray: state,
              description: `Received From Sorting After Display Grading agent:${data.issued_user_name} by Wh:${trayData.actioUser}`,
            });
            state = "Units";
            let deliveryTrack = await delivery.findOneAndUpdate(
              { tracking_id: x.tracking_id },
              {
                $set: {
                  tray_status: "Received From Sorting After Display Grading",
                  tray_location: "Sales Warehouse",
                  copy_grading_done_received: Date.now(),
                  updated_at: Date.now(),
                },
              },
              {
                new: true,
                projection: { _id: 0 },
              }
            );
          }
          return { status: 1 };
        } else {
          return { status: 2 };
        }
      } else {
        return { status: 3 };
      }
    } catch (error) {
      return { status: 0 };
    }
  },
  /*---------------------------------------RBQC TRAY FUNCTIONALITY---------------------------------------*/
  // GET THE TRAY
  getRbcTray: async (location, type) => {
    try {
      const data = await masters.aggregate([
        { $match: { cpc: location, type_taxanomy: type } },
        {
          $lookup: {
            from: "trayracks",
            localField: "rack_id",
            foreignField: "rack_id",
            as: "rackDetails",
          },
        },
      ]);
      return data;
    } catch (error) {
      return error;
    }
  },
  // CHECK THE TRAY BEFOR ISSUE TO RPBQC USER AT A TIME ONE TRAY
  checkTrayForIssueToRpBqc: async (trayId, username, user_type) => {
    try {
      let trayType = "";
      let checkUserFreeOrNot;
      if (user_type == "RP-Audit") {
        trayType = "RPA";
        checkUserFreeOrNot = await masters.findOne({
          $or: [
            { issued_user_name: username, sort_id: "Issued to RP-Audit" },
            { issued_user_name: username, sort_id: "Closed By RP-Audit" },
          ],
        });
      } else {
        trayType = "RPB";

        checkUserFreeOrNot = await masters.findOne({
          $or: [
            { issued_user_name: username, sort_id: "Issued to RP-BQC" },
            { issued_user_name: username, sort_id: "RP-BQC In Progress" },
            { issued_user_name: username, sort_id: "Closed By RP-BQC" },
          ],
        });
      }

      if (checkUserFreeOrNot) {
        return { status: 5 };
      } else {
        let checkTheTray = await masters.findOne(
          { code: trayId },
          { type_taxanomy: 1, sort_id: 1 }
        );
        if (checkTheTray) {
          if (checkTheTray.type_taxanomy == trayType) {
            if (checkTheTray.sort_id == "Open") {
              return { status: 1, trayStatus: checkTheTray.sort_id };
            } else {
              return { status: 2, trayStatus: checkTheTray.sort_id };
            }
          } else {
            return {
              status: 3,
              trayStatus: checkTheTray.sort_id,
              message: `Not a ${trayType} tray`,
            };
          }
        } else {
          return { status: 4 };
        }
      }
    } catch (error) {
      return error;
    }
  },
  // ISSUE THE TRAY TO AGENT RPBQC
  issueTheTrayToRpbqc: async (dataofTray) => {
    try {
      let status = "Issued to RP-BQC";
      if (dataofTray.user_type == "RP-Audit") {
        status = "Issued to RP-Audit";
      }
      const dataUpdate = await masters.findOneAndUpdate(
        { code: dataofTray.tray_id, sort_id: "Open" },
        {
          $set: {
            assigned_date: Date.now(),
            issued_user_name: dataofTray.username,
            sort_id: status,
          },
        }
      );
      if (dataUpdate) {
        return { status: 1 };
      } else {
        return { status: 2 };
      }
    } catch (error) {
      return error;
    }
  },
  // RETURN FROM RPBQC
  returnFromReqbqc: async (location) => {
    try {
      const data = await masters.find({
        $or: [
          { cpc: location, sort_id: "Closed by RP-BQC" },
          { cpc: location, sort_id: "Closed by RP-Audit" },
          { cpc: location, sort_id: "Received From RP-Audit" },
          { cpc: location, sort_id: "Received From RP-BQC" },
        ],
      });
      return data;
    } catch (error) {
      return error;
    }
  },
  // RECEIVE TRAY FROM RPA / RPB
  trayReceiveFromRpaOrRpb: async (trayData) => {
    try {
      const tray = await masters.findOne({ code: trayData.trayId });
      if (tray.items?.length == trayData.counts) {
        let status = "";
        if (tray.sort_id === "Closed by RP-BQC") {
          status = "Received From RP-BQC";
        } else if (tray.sort_id === "Closed by RP-Audit") {
          status = "Received From RP-Audit";
        }
        let updateTray = await masters.updateOne(
          {
            code: trayData.trayId,
          },
          {
            $set: {
              sort_id: status,
            },
          }
        );
        if (updateTray.modifiedCount !== 0) {
          if (tray.sort_id === "Closed by RP-BQC") {
            await unitsActionLog.create({
              action_type: "Received From RP-BQC",
              created_at: Date.now(),
              user_name_of_action: trayData.actioUser,
              user_type: "PRC Warehouse",
              agent_name: tray.issued_user_name,
              tray_id: trayData.trayId,
              track_tray: "Tray",
              description: `Received From RP-BQC agent :${tray.issued_user_name} by Wh: ${trayData.actioUser}`,
            });
            return { status: 1 };
          } else {
            let state = "Tray";
            for (let x of tray?.items) {
              await unitsActionLog.create({
                action_type: "Received From RP-Audit",
                created_at: Date.now(),
                user_name_of_action: trayData.actioUser,
                user_type: "PRC Warehouse",
                uic: x.uic,
                agent_name: tray.issued_user_name,
                tray_id: trayData.trayId,
                track_tray: state,
                description: `Received From RP-Audit agent :${tray.issued_user_name} by Wh: ${trayData.actioUser}`,
              });
              state = "Units";
              let updateDelivery = await delivery.updateOne(
                { uic_code: x.uic },
                {
                  $set: {
                    updated_at: Date.now(),
                    rpa_done_received_by_wh: Date.now(),
                    tray_location: "Warehouse",
                  },
                }
              );
            }
            return { status: 1 };
          }
        } else {
          return { status: 3 };
        }
      } else {
        return { status: 2 };
      }
    } catch (error) {
      return error;
    }
  },
  // TRAY CLOSE AFTER RPA / RPB
  trayCloseAfterRpaRpb: async (trayData) => {
    try {
      let updateTray;
      let findTheTray = await masters.findOne({ code: trayData.trayId });
      if (findTheTray) {
        if (trayData.tray_type == "RPB") {
          updateTray = await masters.findOneAndUpdate(
            { code: trayData.trayId, sort_id: "Received From RP-BQC" },

            {
              $set: {
                rack_id: trayData.rackId,
                actual_items: [],
                description: trayData.description,
                temp_array: [],
                sort_id: "Open",
                items: [],
                closed_time_wharehouse: Date.now(),
                issued_user_name: null,
              },
            }
          );
          if (updateTray) {
            await unitsActionLog.create({
              action_type: "RP-BQC Done Closed By Warehouse",
              created_at: Date.now(),
              user_name_of_action: trayData.actioUser,
              user_type: "PRC Warehouse",
              tray_id: trayData.trayId,
              track_tray: state,
              description: `RP-BQC Done Closed By Warehouse by Wh: ${trayData.actioUser}`,
            });
            return { status: 1 };
          } else {
            return { status: 2 };
          }
        } else {
          if (findTheTray?.items.length == 0) {
            updateTray = await masters.findOneAndUpdate(
              { code: trayData.trayId, sort_id: "Received From RP-Audit" },

              {
                $set: {
                  rack_id: trayData.rackId,
                  actual_items: [],
                  description: trayData.description,
                  temp_array: [],
                  sort_id: "Open",
                  closed_time_wharehouse: Date.now(),
                  issued_user_name: null,
                },
              }
            );
          } else {
            updateTray = await masters.findOneAndUpdate(
              { code: trayData.trayId, sort_id: "Received From RP-Audit" },

              {
                $set: {
                  rack_id: trayData.rackId,
                  actual_items: [],
                  description: trayData.description,
                  temp_array: [],
                  sort_id: "Ready to Transfer to Sales",
                  closed_time_wharehouse: Date.now(),
                  issued_user_name: null,
                },
              }
            );
          }
          if (updateTray) {
            let state = "Tray";
            for (let x of updateTray.items) {
              await unitsActionLog.create({
                action_type: "RP-Audit Done Closed By Warehouse",
                created_at: Date.now(),
                user_name_of_action: trayData.actioUser,
                user_type: "PRC Warehouse",
                uic: x.uic,
                tray_id: trayData.trayId,
                track_tray: state,
                description: `RP-Audit Done Closed By Warehouse by Wh: ${trayData.actioUser} . Ready to Transfer to Sales`,
              });
              state = "Units";
            }
            return { status: 1 };
          } else {
            return { status: 2 };
          }
        }
      } else {
        return { status: 2 };
      }
    } catch (error) {
      return error;
    }
  },
  // RPA TO STX SORTING GET ASSIGNED TRAYS
  getTrayForRpaToStxSorting: async (trayType, location, status, username) => {
    try {
      const data = await masters.aggregate([
        {
          $match: {
            sort_id: status,
            type_taxanomy: trayType,
            cpc: location,
            issued_user_name: username,
          },
        },
        {
          $lookup: {
            from: "trayracks",
            localField: "rack_id",
            foreignField: "rack_id",
            as: "rackData",
          },
        },
      ]);
      return data;
    } catch (error) {
      return error;
    }
  },
  // START RPA TO STX SORTING START PAGE
  startRpaToStxGetData: async (trayId, status, username) => {
    try {
      const data = await masters.findOne({
        code: trayId,
        sort_id: status,
        issued_user_name: username,
      });
      if (data) {
        return { status: 1, tray: data };
      } else {
        return { status: 2 };
      }
    } catch (error) {
      return error;
    }
  },
  // GET STX TRAY FOR RPA TO STX
  getStxTrayForRpaToStxSort: async (location, uic) => {
    try {
      let checkUic = await delivery.aggregate([
        {
          $match: {
            "uic_code.code": uic,
          },
        },
        {
          $lookup: {
            from: "products",
            localField: `item_id`,
            foreignField: "vendor_sku_id",
            as: "products",
          },
        },

        {
          $project: {
            "bqc_software_report.final_grade": 1,
            final_grade: 1,
            products: 1,
            rp_audit_report: 1,
          },
        },
      ]);
      if (checkUic?.[0]?.final_grade) {
        const data = await masters.find(
          {
            $or: [
              {
                sort_id: "Open",
                type_taxanomy: "ST",
                cpc: location,
                tray_grade: checkUic?.[0]?.final_grade,
                brand: checkUic?.[0]?.products?.[0].brand_name,
                model: checkUic?.[0]?.products?.[0].model_name,
              },
              {
                sort_id: "Inuse",
                type_taxanomy: "ST",
                cpc: location,
                tray_grade: checkUic?.[0]?.final_grade,
                brand: checkUic?.[0]?.products?.[0].brand_name,
                model: checkUic?.[0]?.products?.[0].model_name,
              },
              {
                sort_id: "RPA to STX Work In Progress",
                type_taxanomy: "ST",
                cpc: location,
                tray_grade: checkUic?.[0]?.final_grade,
                brand: checkUic?.[0]?.products?.[0].brand_name,
                model: checkUic?.[0]?.products?.[0].model_name,
              },
            ],
          },
          {
            code: 1,
            items: 1,
            limit: 1,
          }
        );
        let spArr = [];
        if (data.length !== 0) {
          for (let spt of data) {
            if (parseInt(spt.limit) > parseInt(spt.items.length)) {
              spArr.push(spt);
            }
          }
          return {
            status: 1,
            tray: spArr,
            modelData: checkUic?.[0]?.rp_audit_report,
          };
        } else {
          return { status: 2 };
        }
      } else {
        return { status: 3 };
      }
    } catch (error) {
      return error;
    }
  },
  addItemToStxFromRpa: async (dataOfUic) => {
    try {
      const item = await masters.findOne(
        {
          code: dataOfUic.rpaTray,
          "items.uic": dataOfUic.uic,
        },
        {
          _id: 0,
          items: {
            $elemMatch: { uic: dataOfUic.uic },
          },
        }
      );
      if (item) {
        const addToStx = await masters.updateOne(
          { code: dataOfUic.stxTray },

          {
            $set: {
              sort_id: "RPA to STX Work In Progress",
            },
            $addToSet: {
              items: item.items[0],
            },
          }
        );
        if (addToStx.modifiedCount !== 0) {
          let removeItemFromRp = await masters.updateOne(
            {
              code: dataOfUic.rpaTray,
              "items.uic": dataOfUic.uic,
            },
            {
              $pull: {
                items: {
                  uic: dataOfUic.uic,
                },
              },
            }
          );
          if (removeItemFromRp.modifiedCount !== 0) {
            await unitsActionLog.create({
              action_type: "Item Transferred to Stx",
              created_at: Date.now(),
              user_name_of_action: dataOfUic.actionUser,
              user_type: "Sales Warehouse",
              uic: dataOfUic.uic,
              tray_id: dataOfUic.stxTray,
              user_name_of_action: dataOfUic.actionUser,
              track_tray: "Units",
              description: `Items Transferred to Stx done by Warehouse :${dataOfUic.actionUser}`,
            });
            const updateDelivery = await delivery.updateOne(
              {
                "uic_code.code": dataOfUic.uic,
              },
              {
                $set: {
                  stx_tray_id: dataOfUic.stxTray,
                  rpa_to_stx_transferred_date: Date.now(),
                  tray_type: "ST",
                },
              }
            );
            if (updateDelivery) {
              return { status: 1 };
            } else {
              return { status: 2 };
            }
          }
        } else {
          return { status: 2 };
        }
      } else {
        return { status: 2 };
      }
    } catch (error) {
      return error;
    }
  },
  // CLOSE RPA TRAY AFTER RPA TO STX
  closeRpaTrayAfterRpaToStx: async (dataOfAction) => {
    try {
      const data = await masters.updateOne(
        {
          code: dataOfAction.code,
          sort_id: "Assigned to Warehouse for Stx Sorting",
        },
        {
          $set: {
            sort_id: "Ready to Transfer to Processing",
            temp_array: [],
            actual_items: [],
            rack_id: dataOfAction.rack_id,
            issued_user_name: null,
          },
        }
      );
      if (data.modifiedCount !== 0) {
        await unitsActionLog.create({
          action_type: "RPA to STX Sorting Done",
          created_at: Date.now(),
          tray_id: dataOfAction.code,
          user_name_of_action: dataOfAction.actionUser,
          track_tray: "Tray",
          user_type: "Sales Warehouse",
          description: `RPA to STX Sorting Done and Ready to Transfer to Processing :${data.actionUser}`,
        });
        return { status: 1 };
      } else {
        return { status: 2 };
      }
    } catch (error) {
      return error;
    }
  },
  // GET RPA to STX Work In Progress
  getRpaToStxWorkInProgressTray: async (location) => {
    try {
      const data = await masters.find({
        cpc: location,
        sort_id: "RPA to STX Work In Progress",
        type_taxanomy: "ST",
      });
      return data;
    } catch (error) {
      return error;
    }
  },
  // GET TRAY WITH DEVICE NOT REPAIRABLE
  getTrayForCanBin: async (location) => {
    try {
      const data = await masters.aggregate([
        {
          $match: {
            $or: [
              {
                sort_id: {
                  $in: [
                    "RDL-2 done closed by warehouse",
                    "Can Bin In progress",
                  ],
                },
                cpc: location,
                "items.rdl_repair_report.reason": "Device not repairable",
              },
              {
                sort_id: {
                  $in: [
                    "RDL-2 done closed by warehouse",
                    "Can Bin In progress",
                  ],
                },
                cpc: location,
                "temp_array.rdl_repair_report.reason": "Device not repairable",
              },
            ],
          },
        },
        {
          $lookup: {
            from: "trayracks",
            localField: "rack_id",
            foreignField: "rack_id",
            as: "rackData",
          },
        },
      ]);
      return data;
    } catch (error) {
      return error;
    }
  },
  // ONE TRAY VIEW FOR CAN BIN
  oneTrayViewForCanBin: async (trayId, location) => {
    try {
      const data = await masters.findOne({
        $or: [
          {
            code: trayId,
            cpc: location,
            sort_id: {
              $in: ["RDL-2 done closed by warehouse", "Can Bin In progress"],
            },
            "items.rdl_repair_report.reason": "Device not repairable",
          },
          {
            code: trayId,
            cpc: location,
            sort_id: {
              $in: ["RDL-2 done closed by warehouse", "Can Bin In progress"],
            },
            "temp_array.rdl_repair_report.reason": "Device not repairable",
          },
        ],
      });
      if (data) {
        let arr = [];
        arr.push(data);
        if (data.can_bin_tray !== null && data.can_bin_tray !== undefined) {
          let findCanBinTray = await masters.findOne(
            { code: data.can_bin_tray },
            { code: 1, items: 1, limit: 1 }
          );
          if (findCanBinTray) {
            arr.push(findCanBinTray);
          }
        }
        return { status: 1, trayData: arr };
      } else {
        return { status: 2 };
      }
    } catch (error) {
      return error;
    }
  },
  canBinUicScan: async (trayId, uic) => {
    try {
      const checkUic = await delivery.findOne(
        { "uic_code.code": uic },
        { rdl_two_report: 1 }
      );
      if (checkUic) {
        let checkItemAlreadyAdded = await masters.findOne({
          $or: [
            { code: trayId, "actual_items.uic": uic },
            { code: trayId, "temp_array.uic": uic },
          ],
        });
        if (checkItemAlreadyAdded) {
          return { status: 3 };
        } else {
          const data = await masters.findOne(
            {
              $or: [
                {
                  code: trayId,
                  sort_id: "Can Bin In progress",
                  "items.uic": uic,
                },
                {
                  sort_id: "RDL-2 done closed by warehouse",
                  code: trayId,
                  "items.uic": uic,
                },
              ],
            },
            {
              _id: 0,
              items: {
                $elemMatch: { uic: uic },
              },
            }
          );
          if (data) {
            if (checkUic?.rdl_two_report?.reason == "Device not repairable") {
              return { status: 1, uicData: data.items[0] };
            } else {
              let updateTheTray = await masters.findOneAndUpdate(
                {
                  $or: [
                    { code: trayId, sort_id: "RDL-2 done closed by warehouse" },
                    {
                      code: trayId,
                      sort_id: "Can Bin In progress",
                    },
                  ],
                },
                {
                  $set: {
                    sort_id: "Can Bin In progress",
                  },
                  $addToSet: {
                    actual_items: data.items[0],
                  },
                  $pull: {
                    items: {
                      uic: uic,
                    },
                  },
                }
              );
              if (updateTheTray) {
                return { status: 5 };
              } else {
                return { status: 6 };
              }
            }
          } else {
            return { status: 0 };
          }
        }
      } else {
        return { status: 2 };
      }
    } catch (error) {
      return error;
    }
  },
  // ADD TO CAN BIN
  addToCanBin: async (itemdata) => {
    try {
      itemdata.item["cbt"] = itemdata.cbt;
      const udpateOrRemove = await masters.findOneAndUpdate(
        {
          code: itemdata.trayId,
          sort_id: {
            $in: ["RDL-2 done closed by warehouse", "Can Bin In progress"],
          },
        },
        {
          $pull: {
            items: {
              uic: itemdata.item.uic,
            },
          },
          $addToSet: {
            temp_array: itemdata.item,
          },
        }
      );
      let addToNewTray = await masters.findOneAndUpdate(
        { code: itemdata.cbt },
        {
          $addToSet: {
            items: itemdata.item,
          },
          $set: {
            sort_id: "Inuse",
          },
        },
        {
          new: true,
        }
      );

      if (addToNewTray?.items?.length == addToNewTray?.limit) {
        let closeTheTray = await masters.updateOne(
          { code: itemdata.cbt },
          {
            $set: {
              sort_id: "Closed",
            },
          }
        );
        await unitsActionLog.create({
          action_type: "Can Bin Tray Close",
          created_at: Date.now(),
          user_name_of_action: itemdata.username,
          user_type: "PRC Warehouse",
          track_tray: "Tray",
          tray_id: itemdata.cbt,
          description: `Tray is full action done by PRC WH:${itemdata.username}`,
        });
      }
      if (udpateOrRemove) {
        let uddateDelivery = await delivery.findOneAndUpdate(
          {
            "uic_code.code": itemdata.item.uic,
          },
          {
            $set: {
              add_to_can_bin_date: Date.now(),
              add_to_can_bin_user: itemdata.username,
              add_to_can_bin_description: itemdata.description,
              tray_status: "Moved To Can Bin",
              can_bin_tray: itemdata.cbt,
            },
          }
        );
        await unitsActionLog.create({
          action_type: "Can Bin",
          created_at: Date.now(),
          user_name_of_action: itemdata.username,
          user_type: "PRC Warehouse",
          uic: itemdata.item.uic,
          track_tray: "Units",
          tray_id: itemdata.cbt,
          description: `Item Transferred Can BIn by prc warehouse:${itemdata.username},Warehouse user description:${itemdata.description}`,
        });
        return { status: 1 };
      } else {
        return { status: 0 };
      }
    } catch (error) {
      return error;
    }
  },
  saveCanBinTray: async (trayData) => {
    try {
      console.log(trayData);
      const updateData = await masters.updateOne(
        { code: trayData.trayId },
        {
          $set: {
            can_bin_tray: trayData?.can_bin_tray,
          },
        }
      );
      if (updateData.modifiedCount != 0) {
        await unitsActionLog.create({
          action_type: "Can Bin Tray Selection",
          created_at: Date.now(),
          user_name_of_action: trayData.username,
          user_type: "PRC Warehouse",
          track_tray: "Tray",
          tray_id: trayData.can_bin_tray,
          description: `Tray selected for can bin`,
        });
        return { status: 1 };
      } else {
        return { status: 0 };
      }
    } catch (error) {
      return error;
    }
  },
  closeCanBinTray: async (trayId, actionUser, description) => {
    try {
      let data, stage;
      let getTray = await masters.findOne({
        code: trayId,
        sort_id: {
          $in: ["RDL-2 done closed by warehouse", "Can Bin In progress"],
        },
      });
      if (getTray) {
        if (getTray?.actual_items?.length == 0) {
          data = await masters.findOneAndUpdate(
            { code: trayId },
            {
              $set: {
                sort_id: "Open",
                actual_items: [],
                temp_array: [],
                items: [],
                description: description,
              },
            }
          );
          stage = "Open";
        } else {
          data = await masters.findOneAndUpdate(
            { code: trayId },
            {
              $set: {
                sort_id: "RDL-2 done closed by warehouse",
                actual_items: [],
                temp_array: [],
                items: getTray.actual_items,
              },
            }
          );
          stage = "RDL-2 done closed by warehouse";
        }
        if (data) {
          unitsActionLog.create({
            action_type: "Can Bin Done",
            created_at: Date.now(),
            tray_id: trayId,
            user_name_of_action: actionUser,
            track_tray: "Tray",
            user_type: "Can Bin Done",
            description: `Can bin done tray moved to the stage:${stage},done by wh:${actionUser},warehouse user description :${description}`,
          });
          return { status: 1 };
        } else {
          return { status: 0 };
        }
      } else {
        return { status: 0 };
      }
    } catch (error) {
      next(error);
    }
  },
  getSalesCanBinItem: async (location) => {
    try {
      const data = await delivery.find(
        {
          add_to_can_bin_date: { $exists: true },
        },
        {
          "uic_code.code": 1,
          rp_tray: 1,
          add_to_can_bin_date: 1,
          add_to_can_bin_user: 1,
          add_to_can_bin_description: 1,
          rdl_two_report: 1,
          item_id: 1,
          old_item_details: 1,
          can_bin_tray: 1,
        }
      );
      return data;
    } catch (error) {
      return error;
    }
  },
  getCbtTrayForCanBin: async (location) => {
    try {
      const data = await masters.find({
        type_taxanomy: "CBT",
        sort_id: { $in: ["Inuse", "Open"] },
        cpc: location,
      });
      return data;
    } catch (error) {
      return error;
    }
  },
  /*-----------------------------------------OUT STOCK-----------------------------------------------------------*/
  // IT WILL WORK THROUGH NODE CORN
  checkOutOfStock: async () => {
    try {
      const productData = await products.find();
      let findAllGrade = await trayCategory.find();
      for (let x of productData) {
        let arr = [];
        let checkAnyStxWithItem;
        let withoutSubMuic;
        let checkSubmuic = await subMuic.find({ muic: x.muic });
        for (let trayGrade of findAllGrade) {
          // for (let submUicCon of checkSubmuic) {
          //   checkAnyStxWithItem = await masters.findOne({
          //     type_taxanomy: "ST",
          //     "items.audit_report.sub_muic": submUicCon.sub_muic,
          //     tray_grade: trayGrade.code,
          //   });
          //   if (checkAnyStxWithItem == null) {
          //     let key = `SUB-MUIC:${submUicCon.sub_muic}-Grade:${trayGrade.code}`;
          //     let value = "Out of Stock";
          //     arr.push(`${key}: ${value}`);
          //   }
          // }

          withoutSubMuic = await masters.findOne({
            type_taxanomy: "ST",
            // items: {
            //   $elemMatch: {
            //     "audit_report.sub_muic": { $exists: false },
            //   },
            // },
            items: { $ne: [] },
            model: x.model_name,
            brand: x.brand_name,
            tray_grade: trayGrade.code,
          });
          if (withoutSubMuic == null) {
            let key = `MUIC:${x.muic}-Grade:${trayGrade.code}`;
            let value = "Out of Stock";
            arr.push(`${key}: ${value}`);
          }
        }
        let updateProduct = await products.findOneAndUpdate(
          { vendor_sku_id: x.vendor_sku_id },
          {
            $set: {
              out_of_stock: arr,
            },
          }
        );
      }
      return { status: 1 };
    } catch (error) {
      console.log(error);
      return error;
    }
  },
};
