// databaseMiddleware.js
const jwt = require("jsonwebtoken");
const { user } = require("../Model/userModel");
const { admin } = require("../Model/adminModel/admins");

const checkDatabaseMiddleware = async (req, res, next) => {
  // Database check logic here
  // Attach data to req object if needed
  try {
    let checkUser;
    if (
      (req.method === "POST" && req.path === "/login") ||
      (req.method === "POST" && req.path === "/check-user-status")
    ) {
      return next();
    } else {
      const { user_name, user_type } = jwt.verify(
        req.headers["x-access-token"],
        "prexoprojectv1jwttokenaccessf9933one"
      );
      if (user_type == "super-admin") {
        checkUser = await admin.findOne({ user_name: user_name });
        checkUser["status"] = "Active";
      } else {
        checkUser = await user.findOne({ user_name: user_name });
      }
      if (checkUser) {
        if (checkUser.status == "Active") {
          if (checkUser.jwt_token == req.headers["x-access-token"]) {
            // Assuming checkUser.last_password_changed is a Date object
            const lastPasswordChangedDate = new Date(
              checkUser.last_password_changed
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
              (checkUser.last_password_changed == undefined &&
                req.method === "POST" &&
                req.path != "/changePassword") ||
              (timeDifference >= oneWeekInMilliseconds &&
                req.method === "POST" &&
                req.path != "/changePassword")
            ) {
              res.status(202).json({
                status: 0,
                message: "You need to change your password.",
              });
            } else {
              return next();
            }
          } else {
            res.status(202).json({
              status: 1,
              message:
                "Another user has logged in with the same username and password. Please log in again.",
            });
          }
        } else {
          res.status(202).json({
            status: 1,
            message: "Admin deactivated",
          });
        }
      } else {
        res.status(202).json({
          message: "Invalid user",
        });
      }
    }
  } catch (error) {
    next(error);
  }
};

module.exports = checkDatabaseMiddleware;
