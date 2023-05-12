/********************************************************************/
const { orders } = require("../../Model/ordersModel/ordersModel");
const { masters } = require("../../Model/mastersModel");
const { delivery } = require("../../Model/deliveryModel/delivery");
const { user } = require("../../Model/userModel");
var mongoose = require("mongoose");
const { products } = require("../../Model/productModel/product");
const moment = require("moment");
const elasticsearch = require("../../Elastic-search/elastic");

/********************************************************************/
/* 


@ DATA FETCH AND EDIT EVERTHING WILL HAPPEN HERE 


*/

module.exports = {
  /*------------------------DASHBOARD FOR WAREHOUSE----------------------------*/
  dashboard: (location) => {
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
      };
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
      count.ctxToStxSortRequest = await masters.count({
        prefix: "tray-master",
        cpc: location,
        sort_id: "Ctx to Stx Send for Sorting",
        to_merge: { $ne: null },
        type_taxanomy: { $nin: ["BOT", "PMT", "MMT", "WHT"] },
      });
      count.ctxReceiveRequest = await masters.count({
        $or: [
          {
            prefix: "tray-master",
            type_taxanomy: { $nin: ["BOT", "PMT", "MMT", "WHT"] },
            sort_id: "Accepted From Processing",
            cpc: location,
          },
          {
            prefix: "tray-master",
            cpc: location,
            sort_id: "Accepted From Sales",
            type_taxanomy: { $nin: ["BOT", "PMT", "MMT", "WHT"] },
          },
          {
            prefix: "tray-master",
            cpc: location,
            sort_id: "Received From Processing",
            type_taxanomy: { $nin: ["BOT", "PMT", "MMT", "WHT"] },
          },
          {
            prefix: "tray-master",
            cpc: location,
            sort_id: "Received From Sales",
            type_taxanomy: { $nin: ["BOT", "PMT", "MMT", "WHT"] },
          },
        ],
      });
      count.ctxTransferRequest = await masters.count({
        prefix: "tray-master",
        sort_id: "Transfer Request sent to Warehouse",
        type_taxanomy: { $nin: ["BOT", "PMT", "MMT", "WHT", "ST"] },
        cpc: location,
      });
      count.pickupRequest = await masters.count({
        prefix: "tray-master",
        type_taxanomy: "WHT",
        sort_id: "Pickup Request sent to Warehouse",
        cpc: location,
        to_tray_for_pickup: { $ne: null },
      });
      count.returnFromPickup = await masters.count({
        $or: [
          {
            cpc: location,
            type_taxanomy: "WHT",
            sort_id: "Pickup Done Closed by Sorting Agent",
          },
          {
            cpc: location,
            type_taxanomy: "WHT",
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
        type_taxanomy: { $nin: ["BOT", "PMT", "MMT", "WHT", "ST"] },
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
        sort_id: "Send for RDL-FLS",
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
            sort_id: "Closed by RDL-FLS",
            cpc: location,
          },
          {
            prefix: "tray-master",
            type_taxanomy: "WHT",
            sort_id: "Received From RDL-FLS",
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
            sort_id: "Ready to RDL-Repair Merge Request Sent To Wharehouse",
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
            sort_id: "Ready to RDL-Repair Merging Done",
          },
          {
            cpc: location,
            refix: "tray-master",
            sort_id: "Ready to RDL-Repair Received From Merging",
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
          data[0].sort_id == "Ready to RDL-Repair Received From Merging" ||
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
          if (deliveredOrNot.order_date == null) {
            deliveredOrNot.order_date = data?.order_date;
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
        // let updateElastic = await elasticsearch.updateUic(
        //   data.awbn_number,
        //   data.bag_id
        // );
        let updateDelivery = await delivery.updateOne(
          { tracking_id: data.awbn_number },
          {
            $set: {
              bag_id: data.bag_id,
              stockin_date: Date.now(),
              stock_in_status: data.status,
              updated_at: Date.now(),
            },
          }
        );
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
      let data = await masters.findOneAndUpdate(
        { code: bagData.bagId },
        {
          $set: {
            sort_id: bagData.stage,
            uic: bagData.uic,
            sleaves: bagData.sleaves,
            status_change_time: Date.now(),
            wh_added_item_close_fv_1:Date.now()
          },
        }
      );
      if (data) {
        for (let x of data.items) {
          // let updateElastic = await elasticsearch.closeBagAfterItemPuted(
          //   x.awbn_number
          // );
          let updateDelivery = await delivery.updateOne(
            { tracking_id: x.awbn_number },
            {
              $set: {
                bag_close_date: Date.now(),
                updated_at: Date.now(),
              },
            }
          );
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
            // let updateElastic = await elasticsearch.uicCodeGen(updateDelivery);
          }
          for (let i = 0; i < issueData.try.length; i++) {
            let assignTray = await masters.updateOne(
              { code: issueData.try[i] },
              {
                $set: {
                  issued_user_name: data.issued_user_name,
                  sort_id: "Issued",
                  status_change_time: Date.now(),
                  assign: "New Assign",
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
      if (trayData.type === "charging") {
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
            for (let i = 0; i < data.actual_items.length; i++) {
              let deliveryTrack = await delivery.findOneAndUpdate(
                { tracking_id: data.actual_items[i].tracking_id },
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
              // let updateElasticSearch = await elasticsearch.uicCodeGen(
              //   deliveryTrack
              // );
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
        if (checktray?.items?.length == trayData.counts) {
          if (checktray.sort_id == "Audit Done Return from Merging") {
            let data = await masters.findOneAndUpdate(
              { code: trayData.trayId },
              {
                $set: {
                  sort_id: "Audit Done Received From Merging",
                },
              }
            );
            if (data) {
              for (let i = 0; i < data.actual_items.length; i++) {
                let deliveryTrack = await delivery.findOneAndUpdate(
                  { tracking_id: data.items[i].awbn_number },
                  {
                    $set: {
                      tray_status: "Audit Done  Received From Merging",
                      tray_location: "Warehouse",
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
              resolve({ status: 2 });
            }
          } else if (checktray.sort_id == "Ready to Audit Merging Done") {
            let data = await masters.findOneAndUpdate(
              { code: trayData.trayId },
              {
                $set: {
                  sort_id: "Ready to Audit Received From Merging",
                },
              }
            );
            if (data) {
              for (let i = 0; i < data.actual_items.length; i++) {
                let deliveryTrack = await delivery.findOneAndUpdate(
                  { tracking_id: data.items[i].awbn_number },
                  {
                    $set: {
                      tray_status: "Ready to Audit Received From Merging",
                      tray_location: "Warehouse",
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
              resolve({ status: 2 });
            }
          } else if (checktray.sort_id == "Ready to BQC Merging Done") {
            let data = await masters.findOneAndUpdate(
              { code: trayData.trayId },
              {
                $set: {
                  sort_id: "Ready to BQC Received From Merging",
                },
              }
            );
            if (data) {
              for (let i = 0; i < data.actual_items.length; i++) {
                let deliveryTrack = await delivery.findOneAndUpdate(
                  { tracking_id: data.items[i].awbn_number },
                  {
                    $set: {
                      tray_status: "Ready to BQC Received From Merging",
                      tray_location: "Warehouse",
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
              resolve({ status: 2 });
            }
          } else if (checktray.sort_id == "Ready to RDL-Repair Merging Done") {
            let data = await masters.findOneAndUpdate(
              { code: trayData.trayId },
              {
                $set: {
                  sort_id: "Ready to RDL-Repair Received From Merging",
                },
              }
            );
            if (data) {
              for (let i = 0; i < data.actual_items.length; i++) {
                let deliveryTrack = await delivery.findOneAndUpdate(
                  { tracking_id: data.items[i].awbn_number },
                  {
                    $set: {
                      tray_status: "Ready to RDL-Repair Received From Merging",
                      tray_location: "Warehouse",
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
              resolve({ status: 2 });
            }
          } else {
            let data = await masters.findOneAndUpdate(
              { code: trayData.trayId },
              {
                $set: {
                  sort_id: "Received From Merging",
                },
              }
            );
            if (data) {
              for (let i = 0; i < data.actual_items.length; i++) {
                let deliveryTrack = await delivery.findOneAndUpdate(
                  { tracking_id: data.items[i].awbn_number },
                  {
                    $set: {
                      tray_status: "Received From Merging",
                      tray_location: "Warehouse",
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
              resolve({ status: 2 });
            }
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
              },
            }
          );
          if (data) {
            for (let i = 0; i < data.items.length; i++) {
              let deliveryTrack = await delivery.findOneAndUpdate(
                { tracking_id: data.items[i].awbn_number },
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
              // let updateElasticSearch = await elasticsearch.uicCodeGen(
              //   deliveryTrack
              // );
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
              closed_time_wharehouse: Date.now(),
            },
          }
        );
      } else {
        data = await masters.findOneAndUpdate(
          { code: trayData.trayId },
          {
            $set: {
              sort_id: "Open",
              closed_time_wharehouse: Date.now(),
              issued_user_name: null,
            },
          }
        );
      }
      if (data) {
        for (let x of data?.items) {
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
          // let updateElastic = await elasticsearch.uicCodeGen(deliveryTrack);
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
      let data = await masters.findOneAndUpdate(
        { code: trayData.trayId },
        {
          $set: {
            sort_id: "Closed By Warehouse",
            closed_time_wharehouse_from_bot: new Date(
              new Date().toISOString().split("T")[0]
            ),
            actual_items: [],
          },
        }
      );
      if (data) {
        for (let x of data.items) {
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
          // let updateElastic = await elasticsearch.uicCodeGen(getItemId);
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
        let data = await masters.find({
          prefix: "tray-master",
          type_taxanomy: "WHT",
          cpc: location,
        });
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
        status == "Ready to RDL"
      ) {
        data = await masters.find({
          prefix: "tray-master",
          type_taxanomy: "WHT",
          sort_id: status,
          cpc: location,
        });
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
        data = await masters.find({
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
            },
            {
              cpc: location,
              prefix: "tray-master",
              type_taxanomy: "WHT",
              $expr: { $ne: [{ $size: "$items" }, { $toInt: "$limit" }] },
              sort_id: "Ready to RDL-Repair",
            },
            {
              cpc: location,
              prefix: "tray-master",
              type_taxanomy: "WHT",
              $expr: { $ne: [{ $size: "$items" }, { $toInt: "$limit" }] },
              sort_id: "Ready to BQC",
            },
            {
              cpc: location,
              prefix: "tray-master",
              type_taxanomy: "WHT",
              $expr: { $ne: [{ $size: "$items" }, { $toInt: "$limit" }] },
              sort_id: "Ready to Audit",
            },
          ],
        });
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
      } else if (sortId === "Send for RDL-FLS") {
        let data = await masters.findOne({ code: trayId, cpc: location });
        if (data) {
          if (data?.sort_id == "Send for RDL-FLS") {
            resolve({ data: data, status: 1 });
          } else {
            resolve({ data: data, status: 3 });
          }
        }
      } else if (sortId === "Closed by RDL-FLS") {
        let data = await masters.findOne({ code: trayId, cpc: location });
        if (data) {
          if (data?.sort_id == "Closed by RDL-FLS") {
            resolve({ data: data, status: 1 });
          } else {
            resolve({ data: data, status: 3 });
          }
        } else {
          resolve({ data: data, status: 2 });
        }
      } else if (sortId === "Received from RDL-FLS") {
        let data = await masters.findOne({ code: trayId, cpc: location });
        if (data) {
          if (data?.sort_id == "Received From RDL-FLS") {
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
        let data = await masters.find({
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
        if (data) {
          resolve(data);
        }
      });
    } else if (status == "Send_for_audit") {
      return new Promise(async (resolve, reject) => {
        let data = await masters.find({
          prefix: "tray-master",
          type_taxanomy: "WHT",
          sort_id: "Send for Audit",
          cpc: location,
        });

        if (data) {
          resolve(data);
        }
      });
    } else {
      return new Promise(async (resolve, reject) => {
        let data = await masters.find({
          prefix: "tray-master",
          type_taxanomy: "WHT",
          sort_id: "Send for BQC",
        });
        if (data) {
          resolve(data);
        }
      });
    }
  },

  /*------------------CHECK UIC CODE---------------------------*/

  checkUicCode: (uic, trayId) => {
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
            "actual_items.uic": uic,
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
          let data = await masters.updateOne(
            { code: trayItemData.trayId },
            {
              $set: {
                sort_id: "BQC work inprogress",
              },
              $push: {
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
      if (trayData.sortId == "Send for BQC") {
        data = await masters.findOneAndUpdate(
          { code: trayData.trayId },
          {
            $set: {
              actual_items: [],
              description: trayData.description,
              temp_array: [],
              sort_id: "Issued to BQC",
              assigned_date: Date.now(),
            },
          }
        );
        if (data) {
          for (let x of data.items) {
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
            // let updateElasticSearch = await elasticsearch.uicCodeGen(
            //   deliveryUpdate
            // );
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
              temp_array: [],
            },
          }
        );
        if (data) {
          for (let x of data.items) {
            let deliveryUpdate = await delivery.findOneAndUpdate(
              { tracking_id: x.tracking_id },
              {
                $set: {
                  tray_status: "Issued to Recharging",
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
            // let updateElasticSearch = await elasticsearch.uicCodeGen(
            //   deliveryUpdate
            // );
          }
        }
      } else if (trayData.sortId == "Send for RDL-FLS") {
        data = await masters.findOneAndUpdate(
          { code: trayData.trayId },
          {
            $set: {
              actual_items: [],
              description: trayData.description,
              sort_id: "Issued to RDL-FLS",
              requested_date: Date.now(),
              assigned_date: Date.now(),
              temp_array: [],
            },
          }
        );
        if (data) {
          for (let x of data.items) {
            let deliveryUpdate = await delivery.findOneAndUpdate(
              { tracking_id: x.tracking_id },
              {
                $set: {
                  tray_status: "Issued to RDL-FLS",
                  rdl_fls_one_user_name: data?.issued_user_name,
                  rdl_fls_issued_date: Date.now(),
                  tray_location: "RDL-FLS",
                  updated_at: Date.now(),
                },
              },
              {
                new: true,
                projection: { _id: 0 },
              }
            );
            // let updateElasticSearch = await elasticsearch.uicCodeGen(
            //   deliveryUpdate
            // );
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
              requested_date: Date.now(),
              assigned_date: Date.now(),
              temp_array: [],
            },
          }
        );
        if (data) {
          for (let x of data.items) {
            let deliveryUpdate = await delivery.findOneAndUpdate(
              { tracking_id: x.tracking_id },
              {
                $set: {
                  tray_status: "Issued to RDL-2",
                  rdl_fls_one_user_name: data?.issued_user_name,
                  rdl_fls_issued_date: Date.now(),
                  tray_location: "RDL-2",
                  updated_at: Date.now(),
                },
              },
              {
                new: true,
                projection: { _id: 0 },
              }
            );
            let updateElasticSearch = await elasticsearch.uicCodeGen(
              deliveryUpdate
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
            },
          }
        );
        if (data) {
          for (let x of data.items) {
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

            // let updateElasticSearch = await elasticsearch.uicCodeGen(
            //   deliveryUpdate
            // );
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

  checkUicCodeSortingDone: (uic, trayId) => {
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
            "actual_items.uic": uic,
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
              closed_time_wharehouse: Date.now(),
              issued_user_name: null,
              actual_items: [],
            },
          }
        );
        if (data) {
          for (let x of data.items) {
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
            // let updateElasticSearch = await elasticsearch.uicCodeGen(
            //   deliveryUpdate
            // );
          }
          resolve(data);
        } else {
          resolve();
        }
      } else {
        data = await masters.findOneAndUpdate(
          { code: trayData.trayId },
          {
            $set: {
              description: trayData.description,
              sort_id: "Ready to BQC",
              closed_time_wharehouse: Date.now(),
              issued_user_name: null,
              actual_items: [],
            },
          }
        );
        if (data) {
          for (let x of data.items) {
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
            // let updateElasticSearch = await elasticsearch.uicCodeGen(
            //   deliveryUpdate
            // );
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
        stage = "Ready to RDL";
        data = await masters.findOneAndUpdate(
          { code: trayData.trayId },
          {
            $set: {
              sort_id: "Ready to RDL",
              closed_time_wharehouse: Date.now(),
              actual_items: [],
              issued_user_name: null,
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
                issued_user_name: null,
              },
            }
          );
        } else if (trayData?.length == trayData?.limit) {
          stage = "Ready to Transfer to Sales";
          data = await masters.findOneAndUpdate(
            { code: trayData.trayId },
            {
              $set: {
                sort_id: "Ready to Transfer to Sales",
                actual_items: [],
                issued_user_name: null,
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
                actual_items: [],
                issued_user_name: null,
              },
            }
          );
        }
      }
      if (data) {
        for (let x of data.items) {
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
          // let updateElasticSearch = await elasticsearch.uicCodeGen(
          //   deliveryUpdate
          // );
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
          for (let i = 0; i < data.actual_items.length; i++) {
            let deliveryTrack = await delivery.findOneAndUpdate(
              { tracking_id: data.actual_items[i].tracking_id },
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
            // let updateElasticSearch = await elasticsearch.uicCodeGen(
            //   deliveryTrack
            // );
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
          for (let x of data?.items) {
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
            // let updateElasticSearch = await elasticsearch.uicCodeGen(
            //   deliveryTrack
            // );
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
            for (let x of data.items) {
              let updateDelivery = await delivery.findOneAndUpdate(
                {
                  tracking_id: x.tracking_id,
                },
                {
                  $set: {
                    tray_status: "Received From Sorting Agent After Ctx to Stx",
                    tray_location: "Sales-Warehouse",
                    received_from_sorting: Date.now(),
                    updated_at: Date.now(),
                  },
                },
                {
                  new: true,
                  projection: { _id: 0 },
                }
              );
              // let updateElasticSearch = await elasticsearch.uicCodeGen(
              //   updateDelivery
              // );
            }
            resolve({ status: 1 });
          }
        } else if (tray.type_taxanomy == "WHT") {
          let data = await masters.findOneAndUpdate(
            { code: trayData.trayId },
            {
              $set: {
                sort_id: "Received From Sorting",
              },
            }
          );
          if (data) {
            for (let x of data.items) {
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
              // let updateElasticSearch = await elasticsearch.uicCodeGen(
              //   updateDelivery
              // );
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
      let botTray = await masters.find({
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
      });

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
          data.sort_id ==
            "Ready to RDL-Repair Merge Request Sent To Wharehouse" ||
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
              issued_user_name: trayData.username,
            },
          }
        );
        if (
          trayData.type == "Issued to sorting agent" &&
          x.type_taxanomy == "BOT"
        ) {
          for (let x of data.items) {
            let deliveryUpdate = await delivery.findOneAndUpdate(
              { tracking_id: x.awbn_number },
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
            // let updateElasticSearch = await elasticsearch.uicCodeGen(
            //   deliveryUpdate
            // );
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
              issued_user_name: null,
            },
          }
        );
        if (data) {
          for (let x of data.items) {
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
            // let updateElasticSearch = await elasticsearch.uicCodeGen(
            //   updateDelivery
            // );
          }
          resolve({ status: 1 });
        }
      } else {
        data = await masters.findOneAndUpdate(
          { code: trayData.code },
          {
            $set: {
              sort_id: "Inuse",
              closed_time_wharehouse: Date.now(),
              actual_items: [],
              issued_user_name: null,
            },
          }
        );
        if (data) {
          for (let x of data.items) {
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
            // let updateElasticSearch = await elasticsearch.uicCodeGen(
            //   updateDelivery
            // );
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
        .find({
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
              sort_id: "Ready to RDL-Repair Merge Request Sent To Wharehouse",
              cpc: location,
              to_merge: { $ne: null },
            },
            {
              sort_id: "Ready to Audit Merge Request Sent To Wharehouse",
              cpc: location,
              to_merge: { $ne: null },
            },
          ],
        })
        .catch((err) => reject(err));
      if (getMmttray) {
        resolve(getMmttray);
      }
    });
  },
  getFromAndToTrayMerge: (location, fromTray) => {
    return new Promise(async (resolve, reject) => {
      let arr = [];
      let data = await masters.findOne({ cpc: location, code: fromTray });
      if (data) {
        let toTray = await masters.findOne({
          cpc: location,
          code: data.to_merge,
        });
        arr.push(data);
        arr.push(toTray);
        resolve(arr);
      } else {
        resolve();
      }
    });
  },

  /*-----------------ASSIGN TO SORTING AGENT-------------------------*/

  assignToSortingAgent: (user_name, fromTray, toTray) => {
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
              sort_id: "Audit Done Issued to Merging",
            },
          }
        );
        if (updaFromTray) {
          updaToTray = await masters.updateOne(
            { code: toTray },
            {
              $set: {
                assigned_date: Date.now(),
                sort_id: "Audit Done Issued to Merging",
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
              sort_id: "Ready to BQC Issued to Merging",
            },
          }
        );
        if (updaFromTray) {
          updaToTray = await masters.findOneAndUpdate(
            { code: toTray },
            {
              $set: {
                assigned_date: Date.now(),
                sort_id: "Ready to BQC Issued to Merging",
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
              sort_id: "Ready to Audit Issued to Merging",
            },
          }
        );
        if (updaFromTray) {
          updaToTray = await masters.findOneAndUpdate(
            { code: toTray },
            {
              $set: {
                assigned_date: Date.now(),
                sort_id: "Ready to Audit Issued to Merging",
              },
            }
          );
        } else {
          resolve({ status: 0 });
        }
      } else if (
        checkFromTray.sort_id ==
        "Ready to RDL-Repair Merge Request Sent To Wharehouse"
      ) {
        updaFromTray = await masters.findOneAndUpdate(
          { code: fromTray },
          {
            $set: {
              assigned_date: Date.now(),
              sort_id: "Ready to RDL-Repair Issued to Merging",
            },
          }
        );
        if (updaFromTray) {
          updaToTray = await masters.findOneAndUpdate(
            { code: toTray },
            {
              $set: {
                assigned_date: Date.now(),
                sort_id: "Ready to RDL-Repair Issued to Merging",
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
              sort_id: "Issued to Sorting for Ctx to Stx",
            },
          }
        );
        if (updaFromTray) {
          updaToTray = await masters.findOneAndUpdate(
            { code: toTray },
            {
              $set: {
                assigned_date: Date.now(),
                sort_id: "Issued to Sorting for Ctx to Stx",
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
              sort_id: "Issued to Merging",
            },
          }
        );
        if (updaFromTray) {
          updaToTray = await masters.findOneAndUpdate(
            { code: toTray },
            {
              $set: {
                assigned_date: Date.now(),
                sort_id: "Issued to Merging",
              },
            }
          );
        } else {
          resolve({ status: 0 });
        }
      }
      if (updaToTray) {
        const joinedArray = updaToTray.items.concat(updaFromTray.items);
        for (let x of joinedArray) {
          let deliveryUpdate = await delivery.findOneAndUpdate(
            { tracking_id: x.tracking_id },
            {
              $set: {
                tray_status: "Send to Merging",
                tray_location: "Sorting Agent",
                updated_at: Date.now(),
              },
            },
            {
              new: true,
              projection: { _id: 0 },
            }
          );
          // let updateElasticSearch = await elasticsearch.uicCodeGen(
          //   deliveryUpdate
          // );
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
            sort_id: "Ready to RDL-Repair Merging Done",
          },
          {
            cpc: location,
            refix: "tray-master",
            sort_id: "Ready to RDL-Repair Received From Merging",
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
  mergeDoneTrayClose: (fromTray, toTray, type, length, limit, status) => {
    let data;
    let stage;
    return new Promise(async (resolve, reject) => {
      if (type !== "MMT" && type !== "WHT") {
        if (length == limit) {
          if (type == "ST") {
            stage = "Ready to Pricing";
            data = await masters.findOneAndUpdate(
              { code: toTray },
              {
                $set: {
                  sort_id: "Ready to Pricing",
                  actual_items: [],
                  issued_user_name: null,
                  from_merge: null,
                  to_merge: null,
                  closed_time_wharehouse: Date.now(),
                },
              }
            );
          } else {
            stage = "Ready to Transfer to Sales";
            data = await masters.findOneAndUpdate(
              { code: toTray },
              {
                $set: {
                  sort_id: "Ready to Transfer to Sales",
                  actual_items: [],
                  issued_user_name: null,
                  from_merge: null,
                  to_merge: null,
                  closed_time_wharehouse: Date.now(),
                },
              }
            );
          }
        } else if (length == 0) {
          stage = "Open";
          let updateFromTray = await masters.updateOne(
            { code: toTray },
            {
              $set: {
                sort_id: "Open",
                actual_items: [],
                temp_array: [],
                items: [],
                issued_user_name: null,
                from_merge: null,
                to_merge: null,
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
                sort_id: "Open",
                actual_items: [],
                temp_array: [],
                items: [],
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
              stage = "Ready to RDL";
              data = await masters.findOneAndUpdate(
                { code: toTray },
                {
                  $set: {
                    sort_id: "Ready to RDL",
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
          } else if (status == "Ready to RDL-Repair Received From Merging") {
            stage = "Ready to RDL-Repair";
            data = await masters.findOneAndUpdate(
              { code: toTray },
              {
                $set: {
                  sort_id: "Ready to RDL-Repair",
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
                    sort_id: "Closed By Warehouse",
                    from_merge: null,
                    to_merge: null,
                    closed_time_wharehouse: Date.now(),
                  },
                }
              );
            }
          }
        }
      }
      if (data) {
        for (let x of data.items) {
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
      if (userActive.status == "Active") {
        let data = await masters.findOne({
          $or: [
            { issued_user_name: username, sort_id: "Issued to sorting agent" },
            { issued_user_name: username, sort_id: "Closed By Sorting Agent" },
            { issued_user_name: username, sort_id: "Issued to Merging" },
            { issued_user_name: username, sort_id: "Merging Done" },
            {
              issued_user_name: username,
              sort_id: "Ready to Audit Issued to Merging",
            },
            {
              issued_user_name: username,
              sort_id: "Ready to RDL-Repair Issued to Merging",
            },
            {
              issued_user_name: username,
              sort_id: "Ready to Audit Merging Done",
            },

            {
              issued_user_name: username,
              sort_id: "Ready to RDL-Repair Merging Done",
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

  checkTrayStatusAuditApprovePage: (
    trayId,
    trayType,
    location,
    brand,
    model
  ) => {
    return new Promise(async (resolve, reject) => {
      let checkId = await masters.findOne({
        code: trayId,
        prefix: "tray-master",
        cpc: location,
      });
      if (checkId == null) {
        resolve({ status: 4 });
      } else if (checkId?.brand !== brand || checkId?.model !== model) {
        resolve({ status: 5 });
      } else if (
        checkId.tray_grade == trayType &&
        checkId.type_taxanomy == "CT"
      ) {
        if (checkId.sort_id == "Open") {
          resolve({ status: 1 });
        } else {
          resolve({ status: 3 });
        }
      } else {
        resolve({ status: 2 });
      }
    });
  },
  auditTrayAssign: (trayData) => {
    return new Promise(async (resolve, reject) => {
      let issue;
      for (let x of trayData.trayId) {
        issue = await masters.findOneAndUpdate(
          { code: x },
          {
            $set: {
              sort_id: "Issued to Audit",
              assigned_date: Date.now(),
              description: trayData.description,
              issued_user_name: trayData.username,
              actual_items: [],
              temp_array: [],
            },
          }
        );
        if (issue.type_taxanomy == "WHT") {
          for (let y of issue.items) {
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
            // let updateElasticSearch = await elasticsearch.uicCodeGen(
            //   updateTrack
            // );
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
      let obj = {
        A: "",
        B: "",
        C: "",
        D: "",
      };
      let data = await masters.find({
        type_taxanomy: { $ne: "WHT" },
        issued_user_name: username,
        sort_id: "Issued to Audit",
      });

      if (data.length != 0) {
        for (let x of data) {
          if (x.brand == brand && x.model == model) {
            obj[x.tray_grade] = x.code;
          }
        }
        resolve(obj);
      } else {
        resolve(obj);
      }
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
        let tray = await masters.find({
          prefix: "tray-master",
          cpc: location,
          type_taxanomy: { $nin: ["BOT", "PMT", "MMT", "WHT", "ST"] },
        });
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
              type_taxanomy: { $nin: ["BOT", "PMT", "MMT", "WHT", "ST"] },
            },
          ],
        });
        if (tray) {
          reslove({ status: 1, tray: tray });
        }
      } else if (type === "Ctx to Stx Send for Sorting") {
        let tray = await masters.find({
          prefix: "tray-master",
          cpc: location,
          sort_id: type,
          to_merge: { $ne: null },
          type_taxanomy: { $nin: ["BOT", "PMT", "MMT", "WHT"] },
        });
        if (tray) {
          reslove({ status: 1, tray: tray });
        }
      } else if (type === "Transferred to Sales") {
        let tray = await masters.find({
          $or: [
            {
              prefix: "tray-master",
              cpc: location,
              sort_id: "Transferred to Sales",

              type_taxanomy: { $nin: ["BOT", "PMT", "MMT", "WHT"] },
            },
            {
              prefix: "tray-master",
              cpc: location,
              sort_id: "Transferred to Processing",

              type_taxanomy: { $nin: ["BOT", "PMT", "MMT", "WHT"] },
            },
          ],
        });
        if (tray) {
          reslove({ status: 1, tray: tray });
        }
      } else if (type === "Ready to Transfer") {
        let tray = await masters.find({
          $or: [
            {
              prefix: "tray-master",
              cpc: location,
              sort_id: "Ready to Transfer to Sales",
              type_taxanomy: { $nin: ["BOT", "PMT", "MMT", "WHT"] },
            },
            {
              prefix: "tray-master",
              cpc: location,
              sort_id: "Ready to Transfer to Processing",
              type_taxanomy: { $nin: ["BOT", "PMT", "MMT", "WHT"] },
            },
          ],
        });
        if (tray) {
          reslove({ status: 1, tray: tray });
        }
      } else if (type === "Accepted From Processing") {
        let tray = await masters.find({
          $or: [
            {
              prefix: "tray-master",
              type_taxanomy: { $nin: ["BOT", "PMT", "MMT", "WHT"] },
              sort_id: "Accepted From Processing",
              cpc: location,
            },
            {
              prefix: "tray-master",
              cpc: location,
              sort_id: "Accepted From Sales",
              type_taxanomy: { $nin: ["BOT", "PMT", "MMT", "WHT"] },
            },
            {
              prefix: "tray-master",
              cpc: location,
              sort_id: "Received From Processing",
              type_taxanomy: { $nin: ["BOT", "PMT", "MMT", "WHT"] },
            },
            {
              prefix: "tray-master",
              cpc: location,
              sort_id: "Received From Sales",
              type_taxanomy: { $nin: ["BOT", "PMT", "MMT", "WHT"] },
            },
          ],
        });
        if (tray) {
          reslove({ status: 1, tray: tray });
        }
      } else {
        let tray = await masters.find({
          prefix: "tray-master",
          cpc: location,
          sort_id: type,
          type_taxanomy: { $nin: ["BOT", "PMT", "MMT", "WHT"] },
        });
        if (tray) {
          reslove({ status: 1, tray: tray });
        }
      }
    });
  },
  pickupRequest: (location, type) => {
    return new Promise(async (resolve, reject) => {
      let tray = await masters.find({
        cpc: location,
        prefix: "tray-master",
        sort_id: type,
        to_tray_for_pickup: { $ne: null },
      });
      if (tray) {
        resolve(tray);
      }
    });
  },
  pickupePageRequestApprove: (location, fromTray) => {
    return new Promise(async (resolve, reject) => {
      let arr = [];
      let data = await masters.findOne({
        cpc: location,
        code: fromTray,
        sort_id: "Pickup Request sent to Warehouse",
      });
      if (data) {
        let toTray = await masters.findOne({
          cpc: location,
          code: data.to_tray_for_pickup,
        });
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
  assigntoSoringForPickUp: (username, fromTray, toTray) => {
    return new Promise(async (resolve, reject) => {
      let updateFromTray = await masters.findOneAndUpdate(
        {
          code: fromTray,
        },
        {
          $set: {
            issued_user_name: username,
            requested_date: Date.now(),
            actual_items: [],
            temp_array: [],
            sort_id: "Issued to Sorting for Pickup",
          },
        }
      );
      let updateToTray = await masters.findOneAndUpdate(
        {
          code: toTray,
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

      if (updateFromTray && updateToTray) {
        for (let x of updateFromTray?.items) {
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
          // let updateElasticSearch = await elasticsearch.uicCodeGen(
          //   deliveryUpdate
          // );
        }
        resolve({ status: 1 });
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
          for (let x of update?.items) {
            let deliveryUpdate = await delivery.findOneAndUpdate(
              { tracking_id: x.tracking_id },
              {
                $set: {
                  tray_status: "Pickup Done",
                  tray_location: "Warehouse",
                  updated_at: Date.now(),
                },
              },
              {
                new: true,
                projection: { _id: 0 },
              }
            );
            // let updateElasticSearch = await elasticsearch.uicCodeGen(
            //   deliveryUpdate
            // );
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
              sort_id: "Open",
              issued_user_name: null,
              actual_items: [],
              temp_array: [],
              pickup_type: null,
              items: [],
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
                sort_id: "Closed",
                issued_user_name: null,
                actual_items: [],
                temp_array: [],
                pickup_type: null,
                to_tray_for_pickup: null,
              },
            }
          );
        } else if (trayData.stage == "Ready to RDL-Repair") {
          status = "Ready to RDL-Repair";
          data = await masters.findOneAndUpdate(
            { code: trayData.trayId },
            {
              $set: {
                sort_id: "Ready to RDL-Repair",
                issued_user_name: null,
                actual_items: [],
                temp_array: [],
                pickup_type: null,
                to_tray_for_pickup: null,
              },
            }
          );
        } else {
          status = "Ready to RDL";
          data = await masters.findOneAndUpdate(
            { code: trayData.trayId },
            {
              $set: {
                sort_id: "Ready to RDL",
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
        for (let x of data?.items) {
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
          // let updateElasticSearch = await elasticsearch.uicCodeGen(
          //   deliveryTrack
          // );
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
            { issued_user_name: username, sort_id: "Issued to RDL-FLS" },
            { issued_user_name: username, sort_id: "Closed By RDL-FLS" },
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
            { issued_user_name: username, sort_id: "Issued to RDL-2" },
            { issued_user_name: username, sort_id: "Closed By RDL-2" },
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
  getRDLoneRequest: (status, location) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        $or: [
          {
            prefix: "tray-master",
            type_taxanomy: "WHT",
            sort_id: status,
            cpc: location,
          },
        ],
      });
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
            sort_id: "Received From RDL-FLS",
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
      if (trayData.sortId == "Closed by RDL-FLS") {
        data = await masters.findOneAndUpdate(
          { code: trayData?.trayId },
          {
            $set: {
              actual_items: [],
              description: trayData?.description,
              temp_array: [],
              sort_id: "Recived from RDL-FLS",
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
              sort_id: "Received From RDL-FLS",
            },
          }
        );
        if (data) {
          for (let i = 0; i < data.items.length; i++) {
            let deliveryTrack = await delivery.findOneAndUpdate(
              { tracking_id: data.items[i].tracking_id },
              {
                $set: {
                  tray_status: "Recevied From RDL-FLS",
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
            // let elasticSearchUpdate = await elasticsearch.uicCodeGen(
            //   deliveryTrack
            // );
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
      data = await masters.findOneAndUpdate(
        { code: trayData.trayId },
        {
          $set: {
            actual_items: [],
            description: trayData.description,
            temp_array: [],
            sort_id: "Ready to RDL-Repair",
            closed_time_wharehouse: Date.now(),
            assigned_date: Date.now(),
          },
        }
      );
      if (data) {
        for (let x of data.items) {
          let deliveryUpdate = await delivery.findOneAndUpdate(
            { tracking_id: x.tracking_id },
            {
              $set: {
                tray_status: "Ready to RDL-Repair",
                rdl_fls_done_closed_wh: Date.now(),
                updated_at: Date.now(),
              },
            },
            {
              new: true,
              projection: { _id: 0 },
            }
          );
          // let elasticSearchUpdate = await elasticsearch.uicCodeGen(
          //   deliveryUpdate
          // );
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
                actual_items: [],
                temp_array: [],
              },
            }
          );
          if (data) {
            for (let x of data.items) {
              let updateTrack = await delivery.findOneAndUpdate(
                { tracking_id: x.tracking_id },
                {
                  $set: {
                    ctx_tray_receive_and_close_wh: Date.now(),
                    tray_location: "Sales-warehouse",
                    partner_shop: data.cpc,
                    updated_at: Date.now(),
                  },
                },
                {
                  new: true,
                  projection: { _id: 0 },
                }
              );
              // let updateElasticSearch = await elasticsearch.uicCodeGen(
              //   updateTrack
              // );
            }
            resolve({ status: 4 });
          } else {
            resolve({ status: 0 });
          }
        } else {
          data = await masters.updateOne(
            { code: trayData.trayId },
            {
              $set: {
                sort_id: "Open",
                recommend_location: null,
                issued_user_name: null,
                actual_items: [],
                temp_array: [],
                to_merge: null,
                from_merge: null,
              },
            }
          );
        }
        if (data.modifiedCount != 0) {
          resolve({ status: 5 });
        } else {
          resolve({ status: 0 });
        }
      } else {
        let data = await masters.findOneAndUpdate(
          { code: trayData.trayId },
          {
            $set: {
              cpc: trayData.sales_location,
              description: trayData.description,
              sort_id: trayData.sortId,
              recommend_location: null,
              actual_items: [],
              temp_array: [],
            },
          }
        );
        if (data) {
          for (let x of data.items) {
            let updateTrack = await delivery.findOneAndUpdate(
              { tracking_id: x.tracking_id },
              {
                $set: {
                  ctx_tray_transferTo_sales_date: Date.now(),
                  tray_Id: x.tray_id,
                  ctx_tray_id: trayData.trayId,
                  updated_at: Date.now(),
                },
              },
              {
                new: true,
                projection: { _id: 0 },
              }
            );
            // let updateElasticSearch = await elasticsearch.uicCodeGen(
            //   updateTrack
            // );
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
        if (tray.sort_id == "Accepted From Processing") {
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
          if (tray.sort_id == "Accepted From Processing") {
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
  sortingDoneCtxStxClose: (trayData) => {
    return new Promise(async (resolve, reject) => {
      let dataUpdate;
      if (trayData.type == "ST") {
        if (trayData.limit == trayData.itemCount) {
          dataUpdate = await masters.findOneAndUpdate(
            { code: trayData.trayId },
            {
              $set: {
                issued_user_name: null,
                actual_items: [],
                temp_array: [],
                from_merge: null,
                to_merge: null,
                sort_id: "Ready to Pricing",
                description: trayData.description,
              },
            }
          );
          if (dataUpdate) {
            resolve({ status: 1 });
          } else {
            resolve({ status: 0 });
          }
        } else if (trayData.itemCount == "0") {
          dataUpdate = await masters.findOneAndUpdate(
            { code: trayData.trayId },
            {
              $set: {
                issued_user_name: null,
                actual_items: [],
                temp_array: [],
                from_merge: null,
                to_merge: null,
                sort_id: "Open",
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
          dataUpdate = await masters.findOneAndUpdate(
            { code: trayData.trayId },
            {
              $set: {
                issued_user_name: null,
                actual_items: [],
                temp_array: [],
                from_merge: null,
                to_merge: null,
                sort_id: "Inuse",
                closed_time_wharehouse: Date.now(),
                description: trayData.description,
              },
            }
          );
        }
        if (dataUpdate) {
          resolve({ status: 3 });
        } else {
          resolve({ status: 0 });
        }
      } else {
        if (trayData.itemCount == "0") {
          dataUpdate = await masters.findOneAndUpdate(
            { code: trayData.trayId },
            {
              $set: {
                issued_user_name: null,
                actual_items: [],
                temp_array: [],
                from_merge: null,
                to_merge: null,
                sort_id: "Ready to Transfer to Processing",
                description: trayData.description,
              },
            }
          );
          if (dataUpdate) {
            resolve({ status: 2 });
          } else {
            resolve({ status: 0 });
          }
        } else {
          dataUpdate = await masters.findOneAndUpdate(
            { code: trayData.trayId },
            {
              $set: {
                issued_user_name: null,
                actual_items: [],
                temp_array: [],
                from_merge: null,
                to_merge: null,
                sort_id: "Ready to Transfer to STX",
                description: trayData.description,
              },
            }
          );
          if (dataUpdate) {
            resolve({ status: 3 });
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
        let tray = await masters.find({
          prefix: "tray-master",
          cpc: location,
          type_taxanomy: "ST",
        });
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
      } else {
        let tray = await masters.find({
          $or: [
            {
              prefix: "tray-master",
              cpc: location,
              sort_id: type,
              type_taxanomy: "ST",
            },
          ],
        });
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
            $or: [
              {
                cpc: location,
                type_taxanomy: "ST",
                sort_id: "Ready to Pricing",
              },
              { cpc: location, type_taxanomy: "ST", sort_id: "Inuse" },
            ],
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
    console.log(username);
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
        resolve({ status:1 });
      } else {
        resolve({ status: 2 });
      }
    });
  },
  billedBinReport: (location) => {
    return new Promise(async (resolve, reject) => {
      let getData = await delivery.aggregate([{
        $match:{
          partner_shop: location,
          item_moved_to_billed_bin: "Yes",

        }
      },{
        $lookup: {
          from: "products",
          localField: `item_id`,
          foreignField: "vendor_sku_id",
          as: "products",
        },
      }
    ]);
      resolve(getData);
    });
  },
};
