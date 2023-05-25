const nodemailer = require("nodemailer");
const sgTransport = require("nodemailer-sendgrid-transport");
const transporter = nodemailer.createTransport(
  sgTransport({
    auth: {
      api_key: process.env.SENDGRID_API_KEY,
    },
  })
);

module.exports = {
  blancoDataUpdateNotification: (recipient, subject, message) => {
    try {
      console.log("working");
      const mailOptions = {
        from: "no-reply2@dealsdray.com",
        to: "rafnaszzz8164@gmail.com",
        subject: "Prexo blancoo updation",
        text: "Hi",
      };

      transporter.sendMail(mailOptions, (error, info) => {
        console.log(info);
        if (error) {
          console.log("Error occurred:", error.message);
        } else {
          console.log("Email sent:", info.response);
        }
      });
    } catch (error) {
      console.log(error);
    }
  },
};
