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
const { ctxCategory } = require("../../Model/ctxCategoryModel/category");
const {
  mastersEditHistory,
} = require("../../Model/masterHistoryModel/mastersHistory");
const moment = require("moment");

const IISDOMAIN = "http://prexo-v8-dev-api.dealsdray.com/user/profile/";
const IISDOMAINPRDT = "http://prexo-v8-dev-api.dealsdray.com/product/image/";

/************************************************************************************************** */

/* 


@ SUPER ADMIN CONTROLLER FETCH DATA FROM MONGODB DATA BASE PREXO AND MAKE CHANGES ON DB 



*/

module.exports = {
  /*--------------------------------LOGIN-----------------------------------*/

  doLogin: (loginData) => {
    return new Promise(async (resolve, reject) => {

      console.log(loginData);
      console.log('loginData');
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
          console.log('usrrrrr');
          let activeOrNotActive = await user.findOne({
            user_name: loginData.user_name,
            password: loginData.password,
            status: "Active",
          });
          if (activeOrNotActive) {
            console.log('actieeeee');
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
      count.tray = await masters.count({ prefix: "tray-master" });
      count.bag = await masters.count({ prefix: "bag-master" });
      count.readyForChargingInuse = await masters.count({
        type_taxanomy: "WHT",
        prefix: "tray-master",
        sort_id: "Inuse",
        items: { $ne: [] },
      });
      let readyForBqcTray = await masters.find({
        prefix: "tray-master",
        sort_id: "Ready to BQC",
      });
      let countBqc = 0;
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
  getLocationType:(code)=>{
    return new Promise(async(resolve,reject)=>{
      let data=await infra.find({code:code})
      if(data){
        resolve(data)
      }
    })
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

  getWarehouse: (code) => {
    return new Promise(async (resolve, reject) => {
      let warehouse = await infra.find({
        parent_id: code,
        type_taxanomy: "Warehouse",
      });
      resolve(warehouse);
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
        });
        if (modelName) {
          model.push(modelName.model_name);
          err["model_name"] = model;
        } else {
          if (
            productsData.some(
              (data, index) =>
                data.model_name == productsData[i].model_name && index != i
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
        resolve({ status: false });
      } else {
        let data = await infra.create(locationData);
        if (data) {
          resolve({ status: true });
        }
      }
    });
  },

  /*--------------------------------GET INFRA-----------------------------------*/

  getInfra: (infraId) => {
    return new Promise(async (resolve, reject) => {
      let data = await infra.findOne({ code: infraId });
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

  deleteInfra: (infraId) => {
    return new Promise(async (resolve, reject) => {
    let checkUsed=await user.findOne({cpc:infraId})
    if(checkUsed){
      resolve({status:2})
    }
    else{
      let data = await infra.deleteOne({ code: infraId });
      if (data.deletedCount != 0) {
        resolve({status:1});
      } else {
        resolve({status:0});
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

      for (let i = 0; i < trayData.length; i++) {
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
            parent_id: cpcCheck.name,
          });
          if (warehouseCheck == null) {
            warehouse.push(trayData[i]?.tray_id);
            err["warehouse_does_not_exist"] = warehouse;
          }
        }
        let trayID = trayData[i].tray_id.split(
          `${trayData[i].tray_category}`
        )[1];
        if (trayID > 2251 && trayData[i].tray_category == "BOT") {
          tray_id.push(trayData[i].tray_id);
          err["tray_id"] = tray_id;
        }
        if (trayID > 8051 && trayData[i].tray_category == "MMT") {
          tray_id.push(trayData[i].tray_id);
          err["tray_id"] = tray_id;
        }
        if (trayID > 1501 && trayData[i].tray_category == "WHT") {
          tray_id.push(trayData[i].tray_id);
          err["tray_id"] = tray_id;
        }
        if (trayID > 8151 && trayData[i].tray_category == "PMT") {
          tray_id.push(trayData[i].tray_id);
          err["tray_id"] = tray_id;
        }
        if (trayID > 1999 && trayData[i].tray_category == "CTA") {
          tray_id.push(trayData[i].tray_id);
          err["tray_id"] = tray_id;
        }
        if (trayID > 2999 && trayData[i].tray_category == "CTB") {
          tray_id.push(trayData[i].tray_id);
          err["tray_id"] = tray_id;
        }
        if (trayID > 3999 && trayData[i].tray_category == "CTC") {
          tray_id.push(trayData[i].tray_id);
          err["tray_id"] = tray_id;
        }
        if (trayID > 4999 && trayData[i].tray_category == "CTD") {
          tray_id.push(trayData[i].tray_id);
          err["tray_id"] = tray_id;
        }
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
          trayData[i].tray_category == "WHT" ||
          trayData[i].tray_category == "CTA" ||
          trayData[i].tray_category == "CTB" ||
          trayData[i].tray_category == "CTC" ||
          trayData[i].tray_category == "CTD"
        ) {
          let brandModel = await brands.findOne({
            brand_name: trayData[i].tray_brand,
          });
          if (brandModel == null) {
            brand.push(trayData[i].tray_brand);
            err["brand"] = brand;
          }
          let modelName = await products.findOne({
            model_name: trayData[i].tray_model,
          });
          if (modelName == null) {
            model.push(trayData[i].tray_model);
            err["model"] = model;
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
            $and: [
              { name: mastersData.name },
              { code: mastersData.code },
              { prefix: mastersData.prefix },
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
        let updateWht = await masters.updateOne(
          { code: x },
          {
            $set: {
              sort_id: status,
              actual_items: [],
              issued_user_name: null,
            },
          }
        );
        if (updateWht.modifiedCount == 0) {
          flag = true;
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
  /*--------------------------------AUDIT DONE TRAY  FORCEFULL SEND TO RDL-----------------------------------*/

  sendToRdl: (trayIds) => {
    return new Promise(async (resolve, reject) => {
      let sendtoRdlMis;
      for (let x of trayIds) {
        sendtoRdlMis = await masters.findOneAndUpdate(
          { code: x },
          {
            $set: {
              sort_id: "Ready to RDL",
              actual_items: [],
              issued_user_name: null,
              from_merge: null,
              to_merge: null,
            },
          }
        );
      }
      if (sendtoRdlMis) {
        resolve({ status: true });
      } else {
        resolve({ status: false });
      }
    });
  },

  /*--------------------------------EXTRA CHANGES-----------------------------------*/

  updateCPCExtra: () => {
    return new Promise(async (resolve, reject) => {
      let ordersData = await orders.find();
      for (let x of ordersData) {
        let checkDelivery = await delivery.findOne({ order_id: x.order_id });
        if (checkDelivery) {
          let updateStatus = await orders.updateOne(
            { order_id: x.order_id },
            {
              $set: {
                delivery_status: "Delivered",
              },
            }
          );
        }
      }
      resolve(ordersData);
    });
  },
  updateWhtTrayId: () => {
    return new Promise(async (resolve, reject) => {
      let Allwht = await masters.find({
        prefix: "tray-master",
        type_taxanomy: "WHT",
      });
      for (let x of Allwht) {
        if (x.items.length != 0) {
          for (let y of x.items) {
            let updateId = await delivery.updateOne(
              { tracking_id: y.tracking_id },
              {
                $set: {
                  wht_tray: x.code,
                },
              }
            );
            if (updateId.modifiedCount != 0) {
              console.log(updateId);
            }
          }
        } else if (x.actual_items.length != 0) {
          for (let item of x.actual_items) {
            let updateId = await delivery.updateOne(
              { tracking_id: item.tracking_id },
              {
                $set: {
                  wht_tray: x.code,
                },
              }
            );
            if (updateId.modifiedCount != 0) {
              console.log(updateId);
            }
          }
        }
      }
      if (Allwht) {
        resolve(Allwht);
      }
    });
  },
  getUpdateRecord: () => {
    return new Promise(async (resolve, reject) => {
      let tray = await masters.find({
        prefix: "tray-master",
        closed_time_bot: { $exists: true },
        sort_id: { $ne: "Open" },
      });
      for (let x of tray) {
        if (x.items.length !== 0) {
          for (let y of x.items) {
            let obj;
            if (x.type_taxanomy == "BOT") {
              obj = {
                stickerOne: y?.stickerOne,
                stickerTwo: y?.stickerTwo,
                stickerThree: y?.stickerThree,
                stickerFour: y?.stickerFour,
                body_damage: y?.body_damage,
                body_damage_des: y?.body_damage_des,
                model_brand: y?.model_brand,
              };
              let updateDelivery = await delivery.updateOne(
                { tracking_id: y.tracking_id },
                {
                  $set: {
                    bot_report: obj,
                  },
                }
              );
            } else {
              let updateDelivery = await delivery.updateOne(
                { tracking_id: y.tracking_id },
                {
                  $set: {
                    bot_report: y?.bot_eval_result,
                  },
                }
              );
            }
          }
        }
      }
      resolve({ status: "Done" });
    });
  },
  extraReAudit:()=>{
    return new Promise(async(resolve,reject)=>{
      let arr=[
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
      ]
      console.log(arr.length);
      for(let x of arr){
        let data =await masters.updateOne({
          code:x
        },{
          $set:{
            sort_id: "Ready to Audit",
            issued_user_name: null,
            actual_items: [],
            temp_array:[]
          }
        })
        console.log(data);
      }
      resolve(arr)
    })
  },
  createctxcategory: (data) => {
    return new Promise(async (resolve, reject) => {
      let checkcodeExists = await ctxCategory.findOne({
        $or: [
          {
            Code: data?.Code,
          },
          {

            Float: data?.Float,
          },
        ],
      });
      if (checkcodeExists) {
        resolve({ status: false });
      } else {
        let obj = {
          Code: data?.Code,
          Description: data?.Description,
          Float: data?.Float,
          created_at: Date.now(),
        }
        let dataa = await ctxCategory.create(obj);
        if (dataa) {
          resolve({ status: true });
        }
      }
    })
  },

  getCtxCategorys: () => {
    return new Promise(async (resolve, reject) => {
      let data = await ctxCategory.find();
      if (data) {
        resolve(data);
      } else {
        resolve();
      }
    });
  },

  deleteCtxcategory: (code) => {
    return new Promise(async (resolve, reject) => {
      let categorySelected= await masters.find({type_taxanomy:code?.code})
      if(categorySelected.length!==0){
        resolve({ status: false});
      }else{
        let data = await ctxCategory.deleteOne({ Code: code?.code });
        if (data) {
          resolve(data);
        } else {
          resolve({ status: false });
        }
      }
    })
  },


  geteditctxcategory: (code) => {
    return new Promise(async (resolve, reject) => {
      let data = await ctxCategory.findOne({ Code: code });
      if (data) {
        resolve(data);
      } else {
        resolve();
      }
    })
  },

  editctxcategory: (async (body) => {
    console.log(body, 'bodyyyyx');
    return new Promise(async (resolve, reject) => {
      
      const ActiveCategory = await ctxCategory.findOne({ _id: body._id })
      const Float = await ctxCategory.findOne({ Float: body.Float })
      const Code = await ctxCategory.findOne({ Code: body.Code })


      if (Float && ActiveCategory.Float != body.Float) {
        resolve({ status: false })
      } else if (Code && ActiveCategory.Code != body.Code) {
        console.log("Existing Code");
        resolve({ status: false })
      } else {
        let data = await ctxCategory.findOneAndUpdate(
          { _id: body?._id },
          {
            $set: {
              Code: body?.Code,
              Description: body?.Description,
              Float: body?.Float,
            }
          }
        );
        if (data) {
          console.log('gdgdg');
          resolve({ status: true })
        } else {
          console.log('dsd');
          resolve({ status: false })
        }
      }
    })
  }),


  getCtxTrayCategory: () => {
    return new Promise(async (resolve, reject) => {
      let data = await ctxCategory.find();
      if (data) {
        resolve(data);
      } else {
        resolve();
      }
    })
  },

  categoryCheck: (body) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({type_taxanomy:body?.empId});
      if (data?.length!==0) {
        resolve({ status: true });
      } else {
        resolve({ status: false });
      }
    })
  },



};
