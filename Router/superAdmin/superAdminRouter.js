/* Express */
const express = require("express");
const router = express.Router();
// user controller
const superAdminController = require("../../Controller/superAdmin/superAdminController");
// Multer
const upload = require("../../utils/multer");
// jwt token
const jwt = require("../../utils/jwt_token");
/* FS */
var fs = require("fs");
/*******************************************************************************************************************/
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
/* Login api */
router.post("/login", async (req, res, next) => {
  try {
    let loginData = await superAdminController.doLogin(req.body);
    if (loginData.status == 1) {
      const jwtToken = await jwt.jwtSign(loginData.data);
      res.status(200).json({
        status: 1,
        data: {
          message: "Login Success",
          jwt: jwtToken,
          user_type: loginData?.data?.user_type,
        },
      });
    } else if (loginData.status == 2) {
      res.status(401).json({ data: { message: "Wrong username or password" } });
    } else if (loginData.status == 3) {
      res.status(401).json({ data: { message: "admin deactivated" } });
    }
  } catch (error) {
    next(error);
  }
});
/*CHECK ADMIN DEACTIVATED OR NOT */
router.post("/check-user-status/:username", async (req, res, next) => {
  try {
    const { username } = req.params;
    let data = await superAdminController.checkUserStatus(username);
    if (data) {
      res.status(200).json({
        message: "Active user",
      });
    } else {
      res.status(403).json({
        message: "Admin deactivated",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* Get users history */
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
/* Change password */
router.post("/changePassword", async (req, res, next) => {
  try {
    let data = await superAdminController.changePassword(req.body);
    if (data) {
      res.status(200).json({
        message: "Successfully Changed",
      });
    } else {
      res.status(403).json({
        message: "Please Enter Correct Old Password",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* Get all cpc */
router.get("/getCpc/", async (req, res) => {
  let data = await superAdminController.getCpc();
  if (data) {
    res.status(200).json({ status: 1, data: { data } });
  } else {
    response.status(501).json({ status: 0, data: { message: "worng" } });
  }
});
/* Get CPC Data */
router.post("/getWarehouseByLocation", async (req, res) => {
  try {
    const { name } = req.body;
    let warehouse = await superAdminController.getWarehouse(name);
    if (warehouse) {
      res.status(200).json({ data: { warehouse } });
    }
  } catch (error) {}
});
/* get designation */
router.get("/designation", async (req, res) => {
  try {
    let designation = await superAdminController.getDesignation();
    if (designation) {
      res.status(200).json({ data: { designation } });
    }
  } catch (error) {}
});
/* Get all users */
router.get("/getUsers", async (req, res) => {
  try {
    let user = await superAdminController.getUsers();
    // console.log(user);
    if (user) {
      res.status(200).json({ data: { user } });
    }
  } catch (error) {}
});
/* Delete User */
router.put("/userDeactivate/:userID", async (req, res) => {
  try {
    let response = await superAdminController.userDeactivate(req.params.userID);
    if (response) {
      res.status(200).json({ data: { message: "Deactivate" } });
    }
  } catch (error) {}
});
router.put("/userActivate/:userId", async (req, res) => {
  try {
    let response = await superAdminController.userActivate(req.params.userId);
    if (response) {
      res.status(200).json({ data: { message: "Activate" } });
    }
  } catch (error) {}
});
router.get("/getEditData/:userId", async (req, res) => {
  try {
    let user = await superAdminController.getEditData(req.params.userId);
    if (user) {
      res.status(200).json({ data: user });
    }
  } catch (error) {}
});
router.post(
  "/edituserDetails",
  upload.userProfile.single("profile"),
  async (req, res) => {
    try {
      let data = await superAdminController.editUserdata(
        req.body,
        req.file ? req.file.filename : undefined
      );
      if (data) {
        res.status(200).json({ data: data });
      }
    } catch (error) {}
  }
);
router.get("/masters", async (req, res) => {
  let data = await superAdminController.getMasters();
  res.status(200).json({ data: data });
});
router.get("/infra", async (req, res) => {
  let data = await superAdminController.getInfra();
  res.status(200).json({ data: data });
});
/*********************************************DASHBOARD***********************************************************************************/
/* Get Dashboard count */
router.get("/dashboard", async (req, res, next) => {
  try {
    let data = await superAdminController.dashboard();
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
/********************************************ORDERS***************************************************************************************/
/*Import Order*/
router.post("/ordersImport", async (req, res, next) => {
  try {
    let data = await superAdminController.importOrders(req.body);
    if (data) {
      res.status(200).json({
        message: "Successfully Added",
      });
    } else {
      res.status(404).json({
        message: "Orders Import Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
/*Get Orders*/
router.post("/getOrders", async (req, res, next) => {
  try {
    let data = await superAdminController.getOrders();
    if (data) {
      res.status(200).json({
        data: data,
        message: "Success",
      });
    } else {
      res.status(404).json({
        message: "Orders Get Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
/*************************************************************************************************************************************************** */
/* Create Brands */
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
            obj = JSON.parse(datafile); //now it an object
            obj.brandcount = obj.brandcount + length; //add some data
            json = JSON.stringify(obj); //convert it back to json
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
        message: "Successfullly Created",
      });
    } else {
      res.status(400).json({
        message: "Brand Already Exists",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* Bulk Brands Validation */
router.post("/bulkValidationBrands", async (req, res, next) => {
  try {
    let data = await superAdminController.bulkValidationBrands(req.body);
    if (data.status == true) {
      res.status(200).json({
        message: "Successfully Validated",
      });
    } else {
      res.status(400).json({
        data: data.err,
        message: "Please Check Errors",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* Get Highest brand Id */
router.post("/getBrandIdHighest", async (req, res, next) => {
  try {
    let obj;
    fs.readFile(
      "myjsonfile.json",
      "utf8",
      function readFileCallback(err, data) {
        if (err) {
        } else {
          obj = JSON.parse(data); //now it an object
          res.status(200).json({
            data: obj.brandcount,
          });
        }
      }
    );
  } catch (error) {
    next(error);
  }
});
/* Get All Brands */
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
/* GET BRAND ALPHABETICAL ORDER */
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
/* get One data */
router.get("/getBrandOne/:brandId", async (req, res, next) => {
  try {
    let data = await superAdminController.getOneBrand(req.params.brandId);
    if (data.status == 1) {
      res.status(200).json({
        data: data.data,
        message: "Success",
      });
    } else if (data.status == 0) {
      res.status(400).json({
        message: "This Brand You Can't Edit",
      });
    } else {
      res.status(400).json({
        message: "No data found",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* Edit Brands */
router.put("/editBrand", async (req, res, next) => {
  try {
    let data = await superAdminController.editBrands(req.body);
    if (data.status == true) {
      res.status(200).json({
        message: "Successfully Edited",
      });
    } else {
      res.status(400).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* Delete brands */
router.delete("/deleteBrand/:brandId", async (req, res, next) => {
  try {
    let data = await superAdminController.deleteBrands(req.params.brandId);
    if (data.status == true) {
      res.status(200).json({
        message: "Successfully Deleted",
      });
    } else {
      res.status(400).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
/***********************************************************************************************************************/
/* Product Bulk Validation */
router.post("/bulkValidationProduct", async (req, res, next) => {
  try {
    let data = await superAdminController.validationBulkProduct(req.body);
    if (data.status == true) {
      res.status(200).json({
        message: "Successfully Validated",
      });
    } else {
      res.status(400).json({
        data: data.err,
        message: "Please Check Errors",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* Create Products */
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
        res.status(400).json({
          message: "Product Exists",
        });
      }
    } catch (error) {
      next(error);
    }
  }
);
/* Get Products */
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
/* Get Image Edit */
router.post("/getImageEditProdt/:id", async (req, res, next) => {
  try {
    let data = await superAdminController.getImageEditData(req.params.id);
    if (data) {
      res.status(200).json({
        message: "Success",
        data: data,
      });
    } else {
      res.status(403).json({
        message: "No Data Found",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* Update Product Image */
router.put(
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
        res.status(403).json({
          message: "Updation Failed",
        });
      }
    } catch (error) {
      next(error);
    }
  }
);
/* Get Edit Products */
router.get("/getEditProduct/:productId", async (req, res, next) => {
  try {
    let data = await superAdminController.getEditProduct(req.params.productId);
    if (data.status == 1) {
      res.status(200).json({
        data: data.data,
        message: "Success",
      });
    } else if (data.status == 3 || data.status == 2) {
      res.status(400).json({
        message: "You Can't Edit This Product",
      });
    } else {
      res.status(403).json({
        message: "No data found",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* Edit Product */
router.put("/editProduct", async (req, res, next) => {
  try {
    let data = await superAdminController.editproduct(req.body);
    if (data) {
      res.status(200).json({
        message: "Successfully Updated",
      });
    } else {
      res.status(400).json({
        message: "Product Edit Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* Delete Product */
router.delete("/deleteProduct/:productId", async (req, res, next) => {
  try {
    let data = await superAdminController.deleteProduct(req.params.productId);
    if (data) {
      res.status(200).json({
        message: "Successfully Deleted",
      });
    } else {
      res.status(400).json({
        message: "Product delete failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* GET PRODUCT BASED ON THE BRAND */
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
/****************************************************INFRA CRED***************************************************************************/
/* Add Location */
router.post("/addLocation", async (req, res, next) => {
  try {
    let data = await superAdminController.addLocation(req.body);
    if (data.status == true) {
      res.status(200).json({
        message: "Successfully Added",
      });
    } else {
      res.status(400).json({
        message: "Location Already Exists",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* Get one Infra based on the Id */
router.get("/getInfra/:infraId", async (req, res, next) => {
  try {
    let data = await superAdminController.getInfra(req.params.infraId);
    if (data) {
      res.status(200).json({
        data: data,
        message: "Success",
      });
    } else {
      res.status(400).json({
        message: "Data Not Found",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* Get Location */
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

/* Edit infra */
router.put("/editInfra", async (req, res, next) => {
  try {
    let data = await superAdminController.editInfra(req.body);
    if (data) {
      res.status(200).json({
        message: "Successfully Updated",
      });
    } else {
      res.status(400).json({
        message: "Updation Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* Delete Infra */
router.delete("/deleteInfra/:infraId", async (req, res, next) => {
  try {
    let data = await superAdminController.deleteInfra(req.params.infraId);
    if (data) {
      res.status(200).json({
        message: "Successfully Deleted",
      });
    } else {
      res.status(400).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
/************************************************************************************************************************************/
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
/*****************************************************MASTERs************************************************************************ */
/* Bulk Bag Validation */
router.post("/bulkValidationBag", async (req, res, next) => {
  try {
    let data = await superAdminController.bulkBagValidation(req.body);
    if (data.status == true) {
      res.status(200).json({
        message: "Successfully Validated",
      });
    } else {
      res.status(400).json({
        data: data.data,
        message: "Please Check Errors",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* GET TRAY ID BASED ON THE TYPE */
router.post("/trayIdGenrate/:type", async (req, res, next) => {
  try {
    const { type } = req.params;
    let obj;
    fs.readFile(
      "myjsonfile.json",
      "utf8",
      function readFileCallback(err, data) {
        if (err) {
        } else {
          obj = JSON.parse(data); //now it an object
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
          } else {
            res.status(200).json({
              data: obj,
            });
          }
        }
      }
    );
  } catch (error) {
    next(error);
  }
});
/* Get Highest Master Id */
router.post("/getMasterHighest/:prefix", async (req, res, next) => {
  try {
    if (req.params.prefix == "Gurgaon_122016") {
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
/* Bulk Validation for Tray */
router.post("/bulkValidationTray", async (req, res, next) => {
  try {
    let data = await superAdminController.bulkValidationTray(req.body);

    if (data.status == true) {
      res.status(200).json({
        message: "Successfully Validated",
      });
    } else {
      res.status(400).json({
        data: data.data,
        message: "Please Check Errors",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* Bulk tray create */
router.post("/createBulkTray", async (req, res, next) => {
  try {
    let data = await superAdminController.addbulkTray(req.body.item);
    if (data) {
      fs.readFile(
        "myjsonfile.json",
        "utf8",
        function readFileCallback(err, datafile) {
          if (err) {
          } else {
            obj = JSON.parse(datafile); //now it an object
            obj.BOT = req.body.allCount.BOT;
            obj.MMT = req.body.allCount.MMT;
            obj.WHT = req.body.allCount.WHT;
            obj.PMT = req.body.allCount.PMT; //add some data
            json = JSON.stringify(obj); //convert it back to json
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
/* Bulk Create */
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
            obj = JSON.parse(datafile); //now it an object
            let blr = req.body.filter(
              (data) => data.cpc == "Bangalore_560067"
            ).length;
            obj.bagBanglore = obj.bagBanglore + blr; //add some data
            let ggrn = req.body.filter(
              (data) => data.cpc == "Gurgaon_122016"
            ).length;
            obj.bagGurgaon = obj.bagGurgaon + ggrn; //add some data
            json = JSON.stringify(obj); //convert it back to json
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
/* Create Bag */
router.post("/createMasters", async (req, res, next) => {
  try {
    const { type_taxanomy, cpc } = req.body;

    let data = await superAdminController.createMasters(req.body);
    if (data) {
      if (req.body.prefix == "bag-master") {
        fs.readFile(
          "myjsonfile.json",
          "utf8",
          function readFileCallback(err, datafile) {
            if (err) {
            } else {
              obj = JSON.parse(datafile); //now it an object
              if (cpc == "Gurgaon_122016") {
                obj.bagGurgaon = obj.bagGurgaon + 1; //add some data
              } else if (cpc == "Bangalore_560067") {
                obj.bagBanglore = obj.bagBanglore + 1; //add some data
              }
              json = JSON.stringify(obj); //convert it back to json
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
      } else {
        fs.readFile(
          "myjsonfile.json",
          "utf8",
          function readFileCallback(err, datafile) {
            if (err) {
            } else {
              obj = JSON.parse(datafile); //now it an object
              if (type_taxanomy == "BOT") {
                obj.BOT = obj.BOT + 1; //add some data
              } else if (type_taxanomy == "PMT") {
                obj.PMT = obj.PMT + 1; //add some data
              } else if (type_taxanomy == "MMT") {
                obj.MMT = obj.MMT + 1; //add some data
              } else if (type_taxanomy == "WHT") {
                obj.WHT = obj.WHT + 1; //add some data
              }
              json = JSON.stringify(obj); //convert it back to json
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
      }
      res.status(200).json({
        message: "Successfully Created",
      });
    } else {
      res.status(400).json({
        message: "Creation Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* Get Master */
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
/* Get One Master */
router.get("/getOneMaster/:masterId", async (req, res, ne) => {
  try {
    let data = await superAdminController.getOneMaster(req.params.masterId);
    if (data) {
      res.status(200).json({
        data: data,
      });
    } else {
      res.status(400).json({
        message: "You Can't Edit This Bag",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* Edit Master */
router.put("/editMaster", async (req, res, next) => {
  try {
    let data = await superAdminController.editMaster(req.body);
    if (data.status) {
      res.status(200).json({
        message: "Successfully Updated",
      });
    } else {
      res.status(400).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
/* Delete Master */
router.delete("/deleteMaster/:masterId", async (req, res, next) => {
  try {
    let data = await superAdminController.delteMaster(req.params.masterId);
    if (data.status) {
      res.status(200).json({
        message: "Successfully Deleted",
      });
    } else {
      res.status(400).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
/**************************************ITEM TRACKING************************************************ */
/* Item tracking */
router.post("/itemTracking", async (req, res, next) => {
  try {
    let data = await superAdminController.itemTracking();
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
/* SEARCH TRACK ITEM DATA */
router.post("/search-admin-track-item", async (req, res, next) => {
  try {
    const { type, searchData, location } = req.body;
    let data = await superAdminController.searchAdminTrackItem(
      type,
      searchData,
      location
    );
    if (data) {
      res.status(200).json({
        data: data,
      });
    }
  } catch (error) {
    next(error);
  }
});
/***********************************************EXTRA QUREY SECTION*********************************************************** */
router.post("/update-cpc", async (req, res, next) => {
  try {
    let data = await superAdminController.updateCPCExtra();
    if (data) {
      res.status(200).json({
        message: "Successfully updated",
      });
    } else {
      res.status(403).json({
        message: "Failed",
      });
    }
  } catch (error) {
    next(error);
  }
});
module.exports = router;
