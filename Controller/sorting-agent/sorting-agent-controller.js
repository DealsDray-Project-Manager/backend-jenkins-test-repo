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
  getDataForStartSorting: (username, trayId) => {
    return new Promise(async (resolve, reject) => {
      let tray = {
        bot: "",
        wht: [],
      };
      tray.bot = await masters.findOne({
        code: trayId,
        issued_user_name: username,
        type_taxanomy: "BOT",
      });
      for (let x of tray.bot?.wht_tray) {
        let whtTray = await masters.findOne({ code: x });
        tray.wht.push(whtTray);
      }
      console.log(tray);
      resolve(tray);
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
            console.log(obj);
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
      brand: itemData.brand,
      model: itemData.model,
      order_id: itemData.order_id,
      order_date: itemData.order_date,
      status: itemData.status,
      bot_eval_result: {
        stickerOne: itemData.stickerOne,
        stickerTwo: itemData.stickerTwo,
        stickerThree: itemData.stickerThree,
        stickerFour: itemData.stickerFour,
        body_damage: itemData.body_damage,
      },
    };
    return new Promise(async (resolve, reject) => {
      let assignToWht = await masters.updateOne(
        {
          code: itemData.wht_tray,
        },
        {
          $push: {
            items: obj,
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
      console.log(data);
      if (data.modifiedCount != 0) {
        resolve(data);
      } else {
        resolve();
      }
    });
  },
  sendToWarehouse: (trayId) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.findOneAndUpdate(
        { code: trayId },
        {
          $set: {
            sort_id: "Closed By Sorting Agent",
            closed_time_sorting_agent: Date.now(),
          },
        }
      );
      for (let x of trayId.wht) {
        if (x.items.length == x.limit) {
          let whtTrayUpdate = await masters.findOneAndUpdate(
            { code: x.code },
            {
              $set: {
                sort_id: "Closed By Sorting Agent",
                closed_time_sorting_agent: Date.now(),
              },
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
          },
        }
      );
      if (data.modifiedCount != 0) {
        resolve(data);
      }
    });
  },
};
