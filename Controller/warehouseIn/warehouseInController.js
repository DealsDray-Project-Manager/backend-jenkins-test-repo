const { orders } = require("../../Model/ordersModel/ordersModel");
const { masters } = require("../../Model/mastersModel");
const { delivery } = require("../../Model/deliveryModel/delivery");
const { user } = require("../../Model/userModel");
var mongoose = require("mongoose");
const { pickList } = require("../../Model/picklist_model/model");
const { products } = require("../../Model/productModel/product");
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
  checkBagId: (bagId) => {
    return new Promise(async (resolve, reject) => {
      let bagExist = await masters.findOne({
        prefix: "bag-master",
        code: bagId,
      });
      if (bagExist == null) {
        resolve({ status: 1 });
      } else {
        let emptyBag = await masters.findOne({ code: bagId });
        if (
          emptyBag.sort_id != "No Status" &&
          emptyBag.sort_id != "Inprogress"
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
          { $and: [{ code: bagId }, { sort_id: "Inprogress" }] },
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
        console.log(data);
        resolve(data);
      } else {
        resolve(data);
      }
    });
  },
  checkAwbin: (awbn, bagId) => {
    return new Promise(async (resolve, reject) => {
      let data = await delivery.findOne({
        tracking_id: { $regex: ".*" + awbn + ".*", $options: "i" },
      });
      if (data == null) {
        resolve({ status: 1, data: data });
      } else {
        let deliveredOrNot = await orders.findOne({
          order_id: data.order_id,
          delivery_status: "Delivered",
        });
        if (deliveredOrNot) {
          console.log(deliveredOrNot.order_date);
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
              "items.awbn_number": {
                $regex: ".*" + awbn + ".*",
                $options: "i",
              },
              code: { $ne: bagId },
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
    console.log(data);
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
            sort_id: "Inprogress",
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
      console.log(res);
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
      console.log(bgData);
      if (data.modifiedCount != 0 && bgData.state !== "Duplicate") {
        let updateDelivery = await delivery.updateOne(
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
      console.log(data);
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
  getRequests: () => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({ sort_id: "Requested to Warehouse" });
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
  checkMmtTray: (trayId) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.findOne({ prefix: "tray-master", code: trayId });
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
  checkPmtTray: (trayId) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.findOne({ prefix: "tray-master", code: trayId });
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
  checkBotTray: (trayId) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.findOne({ prefix: "tray-master", code: trayId });
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
  trayCloseRequest: () => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        $or: [
          {
            prefix: "tray-master",
            sort_id: "Closed By Bot",
            type_taxanomy: { $ne: "BOT" },
          },
          {
            prefix: "tray-master",
            sort_id: "Received",
            type_taxanomy: { $ne: "BOT" },
          },
        ],
      });
      if (data) {
        resolve(data);
      }
    });
  },
  closeBotTrayGet: () => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        $or: [
          {
            prefix: "tray-master",
            sort_id: "Closed By Bot",
            type_taxanomy: "BOT",
          },
          {
            prefix: "tray-master",
            sort_id: "Received",
            type_taxanomy: "BOT",
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
      let data = await masters.updateOne(
        { code: trayData.trayId },
        {
          $set: {
            sort_id: "Received",
          },
        }
      );
      if (data.modifiedCount != 0) {
        let deliveryTrack = await delivery.updateMany(
          { tray_id: trayData.trayId },
          {
            $set: {
              tray_status: "Received",
              tray_location: "Warehouse",
            },
          }
        );
        resolve(data);
      } else {
        resolve(data);
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
      console.log(data);
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
      console.log(data);
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
              },
            }
          );
          let obj = {
            tracking_id: x.awbn_number,
            bot_agent: data.issued_user_name,
            tray_id: data.code,
            uic: getItemId.uic_code.code,
            imei: x.imei,
            closed_time: new Date(new Date().toISOString().split("T")[0]),
            wht_tray: null,
            status: x.status,
          };
          let putToModel = await products.updateOne(
            { vendor_sku_id: getItemId.item_id },
            {
              $push: {
                item: obj,
              },
            }
          );
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
  getBotWarehouseClosed: () => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        type_taxanomy: "BOT",
        prefix: "tray-master",
        sort_id: "Closed By Warehouse",
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
            localField: "code",
            foreignField: "bag_id",
            as: "delivery",
          },
        },
      ]);
      if (data) {
        let i = 0;
        for (let x of data[0]?.delivery) {
          let status = await masters.findOne({ code: x.tray_id });
          data[0].delivery[i].tray_status = status.sort_id;
          data[0].delivery[i].tray_type = status.type_taxanomy;
          i++;
        }
        console.log(data);
        resolve(data);
      }
    });
  },
  picklistRequest: (date) => {
    console.log(date);
    return new Promise(async (resolve, reject) => {
      let data = await products.find({
        item: { $exists: true, $ne: [] },
        "item.closed_time": new Date(date.toISOString().split("T")[0]),
      });

      resolve(data);
    });
  },
  viewModelClubItem: (skuId) => {
    return new Promise(async (resolve, reject) => {
      let data = await products.find({ vendor_sku_id: skuId });
      console.log(data[0].item);
      resolve(data);
    });
  },
  getWhtTray: (trayType, skuId, brand, model) => {
    return new Promise(async (resolve, reject) => {
      let data;
      if (trayType == "use_new_tray") {
        data = await masters.find({
          prefix: "tray-master",
          type_taxanomy: "WHT",
          brand: brand,
          model: model,
          items: { $exists: true, $eq: [] },
        });
      } else {
        data = await masters.find({
          prefix: "tray-master",
          type_taxanomy: "WHT",
          brand: brand,
          model: model,
          "items.vendor_sku_id": skuId,
          $expr: {
            $and: [
              { $lt: [{ $size: "$items" }, "$limit"] },
              { $gte: [{ $size: "$items" }, 1] },
            ],
          },
        });
      }
      console.log(data);
      resolve(data);
    });
  },
  assignToWht: (dataOfItem) => {
    console.log(dataOfItem);
    return new Promise(async (resolve, reject) => {
      let updateProduct = await products.updateOne(
        { vendor_sku_id: dataOfItem.sku },
        {
          $push: {
            wht_tray: dataOfItem.wht_tray,
          },
          $set: {
            count_assigned_tray: dataOfItem.count,
          },
        }
      );
      let data;
      for (let x of dataOfItem.item) {
        let updateProductWhtTray = await products.updateOne(
          { item: { $elemMatch: { tracking_id: x.tracking_id } } },
          {
            $set: {
              "item.$.wht_tray": dataOfItem.wht_tray,
            },
          }
        );
        x.wht_tray = dataOfItem.wht_tray;
        x.vendor_sku_id = dataOfItem.sku;
        data = await masters.updateOne(
          { code: dataOfItem.wht_tray },
          {
            $push: {
              items: x,
            },
            $set: {
              sort_id: "Inprogress",
            },
          }
        );
      }
      if (data.modifiedCount !== 0) {
        resolve(data);
      }
    });
  },
  getAssignedTray: (skuId) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        "items.vendor_sku_id": skuId,
        sort_id: "Inprogress",
      });
      if (data) {
        resolve(data);
      }
    });
  },
  removeWhtTrayItem: (whtTrayDetails) => {
    return new Promise(async (resolve, reject) => {
      let allItem = await masters.findOne({ code: whtTrayDetails.code });
      let data = await masters.findOneAndUpdate(
        { code: whtTrayDetails.code },
        {
          $pull: {
            items: {
              vendor_sku_id: whtTrayDetails.vendor_sku_id,
            },
          },
        },
        { new: true }
      );
      if (data?.items?.length == 0) {
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
        let updateProductWhtTray = await products.findOneAndUpdate(
          { vendor_sku_id: whtTrayDetails.vendor_sku_id },
          {
            $pull: {
              wht_tray: whtTrayDetails.code,
            },
          }
        );
        for (let x of allItem.items) {
          let pullItemTray = await products.updateOne(
            { item: { $elemMatch: { tracking_id: x.tracking_id } } },
            {
              $set: {
                "item.$.wht_tray": null,
              },
            }
          );
        }

        resolve(data);
      }
    });
  },
  createPickList: (pickListData) => {
    return new Promise(async (resolve, reject) => {
      let piclListCount = await pickList.count({});
      let whtTray = await masters.find({
        "items.vendor_sku_id": pickListData.skuId,
        sort_id: "Inprogress",
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
      let data = await products.updateOne(
        { vendor_sku_id: pickListData.skuId },
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
  getWhtTrayWareHouse: () => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        prefix: "tray-master",
        type_taxanomy: "WHT",
      });
      resolve(data);
    });
  },
  getInUseWhtTray: (status) => {
    return new Promise(async (resolve, reject) => {
      let data;
      if (status == "Inuse") {
        data = await masters.find({
          prefix: "tray-master",
          type_taxanomy: "WHT",
          sort_id: status,
        });
      } else {
        data = await masters.find({
          $or: [
            { prefix: "tray-master", type_taxanomy: "WHT", sort_id: "Issued" },
            {
              prefix: "tray-master",
              type_taxanomy: "WHT",
              sort_id: "Charging Station IN",
            },
          ],
        });
      }
      resolve(data);
    });
  },
  sortPicklist: (date) => {
    return new Promise(async (resolve, reject) => {
      let data = await products.find({ "item.closed_time": new Date(date) });
      resolve(data);
    });
  },
  getWhtTrayitem: (trayId) => {
    console.log(trayId);
    return new Promise(async (resolve, reject) => {
      let data = await masters.findOne({ code: trayId });
      resolve(data);
    });
  },
  getPickList: (pick_list_id) => {
    console.log(pick_list_id);
    return new Promise(async (resolve, reject) => {
      let data = await pickList.findOne({ pick_list_id: pick_list_id });
      console.log(data);
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
    console.log(itemDetails);
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
      console.log(data);
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
                sort_id: "Inuse",
              },
            }
          );
          removeItem = await products.findOneAndUpdate(
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
        let changeAll = await products.updateOne(
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
      let data = await pickList.find({});
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
  getChargingRequest: () => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        prefix: "tray-master",
        type_taxanomy: "WHT",
        sort_id: "Send for charging",
      });
      if (data) {
        resolve(data);
      }
    });
  },
  checkUicCode: (uic, trayId) => {
    console.log(uic);
    return new Promise(async (resolve, reject) => {
      let data = await delivery.findOne({ "uic_code.code": uic });
      console.log(data);
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
    console.log(trayItemData);
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
      let data = await masters.updateOne(
        { code: trayData.trayId },
        {
          $set: {
            actual_items: [],
            description: trayData.description,
            sort_id: "Issued",
            assigned_date: Date.now(),
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
  returnFromChargingWht: () => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        prefix: "tray-master",
        type_taxanomy: "WHT",
        sort_id: "Charge Done",
      });
      if (data) {
        resolve(data);
      }
    });
  },
};
