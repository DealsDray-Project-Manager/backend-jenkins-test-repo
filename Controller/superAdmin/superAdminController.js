const { user } = require("../../Model/userModel");
const { infra } = require("../../Model/infraModel");
const { masters } = require("../../Model/mastersModel");
const { orders } = require("../../Model/ordersModel/ordersModel");
const { brands } = require("../../Model/brandModel/brand");
const { products } = require("../../Model/productModel/product");
const { admin } = require("../../Model/adminModel/admins");
const { usersHistory } = require("../../Model/users-history-model/model");
const { delivery } = require("../../Model/deliveryModel/delivery");
const { itemClub } = require("../../Model/itemClubModel/club");
const moment = require("moment");
const IISDOMAIN = "https://prexo-v1-dev-api.dealsdray.com/user/profile/";
const IISDOMAINPRDT = "https://prexo-v1-dev-api.dealsdray.com/product/image/";

/************************************************************************************************** */
module.exports = {
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
  getUsersHistory: (username) => {
    return new Promise(async (resolve, reject) => {
      let data = await usersHistory.find({ user_name: username });
      if (data) {
        resolve(data);
      }
    });
  },
  getCpc: () => {
    return new Promise(async (resolve, rejects) => {
      let cpc = await infra.find({ type_taxanomy: "CPC" });
      resolve(cpc);
    });
  },
  getWarehouse: (code) => {
    return new Promise(async (resolve, reject) => {
      let warehouse = await infra.find({
        parent_id: code,
        type_taxanomy: "Warehouse",
      });
      resolve(warehouse);
    });
  },
  getDesignation: () => {
    return new Promise(async (resolve, reject) => {
      let designation = await masters.find({
        type_taxanomy: "designation-type",
      });
    });
  },
  getUsers: () => {
    return new Promise(async (resolve, reject) => {
      let usersData = await user.find({});
      resolve(usersData);
    });
  },
  userDeactivate: (userId) => {
    return new Promise(async (resolve, reject) => {
      let res = await user.findByIdAndUpdate(userId, { status: "Deactivated" });
      resolve(res);
    });
  },
  userActivate: (userId) => {
    return new Promise(async (resolve, reject) => {
      let res = await user.findByIdAndUpdate(userId, { status: "Active" });
      resolve(res);
    });
  },
  getEditData: (userId) => {
    return new Promise(async (resolve, reject) => {
      let userData = await user.findOne({ _id: userId });
      resolve(userData);
    });
  },
  editUserdata: (userData, profile) => {
    if (profile != undefined) {
      profile = IISDOMAIN + profile;
    }
    return new Promise(async (resolve, reject) => {
      let userDetails = await user.findOneAndUpdate(
        { _id: userData._id },
        {
          $set: {
            name: userData.name,
            contact: userData.contact,
            email: userData.email,
            last_update_date: Date.now(),
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
        };
        let historyTab = await usersHistory.create(obj);
        resolve(userDetails);
      } else {
        resolve();
      }
    });
  },
  getMasters: () => {
    return new Promise(async (resolve, reject) => {
      let mastersData = await masters.find({});
      resolve(mastersData);
    });
  },
  getInfra: () => {
    return new Promise(async (resolve, reject) => {
      let infraData = await infra.find({});
      resolve(infraData);
    });
  },
  dashboard: () => {
    let obj = {
      users: 0,
      location: 0,
      warehouse: 0,
      brands: 0,
      products: 0,
    };
    return new Promise(async (resolve, reject) => {
      obj.users = await user.count({});
      obj.location = await infra.count({});
      obj.warehouse = await infra.count({});
      obj.brands = await brands.count({});
      obj.products = await products.count({});
      resolve(obj);
    });
  },
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
  getHighestBrandId: () => {
    // return new Promise(async (resolve, reject) => {
    //     let highestBrandId = await brands.find({}).sort({ brand_id: -1 }).collation({ locale: "en_US", numericOrdering: true }).limit(1)
    //     if (highestBrandId.length != 0) {
    //         let count = highestBrandId[0].brand_id.split("-")[1]
    //         let nextID = Number(count) + 1
    //         console.log(nextID);
    //         resolve(nextID)
    //     }
    //     else {
    //         resolve(1)
    //     }
    // })
  },
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
  getOneBrand: (brandId) => {
    return new Promise(async (resolve, reject) => {
      let data = await brands
        .findOne({ _id: brandId })
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
  deleteBrands: (brandId) => {
    return new Promise(async (resolve, reject) => {
      let data = await brands
        .deleteOne({ _id: brandId })
        .catch((err) => reject(err));
      if (data.deletedCount != 0) {
        resolve({ status: true });
      } else {
        resolve({ staus: false });
      }
    });
  },
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
  getAllProducts: () => {
    return new Promise(async (resolve, reject) => {
      let allProducts = await products.find({});
      resolve(allProducts);
    });
  },
  getBrandBasedPrdouct: (brandName) => {
    return new Promise(async (resolve, reject) => {
      let allProducts = await products.find({ brand_name: brandName });
      resolve(allProducts);
    });
  },
  getImageEditData: (id) => {
    return new Promise(async (resolve, reject) => {
      let data = await products.findOne({ _id: id });
      if (data) {
        resolve(data);
      } else {
        resolve(data);
      }
    });
  },
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
        resolve(data);
      }
    });
  },
  getEditProduct: (productId) => {
    return new Promise(async (resolve, reject) => {
      let data = await products
        .findOne({ _id: productId })
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
  deleteProduct: (productId) => {
    return new Promise(async (resolve, reject) => {
      let data = await products.deleteOne({ _id: productId });
      if (data.deletedCount != 0) {
        resolve(data);
      } else {
        resolve();
      }
    });
  },
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
  getInfra: (infraId) => {
    return new Promise(async (resolve, reject) => {
      let data = await infra.findOne({ _id: infraId });
      if (data) {
        resolve(data);
      } else {
        resolve();
      }
    });
  },
  editInfra: (infraId) => {
    return new Promise(async (resolve, reject) => {
      let data = await infra.updateOne(
        { _id: infraId._id },
        {
          $set: {
            name: infraId.name,
            code: infraId.code,
            address: infraId.address,
            city: infraId.city,
            state: infraId.state,
            country: infraId.country,
            pincode: infraId.pincode,
            warehouse_type: infraId.warehouse_type,
            parent_id: infraId.parent_id,
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
  deleteInfra: (infraId) => {
    return new Promise(async (resolve, reject) => {
      let data = await infra.deleteOne({ _id: infraId });
      if (data.deletedCount != 0) {
        resolve(data);
      } else {
        resolve();
      }
    });
  },
  getLocation: () => {
    return new Promise(async (resolve, reject) => {
      let allLocation = await infra.find({ type_taxanomy: "CPC" });
      resolve(allLocation);
    });
  },
  getAllWarehouse: () => {
    return new Promise(async (resolve, reject) => {
      let data = await infra.find({ type_taxanomy: "Warehouse" });
      resolve(data);
    });
  },
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
        if (trayData[i].tray_category == "WHT") {
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
  getAudit: (bagId) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({ code: bagId });
      resolve(data);
    });
  },
  createMasters: (mastersData) => {
    return new Promise(async (resolve, reject) => {
      let exist = await masters.findOne({
        $or: [
          {
            $and: [{ name: mastersData.name }, { prefix: mastersData.prefix }],
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
  getMasters: (type) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters
        .find({ prefix: type.master_type })
        .sort({ code: 1 })
        .collation({ locale: "en_US", numericOrdering: true });
      resolve(data);
    });
  },
  getOneMaster: (masterId) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.findOne({
        $or: [
          { _id: masterId, sort_id: "No Status" },
          { _id: masterId, sort_id: "Open" },
        ],
      });
      if (data) {
        resolve(data);
      } else {
        resolve();
      }
    });
  },
  editMaster: (editData) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.updateOne(
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
        }
      );
      if (data.matchedCount != 0) {
        resolve({ status: true });
      } else {
        resolve({ status: false });
      }
    });
  },
  delteMaster: (masterId) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.deleteOne({ _id: masterId });
      if (data.deletedCount != 0) {
        resolve({ status: true });
      } else {
        resolve({ status: false });
      }
    });
  },
  itemTracking: () => {
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
      ]);
      resolve(data);
    });
  },
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
      //   if (searchType == "tracking_id") {
      //   allData = await orders.aggregate([
      //     {
      //       $match: {
      //         delivery_status: "Delivered",
      //       },
      //     },
      //     {
      //       $lookup: {
      //         from: "deliveries",
      //         localField: "order_id",
      //         foreignField: "order_id",
      //         as: "delivery",
      //       },
      //     },
      //     {
      //       $unwind: "$delivery",
      //     },
      //     {
      //       $match: {
      //         delivery_status: "Delivered",
      //         "delivery.tracking_id": {
      //           $regex: ".*" + value + ".*",
      //           $options: "i",
      //         },
      //       },
      //     },
      //   ]);
      // } else if (searchType == "uic") {
      //   allData = await orders.aggregate([
      //     {
      //       $match: {
      //         delivery_status: "Delivered",
      //       },
      //     },
      //     {
      //       $lookup: {
      //         from: "deliveries",
      //         localField: "order_id",
      //         foreignField: "order_id",
      //         as: "delivery",
      //       },
      //     },
      //     {
      //       $unwind: "$delivery",
      //     },
      //     {
      //       $match: {
      //         delivery_status: "Delivered",
      //         "delivery.uic_code.code": {
      //           $regex: ".*" + value + ".*",
      //           $options: "i",
      //         },
      //       },
      //     },
      //   ]);
      // }
      if (allData) {
        resolve(allData);
      }
    });
  },
  updateCPCExtra: () => {
    let arr = [
      "B0106",
      "B0110",
      "B0111",
      "B0112",
      "B0113",
      "B0114",
      "B0115",
      "B0116",
      "B0117",
      "B0118",
      "B0119",
      "B0120",
      "B0121",
      "B0122",
      "B0123",
      "B0124",
      "B0125",
      "B0126",
      "B0127",
      "B0128",
      "B0129",
      "B0130",
      "B0131",
      "B0132",
      "B0133",
      "B0134",
      "B0135",
      "B0136",
      "B0137",
      "B0138",
      "B0139",
      "B0140",
      "B0141",
      "B0142",
      "B0143",
      "B0144",
      "B0145",
      "B0146",
      "B0147",
      "B0148",
      "B0149",
      "B0150",
      "B0151",
      "B0152",
      "B0153",
      "B0154",
      "B0201",
      "B0202",
      "B0203",
      "B0204",
      "B0205",
      "B0206",
      "B0207",
      "B0208",
      "B0209",
      "B0210",
      "B0211",
      "B0212",
      "B0213",
      "B0214",
      "B0215",
      "B0216",
      "B0217",
      "B0218",
      "B0219",
      "B0220",
      "B0221",
      "B0222",
      "B0223",
      "B0224",
      "B0225",
      "B0226",
      "B0227",
      "B0228",
      "B0229",
      "B0230",
      "B0231",
      "B0232",
      "B0233",
      "B0234",
      "B0235",
      "B0236",
      "B0237",
      "B0238",
      "B0239",
      "B0240",
      "B0241",
      "B0242",
      "B0243",
      "B0244",
      "B0245",
      "B0246",
      "B0247",
      "B0248",
      "B0249",
      "B0250",
      "B0251",
      "B0252",
      "B0253",
      "B0254",
      "B0255",
      "B0256",
      "B0257",
      "B0258",
      "B0259",
      "B0260",
      "B0261",
      "B0262",
      "B0263",
      "B0264",
      "B0265",
      "B0266",
      "B0267",
      "B0268",
      "B0269",
      "B0270",
      "B0271",
      "B0272",
      "B0273",
      "B0274",
      "B0275",
      "B0276",
      "B0277",
      "B0278",
      "B0279",
      "B0280",
      "B0281",
      "B0282",
      "B0283",
      "B0284",
      "B0285",
      "B0286",
      "B0287",
      "B0288",
      "B0289",
      "B0290",
      "B0291",
      "B0292",
      "B0293",
      "B0294",
      "B0295",
      "B0296",
      "B0297",
      "B0298",
      "B0299",
      "B0300",
    ];
    return new Promise(async (resolve, reject) => {
      let dataOfClosedPmtMMt = await masters.find({
        $or: [
          {
            type_taxanomy: "PMT",
            sort_id: "Closed By Warehouse",
            prefix: "tray-master",
          },
          {
            type_taxanomy: "MMT",
            sort_id: "Closed By Warehouse",
            prefix: "tray-master",
          },
        ],
      });
      for (let x of dataOfClosedPmtMMt) {
        if (x.items.length == x.limit) {
          let updateData = await masters.findOneAndUpdate(
            { code: x.code },
            {
              $set: {
                sort_id: "Closed By Warehouse",
                closed_time_wharehouse: Date.now(),
              },
            }
          );
          for (let y of updateData.items) {
            let deliveryTrack = await delivery.updateMany(
              { tracking_id: y.awbn_number },
              {
                $set: {
                  warehouse_close_date: Date.now(),
                  tray_status: "Closed By Warehouse",
                  tray_location: "Warehouse",
                },
              }
            );
          }
        } else {
          let dataNotFull = await masters.findOneAndUpdate(
            { code: x.code },
            {
              $set: {
                sort_id: "Inuse",
                closed_time_wharehouse: Date.now(),
                issued_user_name: null,
              },
            }
          );
          for (let m of dataNotFull.items) {
            let deliveryTrack = await delivery.updateMany(
              { tracking_id: m.awbn_number },
              {
                $set: {
                  warehouse_close_date: Date.now(),
                  tray_status: "Closed By Warehouse",
                  tray_location: "Warehouse",
                },
              }
            );
          }
        }
      }
      resolve(dataOfClosedPmtMMt);
    });
  },
};
