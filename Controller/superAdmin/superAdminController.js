/************************************************************************************************** */
const { user } = require("../../Model/userModel");
const { infra } = require("../../Model/infraModel");
const { masters } = require("../../Model/mastersModel");
const { orders } = require("../../Model/ordersModel/ordersModel");
const { brands } = require("../../Model/brandModel/brand");
const { products } = require("../../Model/productModel/product");
const { admin } = require("../../Model/adminModel/admins");
const { usersHistory } = require("../../Model/users-history-model/model");
const { delivery } = require("../../Model/deliveryModel/delivery");
const { trayCategory } = require("../../Model/tray-category/tray-category");
const {
  spareCategories,
} = require("../../Model/spareCategories/spareCategories");
var mongoose = require("mongoose");
const { trayRack } = require("../../Model/tray-rack/tray-rack");
const { box } = require("../../Model/boxModel/box");
const { payment } = require("../../Model/paymentModel/payment");
const { warranty } = require("../../Model/warrantyModel/warranty");
const { audtiorFeedback } = require("../../Model/temp/auditor-feedback");
const { vendorMaster } = require("../../Model/vendorModel/vendorModel");
const { storagemodel } = require("../../Model/storageModel/storage");
const { rammodel } = require("../../Model/ramModel/ram");
const {
  partAndColor,
} = require("../../Model/Part-list-and-color/part-list-and-color");
const {
  mastersEditHistory,
} = require("../../Model/masterHistoryModel/mastersHistory");
const moment = require("moment");
const elasticsearch = require("../../Elastic-search/elastic");
const { purchaseOrder } = require("../../Model/Purchase-order/purchase-order");
const { tempOrdersReq } = require("../../Model/temp-req/temp-req");
const { subMuic } = require("../../Model/sub-muic/sub-muic");
const { unitsActionLog } = require("../../Model/units-log/units-action-log");
const {
  deletedMaster,
} = require("../../Model/Deleted-masters/deleted-trays-bag");
const {
  partInventoryLedger,
} = require("../../Model/part-inventory-ledger/part-inventory-ledger");
const {
  blancoReportLog,
} = require("../../Model/blanco-updation-log/blanco-updation-log");

const IISDOMAIN = "https://prexo-v9-2-dev-api.dealsdray.com/user/profile/";
const IISDOMAINBUYERDOC =
  "https://prexo-v9-2-dev-api.dealsdray.com/user/document/";
const IISDOMAINPRDT = "https://prexo-v9-2-dev-api.dealsdray.com/product/image/";

/************************************************************************************************** */

/* 

@ SUPER ADMIN CONTROLLER FETCH DATA FROM MONGODB DATA BASE PREXO AND MAKE CHANGES ON DB 


*/

module.exports = {
  /*--------------------------------LOGIN-----------------------------------*/
  doLogin: (loginData) => {
    return new Promise(async (resolve, reject) => {
      let data = await admin.findOne({
        user_name: loginData.user_name,
      });
      if (data) {
        if (data.password == loginData.password) {
          resolve({ status: 1, data: data });
        } else {
          resolve({ status: 4 });
        }
      } else {
        let userGet = await user.findOne({
          user_name: loginData.user_name,
        });

        if (userGet) {
          if (userGet.password == loginData.password) {
            let activeOrNotActive = await user.findOne({
              user_name: loginData.user_name,
              password: loginData.password,
              status: "Active",
            });
            if (activeOrNotActive) {
              resolve({ status: 1, data: userGet });
            } else {
              resolve({ status: 3 });
            }
          } else {
            resolve({ status: 4 });
          }
        } else {
          resolve({ status: 2 });
        }
      }
    });
  },
  updateJwtTokeInDb: (id, jwtToken, userType) => {
    return new Promise(async (resolve, reject) => {
      let updateTheData;
      if (userType == "super-admin") {
        updateTheData = await admin
          .findOneAndUpdate(
            { _id: id },
            {
              $set: {
                jwt_token: jwtToken,
              },
            }
          )
          .catch((err) => reject(err));
      } else {
        updateTheData = await user
          .findOneAndUpdate(
            { _id: id },
            {
              $set: {
                jwt_token: jwtToken,
              },
            }
          )
          .catch((err) => reject(err));
      }
      if (updateTheData) {
        resolve({ status: 1 });
      } else {
        resolve({ status: 0 });
      }
    });
  },
  /*--------------------------------DASHBOARD-----------------------------------*/
  getBlancoStatus: async () => {
    try {
      let count = {
        blancoUpdationLatest: null,
        blancoUpdatelast: null,
      };
      const twelveHoursAgo = new Date();
      twelveHoursAgo.setHours(twelveHoursAgo.getHours() - 12);
      count.blancoUpdationLatest = await blancoReportLog.findOne(
        {
          createdAt: { $gte: twelveHoursAgo },
        },
        { createdAt: 1 },
        { sort: { createdAt: -1 } }
      );
      count.blancoUpdatelast = await blancoReportLog.findOne(
        {},
        { createdAt: 1 },
        { sort: { _id: -1 } }
      );
      return count;
    } catch (error) {
      return error;
    }
  },
  getDashboardData: () => {
    return new Promise(async (resolve, reject) => {
      let count = {};

      count.usersCount = await user.count({ user_type: { $ne: "Buyer" } });
      count.buyerCount = await user.count({ user_type: "Buyer" });
      count.location = await infra.count({ type_taxanomy: "CPC" });
      count.warehouse = await infra.count({ type_taxanomy: "Warehouse" });
      count.brand = await brands.count({});
      count.products = await products.count({});
      count.vendor = await vendorMaster.count({});
      count.ctxCategory = await trayCategory.count({});
      count.spcategories = await spareCategories.count({});
      count.tray = await masters.count({ prefix: "tray-master" });
      count.bag = await masters.count({ prefix: "bag-master" });
      count.partList = await partAndColor.count({ type: "part-list" });
      count.colorList = await partAndColor.count({ type: "color-list" });
      count.storageList = await storagemodel.count({});
      count.warrantyList = await warranty.count({});
      count.paymentList = await payment.count({});
      count.ramList = await rammodel.count({});
      count.boxList = await box.count({});
      count.trayRacks = await trayRack.count({});
      count.subMuic = await subMuic.count({});
      count.readyForTransferSales = await masters.count({
        prefix: "tray-master",
        sort_id: "Audit Done Closed By Warehouse",
        type_taxanomy: {
          $in: ["CT"],
        },
      });
      count.readyForRdl = await masters.count({
        sort_id: "Audit Done Closed By Warehouse",
        type_taxanomy: "WHT",
        prefix: "tray-master",
      });
      count.readyForChargingInuse = await masters.count({
        type_taxanomy: "WHT",
        prefix: "tray-master",
        sort_id: "Inuse",
        items: {
          $ne: [],
          $exists: true,
        },
      });
      let readyForBqcTray = await masters.find({
        prefix: "tray-master",
        sort_id: "Ready to BQC",
      });
      let countBqc = 0;
      if (readyForBqcTray.length == 0) {
        count.readyForChargingBqc = countBqc;
      } else {
        for (let x of readyForBqcTray) {
          let today = new Date(Date.now());

          if (
            new Date(x.closed_time_bot) <=
            new Date(today.setDate(today.getDate() - 4))
          ) {
            countBqc++;
          }
          count.readyForChargingBqc = countBqc;
        }
      }

      count.removeInvalidItem = await masters.count({
        prefix: "bag-master",
        sort_id: "In Progress",
        "items.status": "Invalid",
      });
      count.trackItem = await orders.count({ delivery_status: "Delivered" });

      if (count) {
        resolve(count);
      }
    });
  },

  /*--------------------------------CHECK USER ACTIVE OR NOT-----------------------------------*/
  checkUserStatus: (userName, jwt, userType) => {
    return new Promise(async (resolve, reject) => {
      if (userType == "super-admin") {
        let data = await admin.findOne({ user_name: userName });
        if (data) {
          if (data.jwt_token == jwt) {
            // Assuming checkUser.last_password_changed is a Date object
            const lastPasswordChangedDate = new Date(
              data.last_password_changed
            );
            // Set the time component to midnight (00:00:00)
            lastPasswordChangedDate.setHours(0, 0, 0, 0);

            // Calculate the current date
            const currentDate = new Date();
            // Set the time component to midnight (00:00:00)
            currentDate.setHours(0, 0, 0, 0);

            // Calculate the time difference in milliseconds
            const timeDifference = currentDate - lastPasswordChangedDate;

            // Define the duration for one week in milliseconds
            const oneWeekInMilliseconds = 7 * 24 * 60 * 60 * 1000;

            // Check if the time difference is greater than or equal to one week
            if (
              data.last_password_changed == undefined ||
              timeDifference >= oneWeekInMilliseconds
            ) {
              resolve({ status: 4 });
            } else {
              resolve({ data: data, status: 1 });
            }
          } else {
            resolve({ status: 2 });
          }
        } else {
          resolve({ status: 3 });
        }
      } else {
        let data = await user.findOne({
          user_name: userName,
          status: "Active",
        });
        if (data) {
          if (data.jwt_token == jwt) {
            // Assuming checkUser.last_password_changed is a Date object
            const lastPasswordChangedDate = new Date(
              data.last_password_changed
            );
            // Set the time component to midnight (00:00:00)
            lastPasswordChangedDate.setHours(0, 0, 0, 0);

            // Calculate the current date
            const currentDate = new Date();
            // Set the time component to midnight (00:00:00)
            currentDate.setHours(0, 0, 0, 0);

            // Calculate the time difference in milliseconds
            const timeDifference = currentDate - lastPasswordChangedDate;

            // Define the duration for one week in milliseconds
            const oneWeekInMilliseconds = 7 * 24 * 60 * 60 * 1000;

            // Check if the time difference is greater than or equal to one week
            if (
              data.last_password_changed == undefined ||
              timeDifference >= oneWeekInMilliseconds
            ) {
              resolve({ status: 4 });
            } else {
              resolve({ data: data, status: 1 });
            }
          } else {
            resolve({ status: 2 });
          }
        } else {
          resolve({ status: 3 });
        }
      }
    });
  },

  /*--------------------------------CHANGE PASSWORD-----------------------------------*/

  changePassword: (userData) => {
    return new Promise(async (resolve, reject) => {
      if (userData.user_type == "super-admin") {
        let findData = await admin.findOne({ _id: userData._id });
        if (findData.password == userData.new_password) {
          resolve({ status: 2 });
        } else {
          let data = await admin.updateOne(
            { _id: userData._id, password: userData.old_password },
            {
              $set: {
                password: userData.new_password,
                last_password_changed: Date.now(),
              },
            }
          );
          if (data.matchedCount != 0) {
            let createLog = await usersHistory.create({
              user_name: findData.user_name,
              password: userData.new_password,
              last_update_date: Date.now(),
              type: "Password Change",
            });
            resolve({ status: 1 });
          } else {
            resolve({ status: 0 });
          }
        }
      } else {
        let findData = await user.findOne({ _id: userData._id });
        if (findData.password == userData.new_password) {
          resolve({ status: 2 });
        } else {
          let data = await user.updateOne(
            { _id: userData._id, password: userData.old_password },
            {
              $set: {
                password: userData.new_password,
                last_password_changed: Date.now(),
              },
            }
          );
          if (data.matchedCount != 0) {
            resolve({ status: 1 });
          } else {
            resolve({ status: 0 });
          }
        }
      }
    });
  },

  /*--------------------------------CREATE USER-----------------------------------*/

  createUser: (userData, profile) => {
    if (profile != undefined) {
      userData.profile = IISDOMAIN + profile;
    }
    userData.creation_date = Date.now();
    userData.last_password_changed = Date.now();
    return new Promise(async (resolve, rejects) => {
      let userExist = await user.findOne({ user_name: userData.user_name });
      if (userExist) {
        resolve({ status: true, user: userExist });
      } else {
        let data = await user.create(userData);
        if (data) {
          let history = await usersHistory.create(userData);
          resolve({ status: false, user: data });
        } else {
          resolve();
        }
      }
    });
  },

  /*--------------------------------CREATE BUYERS-----------------------------------*/

  createBuyer: (buyerData, docuemnts) => {
    if (docuemnts.profile && docuemnts?.profile[0]) {
      buyerData.profile = IISDOMAINBUYERDOC + docuemnts.profile[0].filename;
    } else {
      buyerData.profile = "";
    }
    if (docuemnts.aadhar_proof && docuemnts?.aadhar_proof[0]) {
      buyerData.aadhar_proof =
        IISDOMAINBUYERDOC + docuemnts.aadhar_proof[0].filename;
    } else {
      buyerData.aadhar_proof = "";
    }
    if (docuemnts.pan_card_proof && docuemnts?.pan_card_proof[0]) {
      buyerData.pan_card_proof =
        IISDOMAINBUYERDOC + docuemnts.pan_card_proof[0].filename;
    } else {
      buyerData.pan_card_proof = "";
    }
    if (
      docuemnts.business_address_proof &&
      docuemnts?.business_address_proof[0]
    ) {
      buyerData.business_address_proof =
        IISDOMAINBUYERDOC + docuemnts.business_address_proof[0].filename;
    } else {
      buyerData.business_address_proof = "";
    }

    buyerData.creation_date = Date.now();
    return new Promise(async (resolve, rejects) => {
      let buyerExist = await user.findOne({
        $or: [
          { user_name: buyerData.user_name },
          { email: buyerData.email },
          { contact: buyerData.contact },
        ],
      });
      if (buyerExist) {
        resolve({ status: true, buyer: buyerExist });
      } else {
        let data = await user.create(buyerData);
        if (data) {
          let history = await usersHistory.create(buyerData);
          resolve({ status: false, user: data });
        } else {
          resolve();
        }
      }
    });
  },

  /*-------------------------------LOCATION TYPE -------------------------------*/
  getLocationType: (code) => {
    return new Promise(async (resolve, reject) => {
      let data = await infra.find({ code: code });
      if (data) {
        resolve(data);
      }
    });
  },
  /*--------------------------------USERS HISTORY--------------------------------*/

  getUsersHistory: (username) => {
    return new Promise(async (resolve, reject) => {
      let data = await usersHistory.find({
        user_name: username,
        type: { $ne: "Password Change" },
      });
      if (data) {
        resolve(data);
      }
    });
  },
  /*--------------------------------FIND CPC-----------------------------------*/

  getCpc: () => {
    return new Promise(async (resolve, rejects) => {
      let cpc = await infra.find({ type_taxanomy: "CPC" });
      resolve(cpc);
    });
  },
  getCpcBagTransfer: (type) => {
    return new Promise(async (resolve, rejects) => {
      let cpc = await infra.find({
        type_taxanomy: "CPC",
        location_type: { $nin: [type, "Sales"] },
      });
      resolve(cpc);
    });
  },

  /*--------------------------------Find Sales Location-----------------------------------*/

  getCpcSalesLocation: () => {
    return new Promise(async (resolve, rejects) => {
      let data = await infra.find({ location_type: "Sales" });
      resolve(data);
    });
  },
  /*--------------------------------Find Sales Users-----------------------------------*/

  getsalesUsers: (warehouse, cpc) => {
    return new Promise(async (resolve, reject) => {
      let data = await user.find({
        user_type: "Sales Agent",
        warehouse: warehouse,
        cpc: cpc,
        status: { $ne: "Deactivated" },
      });
      if (data) {
        resolve(data);
      } else {
        resolve();
      }
    });
  },
  /*--------------------------------FIND WAREHOUSE-----------------------------------*/

  getWarehouse: (code, type) => {
    return new Promise(async (resolve, reject) => {
      if (type !== undefined) {
        let warehouse;
        if (type == "Processing") {
          warehouse = await infra.find({
            $or: [
              {
                parent_id: code,
                warehouse_type: type,
                type_taxanomy: "Warehouse",
              },
              {
                parent_id: code,
                warehouse_type: "Spare Part Warehouse",
                type_taxanomy: "Warehouse",
              },
            ],
          });
        } else {
          warehouse = await infra.find({
            parent_id: code,
            warehouse_type: type,
            type_taxanomy: "Warehouse",
          });
        }
        resolve(warehouse);
      } else {
        let warehouse = await infra.find({
          parent_id: code,
          type_taxanomy: "Warehouse",
        });
        resolve(warehouse);
      }
    });
  },
  /*--------------------------------FIND USERS-----------------------------------*/

  getUsers: () => {
    return new Promise(async (resolve, reject) => {
      let usersData = await user.find({ user_type: { $ne: "Buyer" } });
      resolve(usersData);
    });
  },

  getBuyers: () => {
    return new Promise(async (resolve, reject) => {
      let BuyerData = await user.find({ user_type: "Buyer" });
      resolve(BuyerData);
    });
  },
  /*--------------------------------FIND BUYER CONNECTED TO SALES AGENT-----------------------------------*/

  buyerConSalesAgent: (username) => {
    return new Promise(async (resolve, reject) => {
      let BuyerData = await user.find({
        user_type: "Buyer",
        sales_users: username,
      });
      resolve(BuyerData);
    });
  },

  /*--------------------------------DEACTIVATE USER-----------------------------------*/

  userDeactivate: (username) => {
    return new Promise(async (resolve, reject) => {
      let res = await user.findOneAndUpdate(
        { user_name: username },
        {
          $set: {
            status: "Deactivated",
          },
        }
      );
      resolve(res);
    });
  },

  /*--------------------------------ACTIVATE USER-----------------------------------*/

  userActivate: (username) => {
    return new Promise(async (resolve, reject) => {
      let res = await user.findOneAndUpdate(
        { user_name: username },
        {
          $set: {
            status: "Active",
          },
        }
      );
      resolve(res);
    });
  },
  /*--------------------------------DATA FETCH FOR EDIT USER-----------------------------------*/

  getEditData: (username) => {
    return new Promise(async (resolve, reject) => {
      let userData = await user.findOne({ user_name: username });
      resolve(userData);
    });
  },

  /*--------------------------------DATA FETCH FOR EDIT Buyer-----------------------------------*/

  getEditBuyerData: (buyername) => {
    return new Promise(async (resolve, reject) => {
      let buyerData = await user.findOne({ user_name: buyername });
      resolve(buyerData);
    });
  },
  /*--------------------------------EDIT BUYER DATA-----------------------------------*/

  editBuyerDetails: (buyerData, docuemnts) => {
    if (Object.keys(docuemnts).length !== 0) {
      if (docuemnts.profile_file) {
        buyerData.profile =
          IISDOMAINBUYERDOC + docuemnts.profile_file[0].filename;
      }
      if (docuemnts.aadhar_proof_file) {
        buyerData.aadhar_proof =
          IISDOMAINBUYERDOC + docuemnts.aadhar_proof_file[0].filename;
      }
      if (docuemnts.pan_card_proof_file) {
        buyerData.pan_card_proof =
          IISDOMAINBUYERDOC + docuemnts.pan_card_proof_file[0].filename;
      }
      if (docuemnts.business_address_proof_file) {
        buyerData.business_address_proof =
          IISDOMAINBUYERDOC + docuemnts.business_address_proof_file[0].filename;
      }
    }

    return new Promise(async (resolve, reject) => {
      let checkBuyerExists = await user.findOne({
        $or: [
          {
            contact: buyerData.contact,
            user_name: { $ne: buyerData.user_name },
          },
          { email: buyerData.email, user_name: { $ne: buyerData.user_name } },
        ],
      });
      if (checkBuyerExists) {
        resolve({ status: 1 });
      }
      let userDetails = await user.findOneAndUpdate(
        { user_name: buyerData.user_name },
        {
          $set: {
            contact: buyerData.contact,
            email: buyerData.email,
            name: buyerData.name,
            business_address_proof: buyerData.business_address_proof,
            aadhar_proof: buyerData.aadhar_proof,
            pan_card_proof: buyerData.pan_card_proof,
            profile: buyerData.profile,
            mobile_verification_status: buyerData.mobile_verification_status,
            email_verification_status: buyerData.email_verification_status,
            contact_person_name: buyerData.contact_person_name,
            last_update_date: Date.now(),
          },
        },
        { returnOriginal: false }
      );

      if (userDetails) {
        let obj = {
          contact: userDetails.contact,
          email: userDetails.email,
          name: buyerData.name,
          profile: userDetails.profile,
          user_name: userDetails.user_name,
          business_address_proof: userDetails.business_address_proof,
          aadhar_proof: userDetails.aadhar_proof,
          pan_card_proof: userDetails.pan_card_proof,
          creation_date: userDetails.creation_date,
          last_update_date: userDetails.last_update_date,
          email_verification_status: userDetails.email_verification_status,
          mobile_verification_status: userDetails.mobile_verification_status,
          contact_person_name: userDetails.contact_person_name,
        };
        let historyTab = await usersHistory.create(obj);
        resolve({ status: 1 });
      } else {
        resolve({ status: 0 });
      }
    });
  },
  /*--------------------------------EDIT USER DATA-----------------------------------*/

  editUserdata: (userData, profile) => {
    if (profile != undefined) {
      profile = IISDOMAIN + profile;
    }
    return new Promise(async (resolve, reject) => {
      let userDetails = await user.findOneAndUpdate(
        { user_name: userData.user_name },
        {
          $set: {
            name: userData.name,
            contact: userData.contact,
            email: userData.email,
            last_update_date: Date.now(),
            profile: profile,
          },
        },
        { returnOriginal: false }
      );

      if (userDetails) {
        let obj = {
          last_update_date: Date.now(),
          name: userDetails.name,
          email: userDetails.email,
          contact: userDetails.contact,
          user_name: userDetails.user_name,
          password: userDetails.password,
          cpc: userDetails.cpc,
          device_id: userDetails.device_id,
          device_name: userDetails.device_name,
          profile: userDetails.profile,
          user_type: userDetails.user_type,
          status: userDetails.status,
          creation_date: userDetails.creation_date,

          profile: userDetails.profile,
        };
        let historyTab = await usersHistory.create(obj);
        resolve(userDetails);
      } else {
        resolve();
      }
    });
  },

  /*--------------------------------FIND MASTERS-----------------------------------*/

  getMasters: () => {
    return new Promise(async (resolve, reject) => {
      let mastersData = await masters.find({});
      resolve(mastersData);
    });
  },

  /*--------------------------------FIND INFRA-----------------------------------*/

  getInfra: () => {
    return new Promise(async (resolve, reject) => {
      let infraData = await infra.find({});
      resolve(infraData);
    });
  },

  /*--------------------------------BULK VALIDATION FOR BRANDS-----------------------------------*/

  bulkValidationBrands: (bandData) => {
    return new Promise(async (resolve, reject) => {
      let err = {};
      let brand_id = [];
      let brand_name = [];
      for (let i = 0; i < bandData.length; i++) {
        let barndName = await brands.findOne({
          brand_name: bandData[i].brand_name,
        });
        if (barndName) {
          brand_name.push(barndName.brand_name);
          err["duplicate_brand_name"] = brand_name;
        } else {
          if (
            bandData.some(
              (data, index) =>
                data.brand_name == bandData[i].brand_name && index != i
            )
          ) {
            brand_name.push(bandData[i].brand_name);
            err["duplicate_brand_name"] = brand_name;
          }
        }
      }
      if (Object.keys(err).length === 0) {
        resolve({ status: true });
      } else {
        resolve({ status: false, err: err });
      }
    });
  },

  /*--------------------------------CREATE BRANDS-----------------------------------*/

  createBrands: (brandsData) => {
    return new Promise(async (resolve, reject) => {
      let brandExists = await brands
        .findOne({ brand_name: brandsData.brand_name })
        .catch((err) => reject(err));
      if (brandExists) {
        resolve({ status: false });
      } else {
        let data = await brands.create(brandsData).catch((err) => reject(err));
        if (data) {
          resolve({ status: true });
        }
      }
    });
  },
  /*--------------------------------MASTER HIGHTST ID FETCH-----------------------------------*/

  getHighestId: (prefix) => {
    return new Promise(async (resolve, reject) => {
      let id = await masters
        .find({ prefix: prefix })
        .sort({ code: -1 })
        .collation({ locale: "en_US", numericOrdering: true })
        .limit(1);
      if (id.length != 0) {
        if (prefix == "bag-master") {
          let count = id[0].code.split("B")[1];
          let nextID = Number(count) + 1;
          resolve(nextID);
        } else if (prefix == "tray-master") {
          if (prefix == "tray-master") {
            let count = id[0].code.split("T")[1];
            let nextID = Number(count) + 1;
            resolve(nextID);
          } else {
            resolve(1);
          }
        }
      } else {
        resolve(1);
      }
    });
  },

  /*--------------------------------FIND BRANDS-----------------------------------*/

  getBrands: () => {
    return new Promise(async (resolve, reject) => {
      let allBrands = await brands
        .find({})
        .sort({ brand_id: 1 })
        .collation({ locale: "en_US", numericOrdering: true })
        .catch((err) => reject(err));

      if (allBrands) {
        resolve(allBrands);
      }
    });
  },

  /*--------------------------------CREATE USER-----------------------------------*/

  getBrandsAlpha: () => {
    return new Promise(async (resolve, reject) => {
      let allBrands = await brands
        .find({})
        .sort({ brand_name: 1 })
        .collation({ locale: "en_US", numericOrdering: true })
        .catch((err) => reject(err));
      if (allBrands) {
        resolve(allBrands);
      }
    });
  },

  /*--------------------------------FIND BRAND-----------------------------------*/

  getOneBrand: (brandId) => {
    return new Promise(async (resolve, reject) => {
      let data = await brands
        .findOne({ brand_id: brandId })
        .catch((err) => reject(err));
      if (data) {
        let checkBrand = await products.findOne({
          brand_name: data.brand_name,
        });
        if (checkBrand) {
          resolve({ status: 0 });
        } else {
          resolve({ status: 1, data: data });
        }
      } else {
        resolve({ status: 2 });
      }
    });
  },

  /*--------------------------------EDIT BRANDS-----------------------------------*/

  editBrands: (editData) => {
    return new Promise(async (resolve, reject) => {
      let data = await brands
        .updateOne(
          { _id: editData._id },
          {
            $set: {
              brand_name: editData.brand_name,
            },
          }
        )
        .catch((err) => reject(err));
      if (data.modifiedCount != 0) {
        resolve({ status: true });
      } else {
        resolve({ status: false });
      }
    });
  },

  /*--------------------------------DELETE BRANDS-----------------------------------*/

  deleteBrands: (brandId) => {
    return new Promise(async (resolve, reject) => {
      let data = await brands
        .deleteOne({ brand_id: brandId })
        .catch((err) => reject(err));
      if (data.deletedCount != 0) {
        resolve({ status: true });
      } else {
        resolve({ staus: false });
      }
    });
  },

  /*--------------------------------BULK VALIDATION PRODUCT-----------------------------------*/

  validationBulkProduct: (productsData) => {
    return new Promise(async (resolve, reject) => {
      let err = {};
      let vendor_sku_id = [];
      let brand = [];
      let model = [];
      let jack_type = [];
      for (let i = 0; i < productsData.length; i++) {
        let checkMuic = await products.findOne({ muic: productsData[i]?.muic });
        if (checkMuic) {
          resolve({ status: 0 });
        } else if (
          productsData[i]?.variant == "" ||
          productsData[i]?.variant == undefined ||
          productsData[i]?.vendor_name == "" ||
          productsData[i]?.vendor_name == undefined
        ) {
          resolve({ status: 1 });
        }
        if (
          productsData[i]?.jack_type !== "Micro USB" &&
          productsData[i]?.jack_type !== "Type C" &&
          productsData[i]?.jack_type !== "lightning"
        ) {
          jack_type.push(productsData[i]?.jack_type);
          err["jack_type"] = jack_type;
        }
        let skuIdExists = await products.findOne({
          vendor_sku_id: productsData[i].vendor_sku_id,
        });
        if (skuIdExists) {
          vendor_sku_id.push(skuIdExists.vendor_sku_id);
          err["duplicate_vendor_iD"] = vendor_sku_id;
        } else {
          if (
            productsData.some(
              (data, index) =>
                data.vendor_sku_id == productsData[i].vendor_sku_id &&
                index != i
            )
          ) {
            vendor_sku_id.push(productsData[i].vendor_sku_id);
            err["duplicate_vendor_iD"] = vendor_sku_id;
          }
        }
        let brandNameExists = await brands.findOne({
          brand_name: productsData[i].brand_name,
        });
        if (brandNameExists == null) {
          brand.push(productsData[i].brand_name);
          err["brand_name"] = brand;
        }
        let modelName = await products.findOne({
          model_name: productsData[i].model_name,
          brand_name: productsData[i].brand_name,
        });
        if (modelName) {
          model.push(modelName.model_name);
          err["model_name"] = model;
        } else {
          if (
            productsData.some(
              (data, index) =>
                data.model_name == productsData[i].model_name && index != i
            ) &&
            productsData.some(
              (data, index) =>
                data.brand_name == productsData[i].brand_name && index != i
            )
          ) {
            model.push(productsData[i].model_name);
            err["model_name"] = model;
          }
        }
      }
      if (Object.keys(err).length === 0) {
        resolve({ status: true });
      } else {
        resolve({ status: false, err: err });
      }
    });
  },

  /*--------------------------------CREATE PRODUCT-----------------------------------*/

  createProduct: (productData, image) => {
    return new Promise(async (resolve, reject) => {
      if (image != undefined) {
        productData.image = IISDOMAINPRDT + image;
      }
      let productExists = await products
        .findOne({
          $or: [
            { model_name: productData.model_name },
            { vendor_sku_id: productData.vendor_sku_id },
          ],
        })
        .catch((err) => reject(err));
      if (productExists) {
        resolve({ status: false });
      } else {
        let data = await products
          .create(productData)
          .catch((err) => reject(err));
        if (data) {
          resolve({ status: true });
        }
      }
    });
  },
  /*--------------------------------GET ALL PRODUCTS-----------------------------------*/

  getAllProducts: () => {
    return new Promise(async (resolve, reject) => {
      let allProducts = await products.find({});
      resolve(allProducts);
    });
  },

  /*--------------------------------FIND BRAND BASED PRODUCT-----------------------------------*/

  getBrandBasedPrdouct: (brandName) => {
    return new Promise(async (resolve, reject) => {
      let allProducts = await products
        .find({ brand_name: brandName })
        .sort({ model_name: 1 })
        .collation({ locale: "en_US", numericOrdering: true });
      resolve(allProducts);
    });
  },

  /*--------------------------------FIND IMAGE FOR EDITING-----------------------------------*/

  getImageEditData: (id) => {
    return new Promise(async (resolve, reject) => {
      let data = await products.findOne({ muic: id });
      if (data) {
        resolve(data);
      } else {
        resolve(data);
      }
    });
  },

  /*--------------------------------EDIT PRODUCT IMEAGE-----------------------------------*/

  editproductImage: (id, image) => {
    image = IISDOMAINPRDT + image;
    return new Promise(async (resolve, reject) => {
      let data = await products.updateOne(
        { _id: id },
        {
          $set: {
            image: image,
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

  /*--------------------------------PRODCUT-----------------------------------*/

  getEditProduct: (productId) => {
    return new Promise(async (resolve, reject) => {
      let data = await products
        .findOne({ muic: productId })
        .catch((err) => reject(err));
      if (data) {
        let ordersCheck = await orders.findOne({ item_id: data.vendor_sku_id });
        if (ordersCheck) {
          resolve({ status: 3, data: data });
        } else {
          let deliveryCheck = await orders.findOne({
            item_id: data.vendor_sku_id,
          });
          if (deliveryCheck) {
            resolve({ status: 2, data: data });
          } else {
            resolve({ status: 1, data: data });
          }
        }
      } else {
        resolve({ status: 0 });
      }
    });
  },

  /*--------------------------------EDIT PRODUCT-----------------------------------*/

  editproduct: (productData) => {
    return new Promise(async (resolve, reject) => {
      let data = await products.updateOne(
        { _id: productData._id },
        {
          $set: {
            jack_type: productData.jack_type,
            brand_name: productData.brand_name,
            model_name: productData.model_name,
            vendor_sku_id: productData.vendor_sku_id,
            vendor_name: productData.vendor_name,
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

  /*--------------------------------DELETE PRODUCT-----------------------------------*/

  deleteProduct: (productId) => {
    return new Promise(async (resolve, reject) => {
      let data = await products.deleteOne({ muic: productId });
      if (data.deletedCount != 0) {
        resolve(data);
      } else {
        resolve();
      }
    });
  },

  /*--------------------------------ADD LOCATION-----------------------------------*/

  addLocation: (locationData) => {
    return new Promise(async (resolve, reject) => {
      let checkNameExists = await infra.findOne({
        $or: [
          {
            type_taxanomy: locationData.type_taxanomy,
            name: locationData.name,
          },
          {
            type_taxanomy: locationData.type_taxanomy,
            code: locationData.code,
          },
        ],
      });
      if (checkNameExists) {
        resolve({ status: 2 });
      } else {
        if (
          locationData.type_taxanomy == "Warehouse" &&
          locationData.warehouse_type == "Spare Part Warehouse"
        ) {
          let checkExists = await infra.findOne({
            parent_id: locationData.parent_id,
            warehouse_type: "Spare Part Warehouse",
          });
          if (checkExists) {
            resolve({ status: 1 });
          } else {
            let data = await infra.create(locationData);
            if (data) {
              resolve({ status: 3 });
            }
          }
        } else {
          let data = await infra.create(locationData);
          if (data) {
            resolve({ status: 3 });
          }
        }
      }
    });
  },

  /*--------------------------------GET INFRA-----------------------------------*/

  getInfra: (infraId, type) => {
    return new Promise(async (resolve, reject) => {
      let data = await infra.findOne({ code: infraId, type_taxanomy: type });
      if (data) {
        resolve(data);
      } else {
        resolve();
      }
    });
  },

  /*--------------------------------EDIT INFRA-----------------------------------*/

  editInfra: (infraId) => {
    return new Promise(async (resolve, reject) => {
      let data = await infra.updateOne(
        { _id: infraId._id },
        {
          $set: {
            name: infraId?.name,
            code: infraId?.code,
            address: infraId?.address,
            city: infraId?.city,
            state: infraId?.state,
            country: infraId?.country,
            pincode: infraId?.pincode,
            warehouse_type: infraId?.warehouse_type,
            parent_id: infraId?.parent_id,
            location_type: infraId?.location_type,
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

  /*--------------------------------DELETE INFRA-----------------------------------*/

  deleteInfra: (infraId, type) => {
    return new Promise(async (resolve, reject) => {
      let checkUsed = await user.findOne({ cpc: infraId, type_taxanomy: type });
      if (checkUsed) {
        resolve({ status: 2 });
      } else {
        let data = await infra.deleteOne({ code: infraId });
        if (data.deletedCount != 0) {
          resolve({ status: 1 });
        } else {
          resolve({ status: 0 });
        }
      }
    });
  },

  /*--------------------------------FIND LOCATION-----------------------------------*/

  getLocation: () => {
    return new Promise(async (resolve, reject) => {
      let allLocation = await infra.find({ type_taxanomy: "CPC" });
      resolve(allLocation);
    });
  },
  /*--------------------------------GET PROCESSING LOCATION ------------------------------*/
  getProcessingLocationFetch: (type) => {
    return new Promise(async (resolve, reject) => {
      let allLocation = await infra.find({
        type_taxanomy: "CPC",
        location_type: type,
      });
      resolve(allLocation);
    });
  },
  /*--------------------------------FIND ALL WAREHOUSE-----------------------------------*/

  getAllWarehouse: () => {
    return new Promise(async (resolve, reject) => {
      let data = await infra.find({ type_taxanomy: "Warehouse" });
      resolve(data);
    });
  },
  /*--------------------------------FIND ALL SP CATEGORIES-----------------------------------*/

  getAllSPCategories: () => {
    return new Promise(async (resolve, reject) => {
      let data = await spareCategories.find();
      if (data) {
        resolve(data);
      } else {
        resolve();
      }
    });
  },

  /*--------------------------------BULK BAG VALIDATION-----------------------------------*/

  bulkBagValidation: (bagData) => {
    return new Promise(async (resolve, reject) => {
      let err = {};
      let cpc = [];
      let bag_display_name = [];
      let dispaly_name = [];
      let warehouse = [];
      let bagLimit = [];
      for (let i = 0; i < bagData.length; i++) {
        if (
          bagData[i].bag_limit <= 0 ||
          bagData[i].bag_limit > 99 ||
          /[0-9]/.test(bagData[i].bag_limit) == false
        ) {
          bagLimit.push(bagData[i].bag_id);
          err["limit"] = bagLimit;
        }
        let cpcCheck = await infra.findOne({ code: bagData[i].cpc });
        if (cpcCheck == null) {
          cpc.push(bagData[i]?.cpc);
          err["cpc"] = cpc;
          warehouse.push(bagData[i]?.warehouse);
          err["warehouse_does_not_exist"] = warehouse;
        } else {
          let warehouseCheck = await infra.findOne({
            type_taxanomy: "Warehouse",
            name: bagData[i]?.warehouse,
            parent_id: cpcCheck.name,
          });
          if (warehouseCheck == null) {
            warehouse.push(bagData[i]?.bag_id);
            err["warehouse_does_not_exist"] = warehouse;
          }
        }
        let bagName = await masters.findOne({
          prefix: "bag-master",
          name: bagData[i].bag_display_name,
        });
        if (bagName) {
          bag_display_name.push(bagData[i]?.bag_display_name);
          err["bag_display_name_is_duplicate"] = bag_display_name;
        } else {
          if (
            bagData.some(
              (data, index) =>
                data?.bag_display_name == bagData[i]?.bag_display_name &&
                index != i
            )
          ) {
            bag_display_name.push(bagData[i]?.bag_display_name);
            err["bag_display_name_is_duplicate"] = bag_display_name;
          }
        }
        let displayName = await masters.findOne({
          prefix: "bag-master",
          display: bagData[i]?.bag_display,
        });
        if (displayName) {
          dispaly_name.push(bagData[i]?.bag_display);
          err["bag_display_is_duplicate"] = dispaly_name;
        } else {
          if (
            bagData.some(
              (data, index) =>
                data?.bag_display == bagData[i]?.bag_display && index != i
            )
          ) {
            dispaly_name.push(bagData[i]?.bag_display);
            err["bag_display_is_duplicate"] = dispaly_name;
          }
        }
      }
      if (Object.keys(err).length === 0) {
        resolve({ status: true });
      } else {
        resolve({ status: false, data: err });
      }
    });
  },
  ctxCategoryLimit: (trayType, currentCount) => {
    return new Promise(async (resolve, reject) => {
      let data = await trayCategory.findOne({
        code: trayType,
        series_end: { $gte: currentCount },
      });
      if (data) {
        resolve({ status: 1 });
      } else {
        resolve({ status: 2 });
      }
    });
  },
  /*--------------------------------BULK TRAY VALIDATION-----------------------------------*/

  bulkValidationTray: (trayData) => {
    return new Promise(async (resolve, reject) => {
      let err = {};
      let tray_id = [];
      let tray_name = [];
      let tray_dispaly_name = [];
      let brand = [];
      let model = [];
      let warehouse = [];
      let cpc = [];
      let trayLimit = [];
      let category = [];
      let grade = [];
      let dup = false;

      for (let i = 0; i < trayData.length; i++) {
        let checkDupId = await masters.findOne({ code: trayData[i]?.tray_id });
        if (checkDupId) {
          dup = true;
          break;
        }
        let trayID = trayData[i]?.tray_id?.split(
          `${trayData[i]?.tray_category}`
        )[1];
        if (
          trayData[i]?.tray_category == "CT" ||
          trayData[i]?.tray_category == "ST"
        ) {
          trayID = trayData[i]?.tray_id?.split(
            `${trayData[i]?.tray_category + trayData[i]?.tray_grade}`
          )[1];
        }
        if (
          trayData[i].tray_category !== "BOT" &&
          trayData[i].tray_category !== "PMT" &&
          trayData[i].tray_category !== "MMT" &&
          trayData[i].tray_category !== "WHT" &&
          trayData[i].tray_category !== "SPT" &&
          trayData[i].tray_category !== "RPT" &&
          trayData[i].tray_category !== "RPB" &&
          trayData[i].tray_category !== "RPA" &&
          trayData[i].tray_category !== "CBT"
        ) {
          if (
            trayData[i].tray_category !== "CT" &&
            trayData[i].tray_category !== "ST"
          ) {
            category.push(trayData[i].tray_category);
            err["category"] = category;
          } else {
            let checkCategory = await trayCategory.findOne({
              code: trayData[i].tray_grade,
            });
            if (checkCategory == null) {
              grade.push(trayData[i].tray_grade);
              err["grade"] = grade;
            } else {
              if (trayID > checkCategory.series_end) {
                tray_id.push(trayData[i].tray_id);
                err["tray_id"] = tray_id;
              }
            }
          }
        }
        if (
          trayData[i].tray_limit <= 0 ||
          trayData[i].tray_limit > 99 ||
          /[0-9]/.test(trayData[i].tray_limit) == false
        ) {
          trayLimit.push(trayData[i].tray_id);
          err["limit"] = trayLimit;
        }
        let cpcCheck = await infra.findOne({ code: trayData[i].cpc });
        if (cpcCheck == null) {
          cpc.push(trayData[i]?.cpc);
          err["cpc"] = cpc;
          warehouse.push(trayData[i]?.warehouse);
          err["warehouse_does_not_exist"] = warehouse;
        } else {
          let warehouseCheck = await infra.findOne({
            type_taxanomy: "Warehouse",
            name: trayData[i]?.warehouse,
            parent_id: cpcCheck.code,
          });
          if (warehouseCheck == null) {
            warehouse.push(trayData[i]?.tray_id);
            err["warehouse_does_not_exist"] = warehouse;
          }
        }
        if (trayID > 2251 && trayData[i].tray_category == "BOT") {
          tray_id.push(trayData[i].tray_id);
          err["tray_id"] = tray_id;
        } else if (trayID > 8051 && trayData[i].tray_category == "MMT") {
          tray_id.push(trayData[i].tray_id);
          err["tray_id"] = tray_id;
        } else if (trayID > 11000 && trayData[i].tray_category == "WHT") {
          tray_id.push(trayData[i].tray_id);
          err["tray_id"] = tray_id;
        } else if (trayID > 8151 && trayData[i].tray_category == "PMT") {
          tray_id.push(trayData[i].tray_id);
          err["tray_id"] = tray_id;
        } else if (trayID > 19999 && trayData[i].tray_category == "SPT") {
          tray_id.push(trayData[i].tray_id);
          err["tray_id"] = tray_id;
        } else if (trayID > 19999 && trayData[i].tray_category == "RPT") {
          tray_id.push(trayData[i].tray_id);
          err["tray_id"] = tray_id;
        } else if (trayID > "00100" && trayData[i].tray_category == "RPA") {
          tray_id.push(trayData[i].tray_id);
          err["tray_id"] = tray_id;
        } else if (trayID > "00100" && trayData[i].tray_category == "RPB") {
          tray_id.push(trayData[i].tray_id);
          err["tray_id"] = tray_id;
        } else {
          let checkSereisEnd = await trayCategory.findOne({
            code: trayData[i]?.tray_category,
          });
          if (checkSereisEnd) {
            if (checkSereisEnd.series_end < trayID) {
              tray_id.push(trayData[i].tray_id);
              err["tray_id"] = tray_id;
            }
          }
        }
        // if (trayID > 1999 && trayData[i].tray_category == "CTA") {
        //   tray_id.push(trayData[i].tray_id);
        //   err["tray_id"] = tray_id;
        // }
        // if (trayID > 2999 && trayData[i].tray_category == "CTB") {
        //   tray_id.push(trayData[i].tray_id);
        //   err["tray_id"] = tray_id;
        // }
        // if (trayID > 3999 && trayData[i].tray_category == "CTC") {
        //   tray_id.push(trayData[i].tray_id);
        //   err["tray_id"] = tray_id;
        // }
        // if (trayID > 4999 && trayData[i].tray_category == "CTD") {
        //   tray_id.push(trayData[i].tray_id);
        //   err["tray_id"] = tray_id;
        // }
        let trayName = await masters.findOne({
          prefix: "tray-master",
          name: trayData[i].tray_name,
        });
        if (trayName) {
          tray_name.push(trayData[i]?.tray_name);
          err["tray_display_name_duplicate"] = tray_name;
        } else {
          if (
            trayData.some(
              (data, index) =>
                data?.tray_name == trayData[i]?.tray_name && index != i
            )
          ) {
            tray_name.push(trayData[i]?.tray_name);
            err["tray_display_name_duplicate"] = tray_name;
          }
        }
        let displayName = await masters.findOne({
          prefix: "tray-master",
          display: trayData[i]?.tray_display,
        });
        if (displayName) {
          tray_dispaly_name.push(trayData[i]?.tray_display);
          err["tray_display_is_duplicate"] = tray_dispaly_name;
        } else {
          if (
            trayData.some(
              (data, index) =>
                data?.tray_display == trayData[i]?.tray_display && index != i
            )
          ) {
            tray_dispaly_name.push(trayData[i]?.tray_display);
            err["tray_display_is_duplicate"] = tray_dispaly_name;
          }
        }
        if (
          trayData[i].tray_category !== "BOT" &&
          trayData[i].tray_category !== "PMT" &&
          trayData[i].tray_category !== "MMT" &&
          trayData[i].tray_category !== "SPT" &&
          trayData[i].tray_category !== "CBT" &&
          trayData[i].tray_category !== "RPA" &&
          trayData[i].tray_category !== "RPB"
        ) {
          let brandModel = await brands.findOne({
            brand_name: {
              $regex: new RegExp("^" + trayData[i].tray_brand, "i"),
            },
          });
          if (brandModel == null) {
            brand.push(trayData[i].tray_brand);
            err["brand"] = brand;
          }
          let modelName = await products.findOne({
            model_name: {
              $regex: new RegExp("^" + trayData[i].tray_model, "i"),
            },
            brand_name: {
              $regex: new RegExp("^" + trayData[i].tray_brand, "i"),
            },
          });
          if (modelName == null) {
            model.push(trayData[i].tray_model);
            err["model"] = model;
          }
        }
      }
      if (Object.keys(err).length === 0) {
        resolve({ status: true, dupId: dup });
      } else {
        resolve({ status: false, data: err, dupId: dup });
      }
    });
  },

  /*--------------------------------ADD BULK TRAY-----------------------------------*/

  addbulkTray: (bulkDataTray) => {
    const newArrayOfObj = bulkDataTray.map(
      ({
        tray_id: code,
        tray_category: type_taxanomy,
        tray_model: model,
        tray_name: name,
        tray_brand: brand,
        tray_limit: limit,
        tray_display: display,
        ...rest
      }) => ({
        code,
        type_taxanomy,
        model,
        brand,
        name,
        limit,
        display,
        ...rest,
      })
    );

    return new Promise(async (resolve, reject) => {
      let data = await masters.create(newArrayOfObj);
      if (data) {
        resolve(data);
      }
    });
  },

  /*--------------------------------ADD BULK BAG-----------------------------------*/

  addBulkBag: (bulkData) => {
    const newArrayOfObj = bulkData.map(
      ({
        bag_id: code,
        bag_category: type_taxanomy,
        bag_display_name: name,
        bag_limit: limit,
        bag_display: display,
        ...rest
      }) => ({
        code,
        type_taxanomy,
        name,
        limit,
        display,
        ...rest,
      })
    );
    return new Promise(async (resolve, reject) => {
      let data = await masters.create(newArrayOfObj);
      if (data) {
        resolve(data);
      }
    });
  },
  /*--------------------------------FIND AUDIT FOR MASTERS-----------------------------------*/

  getAudit: (bagId) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({ code: bagId });
      resolve(data);
    });
  },

  /*--------------------------------CREATE MASTERS-----------------------------------*/

  createMasters: (mastersData) => {
    return new Promise(async (resolve, reject) => {
      let exist = await masters.findOne({
        $or: [
          {
            $or: [
              { name: mastersData.name, prefix: mastersData.prefix },
              { code: mastersData.code },
              { prefix: mastersData.prefix, display: mastersData.display },
            ],
          },
        ],
      });

      if (exist) {
        resolve();
      } else {
        let data = await masters.create(mastersData);
        if (data) {
          resolve(data);
        }
      }
    });
  },

  /*--------------------------------FIND MASTERS-----------------------------------*/

  getMasters: (type) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters
        .find(
          { prefix: type.master_type },
          { items: 0, actual_items: 0, temp_array: 0, wht_tray: 0 }
        )
        .sort({ code: 1 })
        .collation({ locale: "en_US", numericOrdering: true });
      resolve(data);
    });
  },

  /*--------------------------------GET ONE MASTER FOR EDIT-----------------------------------*/

  getOneMaster: (masterId) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.findOne({
        $or: [
          { code: masterId, sort_id: "No Status" },
          { code: masterId, sort_id: "Open" },
        ],
      });
      if (data) {
        resolve(data);
      } else {
        resolve();
      }
    });
  },

  /*--------------------------------EDIT MASTER-----------------------------------*/

  editMaster: (editData) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.findOneAndUpdate(
        { _id: editData._id },
        {
          $set: {
            name: editData.name,
            type_taxanomy: editData.type_taxanomy,
            limit: editData.limit,
            display: editData.display,
            model: editData.model,
            brand: editData.brand,
            warehouse: editData.warehouse,
            cpc: editData.cpc,
          },
        },
        { returnOriginal: false }
      );
      if (data) {
        let obj = {
          name: data.name,
          code: data.code,
          type_taxanomy: data.type_taxanomy,
          parent_id: data.parent_id,
          sort_id: data.sort_id,
          prefix: data.prefix,
          display: data.display,
          created_at: Date.now(),
          limit: data.limit,
          model: data.model,
          brand: data.brand,
          warehouse: data.warehouse,
          cpc: data.cpc,
        };
        let addMasterEditHistory = await mastersEditHistory.create(obj);
        if (addMasterEditHistory) {
          resolve({ status: true });
        } else {
          resolve({ status: false });
        }
      } else {
        resolve({ status: false });
      }
    });
  },
  /*--------------------------------MASTERS EDIT HISTORY-----------------------------------*/

  getMasterEditHistory: (trayId) => {
    return new Promise(async (resolve, reject) => {
      let data = await mastersEditHistory
        .find({ code: trayId })
        .catch((err) => reject(err));
      if (data) {
        resolve(data);
      }
    });
  },

  /*--------------------------------DELETE MASTER-----------------------------------*/

  delteMaster: (masterId, reason, actionUser) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.findOneAndDelete({ code: masterId });
      if (data) {
        await deletedMaster.create({
          name: data.name,
          code: data.code,
          type_taxanomy: data.type_taxanomy,
          display: data.display,
          cpc: data.cpc,
          warehouse: data.warehouse,
          tray_grade: data.tray_grade,
          brand: data.brand,
          model: data.model,
          created_at: data.created_at,
          prefix: data.prefix,
          limit: data.limit,
          reason: reason,
          deleted_by: actionUser,
        });
        resolve({ status: true });
      } else {
        resolve({ status: false });
      }
    });
  },
  /*----------------------------------GET DELETED TRAYS -------------------------------*/
  getDeletedMasters: async (type) => {
    try {
      const findData = await deletedMaster.find({
        prefix: type,
        status: "Pending",
      });
      return findData;
    } catch (error) {
      return error;
    }
  },
  /*----------------------------------TRAY DELETION HISTORY------------------------*/
  getTrayDeletionHistory: async (trayId) => {
    try {
      const data = await deletedMaster.find({ code: trayId });
      return data;
    } catch (error) {
      return error;
    }
  },
  /*--------------------------------RESTORE THE DELETED MASTER----------------------*/
  restoreDeletedMaster: async (id, actionUser, reason) => {
    try {
      const findAndUpdateStatus = await deletedMaster.findOneAndUpdate(
        { code: id, status: "Pending" },
        {
          $set: {
            status: "Restored",
            restored_by: actionUser,
            reason_for_restore: reason,
            restored_date: Date.now(),
          },
        }
      );
      if (findAndUpdateStatus) {
        let restore = await masters.create({
          name: findAndUpdateStatus.name,
          code: findAndUpdateStatus.code,
          type_taxanomy: findAndUpdateStatus.type_taxanomy,
          display: findAndUpdateStatus.display,
          cpc: findAndUpdateStatus.cpc,
          warehouse: findAndUpdateStatus.warehouse,
          tray_grade: findAndUpdateStatus.tray_grade,
          brand: findAndUpdateStatus.brand,
          model: findAndUpdateStatus.model,
          created_at: findAndUpdateStatus.created_at,
          prefix: findAndUpdateStatus.prefix,
          limit: findAndUpdateStatus.limit,
          sort_id: "Open",
        });
        if (restore) {
          return { status: 1 };
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
  /*--------------------------------ITEM TRACKING-----------------------------------*/

  itemTracking: (limit, skip) => {
    return new Promise(async (resolve, reject) => {
      let data = await orders.aggregate([
        {
          $match: {
            delivery_status: "Delivered",
          },
        },
        {
          $lookup: {
            from: "deliveries",
            localField: "order_id",
            foreignField: "order_id",
            as: "delivery",
          },
        },
        {
          $unwind: "$delivery",
        },
        {
          $skip: skip,
        },
        {
          $limit: limit,
        },
      ]);
      let count = await orders.count({ delivery_status: "Delivered" });
      resolve({ data: data, count: count });
    });
  },

  /*--------------------------------SEARCH ITEM TRACKING-----------------------------------*/

  searchAdminTrackItem: (searchType, value, location) => {
    let allData;
    let date2 = moment.utc(value, "DD-MM-YYYY").toDate();
    let date1 = moment.utc(value, "DD-MM-YYYY").add(1, "days").toDate();

    return new Promise(async (resolve, reject) => {
      allData = await orders.aggregate([
        {
          $match: {
            delivery_status: "Delivered",
            $or: [
              { order_id: { $regex: "^" + value + ".*", $options: "i" } },
              { item_id: { $regex: "^" + value + ".*", $options: "i" } },
              {
                imei: {
                  $regex: ".*" + value + ".*",
                  $options: "i",
                },
              },
            ],
          },
        },
        {
          $lookup: {
            from: "deliveries",
            localField: "order_id",
            foreignField: "order_id",
            as: "delivery",
          },
        },
        {
          $unwind: "$delivery",
        },
      ]);
      if (allData.length == 0) {
        allData = await orders.aggregate([
          {
            $match: {
              delivery_status: "Delivered",
            },
          },
          {
            $lookup: {
              from: "deliveries",
              localField: "order_id",
              foreignField: "order_id",
              as: "delivery",
            },
          },
          {
            $unwind: "$delivery",
          },
          {
            $match: {
              delivery_status: "Delivered",
              $or: [
                {
                  "delivery.uic_status": {
                    $regex: "^" + value + ".*",
                    $options: "i",
                  },
                },
                {
                  "delivery.tracking_id": {
                    $regex: ".*" + value + ".*",
                    $options: "i",
                  },
                },
                {
                  "delivery.uic_code.code": {
                    $regex: ".*" + value + ".*",
                    $options: "i",
                  },
                },
                {
                  "delivery.bag_id": {
                    $regex: ".*" + value + ".*",
                    $options: "i",
                  },
                },
                {
                  "delivery.agent_name": {
                    $regex: ".*" + value + ".*",
                    $options: "i",
                  },
                },
                {
                  "delivery.tray_id": {
                    $regex: ".*" + value + ".*",
                    $options: "i",
                  },
                },
                {
                  "delivery.tray_location": {
                    $regex: ".*" + value + ".*",
                    $options: "i",
                  },
                },
                {
                  "delivery.tray_type": {
                    $regex: ".*" + value + ".*",
                    $options: "i",
                  },
                },
                {
                  "delivery.sorting_agent_name": {
                    $regex: ".*" + value + ".*",
                    $options: "i",
                  },
                },
                {
                  "delivery.wht_tray": {
                    $regex: ".*" + value + ".*",
                    $options: "i",
                  },
                },
                {
                  "delivery.agent_name_charging": {
                    $regex: ".*" + value + ".*",
                    $options: "i",
                  },
                },
                {
                  "delivery.agent_name_bqc": {
                    $regex: ".*" + value + ".*",
                    $options: "i",
                  },
                },
                {
                  "delivery.stockin_date": {
                    $lt: date1,
                    $gt: date2,
                  },
                },
                {
                  "delivery.bag_close_date": {
                    $lt: date1,
                    $gt: date2,
                  },
                },
                {
                  "delivery.assign_to_agent": {
                    $lt: date1,
                    $gt: date2,
                  },
                },
                {
                  "delivery.tray_closed_by_bot": {
                    $lt: date1,
                    $gt: date2,
                  },
                },
                {
                  "delivery.bot_done_received": {
                    $lt: date1,
                    $gt: date2,
                  },
                },
                {
                  "delivery.warehouse_close_date": {
                    $lt: date1,
                    $gt: date2,
                  },
                },
                {
                  "delivery.handover_sorting_date": {
                    $lt: date1,
                    $gt: date2,
                  },
                },
                {
                  "delivery.wht_tray_assigned_date": {
                    $lt: date1,
                    $gt: date2,
                  },
                },
                {
                  "delivery.assign_to_agent_charging": {
                    $lt: date1,
                    $gt: date2,
                  },
                },
                {
                  "delivery.assign_to_agent_bqc": {
                    $lt: date1,
                    $gt: date2,
                  },
                },
                {
                  "delivery.charging_in_date": {
                    $lt: date1,
                    $gt: date2,
                  },
                },

                {
                  "delivery.charging_done_date": {
                    $lt: date1,
                    $gt: date2,
                  },
                },
                {
                  "delivery.charging_done_received": {
                    $lt: date1,
                    $gt: date2,
                  },
                },
                {
                  "delivery.charging_done_close": {
                    $lt: date1,
                    $gt: date2,
                  },
                },
                {
                  "delivery.bqc_in_date": {
                    $lt: date1,
                    $gt: date2,
                  },
                },
                {
                  "delivery.bqc_out_date": {
                    $lt: date1,
                    $gt: date2,
                  },
                },
                {
                  "delivery.bot_done_received": {
                    $lt: date1,
                    $gt: date2,
                  },
                },
                {
                  "delivery.bqc_done_close": {
                    $lt: date1,
                    $gt: date2,
                  },
                },
              ],
            },
          },
        ]);
      }

      if (allData) {
        resolve(allData);
      }
    });
  },
  /*--------------------------------IN USE WHT TRAYS-----------------------------------*/

  getWhtTrayInuse: () => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.aggregate([
        {
          $match: {
            type_taxanomy: "WHT",
            prefix: "tray-master",
            sort_id: "Inuse",
            items: { $ne: [] },
            items: { $ne: undefined },
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
      if (data) {
        resolve(data);
      }
    });
  },
  /*--------------------------------READY FOR CHARGING-----------------------------------*/

  readyForCharging: (trayId, status) => {
    return new Promise(async (resolve, reject) => {
      let flag = false;
      for (let x of trayId) {
        let updateWht = await masters.findOneAndUpdate(
          { code: x },
          {
            $set: {
              sort_id: status,
              actual_items: [],
              issued_user_name: null,
            },
          }
        );
        if (updateWht == null) {
          flag = true;
        } else {
          for (let x of updateWht?.items) {
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
        }
      }
      if (flag === false) {
        resolve({ status: 1 });
      } else {
        resolve({ status: 0 });
      }
    });
  },
  /*--------------------------------GET INVALID BAG ITEM-----------------------------------*/

  getInvalidItemBag: () => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        prefix: "bag-master",
        sort_id: "In Progress",
        "items.status": "Invalid",
      });
      if (data) {
        resolve(data);
      }
    });
  },
  /*--------------------------------GET BAG IF ANY INVALID ITEM PRESENT-----------------------------------*/

  getInvalidItemForBag: (bagId) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.findOne({ code: bagId });
      if (data) {
        if (data.sort_id == "In Progress") {
          resolve({ data: data, status: 1 });
        } else {
          resolve({ status: 3 });
        }
      } else {
        resolve({ sataus: 3 });
      }
    });
  },
  /*--------------------------------FETCH BQC REPORT-----------------------------------*/

  getBqcReport: (uic) => {
    return new Promise(async (resolve, reject) => {
      let obj = {};
      let uicExists = await delivery.findOne(
        { "uic_code.code": uic },
        {
          uic_code: 1,
          tracking_id: 1,
          order_id: 1,
          charging: 1,
          bqc_report: 1,
          bqc_done_close: 1,
          bqc_software_report: 1,
          bot_report: 1,
          charging_done_date: 1,
          bot_report: 1,
          charging_done_date: 1,
          imei: 1,
        }
      );
      if (uicExists) {
        if (uicExists.bqc_done_close !== undefined) {
          let getOrder = await orders.findOne({ order_id: uicExists.order_id });
          obj.delivery = uicExists;
          obj.order = getOrder;

          resolve({ status: 1, data: obj });
        } else {
          resolve({ status: 3 });
        }
      } else {
        resolve({ status: 2 });
      }
    });
  },
  productImageRemove: () => {
    return new Promise(async (resolve, reject) => {
      let update = await products.updateMany(
        {},
        {
          $unset: {
            image: 1,
          },
        }
      );
      resolve({ status: "Done" });
    });
  },
  /*--------------------------------CHARGE DONE DAY DIFFERENT 4 WHT TRAY-----------------------------------*/

  chargeDoneTrayFourDayDiff: () => {
    return new Promise(async (resolve, reject) => {
      let tray = await masters.aggregate([
        {
          $match: {
            prefix: "tray-master",
            sort_id: "Ready to BQC",
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
        let arr = [];
        for (let x of tray) {
          var today = new Date(Date.now());
          if (
            new Date(x.closed_time_bot) <=
            new Date(today.setDate(today.getDate() - 4))
          ) {
            arr.push(x);
          }
        }
        resolve(arr);
      }
    });
  },
  /*--------------------------------AUDIT DONE TRAY-----------------------------------*/

  getAuditDone: () => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.aggregate([
        {
          $match: {
            sort_id: "Audit Done Closed By Warehouse",
            type_taxanomy: "WHT",
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
  },
  ctxTrayClosedByWh: () => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        prefix: "tray-master",
        sort_id: "Audit Done Closed By Warehouse",
        type_taxanomy: {
          $in: ["CT"],
        },
      });
      resolve(data);
    });
  },
  /*--------------------------------AUDIT DONE TRAY  FORCEFULL SEND TO RDL-----------------------------------*/

  forceFullReadySendSup: (trayIds, type) => {
    return new Promise(async (resolve, reject) => {
      let sendtoRdlMis;
      for (let x of trayIds) {
        sendtoRdlMis = await masters.findOneAndUpdate(
          { code: x },
          {
            $set: {
              sort_id: type,
              actual_items: [],
              issued_user_name: null,
              from_merge: null,
              to_merge: null,
            },
          }
        );
        for (let x of sendtoRdlMis?.items) {
          let deliveryTrack = await delivery.findOneAndUpdate(
            { tracking_id: x.tracking_id },
            {
              $set: {
                tray_status: type,
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
      }
      if (sendtoRdlMis) {
        resolve({ status: true });
      } else {
        resolve({ status: false });
      }
    });
  },

  /*--------------------------------EXTRA CHANGES-----------------------------------*/

  addGrade: () => {
    return new Promise(async (resolve, reject) => {
      let ctxOld = await masters.find({
        type_taxanomy: {
          $in: ["CT"],
        },
        prefix: "tray-master",
      });
      for (let x of ctxOld) {
        let data;
        if (x.type_taxanomy == "CTA") {
          data = await masters.updateOne(
            { code: x.code },
            {
              $set: {
                type_taxanomy: "CT",
                tray_grade: "A",
              },
            }
          );
        } else if (x.type_taxanomy == "CTB") {
          data = await masters.updateOne(
            { code: x.code },
            {
              $set: {
                type_taxanomy: "CT",
                tray_grade: "B",
              },
            }
          );
        } else if (x.type_taxanomy == "CTC") {
          data = await masters.updateOne(
            { code: x.code },
            {
              $set: {
                type_taxanomy: "CT",
                tray_grade: "C",
              },
            }
          );
        } else if (x.type_taxanomy == "CTD") {
          data = await masters.updateOne(
            { code: x.code },
            {
              $set: {
                type_taxanomy: "CT",
                tray_grade: "D",
              },
            }
          );
        }
      }
      resolve(ctxOld);
    });
  },
  updateCtxTrayId: () => {
    return new Promise(async (resolve, reject) => {
      let Allwht = await masters.find({
        prefix: "tray-master",
        type_taxanomy: {
          $in: ["CT"],
        },
      });
      for (let x of Allwht) {
        if (x.items.length != 0) {
          for (let y of x.items) {
            let updateId = await delivery.updateOne(
              { tracking_id: y.tracking_id },
              {
                $set: {
                  tray_id: y.tray_id,
                  ctx_tray_id: x.code,
                },
              }
            );
            if (updateId.modifiedCount != 0) {
            }
          }
        }
      }
      if (Allwht) {
        resolve(Allwht);
      }
    });
  },
  extraCtxRelease: () => {
    return new Promise(async (resolve, reject) => {
      let updateDelivery = await delivery.findOneAndUpdate(
        { "uic_code.code": "92100000526" },
        {
          $set: {
            tray_location: "Warehouse",
            item_moved_to_billed_bin: "Yes",
            "bqc_software_report.final_grade": "B",
            item_moved_to_billed_bin_date: Date.now(),
            item_moved_to_billed_bin_done_username: "From Bakend",
          },
        }
      );

      let updateRetuTray = await masters.updateOne(
        {
          "items.uic": "92100000526",
        },
        {
          $pull: {
            items: {
              uic: "92100000526",
            },
          },
        }
      );

      resolve({ status: true });
    });
  },
  categoryDelivery: () => {
    return new Promise(async (resolve, reject) => {
      const allDelivery = await delivery.find();
      for (let x of allDelivery) {
        let orderMatch = await orders.findOne({ order_id: x.order_id });
        if (orderMatch) {
          let updateDelivery = await delivery.updateOne(
            { order_id: x.order_id },
            {
              $set: {
                temp_delivery_status: "Delivered",
              },
            }
          );
        } else {
          let updateDelivery = await delivery.updateOne(
            { order_id: x.order_id },
            {
              $set: {
                temp_delivery_status: "Pending",
              },
            }
          );
        }
      }
      resolve(allDelivery);
    });
  },
  extraBugFixForLocation: () => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        prefix: "tray-master",
        sort_id: { $ne: "Open" },
      });
      for (let x of data) {
        if (x.type_taxanomy == "WHT") {
          for (let y of x.items) {
            let findOrder = await masters.findOne({ order_id: y.order_id });
            let deliveryUpdate = await delivery.updateOne(
              {
                order_id: y.order_id,
              },
              {
                $set: {
                  wht_tray: x.code,
                  tray_type: "WHT",
                  order_date: findOrder.order_date,
                  partner_shop: x.cpc,
                },
              }
            );
          }
        } else {
          for (let y of x.items) {
            let findOrder = await masters.findOne({ order_id: y.order_id });
            let deliveryUpdate = await delivery.updateOne(
              {
                order_id: y.order_id,
              },
              {
                $set: {
                  partner_shop: x.cpc,
                  order_date: findOrder.order_date,
                },
              }
            );
          }
        }
      }
      let allOrders = await orders.find();
      for (let x of allOrders) {
        let udpateDelivery = await delivery.updateOne(
          {
            order_id: x.order_id,
          },
          {
            $set: {
              order_date: x.order_date,
              old_item_details: x.old_item_details,
            },
          }
        );
      }
      resolve(data);
    });
  },

  extraReAudit: () => {
    return new Promise(async (resolve, reject) => {
      let arr = [
        "WHT10159",
        "WHT10035",
        "WHT10039",
        "WHT10157",
        "WHT10017",
        "WHT10018",
        "WHT10038",
        "WHT10136",
        "WHT10137",
        "WHT10152",
        "WHT10133",
        "WHT10134",
        "WHT10148",
        "WHT10158",
        "WHT10146",
        "WHT10147",
        "WHT10164",
        "WHT10140",
        "WHT10020",
        "WHT10138",
        "WHT10139",
        "WHT10028",
        "WHT10036",
        "WHT10037",
      ];
      for (let x of arr) {
        let data = await masters.updateOne(
          {
            code: x,
          },
          {
            $set: {
              limit: 40,
            },
          }
        );
      }
      resolve(arr);
    });
  },
  createctxcategory: (data) => {
    return new Promise(async (resolve, reject) => {
      let checkcodeExists = await trayCategory.findOne({
        $or: [
          {
            code: data?.code,
          },
          {
            float: data?.float,
          },
          {
            sereis_start: { $gte: data.sereis_start },
            series_end: { $lte: data.series_end },
          },
        ],
      });

      if (checkcodeExists) {
        resolve({ status: false });
      } else {
        data.created_at = Date.now();
        let dataa = await trayCategory.create(data);
        if (dataa) {
          resolve({ status: true });
        }
      }
    });
  },

  getCtxCategorys: () => {
    return new Promise(async (resolve, reject) => {
      let data = await trayCategory.find();
      if (data) {
        resolve(data);
      } else {
        resolve();
      }
    });
  },

  deleteCtxcategory: (code) => {
    return new Promise(async (resolve, reject) => {
      let categorySelected = await masters.findOne({ tray_grade: code });
      if (categorySelected) {
        resolve({ status: false });
      } else {
        let data = await trayCategory.deleteOne({ code: code });
        if (data) {
          resolve(data);
        } else {
          resolve({ status: false });
        }
      }
    });
  },

  geteditctxcategory: (code) => {
    return new Promise(async (resolve, reject) => {
      let data = await trayCategory.findOne({ code: code });
      if (data) {
        resolve(data);
      } else {
        resolve();
      }
    });
  },

  editctxcategory: async (body) => {
    return new Promise(async (resolve, reject) => {
      const Float = await trayCategory.findOne({
        $or: [
          { float: body.float, _id: { $ne: body._id } },
          { code: body.code, _id: { $ne: body._id } },
        ],
      });
      if (Float) {
        resolve({ status: false });
      } else {
        let data = await trayCategory.findOneAndUpdate(
          { _id: body?._id },
          {
            $set: {
              code: body?.code,
              description: body?.description,
              float: body?.float,
            },
          }
        );
        if (data) {
          resolve({ status: true });
        } else {
          resolve({ status: false });
        }
      }
    });
  },

  getCtxTrayCategory: () => {
    return new Promise(async (resolve, reject) => {
      let data = await trayCategory.find();
      if (data) {
        trayCategory;
        resolve(data);
      } else {
        resolve();
      }
    });
  },

  categoryCheck: (body) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({ tray_grade: body?.empId });
      if (data?.length !== 0) {
        resolve({ status: true });
      } else {
        resolve({ status: false });
      }
    });
  },

  deleteSPcategory: (spcategory_id) => {
    return new Promise(async (resolve, reject) => {
      let data = await spareCategories.deleteOne({
        spcategory_id: spcategory_id,
      });
      if (data) {
        resolve({ status: true });
      } else {
        resolve({ status: false });
      }
    });
  },
  geteditSPcategory: (spcategory_id) => {
    return new Promise(async (resolve, reject) => {
      let data = await spareCategories.findOne({
        spcategory_id: spcategory_id,
      });
      if (data) {
        resolve({ status: true });
      } else {
        resolve({ status: false });
      }
    });
  },
  getAllSPCategories: () => {
    return new Promise(async (resolve, reject) => {
      const data = await spareCategories.find();
      resolve(data);
    });
  },
  createspcategories: (spcategoriesData) => {
    return new Promise(async (resolve, reject) => {
      const checkAlready = await spareCategories.findOne({
        $or: [
          { spcategory_id: spcategoriesData.spcategory_id },
          { category_name: spcategoriesData.category_name },
        ],
      });
      if (checkAlready) {
        resolve({ status: 2 });
      } else {
        spcategoriesData.creation_date = Date.now();
        const dataa = await spareCategories.create(spcategoriesData);
        if (dataa) {
          resolve({ status: 1 });
        } else {
          resolve({ status: 3 });
        }
      }
    });
  },
  editspcategories: (spcategoriesData) => {
    return new Promise(async (resolve, reject) => {
      const updatespcategories = await spareCategories.findOneAndUpdate(
        {
          spcategory_id: spcategoriesData.spcategory_id,
        },
        {
          $set: {
            category_name: spcategoriesData.category_name,
            description: spcategoriesData.description,
          },
        }
      );
      if (updatespcategories) {
        resolve({ status: 1 });
      } else {
        resolve({ status: 2 });
      }
    });
  },
  getOneSPcategory: (spcategory_id) => {
    return new Promise(async (resolve, reject) => {
      const getOneSPcategory = await spareCategories.findOne({
        spcategory_id: spcategory_id,
      });
      if (getOneSPcategory) {
        resolve({ status: 1, data: getOneSPcategory });
      } else {
        resolve({ status: 2 });
      }
    });
  },

  deleteTrayRacks: (rack_id) => {
    return new Promise(async (resolve, reject) => {
      let checkRack = await masters.findOne({
        $or: [{ rack_id: rack_id }, { temp_rack: rack_id }],
      });
      if (checkRack) {
        resolve({ status: 2 });
      } else {
        let data = await trayRack.deleteOne({ rack_id: rack_id });
        if (data.deletedCount == 1) {
          resolve({ status: 1 });
        } else {
          resolve({ status: 0 });
        }
      }
    });
  },
  geteditTrayRacks: (rack_id) => {
    return new Promise(async (resolve, reject) => {
      let data = await trayRack.findOne({ rack_id: rack_id });
      if (data) {
        resolve({ status: true });
      } else {
        resolve({ status: false });
      }
    });
  },
  getAllTrayRacks: () => {
    return new Promise(async (resolve, reject) => {
      try {
        const aggregatePipeline = [
          {
            $lookup: {
              from: "masters", // Replace with the actual collection name
              localField: "rack_id",
              foreignField: "rack_id",
              as: "rack_counts",
            },
          },
          {
            $lookup: {
              from: "masters", // Replace with the actual collection name
              localField: "rack_id",
              foreignField: "temp_rack",
              as: "upcoming_tray_count",
            },
          },
          {
            $project: {
              _id: 1,
              rack_id: 1,
              name: 1,
              display: 1,
              limit: 1,
              warehouse: 1,
              parent_id: 1,
              // Other fields you want to include
              rack_count: { $size: "$rack_counts" },
              upcoming_tray_count: { $size: "$upcoming_tray_count" },
            },
          },
          { $sort: { rack_id: 1 } },
        ];
        const rackCounts = await trayRack.aggregate(aggregatePipeline);

        resolve(rackCounts);
      } catch (error) {
        reject(error);
      }
    });
  },
  /*-----------------------------------------RACK REPORT -------------------------------------*/

  trayRackReport: () => {
    return new Promise(async (resolve, reject) => {
      try {
        const aggregatePipeline = [
          {
            $lookup: {
              from: "masters", // Replace with the actual collection name
              localField: "rack_id",
              foreignField: "rack_id",
              as: "rack_counts",
            },
          },
          {
            $lookup: {
              from: "masters", // Replace with the actual collection name
              localField: "rack_id",
              foreignField: "temp_rack",
              as: "upcoming_tray_count",
            },
          },
          {
            $project: {
              _id: 1,
              rack_id: 1,
              name: 1,
              display: 1,
              limit: 1,
              warehouse: 1,
              parent_id: 1,
              // Other fields you want to include
              rack_count: { $size: "$rack_counts" },
              upcoming_tray_count: { $size: "$upcoming_tray_count" },
            },
          },
          { $sort: { rack_id: 1 } },
        ];
        const rackCounts = await trayRack.aggregate(aggregatePipeline);
        for (let x of rackCounts) {
          let checkLastActionData = await unitsActionLog
            .findOne({ rack_id: x.rack_id })
            .sort({ _id: -1 });
          let getAllReport = await masters.aggregate([
            {
              $match: {
                rack_id: x.rack_id,
              },
            },
            {
              $group: {
                _id: "$type_taxanomy", // Group by the "type_taxanomy" field
                count: { $sum: 1 }, // Count the number of documents in each group
              },
            },
          ]);
          if (checkLastActionData) {
            x["last_modified_time"] = checkLastActionData.created_at;
            x["lat_modified_username"] =
              checkLastActionData.user_name_of_action;
          }
          x["BOT"] = 0;
          x["PMT"] = 0;
          x["MMT"] = 0;
          x["CT"] = 0;
          x["ST"] = 0;
          x["WHT"] = 0;
          x["SPT"] = 0;
          x["RPT"] = 0;
          x["RPA"] = 0;
          x["RPB"] = 0;

          for (let y of getAllReport) {
            x[y._id] = y.count;
          }
        }

        resolve(rackCounts);
      } catch (error) {
        reject(error);
      }
    });
  },
  /*-------------------------------VIEW TRAY BASED ON THE RACK ----------------------------------------*/
  getTrayBasedOnTheRack: async (rackId) => {
    try {
      const data = await masters.aggregate([
        {
          $match: {
            rack_id: rackId,
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
            tray_grade: 1,
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
      if (data.length !== 0) {
        for (let x of data) {
          let checkLastAction = await unitsActionLog
            .findOne({ tray_id: x.code, track_tray: "Tray" })
            .sort({ _id: -1 });
          if (checkLastAction) {
            x["last_action_user"] = checkLastAction.user_name_of_action;
            x["last_action_time"] = checkLastAction.created_at;
          }
        }
        return data;
      } else {
        return data;
      }
    } catch (error) {
      return error;
    }
  },
  // VIEW TRAY WITHOUT RACK
  getTrayWithoutRack: async () => {
    try {
      const data = await masters.aggregate([
        {
          $match: {
            rack_id: null,
            prefix: "tray-master",
            sort_id: { $ne: "No Status" },
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
      return data;
    } catch (error) {
      return error;
    }
  },
  viewUnitsDataRack: async (trayId) => {
    try {
      const data = await masters.findOne({ code: trayId });
      if (data) {
        return { status: 1, trayData: data };
      } else {
        return { status: 2 };
      }
    } catch (error) {
      return error;
    }
  },
  /* -------------------------------------------------UPGRADE REPORT IN SUPER-ADMIN NEW FORMAT---------------------------------------*/
  getUpgradeReportData: async () => {
    try {
      const upgradeReport = await delivery.aggregate([
        {
          $match: {
            "audit_report.stage": "Upgrade",
          },
        },
        {
          $group: {
            _id: {
              item_id: "$item_id",
              audit_recommended_grade: "$audit_report.grade",
            },
            count: { $sum: 1 }, // Count the occurrences of each grade within each item_id
            old_item_details: { $first: "$old_item_details" }, // Include old_item_details in the result
          },
        },
        {
          $group: {
            _id: "$_id.item_id",
            grades: {
              $push: {
                grade: "$_id.audit_recommended_grade",
                count: "$count",
              },
            },
            total: { $sum: "$count" }, // Calculate the total count for each item_id
            old_item_details: { $first: "$old_item_details" }, // Include old_item_details in the result
          },
        },
      ]);

      for (let main of upgradeReport) {
        for (let sub of main.grades) {
          main[sub.grade] = sub.count;
        }
      }
      return upgradeReport;
    } catch (error) {
      return error;
    }
  },
  getUpgradeReportDataViewUic: async (itemId) => {
    try {
      const data = await delivery.find(
        {
          "audit_report.stage": "Upgrade",
          item_id: itemId,
        },
        {
          "uic_code.code": 1,
          old_item_details: 1,
          audit_report: 1,
          audit_done_date: 1,
          rdl_fls_one_report: 1,
          rdl_fls_one_user_name: 1,
          rdl_fls_closed_date: 1,
          audit_user_name: 1,
        }
      );
      let arr = [];
      for (let x of data) {
        // console.log(x.uic_code.code);
        let findTray = await masters.findOne(
          {
            "items.uic": x.uic_code.code,
            prefix: "tray-master",
            type_taxanomy: { $nin: ["SPT"] },
          },
          { code: 1, sort_id: 1 }
        );
        let obj = {
          uic_code: x?.uic_code,
          old_item_details: x?.old_item_details,
          audit_report: x?.audit_report,
          audit_done_date: x?.audit_done_date,
          rdl_fls_one_report: x?.rdl_fls_one_report,
          rdl_fls_one_user_name: x?.rdl_fls_one_user_name,
          rdl_fls_closed_date: x?.rdl_fls_closed_date,
          audit_user_name: x?.audit_user_name,
        };
        if (findTray) {
          obj["current_tray_id"] = findTray.code;
          obj["current_tray_status"] = findTray.sort_id;
        } else {
          obj["current_tray_id"] = "";
          obj["current_tray_status"] = "";
        }
        arr.push(obj);
      }
      return arr;
    } catch (error) {
      return error;
    }
  },
  /*--------------------GET RACK BASED ON THE LIMIT AND WAREHOUSE---------------------------*/
  getRackBasedOnTheWarehouse: (warehouse) => {
    return new Promise(async (resolve, reject) => {
      let arr = [];
      const rackIdData = await trayRack.find({ warehouse: warehouse });

      for (let x of rackIdData) {
        const countOfCurrent = await masters.count({
          rack_id: x.rack_id,
        });
        const countOfUpComing = await masters.count({
          temp_rack: x.rack_id,
        });
        // console.log("Upcoming",countOfUpComing,"current count",countOfCurrent);
        if (x.limit > countOfCurrent + countOfUpComing) {
          let obj = {
            rack_id: x.rack_id,
            display: x.display,
            current_tray_count: countOfCurrent,
            upcoming_tray_count: countOfUpComing,
            avl_spc: x.limit - Number(countOfCurrent + countOfUpComing),
          };
          // x["current_tray_count"]=countOfCurrent
          // x["upcoming_tray_count"]=countOfUpComing
          // x['avl_spc']= x.limit - (Number(countOfCurrent + countOfUpComing))
          arr.push(obj);
        }
      }
      resolve(arr);
    });
  },
  createTrayRacks: (trayracksData) => {
    return new Promise(async (resolve, reject) => {
      const checkAlready = await trayRack.findOne({
        $or: [{ rack_id: trayracksData.rack_id }, { name: trayracksData.name }],
      });
      if (checkAlready) {
        resolve({ status: 2 });
      } else {
        // trayracksData.creation_date = Date.now();
        const rackdata = await trayRack.create(trayracksData);
        if (rackdata) {
          resolve({ status: 1 });
        } else {
          resolve({ status: 3 });
        }
      }
    });
  },
  editTrayRacks: (trayracksData) => {
    return new Promise(async (resolve, reject) => {
      let checkRack = await masters.aggregate([
        { $match: { rack_id: trayracksData.rack_id } },
        {
          $lookup: {
            from: "masters", // Replace with the actual collection name
            localField: "rack_id",
            foreignField: "rack_id",
            as: "rack_counts",
          },
        },
        {
          $project: {
            rack_count: { $size: "$rack_counts" },
          },
        },
      ]);
      if (Number(checkRack?.[0]?.rack_count) > Number(trayracksData.limit)) {
        resolve({ status: 3 });
      } else {
        const updatetrayracks = await trayRack.findOneAndUpdate(
          {
            rack_id: trayracksData.rack_id,
          },
          {
            $set: {
              name: trayracksData.name,
              display: trayracksData.display,
              parent_id: trayracksData.parent_id,
              warehouse: trayracksData.warehouse,
              limit: trayracksData.limit,
            },
          }
        );
        if (updatetrayracks) {
          resolve({ status: 1 });
        } else {
          resolve({ status: 2 });
        }
      }
    });
  },
  getOneTrayRack: (rack_id) => {
    return new Promise(async (resolve, reject) => {
      // const checkPosForedit = await masters.findOne({
      //   $or: [{ rack_id: rack_id }, { temp_rack: rack_id }],
      // });
      // if (checkPosForedit) {
      //   resolve({ status: 3 });
      // } else {
      const getOneTrayRack = await trayRack.findOne({ rack_id: rack_id });
      if (getOneTrayRack) {
        resolve({ status: 1, data: getOneTrayRack });
      } else {
        resolve({ status: 2 });
      }
      // }
    });
  },

  /*--------------------------------FIND Rack ID-----------------------------------*/

  getRackID: () => {
    return new Promise(async (resolve, reject) => {
      let allRacksid = await trayRack.find();
      resolve(allRacksid);
    });
  },

  deleteBoxes: (box_id) => {
    return new Promise(async (resolve, reject) => {
      let data = await box.deleteOne({ box_id: box_id });
      if (data) {
        resolve({ status: true });
      } else {
        resolve({ status: false });
      }
    });
  },
  geteditBoxes: (box_id) => {
    return new Promise(async (resolve, reject) => {
      let data = await box.findOne({ box_id: box_id });
      if (data) {
        resolve({ status: true });
      } else {
        resolve({ status: false });
      }
    });
  },
  getAllBoxes: () => {
    return new Promise(async (resolve, reject) => {
      const data = await box.find();
      resolve(data);
    });
  },
  createBoxes: (boxesData) => {
    return new Promise(async (resolve, reject) => {
      const checkAlready = await box.findOne({
        $or: [{ box_id: boxesData.box_id }, { name: boxesData.name }],
      });
      if (checkAlready) {
        resolve({ status: 2 });
      } else {
        const boxdata = await box.create(boxesData);
        if (boxdata) {
          resolve({ status: 1 });
        } else {
          resolve({ status: 3 });
        }
      }
    });
  },
  editBoxes: (boxesData) => {
    return new Promise(async (resolve, reject) => {
      const updateboxes = await box.findOneAndUpdate(
        {
          box_id: boxesData.box_id,
        },
        {
          $set: {
            name: boxesData.name,
            display: boxesData.display,
            description: boxesData.description,
          },
        }
      );
      if (updateboxes) {
        resolve({ status: 1 });
      } else {
        resolve({ status: 2 });
      }
    });
  },
  getOneBox: (box_id) => {
    return new Promise(async (resolve, reject) => {
      const getOneBox = await box.findOne({ box_id: box_id });
      if (getOneBox) {
        resolve({ status: 1, data: getOneBox });
      } else {
        resolve({ status: 2 });
      }
    });
  },

  /*--------------------------------FIND Box ID-----------------------------------*/

  getBoxID: () => {
    return new Promise(async (resolve, reject) => {
      let allBoxesid = await box.find();
      resolve(allBoxesid);
    });
  },

  getAllPayments: () => {
    return new Promise(async (resolve, reject) => {
      const data = await payment.find();
      resolve(data);
    });
  },

  createPayment: (paymentsData) => {
    return new Promise(async (resolve, reject) => {
      let checkDup = await payment.findOne({
        name: paymentsData.name,
      });
      if (checkDup) {
        resolve({ status: 2 });
      } else {
        paymentsData.created_at = Date.now();
        const data = await payment.create(paymentsData);
        if (data) {
          resolve({ status: 1 });
        } else {
          resolve({ status: 3 });
        }
      }
    });
  },

  editPayment: (paymentsData) => {
    return new Promise(async (resolve, reject) => {
      let checkDup = await payment.findOne({ name: paymentsData.name });
      if (checkDup) {
        resolve({ status: 2 });
      } else {
        const updatepayment = await payment.findOneAndUpdate(
          {
            _id: paymentsData._id,
          },
          {
            $set: {
              name: paymentsData.name,
              description: paymentsData.description,
            },
          }
        );
        if (updatepayment) {
          resolve({ status: 1 });
        } else {
          resolve({ status: 0 });
        }
      }
    });
  },

  geteditPayment: (name) => {
    return new Promise(async (resolve, reject) => {
      let data = await payment.findOne({ name: name });
      if (data) {
        resolve({ status: true });
      } else {
        resolve({ status: false });
      }
    });
  },

  deletePayment: (name) => {
    return new Promise(async (resolve, reject) => {
      let data = await payment.deleteOne({ _id: name });
      if (data) {
        resolve({ status: true });
      } else {
        resolve({ status: false });
      }
    });
  },

  viewPayment: (type) => {
    return new Promise(async (resolve, reject) => {
      if (type == "payment-list") {
        const data = await payment.find({ type: type }).sort({ part_code: 1 });
        resolve(data);
      } else {
        const data = await payment
          .find({ type: type })
          .sort({ name: 1 })
          .collation({ locale: "en_US", numericOrdering: true });
        resolve(data);
      }
    });
  },
  viewOnePayment: (id) => {
    return new Promise(async (resolve, reject) => {
      const getonepayment = await payment.findOne({ _id: id });
      // if (type == "payment-list") {
      if (getonepayment) {
        resolve({ status: 1, data: getonepayment });
      } else {
        resolve({ status: 2 });
      }
      // }
    });
  },

  getAllWarranty: () => {
    return new Promise(async (resolve, reject) => {
      const data = await warranty.find();
      resolve(data);
    });
  },

  createWarranty: (warrantyData) => {
    return new Promise(async (resolve, reject) => {
      let checkDup = await warranty.findOne({
        name: warrantyData.name,
      });
      if (checkDup) {
        resolve({ status: 2 });
      } else {
        warrantyData.created_at = Date.now();
        const data = await warranty.create(warrantyData);
        if (data) {
          resolve({ status: 1 });
        } else {
          resolve({ status: 3 });
        }
      }
    });
  },

  editWarranty: (warrantyData) => {
    return new Promise(async (resolve, reject) => {
      const updatewarranty = await warranty.findOneAndUpdate(
        {
          _id: warrantyData._id,
        },
        {
          $set: {
            name: warrantyData.name,
            description: warrantyData.description,
          },
        }
      );
      if (updatewarranty) {
        resolve({ status: 1 });
      } else {
        resolve({ status: 0 });
      }
    });
  },

  geteditWarranty: (name) => {
    return new Promise(async (resolve, reject) => {
      let data = await warranty.findOne({ name: name });
      if (data) {
        resolve({ status: true });
      } else {
        resolve({ status: false });
      }
    });
  },

  deleteWarranty: (name) => {
    return new Promise(async (resolve, reject) => {
      let data = await warranty.deleteOne({ _id: name });
      if (data) {
        resolve({ status: true });
      } else {
        resolve({ status: false });
      }
    });
  },

  viewWarranty: (type) => {
    return new Promise(async (resolve, reject) => {
      if (type == "warranty-list") {
        const data = await warranty.find({ type: type }).sort({ part_code: 1 });
        resolve(data);
      } else {
        const data = await warranty
          .find({ type: type })
          .sort({ name: 1 })
          .collation({ locale: "en_US", numericOrdering: true });
        resolve(data);
      }
    });
  },
  viewOneWarranty: (id) => {
    return new Promise(async (resolve, reject) => {
      const getonewarranty = await warranty.findOne({ _id: id });

      if (getonewarranty) {
        resolve({ status: 1, data: getonewarranty });
      } else {
        resolve({ status: 2 });
      }
    });
  },

  createPartOrColor: (dataOfPartOrColor) => {
    return new Promise(async (resolve, reject) => {
      let checkDup = await partAndColor.findOne({
        $or: [
          {
            name: dataOfPartOrColor.name,
            type: "color-list",
          },
          {
            name: dataOfPartOrColor.name,
            type: "part-list",
            color: dataOfPartOrColor.color,
          },
        ],

        // muic: dataOfPartOrColor.muic,
      });
      if (checkDup) {
        resolve({ status: 2 });
      } else {
        dataOfPartOrColor.created_at = Date.now();
        const data = await partAndColor.create(dataOfPartOrColor);
        if (data) {
          resolve({ status: 1 });
        } else {
          resolve({ status: 3 });
        }
      }
    });
  },
  viewColorOrPart: (type) => {
    return new Promise(async (resolve, reject) => {
      if (type == "part-list") {
        const data = await partAndColor
          .find({ type: type }, { muic_association: 0 })
          .sort({ part_code: 1 });
        resolve(data);
      } else {
        const data = await partAndColor
          .find({ type: type })
          .sort({ name: 1 })
          .collation({ locale: "en_US", numericOrdering: true });
        resolve(data);
      }
    });
  },
  // VIEW SPARE PART BASED ON THE CATEGORY
  getSparePartViewBasedOnCategory: async () => {
    try {
      const tools = await partAndColor
        .find(
          { sp_category: "Tools", avl_stock: { $gt: Number(0) } },
          { muic_association: 0 }
        )
        .sort({ name: 1 })
        .collation({ locale: "en_US", numericOrdering: true });
      const consumables = await partAndColor
        .find(
          { sp_category: "Consumables", avl_stock: { $gt: Number(0) } },
          { muic_association: 0 }
        )
        .sort({ name: 1 })
        .collation({ locale: "en_US", numericOrdering: true });
      return { tools: tools, consumables: consumables };
    } catch (error) {
      return error;
    }
  },
  createStorage: (dataOfStorage) => {
    return new Promise(async (resolve, reject) => {
      let checkDup = await storagemodel.findOne({
        name: dataOfStorage.name,
      });
      if (checkDup) {
        resolve({ status: 2 });
      } else {
        dataOfStorage.created_at = Date.now();
        const data = await storagemodel.create(dataOfStorage);
        if (data) {
          resolve({ status: 1 });
        } else {
          resolve({ status: 3 });
        }
      }
    });
  },
  viewStorage: () => {
    return new Promise(async (resolve, reject) => {
      const data = await storagemodel.find({});
      resolve(data);
    });
  },
  getStorageDataForEdit: (id) => {
    return new Promise(async (resolve, reject) => {
      const findData = await storagemodel.findOne({ _id: id });
      if (findData) {
        resolve({ storageData: findData, status: 1 });
      } else {
        resolve({ status: 0 });
      }
    });
  },
  editStorage: (dataOfStorage) => {
    return new Promise(async (resolve, reject) => {
      let updateData = await storagemodel.updateOne(
        {
          _id: dataOfStorage._id,
        },
        {
          $set: {
            name: dataOfStorage.name,
            description: dataOfStorage.description,
          },
        }
      );

      if (updateData) {
        resolve({ status: 1 });
      } else {
        resolve({ status: 0 });
      }
    });
  },
  deleteStorage: (id) => {
    return new Promise(async (resolve, reject) => {
      let data = await storagemodel.deleteOne({ _id: id });
      if (data.deletedCount !== 0) {
        resolve({ status: true });
      } else {
        resolve({ status: false });
      }
    });
  },

  createRam: (dataOfRam) => {
    return new Promise(async (resolve, reject) => {
      let checkDup = await rammodel.findOne({
        name: dataOfRam.name,
        type: "ram-list",
      });
      if (checkDup) {
        resolve({ status: 2 });
      } else {
        dataOfRam.created_at = Date.now();
        const data = await rammodel.create(dataOfRam);
        if (data) {
          resolve({ status: 1 });
        } else {
          resolve({ status: 3 });
        }
      }
    });
  },
  viewRam: (type) => {
    return new Promise(async (resolve, reject) => {
      if (type == "ram-list") {
        const data = await rammodel.find({ type: type }).sort({ part_code: 1 });
        resolve(data);
      } else {
        const data = await rammodel
          .find({ type: type })
          .sort({ name: 1 })
          .collation({ locale: "en_US", numericOrdering: true });
        resolve(data);
      }
    });
  },
  getOneRamDataForEdit: (id) => {
    return new Promise(async (resolve, reject) => {
      const data = await rammodel.findOne({ _id: id });
      if (data) {
        resolve({ status: 1, ramData: data });
      } else {
        resolve({ status: 0 });
      }
    });
  },
  editRam: (dataOfRam) => {
    return new Promise(async (resolve, reject) => {
      let updateData = await rammodel.updateOne(
        {
          _id: dataOfRam._id,
        },
        {
          $set: {
            name: dataOfRam.name,
            description: dataOfRam.description,
          },
        }
      );
      if (updateData) {
        resolve({ status: 1 });
      } else {
        resolve({ status: 0 });
      }
    });
  },
  deleteRam: (id) => {
    return new Promise(async (resolve, reject) => {
      try {
        let data = await rammodel.deleteOne({ _id: id });
        if (data.deletedCount !== 0) {
          resolve({ status: true });
        } else {
          resolve({ status: false });
        }
      } catch (error) {
        console.error(error); // Log the error for debugging
        reject(error);
      }
    });
  },

  // deleteStorage: (id, type, page) => {
  //   return new Promise(async (resolve, reject) => {
  //     if (page == "storage-list") {
  //       const activateOrDeactiveate = await storagemodel.findOneAndUpdate(
  //         {
  //           _id: id,
  //         },
  //         {
  //           $set: {
  //             status: type,
  //           },
  //         }
  //       );
  //       if (activateOrDeactiveate) {
  //         resolve({ status: 1 });
  //       } else {
  //         resolve({ status: 2 });
  //       }
  //     } else {
  //       let deleteData = await storagemodel.deleteOne({ _id: id });
  //       if (deleteData.deletedCount !== 0) {
  //         resolve({ status: 1 });
  //       } else {
  //         resolve({ status: 2 });
  //       }
  //     }
  //   });
  // },

  bulkValidationForPartCheck: (partData) => {
    return new Promise(async (resolve, reject) => {
      let err = {};
      let partName = [];
      let color = [];
      let technical_qc = [];
      let sp_category = [];
      let dup = false;
      let i = 0;
      const duplicates = [];

      for (let x of partData) {
        let checkCategory = await spareCategories.findOne({
          category_name: x.sp_category,
        });
        if (checkCategory == null) {
          sp_category.push(x.sp_category);
          err["sp_category_not_exists"] = sp_category;
        }
        if (x.technical_qc !== "Y" && x.technical_qc !== "N") {
          technical_qc.push(x.technical_qc);
          err["technical_qc"] = technical_qc;
        }
        let checkpartIdDup = await partAndColor.findOne({ part_code: x.code });
        if (checkpartIdDup) {
          dup = true;
          break;
        }
        if (x.part_color != "-") {
          let checkName = await partAndColor.findOne({
            name: x.part_name,
            type: "part-list",
            color: x.part_color,
          });
          if (checkName) {
            partName.push(x.code);
            err["duplicate_part_name"] = partName;
          } else {
            if (
              partData.some(
                (data, index) =>
                  data.part_name == x.part_name &&
                  data.part_color == x.part_color &&
                  index != i
              )
            ) {
              partName.push(x.code);
              err["duplicate_part_name"] = x.code;
            }
          }
        }

        if (x.part_color !== undefined && x.part_color !== "") {
          let checkColor = await partAndColor.findOne({
            name: x.part_color,
            type: "color-list",
          });

          if (checkColor == null) {
            color.push(x.part_color);
            err["duplicate_color"] = color;
          }
        }
        i++;
      }
      if (Object.keys(err).length === 0) {
        resolve({ status: true, dupId: dup });
      } else {
        resolve({ status: false, err: err, dupId: dup });
      }
    });
  },
  bulkAddPart: (partData) => {
    return new Promise(async (resolve, reject) => {
      const newArrayOfObj = partData.map(
        ({
          part_name: name,
          part_color: color,
          technical_qc: technical_qc,
          description: description,
          code: part_code,
          created_by: created_by,
          sp_category: sp_category,
          created_at: created_at,
          ...rest
        }) => ({
          name,
          color,
          part_code,
          technical_qc,
          description,
          created_by,
          sp_category,
          created_at,
          ...rest,
        })
      );
      let data = await partAndColor.create(newArrayOfObj);
      if (data) {
        resolve({ status: true });
      } else {
        resolve({ status: false });
      }
    });
  },
  getMuic: () => {
    return new Promise(async (resolve, reject) => {
      const muicData = await products.find({}, { muic: 1 }).sort({ muic: 1 });
      resolve(muicData);
    });
  },
  getColorAccordingMuic: (muic, page) => {
    return new Promise(async (resolve, reject) => {
      const colorData = await partAndColor.find({
        muic: muic,
        type: "color-list",
      });
      resolve(colorData);
    });
  },
  muicGetParts: (muic) => {
    return new Promise(async (resolve, reject) => {
      let data = await products.aggregate([
        { $match: { muic: muic } },
        {
          $lookup: {
            from: "partandcolors",
            localField: `muic`,
            foreignField: "muic_association.muic",
            as: "parts",
          },
        },
      ]);
      if (data.length == 0) {
        resolve({ status: false, data: data });
      } else {
        resolve({ status: true, data: data });
      }
    });
  },
  partListMuicColor: (muic, color) => {
    return new Promise(async (resolve, reject) => {
      const data = await partAndColor.find({
        type: "part-list",
        muic: muic,
        color: color,
      });
      resolve(data);
    });
  },
  viewOneData: (id, type, actionType) => {
    return new Promise(async (resolve, reject) => {
      let findData = await partAndColor.findOne({ _id: id });
      if (findData) {
        if (type == "part-list") {
          let checkUsed = await delivery.findOne({
            "rdl_fls_one_report.partRequired": {
              $elemMatch: { part_name: findData.name },
            },
          });
          if (checkUsed) {
            if (actionType == "Edit") {
              resolve({ status: 4, masterData: findData });
            } else {
              resolve({ status: 3 });
            }
          } else {
            resolve({ status: 1, masterData: findData });
          }
        } else {
          let checkUsed = await delivery.findOne({
            "rdl_fls_one_report.color": findData.name,
          });
          if (checkUsed) {
            resolve({ status: 3 });
          } else {
            let checkInPart = await partAndColor.findOne({
              type: "part-list",
              color: findData.name,
            });
            if (checkInPart) {
              resolve({ status: 3 });
            } else {
              resolve({ status: 1, masterData: findData });
            }
          }
        }
      }
    });
  },
  onePartDatWithMuicAssosiation: (id, type) => {
    return new Promise(async (resolve, reject) => {
      const getOnePart = await partAndColor.findOne({ part_code: id });
      if (getOnePart) {
        resolve({ status: 1, masterData: getOnePart });
      }
    });
  },
  updateElasticSearch: () => {
    return new Promise(async (resolve, reject) => {
      let lastUpdateData = await delivery
        .find({}, { _id: 0 })
        .sort({ updated_at: -1 })
        .limit(500);
      for (let x of lastUpdateData) {
        let update = await elasticsearch.uicCodeGen(x);
      }
      resolve({ status: 1 });
    });
  },
  muicAssositaionBulkValidation: (validationData) => {
    return new Promise(async (resolve, reject) => {
      let arr = [];
      let DupFindObj = {};
      let obj = {};
      let flag1 = false;
      let flag2 = false;
      let flag3 = false;
      let flag4 = false;
      const muicArr = validationData.muic.split(",");
      let validateObj = {
        total: muicArr.length,
        success: 0,
        duplicate: 0,
        inValid: 0,
        AlreadyAdded: 0,
      };
      for (let x of muicArr) {
        const checkValidMuic = await products.findOne({ muic: x });
        DupFindObj[x] = (DupFindObj[x] || 0) + 1;
        if (checkValidMuic) {
          let checkInAlready = await partAndColor.findOne({
            part_code: validationData.part_code,
            "muic_association.muic": x,
          });
          if (checkInAlready) {
            (obj.muic = checkValidMuic.muic),
              (obj.brand = checkValidMuic.brand_name),
              (obj.model = checkValidMuic.model_name),
              (obj.validationStatus = "Already Added");
            flag1 = true;
            validateObj.AlreadyAdded++;
          } else {
            (obj.muic = checkValidMuic.muic),
              (obj.brand = checkValidMuic.brand_name),
              (obj.model = checkValidMuic.model_name),
              (obj.validationStatus = "Success");
            validateObj.success++;
          }
          flag2 = false;
          if (DupFindObj[x] === 2) {
            flag4 = true;
            obj.validationStatus = "Duplicate";
            validateObj.duplicate++;
          }
          arr.push(obj);
        } else {
          flag3 = true;
          (obj.muic = checkValidMuic?.muic),
            (obj.brand = checkValidMuic?.brand_name),
            (obj.model = checkValidMuic?.model_name),
            (obj.validationStatus = "Invalid Muic"),
            validateObj.inValid++;
          arr.push(obj);
        }
        obj = {};
      }

      if (flag1 == true || flag2 == true || flag3 == true || flag4 == true) {
        resolve({ status: false, arr: arr, validateObj: validateObj });
      } else {
        resolve({ status: true, arr: arr, validateObj: validateObj });
      }
      resolve;
    });
  },
  muicPageAddPartAssosiation: (validationData) => {
    return new Promise(async (resolve, reject) => {
      let arr = [];
      let DupFindObj = {};
      let obj = {};
      let flag1 = false;
      let flag2 = false;
      let flag3 = false;
      let flag4 = false;
      const partArr = validationData.partId.split(",");
      let validateObj = {
        total: partArr.length,
        success: 0,
        duplicate: 0,
        inValid: 0,
        AlreadyAdded: 0,
      };
      for (let x of partArr) {
        const checkPart = await partAndColor.findOne({ part_code: x });
        DupFindObj[x] = (DupFindObj[x] || 0) + 1;
        if (checkPart) {
          let checkInAlready = await partAndColor.findOne({
            part_code: x,
            "muic_association.muic": validationData.muic,
          });
          if (checkInAlready) {
            (obj.part_code = x),
              (obj.name = checkPart.name),
              (obj.technical_qc = checkPart.technical_qc),
              (obj.avl_stock = checkPart.avl_stock),
              (obj.color = checkPart.color);
            obj.created_at = checkPart.created_at;
            obj.status = checkPart.status;
            obj.description = checkPart.description;
            obj.validationStatus = "Already Added";

            flag1 = true;
            validateObj.AlreadyAdded++;
          } else {
            (obj.part_code = x),
              (obj.name = checkPart.name),
              (obj.technical_qc = checkPart.technical_qc),
              (obj.avl_stock = checkPart.avl_stock),
              (obj.color = checkPart.color);
            obj.created_at = checkPart?.created_at;
            obj.status = checkPart.status;
            obj.description = checkPart.description;
            obj.validationStatus = "Success";
            validateObj.success++;
          }
          flag2 = false;
          if (DupFindObj[x] === 2) {
            flag4 = true;
            obj.validationStatus = "Duplicate";
            validateObj.duplicate++;
          }
          arr.push(obj);
        } else {
          flag3 = true;
          (obj.name = checkPart?.name),
            (obj.part_code = x),
            (obj.technical_qc = checkPart?.technical_qc),
            (obj.avl_stock = checkPart?.avl_stock),
            (obj.color = checkPart?.color);
          obj.created_at = checkPart?.created_at;
          obj.status = checkPart?.status;
          obj.description = checkPart?.description;
          obj.validationStatus = "Invalid PartId";

          validateObj.inValid++;
          arr.push(obj);
        }
        obj = {};
      }

      if (flag1 == true || flag2 == true || flag3 == true || flag4 == true) {
        resolve({ status: false, arr: arr, validateObj: validateObj });
      } else {
        resolve({ status: true, arr: arr, validateObj: validateObj });
      }
      resolve;
    });
  },
  muicPageAddPart: (dataofPart) => {
    return new Promise(async (resolve, reject) => {
      let updateAssosiation;
      for (let x of dataofPart.part) {
        if (x.validationStatus == "Success") {
          let obj = {
            muic: dataofPart.muicData.muic,
            brand: dataofPart.muicData.brand_name,
            model: dataofPart.muicData.model_name,
          };
          updateAssosiation = await partAndColor.findOneAndUpdate(
            {
              part_code: x.part_code,
            },
            {
              $push: {
                muic_association: obj,
              },
            }
          );
          obj = {};
        }
      }
      resolve({ status: true });
    });
  },
  muicAssosiationAdd: (muicData) => {
    return new Promise(async (resolve, reject) => {
      for (let x of muicData.muic) {
        if (x.validationStatus == "Success") {
          let updateAssosiation = await partAndColor.findOneAndUpdate(
            {
              part_code: muicData.part_code,
            },
            {
              $push: {
                muic_association: x,
              },
            }
          );
        }
      }
      resolve({ status: true });
    });
  },
  muicAssosiationRemove: (muicData) => {
    return new Promise(async (resolve, reject) => {
      const muicDataRemove = await partAndColor.findOneAndUpdate(
        {
          part_code: muicData.part_code,
        },
        {
          $pull: {
            muic_association: {
              muic: muicData.muic,
            },
          },
        }
      );
      if (muicDataRemove) {
        resolve({ status: true });
      } else {
        resolve({ status: false });
      }
    });
  },

  getAllVendor: () => {
    return new Promise(async (resolve, reject) => {
      const data = await vendorMaster.find();
      resolve(data);
    });
  },
  createVendor: (vendorData) => {
    return new Promise(async (resolve, reject) => {
      const checkAlready = await vendorMaster.findOne({
        $or: [{ vendor_id: vendorData.vendor_id }, { name: vendorData.name }],
      });
      if (checkAlready) {
        resolve({ status: 2 });
      } else {
        const addVendor = await vendorMaster.create(vendorData);
        if (addVendor) {
          resolve({ status: 1 });
        } else {
          resolve({ status: 3 });
        }
      }
    });
  },
  editVendor: (vendorData) => {
    return new Promise(async (resolve, reject) => {
      const updateVendor = await vendorMaster.findOneAndUpdate(
        {
          vendor_id: vendorData.vendor_id,
        },
        {
          $set: {
            name: vendorData.name,
            address: vendorData.address,
            city: vendorData.city,
            state: vendorData.state,
            mobile_one: vendorData.mobile_one,
            mobile_two: vendorData.mobile_two,
            deals: vendorData.deals,
            reference: vendorData.reference,
            location: vendorData.location,
          },
        }
      );
      if (updateVendor) {
        resolve({ status: 1 });
      } else {
        resolve({ status: 2 });
      }
    });
  },
  vendorStatusChange: (vendorData) => {
    return new Promise(async (resolve, reject) => {
      const update = await vendorMaster.findOneAndUpdate(
        {
          vendor_id: vendorData.id,
        },
        {
          $set: {
            status: vendorData.type,
          },
        }
      );
      if (update) {
        resolve({ status: 1 });
      } else {
        resolve({ status: 2 });
      }
    });
  },
  getOneVendor: (vendor_id) => {
    return new Promise(async (resolve, reject) => {
      const getoneVendor = await vendorMaster.findOne({ vendor_id: vendor_id });
      if (getoneVendor) {
        resolve({ status: 1, data: getoneVendor });
      } else {
        resolve({ status: 2 });
      }
    });
  },

  editPartOrColor: (dataOfPartorColor) => {
    return new Promise(async (resolve, reject) => {
      let updateData = await partAndColor.findOneAndUpdate(
        { _id: dataOfPartorColor._id },
        {
          $set: {
            name: dataOfPartorColor.name,
            muic: dataOfPartorColor.muic,
            description: dataOfPartorColor.description,
            color: dataOfPartorColor?.color,
            technical_qc: dataOfPartorColor?.technical_qc,
            sp_category: dataOfPartorColor.sp_category,
            box_id: dataOfPartorColor.box_id,
          },
        }
      );
      if (updateData) {
        if (updateData.box_id !== dataOfPartorColor.box_id) {
          await partInventoryLedger.create({
            department: "Super-admin",
            action: "Edit",
            action_done_user: dataOfPartorColor.actionUser,
            description: `Box Id Edited by:${dataOfPartorColor.actionUser}`,
            part_code: dataOfPartorColor.part_code,
            box_id: dataOfPartorColor.box_id,
          });
        }
        resolve({ status: 1 });
      } else {
        resolve({ status: 0 });
      }
    });
  },

  partListManageBulkValidation: (dataofPartStock) => {
    return new Promise(async (resolve, reject) => {
      let err = {};
      let partId = [];
      let updateStock = [];
      let dupPartId = [];
      let i = 0;
      for (let x of dataofPartStock) {
        let checkPartId = await partAndColor.findOne({
          part_code: x.part_code,
        });

        if (checkPartId == null) {
          partId.push(x.part_code);
          err["part_code_not_exists"] = partId;
        } else {
          if (
            dataofPartStock.some(
              (data, index) => data.part_code == x.part_code && index != i
            )
          ) {
            dupPartId.push(x.part_code);
            err["duplicate_part_code"] = dupPartId;
          }
        }
        if (partId.length == 0) {
          const addStockValue = parseFloat(x.add_stock);
          if (addStockValue > 0 || isNaN(addStockValue)) {
          } else {
            let check = checkPartId.avl_stock - Math.abs(x.add_stock);
            if (check < 0) {
              updateStock.push(x.add_stock?.toString());
              err["update_stock_check"] = updateStock;
            }
          }
        }
        // let number = parseFloat(x.add_stock);
        if (isNaN(x.add_stock)) {
          updateStock.push(x.add_stock);
          err["update_stock_check"] = updateStock;
        }
        i++;
      }
      if (Object.keys(err).length === 0) {
        resolve({ status: true });
      } else {
        resolve({ status: false, err: err });
      }
    });
  },
  partlistManageStockUpdate: (partStockData, username) => {
    return new Promise(async (resolve, reject) => {
      for (let x of partStockData) {
        let updateStock;
        let number = parseInt(x.add_stock);
        if (number >= "0") {
          updateStock = await partAndColor.findOneAndUpdate(
            { part_code: x.part_code },
            {
              $inc: {
                avl_stock: parseInt(x.add_stock),
              },
            },
            { new: true }
          );
        } else {
          updateStock = await partAndColor.findOneAndUpdate(
            { part_code: x.part_code },
            {
              $inc: {
                avl_stock: parseInt(x.add_stock),
              },
            },
            { new: true }
          );
        }
        if (updateStock) {
          await partInventoryLedger.create({
            department: "Super-admin",
            in_stock: x.add_stock,
            action: "Stock Update",
            action_done_user: username,
            part_code: x.part_code,
            avl_stock: Number(updateStock?.avl_stock),
            description: `Stock updated by:${username}`,
          });
        }
      }
      resolve({ status: true, count: partStockData.length });
    });
  },
  checkTrayStatus: (trayData) => {
    return new Promise(async (resolve, reject) => {
      for (let x of trayData.ischeck) {
        const tray = await masters.findOne({ code: x });
        if (tray.sort_id != trayData.status) {
          resolve({ status: 2 });
          break;
        }
      }
      resolve({ status: 1 });
    });
  },
  getAssignedTray: (trayType, sort_id) => {
    return new Promise(async (resolve, reject) => {
      if (sort_id == "Ctx to Stx Send for Sorting") {
        const res = await masters
          .aggregate([
            {
              $match: {
                type_taxanomy: { $in: ["CT", "ST"] },
                to_merge: { $ne: null },
                sort_id: sort_id,
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
          ])
          .catch((err) => reject(err));
        resolve(res);
      } else if (sort_id == "Pickup Request sent to Warehouse") {
        const res = await masters
          .aggregate([
            {
              $match: {
                prefix: "tray-master",
                sort_id: sort_id,
                to_tray_for_pickup: { $ne: null },
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
          ])
          .catch((err) => reject(err));
        resolve(res);
      } else {
        const res = await masters
          .aggregate([
            { $match: { type_taxanomy: trayType, sort_id: sort_id } },
            {
              $lookup: {
                from: "trayracks",
                localField: "rack_id",
                foreignField: "rack_id",
                as: "rackDetails",
              },
            },
          ])
          .catch((err) => reject(err));
        resolve(res);
      }
    });
  },
  reassignForMerge: (sortingAgent, fromTray, toTray) => {
    return new Promise(async (resolve, reject) => {
      let updateFromTray = await masters.updateOne(
        { code: fromTray },
        {
          $set: {
            status_change_time: Date.now(),
            issued_user_name: sortingAgent,
            actual_items: [],
          },
        }
      );
      if (updateFromTray.modifiedCount !== 0) {
        let updateToTray = await masters.updateOne(
          { code: toTray },
          {
            $set: {
              status_change_time: Date.now(),
              issued_user_name: sortingAgent,
              from_merge: fromTray,
              to_merge: null,
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
    });
  },
  bagAssignedToBot: () => {
    return new Promise(async (resolve, reject) => {
      const bag = await masters
        .find({ prefix: "bag-master", sort_id: "Requested to Warehouse" })
        .catch((err) => reject(err));
      resolve(bag);
    });
  },
  getAssignedTrayForSortingBotToWht: () => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.aggregate([
        {
          $match: {
            $or: [
              {
                sort_id: "Sorting Request Sent To Warehouse",
                // type_taxanomy: "BOT",
              },
              {
                sort_id: "Assigned to sorting agent",
                // type_taxanomy: "BOT",
              },
            ],
          },
        },
        {
          $group: {
            _id: "$issued_user_name",
            tray: {
              $push: "$$ROOT",
            },
          },
        },
      ]);
      for (let y of data) {
        y.tray[0].botTray = [];
        y.tray[0].WhtTray = [];
        for (let x of y.tray) {
          if (x.type_taxanomy == "BOT") {
            y.tray[0].botTray.push(x.code);
          } else if (x.type_taxanomy == "WHT") {
            y.tray[0].WhtTray.push(x.code);
          }
        }
      }
      if (data) {
        resolve(data);
      }
    });
  },
  getUnVerifiedImeiUpdationScreen: (limit, skip) => {
    return new Promise(async (resolve, reject) => {
      const findUnverifiedImei = await delivery.find({
        unverified_imei_status: "Unverified",
      });

      resolve({ unverifiedImei: findUnverifiedImei });
    });
  },
  unVerifiedReportItemFilter: (fromDate, toDate, limit, skip, type) => {
    return new Promise(async (resolve, reject) => {
      let monthWiseReport, getCount, forXlsxDownload;
      if (type == "Order Date") {
        const fromDateTimestamp = Date.parse(fromDate);
        const toDateTimestamp = Date.parse(toDate);
        let monthWiseReport = await orders.aggregate([
          {
            $match: {
              delivery_status: "Delivered",
              imei_verification_status: "Unverified",
              order_date: {
                $gte: new Date(fromDateTimestamp),
                $lte: new Date(toDateTimestamp),
              },
            },
          },
          {
            $lookup: {
              from: "deliveries",
              localField: "order_id",
              foreignField: "order_id",
              as: "delivery",
            },
          },
          {
            $facet: {
              results: [{ $skip: skip }, { $limit: limit }],
              count: [{ $count: "count" }],
            },
          },
        ]);

        let forXlsxDownload = await orders.aggregate([
          {
            $match: {
              delivery_status: "Delivered",
              imei_verification_status: "Unverified",
              order_date: {
                $gte: new Date(fromDateTimestamp),
                $lte: new Date(toDateTimestamp),
              },
            },
          },
          {
            $lookup: {
              from: "deliveries",
              localField: "order_id",
              foreignField: "order_id",
              as: "delivery",
            },
          },
        ]);
        let arrLimit = [];
        for (let x of monthWiseReport?.[0].results) {
          arrLimit.push(...x.delivery);
        }
        let arrWithoutLimit = [];
        for (let y of forXlsxDownload) {
          arrWithoutLimit.push(...y.delivery);
        }
        resolve({
          getCount: arrWithoutLimit.length,
          monthWiseReport: arrLimit,
          forXlsxDownload: arrWithoutLimit,
        });
      } else {
        const fromDateISO = new Date(fromDate).toISOString();
        const toDateISO = new Date(toDate).toISOString();
        monthWiseReport = await delivery
          .find({
            unverified_imei_status: "Unverified",
            delivery_date: { $gte: fromDateISO, $lte: toDateISO },
          })
          .limit(limit)
          .skip(skip);
        getCount = await delivery.count({
          unverified_imei_status: "Unverified",
          delivery_date: { $gte: fromDateISO, $lte: toDateISO },
        });
        forXlsxDownload = await delivery.find({
          unverified_imei_status: "Unverified",
          delivery_date: { $gte: fromDateISO, $lte: toDateISO },
        });
      }
      resolve({
        monthWiseReport: monthWiseReport,
        forXlsxDownload: forXlsxDownload,
        getCount: getCount,
      });
    });
  },
  /* --------------------------------------------UPDATE IMEI NUMBER -------------------------------*/
  updateUnverifiedImei: (imeiData) => {
    return new Promise(async (resolve, reject) => {
      let status = "Unverified";
      if (
        imeiData?.delivery_imei?.match(/[0-9]/g)?.join("") ==
          imeiData?.bqc_ro_ril_imei ||
        imeiData?.delivery_imei?.match(/[0-9]/g)?.join("") ==
          imeiData?.bqc_ro_mob_one_imei ||
        imeiData?.delivery_imei?.match(/[0-9]/g)?.join("") ==
          imeiData?.bqc_ro_mob_two_imei
      ) {
        status = "Verified";
      }
      const updateData = await delivery.updateOne(
        { "uic_code.code": imeiData.uic },
        {
          $set: {
            "bqc_software_report._ro_ril_miui_imei0": imeiData.bqc_ro_ril_imei,
            "bqc_software_report.mobile_imei": imeiData.bqc_ro_mob_one_imei,
            "bqc_software_report.mobile_imei2": imeiData.bqc_ro_mob_two_imei,
            unverified_imei_status: status,
          },
        }
      );
      if (updateData.modifiedCount !== 0) {
        if (status == "Verified") {
          resolve({ status: 1 });
        } else {
          resolve({ status: 2 });
        }
      } else {
        resolve({ status: 0 });
      }
    });
  },
  globeRemoveDuplicate: async (trayId, id, arrayType) => {
    try {
      let remove;
      id = mongoose.Types.ObjectId(id);
      if (arrayType == "Main") {
        remove = await masters.updateOne(
          { code: trayId },
          {
            $pull: {
              items: { _id: id },
            },
          }
        );
      } else if (arrayType == "Second-main") {
        remove = await masters.updateOne(
          { code: trayId },
          {
            $pull: {
              actual_items: { _id: id },
            },
          },
          { multi: false } // This ensures only one match is removed
        );
      } else {
        remove = await masters.updateOne(
          { code: trayId },
          {
            $pull: {
              temp_array: { _id: id },
            },
          }
        );
      }
      if (remove.modifiedCount !== 0) {
        return { status: 1 };
      } else {
        return { status: 0 };
      }
    } catch (error) {
      console.error(error);
      return error;
    }
  },
  /*---------------------------------------SUB MUIC --------------------------------------------*/
  getSubMuic: async () => {
    try {
      const fetchSubMuic = await subMuic.aggregate([
        { $match: {} },
        {
          $lookup: {
            from: "products",
            foreignField: "muic",
            localField: "muic",
            as: "product",
          },
        },
      ]);
      return fetchSubMuic;
    } catch (error) {
      return error;
    }
  },
  getAssignedTrayForMerging: () => {
    return new Promise(async (resolve, reject) => {
      const tray = await masters
        .aggregate([
          {
            $match: {
              $or: [
                {
                  sort_id: "Merge Request Sent To Wharehouse",
                  to_merge: { $ne: null },
                },
                {
                  sort_id: "Audit Done Merge Request Sent To Wharehouse",
                  to_merge: { $ne: null },
                },
                {
                  sort_id: "Ready to BQC Merge Request Sent To Wharehouse",
                  to_merge: { $ne: null },
                },
                {
                  sort_id: "Ready to RDL-2 Merge Request Sent To Wharehouse",
                  to_merge: { $ne: null },
                },
                {
                  sort_id: "Ready to Audit Merge Request Sent To Wharehouse",
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
              as: "rackDetails",
            },
          },
        ])
        .catch((err) => reject(err));
      resolve(tray);
    });
  },
  deletePartOrColor: (id, type, page) => {
    return new Promise(async (resolve, reject) => {
      if (page == "part-list") {
        const activateOrDeactiveate = await partAndColor.findOneAndUpdate(
          {
            _id: id,
          },
          {
            $set: {
              status: type,
            },
          }
        );
        if (activateOrDeactiveate) {
          resolve({ status: 1 });
        } else {
          resolve({ status: 2 });
        }
      } else {
        let deleteData = await partAndColor.deleteOne({ _id: id });
        if (deleteData.deletedCount !== 0) {
          resolve({ status: 1 });
        } else {
          resolve({ status: 2 });
        }
      }
    });
  },
  openPacketDataFetch: () => {
    return new Promise(async (resolve, reject) => {
      const today = new Date();
      const oneWeekAgo = new Date(today);
      oneWeekAgo.setDate(today.getDate() - 7);
      const dataFetch = await delivery.find(
        {
          created_at: { $gte: oneWeekAgo },
          assign_to_agent: { $exists: true },
        },
        {
          "uic_code.code": 1,
          tracking_id: 1,
          order_id: 1,
          old_item_details: 1,
          imei: 1,
          item_id: 1,
          bot_report: 1,
          tray_type: 1,
          partner_purchase_price: 1,
          order_date: 1,
          partner_shop: 1,
          delivery_date: 1,
          assign_to_agent: 1,
        }
      );
      resolve(dataFetch);
    });
  },
  /*-----------------------------------------GET TRAY FOR REMOVE DUPLICATE UNITS------------------------------*/
  getTrayForRemoveDuplicateUnits: async (trayId) => {
    try {
      const trayData = await masters.findOne({ code: trayId });
      if (trayData) {
        if (trayData.sort_id != "Open") {
          return { trayData: trayData, status: 1 };
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
  // REMOVE DUPLICATE UNITS
  removeDuplicateFromTray: async (expectedSide, actualSide, trayId) => {
    try {
      let flag = true;
      for (let x of expectedSide) {
        const document = await masters.findOne({ code: trayId });
        if (document) {
          const items = document.items;
          const indexToRemove = items.findIndex((item) => item.uic === x);
          if (indexToRemove !== -1) {
            items.splice(indexToRemove, 1);
            removeFromItemsArray = await masters.updateOne(
              { code: trayId },
              {
                $set: {
                  items: items,
                },
              }
            );
          }
        }

        if (removeFromItemsArray.modifiedCount == 0) {
          flag = false;
        }
      }
      for (let y of actualSide) {
        const document = await masters.findOne({ code: trayId });
        if (document) {
          const items = document.actual_items;
          const indexToRemove = items.findIndex((item) => item.uic === y);
          if (indexToRemove !== -1) {
            items.splice(indexToRemove, 1);
            removeFromActualArray = await masters.updateOne(
              { code: trayId },
              {
                $set: {
                  actual_items: items,
                },
              }
            );
          }
        }
        if (removeFromActualArray.modifiedCount == 0) {
          flag = false;
        }
      }
      if (flag) {
        return { status: 1 };
      } else {
        return { status: 0 };
      }
    } catch (error) {
      return error;
    }
  },
  /*-------------------------------------------ONE STEP BACK --------------------------------------------------*/
  oneStepBackUtility: async (trayIds, status, actionDoneBy, currentStatus) => {
    try {
      let flag = 1;
      for (let x of trayIds) {
        let finalStatus = status;
        if (x.tray_status == "Empty") {
          finalStatus = "Open";
        }
        const updateTheTray = await masters.findOneAndUpdate(
          { code: x.code, sort_id: currentStatus },
          {
            $set: {
              sort_id: finalStatus,
              actual_items: [],
              to_tray_for_pickup: null,
              issued_user_name: null,
              temp_array: [],
              wht_tray: [],
              pickup_type: null,
              to_tray_for_pickup: null,
              from_merge: null,
              to_merge: null,
              "items.$.pickup_toTray": null,
            },
          }
        );
        if (updateTheTray) {
          if (updateTheTray.items.length != 0) {
            let state = "Tray";
            for (let tray of updateTheTray.items) {
              await unitsActionLog.create({
                action_type: "One step back utility",
                created_at: Date.now(),
                tray_id: x.code,
                user_name_of_action: actionDoneBy,
                track_tray: state,
                uic: tray.uic,
                user_type: "Super-admin",
                description: `One step back done by the super-admin :${actionDoneBy}`,
              });
              state = "Units";
              await delivery.updateOne(
                { "uic_code.code": tray.uic },
                {
                  $set: {
                    tray_status: status,
                  },
                }
              );
            }
            flag = 1;
          } else {
            await unitsActionLog.create({
              action_type: "One step back utility",
              created_at: Date.now(),
              tray_id: x.code,
              user_name_of_action: actionDoneBy,
              track_tray: state,
              uic: tray.uic,
              user_type: "Super-admin",
              description: `One step back done by the super-admin :${actionDoneBy}`,
            });
            flag = 1;
          }
        } else {
          flag = 2;
        }
      }
      if (flag == 1) {
        return { status: 1 };
      } else {
        return { status: 2 };
      }
    } catch (error) {
      return error;
    }
  },
  /*-----------------------------------------EXTRA------------------------------------------------------------*/
  addCpcType: () => {
    return new Promise(async (resolve, reject) => {
      let findAllUsers = await user.find();
      let updateUserWh;
      for (let x of findAllUsers) {
        if (x.cpc !== "DDPXGGN001") {
          let findLocation = await infra.findOne({
            code: x.cpc,
            type_taxanomy: "CPC",
          });

          let findWarehouse = await infra.findOne({
            type_taxanomy: "Warehouse",
            parent_id: x.cpc,
            warehouse_type: findLocation.location_type,
          });
          if (findWarehouse) {
            updateUserWh = await user.findOneAndUpdate(
              {
                user_name: x.user_name,
              },
              {
                $set: {
                  warehouse: findWarehouse.code,
                },
              }
            );
          }
        }
      }
      // let updateProcessing = await user.updateMany(
      //   { cpc: "Gurgaon_122016" },
      //   {
      //     $set: {
      //       cpc_type: "Processing",
      //     },
      //   }
      // );
      // let updateDock = await user.updateMany(
      //   { cpc: "Bangalore_560067" },
      //   {
      //     $set: {
      //       cpc_type: "Dock",
      //     },
      //   }
      // );
      if (updateUserWh) {
        resolve({ status: 1 });
      } else {
        resolve({ status: 0 });
      }
    });
  },
  extraPartidAdd: () => {
    return new Promise(async (resolve, reject) => {
      let updatePart = await partAndColor.deleteMany({ type: "part-list" });
      // const allPart = await partAndColor.find({ type: "part-list" });
      // let str = "SPN000000";
      // for (let x of allPart) {
      //   let num = parseInt(str.substring(3)) + 1;
      //   let updatedStr = str.substring(0, 3) + num.toString().padStart(6, "0");
      //   str = updatedStr;
      //   const updateid = await partAndColor.updateOne(
      //     { type: "part-list", name: x.name },
      //     {
      //       $set: {
      //         part_code: str,
      //         status: "Active",
      //         created_by: "super-admin",
      //       },
      //     }
      //   );
      //   let updateMuic = await products.updateMany(
      //     {},
      //     {
      //       $set: {
      //         created_by: "super-admin",
      //       },
      //     }
      //   );
      // }
      resolve(updatePart);
    });
  },
  extraRdlOneReport: () => {
    return new Promise(async (resolve, reject) => {
      let getTray = await masters.find({ sort_id: "Issued to RDL-1" });
      for (let x of getTray) {
        for (let y of x.actual_items) {
          let deliveryUpdate = await delivery.findOneAndUpdate(
            { tracking_id: y.tracking_id },
            {
              $set: {
                rdl_fls_one_user_name: x?.issued_user_name,
                rdl_fls_one_report: y?.rdl_fls_report,
              },
            },
            {
              new: true,
              projection: { _id: 0 },
            }
          );
        }
      }
      resolve(getTray);
    });
  },
  extraBqcDoneBugFix: () => {
    return new Promise(async (resolve, reject) => {
      // let bqcDoneTray = await masters.find({ code: "WHT10072" });
      // console.log(bqcDoneTray);
      // for (let x of bqcDoneTray) {
      // if (x.actual_items.length == 0) {
      let getDelivery = [];

      getDelivery = await delivery.find({
        wht_tray: "WHT1034",
        tray_status: "Issued to BQC",
      });

      let findMuic = await products.findOne({
        // brand_name: x.brand,
        // model_name: x.model,
        vendor_sku_id: getDelivery[0].item_id,
      });
      // x.code == "WHT1501" || x.code == "WHT1521" ||  x.code == "WHT1564" || x.code == "WHT1593" || x.code == "WHT1190"
      // if (x.code == "WHT10072") {
      for (let y of getDelivery) {
        let obj = {
          tracking_id: y.tracking_id,
          bot_agent: y.agent_name,
          tray_id: y.tray_id,
          uic: y.uic_code.code,
          imei: y.imei,
          muic: findMuic.muic,
          brand_name: findMuic.brand_name,
          model_name: findMuic.model_name,
          order_id: y.order_id,
          order_date: y.order_date,
          status: "Valid",
          bot_eval_result: y.bot_report,
          charging: y.charging,
        };
        let addToTray = await masters.findOneAndUpdate(
          { code: "WHT1034" },
          {
            $push: {
              actual_items: obj,
            },
          }
        );
      }
      resolve(getDelivery);
    });
  },
  bqcDoneReportIssueBugFix: () => {
    return new Promise(async (resolve, reject) => {
      let gettray = await masters.find({
        $or: [
          { code: "WHT1317" },
          { code: "WHT1599" },
          { code: "WHT1137" },
          { code: "WHT1232" },
        ],
      });
      for (let x of gettray) {
        if (x.code == "WHT1317") {
          for (let y of x.items) {
            let updateDelivery = await delivery.findOneAndUpdate(
              { tracking_id: y.tracking_id },
              {
                $set: {
                  bqc_done_close: new Date("2023-04-28T13:32:57.363+00:00"),
                },
              }
            );
          }
        } else if (x.code == "WHT1599") {
          for (let y of x.items) {
            let updateDelivery = await delivery.findOneAndUpdate(
              { tracking_id: y.tracking_id },
              {
                $set: {
                  bqc_done_close: new Date("2023-04-28T06:26:14.490+00:00"),
                },
              }
            );
          }
        } else if (x.code == "WHT1137") {
          for (let y of x.items) {
            let updateDelivery = await delivery.findOneAndUpdate(
              { tracking_id: y.tracking_id },
              {
                $set: {
                  bqc_done_close: new Date("2023-04-28T09:09:15.419+00:00"),
                },
              }
            );
          }
        } else if (x.code == "WHT1232") {
          for (let y of x.items) {
            let updateDelivery = await delivery.findOneAndUpdate(
              { tracking_id: y.tracking_id },
              {
                $set: {
                  bqc_done_close: new Date("2023-04-27T12:43:39.965+00:00"),
                },
              }
            );
          }
        }
      }
      resolve(gettray);
    });
  },
  extraRdlOneReport: () => {
    return new Promise(async (resolve, reject) => {
      let getTray = await masters.find({ sort_id: "Issued to RDL-1" });
      for (let x of getTray) {
        for (let y of x.actual_items) {
          let deliveryUpdate = await delivery.findOneAndUpdate(
            { tracking_id: y.tracking_id },
            {
              $set: {
                rdl_fls_one_user_name: x?.issued_user_name,
                rdl_fls_one_report: y?.rdl_fls_report,
              },
            },
            {
              new: true,
              projection: { _id: 0 },
            }
          );
        }
      }
      resolve(getTray);
    });
  },
  extraRdlOneUserNameAdd: () => {
    return new Promise(async (resolve, reject) => {
      let getRdlRepairTray = await masters.find({
        sort_id: "Ready to RDL-2",
      });
      for (let x of getRdlRepairTray) {
        for (let y of x.items) {
          let findItem = await delivery.findOne({ tracking_id: y.tracking_id });
          let update = await masters.findOneAndUpdate(
            { code: x.code, "items.uic": findItem.uic_code.code },
            {
              $set: {
                "items.$.rdl_fls_report.username":
                  findItem.rdl_fls_one_user_name,
              },
            }
          );
        }
      }
      resolve({ getRdlRepairTray });
    });
  },
  addOtherAudtitorFeedBack: () => {
    return new Promise(async (resolve, reject) => {
      const add = await audtiorFeedback.create(arr);
      if (add) {
        resolve(add);
      }
    });
  },
  addBotTrayFromBackend: () => {
    return new Promise(async (resolve, reject) => {
      let arr = [];

      for (let x of arr) {
        let getDelivery = await delivery.findOne({ "uic_code.code": x });
        let obj = {
          awbn_number: getDelivery.tracking_id,
          order_id: getDelivery.order_id,
          order_date: getDelivery.order_date,
          imei: getDelivery.imei,
          status: "Valid",
          tray_id: "BOT2001",
          bag_id: getDelivery.bag_id,
          user_name: getDelivery.agent_name,
          bag_assigned_date: getDelivery.assign_to_agent,
          uic: x,
        };
        let obj2 = {
          stickerOne: "UIC Pasted On Device",
          stickerTwo: "Device Putin Sleeve",
          body_damage: "",
          body_damage_des: "",
          model_brand: "",
        };
        obj.bot_eval_result = obj2;

        let updateTray = await masters.findOneAndUpdate(
          { code: "BOT2001" },
          {
            $push: {
              items: obj,
            },

            $set: {
              sort_id: "Closed By Bot",
              closed_time_bot: Date.now(),
              actual_items: [],
              issued_user_name: getDelivery.agent_name,
            },
          }
        );
        let updateBag = await masters.findOneAndUpdate(
          { code: getDelivery.bag_id },
          {
            $push: {
              items: obj,
            },
            $set: {
              sort_id: "Closed By Bot",
              closed_time_bot: Date.now(),
              actual_items: [],
              assign: "Old Assign",
              issued_user_name: getDelivery.agent_name,
            },
          }
        );
        let updateDelivery = await delivery.findOneAndUpdate(
          {
            "uic_code.code": x,
          },
          {
            $set: {
              bot_report: obj2,
              updated_at: Date.now(),
              tray_location: "Warehouse",
              tray_type: "BOT",
              tray_status: "Closed By Bot",
              tray_id: "BOT2001",
            },
          }
        );
      }
      resolve(arr);
    });
  },
  botTrayTransfer: () => {
    return new Promise(async (resolve, reject) => {
      let arr = [];

      let arr2 = [];

      for (let x of arr) {
        let findTray = await masters.findOne({ "items.uic": x });
        if (findTray) {
          for (let y of findTray.items) {
            if (y.uic == x) {
              y.tray_id = "BOT2054";
              let updateTheTray = await masters.updateOne(
                { code: "BOT2054" },
                {
                  $push: {
                    items: y,
                  },
                  $set: {
                    sort_id: "Closed By Warehouse",
                    closed_time_wharehouse_from_bot: new Date(
                      new Date().toISOString().split("T")[0]
                    ),
                    actual_items: [],
                    "track_tray.bot_done_tray_close_wh": Date.now(),
                  },
                }
              );
              if (updateTheTray.modifiedCount !== 0) {
                let updateRemove = await masters.findOneAndUpdate(
                  { code: findTray.code },
                  {
                    $pull: {
                      items: {
                        uic: x,
                      },
                    },
                    $set: {
                      temp_array: [],
                    },
                  }
                );
                if (arr2.includes(updateRemove.code) == false) {
                  arr2.push(updateRemove.code);
                }
              }
            }
          }
        }
      }
      arr2.push("BOT2054");
      for (let tray of arr2) {
        let take = await masters.findOne({ code: tray });
        for (let x of take.items) {
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
              code: take.code,
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
            code: take.code,
            "temp_array.vendor_sku_id": findProduct.vendor_sku_id,
          });
          x.wht_tray = null;
          if (checkAlreadyClub) {
            let updateTempArrayClub = await masters.updateOne(
              {
                code: take.code,
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
                code: take.code,
              },
              {
                $push: {
                  temp_array: obj,
                },
              }
            );
          }
        }
      }
      resolve({ status: true });
    });
  },
  rollBackTrayToAuditStage: () => {
    return new Promise(async (resolve, reject) => {
      // const findTray=await masters.findOne({code:"CTB2008"})
      // for(let x of findTray.items ){
      //   const updateToWht=await masters.findOneAndUpdate({code:"WHT1696"},{
      //     $push:{
      //       items:x
      //     }
      //   })
      // }
      // let updateCtx=await masters.findOneAndUpdate({code:"CTB2008"},{
      //   $set:{
      //     sort_id:"Open",
      //     actual_items:[],
      //     items:[],
      //     temp_array:[],
      //     recommend_location:null,

      //   }
      // })
      // resolve(updateCtx)
      const findRdlDoneTray = await delivery.find({
        rdl_fls_one_report: { $exists: true },
      });
      for (let x of findRdlDoneTray) {
        if (typeof x.rdl_fls_one_report.username === "object") {
          let update = await delivery.updateOne(
            { "uic_code.code": x.uic_code.code },
            {
              $set: {
                "rdl_fls_one_report.username":
                  x.rdl_fls_one_report.username.name,
              },
            }
          );
        }
      }
      let findtray = await masters.find({
        "items.rdl_fls_report": { $exists: true },
      });
      for (let y of findtray) {
        for (let units of y.items) {
          if (units?.rdl_fls_report?.selected_status == "Repair Required") {
            let arr = [];
            // console.log(units?.rdl_fls_report);
            if (
              units.rdl_fls_report.part_list_1 !== "" &&
              units.rdl_fls_report.part_list_1 !== undefined
            ) {
              let findId = await partAndColor.findOne({
                type: "part-list",
                name: units.rdl_fls_report.part_list_1,
              });
              let obj = {
                part_name: units.rdl_fls_report.part_list_1,
                quantity: 1,
              };
              if (findId) {
                obj.part_id = findId.part_code;
              } else {
                obj.part_id = "SPN000000";
              }
              arr.push(obj);
            }
            if (
              units.rdl_fls_report.part_list_2 !== "" &&
              units.rdl_fls_report.part_list_2 !== undefined
            ) {
              let findId = await partAndColor.findOne({
                type: "part-list",
                name: units.rdl_fls_report.part_list_2,
              });
              let obj = {
                part_name: units.rdl_fls_report.part_list_2,
                quantity: 1,
              };
              if (findId) {
                obj.part_id = findId.part_code;
              } else {
                obj.part_id = "SPN000000";
              }
              arr.push(obj);
            }
            if (
              units.rdl_fls_report.part_list_3 !== "" &&
              units.rdl_fls_report.part_list_3 !== undefined
            ) {
              let findId = await partAndColor.findOne({
                type: "part-list",
                name: units.rdl_fls_report.part_list_3,
              });
              let obj = {
                part_name: units.rdl_fls_report.part_list_3,
                quantity: 1,
              };
              if (findId) {
                obj.part_id = findId.part_code;
              } else {
                obj.part_id = "SPN000000";
              }
              arr.push(obj);
            }
            if (
              units.rdl_fls_report.part_list_4 !== "" &&
              units.rdl_fls_report.part_list_4 !== undefined
            ) {
              let findId = await partAndColor.findOne({
                type: "part-list",
                name: units.rdl_fls_report.part_list_4,
              });
              let obj = {
                part_name: units.rdl_fls_report.part_list_4,
                quantity: 1,
              };
              if (findId) {
                obj.part_id = findId.part_code;
              } else {
                obj.part_id = "SPN000000";
              }
              arr.push(obj);
            }
            if (
              units.rdl_fls_report.part_list_5 !== "" &&
              units.rdl_fls_report.part_list_5 !== undefined
            ) {
              let findId = await partAndColor.findOne({
                type: "part-list",
                name: units.rdl_fls_report.part_list_4,
              });
              let obj = {
                part_name: units.rdl_fls_report.part_list_4,
                quantity: 1,
              };
              if (findId) {
                obj.part_id = findId.part_code;
              } else {
                obj.part_id = "SPN000000";
              }
              arr.push(obj);
            }
            if (units.rdl_fls_report.partRequired == undefined) {
              let update = await masters.updateOne(
                { items: { $elemMatch: { uic: units.uic } } },
                {
                  $set: {
                    "items.$.rdl_fls_report.partRequired": arr,
                  },
                }
              );
            }
          }

          if (typeof units.rdl_fls_report?.username === "object") {
            let update = await masters.updateOne(
              { items: { $elemMatch: { uic: units.uic } } },
              {
                $set: {
                  "items.$.rdl_fls_report.username":
                    units.rdl_fls_report.username.name,
                },
              }
            );
          }
        }
      }
      resolve("done");
    });
  },
  fixBaggingIssueWithAwbn: () => {
    return new Promise(async (resolve, reject) => {
      let i = 0;
      let arr = [];
      let findDelivery = await delivery.find({});
      for (let x of findDelivery) {
        if (x.wht_tray) {
          let findTray = await masters.findOne({
            code: x.wht_tray,
            "items.uic": x?.uic_code?.code,
          });
          if (findTray == null) {
            if (x.sales_bin_status == undefined && x.ctx_tray_id == undefined) {
              if (arr.includes(x.wht_tray) == false) {
                arr.push(x.wht_tray);
              }
            }
          }
        }
      }
      resolve(arr);
    });
  },
  changeWHLocation: () => {
    return new Promise(async (resolve, reject) => {
      let getWarehoue = await infra.find({ type_taxanomy: "Warehouse" });
      for (let x of getWarehoue) {
        let getLocation = await infra.findOne({
          type_taxanomy: "CPC",
          name: x.parent_id,
        });
        if (x.warehouse_type == "STW") {
          let update = await infra.findOneAndUpdate(
            { code: x.code },
            {
              $set: {
                parent_id: getLocation.code,
                warehouse_type: "Dock",
              },
            }
          );
        } else if (x.warehouse_type == "PRC") {
          let update = await infra.findOneAndUpdate(
            { code: x.code },
            {
              $set: {
                parent_id: getLocation.code,
                warehouse_type: "Processing",
              },
            }
          );
        } else {
          let update = await infra.findOneAndUpdate(
            { code: x.code },
            {
              $set: {
                parent_id: getLocation.code,
              },
            }
          );
        }
      }
      resolve(getWarehoue);
    });
  },
  bugFixOfSpecOfTray: () => {
    return new Promise(async (resolve, reject) => {
      let getTrayZeroUnits = await masters.find({
        $or: [
          { code: "WHT1100" },
          { code: "WHT1084" },
          { code: "WHT1057" },
          { code: "WHT1054" },
          { code: "WHT1036" },
          { code: "WHT1149" },
          { code: "WHT1218" },
          { code: "WHT1255" },
          { code: "WHT1532" },
          { code: "WHT1481" },
          { code: "WHT1526" },
        ],
      });
      for (let x of getTrayZeroUnits) {
        let getDelivery = await delivery.find({
          wht_tray: x.code,
          sales_bin_status: { $exists: false },
          ctx_tray_id: { $exists: false },
        });
        let findMuic = await products.findOne({
          brand_name: x.brand,
          model_name: x.model,
        });
        for (let y of getDelivery) {
          let obj = {
            tracking_id: y.tracking_id,
            bot_agent: y.agent_name,
            tray_id: y.tray_id,
            uic: y.uic_code.code,
            imei: y.imei,
            muic: findMuic.muic,
            brand_name: x.brand,
            model_name: x.model,
            order_id: y.order_id,
            order_date: y.order_date,
            status: "Valid",
            bot_eval_result: y.bot_report,
            charging: y.charging,
            bqc_report: y.bqc_report,
          };
          let addToTray = await masters.findOneAndUpdate(
            { code: x.code },
            {
              $push: {
                items: obj,
              },
              $set: {
                sort_id: "Ready to Audit",
              },
            }
          );
        }
      }
      resolve(getTrayZeroUnits);
    });
  },
  extraWhClosedDateUpdation: () => {
    return new Promise(async (resolve, reject) => {
      // const BqcDoneUnits = await masters.find({ sort_id: "Ready to Audit" });
      // for (let x of BqcDoneUnits) {
      //   if (x?.track_tray?.audit_done_close_wh == undefined) {
      //     let updateTray = await masters.findOneAndUpdate(
      //       { code: x.code },
      //       {
      //         $set: {
      //           "track_tray.bqc_done_close_by_wh": x.closed_time_wharehouse,
      //         },
      //       }
      //     );
      //   }
      // }
      // resolve(BqcDoneUnits);
      // const BqcDoneUnits = await masters.find({ sort_id: "Ready to RDL" });
      // for (let x of BqcDoneUnits) {
      //   if (x?.track_tray?.audit_done_close_wh == undefined) {
      //     let find=await delivery.findOne({"uic_code.code":x.items[0]?.uic})
      //     if(find.audit_done_close == undefined){
      //       let updateTray = await masters.findOneAndUpdate(
      //         { code: x.code },
      //         {
      //           $set: {
      //             "track_tray.audit_done_close_wh": x.closed_time_wharehouse,
      //           },
      //         }
      //       );
      //     }
      //     else{
      //       let updateTray = await masters.findOneAndUpdate(
      //         { code: x.code },
      //         {
      //           $set: {
      //             "track_tray.audit_done_close_wh": find.audit_done_close,
      //           },
      //         }
      //       );
      //     }
      //   }
      // }
      // resolve(BqcDoneUnits);
      const BqcDoneUnits = await masters.find({
        sort_id: "Ready to RDL-2",
      });
      for (let x of BqcDoneUnits) {
        if (x?.track_tray?.rdl_1_done_close_by_wh == undefined) {
          let find = await delivery.findOne({
            "uic_code.code": x.items[0]?.uic,
          });

          if (find.rdl_fls_done_closed_wh == undefined) {
            let updateTray = await masters.findOneAndUpdate(
              { code: x.code },
              {
                $set: {
                  "track_tray.rdl_1_done_close_by_wh": x.closed_time_wharehouse,
                },
              }
            );
          } else {
            let updateTray = await masters.findOneAndUpdate(
              { code: x.code },
              {
                $set: {
                  "track_tray.rdl_1_done_close_by_wh":
                    find.rdl_fls_done_closed_wh,
                },
              }
            );
          }
        }
      }
      resolve(BqcDoneUnits);
    });
  },
  whtTrayRecorrect: () => {
    let arr = ["WHT1100", "WHT1084", "WHT1057", "WHT1054", "WHT1036"];
    return new Promise(async (resolve, reject) => {
      for (let x of arr) {
        let findTray = await delivery.find({
          wht_tray: x,
          sales_bin_status: { $exists: false },
          ctx_tray_id: { $exists: false },
        });
      }
    });
  },
  resolveAllDeliveryIssue: () => {
    return new Promise(async (resolve, reject) => {
      let findDelivery = await delivery.find({});
      let i = 0;
      for (let x of findDelivery) {
        // check imei verified or not
        if (x.bqc_software_report != undefined) {
          let status = "Unverified";
          if (
            x.imei?.match(/[0-9]/g)?.join("") ==
              x.bqc_software_report.mobile_imei ||
            x.imei?.match(/[0-9]/g)?.join("") ==
              x.bqc_software_report.mobile_imei2 ||
            x.imei?.match(/[0-9]/g)?.join("") ==
              x.bqc_software_report._ro_ril_miui_imei0
          ) {
            status = "Verified";
          }
          let updateDelivery = await delivery.findOneAndUpdate(
            {
              "uic_code.code": x.uic_code?.code,
            },
            {
              $set: {
                unverified_imei_status: status,
              },
            }
          );
          let updateOrder = await orders.findOneAndUpdate(
            { order_id: x.order_id },
            {
              $set: {
                imei_verification_status: status,
              },
            }
          );
        }

        // if (x.partner_shop == "Sales_Gurgaon_122016") {
        //   let updateDeliveryTwo = await delivery.findOneAndUpdate(
        //     { "uic_code.code": x.uic_code?.code },
        //     {
        //       $set: {
        //         partner_shop: "Gurgaon_122016",
        //       },
        //     }
        //   );
        // } else if (
        //   x.partner_shop == "Gurgaon_122016" ||
        //   x.partner_shop == "Sales_Gurgaon_122016"
        // ) {
        //   let updateOrder = await orders.findOneAndUpdate(
        //     { order_id: x.order_id },
        //     {
        //       $set: {
        //         partner_shop: "Gurgaon_122016",
        //       },
        //     }
        //   );
        // }
        // console.log(i);
        i++;
      }

      // let arr=[]
      // for (let x of arr) {
      //   let updatjackMuic = await products.findOneAndUpdate(
      //     { muic: x.muic },
      //     {
      //       $set: {
      //         jack_type: x.jack_type,
      //       },
      //     }

      //     );
      //     console.log(updatjackMuic)
      //   let tray = await masters.updateMany(
      //     { brand: x.brand_name, model: x.model_name },
      //     {
      //       $set: {
      //         jack: x.jack_type,
      //       },
      //     }
      //   );
      // }

      // FINAL GRADE UPDATION
      // let i = 0;
      // let findAllDeliveryData = await delivery.find({});
      // for (let x of findAllDeliveryData) {
      //   let grade = "";
      //   if (x?.sales_bin_grade !== undefined) {
      //     grade = x.sales_bin_grade;
      //   } else if (x?.audit_report?.stage == "Accept") {
      //     grade = x?.audit_report.orgGrade;
      //   } else if (x?.audit_report?.grade !== undefined) {
      //     grade = x?.audit_report?.grade;
      //   }
      //   let update = await delivery.findOneAndUpdate(
      //     { "uic_code.code": x?.uic_code?.code },
      //     {
      //       $set: {
      //         final_grade: grade,
      //       },
      //     }
      //   );
      //   i++;
      //   console.log(i);
      // }

      resolve({ status: true });
    });
  },
  resolveOrderDateIssue: () => {
    return new Promise(async (resolve, reject) => {
      let arr = ["171-8585838-8066743"];
      for (let x of arr) {
        let findOrderdata = await orders.findOne(
          { order_id: x },
          { order_date: 1 }
        );
        const originalDate = new Date(findOrderdata.order_date);
        // Create a new Date with day and month swapped
        const updatedDate = new Date(
          originalDate.getFullYear(),
          originalDate.getDate() - 1, // Adjust for the day (subtract 1)
          originalDate.getMonth() + 1 // Month remains the same
        );

        if (
          new Date(findOrderdata.order_date) ==
          new Date("2023-07-08T18:30:00.000Z")
        ) {
          // let orderDate1 = await orders.updateMany(
          //   { order_date: new Date("2023-07-08T18:30:00.000Z") },
          //   {
          //     $set: {
          //       order_date: new Date("2023-06-09T18:30:00.000Z"),
          //       order_timestamp:  new Date("2023-06-09T18:30:00.000Z"),
          //     },
          //   }
          // );
        }
        // else if(new Date(findOrderdata.order_date) !== new Date("2023-06-09T18:30:00.000Z")){
        //   let orderDate = await orders.updateOne(
        //     { order_id: x },
        //     {
        //       $set: {
        //         order_date: updatedDate,
        //         order_timestamp: updatedDate,
        //       },
        //     }
        //   );
        // }
      }
      resolve({ status: true });
    });
  },
  addCategoryExtra: () => {
    return new Promise(async (resolve, reject) => {
      // let arr = []
      // let str = "SPC000058";
      // let str2 = "BOX000000";
      // for (let x of arr) {
      //   // let checkBoxId = await box.findOne({ name: x.box_id });
      //   // if (
      //   //   checkBoxId == null &&
      //   //   x.box_id !== undefined &&
      //   //   x.box_id !== "" &&
      //   //   x.box_id !== "BOX-99"
      //   // ) {
      //   //   let num1 = parseInt(str2.substring(3)) + 1;
      //   //   let updatedStr2 =
      //   //     str2.substring(0, 3) + num1.toString().padStart(6, "0");
      //   //   str2 = updatedStr2;
      //   //   let createBox = await box.create({
      //   //     box_id: str2,
      //   //     name: x.box_id,
      //   //     description: x.box_id,
      //   //     display: str2,
      //   //     created_at: Date.now(),
      //   //   });
      //   //   x.box_id = createBox.box_id;
      //   // } else {
      //   //   if (checkBoxId) {
      //   //     x.box_id = checkBoxId.box_id;
      //   //   }
      //   // }
      //   // let findCategory = await spareCategories.findOne({
      //   //   category_name: x.sp_category,
      //   // });

      //   // if (
      //   //   findCategory == null &&
      //   //   x.sp_category !== undefined &&
      //   //   x.sp_category !== ""
      //   // ) {
      //   //   let num = parseInt(str.substring(3)) + 1;
      //   //   let updatedStr =
      //   //     str.substring(0, 3) + num.toString().padStart(6, "0");
      //   //   str = updatedStr;
      //   //   let createCategory = await spareCategories.create({
      //   //     spcategory_id: str,
      //   //     category_name: x.sp_category,
      //   //     description: x.sp_category,
      //   //     creation_date: Date.now(),
      //   //   });
      //   // }
      //   // let updateSp = await partAndColor.findOneAndUpdate(
      //   //   {
      //   //     part_code: x.part_code,
      //   //     type: "part-list",
      //   //   },
      //   //   {
      //   //     $set: {
      //   //       sp_category: x.sp_category,
      //   //       // box_id: x.box_id,
      //   //     },
      //   //   }
      //   // );
      // }
      // if (x.box_id == "BOX-99") {
      let updateSp = await partAndColor.updateMany(
        {
          type: "part-list",
          box_id: "SPN000015",
        },
        {
          $set: {
            box_id: "BOX000015",
          },
        }
      );
      // }
      resolve({ status: true });
    });
  },
  /* ------------------------------OLD SPN MANGE-----------------------------*/
  manageOldSpnData: () => {
    return new Promise(async (resolve, reject) => {
      let arr = [];
      for (let x of arr) {
        const spnArray = x.spn.split(",");

        let array = [];
        for (let y of spnArray) {
          let findSpn = await partAndColor.findOne({ part_code: y });
          let obj = {
            part_id: findSpn.part_code,
            part_name: findSpn.name,
            quantity: 1,
          };
          array.push(obj);
        }

        let checkTray = await masters.findOne({
          "items.uic": x.uic?.toString(),
        });

        if (checkTray) {
          if (checkTray.sort_id == "Ready to RDL-2") {
            let updateDelivery = await delivery.updateOne(
              { "uic_code.code": x.uic?.toString() },
              {
                $set: {
                  "rdl_fls_one_report.partRequired": array,
                },
              }
            );

            let updateOneTray = await masters.updateOne(
              { "items.uic": x.uic?.toString() },
              {
                $set: {
                  "items.$.rdl_fls_report.partRequired": array,
                },
              }
            );
          }
        }
      }
      resolve({ status: true });
    });
  },
  exUpdateWithNewSpn: () => {
    return new Promise(async (resolve, reject) => {
      let arr = [];
      // for (let x of arr) {
      //   if (x.old_spn !== x.new_spn) {
      //     let findSpn = await partAndColor.findOne({ part_code: x.new_spn });
      //     let obj = {
      //       part_id: findSpn.part_code,
      //       part_name: findSpn.name,
      //       quantity: 1,
      //     };

      //     let udpateDelivery = await delivery.updateMany(
      //       { "rdl_fls_one_report.partRequired.part_id": x.old_spn },
      //       {
      //         $push: {
      //           "rdl_fls_one_report.partRequired": obj,
      //         },
      //       }
      //     );

      //     let main = await delivery.updateMany(
      //       {
      //         "rdl_fls_one_report.partRequired.part_id": x.old_spn,
      //       },
      //       {
      //         $pull: {
      //           "rdl_fls_one_report.partRequired": { part_id: x.old_spn },
      //         },
      //       }
      //     );
      //     let udpateDelivery2 = await masters.updateMany(
      //       { "items.rdl_fls_report.partRequired.part_id": x.old_spn },
      //       {
      //         $push: {
      //           "items.$.rdl_fls_report.partRequired": obj,
      //         },
      //       }
      //     );

      //     let main2 = await masters.updateMany(
      //       {
      //         "items.rdl_fls_report.partRequired.part_id": x.old_spn,
      //       },
      //       {
      //         $pull: {
      //           "items.$.rdl_fls_report.partRequired": { part_id: x.old_spn },
      //         },
      //       }
      //     );
      //   }
      // }
      let arrOfMotherBoardSW = ["SPN000734", "SPN000731"];
      for (let y of arrOfMotherBoardSW) {
        let status;
        if (y == "SPN000734") {
          status = "Motherboard Work";
        } else {
          z;
          status = "Software Installation";
        }

        let main1 = await masters.updateMany(
          {
            "items.rdl_fls_report.partRequired.part_id": y,
          },
          {
            $set: {
              "items.$.rdl_fls_report.selected_status": status,
            },
          }
        );
        let main2 = await masters.updateMany(
          {
            "items.rdl_fls_report.partRequired.part_id": y,
          },
          {
            $pull: {
              "items.$.rdl_fls_report.partRequired": { part_id: y },
            },
          }
        );

        // After removing the element, you can set the "selected_status" field:
        let main3 = await delivery.updateMany(
          {
            "rdl_fls_one_report.partRequired.part_id": y,
          },
          {
            $set: {
              "rdl_fls_one_report.partRequired.$.selected_status": status,
            },
          }
        );
        let main4 = await delivery.updateMany(
          {
            "rdl_fls_one_report.partRequired.part_id": y,
          },
          {
            $pull: {
              "rdl_fls_one_report.partRequired": { part_id: y },
            },
          }
        );
      }
      resolve({ status: true });
    });
  },
  manageRdlFlsToRdlOne: () => {
    return new Promise(async (resolve, reject) => {
      const updateRdl = await masters.updateMany(
        {
          $or: [{ sort_id: "Send for RDL-One" }],
        },
        {
          $set: {
            sort_id: "Send for RDL-1",
          },
        }
      );
      resolve({ status: true });
    });
  },
  findDupMuic: () => {
    return new Promise(async (resolve, reject) => {
      // const findMuic = await products.find();
      // let arr1 = [];
      // let arr2 = [];
      // for (let x of findMuic) {
      //   if (arr1.includes(x.muic)) {
      //     arr2.push(x.muic);
      //   }
      //   arr1.push(x.muic);
      // }
      // resolve(arr2);
      const findTemp = await masters.updateMany(
        {
          prefix: "tray-master",
          sort_id: {
            $in: [
              "Received for rack change",
              "Issued to scan in for rack change",
            ],
          },
          temp_rack: null,
        },
        {
          $set: {
            temp_rack: "RAC999999",
          },
        }
      );

      resolve({ status: 1 });
      // let findRpt=await masters.find({type_taxanomy:"RPT"})
      // for(let x of findRpt){
      //   for(let y of x.items){
      //     let update=await delivery.findOneAndUpdate({"uic_code.code":y.uic},{
      //       $set:{
      //         rp_tray:x.code
      //       }
      //     })
      //   }
      // }
      // let findTray = await masters.findOne({ code: "RPT18008" });
      // for (let x of findTray.actual_items) {
      //   let update = await masters.updateOne(
      //     { code: "RPT18008" },
      //     {
      //       $set: {
      //         actual_items: [],
      //       },
      //       $push: {
      //         items: x,
      //       },
      //     }
      //   );
      // }
      // resolve({ status: true });
    });
  },
  extraUpdateRack: () => {
    return new Promise(async (resolve, reject) => {
      let arr = [];
      for (let x of arr) {
        let findRack = await masters.findOne(
          { code: x, sort_id: "Open" },
          { code: 1, rack_id: 1 }
        );
        if (findRack) {
          if (findRack.rack_id == "RAC000025") {
            let updateNewRack = await masters.findOneAndUpdate(
              { code: findRack.code },
              {
                $set: {
                  rack_id: "RAC000099",
                },
              }
            );
          }
        }
      }
      resolve({ status: true });
    });
  },
  removeProcurmentRequest: () => {
    return new Promise(async (resolve, reject) => {
      let arr = [];
      for (let x of arr) {
        const data = await purchaseOrder.findOne({ request_id: x });
        if (data.status == "Pending") {
          const deleteRequest = await purchaseOrder.deleteOne({
            request_id: x,
          });
        }
      }
      resolve({ status: true });
    });
  },
  removeAddToMmt: async () => {
    try {
      const findAllTray = await masters.find(
        {
          $or: [
            { sort_id: "Issued to RDL-two" },
            { sort_id: "Rdl-two inprogress" },
            { sort_id: "Closed by RDL-two" },
            { sort_id: "Send for RDL-two" },
            { sort_id: "Received from RDL-two" },
            { sort_id: "Ready to RDL-Repair" },
            { sort_id: "Ready to RDL-Repair Issued to Merging" },
            { sort_id: "Ready to RDL-Repair Merging Done" },
            { sort_id: "Ready to RDL-Repair Merge Request Sent To Wharehouse" },
            { sort_id: "Ready to RDL-Repair Received From Merging" },
            { sort_id: "Ready to RDL" },
            { sort_id: "Send for RDL-FLS" },
            { sort_id: "Issued to RDL-FLS" },
            { sort_id: "Closed by RDL-FLS" },
            { sort_id: "Received From RDL-FLS" },
            { sort_id: "Ready to Pricing" },
            { sort_id: "RDL two done closed by warehouse" },
          ],
        },
        {
          code: 1,
          sort_id: 1,
        }
      );
      let tempStatus = "";
      for (let x of findAllTray) {
        if (x.sort_id == "Issued to RDL-two") {
          tempStatus = "Issued to RDL-2";
        } else if (x.sort_id == "Rdl-two in-progress") {
          tempStatus = "Rdl-2 in-progress";
        } else if (x.sort_id == "Closed by RDL-two") {
          tempStatus = "Closed by RDL-2";
        } else if (x.sort_id == "Send for RDL-two") {
          tempStatus = "Send for RDL-2";
        } else if (x.sort_id == "Received from RDL-two") {
          tempStatus = "Received from RDL-2";
        } else if (x.sort_id == "Ready to RDL-Repair") {
          tempStatus = "Ready to RDL-2";
        } else if (x.sort_id == "Ready to RDL-Repair Issued to Merging") {
          tempStatus = "Ready to RDL-2 Issued to Merging";
        } else if (x.sort_id == "Ready to RDL-Repair Merging Done") {
          tempStatus = "Ready to RDL-2 Merging Done";
        } else if (
          x.sort_id == "Ready to RDL-Repair Merge Request Sent To Wharehouse"
        ) {
          tempStatus = "Ready to RDL-2 Merge Request Sent To Wharehouse";
        } else if (x.sort_id == "Ready to RDL-Repair Received From Merging") {
          tempStatus = "Ready to RDL-2 Received From Merging";
        } else if (x.sort_id == "Ready to RDL") {
          tempStatus = "Ready to RDL-1";
        } else if (x.sort_id == "Send for RDL-FLS") {
          tempStatus = "Send for RDL-1";
        } else if (x.sort_id == "Issued to RDL-FLS") {
          tempStatus = "Issued to RDL-1";
        } else if (x.sort_id == "Closed by RDL-FLS") {
          tempStatus = "Closed by RDL-1";
        } else if (x.sort_id == "Received From RDL-FLS") {
          tempStatus = "Received From RDL-1";
        } else if (x.sort_id == "RDL two done closed by warehouse") {
          tempStatus = "RDL-2 done closed by warehouse";
        } else if (x.sort_id == "Ready to Pricing") {
          tempStatus = "Inuse";
        }

        let updateStatus = await masters.updateOne(
          { code: x.code },
          {
            $set: {
              sort_id: tempStatus,
            },
          }
        );
        tempStatus = "";
      }

      let updateUsersRdl1 = await user.updateMany(
        { user_type: "RDL-One" },
        {
          $set: {
            user_type: "RDL-1",
          },
        }
      );
      let updateUsersRdl2 = await user.updateMany(
        { user_type: "RDL-two" },
        {
          $set: {
            user_type: "RDL-2",
          },
        }
      );
      return { status: true };
    } catch (error) {
      return error;
    }
  },
  tempDataAddRequerment: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let findTray = await masters.find({
          $or: [
            { sort_id: { $ne: "Open" }, type_taxanomy: "ST" },
            { sort_id: { $ne: "Open" }, type_taxanomy: "CT" },
          ],
        });
        for (let x of findTray) {
          let update = await delivery.updateMany(
            {
              $or: [
                { ctx_tray_id: x.code, stx_tray_id: { $exists: false } },
                { stx_tray_id: x.code },
              ],
            },
            {
              $set: {
                final_grade: x.tray_grade,
                tray_type: x.type_taxanomy,
              },
            }
          );

          if (
            x.type_taxanomy == "ST" &&
            x.sp_price !== undefined &&
            x.mrp_price !== undefined
          ) {
            for (let y of x.items) {
              let updatePrice = await delivery.updateOne(
                { "uic_code.code": y.uic },
                {
                  $set: {
                    mrp_price: x.mrp_price,
                    sp_price: x.sp_price,
                    price_updation_date: x.price_updation_date,
                    price_creation_date: x.price_creation_date,
                  },
                }
              );
            }
          }
        }

        resolve(findTray); // You can resolve with the orderData if needed.
      } catch (error) {
        console.error("An error occurred:", error);
        reject(error); // Reject the promise with the error.
      }
    });
  },
  tempReq: async () => {
    try {
      let checktrayRptTrayRdl2 = await masters.find({
        sort_id: "Ready to RDL-2",
        "items.rdl_repair_report.status": "Repair Done",
      });
      for (let x of checktrayRptTrayRdl2) {
        for (let y of x?.items) {
          if (y?.rdl_repair_report?.status == "Repair Done") {
            let update = await delivery.updateOne(
              {
                "uic_code.code": y.uic,
              },
              {
                $set: {
                  flag_status: true,
                },
              }
            );
          }
        }
      }
      // let checktrayRptTrayRdl2=await masters.find({sort_id:"Ready to RDL-2",type_taxanomy:"WHT","items.rdl_repair_report.reason":"Device not repairable"})
      // for(let x of checktrayRptTrayRdl2){
      //   for(let y of x?.items){
      //     if(y?.rdl_repair_report?.reason == "Device not repairable"){
      //       let update=await delivery.updateOne({
      //         "uic_code.code":y.uic
      //       },
      //       {
      //         $set:{
      //           flag_status:true
      //         }
      //       }
      //       )
      //     }
      //   }
      // }
      return { status: 1 };
    } catch (error) {
      return error;
    }
  },
  pickupIssue: async () => {
    try {
      const fetchTray = await masters.findOne({ code: "WHT1564" });
      for (let x of fetchTray.items) {
        const pushUic = await masters.updateOne(
          { code: "WHT1564" },
          {
            $push: {
              temp_array: x.uic,
            },
          }
        );
      }
      return fetchTray;
    } catch (error) {
      return error;
    }
  },
  pickupIssueRollBack: async () => {
    try {
      let arr = [
        "WHT1610",
        "WHT1038",
        "WHT1139",
        "WHT1151",
        "WHT1160",
        "WHT1405",
        "WHT1461",
        "WHT1610",
        "WHT1729",
        "WHT1787",
      ];
      for (let x of arr) {
        let findUpdate = await masters.updateOne(
          { code: x },
          {
            $set: {
              sort_id: "Open",
              temp_array: [],
              actual_items: [],
              items: [],
            },
          }
        );
      }
      let findTray = await masters.find({
        sort_id: "Pickup Request sent to Warehouse",
        to_tray_for_pickup: { $ne: null },
      });
      for (let y of findTray) {
        let updateData = await masters.findOneAndUpdate(
          { code: y.code },
          {
            $set: {
              sort_id: "RDL-2 done closed by warehouse",
              temp_array: [],
              actual_items: [],
            },
          }
        );
        for (let m of y.items) {
          let update3 = await masters.findOneAndUpdate(
            { "items.uic": m.uic },
            {
              $set: {
                "items.$.pickup_toTray": null,
              },
            }
          );
        }
        let update2 = await masters.updateOne(
          { code: y.to_tray_for_pickup },
          {
            $set: {
              sort_id: "Open",
              temp_array: [],
              actual_items: [],
            },
          }
        );
      }
      return { status: true };
    } catch (error) {
      return error;
    }
  },
  oneStepBackWhtRp: async () => {
    try {
      const dataOfRequest = await masters.find({
        code: { $in: ["WHT1139", "WHT1128"] },
        type_taxanomy: "WHT",
      });
      for (let x of dataOfRequest) {
        let updateWht = await masters.updateOne(
          {
            code: x.code,
          },
          {
            $set: {
              sort_id: "Ready to RDL-2",
              actual_items: [],
              issued_user_name: null,
            },
          }
        );
        for (let y of x.items) {
          let updateWht1 = await masters.updateOne(
            {
              "items.uic": y.uic,
            },
            {
              $set: {
                "items.$.rp_tray": null,
              },
            }
          );
        }
        let updateRp = await masters.findOneAndUpdate(
          {
            code: x.rp_tray,
          },
          {
            $set: {
              sort_id: "Open",
              temp_array: [],
              wht_tray: [],
              sp_tray: null,
              issued_user_name: null,
            },
          }
        );
        let updateDataOfSp = await masters.findOneAndUpdate(
          {
            code: updateRp.sp_tray,
          },
          {
            $set: {
              sort_id: "Open",
              actual_items: [],
              items: [],
              issued_user_name: null,
            },
          }
        );
        if (updateDataOfSp) {
          for (let spn of updateDataOfSp.items) {
            let updateSpn = await partAndColor.findOneAndUpdate(
              {
                part_code: spn.partId,
              },
              {
                $inc: {
                  avl_stock: parseInt(spn.selected_qty),
                },
              }
            );
          }
        }
      }
      return { status: 1 };
    } catch (error) {
      return error;
    }
  },
  // GET ALL DATA OF SPN
  getDataOfAllSpnWithUic: async () => {
    try {
      const data = await delivery.find({
        "rdl_fls_one_report.partRequired": { $exists: true },
      });
      for (let x of data) {
        for (let y of x.rdl_fls_one_report.partRequired) {
          let obj = {
            uic: x.uic_code.code,
            spn_number: y.part_id,
            tracking_id: x.tracking_id,
            order_id: x.order_id,
            item_id: x.item_id,
            partner_purchase_price: x.partner_purchase_price,
            base_discount: x.base_discount,
            diagnostics_discount: x.diagnostics_discount,
            storage_discount: x.storage_discount,
            buyback_category: x.buyback_category,
            doorstep_diagnostics: x.doorstep_diagnostics,
            bag_id: x.bag_id,
            agent_name: x.agent_name,
            agent_name_charging: x.agent_name_charging,
            agent_name_bqc: x.agent_name_bqc,
            tray_id: x.tray_id,
            assign_to_agent: x.assign_to_agent,
            tray_status: x.tray_status,
            charging: x.charging,
            charging_done_close: x.charging_done_close,
            bqc_report: x.bqc_report,
            bqc_done_close: x.bqc_done_close,
            audit_user_name: x.audit_user_name,
            audit_report: x.audit_report,
            audit_done_close: x.audit_done_close,
            rdl_fls_one_user_name: x.rdl_fls_one_user_name,
            rdl_fls_one_report: x.rdl_fls_one_report,
            rdl_fls_closed_date: x.rdl_fls_closed_date,
            stx_tray_id: x.stx_tray_id,
            rp_tray: x.rp_tray,
            rdl_two_user_name: x.rdl_two_user_name,
            rdl_two_closed_date: x.rdl_two_closed_date,
            rdl_two_report: x.rdl_two_report,
            imei: x.imei,
            wht_tray: x.wht_tray,
            ctx_tray_id: x.ctx_tray_id,
            partner_shop: x.partner_shop,
          };
          let createData = await tempOrdersReq.create(obj);
          console.log(createData);
        }
      }
      return { status: 1 };
    } catch (error) {
      return error;
    }
  },
  /*--------------------WHT OR TRAY WISE DATA------------------------*/
  whtTrayWiseData: async () => {
    try {
      const dataOfwht = await masters.find({ type_taxanomy: "ST" });
      for (let x of dataOfwht) {
        if (x.items.length == 0) {
          let obj = {
            tray_id: x.code,
            tray_status: x.sort_id,
          };
          let add = await tempOrdersReq.create(obj);
        } else {
          for (let y of x.items) {
            let obj = {
              tray_id: x.code,
              tray_status: x.sort_id,
              uic: y.uic,
            };
            let add = await tempOrdersReq.create(obj);
          }
        }
      }
      return { status: 1 };
    } catch (error) {
      return error;
    }
  },
  extraUpdateTheLimit: async () => {
    try {
      const trayId = [
        "STC3199",
        "STC3200",
        "STC3201",
        "STC3202",
        "STC3203",
        "STC3204",
        "STC3205",
        "STC3206",
        "STC3207",
        "STC3208",
        "STC3209",
        "STRB2661",
        "STRB2662",
        "STRB2664",
        "STB23671",
        "STB23672",
        "STB23673",
        "STB23674",
        "STD4012",
        "STC3210",
        "STC3211",
        "STC3212",
        "STC3213",
        "STB23675",
        "STB23676",
        "STD4013",
        "STRB2668",
        "STRB2671",
        "STRB2672",
        "STRB2673",
        "STA1015",
        "STA1018",
        "STC3214",
        "STB23677",
        "STB23678",
        "STB23679",
        "STRB2674",
        "STRB2676",
        "STA1020",
        "STC3215",
        "STC3216",
        "STB23680",
        "STRB2680",
        "STB23681",
        "STB23682",
        "STC3217",
        "STC3218",
        "STC3219",
        "STC3220",
        "STC3221",
        "STRB2681",
        "STRB2683",
        "STRB2684",
        "STRB2685",
        "STB2169",
        "STB2170",
        "STB2171",
        "STB23683",
        "STB23684",
        "STB23685",
        "STC3222",
        "STC3223",
        "STRB2688",
        "STC3224",
        "STC3225",
        "STB2172",
        "STB2173",
        "STB23687",
        "STC3226",
        "STRB2689",
        "STB2174",
        "STB23688",
        "STC3227",
        "STD4014",
        "STB2175",
        "STB2176",
        "STB2177",
        "STA1026",
        "STB23689",
        "STC3228",
        "STC3229",
        "STRB2700",
        "STC3230",
        "STC3231",
        "STC3232",
        "STC3233",
        "STB23690",
        "STB23691",
        "STB23692",
        "STRB2703",
        "STA1027",
        "STB2178",
        "STB2179",
        "STB2180",
        "STC3234",
        "STC3235",
        "STC3236",
        "STC3237",
        "STB23693",
        "STRB2705",
        "STC3238",
        "STC3239",
        "STC3240",
        "STC3241",
        "STC3242",
        "STC3243",
        "STC3244",
        "STC3245",
        "STC3246",
        "STC3247",
        "STC3248",
        "STC3249",
        "STB2181",
        "STB2182",
        "STB2183",
        "STB2184",
        "STB2185",
        "STB2186",
        "STB2187",
        "STB23694",
        "STRB2707",
        "STC3250",
        "STC3251",
        "STC3252",
        "STC3253",
        "STC3254",
        "STC3255",
        "STC3256",
        "STC3257",
        "STB2188",
        "STB2189",
        "STB23695",
        "STB2190",
        "STB2191",
        "STC3258",
        "STC3259",
        "STB23696",
        "STC3260",
        "STB23697",
        "STB2192",
        "STB23698",
        "STC3261",
      ];
      for (let x of trayId) {
        let updateTray = await masters.updateOne(
          {
            code: x,
          },
          {
            $set: {
              limit: 40,
            },
          }
        );
      }
      return { status: 1 };
    } catch (error) {
      return error;
    }
  },
  extraUpdateRdlOneDoneDate: async () => {
    try {
      let find = await delivery.find(
        { rdl_fls_closed_date: { $exists: true } },
        { rdl_fls_closed_date: 1, uic_code: 1 }
      );
      for (let x of find) {
        const update = await delivery.updateOne(
          { "uic_code.code": x.uic_code.code },
          {
            $set: {
              rdl_fls_done_units_date: x.rdl_fls_closed_date,
            },
          }
        );
        console.log(update);
      }

      return { status: 1 };
    } catch (error) {
      console.log(error);
      return error;
    }
  },
  // CHANGE ITEM ID BACKEND PROCESS
  changeItemId: async () => {
    try {
      let arr = [
        {
          sku: "Mobile_1198",
          model: "V9:All | All",
          old_item_details: "vivo:v9:all | all",
          old_model: "V9",
        },
        {
          sku: "Mobile_2307",
          model: "Redmi Note 10T 5G:All | All",
          old_item_details: "xiaomi:redmi note 10t 5g:all | all",
          old_model: "Redmi Note 10T 5G",
        },
        {
          sku: "Mobile_1720",
          model: "iPhone 11 Pro | 64 gb",
          old_item_details: "apple:iphone 11 pro | 64 gb",
          old_model: "iPhone 11 Pro",
        },
      ];
      for (let x of arr) {
        const data = await products.updateOne(
          { vendor_sku_id: x.sku },
          {
            $set: {
              model_name: x.model,
            },
          }
        );
        let updateTrayOrder = await orders.updateMany(
          {
            item_id: x.sku,
          },
          {
            $set: {
              old_item_details: x.model,
            },
          }
        );
        let updateTrayDelivery = await delivery.updateMany(
          {
            item_id: x.sku,
          },
          {
            $set: {
              old_item_details: x?.old_item_details,
            },
          }
        );
        let updateTray = await masters.find(
          { model: x.old_model },
          { code: 1 }
        );

        for (let y of updateTray) {
          let updpateTrayModel = await masters.findOneAndUpdate(
            { code: y.code },
            {
              $set: {
                model: x.model,
              },
            }
          );
          if (updpateTrayModel.items.length != 0) {
            for (let data of updpateTrayModel.items) {
              let updateUnits = await masters.updateOne(
                {
                  "items.uic": data.uic,
                },
                {
                  $set: {
                    "items.$.model_name": x.model,
                  },
                }
              );
              // if (updateUnits.modifiedCount == 0) {
              //   console.log(x.model);
              //   console.log("4",updateUnits);
              //   return { status: 2 };
              // }
            }
          }
        }
      }
      return { status: 1 };
    } catch (error) {
      return error;
    }
  },
  // UPDATE THE PRICE
  updatePriceOld: async () => {
    try {
      let checkTheDelivery = await delivery.find({
        item_moved_to_billed_bin: { $exists: false },
        stx_tray_id: { $exists: true },
        tray_type: "ST",
        sp_price: { $exists: true },
        mrp_price: { $exists: true },
      });
      for (let x of checkTheDelivery) {
        console.log(x.mrp_price);
        if (x?.audit_report?.sub_muic !== undefined) {
          let updateWithSubMuic = await delivery.updateMany(
            {
              item_moved_to_billed_bin: { $exists: false },
              stx_tray_id: { $exists: true },
              tray_type: "ST",
              sp_price: { $exists: false },
              mrp_price: { $exists: false },
              final_grade: x.final_grade,
              "audit_report.sub_muic": x?.audit_report?.sub_muic,
            },
            {
              $set: {
                sp_price: x.sp_price,
                mrp_price: x.mrp_price,
                price_updation_date: x?.price_updation_date,
                price_creation_date: x?.price_creation_date,
              },
            }
          );
        } else {
          let updateWithSubMuic = await delivery.updateMany(
            {
              item_moved_to_billed_bin: { $exists: false },
              stx_tray_id: { $exists: true },
              tray_type: "ST",
              sp_price: { $exists: false },
              mrp_price: { $exists: false },
              final_grade: x.final_grade,
              "audit_report.sub_muic": { $exists: false },
              item_id: x.item_id,
            },
            {
              $set: {
                sp_price: x.sp_price,
                mrp_price: x.mrp_price,
                price_updation_date: x?.price_updation_date,
                price_creation_date: x?.price_creation_date,
              },
            }
          );
        }
      }
      return { status: 1 };
    } catch (error) {
      return error;
    }
  },
  fixStxTrayIssue: async () => {
    try {
      let arr = [
        "90010002214",
        "90010002213",
        "90010000670",
        "90010002275",
        "90010000479",
        "90010000487",
        "90010001473",
        "92100004932",
        "90010001294",
      ];
      for (let x of arr) {
        const deliveryData = await delivery.findOne({ "uic_code.code": x });
        let findProduct = await products.findOne({
          vendor_sku_id: deliveryData.item_id,
        });
        if (deliveryData) {
          let obj = {
            tracking_id: deliveryData.tracking_id,
            uic: deliveryData.uic_code.code,
            imei: deliveryData.imei,
            muic: findProduct.muic,
            brand_name: findProduct.brand_name,
            model_name: findProduct.model_name,
            order_id: deliveryData.order_id,
            order_date: deliveryData.order_date,
            charging: deliveryData.charging,
            audit_report: deliveryData.audit_report,
            rdl_fls_report: deliveryData.rdl_fls_one_report,
            bqc_report: deliveryData.bqc_report,
          };
          let createTray;
          let findTheTray = await masters.findOne({
            code: deliveryData.stx_tray_id,
          });
          if (findTheTray) {
            createTray = await masters.findOneAndUpdate(
              { code: deliveryData.stx_tray_id },
              {
                $set: {
                  sort_id: "Received From Sorting Agent After Ctx to Stx",
                  issued_user_name: "subrata.srt.s.ggn.100074",
                  closed_time_sorting_agent: new Date(
                    "2023-10-16T08:55:30.469+00:00"
                  ),
                },
                $push: {
                  items: obj,
                },
              }
            );
          } else {
            console.log("working");
            createTray = await masters.create({
              name: deliveryData.stx_tray_id,
              limit: 15,
              sort_id: "Received From Sorting Agent After Ctx to Stx",
              type_taxanomy: "ST",
              prefix: "tray-master",
              display: deliveryData.stx_tray_id,
              created_at: Date.now(),
              model: findProduct.model_name,
              brand: findProduct.brand_name,
              cpc: "Sales_Gurgaon_122016",
              warehouse: "Sales WH: DealsDray / PREXO Gurgaon",
              items: [obj],
              code: deliveryData.stx_tray_id,
              closed_time_sorting_agent: new Date(
                "2023-10-16T08:55:30.469+00:00"
              ),
              issued_user_name: "subrata.srt.s.ggn.100074",
            });
          }
        }
      }
      return { status: 1 };
    } catch (error) {
      return error;
    }
  },
};
