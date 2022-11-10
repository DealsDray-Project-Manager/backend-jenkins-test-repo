const { orders } = require("../../Model/ordersModel/ordersModel");
const { masters } = require("../../Model/mastersModel");
const { delivery } = require("../../Model/deliveryModel/delivery");
const { user } = require("../../Model/userModel");
var mongoose = require("mongoose");
const { pickList } = require("../../Model/picklist_model/model");
const { products } = require("../../Model/productModel/product");
const { itemClub } = require("../../Model/itemClubModel/club");
/********************************************************************/
module.exports = {
  dashboard: () => {
    return new Promise(async (resolve, reject) => {
      let obj = {
        orders: 0,
      };
      obj.orders = await orders.count({});
      resolve(obj);
    });
  },
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
  getBagOneRequest: (masterId) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        code: masterId,
      });
      if (data.length != 0 && data?.items?.length != 0) {
        resolve(data);
      } else {
        resolve(data);
      }
    });
  },
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

              // $or: [
              //   {
              //     "items.awbn_number": {
              //       $regex: ".*" + awbn + ".*",
              //       $options: "i",
              //     },
              //     code: { $ne: bagId },
              //   },
              //   {
              //     "items.tracking_id": {
              //       $regex: ".*" + awbn + ".*",
              //       $options: "i",
              //     },
              //     code: { $ne: bagId },
              //   },
              // ],
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
      if (data.status !== "Duplicate") {
        let updateDelivery = await delivery.updateOne(
          { tracking_id: data.awbn_number },
          {
            $set: {
              bag_id: data.bag_id,
              stockin_date: Date.now(),
              stock_in_status: data.status,
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
          },
        }
      );
      if (data) {
        for (let x of data.items) {
          let updateDelivery = await delivery.updateOne(
            { tracking_id: x.awbn_number },
            {
              $set: {
                bag_close_date: Date.now(),
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
        let updateDelivery;
        let getValidItemBag;
        if (bgData.state == "Invalid") {
          getValidItemBag = await masters
            .findOne(
              {
                "items.awbn_number": bgData.awbn,
                "items.status": "Invalid",
                prefix: "bag-master",
              },
              {
                _id: 0,
                code: 1,
                items: {
                  $elemMatch: { awbn_number: bgData.awbn, status: "Invalid" },
                },
              }
            )
            .sort({ _id: -1 });
          if (getValidItemBag == null) {
            getValidItemBag = await masters.findOne(
              {
                "items.awbn_number": bgData.awbn,
                "items.status": "Valid",
                prefix: "bag-master",
              },
              {
                _id: 0,
                code: 1,
                items: {
                  $elemMatch: { awbn_number: bgData.awbn, status: "Valid" },
                },
              }
            );
          }
          updateDelivery = await delivery.updateOne(
            { tracking_id: bgData.awbn },
            {
              $set: {
                bag_id: getValidItemBag.code,
                stockin_date: getValidItemBag.items[0].sotckin_date,
                stock_in_status: getValidItemBag.items[0].status,
              },
            }
          );
        } else {
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
      }
      if (data.modifiedCount !== 0) {
        resolve(data);
      }
    });
  },
  removeActualItem: (bgData) => {
    bgData.id = mongoose.Types.ObjectId(bgData.id);
    // console.log(id);
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
  issueToBot: (issueData) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.findOneAndUpdate(
        { code: issueData.bagId },
        {
          sort_id: "Issued",
          description: issueData.description,
          uic: issueData.uic,
          sleaves: issueData.sleaves,
          assigned_date: Date.now(),
        }
      );
      if (data) {
        for (let x of data.items) {
          let updateDelivery = await delivery.updateOne(
            { tracking_id: x.awbn_number },
            {
              $set: {
                assign_to_agent: Date.now(),
                agent_name: data.issued_user_name,
              },
            }
          );
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
          resolve(data);
        }
      } else {
        resolve();
      }
    });
  },
  getRequests: (location) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        sort_id: "Requested to Warehouse",
        cpc: location,
      });
      resolve(data);
    });
  },
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
            issued_user_name: { $ne: null },
          });
          if (assignedOrNot) {
            resolve({ status: 2 });
          } else {
            resolve({ status: 1, id: trayId, tray_status: data.sort_id });
          }
        } else {
          resolve({ status: 4 });
        }
      } else {
        resolve({ status: 3 });
      }
    });
  },
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
            code: trayId,
            issued_user_name: { $ne: null },
          });
          if (assignedOrNot) {
            resolve({ status: 2 });
          } else {
            resolve({ status: 1, id: trayId, tray_status: data.sort_id });
          }
        } else {
          resolve({ status: 4 });
        }
      } else {
        resolve({ status: 3 });
      }
    });
  },
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
            issued_user_name: { $ne: null },
          });
          if (assignedOrNot) {
            resolve({ status: 2 });
          } else {
            resolve({ status: 1, id: trayId, tray_status: data.sort_id });
          }
        } else {
          resolve({ status: 4 });
        }
      } else {
        resolve({ status: 3 });
      }
    });
  },
  trayCloseRequest: (location) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        $or: [
          {
            prefix: "tray-master",
            sort_id: "Closed By Bot",
            type_taxanomy: { $ne: "BOT" },
            type_taxanomy: { $ne: "WHT" },
            cpc: location,
          },
          {
            prefix: "tray-master",
            sort_id: "Received From BOT",
            type_taxanomy: { $ne: "BOT" },
            type_taxanomy: { $ne: "WHT" },
            cpc: location,
          },
        ],
      });
      if (data) {
        resolve(data);
      }
    });
  },
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
  trayReceived: (trayData) => {
    return new Promise(async (resolve, reject) => {
      if (trayData.type === "charging") {
        let data = await masters.findOneAndUpdate(
          { code: trayData.trayId },
          {
            $set: {
              sort_id: "Received From Charging",
            },
          }
        );
        if (data) {
          for (let i = 0; i < data.actual_items.length; i++) {
            let deliveryTrack = await delivery.updateMany(
              { tracking_id: data.actual_items[i].tracking_id },
              {
                $set: {
                  tray_status: "Received From Charging",
                  tray_location: "Warehouse",
                  charging_done_received: Date.now(),
                },
              }
            );
          }
          resolve(data);
        } else {
          resolve(data);
        }
      } else {
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
            let deliveryTrack = await delivery.updateMany(
              { tracking_id: data.items[i].awbn_number },
              {
                $set: {
                  tray_status: "Received From BOT",
                  tray_location: "Warehouse",
                  bot_done_received: Date.now(),
                },
              }
            );
          }
          resolve(data);
        } else {
          resolve(data);
        }
      }
    });
  },
  getBotUsersNewTrayAssing: () => {
    return new Promise(async (resolve, reject) => {
      let data = await user
        .find({
          status: "Active",
          user_type: "Bag Opening",
        })
        .sort({ user_name: 1 });
      if (data) {
        resolve(data);
      }
    });
  },
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
  trayClose: (trayData) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.updateOne(
        { code: trayData.trayId },
        {
          $set: {
            sort_id: "Closed By Warehouse",
            closed_time_wharehouse: Date.now(),
          },
        }
      );
      if (data.modifiedCount != 0) {
        let deliveryTrack = await delivery.updateMany(
          { tray_Id: trayData.trayId },
          {
            $set: {
              warehouse_close_date: Date.now(),
              tray_status: "Closed By Warehouse",
            },
          }
        );
        resolve(data);
      } else {
        resolve();
      }
    });
  },
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
              },
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
                "items.$.model": findProduct.model,
                "items.$.brand": findProduct.brand,
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
          // let obj = {
          //   tracking_id: x.awbn_number,
          //   bot_agent: data.issued_user_name,
          //   tray_id: data.code,
          //   uic: getItemId.uic_code.code,
          //   imei: x.imei,
          //   closed_time: new Date(new Date().toISOString().split("T")[0]),
          //   wht_tray: null,
          //   status: x.status,
          // };
          // // let putToModel = await products.updateOne(
          // //   { vendor_sku_id: getItemId.item_id },
          // //   {
          // //     $push: {
          // //       item: obj,
          // //     },
          // //   }
          // // );
          // let checkModel = await itemClub.findOne({
          //   vendor_sku_id: getItemId.item_id,
          //   cpc: trayData.location,
          //   created_at: new Date(new Date().toISOString().split("T")[0]),
          // });
          // if (checkModel != null) {
          //   let findProductData = await itemClub.updateOne(
          //     {
          //       vendor_sku_id: getItemId.item_id,
          //       cpc: trayData.location,
          //       created_at: new Date(new Date().toISOString().split("T")[0]),
          //     },
          //     {
          //       $push: {
          //         item: obj,
          //       },
          //     }
          //   );
          // } else {
          //   let newObj = {
          //     created_at: new Date(new Date().toISOString().split("T")[0]),
          //     vendor_sku_id: getItemId.item_id,
          //     cpc: trayData.location,
          //     item: [],
          //   };
          //   newObj.item.push(obj);
          //   let findProductData = await itemClub.create(newObj);
          // }
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
        // for (let I of trayData.items) {
        //   let deliveryTrack = await delivery.updateMany(
        //     { tracking_id: x.awbn_number },
        //     {
        //       $set: {
        //         warehouse_close_date: Date.now(),
        //
        //       },
        //     }
        //   );
        // }

        resolve(data);
      } else {
        resolve();
      }
    });
  },
  getBotWarehouseClosed: (location) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        type_taxanomy: "BOT",
        prefix: "tray-master",
        sort_id: "Closed By Warehouse",
        cpc: location,
      });
      if (data) {
        resolve(data);
      }
    });
  },
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
  autoFetchTray: (userName) => {
    return new Promise(async (resolve, reject) => {
      let mmtTrayCode = null;
      let pmtTrayCode = null;
      let mmt = await masters.findOne({
        type_taxanomy: "MMT",
        issued_user_name: userName,
        sort_id: "Issued",
      });
      let pmt = await masters.findOne({
        type_taxanomy: "PMT",
        issued_user_name: userName,
        sort_id: "Issued",
      });
      if (mmt) {
        mmtTrayCode = mmt.code;
      }
      if (pmt) {
        pmtTrayCode = pmt.code;
      }
      resolve({ mmtTray: mmtTrayCode, pmtTray: pmtTrayCode });
    });
  },
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
      if (data) {
        resolve(data);
      }
    });
  },
  picklistRequest: (date, location) => {
    return new Promise(async (resolve, reject) => {
      let data = await itemClub.aggregate([
        {
          $match: {
            item: { $ne: [] },
            cpc: location,
            created_at: new Date(date.toISOString().split("T")[0]),
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "vendor_sku_id",
            foreignField: "vendor_sku_id",
            as: "product",
          },
        },
      ]);

      resolve(data);
    });
  },
  viewModelClubItem: (id, vendor_sku_id) => {
    id = mongoose.Types.ObjectId(id);
    return new Promise(async (resolve, reject) => {
      let data = await itemClub.aggregate([
        {
          $match: {
            _id: id,
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "vendor_sku_id",
            foreignField: "vendor_sku_id",
            as: "product",
          },
        },
      ]);
      resolve(data);
    });
  },
  getWhtTray: (trayType, skuId, brand, model, location) => {
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
          items: { $exists: true, $eq: [] },
        });
      } else {
        data = await masters.find({
          prefix: "tray-master",
          type_taxanomy: "WHT",
          brand: brand,
          model: model,
          sort_id: "Inuse",
          cpc: location,
          "items.vendor_sku_id": skuId,
          $expr: {
            $and: [
              { $lt: [{ $size: "$items" }, "$limit"] },
              { $gte: [{ $size: "$items" }, 1] },
            ],
          },
        });
      }
      resolve(data);
    });
  },
  assignToWht: (dataOfItem) => {
    return new Promise(async (resolve, reject) => {
      let data;
      for (let x of dataOfItem.item) {
        x.wht_tray = dataOfItem.wht_tray;
        x.vendor_sku_id = dataOfItem.sku;
        data = await masters.updateOne(
          { code: dataOfItem.wht_tray },
          {
            $push: {
              temp_array: x,
            },
            $set: {
              sort_id: "Inuse",
            },
          },
          { multi: true }
        );
        let updateBotTraySecond = await masters.updateOne(
          {
            code: dataOfItem.bot_tray,
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
      console.log(data);
      if (data.modifiedCount !== 0) {
        let updateBotTray = await masters.updateOne(
          {
            code: dataOfItem.bot_tray,
            temp_array: {
              $elemMatch: {
                muic: dataOfItem.muic,
              },
            },
          },
          {
            $set: {
              "temp_array.$.assigned_count": dataOfItem.count,
            },
            $push: {
              "temp_array.$.wht_tray":
                dataOfItem.wht_tray + "-" + `(${dataOfItem.item.length})`,
              wht_tray: dataOfItem.wht_tray,
            },
          }
        );
        resolve(data);
      }
    });
  },
  getAssignedTray: (trayId, location, brand, model) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        "temp_array.trayId": trayId,
        type_taxanomy: "WHT",
        sort_id: "Inuse",
        cpc: location,
        brand: brand,
        model: model,
      });
      if (data) {
        resolve(data);
      }
    });
  },
  removeWhtTrayItem: (whtTrayDetails) => {
    return new Promise(async (resolve, reject) => {
      let allItem = await masters.findOne({ code: whtTrayDetails.botTray });
      let data = await masters.findOneAndUpdate(
        { code: whtTrayDetails.code },
        {
          $pull: {
            temp_array: {
              trayId: whtTrayDetails.botTray,
            },
          },
        },
        { multi: true, new: true }
      );
      if (data?.temp_array?.length == 0) {
        let updateStatus = await masters.updateOne(
          { code: whtTrayDetails.code },
          {
            $set: {
              sort_id: "Open",
            },
          }
        );
      }
      // console.log(data);
      if (data) {
        // let updateProductWhtTray = await itemClub.findOneAndUpdate(
        //   { _id: whtTrayDetails.itemClub },
        //   {
        //     $pull: {
        //       wht_tray: whtTrayDetails.code,
        //     },
        //   }
        // );
        let count = 0;
        for (let x of allItem.items) {
          if (x.wht_tray == whtTrayDetails.code) {
            count++;
            let pullItemTray = await masters.updateOne(
              {
                items: { $elemMatch: { awbn_number: x.awbn_number } },
                code: whtTrayDetails.botTray,
              },
              {
                $set: {
                  "items.$.wht_tray": null,
                },
                $pull: {
                  wht_tray:
                    whtTrayDetails.code +
                    "-" +
                    `(${whtTrayDetails.count - count})` +
                    "-",
                },
              }
            );
          }
        }
        console.log(whtTrayDetails.count - count);
        let countUpDate = await masters.updateOne(
          {
            code: whtTrayDetails.botTray,
            temp_array: { $elemMatch: { muic: whtTrayDetails.muic } },
          },
          {
            $set: {
              "temp_array.$.assigned_count": whtTrayDetails.count - count,
            },
          }
        );
        console.log(countUpDate);
        resolve(data);
      }
    });
  },
  createPickList: (pickListData) => {
    return new Promise(async (resolve, reject) => {
      let piclListCount = await pickList.count({});
      let whtTray = await masters.find({
        "items.vendor_sku_id": pickListData.skuId,
        sort_id: "Inuse",
      });
      let obj = {
        created_user_name: pickListData.user_name,
        items: [],
        created_at: Date.now(),
        pick_list_id: "P0" + Number(piclListCount + 1),
        vendor_sku_id: pickListData.skuId,
        model_name: pickListData.model_name,
        brand_name: pickListData.brand_name,
        muic: pickListData.muic,
      };
      let addPicklist;
      if (whtTray) {
        for (let x of whtTray) {
          for (let y of x.items) {
            if (y.vendor_sku_id == pickListData.skuId) {
              obj.items.push(y);
            }
          }
        }
        addPicklist = await pickList.create(obj);
      }
      let data = await itemClub.updateOne(
        { _id: pickListData._id },
        {
          $set: {
            pick_list_status: "Created",
            pick_list_id: addPicklist.pick_list_id,
            pick_list_items: Number(
              pickListData.picklist_items + addPicklist.items.length
            ),
          },
        }
      );
      if (data.matchedCount !== 0) {
        resolve(data);
      }
    });
  },
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
  getInUseWhtTray: (status, location) => {
    return new Promise(async (resolve, reject) => {
      let data;
      if (
        status == "Closed" ||
        status == "Ready to BQC" ||
        status == "Ready to Audit" ||
        status == "Inuse"
      ) {
        data = await masters.find({
          prefix: "tray-master",
          type_taxanomy: "WHT",
          sort_id: status,
          cpc: location,
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
            // {
            //   prefix: "tray-master",
            //   type_taxanomy: "WHT",
            //   sort_id: "Charge Done",
            //   cpc: location,
            // },
          ],
        });
      }
      resolve(data);
    });
  },
  sortPicklist: (date, location) => {
    return new Promise(async (resolve, reject) => {
      let data = await itemClub.aggregate([
        {
          $match: {
            item: { $ne: [] },
            cpc: location,
            created_at: new Date(date),
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "vendor_sku_id",
            foreignField: "vendor_sku_id",
            as: "product",
          },
        },
      ]);
      resolve(data);
    });
  },
  getWhtTrayitem: (trayId) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.findOne({ code: trayId });
      resolve(data);
    });
  },
  getPickList: (pick_list_id) => {
    return new Promise(async (resolve, reject) => {
      let data = await pickList.findOne({ pick_list_id: pick_list_id });
      if (data) {
        resolve(data);
      }
    });
  },
  actualPickListUicCheck: (uic, picklistId) => {
    return new Promise(async (resolve, reject) => {
      let checkAlreadyAdded = await pickList.findOne({
        "actual.uic": uic,
        pick_list_id: picklistId,
      });
      if (checkAlreadyAdded) {
        resolve({ status: 3 });
      } else {
        let uicPresent = await delivery.findOne({ "uic_code.code": uic });
        if (uicPresent) {
          let pickListUic = await pickList.findOne({
            pick_list_id: picklistId,
            "items.uic": uic,
          });
          if (pickListUic) {
            resolve({ status: 1 });
          } else {
            resolve({ status: 4 });
          }
        } else {
          resolve({ status: 2 });
        }
      }
    });
  },
  addActualPickListItem: (itemDetails) => {
    return new Promise(async (resolve, reject) => {
      let data = await pickList.updateOne(
        { pick_list_id: itemDetails.picklist_id },
        {
          $push: {
            actual: itemDetails.items,
          },
        }
      );
      if (data.modifiedCount != 0) {
        let deliveryUpdate = await delivery.updateOne(
          {
            tracking_id: itemDetails.items.tracking_id,
          },
          {
            $set: {
              wht_tray: itemDetails.items.wht_tray,
              wht_tray_assigned_date: Date.now(),
            },
          }
        );
        resolve(data);
      } else {
        resolve(data);
      }
    });
  },
  picklistActualRemoveItem: (pickListData) => {
    return new Promise(async (resolve, reject) => {
      let data = await pickList.updateOne(
        { pick_list_id: pickListData.picklistId },
        {
          $pull: {
            actual: {
              _id: pickListData.id,
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
  closePicklist: (pickListId) => {
    return new Promise(async (resolve, reject) => {
      let data = await pickList.findOneAndUpdate(
        { pick_list_id: pickListId },
        {
          $set: {
            closed_time: Date.now(),
            pick_list_status: "Closed",
          },
        }
      );
      if (data) {
        let removeItem;
        for (let x of data.items) {
          let updateTrackingItem = await delivery.updateOne(
            { tracking_id: x.tracking_id },
            {
              $set: {
                wht_tray: x.wht_tray,
                wht_tray_assigned_date: Date.now(),
              },
            }
          );
          let changeStatusTray = await masters.updateOne(
            { code: x.wht_tray },
            {
              $set: {
                sort_id: "Closed",
              },
            }
          );
          removeItem = await itemClub.findOneAndUpdate(
            { pick_list_id: pickListId },
            {
              $pull: {
                item: {
                  uic: x.uic,
                },
                wht_tray: x.wht_tray,
              },
            }
          );
        }
        let changeAll = await itemClub.updateOne(
          { _id: removeItem._id },
          {
            $set: {
              pick_list_id: null,
              pick_list_items: removeItem.pick_list_items - data.items.length,
              pick_list_status: "Pending",
              count_assigned_tray: removeItem.item.length,
            },
          }
        );
        if (changeAll.modifiedCount != 0) {
          resolve(changeAll);
        } else {
          resolve();
        }
      }
    });
  },
  getAllPicklist: () => {
    return new Promise(async (resolve, reject) => {
      let data = await pickList.find({}).sort({ _id: -1 });
      resolve(data);
    });
  },
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
  getChargingRequest: (status, location) => {
    if (status == "Send_for_charging") {
      return new Promise(async (resolve, reject) => {
        let data = await masters.find({
          prefix: "tray-master",
          type_taxanomy: "WHT",
          sort_id: "Send for charging",
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
  addWhtActual: (trayItemData) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.updateOne(
        { code: trayItemData.trayId },
        {
          $push: {
            actual_items: trayItemData.item,
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
              sort_id: "Issued to BQC",
              assigned_date: Date.now(),
            },
          }
        );
        if (data) {
          for (let x of data.items) {
            let deliveryUpdate = await delivery.updateOne(
              { tracking_id: x.tracking_id },
              {
                $set: {
                  agent_name_bqc: data.issued_user_name,
                  assign_to_agent_bqc: Date.now(),
                },
              }
            );
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
            let deliveryUpdate = await delivery.updateOne(
              { tracking_id: x.tracking_id },
              {
                $set: {
                  agent_name_charging: data.issued_user_name,
                  assign_to_agent_charging: Date.now(),
                },
              }
            );
          }
        }
      }
      if (data.modifiedCount != 0) {
        resolve(data);
      } else {
        resolve();
      }
    });
  },
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
        ],
      });
      if (data) {
        resolve(data);
      }
    });
  },
  chargingDoneRecieved: (trayId) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.findOne({ code: trayId });
      if (data) {
        resolve(data);
      } else {
        resolve();
      }
    });
  },
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
  sortingDoneActualItemPut: (trayItemData) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.updateOne(
        { code: trayItemData.trayId },
        {
          $push: {
            actual_items: trayItemData.item,
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
              issued_user_name: null,
              actual_items: [],
            },
          }
        );
        if (data) {
          for (let x of data.items) {
            let deliveryUpdate = await delivery.updateOne(
              {
                tracking_id: x.tracking_id,
              },
              {
                $set: {
                  tray_status: "Closed By Warehouse",
                  tray_location: "Warehouse",
                  bqc_done_close: Date.now(),
                },
              }
            );
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
              issued_user_name: null,
              actual_items: [],
            },
          }
        );
        if (data) {
          for (let x of data.items) {
            let deliveryUpdate = await delivery.updateOne(
              {
                tracking_id: x.tracking_id,
              },
              {
                $set: {
                  tray_status: "Closed By Warehouse",
                  tray_location: "Warehouse",
                  charging_done_close: Date.now(),
                },
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
  bqcDoneRecieved: (trayData) => {
    return new Promise(async (resolve, reject) => {
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
          let deliveryTrack = await delivery.updateMany(
            { tracking_id: data.actual_items[i].tracking_id },
            {
              $set: {
                tray_status: "Received From BQC",
                tray_location: "Warehouse",
                bqc_done_received: Date.now(),
              },
            }
          );
        }
        resolve(data);
      } else {
        resolve(data);
      }
    });
  },
  sortingDoneRecieved: (trayData) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.findOneAndUpdate(
        { code: trayData.trayId },
        {
          $set: {
            sort_id: "Received From Sorting",
          },
        }
      );
      if (data) {
        resolve(data);
      }
    });
  },
  getBotAndWhtSortingRequestTray: (botTrayId) => {
    return new Promise(async (resolve, reject) => {
      let data = [];
      let botTray = await masters.findOne({ code: botTrayId });
      data.push(botTray);
      console.log(botTray);
      for (let x of botTray.wht_tray) {
        let tray = await masters.findOne({ code: x });
        data.push(tray);
      }
      if (data) {
        resolve(data);
      }
    });
  },
  getTrayForSortingExVsAt: (trayId) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.findOne({ code: trayId });
      if (data) {
        resolve(data);
      }
    });
  },
  assignToSortingConfirm: (trayId, type) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.findOneAndUpdate(
        { code: trayId },
        {
          $set: {
            sort_id: type,
          },
        }
      );
      for (let x of data.wht_tray) {
        let updateWhtTray = await masters.updateOne(
          { code: x },
          {
            $set: {
              sort_id: type,
              issued_user_name: data.issued_user_name,
            },
          }
        );
      }
      if (data) {
        resolve(data);
      } else {
        resolve();
      }
    });
  },
  whtTrayCloseAfterSorting: (trayData) => {
    return new Promise(async (resolve, reject) => {
      let data;
      if (trayData.items.length == trayData.limit) {
        data = await masters.updateOne(
          { code: trayData.code },
          {
            $set: {
              sort_id: "Closed",
              actual_items: [],
            },
          }
        );
        if (data.modifiedCount !== 0) {
          resolve({ status: 1 });
        }
      } else {
        data = await masters.updateOne(
          { code: trayData.code },
          {
            $set: {
              sort_id: "Inuse",
              actual_items: [],
            },
          }
        );
        if (data.modifiedCount !== 0) {
          resolve({ status: 2 });
        }
      }
    });
  },
};
