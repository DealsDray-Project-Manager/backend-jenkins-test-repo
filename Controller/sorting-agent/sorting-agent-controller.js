const brand = require("../../Model/brandModel/brand");
const { delivery } = require("../../Model/deliveryModel/delivery");
const { masters } = require("../../Model/mastersModel");
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
  dashboard:(username)=>{
    return new Promise(async(resolve,reject)=>{
      let count={
        sorting:0,
        merge:0
      }
      count.sorting=await  masters.count({
        issued_user_name: username,
        type_taxanomy: "BOT",
        sort_id: "Issued to sorting agent",
      });
      count.merge=await masters.count({
        issued_user_name: username,
        to_merge: { $ne: null },
        sort_id: "Issued to Merging",
      });
      if(count){
        resolve(count)
      }

    })
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
          },
         
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
          let updateDelivery = await delivery.updateOne(
            { tracking_id: itemData.awbn_number },
            {
              $set: {
                wht_tray: itemData.wht_tray,
                wht_tray_assigned_date: Date.now(),
                tray_type: "WHT",
              },
            }
          );
          if (updateDelivery.modifiedCount !== 0) {
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
        issued_user_name: username,
        to_merge: { $ne: null },
        sort_id: "Issued to Merging",
      });
      console.log(data);
      if (data) {
        resolve(data);
      }
    });
  },
  itemShiftToMmt: (mmtTrayData) => {
    return new Promise(async (resolve, reject) => {
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
            },
          }
        );
        let updateDelivery = await delivery.updateOne(
          { tracking_id: mmtTrayData.item.awbn_number },
          {
            $set: {
              tray_location: "Merging",
              tray_id: mmtTrayData.toTray,
            },
          }
        );
        if (fromTrayItemRemove.modifiedCount !== 0) {
          resolve({ status: 1 });
        } else {
          resolve({ status: 0 });
        }
      } else {
        resolve({ status: 1 });
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
              items: [],
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
      } else {
        let fromtray = await masters.updateOne(
          { code: trayData.fromTray },
          {
            $set: {
              sort_id: "Merging Done",
              closed_time_sorting_agent: Date.now(),
              items: [],
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
};
