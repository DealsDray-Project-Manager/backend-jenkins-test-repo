const { delivery } = require("../../Model/deliveryModel/delivery");
const { masters } = require("../../Model/mastersModel");
const { orders } = require("../../Model/ordersModel/ordersModel");
var mongoose = require("mongoose");

/****************************************************************************** */
module.exports = {
  getAssignedBagData: (userData) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.aggregate([
        { $match: { code: userData.bagId, sort_id: "Issued" } },
        {
          $lookup: {
            from: "deliveries",
            localField: "items.awbn_number",
            foreignField: "tracking_id",
            as: "delivery",
          },
        },
      ]);
      if (data.length != 0 && data?.items?.length != 0) {
        let tray = await masters
          .find({
            issued_user_name: userData.username,
            prefix: "tray-master",
            assign: "New Assign",
            sort_id: { $ne: "Closed By Warehouse" },
          })
          .sort({ sort_id: 1 });
        if (tray) {
          let obj = {
            tray: tray,
          };
          data.push(obj);
          resolve(data);
        }
      } else {
        resolve(data);
      }
    });
  },
  closeBags: (bagData) => {
    return new Promise(async (resolve, reject) => {
      let bagClose = await masters.updateOne(
        { code: bagData.bagId },
        {
          $set: {
            sort_id: "Closed By Bot",
            issued_user_name: null,
            closed_time_bot: Date.now(),
          },
        }
      );
      let trayClose = await masters.findOneAndUpdate(
        { code: bagData.trayId },
        {
          $set: {
            sort_id: "Closed By Bot",
            assign: "Old Assign",
            closed_time_bot: Date.now(),
          },
        }
      );
      if (trayClose) {
        for (let x of trayClose.items) {
          let deliveryTrck = await delivery.updateMany(
            { tracking_id: x.awbn_number },
            {
              $set: {
                tray_closed_by_bot: Date.now(),
                tray_status: "Closed By Bot",
              },
            }
          );
        }
        resolve(trayClose);
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
        prefix: "tray-master",
        "items.awbn_number": { $regex: ".*" + awbn + ".*", $options: "i" },
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
  traySegrigation: (trayData) => {
    trayData.added_time = Date.now();
    trayData._id = mongoose.Types.ObjectId();
    return new Promise(async (resolve, reject) => {
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
        let updateDelivery = await delivery.updateOne(
          { tracking_id: trayData.awbn_number },
          {
            $set: {
              tray_id: trayData.tray_id,
              tray_status: res.sort_id,
              tray_type: res.type_taxanomy,
              tray_location: "Bag Opening",
            },
          }
        );

        resolve(res);
      } else {
        resolve();
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
            },
          }
        );
        if (data) {
          for (let x of data.items) {
            let deliveryTrack = await delivery.updateMany(
              { tracking_id: x.awbn_number },
              {
                $set: {
                  tray_closed_by_bot: Date.now(),
                  tray_status: "Closed By Bot",
                },
              }
            );
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
