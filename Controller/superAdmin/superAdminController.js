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
const { audtiorFeedback } = require("../../Model/temp/auditor-feedback");
const { vendorMaster } = require("../../Model/vendorModel/vendorModel");
const {
  partAndColor,
} = require("../../Model/Part-list-and-color/part-list-and-color");
const {
  mastersEditHistory,
} = require("../../Model/masterHistoryModel/mastersHistory");
const moment = require("moment");
const elasticsearch = require("../../Elastic-search/elastic");

const IISDOMAIN = "https://prexo-v8-3-adminapi.dealsdray.com/user/profile/";
const IISDOMAINPRDT = "https://prexo-v8-3-adminapi.dealsdray.com/product/image/";

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
        password: loginData.password,
      });
      if (data) {
        resolve({ status: 1, data: data });
      } else {
        let userGet = await user.findOne({
          user_name: loginData.user_name,
          password: loginData.password,
        });
        if (userGet) {
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
        }
        resolve({ status: 2 });
      }
    });
  },
  /*--------------------------------DASHBOARD-----------------------------------*/
  getDashboardData: () => {
    return new Promise(async (resolve, reject) => {
      let count = {};
      count.usersCount = await user.count({});
      count.location = await infra.count({ type_taxanomy: "CPC" });
      count.warehouse = await infra.count({ type_taxanomy: "Warehouse" });
      count.brand = await brands.count({});
      count.products = await products.count({});
      count.vendor = await vendorMaster.count({});
      count.ctxCategory = await trayCategory.count({});
      count.tray = await masters.count({ prefix: "tray-master" });
      count.bag = await masters.count({ prefix: "bag-master" });
      count.partList = await partAndColor.count({ type: "part-list" });
      count.colorList = await partAndColor.count({ type: "color-list" });
      count.readyForTransferSales = await masters.count({
        prefix: "tray-master",
        sort_id: "Audit Done Closed By Warehouse",
        type_taxanomy: { $nin: ["BOT", "PMT", "MMT", "WHT", "ST","SPT","RPT"] },
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
  checkUserStatus: (userName) => {
    return new Promise(async (resolve, reject) => {
      let data = await user.findOne({ user_name: userName, status: "Active" });
      if (data) {
        resolve(data);
      } else {
        resolve();
      }
    });
  },

  /*--------------------------------CHANGE PASSWORD-----------------------------------*/

  changePassword: (userData) => {
    return new Promise(async (resolve, reject) => {
      let data = await user.updateOne(
        { _id: userData._id, password: userData.old_password },
        {
          $set: {
            password: userData.new_password,
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

  /*--------------------------------CREATE USER-----------------------------------*/

  createUser: (userData, profile) => {
    if (profile != undefined) {
      userData.profile = IISDOMAIN + profile;
    }
    userData.creation_date = Date.now();
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
      let data = await usersHistory.find({ user_name: username });
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
      let usersData = await user.find({});
      resolve(usersData);
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
          last_update_date: userDetails.last_update_date,
          last_otp: userDetails.last_otp,
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
      for (let i = 0; i < productsData.length; i++) {
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
      let allProducts = await products.find({ brand_name: brandName });
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
  /*--------------------------------FIND ALL WAREHOUSE-----------------------------------*/

  getAllWarehouse: () => {
    return new Promise(async (resolve, reject) => {
      let data = await infra.find({ type_taxanomy: "Warehouse" });
      resolve(data);
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
          trayData[i].tray_category !== "RPT"

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
        }
        else if (trayID > 19999 && trayData[i].tray_category == "RPT") {
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
          trayData[i].tray_category !== "SPT"
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
        .find({ prefix: type.master_type })
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

  delteMaster: (masterId) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.deleteOne({ code: masterId });
      if (data.deletedCount != 0) {
        resolve({ status: true });
      } else {
        resolve({ status: false });
      }
    });
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
      let data = await masters.find({
        type_taxanomy: "WHT",
        prefix: "tray-master",
        sort_id: "Inuse",
        items: { $ne: [] },
      });
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
      let tray = await masters.find({
        prefix: "tray-master",
        sort_id: "Ready to BQC",
      });
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
      let data = await masters.find({
        sort_id: "Audit Done Closed By Warehouse",
        type_taxanomy: "WHT",
      });
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
        type_taxanomy: { $nin: ["BOT", "PMT", "MMT", "WHT", "ST","SPT","RPT"] },
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
        type_taxanomy: { $nin: ["BOT", "PMT", "MMT", "WHT", "ST", "CT","SPT","RPT"] },
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
        type_taxanomy: { $nin: ["BOT", "PMT", "MMT", "WHT", "ST","SPT","RPT"] },
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
      let getCtx = await masters.find({
        prefix: "tray-master",
        type_taxanomy: "CT",
        sort_id: "Audit Done Closed By Warehouse",
      });

      for (let x of getCtx) {
        if (
          x.code !== "CTC3051" &&
          x.code !== "CTC3052" &&
          x.code !== "CTC3053" &&
          x.code !== "CTC3054" &&
          x.code !== "CTC3055"
        ) {
          for (let y of x.items) {
            let updateDelivery = await delivery.findOneAndUpdate(
              { tracking_id: y.tracking_id },
              {
                $set: {
                  tray_location: "Warehouse",
                  sales_bin_status: "Sales Bin",
                  sales_bin_date: Date.now(),
                  sales_bin_grade: x.tray_grade,
                  sales_bin_wh_agent_name: "From Bakend",
                  sales_bin_desctiption: "From Bakend",
                },
              }
            );
          }
          let updateRetuTray = await masters.updateOne(
            {
              code: x.code,
            },
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
        }
      }
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
        "WHT1010",
        "WHT1014",
        "WHT1021",
        "WHT1035",
        "WHT1036",
        "WHT1037",
        "WHT1039",
        "WHT1043",
        "WHT1050",
        "WHT1051",
        "WHT1054",
        "WHT1057",
        "WHT1084",
        "WHT1100",
        "WHT1106",
        "WHT1125",
        "WHT1135",
        "WHT1141",
        "WHT1149",
        "WHT1205",
        "WHT1210",
        "WHT1213",
        "WHT1218",
        "WHT1243",
        "WHT1252",
        "WHT1255",
        "WHT1257",
        "WHT1264",
        "WHT1269",
        "WHT1275",
        "WHT1280",
        "WHT1286",
        "WHT1299",
        "WHT1301",
        "WHT1302",
        "WHT1305",
        "WHT1312",
        "WHT1322",
        "WHT1323",
        "WHT1338",
        "WHT1340",
        "WHT1348",
        "WHT1398",
        "WHT1453",
        "WHT1481",
        "WHT1489",
        "WHT1526",
        "WHT1532",
        "WHT1006",
        "WHT1052",
        "WHT1111",
        "WHT1116",
        "WHT1131",
        "WHT1226",
        "WHT1234",
        "WHT1240",
        "WHT1249",
        "WHT1307",
        "WHT1331",
        "WHT1342",
        "WHT1405",
        "WHT1425",
        "WHT1428",
        "WHT1430",
        "WHT1434",
        "WHT1483",
        "WHT1485",
        "WHT1488",
        "WHT1490",
        "WHT1491",
        "WHT1531",
        "WHT1538",
        "WHT1386",
        "WHT1034",
      ];

      for (let x of arr) {
        let data = await masters.updateOne(
          {
            code: x,
          },
          {
            $set: {
              sort_id: "Ready to Audit",
              issued_user_name: null,
              actual_items: [],
              temp_array: [],
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
      console.log(checkDup);
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
        const data = await partAndColor.find({ type: type }).sort({part_code:1});
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
  bulkValidationForPartCheck: (partData) => {
    return new Promise(async (resolve, reject) => {
      let err = {};
      let partName = [];
      let color = [];
      let technical_qc = [];
      let dup = false;
      let i = 0;
      const duplicates = [];

      for (let x of partData) {
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
          }
           else {
            if (
              partData.some(
                (data, index) =>
                  data.part_name == x.part_name && data.part_color == x.part_color && index != i
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
          created_at: created_at,
          ...rest
        }) => ({
          name,
          color,
          part_code,
          technical_qc,
          description,
          created_by,
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
  viewOneData: (id, type) => {
    return new Promise(async (resolve, reject) => {
      let findData = await partAndColor.findOne({ _id: id });
      if (findData) {
        if (type == "part-list") {
          let checkUsed = await delivery.findOne({
            $or: [
              { "rdl_fls_one_report.part_list_1": findData.name },
              { "rdl_fls_one_report.part_list_2": findData.name },
              { "rdl_fls_one_report.part_list_3": findData.name },
              { "rdl_fls_one_report.part_list_4": findData.name },
              { "rdl_fls_one_report.part_list_5": findData.name },
            ],
          });
          if (checkUsed) {
            resolve({ status: 3 });
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
      let updateData = await partAndColor.updateOne(
        { _id: dataOfPartorColor._id },
        {
          $set: {
            name: dataOfPartorColor.name,
            muic: dataOfPartorColor.muic,
            description: dataOfPartorColor.description,
            color: dataOfPartorColor?.color,
            technical_qc: dataOfPartorColor?.technical_qc,
          },
        }
      );
      if (updateData.modifiedCount !== 0) {
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

        let number = parseFloat(x.add_stock);
        if (number < 0 || isNaN(number)) {
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
  partlistManageStockUpdate: (partStockData) => {
    return new Promise(async (resolve, reject) => {
      for (let x of partStockData) {
        const updateStock = await partAndColor.findOneAndUpdate(
          { part_code: x.part_code },
          {
            $inc: {
              avl_stock: parseInt(x.add_stock),
            },
          }
        );
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
  addCpcType: () => {
    return new Promise(async (resolve, reject) => {
      let updateProcessing = await user.updateMany(
        { cpc: "Gurgaon_122016" },
        {
          $set: {
            cpc_type: "Processing",
          },
        }
      );
      let updateDock = await user.updateMany(
        { cpc: "Bangalore_560067" },
        {
          $set: {
            cpc_type: "Dock",
          },
        }
      );
      if (updateDock) {
        resolve({ status: 1 });
      } else {
        resolve({ status: 0 });
      }
    });
  },
  extraPartidAdd: () => {
    return new Promise(async (resolve, reject) => {
      let updatePart=await partAndColor.deleteMany({type:"part-list"})
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
      let getTray = await masters.find({ sort_id: "Issued to RDL-FLS" });
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
      let bqcDoneTray = await masters.find({ sort_id: "BQC Done" });
      for (let x of bqcDoneTray) {
        if (x.actual_items.length == 0) {
          let getDelivery = [];
          //x.code == "WHT1564"

          if (x.code == "WHT1141") {
            getDelivery = await delivery.find({
              wht_tray: "WHT1141",
              sales_bin_status: { $exists: false },
              stx_tray_id: { $exists: false },
            });
          } else if (x.code == "WHT1521") {
            getDelivery = await delivery.find({
              wht_tray: x.code,
              sales_bin_status: { $exists: false },
            });
          } else {
            getDelivery = await delivery.find({ wht_tray: x.code });
          }
          let findMuic = await products.findOne({
            brand_name: x.brand,
            model_name: x.model,
          });
          // x.code == "WHT1501" || x.code == "WHT1521" ||  x.code == "WHT1564" || x.code == "WHT1593" || x.code == "WHT1190"
          if (x.code == "WHT1300") {
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
              };
              let addToTray = await masters.findOneAndUpdate(
                { code: x.code },
                {
                  $push: {
                    actual_items: obj,
                  },
                }
              );
            }
          }
        }
      }
      resolve(bqcDoneTray);
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
      let getTray = await masters.find({ sort_id: "Issued to RDL-FLS" });
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
        sort_id: "Ready to RDL-Repair",
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
      let arr = [
        "92100002330",
        "92100002353",
        "92100002350",
        "92100002332",
        "92100002796",
        "92100002831",
        "92100002810",
        "92100003515",
        "92100002465",
        "92100003340",
        "92100002207",
        "92100002219",
        "92100002214",
        "92100002213",
        "92100002658",
        "92100002663",
        "92100002680",
        "92100002677",
        "92100002661",
      ];

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
  fixBaggingIssueWithAwbn: () => {
    return new Promise(async (resolve, reject) => {
      for (let x of arr) {
        x.created_at = Date.now();
        let checkOrderPresent = await orders.findOne({ order_id: x.order_id });
        if (checkOrderPresent) {
        } else {
          let checkDelivery = await delivery.findOne({ order_id: x.order_id });
          if (checkDelivery) {
            x["delivery_status"] = "Delivered";
            let updateDelivery = await delivery.findOneAndUpdate(
              { order_id: x.order_id },
              {
                $set: {
                  temp_delivery_status: "Delivered",
                },
              }
            );
          }
          x.order_status = "NEW";
          x.partner_id = x.partner_id.toString();
          x.order_date = new Date(x.order_date);
          x.partner_id = x.partner_id.toString();
          x.imei = x.imei.toString;
          (x.base_discount = x.base_discount),
            (x.partner_purchase_price = x.partner_purchase_price.toString());
          x.tracking_id = x.tracking_id.toString();
          x.order_id_replaced = x.order_id_replaced?.toString();
          x.gc_amount_redeemed = x.gc_amount_redeemed.toString();
          x.partner_price_no_defect = x.partner_price_no_defect.toString();
          x.revised_partner_price = x.revised_partner_price.toString();
          x.delivery_fee = x.delivery_fee.toString();
          x.exchange_facilitation_fee = x.exchange_facilitation_fee.toString();
          x.created_at = Date.now();
          const orderData = await orders.create(x);
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
        $or: [{ code: "WHT1362" }, { code: "WHT1392" }],
      });
      for (let x of getTrayZeroUnits) {
        let getDelivery = await delivery.find({ wht_tray: x.code });
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
          };
          let addToTray = await masters.findOneAndUpdate(
            { code: x.code },

            {
              $push: {
                actual_items: obj,
              },
              $set: {
                sort_id: "BQC Done",
              },
            }
          );
        }
      }
      resolve(getTrayZeroUnits);
    });
  },
};
