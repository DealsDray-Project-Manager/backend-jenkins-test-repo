const brand = require("../../Model/brandModel/brand");
const { delivery } = require("../../Model/deliveryModel/delivery");
const { masters } = require("../../Model/mastersModel");
const Elasticsearch = require("../../Elastic-search/elastic");
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
      };
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
        type_taxanomy: "WHT",
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
            sort_id: "Ready to RDL-Repair Issued to Merging",
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
        let assignToWht = await masters.updateOne(
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
          let updateDelivery = await delivery.findOneAndUpdate(
            { tracking_id: itemData.awbn_number },
            {
              $set: {
                wht_tray: itemData.wht_tray,
                wht_tray_assigned_date: Date.now(),
                tray_type: "WHT",
              },
            },
            {
              new: true,
              projection: { _id: 0 },
            }
          );
          let updateElastic = await Elasticsearch.uicCodeGen(updateDelivery);
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
            sort_id: "Ready to RDL-Repair Issued to Merging",
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
      let checkItemAdded=await masters.findOne({ code: mmtTrayData.toTray,"items.uic":mmtTrayData.item .uic});
      if(checkItemAdded){
          resolve({status:4})
      }
      else{
        
        if (checkTrayFull.limit == checkTrayFull.items.length) {
          resolve({ status: 3 });
        } else {
          let data = await masters.updateOne(
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
                  },
                },
                {
                  new: true,
                  projection: { _id: 0 },
                }
              );
              let updateElasticSearch = await Elasticsearch.uicCodeGen(
                updateDelivery
              );
            } else if (mmtTrayData.trayType == "ST") {
              let updateDelivery = await delivery.findOneAndUpdate(
                { tracking_id: mmtTrayData.item.tracking_id },
                {
                  $set: {
                    tray_location: "Sales-Sorting",
                    stx_tray_id: mmtTrayData.toTray,
                  },
                },
                {
                  new: true,
                  projection: { _id: 0 },
                }
              );
              let updateElasticSearch = await Elasticsearch.uicCodeGen(
                updateDelivery
              );
            } else if (mmtTrayData.trayType == "CT") {
              let updateDelivery = await delivery.findOneAndUpdate(
                { tracking_id: mmtTrayData.item.tracking_id },
                {
                  $set: {
                    tray_location: "Merging",
                    ctx_tray_id: mmtTrayData.toTray,
                  },
                },
                {
                  new: true,
                  projection: { _id: 0 },
                }
              );
              let updateElasticSearch = await Elasticsearch.uicCodeGen(
                updateDelivery
              );
            } else {
              let updateDelivery = await delivery.findOneAndUpdate(
                { tracking_id: mmtTrayData.item.awbn_number },
                {
                  $set: {
                    tray_location: "Merging",
                    tray_id: mmtTrayData.toTray,
                  },
                },
                {
                  new: true,
                  projection: { _id: 0 },
                }
              );
  
              let updateElasticSearch = await Elasticsearch.uicCodeGen(
                updateDelivery
              );
            }
            if (fromTrayItemRemove.modifiedCount !== 0) {
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
      let finedTray = await masters.findOne({ code: trayData.fromTray });
      if (finedTray.sort_id == "Audit Done Issued to Merging") {
        let fromtray = await masters.updateOne(
          { code: trayData.fromTray },
          {
            $set: {
              sort_id: "Audit Done Return from Merging",
              closed_time_sorting_agent: Date.now(),
              actual_items: [],
            },
          }
        );
        if (fromtray.modifiedCount !== 0) {
          let updateToTray = await masters.updateOne(
            { code: trayData.toTray },
            {
              $set: {
                sort_id: "Audit Done Return from Merging",
                closed_time_sorting_agent: Date.now(),
                actual_items: [],
              },
            }
          );
          if (updateToTray.modifiedCount !== 0) {
            resolve({ status: 1 });
          } else {
            resolve({ status: 0 });
          }
        } else {
          resolve({ status: 0 });
        }
      } else if (finedTray.sort_id == "Ready to BQC Issued to Merging") {
        let fromtray = await masters.updateOne(
          { code: trayData.fromTray },
          {
            $set: {
              sort_id: "Ready to BQC Merging Done",
              closed_time_sorting_agent: Date.now(),
              actual_items: [],
            },
          }
        );
        if (fromtray.modifiedCount !== 0) {
          let updateToTray = await masters.updateOne(
            { code: trayData.toTray },
            {
              $set: {
                sort_id: "Ready to BQC Merging Done",
                closed_time_sorting_agent: Date.now(),
                actual_items: [],
              },
            }
          );
          if (updateToTray.modifiedCount !== 0) {
            resolve({ status: 1 });
          } else {
            resolve({ status: 0 });
          }
        } else {
          resolve({ status: 0 });
        }
      }
      else if (finedTray.sort_id == "Ready to Audit Issued to Merging") {
        let fromtray = await masters.updateOne(
          { code: trayData.fromTray },
          {
            $set: {
              sort_id: "Ready to Audit Merging Done",
              closed_time_sorting_agent: Date.now(),
              actual_items: [],
            },
          }
        );
        if (fromtray.modifiedCount !== 0) {
          let updateToTray = await masters.updateOne(
            { code: trayData.toTray },
            {
              $set: {
                sort_id: "Ready to Audit Merging Done",
                closed_time_sorting_agent: Date.now(),
                actual_items: [],
              },
            }
          );
          if (updateToTray.modifiedCount !== 0) {
            resolve({ status: 1 });
          } else {
            resolve({ status: 0 });
          }
        } else {
          resolve({ status: 0 });
        }
      } else if (finedTray.sort_id == "Ready to RDL-Repair Issued to Merging") {
        let fromtray = await masters.updateOne(
          { code: trayData.fromTray },
          {
            $set: {
              sort_id: "Ready to RDL-Repair Merging Done",
              closed_time_sorting_agent: Date.now(),
              actual_items: [],
            },
          }
        );
        if (fromtray.modifiedCount !== 0) {
          let updateToTray = await masters.updateOne(
            { code: trayData.toTray },
            {
              $set: {
                sort_id: "Ready to RDL-Repair Merging Done",
                closed_time_sorting_agent: Date.now(),
                actual_items: [],
              },
            }
          );
          if (updateToTray.modifiedCount !== 0) {
            resolve({ status: 1 });
          } else {
            resolve({ status: 0 });
          }
        } else {
          resolve({ status: 0 });
        }
      } else if (finedTray.sort_id == "Issued to Sorting for Ctx to Stx") {
        let fromtray = await masters.updateOne(
          { code: trayData.fromTray },
          {
            $set: {
              sort_id: "Ctx to Stx Sorting Done",
              closed_time_sorting_agent: Date.now(),
              actual_items: [],
            },
          }
        );
        if (fromtray.modifiedCount !== 0) {
          let updateToTray = await masters.updateOne(
            { code: trayData.toTray },
            {
              $set: {
                sort_id: "Ctx to Stx Sorting Done",
                closed_time_sorting_agent: Date.now(),
                actual_items: [],
              },
            }
          );
          if (updateToTray.modifiedCount !== 0) {
            resolve({ status: 1 });
          } else {
            resolve({ status: 0 });
          }
        } else {
          resolve({ status: 0 });
        }
      } else {
        let fromtray = await masters.updateOne(
          { code: trayData.fromTray },
          {
            $set: {
              sort_id: "Merging Done",
              closed_time_sorting_agent: Date.now(),

              actual_items: [],
            },
          }
        );
        if (fromtray.modifiedCount !== 0) {
          let updateToTray = await masters.updateOne(
            { code: trayData.toTray },
            {
              $set: {
                sort_id: "Merging Done",
                closed_time_sorting_agent: Date.now(),
                actual_items: [],
              },
            }
          );
          if (updateToTray.modifiedCount !== 0) {
            resolve({ status: 1 });
          } else {
            resolve({ status: 0 });
          }
        } else {
          resolve({ status: 0 });
        }
      }
    });
  },
  getAssignedPickupTray: (username, type) => {
    return new Promise(async (resolve, reject) => {
      if (type == "fromTray") {
        let data = await masters.find({
          issued_user_name: username,
          type_taxanomy: "WHT",
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
      if (
        itemData.item.pickup_toTray == undefined ||
        itemData.item.pickup_toTray == "" ||
        itemData.item.pickup_toTray == null
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
        let updateData = await masters.updateOne(
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
            },
          },
          {
            new: true,
            projection: { _id: 0 },
          }
        );
        let updateElasticSearch = await Elasticsearch.uicCodeGen(
          updateDelivery
        );

        if (updateDelivery.modifiedCount !== 0) {
          resolve({ status: 1 });
        } else {
          resolve({ status: 0 });
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
        }
      );
      for (let x of updateFromTray?.items) {
        let deliveryUpdate = await delivery.findOneAndUpdate(
          { tracking_id: x.tracking_id },
          {
            $set: {
              tray_status: "Pickup Done Closed by Sorting Agent",
              tray_location: "Warehouse",
            },
          },
          {
            new: true,
            projection: { _id: 0 },
          }
        );
        let updateElasticSearch = await Elasticsearch.uicCodeGen(
          deliveryUpdate
        );
      }

      if (updateFromTray) {
        if (trayData.toTrayLength == trayData.toTrayLimit) {
          let updateToTray = await masters.findOneAndUpdate(
            { code: trayData.toTray },
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
            for (let x of updateToTray?.items) {
              let deliveryUpdate = await delivery.findOneAndUpdate(
                { tracking_id: x.tracking_id },
                {
                  $set: {
                    tray_status: "Pickup Done Closed by Sorting Agent",
                    tray_location: "Warehouse",
                  },
                },
                {
                  new: true,
                  projection: { _id: 0 },
                }
              );
              let updateElasticSearch = await Elasticsearch.uicCodeGen(
                deliveryUpdate
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
      let updateToTray = await masters.updateOne(
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
      if (updateToTray.modifiedCount !== 0) {
        resolve({ status: 1 });
      } else {
        resolve({ status: 0 });
      }
    });
  },
  /*------------------------------CTX TO STX SORTING 0---------------------------------*/
  sortingGetAssignedCtxTray: (user_name) => {
    console.log(user_name);
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        issued_user_name: user_name,
        sort_id: "Issued to Sorting for Ctx to Stx",
        to_merge: { $ne: null },
      });
      resolve(data);
    });
  },
};
