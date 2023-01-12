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

/**************************************************************************************************/

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
      const jwtToken = await jwt.jwtSign(loginData.data);
      res.status(200).json({
        status: 1,
        data: {
          message: "Login Success",
          jwt: jwtToken,
          user_type: loginData?.data?.user_type,
          data: loginData.data,
        },
      });
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
router.post("/check-user-status/:username", async (req, res, next) => {
  try {
    const { username } = req.params;
    let data = await superAdminController.checkUserStatus(username);
    if (data) {
      res.status(200).json({
        message: "Active user",
      });
    } else {
      res.status(202).json({
        message: "Admin deactivated",
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

/*----------------------------CPC---------------------------------------*/
router.get("/getCpc/", async (req, res) => {
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
    const { name } = req.body;
    let warehouse = await superAdminController.getWarehouse(name);
    console.log(warehouse);
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
    let data = await superAdminController.addLocation(req.body);
    if (data.status == true) {
      res.status(200).json({
        message: "Successfully Added",
      });
    } else {
      res.status(202).json({
        message: "Location Already Exists",
      });
    }
  } catch (error) {
    next(error);
  }
});

/*-----------------------------INFRA--------------------------------------*/
router.get("/getInfra/:infraId", async (req, res, next) => {
  try {
    let data = await superAdminController.getInfra(req.params.infraId);
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
router.post("/deleteInfra/:infraId", async (req, res, next) => {
  try {
    let data = await superAdminController.deleteInfra(req.params.infraId);
    if (data) {
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
          } else if (type == "LUT") {
            res.status(200).json({
              data: obj.LUT,
            });
          } else if (type == "DUT") {
            res.status(200).json({
              data: obj.DUT,
            });
          } else if (type == "RBQ") {
            res.status(200).json({
              data: obj.RBQ,
            });
          } else if (type == "CFT") {
            res.status(200).json({
              data: obj.CFT,
            });
          } else if (type == "STA") {
            res.status(200).json({
              data: obj.STA,
            });
          } else if (type == "STB") {
            res.status(200).json({
              data: obj.STB,
            });
          } else if (type == "STC") {
            res.status(200).json({
              data: obj.STC,
            });
          } else if (type == "STD") {
            res.status(200).json({
              data: obj.STD,
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

/*-----------------------------GET HIGHEST MASTER ID FOR BAG--------------------------------------*/
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

/*-----------------------------BULK VALIDATION TRAY--------------------------------------*/
router.post("/bulkValidationTray", async (req, res, next) => {
  try {
    let data = await superAdminController.bulkValidationTray(req.body);
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

/*-----------------------------CREATE BULK TRAY--------------------------------------*/
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
            obj = JSON.parse(datafile);
            obj.BOT = req.body.allCount.BOT;
            obj.MMT = req.body.allCount.MMT;
            obj.WHT = req.body.allCount.WHT;
            obj.PMT = req.body.allCount.PMT;
            obj.DUT = req.body.allCount.DUT;
            obj.RBQ = req.body.allCount.RBQ;
            obj.CFT = req.body.allCount.CFT;
            obj.STA = req.body.allCount.STA;
            obj.STB = req.body.allCount.STB;
            obj.STC = req.body.allCount.STC;
            obj.STD = req.body.allCount.STD;

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
              (data) => data.cpc == "Gurgaon_122016"
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
    const { type_taxanomy, cpc } = req.body;
    console.log(req.body);
    console.log(type_taxanomy);
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
              console.log(obj);
              if (type_taxanomy == "BOT") {
                obj.BOT = obj.BOT + 1;
              } else if (type_taxanomy == "PMT") {
                obj.PMT = obj.PMT + 1;
              } else if (type_taxanomy == "MMT") {
                obj.MMT = obj.MMT + 1;
              } else if (type_taxanomy == "WHT") {
                obj.WHT = obj.WHT + 1;
              } else if (type_taxanomy == "LUT") {
                obj.LUT = obj.LUT + 1;
              } else if (type_taxanomy == "DUT") {
                obj.DUT = obj.DUT + 1;
              } else if (type_taxanomy == "RBQ") {
                obj.RBQ = obj.RBQ + 1;
              } else if (type_taxanomy == "CFT") {
                obj.CFT = obj.CFT + 1;
              } else if (type_taxanomy == "STA") {
                obj.STA = obj.STA + 1;
              } else if (type_taxanomy == "STB") {
                obj.STB = obj.STB + 1;
              } else if (type_taxanomy == "STC") {
                obj.STC = obj.STC + 1;
              } else if (type_taxanomy == "STD") {
                obj.STD = obj.STD + 1;
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
router.get("/getOneMaster/:masterId", async (req, res, ne) => {
  try {
    let data = await superAdminController.getOneMaster(req.params.masterId);
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
    if (!page) {
      page = 1;
    }
    if (!size) {
      size = 10;
    }
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
    const { ischeck } = req.body;
    let data = await superAdminController.readyForCharging(ischeck);
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
    console.log(data);
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

/*-----------------------------EXTRA ONE--------------------------------------*/
router.post("/update-cpc", async (req, res, next) => {
  try {
    let data = await superAdminController.updateCPCExtra();
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
router.post("/part-records-import",async(req,res,next)=>{
  try {
    let data=await superAdminController.getUpdateRecord()
    if(data){
      res.status(200).json({
        message:"done"
      })
    }
    else{
      res.status(202).json({
        message:"Failed"
      })
    }
  } catch (error) {
    next(error)
  }
})


module.exports = router;
