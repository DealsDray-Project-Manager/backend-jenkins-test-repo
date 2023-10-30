const brand = require("../../Model/brandModel/brand");
const { delivery } = require("../../Model/deliveryModel/delivery");
const { masters } = require("../../Model/mastersModel");
var mongoose = require("mongoose");
const Elasticsearch = require("../../Elastic-search/elastic");
const { unitsActionLog } = require("../../Model/units-log/units-action-log");
module.exports = {
  getAssignedSortingTray: (username) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        issued_user_name: username,
        type_taxanomy: "BOT",
        sort_id: "Issued to sorting agent",
      });
      if (data) {
        resolve(data);
      }
    });
  },
  dashboard: (username) => {
    return new Promise(async (resolve, reject) => {
      let count = {
        sorting: 0,
        merge: 0,
        pickup: 0,
        pickupToTray: 0,
        ctxtoStxSorting: 0,
        whtToRpTraySorting: 0,
        rpTrayCount: 0,
        displayGradingRequest: 0,
      };
      count.displayGradingRequest = await masters.count({
        issued_user_name: username,
        type_taxanomy: "ST",
        sort_id: "Issued to Sorting Agent For Display Grading",
      });
      count.rpTrayCount = await masters.count({
        issued_user_name: username,
        type_taxanomy: "RPT",
        sort_id: "Issued to sorting (Wht to rp)",
      });
      count.whtToRpTraySorting = await masters.count({
        issued_user_name: username,
        type_taxanomy: "WHT",
        sort_id: "Issued to sorting (Wht to rp)",
      });
      count.sorting = await masters.count({
        issued_user_name: username,
        type_taxanomy: "BOT",
        sort_id: "Issued to sorting agent",
      });
      count.ctxtoStxSorting = await masters.count({
        issued_user_name: username,
        sort_id: "Issued to Sorting for Ctx to Stx",
        to_merge: { $ne: null },
      });
      count.pickup = await masters.count({
        issued_user_name: username,
        sort_id: "Issued to Sorting for Pickup",
        to_tray_for_pickup: { $ne: null },
      });
      count.pickupToTray = await masters.count({
        issued_user_name: username,
        type_taxanomy: "WHT",
        sort_id: "Issued to Sorting for Pickup",
        to_tray_for_pickup: { $eq: null },
      });
      count.merge = await masters.count({
        $or: [
          {
            issued_user_name: username,
            to_merge: { $ne: null },
            sort_id: "Issued to Merging",
          },
          {
            issued_user_name: username,
            to_merge: { $ne: null },
            sort_id: "Audit Done Issued to Merging",
          },
          {
            issued_user_name: username,
            to_merge: { $ne: null },
            sort_id: "Ready to RDL-2 Issued to Merging",
          },
          {
            issued_user_name: username,
            to_merge: { $ne: null },
            sort_id: "Ready to BQC Issued to Merging",
          },
          {
            issued_user_name: username,
            to_merge: { $ne: null },
            sort_id: "Ready to Audit Issued to Merging",
          },
        ],
      });
      if (count) {
        resolve(count);
      }
    });
  },
  getDataForStartSorting: (username, trayId) => {
    return new Promise(async (resolve, reject) => {
      let tray = {
        bot: "",
        wht: [],
      };
      let arr = [];
      tray.bot = await masters.findOne({
        code: trayId,
        type_taxanomy: "BOT",
        sort_id: "Issued to sorting agent",
        issued_user_name: username,
      });
      if (tray.bot !== null) {
        for (let x of tray.bot?.wht_tray) {
          let whtTray = await masters.findOne({ code: x });
          if (arr.length == 0) {
            arr.push(x);
            tray.wht.push(whtTray);
          } else {
            if (arr.includes(x)) {
            } else {
              tray.wht.push(whtTray);
            }
          }
        }
        resolve({ tray: tray, status: 1 });
      } else {
        resolve({ status: 0 });
      }
    });
  },
  checkUic: (trayData) => {
    return new Promise(async (resolve, reject) => {
      let data = await delivery.findOne({ "uic_code.code": trayData.uic });
      if (data) {
        let checkItemExistsInTheTray = await masters.findOne({
          code: trayData.trayId,
          items: { $elemMatch: { uic: trayData.uic } },
        });
        if (checkItemExistsInTheTray) {
          let alreadyAdded = await masters.findOne({
            code: trayData.trayId,
            actual_items: { $elemMatch: { uic: trayData.uic } },
          });
          let obj;

          if (alreadyAdded) {
            for (let x of checkItemExistsInTheTray?.items) {
              if (x.uic == trayData.uic) {
                obj = x;
                break;
              }
            }
            resolve({ status: 1, data: obj });
          } else {
            resolve({ status: 4 });
          }
        } else {
          resolve({ status: 3 });
        }
      } else {
        resolve({ status: 2 });
      }
    });
  },
  itemShiftToWht: (itemData) => {
    let obj = {
      tracking_id: itemData.awbn_number,
      bot_agent: itemData.user_name,
      tray_id: itemData.tray_id,
      uic: itemData.uic,
      imei: itemData.imei,
      muic: itemData.muic,
      brand_name: itemData.brand,
      model_name: itemData.model,
      order_id: itemData.order_id,
      order_date: itemData.order_date,
      status: itemData.status,
      closed_time: itemData.closed_time,
      bot_eval_result: {
        stickerOne: itemData.stickerOne,
        stickerTwo: itemData.stickerTwo,
        stickerThree: itemData.stickerThree,
        stickerFour: itemData.stickerFour,
        body_damage: itemData.body_damage,
        body_damage_des: itemData.body_damage_des,
        model_brand: itemData.model_brand,
      },
    };
    return new Promise(async (resolve, reject) => {
      let checkItemExist = await masters.findOne({
        code: itemData.wht_tray,
        "items.uic": obj.uic,
      });
      if (checkItemExist == null) {
        let assignToWht = await masters.findOneAndUpdate(
          {
            code: itemData.wht_tray,
          },
          {
            $push: {
              items: obj,
            },
            $pull: {
              temp_array: {
                awbn_number: obj.tracking_id,
              },
            },
          }
        );
        let data = await masters.updateOne(
          {
            code: itemData.tray_id,
            actual_items: { $elemMatch: { uic: itemData.uic } },
          },
          {
            $pull: {
              actual_items: {
                uic: itemData.uic,
              },
            },
          }
        );
        if (data.modifiedCount != 0) {
          let unitsLogCreation = await unitsActionLog.create({
            action_type: "Item transfered to WHT",
            created_at: Date.now(),
            user_name_of_action: assignToWht.issued_user_name,
            user_type: "PRC Sorting",
            uic: itemData.uic,
            tray_id: itemData.wht_tray,
            track_tray: "Units",
            description: `Item transferred to WHT done by agent: ${assignToWht.issued_user_name}`,
          });
          let updateDelivery = await delivery.findOneAndUpdate(
            { tracking_id: itemData.awbn_number },
            {
              $set: {
                wht_tray: itemData.wht_tray,
                wht_tray_assigned_date: Date.now(),
                tray_type: "WHT",
                updated_at: Date.now(),
              },
            },
            {
              new: true,
              projection: { _id: 0 },
            }
          );
          // let updateElastic = await Elasticsearch.uicCodeGen(updateDelivery);
          if (updateDelivery) {
            resolve({ status: 3 });
          }
        } else {
          resolve({ status: 1 });
        }
      } else {
        resolve({ status: 2 });
      }
    });
  },
  sendToWarehouse: (trayId) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.findOneAndUpdate(
        { code: trayId.trayId },
        {
          $set: {
            sort_id: "Closed By Sorting Agent",
            closed_time_sorting_agent: Date.now(),
            "track_tray.sorting_agent_close_bot_wht": Date.now(),
          },
        }
      );
      if (data) {
        let checkAnyBotTray = await masters.findOne({
          issued_user_name: data.issued_user_name,
          sort_id: "Issued to sorting agent",
          type_taxanomy: "BOT",
        });
        if (checkAnyBotTray) {
          for (let x of data.wht_tray) {
            let whtTray = await masters.findOne({ code: x });
            if (whtTray.items.length == whtTray.limit) {
              let whtTrayUpdate = await masters.findOneAndUpdate(
                { code: x },
                {
                  $set: {
                    sort_id: "Closed By Sorting Agent",
                    closed_time_sorting_agent: Date.now(),
                    "track_tray.sorting_agent_close_bot_wht": Date.now(),
                    actual_items: [],
                  },
                }
              );
            }
          }
        } else {
          let whtTrayUpdate = await masters.updateMany(
            {
              type_taxanomy: "WHT",
              sort_id: "Issued to sorting agent",
              issued_user_name: data.issued_user_name,
            },
            {
              $set: {
                sort_id: "Closed By Sorting Agent",
                closed_time_sorting_agent: Date.now(),
                "track_tray.sorting_agent_close_bot_wht": Date.now(),
                actual_items: [],
              },
            }
          );
        }
        resolve({ status: 1, data: data });
      } else {
        resolve({ status: 0 });
      }
    });
  },
  getAssignedWht: (username) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        issued_user_name: username,
        sort_id: "Issued to sorting agent",
        type_taxanomy: "WHT",
      });
      if (data) {
        resolve(data);
      }
    });
  },
  trayCloseWht: (trayId) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.updateOne(
        { code: trayId },
        {
          $set: {
            sort_id: "Closed By Sorting Agent",
            closed_time_sorting_agent: Date.now(),
            actual_items: [],
          },
        }
      );
      if (data.modifiedCount != 0) {
        resolve(data);
      }
    });
  },
  getAssignedMmtTray: (username) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        $or: [
          {
            issued_user_name: username,
            to_merge: { $ne: null },
            sort_id: "Audit Done Issued to Merging",
          },
          {
            issued_user_name: username,
            to_merge: { $ne: null },
            sort_id: "Issued to Merging",
          },
          {
            issued_user_name: username,
            to_merge: { $ne: null },
            sort_id: "Ready to BQC Issued to Merging",
          },
          {
            issued_user_name: username,
            to_merge: { $ne: null },
            sort_id: "Ready to RDL-2 Issued to Merging",
          },
          {
            issued_user_name: username,
            to_merge: { $ne: null },
            sort_id: "Ready to Audit Issued to Merging",
          },
        ],
      });
      if (data) {
        resolve(data);
      }
    });
  },
  itemShiftToMmt: (mmtTrayData) => {
    return new Promise(async (resolve, reject) => {
      let checkTrayFull = await masters.findOne({ code: mmtTrayData.toTray });
      let checkItemAdded = await masters.findOne({
        code: mmtTrayData.toTray,
        "items.uic": mmtTrayData.item.uic,
      });
      if (checkItemAdded) {
        resolve({ status: 4 });
      } else {
        if (checkTrayFull.limit == checkTrayFull.items.length) {
          resolve({ status: 3 });
        } else {
          mmtTrayData.item._id = mongoose.Types.ObjectId();
          let data = await masters.findOneAndUpdate(
            { code: mmtTrayData.toTray },
            {
              $push: {
                items: mmtTrayData.item,
              },
            }
          );
          if (data.modifiedCount !== 0) {
            let fromTrayItemRemove = await masters.updateOne(
              { code: mmtTrayData.fromTray },
              {
                $pull: {
                  actual_items: {
                    uic: mmtTrayData.item.uic,
                  },
                  items: {
                    uic: mmtTrayData.item.uic,
                  },
                },
              }
            );
            if (mmtTrayData.trayType == "WHT") {
              let updateDelivery = await delivery.findOneAndUpdate(
                { tracking_id: mmtTrayData.item.tracking_id },
                {
                  $set: {
                    tray_location: "Merging",
                    wht_tray: mmtTrayData.toTray,
                    updated_at: Date.now(),
                  },
                },
                {
                  new: true,
                  projection: { _id: 0 },
                }
              );
            } else if (mmtTrayData.trayType == "ST") {
              let updateDelivery = await delivery.findOneAndUpdate(
                { tracking_id: mmtTrayData.item.tracking_id },
                {
                  $set: {
                    tray_location: "Sales-Sorting",
                    stx_tray_id: mmtTrayData.toTray,
                    tray_type: "ST",
                    updated_at: Date.now(),
                  },
                },
                {
                  new: true,
                  projection: { _id: 0 },
                }
              );
            } else if (mmtTrayData.trayType == "CT") {
              let updateDelivery = await delivery.findOneAndUpdate(
                { tracking_id: mmtTrayData.item.tracking_id },
                {
                  $set: {
                    tray_location: "Merging",
                    ctx_tray_id: mmtTrayData.toTray,
                    updated_at: Date.now(),
                  },
                },
                {
                  new: true,
                  projection: { _id: 0 },
                }
              );
            } else {
              let updateDelivery = await delivery.findOneAndUpdate(
                { tracking_id: mmtTrayData.item.awbn_number },
                {
                  $set: {
                    tray_location: "Merging",
                    tray_id: mmtTrayData.toTray,
                    updated_at: Date.now(),
                  },
                },
                {
                  new: true,
                  projection: { _id: 0 },
                }
              );
            }
            if (fromTrayItemRemove.modifiedCount !== 0) {
              let unitsLogCreation = await unitsActionLog.create({
                action_type: "Item transfered to tray",
                created_at: Date.now(),
                user_name_of_action: data.issued_user_name,
                user_type: "PRC Sorting",
                uic: mmtTrayData.item.uic,
                tray_id: data.code,
                track_tray: "units",
                description: `Item transferred to tray done by agent: ${data.issued_user_name}`,
              });
              resolve({ status: 1 });
            } else {
              resolve({ status: 0 });
            }
          } else {
            resolve({ status: 1 });
          }
        }
      }
    });
  },
  mergeDoneSendToWh: (trayData) => {
    return new Promise(async (resolve, reject) => {
      let trayCodeArr = [];
      let finedTray = await masters.findOne({ code: trayData.fromTray });
      let fromtray, updateToTray;
      let stage;
      if (finedTray.sort_id == "Audit Done Issued to Merging") {
        stage = "Audit Done Return from Merging";
        fromtray = await masters.findOneAndUpdate(
          { code: trayData.fromTray },
          {
            $set: {
              sort_id: "Audit Done Return from Merging",
              closed_time_sorting_agent: Date.now(),
              "track_tray.merging_done_close_sorting": Date.now(),
              actual_items: [],
            },
          }
        );
        if (fromtray) {
          updateToTray = await masters.findOneAndUpdate(
            { code: trayData.toTray },
            {
              $set: {
                sort_id: "Audit Done Return from Merging",
                closed_time_sorting_agent: Date.now(),
                "track_tray.merging_done_close_sorting": Date.now(),
                actual_items: [],
              },
            }
          );
        } else {
          resolve({ status: 0 });
        }
      } else if (finedTray.sort_id == "Ready to BQC Issued to Merging") {
        stage = "Ready to BQC Merging Done";
        fromtray = await masters.findOneAndUpdate(
          { code: trayData.fromTray },
          {
            $set: {
              sort_id: "Ready to BQC Merging Done",
              closed_time_sorting_agent: Date.now(),
              "track_tray.merging_done_close_sorting": Date.now(),
              actual_items: [],
            },
          }
        );
        if (fromtray) {
          updateToTray = await masters.findOneAndUpdate(
            { code: trayData.toTray },
            {
              $set: {
                sort_id: "Ready to BQC Merging Done",
                closed_time_sorting_agent: Date.now(),
                "track_tray.merging_done_close_sorting": Date.now(),
                actual_items: [],
              },
            }
          );
        } else {
          resolve({ status: 0 });
        }
      } else if (finedTray.sort_id == "Ready to Audit Issued to Merging") {
        stage = "Ready to Audit Merging Done";
        fromtray = await masters.findOneAndUpdate(
          { code: trayData.fromTray },
          {
            $set: {
              sort_id: "Ready to Audit Merging Done",
              closed_time_sorting_agent: Date.now(),
              "track_tray.merging_done_close_sorting": Date.now(),
              actual_items: [],
            },
          }
        );
        if (fromtray) {
          updateToTray = await masters.findOneAndUpdate(
            { code: trayData.toTray },
            {
              $set: {
                sort_id: "Ready to Audit Merging Done",
                closed_time_sorting_agent: Date.now(),
                "track_tray.merging_done_close_sorting": Date.now(),
                actual_items: [],
              },
            }
          );
        } else {
          resolve({ status: 0 });
        }
      } else if (finedTray.sort_id == "Ready to RDL-2 Issued to Merging") {
        stage = "Ready to RDL-2 Merging Done";
        fromtray = await masters.findOneAndUpdate(
          { code: trayData.fromTray },
          {
            $set: {
              sort_id: "Ready to RDL-2 Merging Done",
              closed_time_sorting_agent: Date.now(),
              "track_tray.merging_done_close_sorting": Date.now(),
              actual_items: [],
            },
          }
        );
        if (fromtray) {
          updateToTray = await masters.findOneAndUpdate(
            { code: trayData.toTray },
            {
              $set: {
                sort_id: "Ready to RDL-2 Merging Done",
                closed_time_sorting_agent: Date.now(),
                "track_tray.merging_done_close_sorting": Date.now(),
                actual_items: [],
              },
            }
          );
        } else {
          resolve({ status: 0 });
        }
      } else if (finedTray.sort_id == "Issued to Sorting for Ctx to Stx") {
        stage = "Ctx to Stx Sorting Done";
        fromtray = await masters.findOneAndUpdate(
          { code: trayData.fromTray },
          {
            $set: {
              sort_id: "Ctx to Stx Sorting Done",
              closed_time_sorting_agent: Date.now(),
              "track_tray.sorting_agent_close_bot_wht": Date.now(),
              actual_items: [],
            },
          }
        );
        if (fromtray) {
          updateToTray = await masters.findOneAndUpdate(
            { code: trayData.toTray },
            {
              $set: {
                sort_id: "Ctx to Stx Sorting Done",
                closed_time_sorting_agent: Date.now(),
                "track_tray.sorting_agent_close_bot_wht": Date.now(),
                actual_items: [],
              },
            }
          );
        } else {
          resolve({ status: 0 });
        }
      } else {
        stage = "Merging Done";
        fromtray = await masters.findOneAndUpdate(
          { code: trayData.fromTray },
          {
            $set: {
              sort_id: "Merging Done",
              closed_time_sorting_agent: Date.now(),
              "track_tray.merging_done_close_sorting": Date.now(),
              actual_items: [],
            },
          }
        );
        if (fromtray) {
          updateToTray = await masters.findOneAndUpdate(
            { code: trayData.toTray },
            {
              $set: {
                sort_id: "Merging Done",
                closed_time_sorting_agent: Date.now(),
                "track_tray.merging_done_close_sorting": Date.now(),
                actual_items: [],
              },
            }
          );
        } else {
          resolve({ status: 0 });
        }
      }
      let actUser = "PRC Sorting";
      if (updateToTray.type_taxanomy == "ST") {
        actUser = "Sales Sorting";
      }
      if (fromtray) {
        let state = "Tray";
        if (fromtray.items?.length == 0) {
          await unitsActionLog.create({
            action_type: stage,
            created_at: Date.now(),
            agent_name: fromtray.issued_user_name,
            tray_id: fromtray.code,
            user_type: actUser,
            track_tray: state,
            description: `${stage} and sent to warehouse by agent:${fromtray.issued_user_name}`,
          });
        }
        for (let x of fromtray.items) {
          await unitsActionLog.create({
            action_type: "Merging Done",
            created_at: Date.now(),
            uic: x.uic,
            agent_name: fromtray.issued_user_name,
            tray_id: fromtray.code,
            user_type: actUser,
            track_tray: state,
            description: `${stage} and sent to warehouse by agent:${fromtray.issued_user_name}`,
          });
          state = "Units";
        }
        let state1 = "Tray";
        for (let x of updateToTray.items) {
          await unitsActionLog.create({
            action_type: "Merging Done",
            created_at: Date.now(),
            uic: x.uic,
            agent_name: fromtray.issued_user_name,
            tray_id: updateToTray.code,
            user_type: actUser,
            track_tray: state1,
            description: `${stage} by agent :${fromtray.issued_user_name}`,
          });
          state1 = "Units";
        }
        resolve({ status: 1 });
      } else {
        resolve({ status: 0 });
      }
    });
  },
  getAssignedPickupTray: (username, type) => {
    return new Promise(async (resolve, reject) => {
      if (type == "fromTray") {
        let data = await masters.find({
          issued_user_name: username,
          sort_id: "Issued to Sorting for Pickup",
          to_tray_for_pickup: { $ne: null },
        });
        if (data) {
          resolve(data);
        }
      } else {
        let data = await masters.find({
          issued_user_name: username,
          type_taxanomy: "WHT",
          sort_id: "Issued to Sorting for Pickup",
          to_tray_for_pickup: null,
        });
        if (data) {
          resolve(data);
        }
      }
    });
  },
  pickupGetOntrayStartPage: (trayId) => {
    return new Promise(async (resolve, reject) => {
      let arr = [];
      let data = await masters.findOne({
        sort_id: "Issued to Sorting for Pickup",
        code: trayId,
      });
      if (data) {
        let toTray = await masters.findOne({
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
  pickupItemTransferUicScan: (uicData) => {
    return new Promise(async (resolve, reject) => {
      let itemPresent = await delivery.findOne({
        "uic_code.code": uicData.uic,
      });
      if (itemPresent) {
        let checkItemPresentIntray = await masters.findOne({
          code: uicData.fromTray,
          items: { $elemMatch: { uic: uicData.uic } },
        });
        if (checkItemPresentIntray) {
          let alreadyAdded = await masters.findOne({
            $or: [
              {
                code: uicData.fromTray,
                temp_array: { $elemMatch: { uic: uicData.uic } },
              },
              {
                code: uicData.toTray,
                items: { $elemMatch: { uic: uicData.uic } },
              },
            ],
          });
          let obj;

          if (alreadyAdded == null) {
            for (let x of checkItemPresentIntray?.items) {
              if (x.uic == uicData.uic) {
                obj = x;
                break;
              }
            }
            resolve({ status: 1, data: obj });
          } else {
            resolve({ status: 4 });
          }
        } else {
          resolve({ status: 3 });
        }
      } else {
        resolve({ status: 2 });
      }
    });
  },
  pickupItemTrasfer: (itemData) => {
    return new Promise(async (resolve, reject) => {
      let checkAlreadyAdded = await masters.findOne({
        code: itemData.fromTray,
        "actual_items.uic": itemData.item.uic,
      });
      if (checkAlreadyAdded) {
        resolve({ status: 3 });
      } else {
        if (
          itemData.item.pickup_toTray == undefined ||
          itemData.item.pickup_toTray == "" ||
          itemData.item.pickup_toTray == null ||
          itemData.item.pickup_toTray !== itemData.toTray 
        ) {
          let updateData = await masters.updateOne(
            { code: itemData.fromTray },
            {
              $push: {
                temp_array: itemData.item,
                actual_items: itemData.item,
              },
            }
          );
          if (updateData.modifiedCount != 0) {
            resolve({ status: 2 });
          } else {
            resolve({ status: 0 });
          }
        } else {
          let updateData = await masters.findOneAndUpdate(
            { code: itemData.fromTray },
            {
              $push: {
                actual_items: itemData.item,
              },
            }
          );
          itemData.item.pickup_toTray = null;
          let itemTransfer = await masters.updateOne(
            {
              code: itemData.toTray,
            },
            {
              $push: {
                items: itemData.item,
              },
            }
          );

          let updateDelivery = await delivery.findOneAndUpdate(
            { "uic_code.code": itemData.item.uic },
            {
              $set: {
                wht_tray: itemData.toTray,
                updated_at: Date.now(),
              },
            },
            {
              new: true,
              projection: { _id: 0 },
            }
          );

          if (updateDelivery.modifiedCount !== 0) {
            resolve({ status: 1 });
          } else {
            resolve({ status: 0 });
          }
        }
      }
    });
  },
  pickupDoneClose: (trayData) => {
    return new Promise(async (resolve, reject) => {
      let updateFromTray = await masters.findOneAndUpdate(
        { code: trayData.fromTray },
        {
          $set: {
            temp_array: [],
            actual_items: [],
            sort_id: "Pickup Done Closed by Sorting Agent",
            closed_date_agent: Date.now(),
            items: trayData.allItem,
          },
        },
        { new: true } // This option returns the updated document
      );
      let state = "Tray";
      if (updateFromTray?.items?.length == 0) {
        await unitsActionLog.create({
          action_type: "Pickup Done Closed by Sorting Agent",
          created_at: Date.now(),
          agent_name: updateFromTray.issued_user_name,
          user_type: "PRC Sorting",
          tray_id: updateFromTray.code,
          track_tray: state,
          description: `Pickup Done Closed by Sorting Agent :${updateFromTray.issued_user_name}`,
        });
      }
      for (let x of updateFromTray?.items) {
        await unitsActionLog.create({
          action_type: "Pickup Done Closed by Sorting Agent",
          created_at: Date.now(),
          agent_name: updateFromTray.issued_user_name,
          user_type: "PRC Sorting",
          uic: x.uic,
          tray_id: updateFromTray.code,
          track_tray: state,
          description: `Pickup Done Closed by Sorting Agent :${updateFromTray.issued_user_name}`,
        });
        state = "Units";
        let deliveryUpdate = await delivery.findOneAndUpdate(
          { tracking_id: x.tracking_id },
          {
            $set: {
              tray_status: "Pickup Done Closed by Sorting Agent",
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
      if (updateFromTray) {
        if (
          trayData.toTrayLength == trayData.toTrayLimit ||
          trayData?.type == "To Tray Need To Close"
        ) {
          let updateToTray = await masters.findOneAndUpdate(
            { code: trayData.toTray },
            {
              $set: {
                temp_array: [],
                actual_items: [],
                sort_id: "Pickup Done Closed by Sorting Agent",
                closed_date_agent: Date.now(),
              },
            },
            { new: true } // This option returns the updated document
          );
          if (updateToTray) {
            let state1 = "Tray";
            for (let x of updateToTray?.items) {
              let unitsLogCreation = await unitsActionLog.create({
                action_type: "Pickup Done Closed by Sorting Agent",
                created_at: Date.now(),
                agent_name: updateToTray.issued_user_name,
                user_type: "PRC Sorting",
                uic: x.uic,
                tray_id: updateToTray.code,
                track_tray: state1,
                description: `Pickup Done Closed by Sorting Agent :${updateToTray.issued_user_name}`,
              });
              state1 = "Units";
              let deliveryUpdate = await delivery.findOneAndUpdate(
                { tracking_id: x.tracking_id },
                {
                  $set: {
                    tray_status: "Pickup Done Closed by Sorting Agent",
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
          }
        } else {
          resolve({ status: 1 });
        }
      } else {
        resolve({ status: 2 });
      }
    });
  },
  pickupDoneEodClose: (trayId) => {
    return new Promise(async (resolve, reject) => {
      let updateToTray = await masters.findOneAndUpdate(
        { code: trayId },
        {
          $set: {
            temp_array: [],
            actual_items: [],
            sort_id: "Pickup Done Closed by Sorting Agent",
            closed_date_agent: Date.now(),
          },
        }
      );

      if (updateToTray) {
        let state1 = "Tray";
        for (let x of updateToTray?.items) {
          let unitsLogCreation = await unitsActionLog.create({
            action_type: "Pickup Done Closed by Sorting Agent",
            created_at: Date.now(),
            agent_name: updateToTray.issued_user_name,
            user_type: "PRC Sorting",
            uic: x.uic,
            tray_id: updateToTray.code,
            track_tray: state1,
            description: `Pickup Done Closed by Sorting Agent :${updateToTray.issued_user_name}`,
          });
          state1 = "Units";
          let deliveryUpdate = await delivery.findOneAndUpdate(
            { tracking_id: x.tracking_id },
            {
              $set: {
                tray_status: "Pickup Done Closed by Sorting Agent",
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
  /*------------------------------CTX TO STX SORTING 0---------------------------------*/
  sortingGetAssignedCtxTray: (user_name) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        issued_user_name: user_name,
        sort_id: "Issued to Sorting for Ctx to Stx",
        to_merge: { $ne: null },
      });
      resolve(data);
    });
  },
  sortingGetAssignedTrayForWhtToRp: (user_name, trayType) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        issued_user_name: user_name,
        sort_id: "Issued to sorting (Wht to rp)",
        type_taxanomy: trayType,
      });
      resolve(data);
    });
  },
  sortingForWhtToRpStartPage: (trayId, username) => {
    return new Promise(async (resolve, reject) => {
      const getTray = await masters.findOne({ code: trayId });
      if (getTray) {
        if (getTray.issued_user_name == username) {
          if (getTray.sort_id == "Issued to sorting (Wht to rp)") {
            const rpTray = await masters.findOne({ code: getTray.rp_tray });
            if (rpTray) {
              resolve({ status: 1, tray: getTray, rpTray: rpTray });
              // if (rpTray.sort_id == "Issued to sorting (Wht to rp)") {
              // } else {
              //   resolve({ status: 3 });
              // }
            } else {
              resolve({ status: 3 });
            }
          } else {
            resolve({ status: 2 });
          }
        } else {
          resolve({ status: 2 });
        }
      } else {
        resolve({ status3 });
      }
    });
  },
  whtToRpItemScan: (uicData) => {
    return new Promise(async (resolve, reject) => {
      let itemPresent = await delivery.findOne({
        "uic_code.code": uicData.uic,
      });
      if (itemPresent) {
        let checkItemPresentIntray = await masters.findOne({
          code: uicData.whtTray,
          items: { $elemMatch: { uic: uicData.uic } },
        });
        if (checkItemPresentIntray) {
          let alreadyAdded = await masters.findOne({
            $or: [
              {
                code: uicData.whtTray,
                actual_items: { $elemMatch: { uic: uicData.uic } },
              },
              {
                code: uicData.rpTray,
                items: { $elemMatch: { uic: uicData.uic } },
              },
            ],
          });
          let obj;

          if (alreadyAdded == null) {
            for (let x of checkItemPresentIntray?.items) {
              if (x.uic == uicData.uic) {
                obj = x;
                break;
              }
            }
            resolve({ status: 1, data: obj });
          } else {
            resolve({ status: 4 });
          }
        } else {
          resolve({ status: 3 });
        }
      } else {
        resolve({ status: 2 });
      }
    });
  },
  whtToRpItemTransfer: (itemData) => {
    return new Promise(async (resolve, reject) => {
      let checkAlreadyAdded = await masters.findOne({
        code: itemData.fromTray,
        "actual_items.uic": itemData.item.uic,
      });
      if (checkAlreadyAdded) {
        resolve({ status: 3 });
      } else {
        if (
          itemData.item.rp_tray == undefined ||
          itemData.item.rp_tray == "" ||
          itemData.item.rp_tray == null
        ) {
          let updateData = await masters.updateOne(
            { code: itemData.whtTray },
            {
              $push: {
                actual_items: itemData.item,
              },
            }
          );
          if (updateData.modifiedCount != 0) {
            resolve({ status: 2 });
          } else {
            resolve({ status: 0 });
          }
        } else {
          let updateData = await masters.updateOne(
            { code: itemData.whtTray },
            {
              $pull: {
                items: {
                  uic: itemData.item.uic,
                },
              },
            }
          );
          itemData.item.rp_tray = null;
          let itemTransfer = await masters.updateOne(
            {
              code: itemData.rpTray,
            },
            {
              $push: {
                items: itemData.item,
              },
            }
          );

          let updateDelivery = await delivery.findOneAndUpdate(
            { "uic_code.code": itemData.item.uic },
            {
              $set: {
                rp_tray: itemData.rpTray,
                updated_at: Date.now(),
              },
            },
            {
              new: true,
              projection: { _id: 0 },
            }
          );
          if (updateDelivery.modifiedCount !== 0) {
            resolve({ status: 1 });
          } else {
            resolve({ status: 0 });
          }
        }
      }
    });
  },
  whtToTRpSortingDoneCloseTray: (trayDetails) => {
    return new Promise(async (resolve, reject) => {
      let data;
      let rpTray;
      if (
        trayDetails.type == "RPT" &&
        trayDetails.screen !== "Starting - page"
      ) {
        data = await masters.findOneAndUpdate(
          { code: trayDetails.rpTray },
          {
            $set: {
              sort_id: "Sorting done (Wht to rp)",
              temp_array: [],
              closed_date_agent: Date.now(),
            },
          }
        );
      } else if (
        trayDetails.type == "RPT" &&
        trayDetails.screen == "Starting - page"
      ) {
        rpTray = await masters.findOneAndUpdate(
          { code: trayDetails.rpTray },
          {
            $set: {
              sort_id: "Sorting done (Wht to rp)",
              temp_array: [],
              "track_tray.wht_to_rp_sorting_done_sorting": Date.now(),
              closed_date_agent: Date.now(),
            },
          }
        );
        data = await masters.findOneAndUpdate(
          { code: trayDetails.whtTray },
          {
            $set: {
              sort_id: "Sorting done (Wht to rp)",
              temp_array: [],
              "track_tray.wht_to_rp_sorting_done_sorting": Date.now(),
              actual_items: [],
              closed_date_agent: Date.now(),
            },
          }
        );
      } else {
        data = await masters.findOneAndUpdate(
          { code: trayDetails.whtTray },
          {
            $set: {
              sort_id: "Sorting done (Wht to rp)",
              temp_array: [],
              "track_tray.wht_to_rp_sorting_done_sorting": Date.now(),
              actual_items: [],
              closed_date_agent: Date.now(),
            },
          }
        );
      }
      if (data) {
        let updateDelivery;
        let concatenatedArray;
        if (
          trayDetails.type == "RPT" &&
          trayDetails.screen == "Starting - page"
        ) {
          concatenatedArray = data.items.concat(rpTray.items);
        } else {
          concatenatedArray = data.items;
        }
        let state = "Tray";
        if (data?.items?.length == 0) {
          await unitsActionLog.create({
            action_type: "Sorting done (Wht to rp)",
            created_at: Date.now(),
            user_name_of_action: trayDetails.actionUser,
            agent_name: data.issued_user_name,
            user_type: "PRC Soriting",
            tray_id: data.code,
            track_tray: state,
            description: `Sorting done (Wht to rp) by agent :${data.issued_user_name} `,
          });
        }
        for (let x of concatenatedArray) {
          let trayIdCode = data.code;
          if (x.rp_tray !== undefined) {
            trayIdCode = x.rp_tray;
          }
          await unitsActionLog.create({
            action_type: "Sorting done (Wht to rp)",
            created_at: Date.now(),
            user_name_of_action: trayDetails.actionUser,
            agent_name: data.issued_user_name,
            user_type: "PRC Soriting",
            uic: x.uic,
            tray_id: trayIdCode,
            track_tray: state,
            description: `Sorting done (Wht to rp) by agent :${data.issued_user_name} `,
          });
          state = "Units";
          updateDelivery = await delivery.findOneAndUpdate(
            { "uic_code.code": x.uic },
            {
              $set: {
                wht_to_rp_sorting_done: Date.now(),
                tray_status: "Sorting done (Wht to rp)",
                tray_location: "Warehouse",
                updated_at: Date.now(),
              },
            }
          );
        }
        if (updateDelivery) {
          resolve({ status: 1 });
        } else {
          resolve({ status: 0 });
        }
      } else {
        resolve({ status: 0 });
      }
    });
  },
  getDisplayGradingRequests: async (username) => {
    try {
      const findTray = await masters.find({
        type_taxanomy: "ST",
        sort_id: "Issued to Sorting Agent For Display Grading",
        issued_user_name: username,
      });
      return findTray;
    } catch (error) {
      return error;
    }
  },
  getDisplayGradingStartWork: async (trayId, username) => {
    try {
      const fetchTrayData = await masters.findOne({ code: trayId });
      if (fetchTrayData) {
        if (
          fetchTrayData.sort_id ==
            "Issued to Sorting Agent For Display Grading" &&
          fetchTrayData.issued_user_name == username
        ) {
          return { status: 1, trayData: fetchTrayData };
        } else {
          return { status: 2 };
        }
      } else {
        return { status: 0 };
      }
    } catch (error) {
      return error;
    }
  },
  addItemsForDisplayGrading: async (uicData) => {
    try {
      uicData.item["screen_type_utility"] = uicData.screenType;
      let fetchData;
      if (uicData.screenType == "C") {
        fetchData = await masters.updateOne(
          {
            code: uicData.trayId,
            sort_id: "Issued to Sorting Agent For Display Grading",
            "actual_items.uic": { $nin: [uicData.item.uic] },
          },
          {
            $push: {
              actual_items: uicData.item,
            },
            $inc: {
              count_of_c_display: 1,
            },
          }
        );
      } else {
        fetchData = await masters.updateOne(
          {
            code: uicData.trayId,
            sort_id: "Issued to Sorting Agent For Display Grading",
            "actual_items.uic": { $nin: [uicData.item.uic] },
          },
          {
            $push: {
              actual_items: uicData.item,
            },
            $inc: {
              count_of_g_display: 1,
            },
          }
        );
      }
      if (fetchData.modifiedCount !== 0) {
        await unitsActionLog.create({
          action_type: "Display Grading",
          created_at: Date.now(),
          uic: uicData.item.uic,
          tray_id: uicData.trayId,
          user_name_of_action: uicData.username,
          track_tray: "Units",
          user_type: "Sales Sorting",
          description: `Added the Screen type the agent :${uicData.username},screen Type:${uicData.screenType}`,
        });
        return { status: 1 };
      } else {
        return { status: 0 };
      }
    } catch (error) {
      return error;
    }
  },
  DisplayGradeCloseTray: async (trayId) => {
    try {
      const findTray = await masters.findOne({ code: trayId });
      if (findTray) {
        const getTrayData = await masters.findOneAndUpdate(
          {
            code: trayId,
            sort_id: "Issued to Sorting Agent For Display Grading",
          },
          {
            $set: {
              sort_id: "Display Grading Done Closed By Sorting",
              items: findTray.actual_items,
              actual_items: [],
              requested_date: Date.now(),
            },
          },
          {
            new: true,
          }
        );
        if (getTrayData) {
          let state = "Tray";
          for (let x of getTrayData?.items) {
            let obj = {
              scree_type: x.screen_type_utility,
              sorting_agent_name: getTrayData.issued_user_name,
            };
            await unitsActionLog.create({
              action_type: "Display Grade done",
              created_at: Date.now(),
              uic: x.uic,
              tray_id: trayId,
              user_name_of_action: getTrayData.issued_user_name,
              report: obj,
              track_tray: state,
              user_type: "Sales Sorting",
              description: `Display Grading done closed by the agent :${getTrayData.issued_user_name}`,
            });
            state = "Units";
            let updateDelivery = await delivery.updateOne(
              { "uic_code.code": x.uic },
              {
                $set: {
                  copy_grading_report: obj,
                  copy_grading_done_date: Date.now(),
                  tray_status: "Display Grading Done Closed By Sorting",
                  tray_location: "Sales Warehouse",
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
          return { status: 0 };
        }
      } else {
        return { status: 0 };
      }
    } catch (error) {
      return error;
    }
  },
  copyGradingCheckUic: (uic, trayId) => {
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
            let copyGradeReport = {};
            if (data?.copy_grading_report !== undefined) {
              (copyGradeReport.grade = data?.copy_grading_report?.scree_type),
                (copyGradeReport.date = data?.copy_grading_done_date);
            }

            for (let x of checkExitThisTray.items) {
              if (x.uic == uic) {
                obj = x;
              }
            }
            resolve({ status: 4, data: obj, copyGradeReport: copyGradeReport });
          }
        } else {
          resolve({ status: 2 });
        }
      } else {
        resolve({ status: 1 });
      }
    });
  },
};
