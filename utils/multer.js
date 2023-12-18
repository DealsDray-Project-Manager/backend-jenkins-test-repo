const multer = require("multer");
const path = require("path");
// Multer config
module.exports = {
  userProfile: multer({
    storage: multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, "public/user-profile");
      },
      filename: function (req, file, cb) {
        cb(null, file.fieldname + Date.now() + path.extname(file.originalname));
      },
    }),
  }),

  documents: multer({
    storage: multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, "public/buyer-docs");
      },
      filename: function (req, file, cb) {
        cb(null, file.fieldname + Date.now() + path.extname(file.originalname));
      },
    }),
  }),
  productImage: multer({
    storage: multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, "public/product-image");
      },
      filename: function (req, file, cb) {
        cb(null, file.fieldname + Date.now() + path.extname(file.originalname));
      },
    }),
  }),
  botLevelPhotosOfUnits: multer({
    storage: multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, "public/item-image-bot-level");
      },
      filename: function (req, file, cb) {
        cb(null, file.fieldname + Date.now() + path.extname(file.originalname));
      },
    }),
  }),
};
