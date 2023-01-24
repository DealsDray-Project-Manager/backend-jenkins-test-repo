// Express
const express = require("express");
//Router from express
const router = express.Router();
// Mobile user controller
const userController = require("../../../Controller/MobileRouter/userRouter");
// SendGrid for email sending
const sendGrid = require("../../../Utils/sendGrid");

// User Login using email
router.get("/otp/send", async (req, res, next) => {
  try {
    let email = req.query.email;
    //We want to find user is exist or not
    let user = await userController.findUser(email);
    // if user is exist then send otp to email address
    if (user) {
      let otpRes = await sendGrid.sendOtp(email);
      if (otpRes.status == true) {
        // Store the otp to Database
        let storeOtp = await userController.userOtpStore(user._id, otpRes.otp);
        if (storeOtp) {
          res
            .status(200)
            .json({
              status: 1,
              data: { message: "OTP send to your email", userId: user._id },
            });
        } else {
          res
            .status(501)
            .json({
              status: 0,
              data: { message: "Can't send otp please try again" },
            });
        }
      }
    } else {
      res.status(501).json({ status: 0, data: { message: "User not found" } });
    }
  } catch (error) {
    next(error);
  }
});
// Otp verfication
router.post("/otp/verfication", async (req, res, next) => {
  try {
    let otp = req.body.otp;
    let userId = req.body.userId;
    // find the otp is valid or not
    let checkResult = await userController.findOtp(userId, otp);
    if (checkResult) {
      res.status(200).json({ status: 1, data: "OTP verfication Successfull" });
    } else
      res.status(501).json({ status: 0, data: { message: "Invalid OTP" } });
  } catch (error) {
    next(error);
  }
});
// Get all information of user
router.get("/info", async (req, res, next) => {
  try {
    let userId = req.query.userId;
    // Find the user informations
    let userInfo = await userController.userInfo(userId);
    if (userInfo) {
      res.status(200).json({ status: 1, data: userInfo });
    } else {
      res.status(501).json({ status: 0, data: { message: "User not found" } });
    }
  } catch (error) {
    next(error);
  }
});
// Module exports
module.exports = router;
