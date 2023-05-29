const nodemailer = require("nodemailer");

// Create a Nodemailer transporter using the Mailgun SMTP transport
const transporter = nodemailer.createTransport({
  host: "smtp.mailgun.org",
  port: 587,
  secure: false, // Set to true if you're using SSL/TLS
  auth: {
    user: "postmaster@sandbox5ae49c0eb8894140afc7c3c067d0411b.mailgun.org",
    pass: "f845c593205b616bd921cba8ffa2419b-07ec2ba2-7f66a554",
  },
});

module.exports = {
  blancoDataUpdateNotification: (recipient, subject, message) => {
    transporter.sendMail(
      {
        from: "muhammedrafnasvk@gmail.com",
        to: "rafnaszzz8164@gmail.com",
        subject: "Test Email",
        text: "This is a test email sent with Nodemailer and Mailgun!",
      },
      (err, info) => {
        if (err) {
          console.error("Error sending email:", err);
        } else {
          console.log("Email sent successfully!");
          console.log("Response:", info);
        }
      }
    );
  },
};
