const { delivery } = require("../../Model/deliveryModel/delivery");
const { masters } = require("../../Model/mastersModel");
const { orders } = require("../../Model/ordersModel/ordersModel");
var mongoose = require("mongoose");
const Elasticsearch = require("../../Elastic-search/elastic");
const { unitsActionLog } = require("../../Model/units-log/units-action-log");
const IISDOMAINPRDT =
  "https://prexo-v9-2-adminapi.dealsdray.com/bot-level/image/";

/****************************************************************************** */
module.exports = {
  getAssignedBagData: (userData) => {
    let data = [];
    return new Promise(async (resolve, reject) => {
      let bagData = await masters.findOne({
        code: userData.bagId,
        sort_id: "Issued",
        issued_user_name: userData.username,
      });
      if (bagData != null && data?.items?.length != 0) {
        data.push(bagData);
        let tray = await masters
          .find({
            issued_user_name: userData.username,
            prefix: "tray-master",
            assign: "New Assign",
          })
          .sort({ sort_id: 1 });
        if (tray.length != 0) {
          let obj = {
            tray: tray,
          };
          data.push(obj);
          resolve({ data: data, status: 1 });
        }
      } else {
        resolve({ status: 0 });
      }
    });
  },
  dashboardCount: (username) => {
    return new Promise(async (resolve, reject) => {
      let count = {
        bag: 0,
        tray: 0,
      };
      count.bag = await masters.count({
        issued_user_name: username,
        sort_id: "Issued",
        prefix: "bag-master",
      });
      count.tray = await masters.count({
        prefix: "tray-master",
        issued_user_name: username,
        sort_id: "Issued",
      });
      if (count) {
        resolve(count);
      }
    });
  },
  closeBags: (bagData) => {
    return new Promise(async (resolve, reject) => {
      let close = await masters.updateMany(
        { sort_id: "Issued", issued_user_name: bagData.username },
        {
          $set: {
            sort_id: "Closed By Bot",
            assign: "Old Assign",
            closed_time_bot: Date.now(),
            "track_tray.tray_close_by_bot": Date.now(),
          },
        }
      );
      let bag = await masters.findOne({ code: bagData.bagId });
      if (bag) {
        let state = "Tray";
        for (let x of bag.items) {
          let deliveryTrack = await delivery.findOneAndUpdate(
            { tracking_id: x.awbn_number },
            {
              $set: {
                tray_closed_by_bot: Date.now(),
                tray_status: "Closed By Bot",
                bot_report: x.bot_eval_result,
                updated_at: Date.now(),
              },
            },
            {
              new: true,
              projection: { _id: 0 },
            }
          );
          // const addLogsofUnits = await unitsActionLog.create({
          //   action_type: "Closed By BOT",
          //   created_at: Date.now(),
          //   awbn_number: x.awbn_number,
          //   user_name_of_action: bagData.username,
          //   report: x.bot_eval_result,
          //   uic: x.uic,
          //   tray_id: x.tray_id,
          //   user_type: "BOT",
          //   track_tray: state,
          //   description: `BOT done Closed By an agent:${bagData.username}`,
          // });
          // // let updateElasticSearch = await Elasticsearch.uicCodeGen(
          // //   deliveryTrack
          // // );
          // state = "Units";
        }
      }
      if (close.modifiedCount !== 0) {
        resolve(close);
      } else {
        resolve();
      }
    });
  },
  getAssignedBag: (username) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        issued_user_name: username,
        sort_id: "Issued",
        prefix: "bag-master",
      });
      if (data) {
        resolve(data);
      }
    });
  },
  scanAwbn: (bagid, awbn, username) => {
    return new Promise(async (resolve, reject) => {
      let checkAlredyScan = await masters.findOne({
        "items.awbn_number": { $regex: ".*" + awbn + ".*", $options: "i" },
        prefix: "tray-master",
        issued_user_name: username,
        assign: "New Assign",
      });
      if (checkAlredyScan) {
        resolve({ status: 0 });
      } else {
        let itemExistThisBag = await masters.findOne(
          {
            code: bagid,
            "items.awbn_number": { $regex: ".*" + awbn + ".*", $options: "i" },
          },
          {
            _id: 0,
            items: {
              $elemMatch: {
                awbn_number: { $regex: ".*" + awbn + ".*", $options: "i" },
              },
            },
          }
        );
        if (itemExistThisBag) {
          let data = await delivery.aggregate([
            {
              $match: {
                tracking_id: { $regex: ".*" + awbn + ".*", $options: "i" },
              },
            },
            {
              $lookup: {
                from: "products",
                localField: "item_id",
                foreignField: "vendor_sku_id",
                as: "products",
              },
            },
            {
              $unwind: "$products",
            },
          ]);
          let ordersGet = await orders.findOne({ order_id: data[0].order_id });
          data[0].order_date = ordersGet.order_date;
          data[0].delivery_date = data?.[0]?.delivery_date;
          data[0].status = itemExistThisBag.items[0].status;
          if (data.length != 0) {
            resolve({ status: 1, data: data });
          } else {
            resolve({ status: 3 });
          }
        } else {
          resolve({ status: 4 });
        }
      }
    });
  },
  traySegrigation: (trayData, docuemnts) => {
    if (
      docuemnts?.image_one &&
      docuemnts?.image_one[0] &&
      docuemnts != undefined
    ) {
      trayData.image_one = IISDOMAINPRDT + docuemnts.image_one[0].filename;
    } else {
      trayData.image_one = "";
    }
    if (
      docuemnts?.image_two &&
      docuemnts?.image_two[0] &&
      docuemnts != undefined
    ) {
      trayData.image_two = IISDOMAINPRDT + docuemnts.image_two[0].filename;
    } else {
      trayData.image_two = "";
    }
    if (
      docuemnts?.image_three &&
      docuemnts?.image_three[0] &&
      docuemnts != undefined
    ) {
      trayData.image_three = IISDOMAINPRDT + docuemnts.image_three[0].filename;
    } else {
      trayData.image_three = "";
    }
    if (
      docuemnts?.image_four &&
      docuemnts?.image_four[0] &&
      docuemnts != undefined
    ) {
      trayData.image_four = IISDOMAINPRDT + docuemnts.image_four[0].filename;
    } else {
      trayData.image_four = "";
    }
    if (
      docuemnts?.image_five &&
      docuemnts?.image_five[0] &&
      docuemnts != undefined
    ) {
      trayData.image_five = IISDOMAINPRDT + docuemnts.image_five[0].filename;
    } else {
      trayData.image_five = "";
    }
    if (
      docuemnts?.image_six &&
      docuemnts?.image_six[0] &&
      docuemnts != undefined
    ) {
      trayData.image_six = IISDOMAINPRDT + docuemnts.image_six[0].filename;
    } else {
      trayData.image_six = "";
    }
    trayData.added_time = Date.now();
    trayData._id = mongoose.Types.ObjectId();
    let obj = {
      stickerOne: trayData.stickerOne,
      stickerTwo: trayData.stickerTwo,
      stickerThree: trayData.stickerThree,
      stickerFour: trayData.stickerFour,
      body_damage: trayData.body_damage,
      body_damage_des: trayData.body_damage_des,
      model_brand: trayData.model_brand,
    };
    trayData.bot_eval_result = obj;
    return new Promise(async (resolve, reject) => {
      let checkItemAddedOrNot = await masters.findOne({
        code: trayData.tray_id,
        "items.awbn_number": trayData.awbn_number,
      });
      if (checkItemAddedOrNot == null) {
        let res = await masters.findOneAndUpdate(
          {
            code: trayData.tray_id,
          },
          {
            $push: {
              items: trayData,
            },
            $set: {
              closed_time_bot: Date.now(),
            },
          }
        );
        if (res) {
          const addLogsofUnits = await unitsActionLog.create({
            action_type: "Item transferred to tray",
            created_at: Date.now(),
            awbn_number: trayData.awbn_number,
            user_name_of_action: res.issued_user_name,
            report: obj,
            uic: trayData.uic,
            tray_id: trayData.tray_id,
            user_type: "BOT",
            track_tray: "Both",
            tray_unit_in_count: 1,
            description: `Item transferred to bot tray done by an agent:${res.issued_user_name}.from bag:${trayData?.bag_id}`,
          });
          let updateDelivery = await delivery.findOneAndUpdate(
            { tracking_id: trayData.awbn_number },
            {
              $set: {
                tray_id: trayData.tray_id,
                tray_status: res.sort_id,
                tray_type: res.type_taxanomy,
                tray_location: "Bag Opening",
                bot_report: obj,
                updated_at: Date.now(),
                image_one: trayData.image_one,
                image_two: trayData.image_two,
                image_three: trayData.image_three,
                image_five: trayData.image_five,
                image_six: trayData.image_six,
                image_four: trayData.image_four,
              },
            },
            {
              new: true,
              projection: { _id: 0 },
            }
          );
          resolve({ status: 1 });
        } else {
          resolve({ status: 2 });
        }
      } else {
        resolve({ status: 3 });
      }
    });
  },
  deleteTrayItem: (trayData) => {
    trayData.id = mongoose.Types.ObjectId(trayData.id);
    return new Promise(async (resolve, reject) => {
      let data = await masters.updateOne(
        { code: trayData.trayId },
        {
          $pull: {
            items: {
              _id: trayData.id,
            },
          },
        },
        { new: true }
      );
      if (data.modifiedCount != 0) {
        let deliveryUpdate = await delivery.updateOne(
          { tracking_id: trayData.awbn },
          {
            $set: {
              tray_id: "",
              tray_status: "",
              tray_type: "",
              tray_location: "",
            },
          }
        );
        resolve(data);
      } else {
        resolve();
      }
    });
  },
  trayClose: (trayId) => {
    return new Promise(async (resolve, reject) => {
      let closeOrNot = await masters.findOne({
        code: trayId,
        sort_id: { $ne: "Issued" },
      });
      if (closeOrNot) {
        resolve({ status: 2 });
      } else {
        let data = await masters.findOneAndUpdate(
          { code: trayId },
          {
            $set: {
              sort_id: "Closed By Bot",
              closed_time_bot: Date.now(),
              actual_items: [],
              "track_tray.tray_close_by_bot": Date.now(),
            },
          }
        );
        if (data) {
          let state = "Tray";
          for (let x of data.items) {
            let unitsLogCreation = await unitsActionLog.create({
              action_type: "Closed By Bot",
              created_at: Date.now(),
              user_name_of_action: data.issued_user_name,
              user_type: "BOT",
              awbn_number: x.awbn_number,
              tray_id: trayId,
              track_tray: state,
              description: `Closed by bot agent :${data.issued_user_name}`,
            });
            let deliveryTrack = await delivery.findOneAndUpdate(
              { tracking_id: x.awbn_number },
              {
                $set: {
                  tray_closed_by_bot: Date.now(),
                  tray_status: "Closed By Bot",
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
          resolve({ status: 3 });
        }
      }
    });
  },
  getTray: (username) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        prefix: "tray-master",
        issued_user_name: username,
        sort_id: "Issued",
      });
      if (data) {
        resolve(data);
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
};
