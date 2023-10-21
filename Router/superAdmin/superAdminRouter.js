/************************************************************************************************** */
/* Express */
const express = require("express");
const router = express.Router();
// user controller
const superAdminController = require("../../Controller/superAdmin/superAdminController");
// Multer
const upload = require("../../Utils/multer");
// BQC SYNC / BLANCOO AUTOMATION
const BqcSynAction = require("../../Utils/blancooAutomation");
// jwt token
const jwt = require("../../Utils/jwt_token");
/* FS */
const fs = require("fs");
/* ELASTIC SEARCH */
const elasticsearch = require("../../Elastic-search/elastic");
const duplicateEntryCheck = require("../../Controller/Duplicate-entry-check/duplicate-entry-check");
/**************************************************************************************************/

/*

@ EXPRESS ROUTERS 

*/

/*--------------------------------CREATE USERS-----------------------------------*/
router.post(
  "/create",
  upload.userProfile.single("profile"),
  async (req, res, next) => {
    1;
    try {
      let data = await superAdminController.createUser(
        req.body,
        req.file ? req.file.filename : undefined
      );
      if (data) {
        if (data.status) {
          res.status(200).json({ status: 0, data: { message: "User Exist" } });
        } else {
          res.status(200).json({
            status: 1,
            data: {
              message: "User is created",
            },
          });
        }
      }
    } catch (error) {
      next(error);
    }
  }
);

/*--------------------------------CREATE BUYERS-----------------------------------*/

router.post(
  "/createBuyer",
  upload.documents.fields([
    { name: "profile" },
    { name: "aadhar_proof" },
    { name: "pan_card_proof" },
    { name: "business_address_proof" },
  ]),
  async (req, res, next) => {
    try {
      let data = await superAdminController.createBuyer(req.body, req.files);
      if (data) {
        if (data.status) {
          res.status(200).json({ status: 0, data: { message: "Buyer Exist" } });
        } else {
          res.status(200).json({
            status: 1,
            data: {
              message: "Buyer is created",
            },
          });
        }
      }
    } catch (error) {
      next(error);
    }
  }
);

/*-----------------------------FETCH LOCATION TYPE--------------------------------------*/
router.post("/location/type/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    let data = await superAdminController.getLocationType(code);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
/*-----------------------------SUP-ADMIN DASHBOARD--------------------------------------*/
router.post("/superAdminDashboard", async (req, res, next) => {
  try {
    let data = await superAdminController.getDashboardData();
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});

/*--------------------------------LOGIN-----------------------------------*/
router.post("/login", async (req, res, next) => {
  try {
    let loginData = await superAdminController.doLogin(req.body);
    if (loginData.status == 1) {
      const jwtToken = jwt.jwtSign(loginData.data, process.env.NODE_ENV);
      if (jwtToken) {
        const updateJwtToken = await superAdminController.updateJwtTokeInDb(
          loginData.data._id,
          jwtToken,
          loginData.data.user_type
        );

        if (updateJwtToken.status == 1) {
          res.status(200).json({
            status: 1,
            data: {
              message: "Login Success",
              jwt: jwtToken,
              user_type: loginData?.data?.user_type,
              data: loginData.data,
              serverType: process.env.NODE_ENV,
            },
          });
        } else {
          res.status(202).json({ data: { message: "server error" } });
        }
      } else {
        res.status(202).json({ data: { message: "server error" } });
      }
    } else if (loginData.status == 2) {
      res.status(202).json({ data: { message: "Wrong username or password" } });
    } else if (loginData.status == 3) {
      res.status(202).json({ data: { message: "admin deactivated" } });
    }
  } catch (error) {
    next(error);
  }
});

/*----------------------------------USER STATUS CHECKING---------------------------------*/
router.post("/check-user-status", async (req, res, next) => {
  try {
    const { username, jwt, user_type } = req.body;
    let data = await superAdminController.checkUserStatus(
      username,
      jwt,
      user_type
    );
    if (data.status == 1) {
      res.status(200).json({
        message: "Active user",
      });
    } else if (data.status == 3) {
      res.status(202).json({
        message: "Admin deactivated",
      });
    } else {
      res.status(202).json({
        message:
          "Another user has logged in with the same username and password. Please log in again.",
      });
    }
  } catch (error) {
    next(error);
  }
});

/*-----------------------------------USERS HISTORY--------------------------------*/
router.post("/getUsersHistoy/:username", async (req, res, next) => {
  try {
    let data = await superAdminController.getUsersHistory(req.params.username);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});

/*----------------------------------CHANGE PASSWORD---------------------------------*/
router.post("/changePassword", async (req, res, next) => {
  try {
    let data = await superAdminController.changePassword(req.body);
    if (data) {
      res.status(200).json({
        message: "Successfully Changed",
      });
    } else {
      res.status(202).json({
        message: "Please Enter Correct Old Password",
      });
    }
  } catch (error) {
    next(error);
  }
});

/*----------------------------Get sales location for buyer ---------------------------------------*/
router.get("/getCpcSalesLocation/", async (req, res) => {
  let data = await superAdminController.getCpcSalesLocation();
  if (data) {
    res.status(200).json({ status: 1, data: { data } });
  } else {
    response.status(501).json({ status: 0, data: { message: "worng" } });
  }
});

/*----------------------------CPC---------------------------------------*/
router.get("/getCpc", async (req, res) => {
  let data = await superAdminController.getCpc();

  if (data) {
    res.status(200).json({ status: 1, data: { data } });
  } else {
    response.status(501).json({ status: 0, data: { message: "worng" } });
  }
});

/*-------------------------------------WAREHOUSE DATA------------------------------*/
router.post("/getWarehouseByLocation", async (req, res) => {
  try {
    const { name, type } = req.body;
    let warehouse = await superAdminController.getWarehouse(name, type);

    if (warehouse) {
      res.status(200).json({ data: { warehouse } });
    }
  } catch (error) {}
});

/*------------------------------DESTINATION-------------------------------------*/
router.get("/designation", async (req, res) => {
  try {
    let designation = await superAdminController.getDesignation();
    if (designation) {
      res.status(200).json({ data: { designation } });
    }
  } catch (error) {}
});

/*-------------------------USERS------------------------------------------*/
router.post("/getUsers", async (req, res) => {
  try {
    let user = await superAdminController.getUsers();
    if (user) {
      res.status(200).json({ data: { user } });
    }
  } catch (error) {}
});

/*----------------------------Get sales users ---------------------------------------*/
router.post("/getsalesUsers", async (req, res) => {
  try {
    const { warehouse, cpc } = req.body;
    let data = await superAdminController.getsalesUsers(warehouse, cpc);
    if (data) {
      res.status(200).json({
        data: data,
        message: "Success",
      });
    } else {
      res.status(202).json({
        message: "Data Not Found",
      });
    }
  } catch (error) {
    next(error);
  }
});

router.post("/getBuyers", async (req, res) => {
  try {
    let user = await superAdminController.getBuyers();
    if (user) {
      res.status(200).json({ data: { user } });
    }
  } catch (error) {}
});
/*-------------------------BUYERS CONNECTED TO SALES MIS------------------------------------------*/
router.post("/buyerConSalesAgent/:username", async (req, res) => {
  try {
    const { username } = req.params;
    let buyer = await superAdminController.buyerConSalesAgent(username);
    if (buyer) {
      res.status(200).json({ data: { buyer } });
    }
  } catch (error) {}
});
/*-----------------------------DEACTIVATE USER--------------------------------------*/
router.post("/userDeactivate/:username", async (req, res) => {
  try {
    let response = await superAdminController.userDeactivate(
      req.params.username
    );
    if (response) {
      res.status(200).json({ data: { message: "Deactivate" } });
    }
  } catch (error) {}
});

/*------------------------------------USER ACTIVATE-------------------------------*/
router.post("/userActivate/:username", async (req, res, next) => {
  try {
    let response = await superAdminController.userActivate(req.params.username);
    if (response) {
      res.status(200).json({ data: { message: "Activate" } });
    }
  } catch (error) {
    next(error);
  }
});

/*------------------------------EDITED USER DATA-------------------------------------*/
router.get("/getEditData/:username", async (req, res) => {
  try {
    let user = await superAdminController.getEditData(req.params.username);
    if (user) {
      res.status(200).json({ data: user });
    }
  } catch (error) {}
});

/*------------------------------EDITED BUYER DATA-------------------------------------*/
router.get("/getEditBuyerData/:buyername", async (req, res) => {
  try {
    const { buyername } = req.params;
    let buyer = await superAdminController.getEditBuyerData(buyername);
    if (buyer) {
      res.status(200).json({ data: buyer });
    }
  } catch (error) {}
});

/*-----------------------------EDIT BUYER--------------------------------------*/

router.post(
  "/editBuyerDetails",
  upload.documents.fields([
    { name: "profile" },
    { name: "aadhar_proof" },
    { name: "pan_card_proof" },
    { name: "business_address_proof" },
  ]),
  async (req, res, next) => {
    try {
      let data = await superAdminController.editBuyerDetails(
        req.body,
        req.files
      );
      if (data) {
        res.status(200).json({ data: data });
      }
    } catch (error) {
      next(error);
    }
  }
);
/*-----------------------------EDIT USER--------------------------------------*/
router.post(
  "/edituserDetails",
  upload.userProfile.single("profile"),
  async (req, res, next) => {
    try {
      let data = await superAdminController.editUserdata(
        req.body,
        req.file ? req.file.filename : undefined
      );
      if (data) {
        res.status(200).json({ data: data });
      }
    } catch (error) {
      next(error);
    }
  }
);

/*-----------------------------CREATE BRANDS--------------------------------------*/
router.post("/createBrands", async (req, res, next) => {
  try {
    let length = 0;
    if (req.body.length == undefined) {
      length = length + 1;
    } else {
      length = req.body.length;
    }
    let data = await superAdminController.createBrands(req.body);
    if (data.status == true) {
      fs.readFile(
        "myjsonfile.json",
        "utf8",
        function readFileCallback(err, datafile) {
          if (err) {
          } else {
            obj = JSON.parse(datafile);
            obj.brandcount = obj.brandcount + length;
            json = JSON.stringify(obj);
            fs.writeFile(
              "myjsonfile.json",
              json,
              "utf8",
              function readFileCallback(err, data) {
                if (err) {
                }
              }
            );
          }
        }
      );
      res.status(200).json({
        message: "Successfullly Created",
      });
    } else {
      res.status(202).json({
        message: "Brand Already Exists",
      });
    }
  } catch (error) {
    next(error);
  }
});

/*-----------------------------BULK BRANDS--------------------------------------*/
router.post("/bulkValidationBrands", async (req, res, next) => {
  try {
    let data = await superAdminController.bulkValidationBrands(req.body);
    if (data.status == true) {
      res.status(200).json({
        message: "Successfully Validated",
      });
    } else {
      res.status(202).json({
        data: data.err,
        message: "Please Check Errors",
      });
    }
  } catch (error) {
    next(error);
  }
});

/*-----------------------------GET HIGHEST BRAND ID--------------------------------------*/
router.post("/getBrandIdHighest", async (req, res, next) => {
  try {
    let obj;
    fs.readFile(
      "myjsonfile.json",
      "utf8",
      function readFileCallback(err, data) {
        if (err) {
        } else {
          obj = JSON.parse(data);
          res.status(200).json({
            data: obj.brandcount,
            partCount: obj.PARTID,
          });
        }
      }
    );
  } catch (error) {
    next(error);
  }
});

/*-----------------------------BRANDS--------------------------------------*/
router.post("/getBrands", async (req, res, next) => {
  try {
    let data = await superAdminController.getBrands();
    if (data) {
      res.status(200).json({
        data: data,
        message: "Success",
      });
    }
  } catch (error) {
    next(error);
  }
});

/*-----------------------------BRANDS ALPHABATICALLY--------------------------------------*/
router.post("/getBrandsAlpha", async (req, res, next) => {
  try {
    let data = await superAdminController.getBrandsAlpha();
    if (data) {
      res.status(200).json({
        data: data,
        message: "Success",
      });
    }
  } catch (error) {
    next(error);
  }
});

/*-----------------------------GET BRAND ONE FOR EDITNG--------------------------------------*/
router.get("/getBrandOne/:brandId", async (req, res, next) => {
  try {
    let data = await superAdminController.getOneBrand(req.params.brandId);
    if (data.status == 1) {
      res.status(200).json({
        data: data.data,
        message: "Success",
      });
    } else if (data.status == 0) {
      res.status(202).json({
        message: "This Brand You Can't Edit",
      });
    } else {
      res.status(202).json({
        message: "No data found",
      });
    }
  } catch (error) {
    next(error);
  }
});

/*-----------------------------EDIT BRAND--------------------------------------*/
router.post("/editBrand", async (req, res, next) => {
  try {
    let data = await superAdminController.editBrands(req.body);
    if (data.status == true) {
      res.status(200).json({
        message: "Successfully Edited",
      });
    } else {
      res.status(202).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});

/*-----------------------------DELETE BRAND--------------------------------------*/
router.post("/deleteBrand/:brandId", async (req, res, next) => {
  try {
    let data = await superAdminController.deleteBrands(req.params.brandId);
    if (data.status == true) {
      res.status(200).json({
        message: "Successfully Deleted",
      });
    } else {
      res.status(202).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});

/*-----------------------------BULK VALIDATION PRODUCT--------------------------------------*/
router.post("/bulkValidationProduct", async (req, res, next) => {
  try {
    let data = await superAdminController.validationBulkProduct(req.body);

    if (data.status == true) {
      res.status(200).json({
        message: "Successfully Validated",
      });
    } else {
      res.status(202).json({
        data: data.err,
        message: "Please Check Errors",
      });
    }
  } catch (error) {
    next(error);
  }
});

/*-----------------------------CREATE PRODUCTS--------------------------------------*/
router.post(
  "/createproducts",
  upload.productImage.single("image"),
  async (req, res, next) => {
    try {
      let data = await superAdminController.createProduct(
        req.body,
        req.file ? req.file.filename : undefined
      );
      if (data.status === true) {
        res.status(200).json({
          message: "Successfully Created",
        });
      } else {
        res.status(202).json({
          message: "Product Exists",
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

/*-----------------------------GET PRODUCTS--------------------------------------*/
router.post("/getAllProducts", async (req, res, next) => {
  try {
    let data = await superAdminController.getAllProducts();
    if (data) {
      res.status(200).json({
        data: data,
        message: "Success",
      });
    }
  } catch (error) {
    next(error);
  }
});

/*-----------------------------GET IMAGE EDIT DATA--------------------------------------*/
router.post("/getImageEditProdt/:id", async (req, res, next) => {
  try {
    let data = await superAdminController.getImageEditData(req.params.id);
    if (data) {
      res.status(200).json({
        message: "Success",
        data: data,
      });
    } else {
      res.status(202).json({
        message: "No Data Found",
      });
    }
  } catch (error) {
    next(error);
  }
});

/*-----------------------------PRODUCT IMAGE--------------------------------------*/
router.post(
  "/editProductImage",
  upload.productImage.single("image"),
  async (req, res, next) => {
    try {
      let data = await superAdminController.editproductImage(
        req.body,
        req.file.filename
      );
      if (data) {
        res.status(200).json({
          message: "Successfully Updated",
        });
      } else {
        res.status(202).json({
          message: "Updation Failed",
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

/*-----------------------------EDIT PRODUCT--------------------------------------*/
router.get("/getEditProduct/:productId", async (req, res, next) => {
  try {
    let data = await superAdminController.getEditProduct(req.params.productId);
    if (data.status == 1) {
      res.status(200).json({
        data: data.data,
        message: "Success",
      });
    } else if (data.status == 3 || data.status == 2) {
      res.status(202).json({
        message: "You Can't Edit This Product",
      });
    } else {
      res.status(202).json({
        message: "No data found",
      });
    }
  } catch (error) {
    next(error);
  }
});

/*-----------------------------EDIT PRODUCT--------------------------------------*/
router.post("/editProduct", async (req, res, next) => {
  try {
    let data = await superAdminController.editproduct(req.body);
    if (data) {
      res.status(200).json({
        message: "Successfully Updated",
      });
    } else {
      res.status(202).json({
        message: "Product Edit Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});

/*-----------------------------DELETE PRODUCT--------------------------------------*/
router.post("/deleteProduct/:productId", async (req, res, next) => {
  try {
    let data = await superAdminController.deleteProduct(req.params.productId);
    if (data) {
      res.status(200).json({
        message: "Successfully Deleted",
      });
    } else {
      res.status(202).json({
        message: "Product delete failed",
      });
    }
  } catch (error) {
    next(error);
  }
});

/*-----------------------------GET PRODUCT MODEL--------------------------------------*/
router.post("/get-product-model/:brandName", async (req, res, next) => {
  try {
    let data = await superAdminController.getBrandBasedPrdouct(
      req.params.brandName
    );

    if (data) {
      res.status(200).json({
        data: data,
        message: "Success",
      });
    }
  } catch (error) {
    next(error);
  }
});

/*-----------------------------ADD LOCATION--------------------------------------*/
router.post("/addLocation", async (req, res, next) => {
  try {
    const { type_taxanomy } = req.body;
    let data = await superAdminController.addLocation(req.body);
    if (data.status == 3) {
      res.status(200).json({
        message: "Successfully Added",
      });
    } else if (data.status == 1) {
      res.status(202).json({
        message: "Already Exists",
      });
    } else {
      res.status(202).json({
        message: `${type_taxanomy} Already Exists`,
      });
    }
  } catch (error) {
    next(error);
  }
});

/*-----------------------------INFRA--------------------------------------*/
router.post("/getInfra", async (req, res, next) => {
  try {
    const { empId, type } = req.body;
    let data = await superAdminController.getInfra(empId, type);
    if (data) {
      res.status(200).json({
        data: data,
        message: "Success",
      });
    } else {
      res.status(202).json({
        message: "Data Not Found",
      });
    }
  } catch (error) {
    next(error);
  }
});

/*-----------------------------GET LOATION--------------------------------------*/

router.post("/getLocation", async (req, res, next) => {
  try {
    let location = await superAdminController.getLocation();
    if (location) {
      res.status(200).json({
        data: location,
        message: "Success",
      });
    }
  } catch (error) {
    next(error);
  }
});

/* GET ONLY PROCESSING WAREHOUSE */
router.post("/getLocationProcessing/:type", async (req, res, next) => {
  try {
    const { type } = req.params;
    let location = await superAdminController.getProcessingLocationFetch(type);
    if (location) {
      res.status(200).json({
        data: location,
        message: "Success",
      });
    }
  } catch (error) {
    next(error);
  }
});

/*-----------------------------EDIT INFRA--------------------------------------*/
router.post("/editInfra", async (req, res, next) => {
  try {
    let data = await superAdminController.editInfra(req.body);
    if (data) {
      res.status(200).json({
        message: "Successfully Updated",
      });
    } else {
      res.status(202).json({
        message: "Updation Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});

/*-----------------------------DELETE INFRA--------------------------------------*/
router.post("/deleteInfra", async (req, res, next) => {
  try {
    const { empId, type } = req.body;
    let data = await superAdminController.deleteInfra(empId, type);
    if (data.status == 1) {
      res.status(200).json({
        message: "Successfully Deleted",
      });
    } else if (data.status == 2) {
      res.status(202).json({
        message: "You can't delete",
      });
    } else {
      res.status(202).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});

/*-----------------------------GET WAREHOUSE--------------------------------------*/
router.post("/getWarehouse", async (req, res, next) => {
  try {
    let data = await superAdminController.getAllWarehouse();
    if (data) {
      res.status(200).json({
        data: data,
        message: "Success",
      });
    }
  } catch (error) {
    next(error);
  }
});

/*-----------------------------BULK VALIDATION BAG--------------------------------------*/
router.post("/bulkValidationBag", async (req, res, next) => {
  try {
    let data = await superAdminController.bulkBagValidation(req.body);
    if (data.status == true) {
      res.status(200).json({
        message: "Successfully Validated",
      });
    } else {
      res.status(202).json({
        data: data.data,
        message: "Please Check Errors",
      });
    }
  } catch (error) {
    next(error);
  }
});

/*-----------------------------TRAY ID GENERATION--------------------------------------*/
router.post("/trayIdGenrate", async (req, res, next) => {
  try {
    const { type, type_taxanomy } = req.body;
    let obj;
    fs.readFile(
      "myjsonfile.json",
      "utf8",
      async function readFileCallback(err, data) {
        if (err) {
        } else {
          obj = JSON.parse(data);
          if (type == "PMT") {
            res.status(200).json({
              data: obj.PMT,
            });
          } else if (type == "MMT") {
            res.status(200).json({
              data: obj.MMT,
            });
          } else if (type == "BOT") {
            res.status(200).json({
              data: obj.BOT,
            });
          } else if (type == "WHT") {
            res.status(200).json({
              data: obj.WHT,
            });
          } else if (type == "SPT") {
            res.status(200).json({
              data: obj.SPT,
            });
          } else if (type == "RPT") {
            res.status(200).json({
              data: obj.RPT,
            });
          }
          //  else if (type == "CTA") {
          //   res.status(200).json({
          //     data: obj.CTA,
          //   });
          // } else if (type == "CTB") {
          //   res.status(200).json({
          //     data: obj.CTB,
          //   });
          // } else if (type == "CTC") {
          //   res.status(200).json({
          //     data: obj.CTC,
          //   });
          // } else if (type == "CTD") {
          //   res.status(200).json({
          //     data: obj.CTD,
          //   });
          // }
          else if (type == "tray-master") {
            res.status(200).json({
              data: obj,
            });
          } else {
            let checkLimit = await superAdminController.ctxCategoryLimit(
              type,
              obj[type_taxanomy + type]
            );
            if (checkLimit.status == 2) {
              res.status(202).json({
                message: `${type}-tray limit exceeded`,
              });
            } else {
              res.status(200).json({
                data: obj[type_taxanomy + type],
              });
            }
          }
        }
      }
    );
  } catch (error) {
    next(error);
  }
});

/*-----------------------------GET HIGHEST MASTER ID FOR BAG--------------------------------------*/
router.post("/getMasterHighest/:prefix", async (req, res, next) => {
  try {
    if (
      req.params.prefix == "Gurgaon_122016" ||
      req.params.prefix == "Gurgaon_122003"
    ) {
      let obj;
      fs.readFile(
        "myjsonfile.json",
        "utf8",
        function readFileCallback(err, data) {
          if (err) {
          } else {
            obj = JSON.parse(data); //now it an object
            res.status(200).json({
              data: obj.bagGurgaon,
            });
          }
        }
      );
    } else if (req.params.prefix == "bag-master") {
      let obj;
      fs.readFile(
        "myjsonfile.json",
        "utf8",
        function readFileCallback(err, data) {
          if (err) {
          } else {
            obj = JSON.parse(data); //now it an object
            let count = {
              bagBanglore: obj.bagBanglore,
              bagGurgaon: obj.bagGurgaon,
            };
            res.status(200).json({
              data: count,
            });
          }
        }
      );
    } else {
      let obj;
      fs.readFile(
        "myjsonfile.json",
        "utf8",
        function readFileCallback(err, data) {
          if (err) {
          } else {
            obj = JSON.parse(data); //now it an object
            res.status(200).json({
              data: obj.bagBanglore,
            });
          }
        }
      );
    }
    // let data = await superAdminController.getHighestId(req.params.prefix)
  } catch (error) {
    next(error);
  }
});

/*-----------------------------BULK VALIDATION TRAY--------------------------------------*/
router.post("/bulkValidationTray", async (req, res, next) => {
  try {
    let data = await superAdminController.bulkValidationTray(req.body);
    if (data.status == true) {
      res.status(200).json({
        dupId: data.dup,
        message: "Successfully Validated",
      });
    } else {
      res.status(202).json({
        data: data.data,
        dupId: data.dup,
        message: "Please Check Errors",
      });
    }
  } catch (error) {
    next(error);
  }
});

/*-----------------------------CREATE BULK TRAY--------------------------------------*/
router.post("/createBulkTray", async (req, res, next) => {
  try {
    const { allCount } = req.body;
    let data = await superAdminController.addbulkTray(req.body.item);
    if (data) {
      fs.readFile(
        "myjsonfile.json",
        "utf8",
        function readFileCallback(err, datafile) {
          if (err) {
          } else {
            obj = JSON.parse(datafile);
            for (let key in allCount) {
              console.log(key, allCount[key]);
              obj[key] = allCount[key];
            }

            console.log(obj);

            json = JSON.stringify(obj);
            fs.writeFile(
              "myjsonfile.json",
              json,
              "utf8",
              function readFileCallback(err, data) {
                if (err) {
                }
              }
            ); // write it back
          }
        }
      );
      res.status(200).json({
        message: "Successfully Created",
      });
    }
  } catch (error) {
    next(error);
  }
});

/*-----------------------------CREATE BULK BAG--------------------------------------*/
router.post("/createBulkBag", async (req, res, next) => {
  try {
    let data = await superAdminController.addBulkBag(req.body);
    if (data) {
      fs.readFile(
        "myjsonfile.json",
        "utf8",
        function readFileCallback(err, datafile) {
          if (err) {
          } else {
            obj = JSON.parse(datafile);
            let blr = req.body.filter(
              (data) => data.cpc == "Bangalore_560067"
            ).length;
            obj.bagBanglore = obj.bagBanglore + blr;
            let ggrn = req.body.filter(
              (data) =>
                data.cpc == "Gurgaon_122016" || data.cpc == "Gurgaon_122003"
            ).length;
            obj.bagGurgaon = obj.bagGurgaon + ggrn;
            json = JSON.stringify(obj);
            fs.writeFile(
              "myjsonfile.json",
              json,
              "utf8",
              function readFileCallback(err, data) {
                if (err) {
                }
              }
            ); // write it back
          }
        }
      );
      res.status(200).json({
        message: "Successfully Created",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* Get Audit */
router.post("/getAudit/:bagId", async (req, res, next) => {
  try {
    let data = await superAdminController.getAudit(req.params.bagId);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});

/*--------------------------------CREATE BAG-----------------------------------*/
router.post("/createMasters", async (req, res, next) => {
  try {
    const { type_taxanomy, cpc, tray_grade } = req.body;
    let data = await superAdminController.createMasters(req.body);
    if (data) {
      if (req.body.prefix == "bag-master") {
        fs.readFile(
          "myjsonfile.json",
          "utf8",
          function readFileCallback(err, datafile) {
            if (err) {
            } else {
              obj = JSON.parse(datafile);
              if (cpc == "Gurgaon_122016") {
                obj.bagGurgaon = obj.bagGurgaon + 1;
              } else if (cpc == "Bangalore_560067") {
                obj.bagBanglore = obj.bagBanglore + 1;
              }
              json = JSON.stringify(obj);
              fs.writeFile(
                "myjsonfile.json",
                json,
                "utf8",
                function readFileCallback(err, data) {
                  if (err) {
                  }
                }
              );
            }
          }
        );
      } else {
        fs.readFile(
          "myjsonfile.json",
          "utf8",
          function readFileCallback(err, datafile) {
            if (err) {
            } else {
              obj = JSON.parse(datafile);
              if (type_taxanomy == "BOT") {
                obj.BOT = obj.BOT + 1;
              } else if (type_taxanomy == "PMT") {
                obj.PMT = obj.PMT + 1;
              } else if (type_taxanomy == "MMT") {
                obj.MMT = obj.MMT + 1;
              } else if (type_taxanomy == "WHT") {
                obj.WHT = obj.WHT + 1;
              } else if (type_taxanomy == "SPT") {
                obj.SPT = obj.SPT + 1;
              } else if (type_taxanomy == "RPT") {
                obj.RPT = obj.RPT + 1;
              } else {
                obj[type_taxanomy + tray_grade] =
                  obj[type_taxanomy + tray_grade] + 1;
              }
              //  else if (type_taxanomy == "CTA") {
              //   obj.CTA = obj.CTA + 1;
              // } else if (type_taxanomy == "CTB") {
              //   obj.CTB = obj.CTB + 1;
              // } else if (type_taxanomy == "CTC") {
              //   obj.CTC = obj.CTC + 1;
              // } else if (type_taxanomy == "CTD") {
              //   obj.CTD = obj.CTD + 1;
              // }
              json = JSON.stringify(obj);
              fs.writeFile(
                "myjsonfile.json",
                json,
                "utf8",
                function readFileCallback(err, data) {
                  if (err) {
                  }
                }
              );
            }
          }
        );
      }
      res.status(200).json({
        message: "Successfully Created",
      });
    } else {
      res.status(202).json({
        message: "Creation Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});

/*-----------------------------GET MASTERS--------------------------------------*/
router.post("/getMasters", async (req, res, next) => {
  try {
    let data = await superAdminController.getMasters(req.body);
    if (data) {
      res.status(200).json({
        data: data,
        message: "Success",
      });
    }
  } catch (error) {
    next(error);
  }
});

/*-----------------------------GET ONE MASTER--------------------------------------*/
router.post("/getOneMaster", async (req, res, ne) => {
  try {
    const { masterId } = req.body;
    let data = await superAdminController.getOneMaster(masterId);
    if (data) {
      res.status(200).json({
        data: data,
      });
    } else {
      res.status(202).json({
        message: "You Can't Edit This Bag",
      });
    }
  } catch (error) {
    next(error);
  }
});

/*-----------------------------EDIT MASTER--------------------------------------*/
router.post("/editMaster", async (req, res, next) => {
  try {
    let data = await superAdminController.editMaster(req.body);
    if (data.status) {
      res.status(200).json({
        message: "Successfully Updated",
      });
    } else {
      res.status(202).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});

/*----------------------------EDIT MASTER--------------------------------------*/
router.post("/mastersEditHistory/:trayId", async (req, res, next) => {
  try {
    const { trayId } = req.params;
    let data = await superAdminController.getMasterEditHistory(trayId);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});

/*-----------------------------DELETE MASTER--------------------------------------*/
router.post("/deleteMaster/:masterId", async (req, res, next) => {
  try {
    let data = await superAdminController.delteMaster(req.params.masterId);
    if (data.status) {
      res.status(200).json({
        message: "Successfully Deleted",
      });
    } else {
      res.status(202).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});

/*-----------------------------ITEM TRACKING--------------------------------------*/
router.post("/itemTracking/:page/:size", async (req, res, next) => {
  try {
    let { page, size } = req.params;

    page++;
    const limit = parseInt(size);
    const skip = (page - 1) * size;
    let data = await superAdminController.itemTracking(limit, skip);
    if (data) {
      res.status(200).json({
        data: data.data,
        count: data.count,
      });
    }
  } catch (error) {
    next(error);
  }
});

/*-----------------------------SEARCH TRACK ITEM--------------------------------------*/
router.post("/search-admin-track-item", async (req, res, next) => {
  try {
    const { type, searchData, location, rowsPerPage, page } = req.body;

    let data = await elasticsearch.superAdminTrackItemSearchData(
      searchData,
      page,
      rowsPerPage
    );
    if (data.searchResult.length != 0) {
      res.status(200).json({
        data: data.searchResult,
        count: data.count,
      });
    } else {
      res.status(202).json({
        data: data.searchResult,
        count: data.count,
      });
    }
  } catch (error) {
    next(error);
  }
});
/*-----------------------------GET INUSE WHT--------------------------------------*/
router.post("/getInuseWht", async (req, res, next) => {
  try {
    let whtTray = await superAdminController.getWhtTrayInuse();
    if (whtTray) {
      res.status(200).json({
        data: whtTray,
      });
    }
  } catch (error) {
    next(error);
  }
});

/*-----------------------------READY FOR CHARGING--------------------------------------*/
router.post("/ready-for-charging", async (req, res, next) => {
  try {
    const { ischeck, status } = req.body;
    let data = await superAdminController.readyForCharging(ischeck, status);
    if (data.status === 1) {
      res.status(200).json({
        message: "Successfully Sent to MIS",
      });
    } else {
      res.status(202).json({
        message: "Failed Please Try again..",
      });
    }
  } catch (error) {
    next(error);
  }
});

/*----------------------------GET INVALID ITEM PRESENT BAG--------------------------------------*/
router.post("/getInvalidItemPresentBag", async (req, res, next) => {
  try {
    let data = await superAdminController.getInvalidItemBag();
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
/*-----------------------------GET BAG ITEM INVALID--------------------------------------*/
router.post("/getBagItemInvalid/:bagId", async (req, res, next) => {
  try {
    const { bagId } = req.params;
    let data = await superAdminController.getInvalidItemForBag(bagId);

    if (data.status == 1) {
      res.status(200).json({
        data: data.data,
      });
    } else if (data.status == 2) {
      res.status(202).json({
        message: `${bagId} present at - ${data.data.sort_id}`,
      });
    } else {
      res.status(202).json({
        message: "details not found",
      });
    }
  } catch (error) {
    next(error);
  }
});

/*-----------------------------BQC REPORT--------------------------------------*/
router.post("/bqcReport/:uic", async (req, res, next) => {
  try {
    const { uic } = req.params;
    let data = await superAdminController.getBqcReport(uic);
    if (data.status === 1) {
      res.status(200).json({
        data: data.data,
      });
    } else if (data.status === 2) {
      res.status(202).json({
        message: "UIC does not exists",
      });
    } else if (data.status === 3) {
      res.status(202).json({
        message: "BQC report not created yet",
      });
    }
  } catch (error) {
    next(error);
  }
});

/*-----------------------------------------CHARGE DONE 4 DIFF TRAY------------------------------------------------*/
router.post("/chargeDoneFourDifferenceTray", async (req, res, next) => {
  try {
    let data = await superAdminController.chargeDoneTrayFourDayDiff();
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});

/*-----------------------------------------GET AUDIT DONE WHT TRAY------------------------------------------------*/
router.post("/auditDoneWht", async (req, res, next) => {
  try {
    let data = await superAdminController.getAuditDone();
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
/*-----------------------------------------GET AUDIT DONE WHT TRAY------------------------------------------------*/
router.post("/ctxTray/closedByWh", async (req, res, next) => {
  try {
    let data = await superAdminController.ctxTrayClosedByWh();
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
// SEND TO RDL
router.post("/forceFullReadySend", async (req, res, next) => {
  try {
    const { ischeck, type } = req.body;
    let data = await superAdminController.forceFullReadySendSup(ischeck, type);
    if (data.status == 1) {
      res.status(200).json({
        message: "Successfully sent MIS",
      });
    } else {
      res.status(202).json({
        message: "Request failed please tray again...",
      });
    }
  } catch (error) {
    next(error);
  }
});

/*--------------------------------------------------------------------------------------------------------------*/
// CREATE CATEGORY
router.post("/createCategory", async (req, res, next) => {
  try {
    const createCategoryRes = await superAdminController.createCategoryMaster(
      req.body
    );
    if (createCategoryRes.status == 1) {
      res.status(200).json({
        message: "Successfully Created",
      });
    } else {
      res.status(202).json({
        message: "Category already existed",
      });
    }
  } catch (error) {
    next(error);
  }
});
// VIEW ALL THE CATEGORY
router.post("/viewCategory", async (req, res, next) => {
  try {
    let categoryData = await superAdminController.findAllCategory();
    if (categoryData) {
      res.status(200).json({
        data: categoryData,
      });
    }
  } catch (error) {
    next(error);
  }
});
router.post("/addcategory", async (req, res, next) => {
  try {
    const { code, sereis_start } = req.body;
    let data = await superAdminController.createctxcategory(req.body);
    if (data.status == true) {
      fs.readFile(
        "myjsonfile.json",
        "utf8",
        function readFileCallback(err, datafile) {
          if (err) {
          } else {
            obj = JSON.parse(datafile);
            obj["CT" + code] = sereis_start;
            obj["ST" + code] = sereis_start;
            json = JSON.stringify(obj);
            fs.writeFile(
              "myjsonfile.json",
              json,
              "utf8",
              function readFileCallback(err, data) {
                if (err) {
                }
              }
            );
          }
        }
      );
      res.status(200).json({
        message: "Successfully category Added",
      });
    } else {
      res.status(202).json({
        message: "Please check your category or float or sereis",
      });
    }
  } catch (error) {
    next(error);
  }
});

router.post("/getCtxCategorys", async (req, res, next) => {
  try {
    let data = await superAdminController.getCtxCategorys();

    if (data) {
      res.status(200).json(data);
    } else {
      res.status(202).json({ error: "CTX ctaegory not Exist" });
    }
  } catch (error) {
    next(error);
  }
});

router.post("/deleteCtxcategory/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    let data = await superAdminController.deleteCtxcategory(code);
    if (data.acknowledged == true) {
      res.status(200).json(data);
    } else if (data.status == false) {
      res.status(202).json({ error: "you can't delete this category " });
    } else {
      res.status(202).json({ error: "you can't delete this category " });
    }
  } catch (error) {
    next(error);
  }
});

router.get("/geteditctxcategory/:code", async (req, res) => {
  try {
    let user = await superAdminController.geteditctxcategory(req.params.code);
    if (user) {
      res.status(200).json({ data: user });
    }
  } catch (error) {
    next(error);
  }
});

router.post("/editctxcategory", async (req, res, next) => {
  try {
    let user = await superAdminController.editctxcategory(req.body);
    if (user.status == true) {
      res.status(200).json({ message: "Done" });
    } else {
      res.status(202).json({ error: "Category Already exist" });
    }
  } catch (error) {
    next(error);
  }
});

router.get("/getCtxTrayCategory", async (req, res) => {
  try {
    let ctxCategory = await superAdminController.getCtxTrayCategory();
    if (ctxCategory) {
      res.status(200).json(ctxCategory);
    }
  } catch (error) {
    next(error);
  }
});

router.post("/categoryCheck", async (req, res, next) => {
  try {
    let user = await superAdminController.categoryCheck(req.body);
    if (user?.status == true) {
      res.status(200).json({ Exist: true });
    } else {
      res.status(202).json({ Exist: false });
    }
  } catch (error) {
    next(error);
  }
});

/*----------------------------------------------SP CATEGORIES ----------------------------------------------------*/
// GET ALL THE SP CATEGORIES
router.post("/spcategories/view", async (req, res, next) => {
  try {
    const spcategoriesData = await superAdminController.getAllSPCategories();
    if (spcategoriesData) {
      res.status(200).json({
        data: spcategoriesData,
      });
    }
  } catch (error) {
    next(error);
  }
});

// CREATE SP CATEGORIES
router.post("/spcategories/create", async (req, res, next) => {
  try {
    const spcategoriesData = await superAdminController.createspcategories(
      req.body
    );
    if (spcategoriesData.status == 1) {
      fs.readFile(
        "myjsonfile.json",
        "utf8",
        function readFileCallback(err, datafile) {
          if (err) {
          } else {
            obj = JSON.parse(datafile);
            let num = parseInt(obj.SPCATID.substring(3)) + 1;
            let updatedStr =
              obj.SPCATID.substring(0, 3) + num.toString().padStart(6, "0");
            obj.SPCATID = updatedStr;
            json = JSON.stringify(obj);
            fs.writeFile(
              "myjsonfile.json",
              json,
              "utf8",
              function readFileCallback(err, data) {
                if (err) {
                }
              }
            );
          }
        }
      );
      res.status(200).json({
        message: "Successfully Created",
      });
    } else if (spcategoriesData.status == 2) {
      res.status(202).json({
        message: "Already Created",
      });
    } else {
      res.status(202).json({
        message: "Creation Failed...",
      });
    }
  } catch (error) {
    next(error);
  }
});

router.post("/addspcategory", async (req, res, next) => {
  try {
    const { code, sereis_start } = req.body;
    let data = await superAdminController.createctxcategory(req.body);
    if (data.status == true) {
      // fs.readFile(
      //   "myjsonfile.json",
      //   "utf8",
      //   function readFileCallback(err, datafile) {
      //     if (err) {
      //     } else {
      //       obj = JSON.parse(datafile);
      //       obj["CT" + code] = sereis_start;
      //       obj["ST" + code] = sereis_start;
      //       json = JSON.stringify(obj);
      //       fs.writeFile(
      //         "myjsonfile.json",
      //         json,
      //         "utf8",
      //         function readFileCallback(err, data) {
      //           if (err) {
      //           }
      //         }
      //       );
      //     }
      //   }
      // );
      res.status(200).json({
        message: "Successfully category Added",
      });
    } else {
      res.status(202).json({
        message: "not working",
      });
    }
  } catch (error) {
    next(error);
  }
});

// SPCATID GEN
router.post("/spcategories/idGen", async (req, res, next) => {
  try {
    let obj;
    fs.readFile(
      "myjsonfile.json",
      "utf8",
      async function readFileCallback(err, data) {
        if (err) {
        } else {
          obj = JSON.parse(data);
          res.status(200).json({
            spctID: obj.SPCATID,
          });
        }
      }
    );
  } catch (error) {
    next(error);
  }
});

// EDIT SP CATEGORIES
router.post("/spcategories/edit", async (req, res, next) => {
  try {
    const spcategoriesData = await superAdminController.editspcategories(
      req.body
    );
    if (spcategoriesData.status == 1) {
      res.status(200).json({
        message: "Successfully Updated",
      });
    } else {
      res.status(202).json({
        message: "Updation Failed...",
      });
    }
  } catch (error) {
    next(error);
  }
});

router.get("/geteditSPcategory/:spcategory_id", async (req, res) => {
  try {
    let user = await superAdminController.geteditSPcategory(
      req.params.spcategory_id
    );
    if (user) {
      res.status(200).json({ data: user });
    }
  } catch (error) {
    next(error);
  }
});

// GET ONE CATEGORY
router.post("/spcategories/one/:categoriesId", async (req, res, next) => {
  try {
    const { categoriesId } = req.params;
    const spcategoriesData = await superAdminController.getOneSPcategory(
      categoriesId
    );
    if (spcategoriesData.status == 1) {
      res.status(200).json({
        data: spcategoriesData.data,
      });
    } else {
      res.status(200).json({
        message: "No data found",
      });
    }
  } catch (error) {
    next(error);
  }
});

router.get("/getAllSPCategories", async (req, res) => {
  try {
    let spcategoriesData = await superAdminController.getAllSPCategories();
    if (spcategoriesData) {
      res.status(200).json(spcategoriesData);
    }
  } catch (error) {
    next(error);
  }
});

router.post("/deleteSPcategory/:spcategory_id", async (req, res, next) => {
  try {
    let data = await superAdminController.deleteSPcategory(
      req.params.spcategory_id
    );
    if (data.status == true) {
      res.status(200).json({
        message: "Successfully Deleted",
      });
    } else {
      res.status(202).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});

router.get("/geteditSPcategory/:code", async (req, res) => {
  try {
    let user = await superAdminController.geteditSPcategory(req.params.code);
    if (user) {
      res.status(200).json({ data: user });
    }
  } catch (error) {
    next(error);
  }
});
/*----------------------------------------------Tray Racks ----------------------------------------------------*/
// GET ALL THE Tray Racks
router.post("/trayracks/view", async (req, res, next) => {
  try {
    const trayracksData = await superAdminController.getAllTrayRacks();
    if (trayracksData) {
      res.status(200).json({
        data: trayracksData,
      });
    }
  } catch (error) {
    next(error);
  }
});

/* ---------------------------GET RACK BASED ON THE WAREHOUSE ------------------*/
router.post("/trayracks/view/:warehouse", async (req, res, next) => {
  try {
    const { warehouse } = req.params;
    const trayracksData = await superAdminController.getRackBasedOnTheWarehouse(
      warehouse
    );
    console.log(trayracksData);
    if (trayracksData) {
      res.status(200).json({
        data: trayracksData,
      });
    }
  } catch (error) {
    next(error);
  }
});
/*-----------------------------GET Rack ID--------------------------------------*/

router.post("/getRackID", async (req, res, next) => {
  try {
    let rackid = await superAdminController.getRackID();
    if (rackid) {
      res.status(200).json({
        data: rackid,
        message: "Success",
      });
    }
  } catch (error) {
    next(error);
  }
});

// CREATE Tray Racks
router.post("/trayracks/create", async (req, res, next) => {
  try {
    const trayracksData = await superAdminController.createTrayRacks(req.body);
    if (trayracksData.status == 1) {
      fs.readFile(
        "myjsonfile.json",
        "utf8",
        function readFileCallback(err, datafile) {
          if (err) {
          } else {
            obj = JSON.parse(datafile);
            let num = parseInt(obj.RACKID.substring(3)) + 1;
            let updatedStr =
              obj.RACKID.substring(0, 3) + num.toString().padStart(6, "0");
            obj.RACKID = updatedStr;
            json = JSON.stringify(obj);
            fs.writeFile(
              "myjsonfile.json",
              json,
              "utf8",
              function readFileCallback(err, data) {
                if (err) {
                }
              }
            );
          }
        }
      );
      res.status(200).json({
        message: "Successfully Created",
      });
    } else if (trayracksData.status == 2) {
      res.status(202).json({
        message: "Already Created",
      });
    } else {
      res.status(202).json({
        message: "Creation Failed...",
      });
    }
  } catch (error) {
    next(error);
  }
});

router.post("/addTrayRacks", async (req, res, next) => {
  try {
    const { code, sereis_start } = req.body;
    let data = await superAdminController.createctxcategory(req.body);
    if (data.status == true) {
      // fs.readFile(
      //   "myjsonfile.json",
      //   "utf8",
      //   function readFileCallback(err, datafile) {
      //     if (err) {
      //     } else {
      //       obj = JSON.parse(datafile);
      //       obj["CT" + code] = sereis_start;
      //       obj["ST" + code] = sereis_start;
      //       json = JSON.stringify(obj);
      //       fs.writeFile(
      //         "myjsonfile.json",
      //         json,
      //         "utf8",
      //         function readFileCallback(err, data) {
      //           if (err) {
      //           }
      //         }
      //       );
      //     }
      //   }
      // );
      res.status(200).json({
        message: "Successfully category Added",
      });
    } else {
      res.status(202).json({
        message: "not working",
      });
    }
  } catch (error) {
    next(error);
  }
});

// RACKID GEN
router.post("/trayracks/idGen", async (req, res, next) => {
  try {
    let obj;
    fs.readFile(
      "myjsonfile.json",
      "utf8",
      async function readFileCallback(err, data) {
        if (err) {
        } else {
          obj = JSON.parse(data);
          res.status(200).json({
            rackID: obj.RACKID,
          });
        }
      }
    );
  } catch (error) {
    next(error);
  }
});

// EDIT Tray Racks
router.post("/trayracks/edit", async (req, res, next) => {
  try {
    const trayracksData = await superAdminController.editTrayRacks(req.body);
    if (trayracksData.status == 1) {
      res.status(200).json({
        message: "Successfully Updated",
      });
    } else if (trayracksData.status == 3) {
      res.status(202).json({
        message: "You can't set limit less than tray count",
      });
    } else {
      res.status(202).json({
        message: "Updation Failed...",
      });
    }
  } catch (error) {
    next(error);
  }
});

router.get("/geteditTrayRacks/:rack_id", async (req, res) => {
  try {
    let user = await superAdminController.geteditTrayRacks(req.params.rack_id);
    if (user) {
      res.status(200).json({ data: user });
    }
  } catch (error) {
    next(error);
  }
});

// GET ONE Tray Rack
router.post("/trayracks/one/:trayRackId", async (req, res, next) => {
  try {
    const { trayRackId } = req.params;
    const trayracksData = await superAdminController.getOneTrayRack(trayRackId);
    if (trayracksData.status == 1) {
      res.status(200).json({
        data: trayracksData.data,
      });
    } else if (trayracksData.status == 3) {
      res.status(202).json({
        message: "You can't Edit this rack",
      });
    } else {
      res.status(202).json({
        message: "No data found",
      });
    }
  } catch (error) {
    next(error);
  }
});

router.get("/getAllTrayRacks", async (req, res) => {
  try {
    let trayracksData = await superAdminController.getAllTrayRacks();
    if (trayracksData) {
      res.status(200).json(trayracksData);
    }
  } catch (error) {
    next(error);
  }
});

router.post("/deleteTrayRacks/:rack_id", async (req, res, next) => {
  try {
    let data = await superAdminController.deleteTrayRacks(req.params.rack_id);
    if (data.status == true) {
      res.status(200).json({
        message: "Successfully Deleted",
      });
    } else if (data?.status == 2) {
      res.status(202).json({
        message: "This rack You Can't Delete",
      });
    } else {
      res.status(202).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});

router.get("/geteditTrayRacks/:code", async (req, res) => {
  try {
    let user = await superAdminController.geteditTrayRacks(req.params.code);
    if (user) {
      res.status(200).json({ data: user });
    }
  } catch (error) {
    next(error);
  }
});

/*----------------------------------------------Boxes ----------------------------------------------------*/
// GET ALL THE boxes
router.post("/boxes/view", async (req, res, next) => {
  try {
    const boxesData = await superAdminController.getAllBoxes();
    if (boxesData) {
      res.status(200).json({
        data: boxesData,
      });
    }
  } catch (error) {
    next(error);
  }
});

/*-----------------------------GET Box ID--------------------------------------*/

router.post("/getBoxID", async (req, res, next) => {
  try {
    let boxid = await superAdminController.getBoxID();
    if (boxid) {
      res.status(200).json({
        data: boxid,
        message: "Success",
      });
    }
  } catch (error) {
    next(error);
  }
});

// CREATE Boxes
router.post("/boxes/create", async (req, res, next) => {
  try {
    const boxesData = await superAdminController.createBoxes(req.body);
    if (boxesData.status == 1) {
      fs.readFile(
        "myjsonfile.json",
        "utf8",
        function readFileCallback(err, datafile) {
          if (err) {
          } else {
            obj = JSON.parse(datafile);
            let num = parseInt(obj.BOXID.substring(3)) + 1;
            let updatedStr =
              obj.BOXID.substring(0, 3) + num.toString().padStart(6, "0");
            obj.BOXID = updatedStr;
            json = JSON.stringify(obj);
            fs.writeFile(
              "myjsonfile.json",
              json,
              "utf8",
              function readFileCallback(err, data) {
                if (err) {
                }
              }
            );
          }
        }
      );
      res.status(200).json({
        message: "Successfully Created",
      });
    } else if (boxesData.status == 2) {
      res.status(202).json({
        message: "Already Created",
      });
    } else {
      res.status(202).json({
        message: "Creation Failed...",
      });
    }
  } catch (error) {
    next(error);
  }
});

// BOXID GEN
router.post("/boxes/idGen", async (req, res, next) => {
  try {
    let obj;
    fs.readFile(
      "myjsonfile.json",
      "utf8",
      async function readFileCallback(err, data) {
        if (err) {
        } else {
          obj = JSON.parse(data);
          res.status(200).json({
            boxID: obj.BOXID,
          });
        }
      }
    );
  } catch (error) {
    next(error);
  }
});

// EDIT Box
router.post("/boxes/edit", async (req, res, next) => {
  try {
    const boxesData = await superAdminController.editBoxes(req.body);
    if (boxesData.status == 1) {
      res.status(200).json({
        message: "Successfully Updated",
      });
    } else {
      res.status(202).json({
        message: "Updation Failed...",
      });
    }
  } catch (error) {
    next(error);
  }
});

router.get("/geteditBoxes/:box_id", async (req, res) => {
  try {
    let user = await superAdminController.geteditBoxes(req.params.box_id);
    if (user) {
      res.status(200).json({ data: user });
    }
  } catch (error) {
    next(error);
  }
});

// GET ONE Box
router.post("/boxes/one/:boxId", async (req, res, next) => {
  try {
    const { boxId } = req.params;
    const boxesData = await superAdminController.getOneBox(boxId);
    if (boxesData.status == 1) {
      res.status(200).json({
        data: boxesData.data,
      });
    } else {
      res.status(200).json({
        message: "No data found",
      });
    }
  } catch (error) {
    next(error);
  }
});

router.get("/getAllBoxes", async (req, res) => {
  try {
    let boxesData = await superAdminController.getAllBoxes();
    if (boxesData) {
      res.status(200).json(boxesData);
    }
  } catch (error) {
    next(error);
  }
});

router.post("/deleteBoxes/:box_id", async (req, res, next) => {
  try {
    let data = await superAdminController.deleteBoxes(req.params.box_id);
    if (data.status == true) {
      res.status(200).json({
        message: "Successfully Deleted",
      });
    } else {
      res.status(202).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});

router.get("/geteditBoxes/:code", async (req, res) => {
  try {
    let user = await superAdminController.geteditBoxes(req.params.code);
    if (user) {
      res.status(200).json({ data: user });
    }
  } catch (error) {
    next(error);
  }
});

/*-------------------------------------------Payments--------------------------------------------*/

// GET ALL THE boxes
router.post("/payments/view", async (req, res, next) => {
  try {
    const warrantyData = await superAdminController.getAllWarranty();
    if (warrantyData) {
      res.status(200).json({
        data: warrantyData,
      });
    }
  } catch (error) {
    next(error);
  }
});

//create
router.post("/payments/create", async (req, res, next) => {
  try {
    const data = await superAdminController.createPayment(req.body);
    if (data.status == 1) {
      res.status(200).json({
        message: "Successfully Added",
      });
    } else if (data.status == 2) {
      res.status(202).json({
        message: "Already Created",
      });
    } else {
      res.status(202).json({
        message: "Failed Please Tray again...",
      });
    }
  } catch (error) {
    next(error);
  }
});

//VIEW
router.post("/payments/view/:type", async (req, res, next) => {
  try {
    const { type } = req.params;
    const data = await superAdminController.viewPayment(type);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});

// EDIT Payment
router.post("/payments/edit", async (req, res, next) => {
  try {
    const paymentsData = await superAdminController.editPayment(req.body);
    if (paymentsData.status == 1) {
      res.status(200).json({
        message: "Successfully Updated",
      });
    } else {
      res.status(202).json({
        message: "Updation Failed...",
      });
    }
  } catch (error) {
    next(error);
  }
});

router.get("/geteditPayment/:name", async (req, res) => {
  try {
    let user = await superAdminController.geteditPayment(req.params.name);
    if (user) {
      res.status(200).json({ data: user });
    }
  } catch (error) {
    next(error);
  }
});

router.post("/deletePayments/:name", async (req, res, next) => {
  try {
    // const { id, type, page } = req.body;
    const data = await superAdminController.deletePayment(req.params.name);
    if (data.status == true) {
      res.status(200).json({
        message: "Successfully Deleted",
      });
    } else {
      res.status(202).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});

// get one data only for payment
router.post("/payments/one/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await superAdminController.viewOnePayment(id);
    if (data.status == 1) {
      res.status(200).json({
        data: data.data,
      });
    } else {
      res.status(202).json({
        message: "No Data found",
      });
    }
  } catch (error) {
    next(error);
  }
});

/*-------------------------------------------Warranty--------------------------------------------*/

// GET ALL THE Warranties
router.post("/warranty/view/", async (req, res, next) => {
  try {
    const warrantyData = await superAdminController.getAllWarranty();
    if (warrantyData) {
      res.status(200).json({
        data: warrantyData,
      });
    }
  } catch (error) {
    next(error);
  }
});

//create
router.post("/warranty/create", async (req, res, next) => {
  try {
    const { type } = req.body;
    const data = await superAdminController.createWarranty(req.body);
    if (data.status == 1) {
      if (type == "warranty-list") {
        fs.readFile(
          "myjsonfile.json",
          "utf8",
          function readFileCallback(err, datafile) {
            if (err) {
            } else {
              obj = JSON.parse(datafile);
              // let num = parseInt(obj.PARTID.substring(3)) + 1;
              // let updatedStr =
              //   obj.PARTID.substring(0, 3) + num.toString().padStart(6, "0");
              // obj.PARTID = updatedStr;
              json = JSON.stringify(obj);
              fs.writeFile(
                "myjsonfile.json",
                json,
                "utf8",
                function readFileCallback(err, data) {
                  if (err) {
                  }
                }
              );
            }
          }
        );
      }
      res.status(200).json({
        message: "Successfully Added",
      });
    } else if (data.status == 2) {
      res.status(202).json({
        message: "Already Created",
      });
    } else {
      res.status(202).json({
        message: "Failed Please Tray again...",
      });
    }
  } catch (error) {
    next(error);
  }
});

//VIEW
router.post("/warranty/view/:type", async (req, res, next) => {
  try {
    const { type } = req.params;
    const data = await superAdminController.viewWarranty(type);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});

// EDIT Warranty
router.post("/warranty/edit", async (req, res, next) => {
  try {
    const warrantyData = await superAdminController.editWarranty(req.body);
    if (warrantyData.status == 1) {
      res.status(200).json({
        message: "Successfully Updated",
      });
    } else {
      res.status(202).json({
        message: "Updation Failed...",
      });
    }
  } catch (error) {
    next(error);
  }
});

router.get("/geteditWarranty/:name", async (req, res) => {
  try {
    let user = await superAdminController.geteditWarranty(req.params.name);
    if (user) {
      res.status(200).json({ data: user });
    }
  } catch (error) {
    next(error);
  }
});

router.post("/deleteWarranty/:name", async (req, res, next) => {
  try {
    // const { id, type, page } = req.body;
    const data = await superAdminController.deleteWarranty(req.params.name);
    if (data.status == true) {
      res.status(200).json({
        message: "Successfully Deleted",
      });
    } else {
      res.status(202).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});

// get one data only for Warranty
router.post("/warranty/one/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await superAdminController.viewOneWarranty(id);
    if (data.status == 1) {
      res.status(200).json({
        data: data.data,
      });
    } else {
      res.status(202).json({
        message: "No Data found",
      });
    }
  } catch (error) {
    next(error);
  }
});

/*-------------------------------------------MASTER FOR PART AND COLOR--------------------------------------------*/
//create
router.post("/partAndColor/create", async (req, res, next) => {
  try {
    const { type } = req.body;
    const data = await superAdminController.createPartOrColor(req.body);
    if (data.status == 1) {
      if (type == "part-list") {
        fs.readFile(
          "myjsonfile.json",
          "utf8",
          function readFileCallback(err, datafile) {
            if (err) {
            } else {
              obj = JSON.parse(datafile);
              let num = parseInt(obj.PARTID.substring(3)) + 1;
              let updatedStr =
                obj.PARTID.substring(0, 3) + num.toString().padStart(6, "0");
              obj.PARTID = updatedStr;
              json = JSON.stringify(obj);
              fs.writeFile(
                "myjsonfile.json",
                json,
                "utf8",
                function readFileCallback(err, data) {
                  if (err) {
                  }
                }
              );
            }
          }
        );
      }
      res.status(200).json({
        message: "Successfully Added",
      });
    } else if (data.status == 2) {
      res.status(202).json({
        message: "Already Created",
      });
    } else {
      res.status(202).json({
        message: "Failed Please Tray again...",
      });
    }
  } catch (error) {
    next(error);
  }
});
//VIEW
router.post("/partAndColor/view/:type", async (req, res, next) => {
  try {
    const { type } = req.params;
    const data = await superAdminController.viewColorOrPart(type);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});

/*-------------------------------------------MASTER FOR STORAGE--------------------------------------------*/
//create
router.post("/storage/create", async (req, res, next) => {
  try {
    const { type } = req.body;
    const data = await superAdminController.createStorage(req.body);
    if (data.status == 1) {
      res.status(200).json({
        message: "Successfully Added",
      });
    } else if (data.status == 2) {
      res.status(202).json({
        message: "Already Created",
      });
    } else {
      res.status(202).json({
        message: "Failed Please Tray again...",
      });
    }
  } catch (error) {
    next(error);
  }
});
//VIEW
router.post("/storage/view", async (req, res, next) => {
  try {
    const { type } = req.params;
    const data = await superAdminController.viewStorage(type);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
// EDIT STORAGE
router.post("/storage/edit", async (req, res, next) => {
  try {
    const data = await superAdminController.editStorage(req.body);
    if (data.status == 1) {
      res.status(200).json({
        message: "Successfully Updated",
      });
    } else {
      res.status(202).json({
        message: "Updation Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
//delete storage
router.post("/storage/delete/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    let data = await superAdminController.deleteStorage(id);

    if (data.status == true) {
      res.status(200).json({
        message: "Successfully Deleted",
      });
    } else {
      res.status(202).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});

/*-------------------------------------------MASTER FOR RAM--------------------------------------------*/
//create
router.post("/ram/create", async (req, res, next) => {
  try {
    const { type } = req.body;
    const data = await superAdminController.createRam(req.body);
    if (data.status == 1) {
      res.status(200).json({
        message: "Successfully Added",
      });
    } else if (data.status == 2) {
      res.status(202).json({
        message: "Already Created",
      });
    } else {
      res.status(202).json({
        message: "Failed Please Tray again...",
      });
    }
  } catch (error) {
    next(error);
  }
});
//VIEW
router.post("/ram/view/:type", async (req, res, next) => {
  try {
    const { type } = req.params;
    const data = await superAdminController.viewRam(type);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
// TAKE ONE RAM DATA FOR EDIT AND CHECK
router.post("/ram/oneData/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await superAdminController.getOneRamDataForEdit(id);
    if (data.status == 1) {
      res.status(200).json({
        data: data.ramData,
      });
    } else {
      res.status(202).json({
        message: "Data not found",
      });
    }
  } catch (error) {
    next(error);
  }
});
// EDIT STORAGE
router.post("/ram/edit", async (req, res, next) => {
  try {
    const data = await superAdminController.editRam(req.body);
    if (data.status == 1) {
      res.status(200).json({
        message: "Successfully Updated",
      });
    } else {
      res.status(202).json({
        message: "Updation Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
//delete storage
router.post("/ram/delete/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    let data = await superAdminController.deleteRam(id);

    if (data.status == true) {
      res.status(200).json({
        message: "Successfully Deleted",
      });
    } else {
      res.status(202).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
// BULK VALIDATON FOR PART
router.post("/bulkvalidationForPart", async (req, res, next) => {
  try {
    const data = await superAdminController.bulkValidationForPartCheck(
      req.body
    );
    if (data.status == true) {
      res.status(200).json({
        dupId: data.dup,
        message: "Successfully Validated",
      });
    } else {
      res.status(202).json({
        data: data.err,
        dupId: data.dup,
        message: "Please Check Errors",
      });
    }
  } catch (error) {
    next(error);
  }
});
// BULK add  PART
router.post("/bulkAddPart", async (req, res, next) => {
  try {
    const data = await superAdminController.bulkAddPart(req.body);
    if (data.status == true) {
      fs.readFile(
        "myjsonfile.json",
        "utf8",
        function readFileCallback(err, datafile) {
          if (err) {
          } else {
            obj = JSON.parse(datafile);
            let num = parseInt(obj.PARTID.substring(3)) + req.body.length;
            let updatedStr =
              obj.PARTID.substring(0, 3) + num.toString().padStart(6, "0");
            obj.PARTID = updatedStr;
            json = JSON.stringify(obj);
            fs.writeFile(
              "myjsonfile.json",
              json,
              "utf8",
              function readFileCallback(err, data) {
                if (err) {
                }
              }
            );
          }
        }
      );
      res.status(200).json({
        message: "Successfully Added",
        addedCount: req.body.length,
      });
    } else {
      res.status(202).json({
        message: "Failed Please tray again....",
      });
    }
  } catch (error) {
    next(error);
  }
});
// GET ALPEHBATICALLY SORT MUIC
router.post("/muic/view", async (req, res, next) => {
  try {
    const data = await superAdminController.getMuic();

    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
// PART ID GEN
router.post("/partList/idGen", async (req, res, next) => {
  try {
    let obj;
    fs.readFile(
      "myjsonfile.json",
      "utf8",
      async function readFileCallback(err, data) {
        if (err) {
        } else {
          obj = JSON.parse(data);
          res.status(200).json({
            data: obj.PARTID,
            venId: obj.VENDORID,
          });
        }
      }
    );
  } catch (error) {
    next(error);
  }
});
router.post("/muic/listColor/:muic", async (req, res, next) => {
  try {
    const { muic } = req.params;
    const data = await superAdminController.getColorAccordingMuic(muic);
    if (data) {
      res.status(200).json({
        data: data,
      });
    } else {
      res.status(202).json({
        message: "No data found",
      });
    }
  } catch (error) {
    next(error);
  }
});
//GET PRODUCT AND ASSOSIATED PART
router.post("/muic/getParts/:muic", async (req, res, next) => {
  try {
    const { muic } = req.params;
    const data = await superAdminController.muicGetParts(muic);
    if (data.status == true) {
      res.status(200).json({
        data: data.data,
      });
    } else {
      res.status(202).json({
        message: "No data found",
        data: data.data,
      });
    }
  } catch (error) {
    next(error);
  }
});
// GET PART LIST BASED ON THE MUIC AND COLOR
router.post("/partlist/muic", async (req, res, next) => {
  try {
    const { muic, color } = req.body;
    const data = await superAdminController.partListMuicColor(muic, color);
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
// get one data only for edit or delete
router.post("/partAndColor/oneData/:id/:type", async (req, res, next) => {
  try {
    const { id, type } = req.params;
    const data = await superAdminController.viewOneData(id, type);
    if (data.status == 1) {
      res.status(200).json({
        data: data.masterData,
      });
    } else if (data.status == 3 && type == "part-list") {
      res.status(202).json({
        message: "This Part Already used for process",
      });
    } else if (data.status == 3) {
      res.status(202).json({
        message: "This Color Already used for process",
      });
    } else {
      res.status(202).json({
        message: "No Data found",
      });
    }
  } catch (error) {
    next(error);
  }
});
// GET ONE PART
router.post("/partList/oneData/:id/:type", async (req, res, next) => {
  try {
    const { id, type } = req.params;
    const data = await superAdminController.onePartDatWithMuicAssosiation(
      id,
      type
    );
    if (data.status == 1) {
      res.status(200).json({
        data: data.masterData,
      });
    } else {
      res.status(202).json({
        message: "No Data found",
      });
    }
  } catch (error) {
    next(error);
  }
});
// EDIT PART or color
router.post("/partAndColor/edit", async (req, res, next) => {
  try {
    const data = await superAdminController.editPartOrColor(req.body);
    if (data.status == 1) {
      res.status(200).json({
        message: "Successfully Updated",
      });
    } else {
      res.status(202).json({
        message: "Updation Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});

// get one data only for storage
router.post("/storage/oneData/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await superAdminController.getStorageDataForEdit(id);
    if (data.status == 1) {
      res.status(200).json({
        data: data.storageData,
      });
    } else {
      res.status(202).json({
        message: "Data not found",
      });
    }
  } catch (error) {
    next(error);
  }
});

// GET ONE PART
// router.post("/partList/oneData/:id/:type", async (req, res, next) => {
//   try {
//     const { id, type } = req.params;
//     const data = await superAdminController.onePartDatWithMuicAssosiation(
//       id,
//       type
//     );
//     if (data.status == 1) {
//       res.status(200).json({
//         data: data.masterData,
//       });
//     } else {
//       res.status(202).json({
//         message: "No Data found",
//       });
//     }
//   } catch (error) {
//     next(error);
//   }
// });

// MANAGE STOCK
router.post("/partlist/manageStock/bulkValidation", async (req, res, next) => {
  try {
    const data = await superAdminController.partListManageBulkValidation(
      req.body
    );

    if (data.status == true) {
      res.status(200).json({
        message: "Successfully Validated",
      });
    } else {
      res.status(202).json({
        data: data.err,
        message: "Please Check Errors",
      });
    }
  } catch (error) {
    next(error);
  }
});

// UPDATE STOCK
router.post("/partlist/manageStock/update", async (req, res, next) => {
  try {
    const data = await superAdminController.partlistManageStockUpdate(req.body);
    if (data.status == true) {
      res.status(200).json({
        message: "Successfully Updated",
        count: data.count,
      });
    } else {
      res.status(202).json({
        message: "Updation failed",
      });
    }
  } catch (error) {
    next(error);
  }
});

// EDIT PART or color
router.post("/partAndColor/delete", async (req, res, next) => {
  try {
    const { id, type, page } = req.body;
    const data = await superAdminController.deletePartOrColor(id, type, page);
    if (data.status == 1) {
      res.status(200).json({
        message: "Successfully Deleted",
      });
    } else {
      res.status(202).json({
        message: "Deletion Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
// TO UPDATE ELASTICSEARCH USING BUTTON CLICK
router.post("/update/elasticSearch", async (req, res, next) => {
  try {
    const data = await superAdminController.updateElasticSearch();
    if (data.status == 1) {
      res.status(200).json({
        message: "Successfully Updated",
      });
    } else {
      res.status(202).json({
        message: "Updation  Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
/*--------------------------MUIC ASSOSIATION------------------------------------*/
// BULK VALIDATION FOR MUIC
router.post("/muicAssociation/bulkValidation", async (req, res, next) => {
  try {
    const bulkValidation =
      await superAdminController.muicAssositaionBulkValidation(req.body);
    if (bulkValidation.status == true) {
      res.status(200).json({
        message: "Successfully Validated",
        data: bulkValidation.arr,
        validateObj: bulkValidation.validateObj,
      });
    } else {
      res.status(202).json({
        data: bulkValidation.arr,
        validateObj: bulkValidation.validateObj,
        message: "Please Check Errors",
      });
    }
  } catch (error) {
    next(error);
  }
});
// MUIC WITH PART ASSOSIATION
router.post("/muicPage/addPartAssosiation", async (req, res, next) => {
  try {
    const bulkValidation =
      await superAdminController.muicPageAddPartAssosiation(req.body);

    if (bulkValidation.status == true) {
      res.status(200).json({
        message: "Successfully Validated",
        data: bulkValidation.arr,
        validateObj: bulkValidation.validateObj,
      });
    } else {
      res.status(202).json({
        data: bulkValidation.arr,
        validateObj: bulkValidation.validateObj,
        message: "Please Check Errors",
      });
    }
  } catch (error) {
    next(error);
  }
});
// ADD PART IN MUIC PAGE
router.post("/muicPage/partAdd", async (req, res, next) => {
  try {
    const bulkValidation = await superAdminController.muicPageAddPart(req.body);
    if (bulkValidation.status == true) {
      res.status(200).json({
        message: "Successfully Added",
      });
    } else {
      res.status(202).json({
        message: "Failed please try again...",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* ----------------------------------------MUIC ASSOSIATION ADD ------------------------------------------*/
// MUIC ASSOSIATION
router.post("/muicAssociation/add", async (req, res, next) => {
  try {
    const data = await superAdminController.muicAssosiationAdd(req.body);
    if (data.status == true) {
      res.status(200).json({
        message: "Successfully Added",
      });
    } else {
      res.status(202).json({
        message: "Failed Please Try Again...",
      });
    }
  } catch (error) {
    next(error);
  }
});

// REMOVE MUIC FROM PART ASSOSITATION
router.post("/muicAssociation/remove", async (req, res, next) => {
  try {
    const data = await superAdminController.muicAssosiationRemove(req.body);
    if (data.status == true) {
      res.status(200).json({
        message: "Successfully Removed",
      });
    } else {
      res.status(202).json({
        message: "Failed Please Try Again...",
      });
    }
  } catch (error) {
    next(error);
  }
});
/*----------------------------------------------VENDOR MASTER ----------------------------------------------------*/
// GET ALL THE VENDORS
router.post("/vendorMaster/view", async (req, res, next) => {
  try {
    const vendorData = await superAdminController.getAllVendor();
    if (vendorData) {
      res.status(200).json({
        data: vendorData,
      });
    }
  } catch (error) {
    next(error);
  }
});

// CREATE VENDOR
router.post("/vendorMaster/create", async (req, res, next) => {
  try {
    const vendorData = await superAdminController.createVendor(req.body);
    if (vendorData.status == 1) {
      fs.readFile(
        "myjsonfile.json",
        "utf8",
        function readFileCallback(err, datafile) {
          if (err) {
          } else {
            obj = JSON.parse(datafile);
            let num = parseInt(obj.VENDORID.substring(2)) + 1;
            let updatedStr =
              obj.VENDORID.substring(0, 2) + num.toString().padStart(6, "0");
            obj.VENDORID = updatedStr;
            json = JSON.stringify(obj);
            fs.writeFile(
              "myjsonfile.json",
              json,
              "utf8",
              function readFileCallback(err, data) {
                if (err) {
                }
              }
            );
          }
        }
      );

      res.status(200).json({
        message: "Successfully Created",
      });
    } else if (vendorData.status == 2) {
      res.status(202).json({
        message: "Already Created",
      });
    } else {
      res.status(202).json({
        message: "Creation Failed...",
      });
    }
  } catch (error) {
    next(error);
  }
});

// EDIT VENDOR
router.post("/vendorMaster/edit", async (req, res, next) => {
  try {
    const vendorData = await superAdminController.editVendor(req.body);
    if (vendorData.status == 1) {
      res.status(200).json({
        message: "Successfully Updated",
      });
    } else {
      res.status(202).json({
        message: "Updation Failed...",
      });
    }
  } catch (error) {
    next(error);
  }
});

// VENDOR STATUS CHANGE
router.post("/vendorMaster/statusChange", async (req, res, next) => {
  try {
    const { type } = req.body;
    const vendorData = await superAdminController.vendorStatusChange(req.body);
    if (vendorData.status == 1) {
      res.status(200).json({
        message: `Successfully ${type}`,
      });
    } else {
      res.status(202).json({
        message: "Updation Failed...",
      });
    }
  } catch (error) {
    next(error);
  }
});

// GET ONE VENDOR
router.post("/vendorMaster/one/:vendorId", async (req, res, next) => {
  try {
    const { vendorId } = req.params;
    const vendorData = await superAdminController.getOneVendor(vendorId);
    if (vendorData.status == 1) {
      res.status(200).json({
        data: vendorData.data,
      });
    } else {
      res.status(200).json({
        message: "No data found",
      });
    }
  } catch (error) {
    next(error);
  }
});

/*-------------------------------ADMIN FORCEFULL VALIDATION --------------------------------------*/
// CHECK CURRENT TRAY STATUS
router.post("/tray/checkStatus", async (req, res, next) => {
  try {
    const tray = await superAdminController.checkTrayStatus(req.body);
    if (tray.status == 1) {
      res.status(200).json({
        message: "Successfully Validated",
      });
    } else {
      res.status(202).json({
        message: "Failed please check selected tray",
      });
    }
  } catch (error) {
    next(error);
  }
});
/*---------------------------------TRAY REASSING FUNCTIONALITY -----------------------------------------*/
// ASSIGNED TRAY
router.post("/tray/assigned", async (req, res, next) => {
  try {
    const { trayType, sort_id } = req.body;
    const tray = await superAdminController.getAssignedTray(trayType, sort_id);
    if (tray) {
      res.status(200).json({
        data: tray,
      });
    }
  } catch (error) {
    next(error);
  }
});

// ASSIGNED TO MERGING TRAY
router.post("/tray/merge/assigned", async (req, res, next) => {
  try {
    // const { trayType, sort_id } = req.body;
    const tray = await superAdminController.getAssignedTrayForMerging();
    if (tray) {
      res.status(200).json({
        data: tray,
      });
    }
  } catch (error) {
    next(error);
  }
});
// REASSIGN FOR MERGING
/* MMT TRAY MERGE REQUEST SEND TO WAREHOUSE */
router.post("/tray/reassign/merge", async (req, res, next) => {
  try {
    const { sort_agent, fromTray, toTray } = req.body;
    let data = await superAdminController.reassignForMerge(
      sort_agent,
      fromTray,
      toTray
    );
    if (data.status === 1) {
      res.status(200).json({
        message: "Request Successfully Sent to Warehouse",
      });
    } else {
      res.status(202).json({
        message: "Failed Please tray again..",
      });
    }
  } catch (error) {
    next(error);
  }
});
//ASSIGNED BAG  to BOT
router.post("/bagAssigned/bot", async (req, res, next) => {
  try {
    // const { trayType, sort_id } = req.body;
    const bag = await superAdminController.bagAssignedToBot();
    if (bag) {
      res.status(200).json({
        data: bag,
      });
    }
  } catch (error) {
    next(error);
  }
});
//ASSIGNED TO SORTING BOT TO WHT
router.post("/tray/assignedToSorting/botToWh", async (req, res, next) => {
  try {
    // const { trayType, sort_id } = req.body;
    const tray = await superAdminController.getAssignedTrayForSortingBotToWht();
    if (tray) {
      res.status(200).json({
        data: tray,
      });
    }
  } catch (error) {
    next(error);
  }
});
/*------------------------------------------UNVERIFIED IMEI UPDATION------------------------------------------------------*/
router.post("/unverifiedImeiReport/:page/:size", async (req, res, next) => {
  try {
    let { page, size } = req.params;
    page++;
    const limit = parseInt(size);
    const skip = (page - 1) * size;
    let data = await superAdminController.getUnVerifiedImeiUpdationScreen(
      limit,
      skip
    );
    if (data) {
      res.status(200).json({
        data: data.unverifiedImei,
      });
    }
  } catch (error) {
    next(error);
  }
});
// DATE RANGE FILTER
router.post("/unverifiedImei/item/filter", async (req, res, next) => {
  try {
    let { fromDate, toDate, page, size, type } = req.body;
    page++;
    const limit = parseInt(size);
    const skip = (page - 1) * size;
    const filterData = await superAdminController.unVerifiedReportItemFilter(
      fromDate,
      toDate,
      limit,
      skip,
      type
    );
    if (filterData.monthWiseReport.length !== 0) {
      res.status(200).json({
        data: filterData.monthWiseReport,
        count: filterData.getCount,
      });
    } else {
      res.status(202).json({
        data: filterData.monthWiseReport,
        count: filterData.getCount,
      });
    }
  } catch (error) {
    next(error);
  }
});
// SEARCH DATA FROM UNVERIFIED IMEI SCREEN
router.post("/search/unverifiedImei", async (req, res, next) => {
  try {
    let { searchData, location, rowsPerPage, page } = req.body;
    page++;
    const limit = parseInt(rowsPerPage);
    const skip = (page - 1) * rowsPerPage;
    let data = await elasticsearch.searchUnverifiedImeiSupAdmin(
      searchData,
      limit,
      skip
    );
    if (data.searchResult.length !== 0) {
      res.status(200).json({
        data: data.searchResult,
        count: data.count,
      });
    } else {
      res.status(202).json({
        data: data.searchResult,
        count: data.count,
      });
    }
  } catch (error) {
    next(error);
  }
});
// UPDATE UNVERIFIED IMEI FROM SUPER ADMIN
router.post("/updateUnverifiedImei", async (req, res, next) => {
  try {
    // const { trayType, sort_id } = req.body;

    const data = await superAdminController.updateUnverifiedImei(req.body);
    if (data.status == 1) {
      res.status(200).json({
        message: "Successfully verified and updated",
      });
    } else if (data.status == 2) {
      res.status(202).json({
        message: "Unverified IMEI",
      });
    } else {
      res.status(202).json({
        message: "Updation Failed please try again",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* REMOVE DUPLICATE ENTRY THIS API FOR GLOBELY */
router.post("/globeDuplicateRemove", async (req, res, next) => {
  try {
    const { trayId, id, arrayType } = req.body;
    const data = await superAdminController.globeRemoveDuplicate(
      trayId,
      id,
      arrayType
    );
    if (data.status == 1) {
      res.status(200).json({
        message: "Successfully Removed",
      });
    } else {
      res.status(202).json({
        message: "Updation Failed please try again",
      });
    }
  } catch (error) {
    next(error);
  }
});
/*-------------------------------------------SUB MUIC-------------------------------------------------------------*/
router.post("/subMuic/view", async (req, res, next) => {
  try {
    const subMuic = await superAdminController.getSubMuic();
    if (subMuic) {
      res.status(200).json({
        data: subMuic,
      });
    }
  } catch (error) {
    next(error);
  }
});
/*--------------------------------------------BQC SYNC ----------------------------------------------------------------------*/
router.post("/bqcSynAction/:type", async (req, res, next) => {
  try {
    const { type } = req.params;
    if (type == "XML") {
      let update = BqcSynAction.xmlFileRead();
      res.status(200).json({
        message:
          "Successfully Update the XML File please do Windows task scheduler",
      });
    } else {
      let update = BqcSynAction.blancooFileUpload();
      res.status(200).json({
        message: "Successfully Updated please check your mail!",
      });
    }
  } catch (error) {
    next(error);
  }
});
/*----------------------------------------------REMOVE DUPLICATE UNITS FROM TRAY ---------------------------------------------*/
router.post("/getTrayForRemoveDuplicate/:trayId", async (req, res, next) => {
  try {
    const { trayId } = req.params;
    const tray = await superAdminController.getTrayForRemoveDuplicateUnits(
      trayId
    );
    if (tray.status == 1) {
      let checkDup = await duplicateEntryCheck.itemsArrayAndActualArray(
        tray.trayData
      );
      res.status(200).json({
        data: checkDup,
      });
    } else if (tray.status == 2) {
      res.status(202).json({
        message: "No items were found in this tray",
      });
    } else {
      res.status(202).json({
        message: "Invalid tray please enter valid tray",
      });
    }
  } catch (error) {
    next(error);
  }
});
/*---------------------------------------------------------------------------------------------------------------------------*/

/***********************************************EXTRA  SECTION*********************************************************** */

/****************************************************************************************************** */

/*-----------------------------EXTRA API AREA--------------------------------------*/
router.post("/user/addCpcType", async (req, res, next) => {
  try {
    let data = await superAdminController.addCpcType();
    if (data.status == 1) {
      res.status(200).json({
        message: "Successfully updated",
      });
    } else {
      res.status(202).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
// EXTRA 07032023 REAUDIT
router.post("/extra/reAuditTray", async (req, res, next) => {
  try {
    let data = await superAdminController.extraReAudit();
    if (data) {
      res.status(200).json({
        message: "Successfully Done",
      });
    } else {
      res.status(202).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
router.post("/tray/addGrade", async (req, res, next) => {
  try {
    let data = await superAdminController.addGrade();
    if (data) {
      res.status(200).json({
        message: "Successfully updated",
      });
    } else {
      res.status(202).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});

//CTX TRAY GRADE ADDIN
router.post("/update-ctx-trayId", async (req, res, next) => {
  try {
    let data = await superAdminController.updateCtxTrayId();
    if (data) {
      res.status(200).json({
        message: "Successfully updated",
      });
    } else {
      res.status(202).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});

/*---------------------------part of 2700 records------------------------------------------------*/
router.post("/extra/CtxRelease", async (req, res, next) => {
  try {
    let data = await superAdminController.extraCtxRelease();
    if (data) {
      res.status(200).json({
        message: "done",
      });
    } else {
      res.status(202).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});

router.post("/extra/categoryDelivery", async (req, res, next) => {
  try {
    let data = await superAdminController.categoryDelivery();
    if (data) {
      res.status(200).json({
        message: "done",
      });
    } else {
      res.status(202).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
router.post("/extra/bugFix", async (req, res, next) => {
  try {
    let data = await superAdminController.extraBugFixForLocation();
    if (data) {
      res.status(200).json({
        message: "done",
      });
    } else {
      res.status(202).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
// PART ID GEN FROM BACKEND ONLY
router.post("/extra/partid/add", async (req, res, next) => {
  try {
    let data = await superAdminController.extraPartidAdd();
    if (data) {
      res.status(200).json({
        message: "done",
      });
    } else {
      res.status(202).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});

// EXTRA FOR RDL-1- ISSUED TRAY
router.post("/extra/rdl-1/report", async (req, res, next) => {
  try {
    let data = await superAdminController.extraRdlOneReport();
    if (data) {
      res.status(200).json({
        message: "done",
      });
    } else {
      res.status(202).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
//TO FIX BQC DONE UNITS 0 UNITS SHOWING
router.post("/extra/bqcDone/bugFix", async (req, res, next) => {
  try {
    let data = await superAdminController.extraBqcDoneBugFix();
    if (data) {
      res.status(200).json({
        message: "done",
      });
    } else {
      res.status(202).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
//TO FIX BQC REPORT IS THERE BUT POP ISSUE
router.post("/extra/bqcDoneReportIssue/bugFix", async (req, res, next) => {
  try {
    let data = await superAdminController.bqcDoneReportIssueBugFix();
    if (data) {
      res.status(200).json({
        message: "done",
      });
    } else {
      res.status(202).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
//RDL 1 USERNAME ADD
router.post("/extra/changeWarehouseLocation/bugFix", async (req, res, next) => {
  try {
    let data = await superAdminController.changeWHLocation();
    if (data) {
      res.status(200).json({
        message: "done",
      });
    } else {
      res.status(202).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
//07052023  recomended by sumit sir by doc share
router.post("/extra/bugFixOfSpecTray", async (req, res, next) => {
  try {
    let data = await superAdminController.bugFixOfSpecOfTray();
    if (data) {
      res.status(200).json({
        message: "done",
      });
    } else {
      res.status(202).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
//ADD OTHER AUDITOR FEEDBACK
router.post("/extra/addOtherAudtiorFeedback", async (req, res, next) => {
  try {
    let data = await superAdminController.addOtherAudtitorFeedBack();
    if (data) {
      res.status(200).json({
        message: "done",
      });
    } else {
      res.status(202).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
//ADD bot tray id from backend
router.post("/extra/addBotTray", async (req, res, next) => {
  try {
    let data = await superAdminController.addBotTrayFromBackend();
    if (data) {
      res.status(200).json({
        message: "done",
      });
    } else {
      res.status(202).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
// ITEMS TRANSFER ONE TRAY TO ANOTHER
router.post("/extra/botTrayTransfer", async (req, res, next) => {
  try {
    let data = await superAdminController.botTrayTransfer();
    if (data.status == true) {
      res.status(200).json({
        message: "done",
      });
    } else {
      res.status(202).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
//05062023 SUMIT SIR REQUEST
router.post("/extra/rollBackTray", async (req, res, next) => {
  try {
    let data = await superAdminController.rollBackTrayToAuditStage();
    if (data) {
      res.status(200).json({
        message: "done",
      });
    } else {
      res.status(202).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
router.post("/extra/whClosedDateUpdation", async (req, res, next) => {
  try {
    let data = await superAdminController.extraWhClosedDateUpdation();
    if (data) {
      res.status(200).json({
        message: "done",
      });
    } else {
      res.status(202).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
router.post("/fixBaggingIssue", async (req, res, next) => {
  try {
    let data = await superAdminController.fixBaggingIssueWithAwbn();
    if (data) {
      res.status(200).json({
        message: "Successfully updated",
        data: data,
      });
    } else {
      res.status(202).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});

//WHT TRAY ISSUE
router.post("/whtTray/recorrect", async (req, res, next) => {
  try {
    let data = await superAdminController.whtTrayRecorrect();
    if (data) {
      res.status(200).json({
        message: "Successfully updated",
      });
    } else {
      res.status(202).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
// ALL DELIVERY ISSUE RESOLVE
router.post("/extra/allDeliveryIssue", async (req, res, next) => {
  try {
    let data = await superAdminController.resolveAllDeliveryIssue();
    if (data.status == true) {
      res.status(200).json({
        message: "done",
      });
    } else {
      res.status(202).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
// ORDER DATE ISSUE RESOLVE
router.post("/extra/orderDateIssue", async (req, res, next) => {
  try {
    let data = await superAdminController.resolveOrderDateIssue();
    if (data.status == true) {
      res.status(200).json({
        message: "done",
      });
    } else {
      res.status(202).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
// ADDING CATEGORY  V8.4
router.post("/extra/addCategory", async (req, res, next) => {
  try {
    let data = await superAdminController.addCategoryExtra();
    if (data.status == true) {
      res.status(200).json({
        message: "done",
      });
    } else {
      res.status(202).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});

// MANAGE OLD SPN0000 PARTID  V8.4
router.post("/extra/manageOldSpn", async (req, res, next) => {
  try {
    let data = await superAdminController.manageOldSpnData();
    if (data.status == true) {
      res.status(200).json({
        message: "done",
      });
    } else {
      res.status(202).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
router.post("/extra/updateWithNewSpn", async (req, res, next) => {
  try {
    let data = await superAdminController.exUpdateWithNewSpn();
    if (data.status == true) {
      res.status(200).json({
        message: "done",
      });
    } else {
      res.status(202).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
// RDL FLS TO RDL ONE
router.post("/extra/removeIssuedUser", async (req, res, next) => {
  try {
    let data = await superAdminController.manageRdlFlsToRdlOne();
    if (data.status == true) {
      res.status(200).json({
        message: "done",
      });
    } else {
      res.status(202).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
// FIND DUP MUIC
router.post("/extra/findMuic", async (req, res, next) => {
  try {
    let data = await superAdminController.findDupMuic();
    if (data) {
      res.status(200).json({
        message: "Success",
      });
    } else {
      res.status(202).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
// LET ADD INTO RACK
router.post("/extra/updateRack", async (req, res, next) => {
  try {
    let data = await superAdminController.extraUpdateRack();
    if (data.status == true) {
      res.status(200).json({
        message: "Successfully Update",
      });
    } else {
      res.status(202).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
// REMOVE PROCURMENT
router.post("/extra/removeProcurmentRequest", async (req, res, next) => {
  try {
    let data = await superAdminController.removeProcurmentRequest();
    if (data.status == true) {
      res.status(200).json({
        message: "Successfully Update",
      });
    } else {
      res.status(202).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
// REMOVE ITEM
router.post("/extra/updateStatusRDL", async (req, res, next) => {
  try {
    let data = await superAdminController.removeAddToMmt();
    if (data.status == true) {
      res.status(200).json({
        message: "Successfully Update",
      });
    } else {
      res.status(202).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
/*-------------------------------------TEMP REQUERMENT---------------------------------------*/
router.post("/extra/addFinelGrade", async (req, res, next) => {
  try {
    let data = await superAdminController.tempDataAddRequerment();
    if (data) {
      res.status(200).json({
        message: "Successfully Update",
      });
    } else {
      res.status(202).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
// ISSUE WITH PICKUP
router.post("/extra/tempReq", async (req, res, next) => {
  try {
    let data = await superAdminController.tempReq();
    if (data) {
      res.status(200).json({
        message: "Successfully Update",
      });
    } else {
      res.status(202).json({
        message: "Failed",
      });
    }
    // throw new Error('This is a test for sentry');
  } catch (error) {
    console.log(error);
    next(error);
  }
});
module.exports = router;
